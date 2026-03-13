// app/api/blog/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const db = getDb();
  const session = await getSessionFromRequest(req);
  const where = session ? '' : "WHERE status = 'published'";
  const posts = db.prepare(`SELECT id, title, category, excerpt, emoji, read_time, status, published_at, author_name FROM blog_posts ${where} ORDER BY published_at DESC`).all();
  return NextResponse.json({ posts });
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session?.isAdmin) return NextResponse.json({ error: 'Admin only.' }, { status: 403 });
  const body = await req.json();
  const { title, category, excerpt, body: postBody, emoji, readTime, status } = body;
  const db = getDb();
  const result = db.prepare(`
    INSERT INTO blog_posts (title, category, excerpt, body, emoji, read_time, status, published_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(title, category, excerpt, postBody, emoji || '📝', readTime || 4, status || 'draft', status === 'published' ? new Date().toISOString() : null);
  return NextResponse.json({ success: true, id: result.lastInsertRowid });
}

export async function PUT(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session?.isAdmin) return NextResponse.json({ error: 'Admin only.' }, { status: 403 });
  const body = await req.json();
  const { id, title, category, excerpt, body: postBody, emoji, readTime, status } = body;
  const db = getDb();
  db.prepare(`
    UPDATE blog_posts SET title=?, category=?, excerpt=?, body=?, emoji=?, read_time=?, status=?,
    published_at = CASE WHEN ? = 'published' AND published_at IS NULL THEN datetime('now') ELSE published_at END
    WHERE id = ?
  `).run(title, category, excerpt, postBody, emoji, readTime, status, status, id);
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session?.isAdmin) return NextResponse.json({ error: 'Admin only.' }, { status: 403 });
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  getDb().prepare('DELETE FROM blog_posts WHERE id = ?').run(id);
  return NextResponse.json({ success: true });
}
