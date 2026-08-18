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
  const { title,category,excerpt,body,emoji,read_time,status,hero_image,hero_caption } = await req.json();
  const p = await queryOne<{id:number}>(`INSERT INTO blog_posts (title,category,excerpt,body,emoji,read_time,status,hero_image,hero_caption,published_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`, [title,category,excerpt,body,emoji||'📝',read_time||4,status||'draft',hero_image||null,hero_caption||null,status==='published'?new Date().toISOString():null]);
  return NextResponse.json({ id:p?.id });
}
export async function PATCH(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  if (!user?.isAdmin) return NextResponse.json({ error:'Forbidden' },{ status:403 });
  const patch = await req.json();
  const { id } = patch;
  if (!id) return NextResponse.json({ error:'id required' },{ status:400 });

  // Only touch the columns actually supplied, so a caller that just flips the
  // status — the Publish button on the list — can't blank out the post.
  const columns = ['title','category','excerpt','body','emoji','read_time','status','hero_image','hero_caption'];
  const sets: string[] = [];
  const values: unknown[] = [];
  for (const col of columns) {
    if (!(col in patch)) continue;
    values.push(patch[col] === '' && col !== 'title' ? null : patch[col]);
    sets.push(`${col}=$${values.length}`);
  }
  if (sets.length === 0) return NextResponse.json({ error:'nothing to update' },{ status:400 });
  if (patch.status === 'published') sets.push('published_at=COALESCE(published_at, NOW())');

  values.push(id);
  await execute(`UPDATE blog_posts SET ${sets.join(',')} WHERE id=$${values.length}`, values);
  return NextResponse.json({ success:true });
}
export async function DELETE(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  if (!user?.isAdmin) return NextResponse.json({ error:'Forbidden' },{ status:403 });
  const { id } = await req.json();
  await execute('DELETE FROM blog_posts WHERE id=$1', [id]);
  return NextResponse.json({ success:true });
}
