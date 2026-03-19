import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute, getPool } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Login required.' }, { status: 401 });

  const id = new URL(req.url).searchParams.get('id');

  if (id) {
    const profile = await queryOne('SELECT * FROM skill_profiles WHERE id=$1 AND user_id=$2', [id, session.id]);
    if (!profile) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    const rows = await query('SELECT * FROM skill_req_rows WHERE profile_id=$1 ORDER BY sort_order', [id]);
    return NextResponse.json({ profile, rows });
  }

  const profiles = await query(
    `SELECT sp.*, COUNT(r.id) AS row_count FROM skill_profiles sp
     LEFT JOIN skill_req_rows r ON r.profile_id = sp.id
     WHERE sp.user_id=$1 GROUP BY sp.id ORDER BY sp.created_at DESC`,
    [session.id]
  );
  return NextResponse.json({ profiles });
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Login required.' }, { status: 401 });

  const { name, templateRows } = await req.json();
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: [p] } = await client.query(
      'INSERT INTO skill_profiles (user_id, name) VALUES ($1,$2) RETURNING id',
      [session.id, name || 'New Profile']
    );
    const profileId = p.id;
    for (const row of (templateRows || [])) {
      await client.query(
        `INSERT INTO skill_req_rows (profile_id, section, skill, why_matters, importance, min_level, ideal_level, depth, engineers_needed, seniority, notes, sort_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [profileId, row.section, row.skill, row.why_matters||null, row.importance||'Standard',
         row.min_level||5, row.ideal_level||8, row.depth||'D',
         row.engineers_needed||null, row.seniority||null, row.notes||null, row.sort_order||0]
      );
    }
    await client.query('COMMIT');
    return NextResponse.json({ success: true, id: profileId });
  } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
}

export async function PUT(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Login required.' }, { status: 401 });

  const { id, name, context, rows } = await req.json();
  const ok = await queryOne('SELECT id FROM skill_profiles WHERE id=$1 AND user_id=$2', [id, session.id]);
  if (!ok) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('UPDATE skill_profiles SET name=$1, context=$2, updated_at=NOW() WHERE id=$3',
      [name, JSON.stringify(context||{}), id]);
    if (Array.isArray(rows)) {
      for (const r of rows) {
        await client.query(
          `UPDATE skill_req_rows SET section=$1, skill=$2, why_matters=$3, importance=$4,
           min_level=$5, ideal_level=$6, depth=$7, engineers_needed=$8, seniority=$9, notes=$10
           WHERE id=$11 AND profile_id=$12`,
          [r.section, r.skill, r.why_matters||null, r.importance||'Standard',
           r.min_level||5, r.ideal_level||8, r.depth||'D',
           r.engineers_needed||null, r.seniority||null, r.notes||null, r.id, id]
        );
      }
    }
    await client.query('COMMIT');
    return NextResponse.json({ success: true });
  } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
}

export async function DELETE(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Login required.' }, { status: 401 });
  const id = new URL(req.url).searchParams.get('id');
  await execute('DELETE FROM skill_profiles WHERE id=$1 AND user_id=$2', [id, session.id]);
  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Login required.' }, { status: 401 });
  const body = await req.json();

  if (body.action === 'add_row') {
    const ok = await queryOne('SELECT id FROM skill_profiles WHERE id=$1 AND user_id=$2', [body.profileId, session.id]);
    if (!ok) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    const row = await queryOne(
      `INSERT INTO skill_req_rows (profile_id, section, skill, importance, min_level, ideal_level, depth, sort_order)
       VALUES ($1,$2,'New Skill','Standard',5,8,'D',$3) RETURNING *`,
      [body.profileId, body.section, body.sortOrder ?? 999]
    );
    return NextResponse.json({ success: true, row });
  }

  if (body.action === 'delete_row') {
    const ok = await queryOne(
      'SELECT r.id FROM skill_req_rows r JOIN skill_profiles p ON p.id=r.profile_id WHERE r.id=$1 AND p.user_id=$2',
      [body.rowId, session.id]
    );
    if (!ok) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    await execute('DELETE FROM skill_req_rows WHERE id=$1', [body.rowId]);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
}
