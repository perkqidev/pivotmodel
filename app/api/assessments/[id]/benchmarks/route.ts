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
  const rows = await query(`SELECT * FROM assessment_benchmarks WHERE assessment_id=$1 ORDER BY sort_order,id`, [params.id]);
  return NextResponse.json({ rows });
}
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await canAccess(req, params.id); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { rows } = await req.json();
  for (const r of rows) await execute(`UPDATE assessment_benchmarks SET current_value=$1,status=$2,notes=$3 WHERE id=$4 AND assessment_id=$5`, [r.current_value,r.status,r.notes,r.id,params.id]);
  await execute(`UPDATE assessments SET updated_at=NOW() WHERE id=$1`, [params.id]);
  return NextResponse.json({ success: true });
}
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await canAccess(req, params.id); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const r = await query<{id:number}>(`INSERT INTO assessment_benchmarks (assessment_id,pillar,kpi_name,unit) VALUES ($1,'Delivery','New KPI','%') RETURNING id`, [params.id]);
  return NextResponse.json({ id: r[0].id });
}
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await canAccess(req, params.id); if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { row_id } = await req.json();
  await execute(`DELETE FROM assessment_benchmarks WHERE id=$1 AND assessment_id=$2`, [row_id, params.id]);
  return NextResponse.json({ success: true });
}
