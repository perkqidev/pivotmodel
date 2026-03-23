import { NextRequest, NextResponse } from 'next/server';
import { execute, getSetting, query } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const [enabled, limitDay, limitWeek, limitMonth] = await Promise.all([getSetting('chat_enabled'), getSetting('chat_limit_day'), getSetting('chat_limit_week'), getSetting('chat_limit_month')]);
  const [dayCount] = await query<{c:string}>(`SELECT COUNT(*) AS c FROM chat_usage WHERE user_id=$1 AND message_at > NOW()-INTERVAL '24 hours'`, [user.id]);
  const [weekCount] = await query<{c:string}>(`SELECT COUNT(*) AS c FROM chat_usage WHERE user_id=$1 AND message_at > NOW()-INTERVAL '7 days'`, [user.id]);
  const [monthCount] = await query<{c:string}>(`SELECT COUNT(*) AS c FROM chat_usage WHERE user_id=$1 AND message_at > NOW()-INTERVAL '30 days'`, [user.id]);
  return NextResponse.json({ enabled: enabled === 'true', usage: { day: parseInt(dayCount?.c||'0'), week: parseInt(weekCount?.c||'0'), month: parseInt(monthCount?.c||'0') }, limits: { day: parseInt(limitDay||'20'), week: parseInt(limitWeek||'80'), month: parseInt(limitMonth||'200') } });
}

export async function POST(req: NextRequest) {
  const user = await getSessionFromRequest(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const enabled = await getSetting('chat_enabled');
  if (enabled !== 'true') return NextResponse.json({ error: 'Chat is not enabled.' }, { status: 403 });
  const [limitDay, limitWeek, limitMonth] = await Promise.all([getSetting('chat_limit_day'), getSetting('chat_limit_week'), getSetting('chat_limit_month')]);
  const [dayCount] = await query<{c:string}>(`SELECT COUNT(*) AS c FROM chat_usage WHERE user_id=$1 AND message_at > NOW()-INTERVAL '24 hours'`, [user.id]);
  const [weekCount] = await query<{c:string}>(`SELECT COUNT(*) AS c FROM chat_usage WHERE user_id=$1 AND message_at > NOW()-INTERVAL '7 days'`, [user.id]);
  const [monthCount] = await query<{c:string}>(`SELECT COUNT(*) AS c FROM chat_usage WHERE user_id=$1 AND message_at > NOW()-INTERVAL '30 days'`, [user.id]);
  if (parseInt(dayCount?.c||'0') >= parseInt(limitDay||'20')) return NextResponse.json({ error: 'Daily message limit reached. Resets in 24 hours.' }, { status: 429 });
  if (parseInt(weekCount?.c||'0') >= parseInt(limitWeek||'80')) return NextResponse.json({ error: 'Weekly message limit reached. Resets in 7 days.' }, { status: 429 });
  if (parseInt(monthCount?.c||'0') >= parseInt(limitMonth||'200')) return NextResponse.json({ error: 'Monthly message limit reached. Resets in 30 days.' }, { status: 429 });
  const apiKey = await getSetting('chat_api_key');
  const systemPrompt = await getSetting('chat_system_prompt');
  if (!apiKey) return NextResponse.json({ error: 'Chat not configured.' }, { status: 503 });
  const { message, history } = await req.json();
  if (!message) return NextResponse.json({ error: 'Message required.' }, { status: 400 });
  const messages = [...(history||[]), { role: 'user', content: message }];
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1024, system: systemPrompt||'', messages }),
  });
  if (!response.ok) { const e = await response.json(); return NextResponse.json({ error: e.error?.message || 'AI error' }, { status: 502 }); }
  const data = await response.json();
  const reply = data.content?.[0]?.text || '';
  await execute(`INSERT INTO chat_usage (user_id) VALUES ($1)`, [user.id]);
  return NextResponse.json({ reply });
}
