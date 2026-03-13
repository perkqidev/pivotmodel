/**
 * lib/auth.ts
 * JWT session management using jose (edge-compatible).
 */

import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dev-secret-change-in-production-please'
);
const COOKIE_NAME = 'pm_session';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export interface SessionUser {
  id: number;
  email: string;
  name: string;
  isAdmin: boolean;
}

export async function createSession(user: SessionUser): Promise<string> {
  const token = await new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(JWT_SECRET);
  return token;
}

export async function verifySession(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}

/** Get session from server component (uses next/headers cookies) */
export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

/** Get session from API route (uses NextRequest) */
export async function getSessionFromRequest(req: NextRequest): Promise<SessionUser | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

export const cookieOptions = {
  name: COOKIE_NAME,
  maxAge: MAX_AGE,
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

// Free email domain blocklist
const FREE_DOMAINS = new Set([
  'gmail.com','googlemail.com','yahoo.com','yahoo.co.uk','yahoo.co.in',
  'hotmail.com','hotmail.co.uk','outlook.com','outlook.co.uk','live.com',
  'icloud.com','me.com','mac.com','aol.com','protonmail.com','proton.me',
  'tutanota.com','gmx.com','gmx.net','mail.com','fastmail.com',
  'mailinator.com','trashmail.com','guerrillamail.com','yopmail.com',
]);

export function isFreeEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  return !domain || FREE_DOMAINS.has(domain);
}

export function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}
