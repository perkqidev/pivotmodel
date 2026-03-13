import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { getSetting, setSetting } from '@/lib/db';

export async function GET() {
  return NextResponse.json({
    forum_enabled: getSetting('forum_enabled'),
    otp_enabled: getSetting('otp_enabled'),
    corp_email_only: getSetting('corp_email_only'),
  });
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session?.isAdmin) return NextResponse.json({ error: 'Admin only.' }, { status: 403 });
  const body = await req.json();
  for (const [key, value] of Object.entries(body)) {
    setSetting(key, String(value));
  }
  return NextResponse.json({ success: true });
}
