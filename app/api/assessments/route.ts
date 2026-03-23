import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute, EMB_TEMPLATE, BENCHMARK_TEMPLATE, SCOPE_TEMPLATE, DRIVER_TEMPLATE, KRA_TEMPLATE, MATURITY_TEMPLATE } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const owned = await query(`SELECT a.*, u.name as owner_name FROM assessments a JOIN users u ON u.id=a.user_id WHERE a.user_id=$1 ORDER BY a.updated_at DESC`, [user.id]);
  const shared = await query(`SELECT a.*, u.name as owner_name FROM assessments a JOIN users u ON u.id=a.user_id JOIN assessment_collaborators ac ON ac.assessment_id=a.id WHERE ac.user_id=$1 AND a.user_id!=$1 ORDER BY a.updated_at DESC`, [user.id]);
  return NextResponse.json({ owned, shared });
}

export async function POST(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { team_name, industry, assessment_date, notes, action, assessment_id } = await req.json();

  if (action === 'duplicate' && assessment_id) {
    const orig = await queryOne<{id:number;team_name:string;industry:string;notes:string}>(`SELECT * FROM assessments WHERE id=$1`, [assessment_id]);
    if (!orig) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const newA = await queryOne<{id:number}>(`INSERT INTO assessments (user_id,team_name,industry,notes) VALUES ($1,$2,$3,$4) RETURNING id`, [user.id, orig.team_name + ' (Copy)', orig.industry, orig.notes]);
    if (!newA) return NextResponse.json({ error: 'Failed' }, { status: 500 });
    const nid = newA.id;
    await execute(`INSERT INTO assessment_emb (assessment_id,pivot_num,pivot_name,capability,l1_criteria,l2_criteria,l3_criteria,current_level,score_icon,evidence,gap_notes,sort_order) SELECT $1,pivot_num,pivot_name,capability,l1_criteria,l2_criteria,l3_criteria,current_level,score_icon,evidence,gap_notes,sort_order FROM assessment_emb WHERE assessment_id=$2`, [nid, assessment_id]);
    await execute(`INSERT INTO assessment_business_drivers (assessment_id,category,driver_name,description,is_mandatory,considerations,notes,sort_order) SELECT $1,category,driver_name,description,is_mandatory,considerations,notes,sort_order FROM assessment_business_drivers WHERE assessment_id=$2`, [nid, assessment_id]);
    await execute(`INSERT INTO assessment_benchmarks (assessment_id,pillar,kpi_name,unit,target_value,current_value,status,notes,sort_order,weight,definition,sub_category) SELECT $1,pillar,kpi_name,unit,target_value,current_value,status,notes,sort_order,weight,definition,sub_category FROM assessment_benchmarks WHERE assessment_id=$2`, [nid, assessment_id]);
    await execute(`INSERT INTO assessment_scope (assessment_id,pillar,activity,required_level,current_level,gap,notes,sort_order,l1_guidance,l2_guidance,l3_guidance) SELECT $1,pillar,activity,required_level,current_level,gap,notes,sort_order,l1_guidance,l2_guidance,l3_guidance FROM assessment_scope WHERE assessment_id=$2`, [nid, assessment_id]);
    await execute(`INSERT INTO assessment_kra (assessment_id,role_level,person_name,kra_name,description,target,current,status,notes,sort_order,pillar) SELECT $1,role_level,person_name,kra_name,description,target,current,status,notes,sort_order,pillar FROM assessment_kra WHERE assessment_id=$2`, [nid, assessment_id]);
    await execute(`INSERT INTO assessment_leadership (assessment_id,leader_name,leader_role,skill_name,is_mandatory,score,notes,sort_order,skill_category,detailed_skills) SELECT $1,leader_name,leader_role,skill_name,is_mandatory,score,notes,sort_order,skill_category,detailed_skills FROM assessment_leadership WHERE assessment_id=$2`, [nid, assessment_id]);
    await execute(`INSERT INTO assessment_maturity_levels (assessment_id,factor_name,maturity_level,ownership_level,skill_level,business_value,notes,sort_order) SELECT $1,factor_name,maturity_level,ownership_level,skill_level,business_value,notes,sort_order FROM assessment_maturity_levels WHERE assessment_id=$2`, [nid, assessment_id]);
    return NextResponse.json({ id: nid });
  }

  const a = await queryOne<{id:number}>(`INSERT INTO assessments (user_id,team_name,industry,assessment_date,notes) VALUES ($1,$2,$3,$4,$5) RETURNING id`, [user.id, team_name || 'My Team', industry || null, assessment_date || null, notes || null]);
  if (!a) return NextResponse.json({ error: 'Failed' }, { status: 500 });
  const aid = a.id;
  // Seed module templates
  for (const r of EMB_TEMPLATE) await execute(`INSERT INTO assessment_emb (assessment_id,pivot_num,pivot_name,capability,l1_criteria,l2_criteria,l3_criteria,sort_order) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, [aid,r.pivot_num,r.pivot_name,r.capability,r.l1_criteria,r.l2_criteria,r.l3_criteria,r.sort_order]);
  for (const r of DRIVER_TEMPLATE) await execute(`INSERT INTO assessment_business_drivers (assessment_id,category,driver_name,is_mandatory,considerations,sort_order) VALUES ($1,$2,$3,$4,$5,$6)`, [aid,r.category,r.driver_name,r.is_mandatory,r.considerations,r.sort_order]);
  for (const r of BENCHMARK_TEMPLATE) await execute(`INSERT INTO assessment_benchmarks (assessment_id,pillar,kpi_name,unit,target_value,sort_order,weight,definition,sub_category) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`, [aid,r.pillar,r.kpi_name,r.unit,r.target_value,r.sort_order,r.weight,r.definition,r.sub_category]);
  for (const r of SCOPE_TEMPLATE) await execute(`INSERT INTO assessment_scope (assessment_id,pillar,activity,required_level,sort_order,l1_guidance,l2_guidance,l3_guidance) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`, [aid,r.pillar,r.activity,r.required_level||1,r.sort_order,r.l1_guidance,r.l2_guidance,r.l3_guidance]);
  for (const r of KRA_TEMPLATE) await execute(`INSERT INTO assessment_kra (assessment_id,role_level,kra_name,pillar,sort_order) VALUES ($1,$2,$3,$4,$5)`, [aid,r.role_level,r.kra_name,r.pillar,r.sort_order]);
  for (const r of MATURITY_TEMPLATE) await execute(`INSERT INTO assessment_maturity_levels (assessment_id,factor_name,maturity_level,sort_order) VALUES ($1,$2,$3,$4)`, [aid,r.factor_name,r.maturity_level,r.sort_order]);
  return NextResponse.json({ id: aid });
}
