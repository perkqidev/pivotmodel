import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
// Simple CSV export fallback (xlsx lib available if installed)
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionFromRequest(req);
  if (!user) return NextResponse.json({ error:'Unauthorized' },{status:401});
  const assessment = await queryOne<any>(`SELECT * FROM assessments WHERE id=$1 AND user_id=$2`, [params.id,user.id]);
  if (!assessment) return NextResponse.json({ error:'Not found' },{status:404});
  const emb = await query(`SELECT * FROM assessment_emb WHERE assessment_id=$1 ORDER BY sort_order`, [params.id]);
  let csv = `Assessment: ${assessment.team_name}\nDate: ${assessment.assessment_date}\n\n`;
  csv += `MODULE 1: MATURITY ASSESSMENT\nPillar,Capability,Current Level,Evidence,Gap Notes\n`;
  emb.forEach((r:any) => { csv += `"${r.pivot_name}","${r.capability}","${r.current_level}","${r.evidence||''}","${r.gap_notes||''}"\n`; });
  return new NextResponse(csv, { headers: { 'Content-Type':'text/csv', 'Content-Disposition':`attachment; filename="assessment-${params.id}.csv"` } });
}
