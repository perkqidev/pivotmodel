/**
 * app/api/auth/login/route.ts
 * Login via email OTP (no password — passwordless login).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { createSession, generateOtp, cookieOptions } from '@/lib/auth';
import { sendOtpEmail } from '@/lib/email';

const OTP_EXPIRY = parseInt(process.env.OTP_EXPIRY_MINUTES || '10');

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    // Step 1: Request OTP
    if (action === 'send_otp') {
      const { email } = body;
      if (!email) return NextResponse.json({ error: 'Email is required.' }, { status: 400 });

      const db = getDb();
      const user = db.prepare('SELECT * FROM users WHERE email = ? AND status = ?').get(email.toLowerCase(), 'active') as {
        id: number; name: string; email: string; is_admin: number;
      } | undefined;

      if (!user) {
        return NextResponse.json({ error: 'No account found with this email. Please register first.' }, { status: 404 });
      }

      const otp = generateOtp();
      const expiresAt = new Date(Date.now() + OTP_EXPIRY * 60 * 1000).toISOString();

      db.prepare('DELETE FROM otp_codes WHERE email = ? AND purpose = ?').run(email.toLowerCase(), 'login');
      db.prepare(`
        INSERT INTO otp_codes (email, code, purpose, expires_at)
        VALUES (?, ?, 'login', ?)
      `).run(email.toLowerCase(), otp, expiresAt);

      try {
        await sendOtpEmail(email, otp, user.name);
      } catch (emailErr) {
        console.error('Email send failed:', emailErr);
        if (process.env.NODE_ENV === 'development') {
          console.log(`[DEV] Login OTP for ${email}: ${otp}`);
          return NextResponse.json({ success: true, dev_otp: otp });
        }
        return NextResponse.json({ error: 'Failed to send verification email.' }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    // Step 2: Verify OTP and issue session
    if (action === 'verify_otp') {
      const { email, otp } = body;

      const db = getDb();
      const record = db.prepare(`
        SELECT * FROM otp_codes
        WHERE email = ? AND purpose = 'login' AND used = 0
        ORDER BY created_at DESC LIMIT 1
      `).get(email?.toLowerCase()) as { id: number; code: string; expires_at: string } | undefined;

      if (!record) return NextResponse.json({ error: 'No code found. Please request a new one.' }, { status: 400 });
      if (new Date(record.expires_at) < new Date()) return NextResponse.json({ error: 'Code has expired.' }, { status: 400 });
      if (record.code !== String(otp).trim()) return NextResponse.json({ error: 'Incorrect code.' }, { status: 400 });

      db.prepare('UPDATE otp_codes SET used = 1 WHERE id = ?').run(record.id);

      const user = db.prepare('SELECT * FROM users WHERE email = ? AND status = ?').get(email.toLowerCase(), 'active') as {
        id: number; name: string; email: string; is_admin: number;
      };

      if (!user) return NextResponse.json({ error: 'Account not found or suspended.' }, { status: 403 });

      db.prepare("UPDATE users SET last_login = datetime('now') WHERE id = ?").run(user.id);

      const token = await createSession({
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.is_admin === 1,
      });

      const res = NextResponse.json({
        success: true,
        user: { id: user.id, name: user.name, email: user.email, isAdmin: user.is_admin === 1 },
      });

      res.cookies.set(cookieOptions.name, token, {
        maxAge: cookieOptions.maxAge,
        httpOnly: cookieOptions.httpOnly,
        secure: cookieOptions.secure,
        sameSite: cookieOptions.sameSite,
        path: cookieOptions.path,
      });

      return res;
    }

    // Logout
    if (action === 'logout') {
      const res = NextResponse.json({ success: true });
      res.cookies.delete(cookieOptions.name);
      return res;
    }

    return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
  } catch (err) {
    console.error('/api/auth/login error:', err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}

// GET — check current session
export async function GET(req: NextRequest) {
  const token = req.cookies.get(cookieOptions.name)?.value;
  if (!token) return NextResponse.json({ user: null });

  const { verifySession } = await import('@/lib/auth');
  const user = await verifySession(token);
  return NextResponse.json({ user });
}
