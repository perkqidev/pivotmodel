import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/db';
import { createSession as signToken } from '@/lib/auth';
import { sendOtpEmail } from '@/lib/email';

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, otp, step } = body;

    if (!email) return NextResponse.json({ error: 'Email required.' }, { status: 400 });

    // ── Step 1: send OTP ─────────────────────────────────────────────────────
    if (step === 'request' || !step) {
      const user = await queryOne<{ id: number; name: string; status: string }>(
        "SELECT id, name, status FROM users WHERE email = $1 AND status = 'active'",
        [email.toLowerCase()]
      );
      if (!user) return NextResponse.json({ error: 'No active account found for that email.' }, { status: 404 });

      const code = generateOtp();
      const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      await execute('DELETE FROM otp_codes WHERE email = $1 AND purpose = $2', [email.toLowerCase(), 'login']);
      await execute(
        'INSERT INTO otp_codes (email, code, purpose, expires_at) VALUES ($1, $2, $3, $4)',
        [email.toLowerCase(), code, 'login', expires]
      );

      if (process.env.NODE_ENV === 'development') {
        console.log(`[DEV] OTP for ${email}: ${code}`);
      } else {
        await sendOtpEmail(email, code, user.name);
      }

      return NextResponse.json({ success: true, message: 'OTP sent to your email.' });
    }

    // ── Step 2: verify OTP ───────────────────────────────────────────────────
    if (step === 'verify') {
      if (!otp) return NextResponse.json({ error: 'OTP required.' }, { status: 400 });

      const record = await queryOne<{ id: number; code: string; expires_at: string; used: boolean }>(
        `SELECT id, code, expires_at, used FROM otp_codes
         WHERE email = $1 AND purpose = 'login' AND used = FALSE
         ORDER BY created_at DESC LIMIT 1`,
        [email.toLowerCase()]
      );

      if (!record || record.used || new Date(record.expires_at) < new Date() || record.code !== otp) {
        return NextResponse.json({ error: 'Invalid or expired OTP.' }, { status: 401 });
      }

      await execute('UPDATE otp_codes SET used = TRUE WHERE id = $1', [record.id]);

      const user = await queryOne<{ id: number; name: string; email: string; is_admin: boolean }>(
        "SELECT id, name, email, is_admin FROM users WHERE email = $1 AND status = 'active'",
        [email.toLowerCase()]
      );
      if (!user) return NextResponse.json({ error: 'Account not found.' }, { status: 404 });

      await execute('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

      const token = await signToken({ id: user.id, email: user.email, name: user.name, isAdmin: user.is_admin });

      const res = NextResponse.json({ success: true, user: { id: user.id, name: user.name, email: user.email, isAdmin: user.is_admin } });
      res.cookies.set('pm_session', token, {
        httpOnly: true, secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax', maxAge: 60 * 60 * 24 * 30, path: '/'
      });
      return res;
    }

    return NextResponse.json({ error: 'Invalid step.' }, { status: 400 });
  } catch (err) {
    console.error('[login]', err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
