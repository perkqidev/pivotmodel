// app/api/blog/[id]/route.ts — fetch single post body
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb();
  const session = await getSessionFromRequest(req);
  const post = db.prepare(`
    SELECT * FROM blog_posts WHERE id = ? ${session ? '' : "AND status = 'published'"}
  `).get(params.id);
  if (!post) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  return NextResponse.json({ post });
}
