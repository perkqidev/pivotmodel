import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute, getPool } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Login required.' }, { status: 401 });
  const id = new URL(req.url).searchParams.get('id');
  if (id) {
    const map = await queryOne('SELECT * FROM talent_maps WHERE id=$1 AND user_id=$2', [id, session.id]);
    if (!map) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    const rows = await query('SELECT * FROM talent_map_rows WHERE map_id=$1 ORDER BY sheet, sort_order', [id]);
    return NextResponse.json({ map, rows });
  }
  const maps = await query(
    `SELECT tm.*, COUNT(r.id) AS row_count FROM talent_maps tm
     LEFT JOIN talent_map_rows r ON r.map_id = tm.id
     WHERE tm.user_id=$1 GROUP BY tm.id ORDER BY tm.created_at DESC`,
    [session.id]
  );
  return NextResponse.json({ maps });
}

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Login required.' }, { status: 401 });
  const { name, templateRows } = await req.json();
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: [m] } = await client.query(
      'INSERT INTO talent_maps (user_id, name) VALUES ($1,$2) RETURNING id',
      [session.id, name || 'New Assessment']
    );
    const mapId = m.id;
    for (const row of (templateRows || [])) {
      await client.query(
        `INSERT INTO talent_map_rows (map_id, sheet, section, item, description, sort_order)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [mapId, row.sheet, row.section, row.item, row.description||null, row.sort_order||0]
      );
    }
    await client.query('COMMIT');
    return NextResponse.json({ success: true, id: mapId });
  } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
}

export async function PUT(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Login required.' }, { status: 401 });
  const { id, name, profile, rows } = await req.json();
  const ok = await queryOne('SELECT id FROM talent_maps WHERE id=$1 AND user_id=$2', [id, session.id]);
  if (!ok) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('UPDATE talent_maps SET name=$1, profile=$2, updated_at=NOW() WHERE id=$3',
      [name, JSON.stringify(profile||{}), id]);
    if (Array.isArray(rows)) {
      for (const r of rows) {
        await client.query(
          `UPDATE talent_map_rows SET item=$1, description=$2, self_score=$3, mgr_score=$4,
           target_score=$5, status_text=$6, notes=$7 WHERE id=$8 AND map_id=$9`,
          [r.item, r.description||null, r.self_score||null, r.mgr_score||null,
           r.target_score||null, r.status_text||null, r.notes||null, r.id, id]
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
  await execute('DELETE FROM talent_maps WHERE id=$1 AND user_id=$2', [id, session.id]);
  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Login required.' }, { status: 401 });
  const body = await req.json();

  if (body.action === 'add_row') {
    const ok = await queryOne('SELECT id FROM talent_maps WHERE id=$1 AND user_id=$2', [body.mapId, session.id]);
    if (!ok) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    const row = await queryOne(
      `INSERT INTO talent_map_rows (map_id, sheet, section, item, sort_order)
       VALUES ($1,$2,$3,'New Item',$4) RETURNING *`,
      [body.mapId, body.sheet, body.section, body.sortOrder ?? 999]
    );
    return NextResponse.json({ success: true, row });
  }

  if (body.action === 'delete_row') {
    const ok = await queryOne(
      'SELECT r.id FROM talent_map_rows r JOIN talent_maps m ON m.id=r.map_id WHERE r.id=$1 AND m.user_id=$2',
      [body.rowId, session.id]
    );
    if (!ok) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    await execute('DELETE FROM talent_map_rows WHERE id=$1', [body.rowId]);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
}
