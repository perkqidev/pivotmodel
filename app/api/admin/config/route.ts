import { NextRequest, NextResponse } from 'next/server';
import { query, getSetting, setSetting } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
async function adminOnly(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  return user?.isAdmin ? user : null;
}
export async function GET(req: NextRequest) {
  const user = await adminOnly(req); if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const keys = ['chat_enabled','chat_api_key','chat_system_prompt','chat_limit_day','chat_limit_week','chat_limit_month','site_name'];
  const settings: Record<string,string> = {};
  for (const k of keys) settings[k] = (await getSetting(k)) || '';
  const [userCount] = await query<{c:string}>('SELECT COUNT(*) AS c FROM users');
  const [assessmentCount] = await query<{c:string}>('SELECT COUNT(*) AS c FROM assessments');
  const [chatCount] = await query<{c:string}>('SELECT COUNT(*) AS c FROM chat_usage');
  return NextResponse.json({ settings, stats: { users: parseInt(userCount?.c||'0'), assessments: parseInt(assessmentCount?.c||'0'), chat_messages: parseInt(chatCount?.c||'0') } });
}
export async function POST(req: NextRequest) {
  const user = await adminOnly(req); if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json();
  for (const [k, v] of Object.entries(body)) { if (typeof v === 'string') await setSetting(k, v); }
  return NextResponse.json({ success: true });
}
