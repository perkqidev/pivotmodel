import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET() {
  const whitepapers = await query('SELECT * FROM whitepapers ORDER BY created_at DESC');
  return NextResponse.json({ whitepapers });
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session?.isAdmin) return NextResponse.json({ error: 'Admin only.' }, { status: 403 });
  const { title, category, description, icon, pages, access, fileUrl } = await req.json();
  const row = await queryOne<{ id: number }>(
    `INSERT INTO whitepapers (title, category, description, icon, pages, access, file_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    [title, category, description, icon || '📄', pages || 1, access || 'members', fileUrl || null]
  );
  return NextResponse.json({ success: true, id: row?.id });
}

export async function DELETE(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session?.isAdmin) return NextResponse.json({ error: 'Admin only.' }, { status: 403 });
  const id = new URL(req.url).searchParams.get('id');
  await execute('DELETE FROM whitepapers WHERE id = $1', [id]);
  return NextResponse.json({ success: true });
}
