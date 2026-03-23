import { NextRequest, NextResponse } from 'next/server';
import { query, execute, queryOne } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
export async function GET(req: NextRequest) {
  const all = req.nextUrl.searchParams.get('all');
  const user = all ? await getSessionFromRequest(req) : null;
  const where = (all && user?.isAdmin) ? '' : "WHERE status='published'";
  const posts = await query(`SELECT * FROM blog_posts ${where} ORDER BY published_at DESC NULLS LAST, created_at DESC`);
  return NextResponse.json({ posts });
}
export async function POST(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  if (!user?.isAdmin) return NextResponse.json({ error:'Forbidden' },{ status:403 });
  const { title,category,excerpt,body,emoji,read_time,status } = await req.json();
  const p = await queryOne<{id:number}>(`INSERT INTO blog_posts (title,category,excerpt,body,emoji,read_time,status,published_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`, [title,category,excerpt,body,emoji||'📝',read_time||4,status||'draft',status==='published'?new Date().toISOString():null]);
  return NextResponse.json({ id:p?.id });
}
export async function PATCH(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  if (!user?.isAdmin) return NextResponse.json({ error:'Forbidden' },{ status:403 });
  const { id,title,category,excerpt,body,emoji,read_time,status } = await req.json();
  await execute(`UPDATE blog_posts SET title=$1,category=$2,excerpt=$3,body=$4,emoji=$5,read_time=$6,status=$7,published_at=CASE WHEN $7='published' AND published_at IS NULL THEN NOW() ELSE published_at END WHERE id=$8`, [title,category,excerpt,body,emoji,read_time,status,id]);
  return NextResponse.json({ success:true });
}
export async function DELETE(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  if (!user?.isAdmin) return NextResponse.json({ error:'Forbidden' },{ status:403 });
  const { id } = await req.json();
  await execute('DELETE FROM blog_posts WHERE id=$1', [id]);
  return NextResponse.json({ success:true });
}
