import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne, execute, getPool, EMB_TEMPLATE } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

// GET — list assessments or fetch one with rows
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Login required.' }, { status: 401 });

  const id = new URL(req.url).searchParams.get('id');

  if (id) {
    const assessment = await queryOne(
      'SELECT * FROM emb_assessments WHERE id = $1 AND user_id = $2',
      [id, session.id]
    );
    if (!assessment) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    const rows = await query('SELECT * FROM emb_rows WHERE assessment_id = $1 ORDER BY sort_order', [id]);
    return NextResponse.json({ assessment, rows });
  }

  const assessments = await query(
    `SELECT a.*, COUNT(r.id) AS row_count, ROUND(AVG(r.score)::numeric, 1) AS avg_score
     FROM emb_assessments a
     LEFT JOIN emb_rows r ON r.assessment_id = a.id
     WHERE a.user_id = $1
     GROUP BY a.id
     ORDER BY a.created_at DESC`,
    [session.id]
  );
  return NextResponse.json({ assessments });
}

// POST — create new assessment from template
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Login required.' }, { status: 401 });

  const { teamName, assessmentDate } = await req.json();

  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: [assessment] } = await client.query(
      `INSERT INTO emb_assessments (user_id, team_name, assessment_date)
       VALUES ($1, $2, $3) RETURNING id`,
      [session.id, teamName || 'My Team', assessmentDate || new Date().toISOString().split('T')[0]]
    );
    const assessmentId = assessment.id;

    for (const row of EMB_TEMPLATE) {
      await client.query(
        `INSERT INTO emb_rows (assessment_id, pivot_num, pivot_name, capability,
           l1_criteria, l2_criteria, l3_criteria, sort_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [assessmentId, row.pivot_num, row.pivot_name, row.capability,
         row.l1_criteria, row.l2_criteria, row.l3_criteria, row.sort_order]
      );
    }

    await client.query('COMMIT');
    return NextResponse.json({ success: true, assessmentId });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// PUT — save assessment rows
export async function PUT(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Login required.' }, { status: 401 });

  const { assessmentId, teamName, notes, rows } = await req.json();
  if (!assessmentId) return NextResponse.json({ error: 'assessmentId required.' }, { status: 400 });

  const assessment = await queryOne(
    'SELECT id FROM emb_assessments WHERE id = $1 AND user_id = $2',
    [assessmentId, session.id]
  );
  if (!assessment) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(
      'UPDATE emb_assessments SET team_name=$1, notes=$2, updated_at=NOW() WHERE id=$3',
      [teamName || 'My Team', notes || null, assessmentId]
    );

    if (Array.isArray(rows)) {
      for (const row of rows as Array<{ id: number; current_level: string; score: number; evidence: string; row_notes: string }>) {
        await client.query(
          `UPDATE emb_rows SET current_level=$1, score=$2, evidence=$3, row_notes=$4
           WHERE id=$5 AND assessment_id=$6`,
          [row.current_level, row.score, row.evidence || null, row.row_notes || null, row.id, assessmentId]
        );
      }
    }

    await client.query('COMMIT');
    return NextResponse.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// DELETE — delete an assessment
export async function DELETE(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Login required.' }, { status: 401 });
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required.' }, { status: 400 });
  await execute('DELETE FROM emb_assessments WHERE id = $1 AND user_id = $2', [id, session.id]);
  return NextResponse.json({ success: true });
}

// PATCH — add row / rename / reorder / add pivot
export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Login required.' }, { status: 401 });

  const body = await req.json();

  if (body.action === 'add_row') {
    const { assessmentId, pivotNum, pivotName, capability, sortOrder } = body;
    const ok = await queryOne('SELECT id FROM emb_assessments WHERE id=$1 AND user_id=$2', [assessmentId, session.id]);
    if (!ok) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    const row = await queryOne(
      `INSERT INTO emb_rows (assessment_id, pivot_num, pivot_name, capability,
         l1_criteria, l2_criteria, l3_criteria, current_level, score, sort_order)
       VALUES ($1,$2,$3,$4,'','','','L1',5,$5) RETURNING *`,
      [assessmentId, pivotNum, pivotName, capability || 'New Capability', sortOrder ?? 999]
    );
    return NextResponse.json({ success: true, row });
  }

  if (body.action === 'delete_row') {
    const { rowId } = body;
    const ok = await queryOne(
      'SELECT r.id FROM emb_rows r JOIN emb_assessments a ON a.id=r.assessment_id WHERE r.id=$1 AND a.user_id=$2',
      [rowId, session.id]
    );
    if (!ok) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    await execute('DELETE FROM emb_rows WHERE id = $1', [rowId]);
    return NextResponse.json({ success: true });
  }

  if (body.action === 'rename_capability') {
    const { rowId, capability } = body;
    const ok = await queryOne(
      'SELECT r.id FROM emb_rows r JOIN emb_assessments a ON a.id=r.assessment_id WHERE r.id=$1 AND a.user_id=$2',
      [rowId, session.id]
    );
    if (!ok) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    await execute('UPDATE emb_rows SET capability=$1 WHERE id=$2', [capability, rowId]);
    return NextResponse.json({ success: true });
  }

  if (body.action === 'rename_pivot') {
    const { assessmentId, pivotNum, pivotName } = body;
    const ok = await queryOne('SELECT id FROM emb_assessments WHERE id=$1 AND user_id=$2', [assessmentId, session.id]);
    if (!ok) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    await execute(
      'UPDATE emb_rows SET pivot_name=$1 WHERE assessment_id=$2 AND pivot_num=$3',
      [pivotName, assessmentId, pivotNum]
    );
    return NextResponse.json({ success: true });
  }

  if (body.action === 'reorder') {
    const { rows } = body as { rows: Array<{ id: number; sort_order: number }> };
    const pool = getPool();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const r of rows) {
        await client.query('UPDATE emb_rows SET sort_order=$1 WHERE id=$2', [r.sort_order, r.id]);
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
    return NextResponse.json({ success: true });
  }

  if (body.action === 'add_pivot') {
    const { assessmentId, pivotNum, pivotName } = body;
    const ok = await queryOne('SELECT id FROM emb_assessments WHERE id=$1 AND user_id=$2', [assessmentId, session.id]);
    if (!ok) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    const row = await queryOne(
      `INSERT INTO emb_rows (assessment_id, pivot_num, pivot_name, capability,
         l1_criteria, l2_criteria, l3_criteria, current_level, score, sort_order)
       VALUES ($1,$2,$3,'New Capability','','','','L1',5,0) RETURNING *`,
      [assessmentId, pivotNum, pivotName || 'Custom Pivot']
    );
    return NextResponse.json({ success: true, row });
  }

  return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
}
