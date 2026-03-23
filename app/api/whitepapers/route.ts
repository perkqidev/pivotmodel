import { NextRequest, NextResponse } from 'next/server';
import { query, execute, queryOne } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
export async function GET(req: NextRequest) {
  const whitepapers = await query(`SELECT * FROM whitepapers ORDER BY created_at DESC`);
  return NextResponse.json({ whitepapers });
}
export async function POST(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  if (!user?.isAdmin) return NextResponse.json({ error:'Forbidden' },{ status:403 });
  const { title,category,description,icon,pages,access,file_url } = await req.json();
  const p = await queryOne<{id:number}>(`INSERT INTO whitepapers (title,category,description,icon,pages,access,file_url) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`, [title,category,description,icon||'📄',pages||1,access||'members',file_url||null]);
  return NextResponse.json({ id:p?.id });
}
export async function PATCH(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  if (!user?.isAdmin) return NextResponse.json({ error:'Forbidden' },{ status:403 });
  const { id,title,category,description,icon,pages,access,file_url } = await req.json();
  await execute(`UPDATE whitepapers SET title=$1,category=$2,description=$3,icon=$4,pages=$5,access=$6,file_url=$7 WHERE id=$8`, [title,category,description,icon,pages,access,file_url,id]);
  return NextResponse.json({ success:true });
}
export async function DELETE(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  if (!user?.isAdmin) return NextResponse.json({ error:'Forbidden' },{ status:403 });
  const { id } = await req.json();
  await execute('DELETE FROM whitepapers WHERE id=$1', [id]);
  return NextResponse.json({ success:true });
}
