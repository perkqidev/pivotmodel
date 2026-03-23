import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
async function adminOnly(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  return user?.isAdmin ? user : null;
}
export async function GET(req: NextRequest) {
  const user = await adminOnly(req); if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const users = await query(`SELECT u.*, (SELECT COUNT(*) FROM assessments a WHERE a.user_id=u.id) as assessment_count, (SELECT COUNT(*) FROM chat_usage cu WHERE cu.user_id=u.id AND cu.message_at > NOW()-INTERVAL '30 days') as chat_month FROM users u ORDER BY u.joined_at DESC`);
  return NextResponse.json({ users });
}
export async function PATCH(req: NextRequest) {
  const user = await adminOnly(req); if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { action, userId } = await req.json();
  if (action === 'deactivate') await execute(`UPDATE users SET status='inactive' WHERE id=$1`, [userId]);
  else if (action === 'activate') await execute(`UPDATE users SET status='active' WHERE id=$1`, [userId]);
  else if (action === 'promote') await execute(`UPDATE users SET is_admin=TRUE WHERE id=$1`, [userId]);
  else if (action === 'demote') await execute(`UPDATE users SET is_admin=FALSE WHERE id=$1 AND email!='pivotrics@gmail.com'`, [userId]);
  return NextResponse.json({ success: true });
}
