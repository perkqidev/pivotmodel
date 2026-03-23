import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
async function canAccess(req: NextRequest, id: string) {
  const user = await getSessionFromRequest(req);
  if (!user) return null;
  const rows = await query(`SELECT 1 FROM assessments a LEFT JOIN assessment_collaborators ac ON ac.assessment_id=a.id WHERE a.id=$1 AND (a.user_id=$2 OR ac.user_id=$2)`, [id, user.id]);
  return rows.length > 0 ? user : null;
}
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await canAccess(req, params.id); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const rows = await query(`SELECT * FROM assessment_maturity_levels WHERE assessment_id=$1 ORDER BY sort_order,id`, [params.id]);
  return NextResponse.json({ rows });
}
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await canAccess(req, params.id); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { rows } = await req.json();
  for (const r of rows) await execute(`UPDATE assessment_maturity_levels SET factor_name=$1,maturity_level=$2,ownership_level=$3,skill_level=$4,business_value=$5,notes=$6 WHERE id=$7 AND assessment_id=$8`, [r.factor_name,r.maturity_level,r.ownership_level,r.skill_level,r.business_value,r.notes,r.id,params.id]);
  await execute(`UPDATE assessments SET updated_at=NOW() WHERE id=$1`, [params.id]);
  return NextResponse.json({ success: true });
}
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await canAccess(req, params.id); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const r = await query<{id:number}>(`INSERT INTO assessment_maturity_levels (assessment_id,factor_name,maturity_level) VALUES ($1,'New Factor',1) RETURNING id`, [params.id]);
  return NextResponse.json({ id: r[0].id });
}
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await canAccess(req, params.id); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { row_id } = await req.json();
  await execute(`DELETE FROM assessment_maturity_levels WHERE id=$1 AND assessment_id=$2`, [row_id, params.id]);
  return NextResponse.json({ success: true });
}
