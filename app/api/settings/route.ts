import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { getSetting, setSetting } from '@/lib/db';

export async function GET() {
  const [forum_enabled, otp_enabled, corp_email_only] = await Promise.all([
    getSetting('forum_enabled'),
    getSetting('otp_enabled'),
    getSetting('corp_email_only'),
  ]);
  return NextResponse.json({ forum_enabled, otp_enabled, corp_email_only });
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session?.isAdmin) return NextResponse.json({ error: 'Admin only.' }, { status: 403 });
  const body = await req.json();
  await Promise.all(Object.entries(body).map(([key, value]) => setSetting(key, String(value))));
  return NextResponse.json({ success: true });
}
