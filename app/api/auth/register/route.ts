/**
 * app/api/auth/register/route.ts
 * Step 1: Collect registration details and send OTP.
 * Step 2: Verify OTP and create the account.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { isFreeEmail, generateOtp } from '@/lib/auth';
import { sendOtpEmail } from '@/lib/email';

const OTP_EXPIRY = parseInt(process.env.OTP_EXPIRY_MINUTES || '10');

// POST /api/auth/register — initiate registration, send OTP
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'send_otp') {
      const { name, email, company, role, industry, teamSize, linkedin } = body;

      if (!name || !email || !company || !role) {
        return NextResponse.json({ error: 'Name, email, company and role are required.' }, { status: 400 });
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
      }

      const corpEmailOnly = getDb().prepare("SELECT value FROM settings WHERE key = 'corp_email_only'").get() as { value: string } | undefined;
      if (corpEmailOnly?.value === 'true' && isFreeEmail(email)) {
        return NextResponse.json({ error: 'Please use your corporate email address (Gmail, Outlook etc. are not accepted).' }, { status: 400 });
      }

      const db = getDb();
      const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
      if (existing) {
        return NextResponse.json({ error: 'An account with this email already exists. Please log in instead.' }, { status: 409 });
      }

      // Generate and store OTP
      const otp = generateOtp();
      const expiresAt = new Date(Date.now() + OTP_EXPIRY * 60 * 1000).toISOString();

      db.prepare('DELETE FROM otp_codes WHERE email = ? AND purpose = ?').run(email.toLowerCase(), 'register');
      db.prepare(`
        INSERT INTO otp_codes (email, code, purpose, expires_at)
        VALUES (?, ?, 'register', ?)
      `).run(email.toLowerCase(), otp, expiresAt);

      // Store pending registration data temporarily in OTP table notes
      // (we re-collect it on verify, no need to store separately)

      // Send OTP
      try {
        await sendOtpEmail(email, otp, name);
      } catch (emailErr) {
        console.error('Email send failed:', emailErr);
        // In dev mode, log the OTP to console
        if (process.env.NODE_ENV === 'development') {
          console.log(`[DEV] OTP for ${email}: ${otp}`);
          return NextResponse.json({ success: true, dev_otp: otp });
        }
        return NextResponse.json({ error: 'Failed to send verification email. Please try again.' }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'verify_otp') {
      const { name, email, company, role, industry, teamSize, linkedin, otp } = body;

      if (!email || !otp) {
        return NextResponse.json({ error: 'Email and OTP are required.' }, { status: 400 });
      }

      const db = getDb();
      const record = db.prepare(`
        SELECT * FROM otp_codes
        WHERE email = ? AND purpose = 'register' AND used = 0
        ORDER BY created_at DESC LIMIT 1
      `).get(email.toLowerCase()) as { id: number; code: string; expires_at: string } | undefined;

      if (!record) {
        return NextResponse.json({ error: 'No verification code found. Please request a new one.' }, { status: 400 });
      }

      if (new Date(record.expires_at) < new Date()) {
        return NextResponse.json({ error: 'Verification code has expired. Please request a new one.' }, { status: 400 });
      }

      if (record.code !== otp.trim()) {
        return NextResponse.json({ error: 'Incorrect code. Please try again.' }, { status: 400 });
      }

      // Mark OTP as used
      db.prepare('UPDATE otp_codes SET used = 1 WHERE id = ?').run(record.id);

      // Create user
      const result = db.prepare(`
        INSERT INTO users (name, email, company, role, industry, team_size, linkedin)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(name, email.toLowerCase(), company, role, industry || null, teamSize || null, linkedin || null);

      return NextResponse.json({ success: true, userId: result.lastInsertRowid });
    }

    return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });

  } catch (err) {
    console.error('/api/auth/register error:', err);
    return NextResponse.json({ error: 'Server error. Please try again.' }, { status: 500 });
  }
}
