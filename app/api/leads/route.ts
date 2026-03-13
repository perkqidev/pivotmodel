import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

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

    if (!name || !email || !company)
      return NextResponse.json({ error: 'Name, email and company are required.' }, { status: 400 });

    const row = await queryOne<{ id: number }>(
      `INSERT INTO leads (
        name, email, company, role, industry, linkedin,
        team_size, offshore_model, maturity_level, current_operation,
        challenges, expectations, service,
        preferred_contact, timezone, availability, timeline,
        how_heard, extra_notes, source
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
      RETURNING id`,
      [
        name, email, company, role || null, industry || null, linkedin || null,
        teamSize || null, offshoreModel || null, maturityLevel || null, currentOperation || null,
        challenges || null, expectations || null, service || null,
        preferredContact || null, timezone || null, availability || null, timeline || null,
        howHeard || null, extraNotes || null, source || 'website',
      ]
    );
    return NextResponse.json({ success: true, id: row?.id });
  } catch (err) {
    console.error('/api/leads POST error:', err);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session?.isAdmin) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const leads = await query('SELECT * FROM leads ORDER BY submitted_at DESC');
  return NextResponse.json({ leads });
}

export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session?.isAdmin) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  const { id, status } = await req.json();
  if (!id || !status) return NextResponse.json({ error: 'id and status required.' }, { status: 400 });
  await execute('UPDATE leads SET status = $1 WHERE id = $2', [status, id]);
  return NextResponse.json({ success: true });
}
