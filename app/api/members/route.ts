/**
 * app/api/members/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

// GET — get member profile or list (admin)
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  const db = getDb();
  const url = new URL(req.url);

  if (url.searchParams.get('me')) {
    const user = db.prepare('SELECT id, name, email, company, role, industry, team_size, linkedin, bio, joined_at, last_login FROM users WHERE id = ?').get(session.id);
    return NextResponse.json({ user });
  }

  if (session.isAdmin && url.searchParams.get('all')) {
    const users = db.prepare('SELECT id, name, email, company, role, status, is_admin, joined_at, last_login FROM users ORDER BY joined_at DESC').all();
    return NextResponse.json({ users });
  }

  return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
}

// PATCH — update own profile or admin actions
export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  const body = await req.json();
  const db = getDb();

  // Update own profile
  if (body.action === 'update_profile') {
    const { name, company, role, industry, teamSize, linkedin, bio } = body;
    db.prepare(`
      UPDATE users SET name = ?, company = ?, role = ?, industry = ?, team_size = ?, linkedin = ?, bio = ?
      WHERE id = ?
    `).run(name, company, role, industry, teamSize, linkedin, bio, session.id);
    return NextResponse.json({ success: true });
  }

  // Admin: update user status
  if (body.action === 'set_status' && session.isAdmin) {
    const { userId, status } = body;
    db.prepare('UPDATE users SET status = ? WHERE id = ?').run(status, userId);
    return NextResponse.json({ success: true });
  }

  // Admin: toggle admin
  if (body.action === 'toggle_admin' && session.isAdmin) {
    const { userId, isAdmin } = body;
    db.prepare('UPDATE users SET is_admin = ? WHERE id = ?').run(isAdmin ? 1 : 0, userId);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
}
