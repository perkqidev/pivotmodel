import { NextRequest, NextResponse } from 'next/server';
import { query, execute, LEADERSHIP_SKILLS } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
async function canAccess(req: NextRequest, id: string) {
  const user = await getSessionFromRequest(req);
  if (!user) return null;
  const rows = await query(`SELECT 1 FROM assessments a LEFT JOIN assessment_collaborators ac ON ac.assessment_id=a.id WHERE a.id=$1 AND (a.user_id=$2 OR ac.user_id=$2)`, [id, user.id]);
  return rows.length > 0 ? user : null;
}
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await canAccess(req, params.id); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const rows = await query(`SELECT * FROM assessment_leadership WHERE assessment_id=$1 ORDER BY leader_name,sort_order,id`, [params.id]);
  return NextResponse.json({ rows });
}
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await canAccess(req, params.id); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { rows } = await req.json();
  for (const r of rows) await execute(`UPDATE assessment_leadership SET leader_name=$1,leader_role=$2,skill_name=$3,is_mandatory=$4,score=$5,notes=$6 WHERE id=$7 AND assessment_id=$8`, [r.leader_name,r.leader_role,r.skill_name,r.is_mandatory,r.score,r.notes,r.id,params.id]);
  await execute(`UPDATE assessments SET updated_at=NOW() WHERE id=$1`, [params.id]);
  return NextResponse.json({ success: true });
}
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await canAccess(req, params.id); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { leader_name, leader_role } = await req.json();
  if (!leader_name) return NextResponse.json({ error: 'leader_name required' }, { status: 400 });
  let order = 0;
  for (const s of LEADERSHIP_SKILLS) {
    await execute(`INSERT INTO assessment_leadership (assessment_id,leader_name,leader_role,skill_name,is_mandatory,sort_order) VALUES ($1,$2,$3,$4,$5,$6)`, [params.id,leader_name,leader_role||'',s.skill_name,s.is_mandatory,order++]);
  }
  return NextResponse.json({ success: true });
}
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await canAccess(req, params.id); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { row_id, leader_name } = await req.json();
  if (leader_name) await execute(`DELETE FROM assessment_leadership WHERE leader_name=$1 AND assessment_id=$2`, [leader_name, params.id]);
  else await execute(`DELETE FROM assessment_leadership WHERE id=$1 AND assessment_id=$2`, [row_id, params.id]);
  return NextResponse.json({ success: true });
}
