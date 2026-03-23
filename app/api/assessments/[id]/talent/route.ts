import { NextRequest, NextResponse } from 'next/server';
import { query, execute, TALENT_SKILLS_TEMPLATE } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

async function canAccess(req: NextRequest, id: string) {
  const user = await getSessionFromRequest(req);
  if (!user) return null;
  const rows = await query(`SELECT 1 FROM assessments a LEFT JOIN assessment_collaborators ac ON ac.assessment_id=a.id WHERE a.id=$1 AND (a.user_id=$2 OR ac.user_id=$2)`, [id, user.id]);
  return rows.length > 0 ? user : null;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await canAccess(req, params.id);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const engineers = await query(`SELECT * FROM talent_engineers WHERE assessment_id=$1 ORDER BY sort_order,id`, [params.id]);
  const skills = await query(`SELECT * FROM talent_skills ORDER BY sort_order,id`);
  // Attach skills to each engineer
  const result = (engineers as any[]).map(e => ({
    ...e,
    skills: (skills as any[]).filter(s => s.engineer_id === e.id),
  }));
  return NextResponse.json({ engineers: result });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await canAccess(req, params.id);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { engineer, skills: skillUpdates } = await req.json();
  if (engineer) {
    await execute(
      `UPDATE talent_engineers SET name=$1,employee_id=$2,team=$3,reports_to=$4,job_title=$5,level=$6,specialisation=$7,employment=$8,product_name=$9,industry=$10,ai_phase=$11,primary_stack=$12,key_strengths=$13,development_focus=$14,training_recommendation=$15,career_goal=$16,manager_notes=$17 WHERE id=$18 AND assessment_id=$19`,
      [engineer.name,engineer.employee_id,engineer.team,engineer.reports_to,engineer.job_title,engineer.level,engineer.specialisation,engineer.employment,engineer.product_name,engineer.industry,engineer.ai_phase,engineer.primary_stack,engineer.key_strengths,engineer.development_focus,engineer.training_recommendation,engineer.career_goal,engineer.manager_notes,engineer.id,params.id]
    );
  }
  if (skillUpdates && Array.isArray(skillUpdates)) {
    for (const s of skillUpdates) {
      await execute(`UPDATE talent_skills SET self_score=$1,manager_score=$2,target_score=$3,notes=$4 WHERE id=$5`, [s.self_score,s.manager_score,s.target_score,s.notes,s.id]);
    }
  }
  await execute(`UPDATE assessments SET updated_at=NOW() WHERE id=$1`, [params.id]);
  return NextResponse.json({ success: true });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await canAccess(req, params.id);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { name } = await req.json();
  const r = await query<{id:number}>(`INSERT INTO talent_engineers (assessment_id,name) VALUES ($1,$2) RETURNING id`, [params.id, name || 'New Engineer']);
  const engId = r[0].id;
  // Seed all talent skill rows for this engineer
  for (const s of TALENT_SKILLS_TEMPLATE) {
    await execute(`INSERT INTO talent_skills (engineer_id,section,category,skill_name,description,sort_order) VALUES ($1,$2,$3,$4,$5,$6)`, [engId,s.section,s.category,s.skill_name,s.description,s.sort_order]);
  }
  return NextResponse.json({ id: engId });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await canAccess(req, params.id);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { engineer_id } = await req.json();
  // talent_skills cascade on engineer delete
  await execute(`DELETE FROM talent_engineers WHERE id=$1 AND assessment_id=$2`, [engineer_id, params.id]);
  return NextResponse.json({ success: true });
}
