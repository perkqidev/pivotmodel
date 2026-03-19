import { NextRequest, NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';
import { createSession as signToken } from '@/lib/auth';
import { sendOtpEmail } from '@/lib/email';

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { step, email, name, company, role, industry, team_size, linkedin, otp } = body;

    if (!email) return NextResponse.json({ error: 'Email required.' }, { status: 400 });

    // ── Step 1: send OTP ─────────────────────────────────────────────────────
    if (step === 'request' || !step) {
      if (!name) return NextResponse.json({ error: 'Name required.' }, { status: 400 });

      const existing = await queryOne('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
      if (existing) return NextResponse.json({ error: 'An account with that email already exists.' }, { status: 409 });

      const code = generateOtp();
      const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      await execute('DELETE FROM otp_codes WHERE email = $1 AND purpose = $2', [email.toLowerCase(), 'register']);
      await execute(
        'INSERT INTO otp_codes (email, code, purpose, expires_at) VALUES ($1, $2, $3, $4)',
        [email.toLowerCase(), code, 'register', expires]
      );

      if (process.env.NODE_ENV === 'development') {
        console.log(`[DEV] Registration OTP for ${email}: ${code}`);
      } else {
        await sendOtpEmail(email, code, name);
      }

      return NextResponse.json({ success: true, message: 'Verification code sent to your email.' });
    }

    // ── Step 2: verify OTP & create user ────────────────────────────────────
    if (step === 'verify') {
      if (!otp || !name) return NextResponse.json({ error: 'OTP and name required.' }, { status: 400 });

      const record = await queryOne<{ id: number; code: string; expires_at: string; used: boolean }>(
        `SELECT id, code, expires_at, used FROM otp_codes
         WHERE email = $1 AND purpose = 'register' AND used = FALSE
         ORDER BY created_at DESC LIMIT 1`,
        [email.toLowerCase()]
      );

      if (!record || record.used || new Date(record.expires_at) < new Date() || record.code !== otp) {
        return NextResponse.json({ error: 'Invalid or expired verification code.' }, { status: 401 });
      }

      await execute('UPDATE otp_codes SET used = TRUE WHERE id = $1', [record.id]);

      // Check again for race condition
      const existing = await queryOne('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
      if (existing) return NextResponse.json({ error: 'Account already exists.' }, { status: 409 });

      const newUser = await queryOne<{ id: number; name: string; email: string; is_admin: boolean }>(
        `INSERT INTO users (name, email, company, role, industry, team_size, linkedin)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, name, email, is_admin`,
        [name, email.toLowerCase(), company || null, role || null, industry || null, team_size || null, linkedin || null]
      );

      if (!newUser) return NextResponse.json({ error: 'Failed to create account.' }, { status: 500 });

      const token = await signToken({ id: newUser.id, email: newUser.email, name: newUser.name, isAdmin: newUser.is_admin });

      const res = NextResponse.json({ success: true, user: { id: newUser.id, name: newUser.name, email: newUser.email, isAdmin: newUser.is_admin } });
      res.cookies.set('pm_session', token, {
        httpOnly: true, secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax', maxAge: 60 * 60 * 24 * 30, path: '/'
      });
      return res;
    }

    return NextResponse.json({ error: 'Invalid step.' }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[register]', msg, err);
    return NextResponse.json({ error: `Server error: ${msg}` }, { status: 500 });
  }
}
