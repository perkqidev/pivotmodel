import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import * as XLSX from 'xlsx';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionFromRequest(req);
  if (!user) return NextResponse.json({ error:'Unauthorized' },{status:401});
  const assessment = await queryOne<any>(`SELECT * FROM assessments WHERE id=$1 AND (user_id=$2 OR id IN (SELECT assessment_id FROM assessment_collaborators WHERE user_id=$2))`, [params.id,user.id]);
  if (!assessment) return NextResponse.json({ error:'Not found' },{status:404});

  const wb = XLSX.utils.book_new();

  // Sheet 1: EMB Maturity
  const emb = await query<any>(`SELECT * FROM assessment_emb WHERE assessment_id=$1 ORDER BY sort_order`, [params.id]);
  const embData = emb.map(r => ({ Pillar: r.pivot_name, Capability: r.capability, 'L1 Criteria': r.l1_criteria, 'L2 Criteria': r.l2_criteria, 'L3 Criteria': r.l3_criteria, 'Current Level': r.current_level, Evidence: r.evidence||'', 'Gap Notes': r.gap_notes||'' }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(embData.length ? embData : [{}]), 'Maturity');

  // Sheet 2: Business Drivers
  const drivers = await query<any>(`SELECT * FROM assessment_business_drivers WHERE assessment_id=$1 ORDER BY sort_order`, [params.id]);
  const driverData = drivers.map(r => ({ Category: r.category, Driver: r.driver_name, Description: r.description||'', Mandatory: r.is_mandatory?'Yes':'No', Considerations: r.considerations||'', Notes: r.notes||'' }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(driverData.length ? driverData : [{}]), 'Business Drivers');

  // Sheet 3: Benchmarks
  const benchmarks = await query<any>(`SELECT * FROM assessment_benchmarks WHERE assessment_id=$1 ORDER BY sort_order`, [params.id]);
  const benchData = benchmarks.map(r => ({ Pillar: r.pillar, 'Sub-Category': r.sub_category||'', KPI: r.kpi_name, Definition: r.definition||'', Weight: r.weight||0, Unit: r.unit, Target: r.target_value, Current: r.current_value||'', Status: r.status, Notes: r.notes||'' }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(benchData.length ? benchData : [{}]), 'Benchmarks');

  // Sheet 4: Scope
  const scope = await query<any>(`SELECT * FROM assessment_scope WHERE assessment_id=$1 ORDER BY sort_order`, [params.id]);
  const scopeData = scope.map(r => ({ Section: r.pillar, Activity: r.activity, 'Required Level': r.required_level, 'Current Level': r.current_level, Gap: r.gap, 'L1 Guidance': r.l1_guidance||'', 'L2 Guidance': r.l2_guidance||'', 'L3 Guidance': r.l3_guidance||'', Notes: r.notes||'' }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(scopeData.length ? scopeData : [{}]), 'Scope');

  // Sheet 5: Maturity Levels
  const maturity = await query<any>(`SELECT * FROM assessment_maturity_levels WHERE assessment_id=$1 ORDER BY sort_order`, [params.id]);
  const matData = maturity.map(r => ({ Factor: r.factor_name, 'Maturity Level': r.maturity_level, 'Ownership Level': r.ownership_level||'', 'Skill Level': r.skill_level||'', 'Business Value': r.business_value||'', Notes: r.notes||'' }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(matData.length ? matData : [{}]), 'Competency Maturity');

  // Sheet 6: KRA
  const kra = await query<any>(`SELECT * FROM assessment_kra WHERE assessment_id=$1 ORDER BY role_level,sort_order`, [params.id]);
  const kraData = kra.map(r => ({ Role: r.role_level, Pillar: r.pillar||'', Person: r.person_name||'', KRA: r.kra_name, Description: r.description||'', Target: r.target||'', Current: r.current||'', Status: r.status, Notes: r.notes||'' }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(kraData.length ? kraData : [{}]), 'Roles & KRA');

  // Sheet 7: Leadership
  const leadership = await query<any>(`SELECT * FROM assessment_leadership WHERE assessment_id=$1 ORDER BY leader_name,sort_order`, [params.id]);
  const leaderData = leadership.map(r => ({ Leader: r.leader_name, Role: r.leader_role||'', Category: r.skill_category||'', Skill: r.skill_name, Mandatory: r.is_mandatory?'Yes':'No', Score: r.score, 'Detailed Skills': r.detailed_skills||'', Notes: r.notes||'' }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(leaderData.length ? leaderData : [{}]), 'Leadership');

  // Sheet 8: Talent Map - Engineers
  const engineers = await query<any>(`SELECT * FROM talent_engineers WHERE assessment_id=$1 ORDER BY sort_order,id`, [params.id]);
  const engData = engineers.map(r => ({ Name: r.name, 'Employee ID': r.employee_id||'', Team: r.team||'', 'Reports To': r.reports_to||'', 'Job Title': r.job_title||'', Level: r.level||'', Specialisation: r.specialisation||'', Employment: r.employment||'', Product: r.product_name||'', Industry: r.industry||'', 'AI Phase': r.ai_phase||'', 'Primary Stack': r.primary_stack||'', 'Key Strengths': r.key_strengths||'', 'Development Focus': r.development_focus||'', 'Training Recommendation': r.training_recommendation||'', 'Career Goal': r.career_goal||'', 'Manager Notes': r.manager_notes||'' }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(engData.length ? engData : [{}]), 'Talent Profiles');

  // Sheet 9: Talent Map - Skills
  const talentSkillData: any[] = [];
  for (const eng of engineers) {
    const skills = await query<any>(`SELECT * FROM talent_skills WHERE engineer_id=$1 ORDER BY sort_order,id`, [eng.id]);
    for (const s of skills) talentSkillData.push({ Engineer: eng.name, Section: s.section, Category: s.category, Skill: s.skill_name, Description: s.description||'', 'Self Score': s.self_score, 'Manager Score': s.manager_score, 'Target Score': s.target_score, Notes: s.notes||'' });
  }
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(talentSkillData.length ? talentSkillData : [{}]), 'Talent Skills');

  // Sheet 10: Skillset Context
  const sCtx = await query<any>(`SELECT * FROM skillset_context WHERE assessment_id=$1 ORDER BY sort_order,id`, [params.id]);
  const ctxData = sCtx.map(r => ({ Field: r.field_name, Value: r.field_value||'', Group: r.field_group||'' }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ctxData.length ? ctxData : [{}]), 'Skillset Context');

  // Sheet 11: Skillset Requirements
  const sItems = await query<any>(`SELECT * FROM skillset_items WHERE assessment_id=$1 ORDER BY sort_order,id`, [params.id]);
  const itemData = sItems.map(r => ({ Section: r.section, Category: r.category||'', Skill: r.item_name, Description: r.description||'', Importance: r.importance||'', 'Current Level': r.current_level||'', 'Required Level': r.required_level||'', Gap: r.gap||'', Notes: r.notes||'' }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(itemData.length ? itemData : [{}]), 'Skillset Requirements');

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="assessment-${params.id}-${assessment.team_name||'export'}.xlsx"`,
    },
  });
}
