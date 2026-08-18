/**
 * lib/email.ts
 * Send OTP codes via Resend (resend.com).
 * Set RESEND_API_KEY in .env.local
 */

import { Resend } from 'resend';

let _resend: Resend;
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

const FROM = process.env.SMTP_FROM || 'The Pivot Model <noreply@thepivotmodel.com>';

/* Palette mirrors the site's light tokens (app/aero-tokens.css). Email clients
   don't support CSS variables or webfonts reliably, so the values are inlined
   and the type stack falls back to Georgia / system sans. */
const PAPER  = '#F0F0EE';
const CARD   = '#FFFFFF';
const BASE   = '#F7F7F5';
const INK    = '#15161A';
const INK_2  = '#5A5E66';
const MUTED  = '#8B8F96';
const LINE   = '#E6E6E2';
const ACCENT = '#0d9488';
const SERIF  = "'Newsreader', Georgia, 'Times New Roman', serif";
const SANS   = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";

function otpEmailHtml(greeting: string, otp: string, expiry: string) {
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${PAPER};padding:40px 16px;">
  <tr><td align="center">
    <table role="presentation" width="480" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;width:100%;background:${CARD};border:1px solid ${LINE};border-radius:14px;">
      <tr><td style="padding:40px 40px 36px;font-family:${SANS};">

        <div style="font-family:${SANS};font-size:11px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:${MUTED};">The Pivot Model</div>
        <div style="width:28px;height:1px;background:${ACCENT};margin:14px 0 26px;font-size:0;line-height:0;">&nbsp;</div>

        <h1 style="font-family:${SERIF};font-size:27px;font-weight:600;letter-spacing:-0.01em;color:${INK};margin:0 0 14px;">${greeting}</h1>
        <p style="font-family:${SANS};font-size:15px;line-height:1.65;color:${INK_2};margin:0 0 26px;">Here is your one-time verification code.</p>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BASE};border:1px solid ${LINE};border-radius:10px;">
          <tr><td align="center" style="padding:26px 20px;">
            <div style="font-family:${SANS};font-size:34px;font-weight:600;letter-spacing:0.22em;color:${ACCENT};text-indent:0.22em;">${otp}</div>
            <div style="font-family:${SANS};font-size:12px;color:${MUTED};margin-top:10px;">Expires in ${expiry} minutes</div>
          </td></tr>
        </table>

        <div style="height:1px;background:${LINE};margin:32px 0 18px;font-size:0;line-height:0;">&nbsp;</div>
        <p style="font-family:${SANS};font-size:13px;line-height:1.6;color:${MUTED};margin:0;">If you didn't request this code, you can safely ignore this email — no one can sign in without it.</p>

      </td></tr>
    </table>
  </td></tr>
</table>`;
}

export async function sendOtpEmail(email: string, otp: string, name?: string): Promise<void> {
  const greeting = name ? `Hi ${name},` : 'Hello,';
  const expiry = process.env.OTP_EXPIRY_MINUTES || '10';

  const { error } = await getResend().emails.send({
    from: FROM,
    to: email,
    subject: `Your Pivot Model verification code: ${otp}`,
    html: otpEmailHtml(greeting, otp, expiry),
    text: `${greeting}\n\nYour Pivot Model verification code is: ${otp}\n\nIt expires in ${expiry} minutes. If you didn't request it, you can ignore this email.\n\nThe Pivot Model`,
  });

  if (error) {
    console.error('[Resend] Failed to send OTP email:', error);
    throw new Error(`Email send failed: ${error.message}`);
  }
}
