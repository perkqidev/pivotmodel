/**
 * lib/email.ts
 * Send OTP codes via SMTP using nodemailer.
 */

import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendOtpEmail(email: string, otp: string, name?: string): Promise<void> {
  const from = process.env.SMTP_FROM || 'The Pivot Model <noreply@thepivotmodel.com>';
  const greeting = name ? `Hi ${name},` : 'Hello,';

  await transporter.sendMail({
    from,
    to: email,
    subject: `Your Pivot Model verification code: ${otp}`,
    html: `
      <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0A0C17; color: #F5F0E8; padding: 40px; border-radius: 8px;">
        <div style="font-size: 14px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #C9A84C; margin-bottom: 20px;">THE PIVOT MODEL</div>
        <h2 style="font-family: Georgia, serif; font-size: 24px; color: #F5F0E8; margin: 0 0 16px;">${greeting}</h2>
        <p style="color: #8A8FA8; margin: 0 0 24px;">Here is your one-time verification code:</p>
        <div style="background: #12152A; border: 1px solid rgba(201,168,76,0.3); border-radius: 8px; padding: 24px; text-align: center; margin: 0 0 24px;">
          <div style="font-size: 40px; font-weight: 700; color: #C9A84C; letter-spacing: 0.2em;">${otp}</div>
          <div style="font-size: 12px; color: #5A5F78; margin-top: 8px;">Expires in ${process.env.OTP_EXPIRY_MINUTES || 10} minutes</div>
        </div>
        <p style="color: #5A5F78; font-size: 13px; margin: 0;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
    text: `Your Pivot Model verification code is: ${otp}\n\nExpires in ${process.env.OTP_EXPIRY_MINUTES || 10} minutes.`,
  });
}
