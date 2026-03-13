import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionFromRequest(req);
  const statusClause = session ? '' : "AND status = 'published'";
  const post = await queryOne(`SELECT * FROM blog_posts WHERE id = $1 ${statusClause}`, [params.id]);
  if (!post) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  return NextResponse.json({ post });
}
