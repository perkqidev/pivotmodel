/**
 * app/api/emb/route.ts
 * Save and retrieve EMB (Engineering Maturity Benchmark) assessments.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDb, EMB_TEMPLATE } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

// GET — fetch user's assessments (or create a new blank one from template)
export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Login required.' }, { status: 401 });

  const db = getDb();
  const url = new URL(req.url);
  const assessmentId = url.searchParams.get('id');

  if (assessmentId) {
    // Fetch a specific assessment with its rows
    const assessment = db.prepare(`
      SELECT * FROM emb_assessments WHERE id = ? AND user_id = ?
    `).get(assessmentId, session.id) as Record<string, unknown> | undefined;

    if (!assessment) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

    const rows = db.prepare(`
      SELECT * FROM emb_rows WHERE assessment_id = ? ORDER BY sort_order
    `).all(assessmentId);

    return NextResponse.json({ assessment, rows });
  }

  // List all assessments for this user
  const assessments = db.prepare(`
    SELECT a.*, COUNT(r.id) as row_count,
           ROUND(AVG(r.score), 1) as avg_score
    FROM emb_assessments a
    LEFT JOIN emb_rows r ON r.assessment_id = a.id
    WHERE a.user_id = ?
    GROUP BY a.id
    ORDER BY a.created_at DESC
  `).all(session.id);

  return NextResponse.json({ assessments });
}

// POST — create a new blank assessment from template
export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Login required.' }, { status: 401 });

  const body = await req.json();
  const { teamName, assessmentDate } = body;

  const db = getDb();
  const assessment = db.prepare(`
    INSERT INTO emb_assessments (user_id, team_name, assessment_date)
    VALUES (?, ?, ?)
  `).run(session.id, teamName || 'My Team', assessmentDate || new Date().toISOString().split('T')[0]);

  const assessmentId = assessment.lastInsertRowid;

  // Insert template rows
  const insertRow = db.prepare(`
    INSERT INTO emb_rows (
      assessment_id, pivot_num, pivot_name, capability,
      l1_criteria, l2_criteria, l3_criteria, sort_order
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((rows: typeof EMB_TEMPLATE) => {
    for (const row of rows) {
      insertRow.run(
        assessmentId, row.pivot_num, row.pivot_name, row.capability,
        row.l1_criteria, row.l2_criteria, row.l3_criteria, row.sort_order
      );
    }
  });

  insertMany(EMB_TEMPLATE);

  return NextResponse.json({ success: true, assessmentId });
}

// PUT — save assessment data (rows)
export async function PUT(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Login required.' }, { status: 401 });

  const body = await req.json();
  const { assessmentId, teamName, notes, rows } = body;

  if (!assessmentId) return NextResponse.json({ error: 'assessmentId required.' }, { status: 400 });

  const db = getDb();

  // Verify ownership
  const assessment = db.prepare('SELECT * FROM emb_assessments WHERE id = ? AND user_id = ?').get(assessmentId, session.id);
  if (!assessment) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

  // Update assessment metadata
  db.prepare(`
    UPDATE emb_assessments
    SET team_name = ?, notes = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(teamName || 'My Team', notes || null, assessmentId);

  // Update rows
  if (Array.isArray(rows)) {
    const updateRow = db.prepare(`
      UPDATE emb_rows
      SET current_level = ?, score = ?, evidence = ?, row_notes = ?
      WHERE id = ? AND assessment_id = ?
    `);

    const saveRows = db.transaction((rowData: Array<{
      id: number; current_level: string; score: number; evidence: string; row_notes: string;
    }>) => {
      for (const row of rowData) {
        updateRow.run(row.current_level, row.score, row.evidence || null, row.row_notes || null, row.id, assessmentId);
      }
    });

    saveRows(rows);
  }

  return NextResponse.json({ success: true });
}

// DELETE — delete an assessment
export async function DELETE(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Login required.' }, { status: 401 });

  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required.' }, { status: 400 });

  const db = getDb();
  db.prepare('DELETE FROM emb_assessments WHERE id = ? AND user_id = ?').run(id, session.id);
  return NextResponse.json({ success: true });
}

// PATCH — add row, rename capability/pivot, reorder rows
export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: 'Login required.' }, { status: 401 });

  const body = await req.json();
  const db = getDb();

  // Add a new capability row
  if (body.action === 'add_row') {
    const { assessmentId, pivotNum, pivotName, capability, sortOrder } = body;
    const assessment = db.prepare('SELECT id FROM emb_assessments WHERE id = ? AND user_id = ?').get(assessmentId, session.id);
    if (!assessment) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    const result = db.prepare(`
      INSERT INTO emb_rows (assessment_id, pivot_num, pivot_name, capability,
        l1_criteria, l2_criteria, l3_criteria, current_level, score, sort_order)
      VALUES (?, ?, ?, ?, '', '', '', 'L1', 5, ?)
    `).run(assessmentId, pivotNum, pivotName, capability || 'New Capability', sortOrder ?? 999);
    const newRow = db.prepare('SELECT * FROM emb_rows WHERE id = ?').get(result.lastInsertRowid);
    return NextResponse.json({ success: true, row: newRow });
  }

  // Delete a single row
  if (body.action === 'delete_row') {
    const { rowId } = body;
    const row = db.prepare(`
      SELECT r.id FROM emb_rows r
      JOIN emb_assessments a ON a.id = r.assessment_id
      WHERE r.id = ? AND a.user_id = ?
    `).get(rowId, session.id);
    if (!row) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    db.prepare('DELETE FROM emb_rows WHERE id = ?').run(rowId);
    return NextResponse.json({ success: true });
  }

  // Rename a capability
  if (body.action === 'rename_capability') {
    const { rowId, capability } = body;
    const row = db.prepare(`
      SELECT r.id FROM emb_rows r
      JOIN emb_assessments a ON a.id = r.assessment_id
      WHERE r.id = ? AND a.user_id = ?
    `).get(rowId, session.id);
    if (!row) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    db.prepare('UPDATE emb_rows SET capability = ? WHERE id = ?').run(capability, rowId);
    return NextResponse.json({ success: true });
  }

  // Rename a pivot section
  if (body.action === 'rename_pivot') {
    const { assessmentId, pivotNum, pivotName } = body;
    const assessment = db.prepare('SELECT id FROM emb_assessments WHERE id = ? AND user_id = ?').get(assessmentId, session.id);
    if (!assessment) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    db.prepare('UPDATE emb_rows SET pivot_name = ? WHERE assessment_id = ? AND pivot_num = ?')
      .run(pivotName, assessmentId, pivotNum);
    return NextResponse.json({ success: true });
  }

  // Reorder rows — accepts [{ id, sort_order }, ...]
  if (body.action === 'reorder') {
    const { rows } = body as { rows: Array<{ id: number; sort_order: number }> };
    const update = db.prepare('UPDATE emb_rows SET sort_order = ? WHERE id = ?');
    db.transaction(() => { for (const r of rows) update.run(r.sort_order, r.id); })();
    return NextResponse.json({ success: true });
  }

  // Add a new pivot section
  if (body.action === 'add_pivot') {
    const { assessmentId, pivotNum, pivotName } = body;
    const assessment = db.prepare('SELECT id FROM emb_assessments WHERE id = ? AND user_id = ?').get(assessmentId, session.id);
    if (!assessment) return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    const result = db.prepare(`
      INSERT INTO emb_rows (assessment_id, pivot_num, pivot_name, capability,
        l1_criteria, l2_criteria, l3_criteria, current_level, score, sort_order)
      VALUES (?, ?, ?, 'New Capability', '', '', '', 'L1', 5, 0)
    `).run(assessmentId, pivotNum, pivotName || 'Custom Pivot');
    const newRow = db.prepare('SELECT * FROM emb_rows WHERE id = ?').get(result.lastInsertRowid);
    return NextResponse.json({ success: true, row: newRow });
  }

  return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
}
