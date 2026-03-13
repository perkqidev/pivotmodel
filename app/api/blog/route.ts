import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  const where = session ? '' : "WHERE status = 'published'";
  const posts = await query(
    `SELECT id, title, category, excerpt, emoji, read_time, status, published_at, author_name
     FROM blog_posts ${where} ORDER BY published_at DESC`
  );
  return NextResponse.json({ posts });
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session?.isAdmin) return NextResponse.json({ error: 'Admin only.' }, { status: 403 });
  const { title, category, excerpt, body: postBody, emoji, readTime, status } = await req.json();
  const row = await queryOne<{ id: number }>(
    `INSERT INTO blog_posts (title, category, excerpt, body, emoji, read_time, status, published_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
    [title, category, excerpt, postBody, emoji || '📝', readTime || 4,
     status || 'draft', status === 'published' ? new Date().toISOString() : null]
  );
  return NextResponse.json({ success: true, id: row?.id });
}

export async function PUT(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session?.isAdmin) return NextResponse.json({ error: 'Admin only.' }, { status: 403 });
  const { id, title, category, excerpt, body: postBody, emoji, readTime, status } = await req.json();
  await execute(
    `UPDATE blog_posts
     SET title=$1, category=$2, excerpt=$3, body=$4, emoji=$5, read_time=$6, status=$7,
         published_at = CASE WHEN $7 = 'published' AND published_at IS NULL THEN NOW() ELSE published_at END
     WHERE id = $8`,
    [title, category, excerpt, postBody, emoji, readTime, status, id]
  );
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session?.isAdmin) return NextResponse.json({ error: 'Admin only.' }, { status: 403 });
  const id = new URL(req.url).searchParams.get('id');
  await execute('DELETE FROM blog_posts WHERE id = $1', [id]);
  return NextResponse.json({ success: true });
}
