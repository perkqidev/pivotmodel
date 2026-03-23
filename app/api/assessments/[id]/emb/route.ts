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
  const user = await canAccess(req, params.id);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const rows = await query(`SELECT * FROM assessment_emb WHERE assessment_id=$1 ORDER BY sort_order,id`, [params.id]);
  return NextResponse.json({ rows });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await canAccess(req, params.id);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { rows } = await req.json();
  for (const r of rows) {
    await execute(`UPDATE assessment_emb SET current_level=$1,score_icon=$2,evidence=$3,gap_notes=$4 WHERE id=$5 AND assessment_id=$6`, [r.current_level,r.score_icon,r.evidence,r.gap_notes,r.id,params.id]);
  }
  await execute(`UPDATE assessments SET updated_at=NOW() WHERE id=$1`, [params.id]);
  // Compute intelligence nudge
  const allRows = await query<{current_level:string}>(`SELECT current_level FROM assessment_emb WHERE assessment_id=$1`, [params.id]);
  const scores = allRows.map(r => r.current_level === 'L3' ? 3 : r.current_level === 'L2' ? 2 : 1);
  const avg = scores.reduce((a,b)=>a+b,0)/scores.length;
  const suggested = avg >= 2.5 ? 'L3' : avg >= 1.5 ? 'L2' : 'L1';
  return NextResponse.json({ success: true, intelligence: { suggested_level: suggested, avg_score: Math.round(avg*100)/100 } });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await canAccess(req, params.id);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { pivot_num, pivot_name, capability } = await req.json();
  const r = await query<{id:number}>(`INSERT INTO assessment_emb (assessment_id,pivot_num,pivot_name,capability) VALUES ($1,$2,$3,$4) RETURNING id`, [params.id, pivot_num||1, pivot_name||'Custom', capability||'New Capability']);
  return NextResponse.json({ id: r[0].id });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await canAccess(req, params.id);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { row_id } = await req.json();
  await execute(`DELETE FROM assessment_emb WHERE id=$1 AND assessment_id=$2`, [row_id, params.id]);
  return NextResponse.json({ success: true });
}
