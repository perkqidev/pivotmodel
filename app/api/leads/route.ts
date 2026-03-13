/**
 * app/api/leads/route.ts
 * Save and retrieve consulting leads.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

// POST — submit a consulting inquiry
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name, email, company, role, industry, linkedin,
      teamSize, offshoreModel, maturityLevel, currentOperation,
      challenges, expectations, service,
      preferredContact, timezone, availability, timeline,
      howHeard, extraNotes, source,
    } = body;

    if (!name || !email || !company) {
      return NextResponse.json({ error: 'Name, email and company are required.' }, { status: 400 });
    }

    const db = getDb();
    const result = db.prepare(`
      INSERT INTO leads (
        name, email, company, role, industry, linkedin,
        team_size, offshore_model, maturity_level, current_operation,
        challenges, expectations, service,
        preferred_contact, timezone, availability, timeline,
        how_heard, extra_notes, source
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name, email, company, role || null, industry || null, linkedin || null,
      teamSize || null, offshoreModel || null, maturityLevel || null, currentOperation || null,
      challenges || null, expectations || null, service || null,
      preferredContact || null, timezone || null, availability || null, timeline || null,
      howHeard || null, extraNotes || null, source || 'website',
    );

    return NextResponse.json({ success: true, id: result.lastInsertRowid });
  } catch (err) {
    console.error('/api/leads POST error:', err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}

// GET — list leads (admin only)
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const db = getDb();
  const leads = db.prepare('SELECT * FROM leads ORDER BY submitted_at DESC').all();
  return NextResponse.json({ leads });
}

// PATCH — update lead status (admin only)
export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session?.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  const body = await req.json();
  const { id, status } = body;
  if (!id || !status) return NextResponse.json({ error: 'id and status required.' }, { status: 400 });

  const db = getDb();
  db.prepare('UPDATE leads SET status = ? WHERE id = ?').run(status, id);
  return NextResponse.json({ success: true });
}
