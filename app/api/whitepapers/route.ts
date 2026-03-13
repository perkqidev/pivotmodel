import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET() {
  const whitepapers = getDb().prepare('SELECT * FROM whitepapers ORDER BY created_at DESC').all();
  return NextResponse.json({ whitepapers });
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session?.isAdmin) return NextResponse.json({ error: 'Admin only.' }, { status: 403 });
  const { title, category, description, icon, pages, access, fileUrl } = await req.json();
  const result = getDb().prepare(`
    INSERT INTO whitepapers (title, category, description, icon, pages, access, file_url)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(title, category, description, icon || '📄', pages || 1, access || 'members', fileUrl || null);
  return NextResponse.json({ success: true, id: result.lastInsertRowid });
}

export async function DELETE(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session?.isAdmin) return NextResponse.json({ error: 'Admin only.' }, { status: 403 });
  const id = new URL(req.url).searchParams.get('id');
  getDb().prepare('DELETE FROM whitepapers WHERE id = ?').run(id);
  return NextResponse.json({ success: true });
}
