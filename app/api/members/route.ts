import { NextRequest, NextResponse } from 'next/server';
import { queryOne, query, execute } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  const url = new URL(req.url);

  if (url.searchParams.get('me')) {
    const user = await queryOne(
      'SELECT id, name, email, company, role, industry, team_size, linkedin, bio, joined_at, last_login FROM users WHERE id = $1',
      [session.id]
    );
    return NextResponse.json({ user });
  }

  if (session.isAdmin && url.searchParams.get('all')) {
    const users = await query(
      'SELECT id, name, email, company, role, status, is_admin, joined_at, last_login FROM users ORDER BY joined_at DESC'
    );
    return NextResponse.json({ users });
  }

  return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
}

export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  const body = await req.json();

  if (body.action === 'update_profile') {
    const { name, company, role, industry, teamSize, linkedin, bio } = body;
    await execute(
      'UPDATE users SET name=$1, company=$2, role=$3, industry=$4, team_size=$5, linkedin=$6, bio=$7 WHERE id=$8',
      [name, company, role, industry, teamSize, linkedin, bio, session.id]
    );
    return NextResponse.json({ success: true });
  }

  if (body.action === 'set_status' && session.isAdmin) {
    await execute('UPDATE users SET status = $1 WHERE id = $2', [body.status, body.userId]);
    return NextResponse.json({ success: true });
  }

  if (body.action === 'toggle_admin' && session.isAdmin) {
    await execute('UPDATE users SET is_admin = $1 WHERE id = $2', [body.isAdmin, body.userId]);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
}
