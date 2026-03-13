'use client';
import { useState, useEffect, useRef } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────
interface EMBRow {
  id: number;
  pivot_num: number;
  pivot_name: string;
  capability: string;
  l1_criteria: string;
  l2_criteria: string;
  l3_criteria: string;
  current_level: string;
  score: number;
  evidence: string;
  row_notes: string;
  sort_order: number;
  isCustom?: boolean;
}

interface Assessment {
  id: number;
  team_name: string;
  assessment_date: string;
  notes: string;
  avg_score: number;
  row_count: number;
}

const LEVEL_COLOR: Record<string, string> = {
  L1: '#e88b7e', L2: '#C9A84C', L3: '#7ee8a2',
};
const LEVEL_BG: Record<string, string> = {
  L1: 'rgba(232,139,126,.12)', L2: 'rgba(201,168,76,.12)', L3: 'rgba(126,232,162,.12)',
};

// ── Inline editable field ─────────────────────────────────────────────────
function InlineEdit({ value, onSave, placeholder = 'Click to edit', style = {} }: {
  value: string; onSave: (v: string) => void;
  placeholder?: string; style?: React.CSSProperties;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);
  useEffect(() => { setDraft(value); }, [value]);

  function commit() {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) onSave(trimmed);
    else setDraft(value);
  }

  if (editing) return (
    <input
      ref={ref}
      value={draft}
      onChange={e => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(value); setEditing(false); } }}
      style={{ background: 'none', border: 'none', outline: 'none', fontFamily: 'inherit', width: '100%', padding: 0, ...style }}
    />
  );

  return (
    <span
      onClick={() => setEditing(true)}
      title="Click to rename"
      style={{ display: 'block', cursor: 'text', borderBottom: '1px dashed rgba(255,255,255,.15)', minWidth: 60, ...style }}
    >
      {value || <span style={{ color: 'var(--muted-2)', fontStyle: 'italic' }}>{placeholder}</span>}
    </span>
  );
}

// ── Main component ────────────────────────────────────────────────────────
export default function EMBSpreadsheet({ userId }: { userId: number }) {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [current, setCurrent] = useState<Assessment | null>(null);
  const [rows, setRows] = useState<EMBRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ rowId: number; label: string } | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAddPivot, setShowAddPivot] = useState(false);
  const [newPivotName, setNewPivotName] = useState('');
  const autoSaveRef = useRef<ReturnType<typeof setTimeout>>();

  // ── Data ─────────────────────────────────────────────────────────────────
  async function loadList() {
    const d = await fetch('/api/emb').then(r => r.json());
    setAssessments(d.assessments || []);
    setLoading(false);
  }

  async function loadAssessment(id: number) {
    setLoading(true);
    const d = await fetch(`/api/emb?id=${id}`).then(r => r.json());
    setCurrent(d.assessment);
    setRows((d.rows || []).map((r: EMBRow) => ({
      ...r,
      isCustom: !r.l1_criteria && !r.l2_criteria && !r.l3_criteria,
    })));
    setLoading(false);
  }

  useEffect(() => { loadList(); }, [userId]);

  // ── Save ──────────────────────────────────────────────────────────────────
  async function save(silent = false) {
    if (!current) return;
    if (!silent) setSaving(true);
    await fetch('/api/emb', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assessmentId: current.id,
        teamName: current.team_name,
        notes: current.notes,
        rows: rows.map(r => ({ id: r.id, current_level: r.current_level, score: r.score, evidence: r.evidence, row_notes: r.row_notes })),
      }),
    });
    if (!silent) { setSaving(false); setSavedMsg('✓ Saved'); setTimeout(() => setSavedMsg(''), 2500); }
  }

  function scheduleAutoSave() {
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(() => save(true), 3000);
  }

  function updateRow(id: number, key: keyof EMBRow, value: string | number) {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [key]: value } : r));
    scheduleAutoSave();
  }

  // ── Capability rename ─────────────────────────────────────────────────────
  async function renameCapability(rowId: number, capability: string) {
    setRows(prev => prev.map(r => r.id === rowId ? { ...r, capability } : r));
    await fetch('/api/emb', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'rename_capability', rowId, capability }),
    });
  }

  // ── Pivot rename ──────────────────────────────────────────────────────────
  async function renamePivot(pivotNum: number, pivotName: string) {
    setRows(prev => prev.map(r => r.pivot_num === pivotNum ? { ...r, pivot_name: pivotName } : r));
    await fetch('/api/emb', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'rename_pivot', assessmentId: current!.id, pivotNum, pivotName }),
    });
  }

  // ── Add capability to a pivot ─────────────────────────────────────────────
  async function addCapability(pivotNum: number, pivotName: string) {
    const pRows = rows.filter(r => r.pivot_num === pivotNum);
    const maxOrder = pRows.length ? Math.max(...pRows.map(r => r.sort_order)) : 0;
    const d = await fetch('/api/emb', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add_row', assessmentId: current!.id, pivotNum, pivotName, capability: 'New Capability', sortOrder: maxOrder + 1 }),
    }).then(r => r.json());
    if (d.row) setRows(prev => [...prev, { ...d.row, isCustom: true }]);
  }

  // ── Delete capability ─────────────────────────────────────────────────────
  async function deleteRow(rowId: number) {
    setRows(prev => prev.filter(r => r.id !== rowId));
    setConfirmDelete(null);
    await fetch('/api/emb', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete_row', rowId }),
    });
  }

  // ── Move row within pivot ─────────────────────────────────────────────────
  async function moveRow(rowId: number, dir: 'up' | 'down') {
    const row = rows.find(r => r.id === rowId);
    if (!row) return;
    const pRows = rows.filter(r => r.pivot_num === row.pivot_num).sort((a, b) => a.sort_order - b.sort_order);
    const idx = pRows.findIndex(r => r.id === rowId);
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= pRows.length) return;
    const swap = pRows[swapIdx];
    const reordered = pRows.map((r, i) => {
      if (i === idx) return { id: r.id, sort_order: swap.sort_order };
      if (i === swapIdx) return { id: r.id, sort_order: row.sort_order };
      return { id: r.id, sort_order: r.sort_order };
    });
    setRows(prev => prev.map(r => { const u = reordered.find(n => n.id === r.id); return u ? { ...r, sort_order: u.sort_order } : r; }));
    await fetch('/api/emb', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reorder', rows: reordered }),
    });
  }

  // ── Add custom pivot section ──────────────────────────────────────────────
  async function addPivotSection() {
    if (!newPivotName.trim() || !current) return;
    const existingNums = Array.from(new Set(rows.map(r => r.pivot_num)));
    const nextNum = Math.max(...existingNums, 4) + 1;
    const d = await fetch('/api/emb', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add_pivot', assessmentId: current.id, pivotNum: nextNum, pivotName: newPivotName.trim() }),
    }).then(r => r.json());
    if (d.row) setRows(prev => [...prev, { ...d.row, isCustom: true }]);
    setNewPivotName('');
    setShowAddPivot(false);
  }

  // ── Create assessment ─────────────────────────────────────────────────────
  async function createAssessment() {
    const d = await fetch('/api/emb', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamName: newTeamName || 'My Team', assessmentDate: newDate }),
    }).then(r => r.json());
    setShowNewModal(false);
    setNewTeamName('');
    await loadAssessment(d.assessmentId);
    loadList();
  }

  // ── Export CSV ────────────────────────────────────────────────────────────
  function exportCSV() {
    if (!rows.length || !current) return;
    const headers = ['Pivot', 'Capability', 'Level', 'Score', 'Evidence', 'Notes'];
    const data = [...rows]
      .sort((a, b) => a.pivot_num - b.pivot_num || a.sort_order - b.sort_order)
      .map(r => [`"${r.pivot_num}. ${r.pivot_name}"`, `"${r.capability}"`, r.current_level, r.score, `"${(r.evidence || '').replace(/"/g, '""')}"`, `"${(r.row_notes || '').replace(/"/g, '""')}"`]);
    const csv = [headers.join(','), ...data.map(r => r.join(','))].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `EMB-${current.team_name}-${current.assessment_date}.csv`;
    a.click();
  }

  // ── Derived stats ─────────────────────────────────────────────────────────
  const pivotNums = Array.from(new Set(rows.map(r => r.pivot_num))).sort((a, b) => a - b);
  const byPivot: Record<number, EMBRow[]> = {};
  rows.forEach(r => { if (!byPivot[r.pivot_num]) byPivot[r.pivot_num] = []; byPivot[r.pivot_num].push(r); });
  const overallLevel = !rows.length ? '—' : rows.filter(r => r.current_level === 'L3').length / rows.length > 0.6 ? 'L3' : (rows.filter(r => r.current_level === 'L2').length + rows.filter(r => r.current_level === 'L3').length) / rows.length > 0.6 ? 'L2' : 'L1';
  const avgScore = rows.length ? (rows.reduce((s, r) => s + (r.score || 1), 0) / rows.length).toFixed(1) : '—';

  // ─────────────────────────────────────────────────────────────────────────
  // Assessment list
  // ─────────────────────────────────────────────────────────────────────────
  if (!current) return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontWeight: 600, color: 'var(--cream)', marginBottom: 3 }}>Your Assessments</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>Create or open an assessment to score your team</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNewModal(true)}>+ New Assessment</button>
      </div>

      {loading && <div style={{ color: 'var(--muted)', fontSize: 13 }}>Loading…</div>}

      {!loading && !assessments.length && (
        <div style={{ background: 'var(--ink-3)', border: '1px solid var(--border)', borderRadius: 8, padding: 36, textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 14 }}>📊</div>
          <div style={{ fontWeight: 700, color: 'var(--cream)', marginBottom: 6 }}>No assessments yet</div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20, lineHeight: 1.6, maxWidth: 400, margin: '0 auto 20px' }}>
            Create your first assessment — pre-loaded with 17 standard EMB capabilities. Rename, remove, reorder, or add your own.
          </div>
          <button className="btn btn-primary" onClick={() => setShowNewModal(true)}>Create Your First Assessment</button>
        </div>
      )}

      {assessments.map(a => (
        <div key={a.id} className="card" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16, transition: 'border-color .2s' }}
          onClick={() => loadAssessment(a.id)}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--gold-d)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = '')}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: 'var(--cream)', marginBottom: 3 }}>{a.team_name}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>{a.assessment_date} · {a.row_count} capabilities · Avg: {a.avg_score || '—'}</div>
          </div>
          <div style={{ color: 'var(--gold)', fontSize: 13 }}>Open →</div>
        </div>
      ))}

      {showNewModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowNewModal(false); }}>
          <div className="modal-box">
            <div className="modal-head"><h3>New EMB Assessment</h3><button className="modal-close" onClick={() => setShowNewModal(false)}>×</button></div>
            <div className="modal-body">
              <div className="field"><label className="lbl">Team Name</label>
                <input className="inp" value={newTeamName} onChange={e => setNewTeamName(e.target.value)} placeholder="e.g. India Engineering Team" onKeyDown={e => e.key === 'Enter' && createAssessment()} />
              </div>
              <div className="field"><label className="lbl">Assessment Date</label>
                <input className="inp" type="date" value={newDate} onChange={e => setNewDate(e.target.value)} />
              </div>
              <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6, padding: '10px 14px', background: 'rgba(201,168,76,.05)', borderRadius: 6, border: '1px solid rgba(201,168,76,.12)' }}>
                Pre-loaded with all 17 standard capabilities across the 4 pivots. You can rename, remove, reorder, or add your own at any time.
              </div>
            </div>
            <div className="modal-foot">
              <button className="btn btn-ghost" onClick={() => setShowNewModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={createAssessment}>Create Assessment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Spreadsheet view
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        <button className="btn btn-ghost" style={{ fontSize: 12, padding: '7px 14px' }} onClick={() => { setCurrent(null); setRows([]); }}>← All</button>
        <div style={{ flex: 1 }}>
          <input value={current.team_name} onChange={e => setCurrent(p => p ? { ...p, team_name: e.target.value } : p)} onBlur={() => save(true)}
            style={{ background: 'none', border: 'none', color: 'var(--cream)', fontWeight: 700, fontSize: 17, fontFamily: 'var(--font-display)', outline: 'none', width: '100%' }} />
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>{current.assessment_date}</div>
        </div>
        {savedMsg && <span style={{ fontSize: 12, color: 'var(--green)' }}>{savedMsg}</span>}
        <button className="btn btn-outline" style={{ fontSize: 12, padding: '7px 14px' }} onClick={exportCSV}>⬇ CSV</button>
        <button className="btn btn-primary" style={{ fontSize: 12, padding: '7px 14px' }} onClick={() => save(false)} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
      </div>

      {/* Summary strip */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        <div style={{ background: 'var(--ink-3)', border: `1px solid ${LEVEL_COLOR[overallLevel] || 'var(--border)'}22`, borderRadius: 6, padding: '10px 16px', textAlign: 'center', minWidth: 90 }}>
          <div style={{ fontSize: 26, fontWeight: 900, color: LEVEL_COLOR[overallLevel] || 'var(--gold)', fontFamily: 'var(--font-display)', lineHeight: 1 }}>{overallLevel}</div>
          <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 3, textTransform: 'uppercase', letterSpacing: '.06em' }}>Overall</div>
        </div>
        <div style={{ background: 'var(--ink-3)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 16px', textAlign: 'center', minWidth: 70 }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--gold)', fontFamily: 'var(--font-display)', lineHeight: 1 }}>{avgScore}</div>
          <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 3, textTransform: 'uppercase', letterSpacing: '.06em' }}>Avg Score</div>
        </div>
        {pivotNums.map(pNum => {
          const pRows = byPivot[pNum] || [];
          const pAvg = pRows.length ? (pRows.reduce((s, r) => s + (r.score || 1), 0) / pRows.length).toFixed(1) : '—';
          const pName = pRows[0]?.pivot_name || `P${pNum}`;
          return (
            <div key={pNum} style={{ background: 'var(--ink-3)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 14px', textAlign: 'center', flex: 1, minWidth: 80 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--cream)', fontFamily: 'var(--font-display)', lineHeight: 1 }}>{pAvg}</div>
              <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 3 }} title={pName}>{pName.length > 14 ? pName.slice(0, 12) + '…' : pName}</div>
            </div>
          );
        })}
      </div>

      {/* Hint bar */}
      <div style={{ background: 'rgba(201,168,76,.05)', border: '1px solid rgba(201,168,76,.12)', borderRadius: 6, padding: '8px 14px', marginBottom: 18, fontSize: 12, color: 'var(--muted)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <span>✏️ <strong style={{ color: 'var(--cream)' }}>Click any underlined name</strong> to rename it</span>
        <span>➕ Use <strong style={{ color: 'var(--cream)' }}>+ Capability</strong> to add rows</span>
        <span>↕️ <strong style={{ color: 'var(--cream)' }}>▲▼</strong> to reorder within a pivot</span>
        <span>🔍 View L1/L2/L3 benchmark criteria</span>
        <span>🗑 Remove any capability</span>
      </div>

      {/* ── Pivot sections ───────────────────────────────────────────────── */}
      {pivotNums.map(pNum => {
        const pRows = (byPivot[pNum] || []).sort((a, b) => a.sort_order - b.sort_order);
        const pivotName = pRows[0]?.pivot_name || `Pivot ${pNum}`;
        const pAvg = pRows.length ? (pRows.reduce((s, r) => s + (r.score || 1), 0) / pRows.length).toFixed(1) : '—';
        const l3Count = pRows.filter(r => r.current_level === 'L3').length;

        return (
          <div key={pNum} style={{ marginBottom: 20 }}>

            {/* Pivot header row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(201,168,76,.06)', border: '1px solid rgba(201,168,76,.18)', borderRadius: '6px 6px 0 0', padding: '8px 14px' }}>
              <span style={{ fontWeight: 900, color: 'var(--gold)', fontSize: 14, flexShrink: 0, fontFamily: 'var(--font-display)' }}>{pNum}.</span>
              <div style={{ flex: 1 }}>
                <InlineEdit
                  value={pivotName}
                  onSave={name => renamePivot(pNum, name)}
                  style={{ color: 'var(--gold)', fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: '.07em' }}
                />
              </div>
              <span style={{ fontSize: 11, color: 'var(--muted)', flexShrink: 0 }}>Avg {pAvg} · {l3Count}/{pRows.length} at L3</span>
              <button onClick={() => addCapability(pNum, pivotName)}
                style={{ background: 'rgba(201,168,76,.12)', border: '1px solid rgba(201,168,76,.3)', color: 'var(--gold)', borderRadius: 4, padding: '4px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
                + Capability
              </button>
            </div>

            {/* Column headers */}
            <div style={{ display: 'grid', gridTemplateColumns: '26px 1fr 86px 52px 1fr 1fr 56px', background: 'var(--ink-3)', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
              {['', 'Capability', 'Level', 'Score', 'Evidence', 'Notes', ''].map((h, i) => (
                <div key={i} style={{ padding: '5px 10px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--muted-2)', textAlign: i === 3 ? 'center' : 'left' }}>{h}</div>
              ))}
            </div>

            {/* Capability rows */}
            <div style={{ border: '1px solid var(--border)', borderTop: 'none', borderRadius: '0 0 6px 6px', overflow: 'hidden' }}>
              {pRows.length === 0 && (
                <div style={{ padding: '14px', fontSize: 13, color: 'var(--muted)', textAlign: 'center', background: 'var(--ink-2)' }}>
                  No capabilities —{' '}
                  <button onClick={() => addCapability(pNum, pivotName)} style={{ background: 'none', border: 'none', color: 'var(--gold)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, padding: 0 }}>add one</button>
                </div>
              )}

              {pRows.map((row, idx) => (
                <div key={row.id}>

                  {/* Main row */}
                  <div
                    style={{ display: 'grid', gridTemplateColumns: '26px 1fr 86px 52px 1fr 1fr 56px', background: idx % 2 === 0 ? 'var(--ink-2)' : 'rgba(22,26,56,.6)', borderBottom: expandedRow === row.id ? 'none' : '1px solid rgba(255,255,255,.04)', transition: 'background .15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--ink-3)')}
                    onMouseLeave={e => (e.currentTarget.style.background = idx % 2 === 0 ? 'var(--ink-2)' : 'rgba(22,26,56,.6)')}
                  >

                    {/* ↑↓ reorder */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6px 2px', gap: 1 }}>
                      <button onClick={() => moveRow(row.id, 'up')} disabled={idx === 0}
                        style={{ background: 'none', border: 'none', fontSize: 9, padding: '2px 4px', cursor: idx === 0 ? 'default' : 'pointer', color: idx === 0 ? 'var(--ink-4)' : 'var(--muted-2)', lineHeight: 1 }}>▲</button>
                      <button onClick={() => moveRow(row.id, 'down')} disabled={idx === pRows.length - 1}
                        style={{ background: 'none', border: 'none', fontSize: 9, padding: '2px 4px', cursor: idx === pRows.length - 1 ? 'default' : 'pointer', color: idx === pRows.length - 1 ? 'var(--ink-4)' : 'var(--muted-2)', lineHeight: 1 }}>▼</button>
                    </div>

                    {/* Capability name — click to rename */}
                    <div style={{ padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 7 }}>
                      <InlineEdit
                        value={row.capability}
                        onSave={cap => renameCapability(row.id, cap)}
                        placeholder="Capability name"
                        style={{ fontWeight: 600, color: 'var(--cream)', fontSize: 13 }}
                      />
                      {row.isCustom && (
                        <span style={{ fontSize: 9, background: 'rgba(255,255,255,.06)', color: 'var(--muted-2)', borderRadius: 3, padding: '1px 5px', letterSpacing: '.04em', flexShrink: 0 }}>CUSTOM</span>
                      )}
                    </div>

                    {/* Level dropdown */}
                    <div style={{ padding: '7px 8px', display: 'flex', alignItems: 'center' }}>
                      <select
                        value={row.current_level}
                        onChange={e => updateRow(row.id, 'current_level', e.target.value)}
                        style={{ width: '100%', background: LEVEL_BG[row.current_level], border: `1px solid ${LEVEL_COLOR[row.current_level]}55`, color: LEVEL_COLOR[row.current_level], borderRadius: 4, padding: '4px 6px', fontSize: 12, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer', outline: 'none' }}
                      >
                        <option value="L1">L1</option>
                        <option value="L2">L2</option>
                        <option value="L3">L3</option>
                      </select>
                    </div>

                    {/* Score */}
                    <div style={{ padding: '7px 6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <input type="number" min={1} max={10} value={row.score || 1}
                        onChange={e => updateRow(row.id, 'score', Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                        style={{ width: 38, textAlign: 'center', fontWeight: 700, fontSize: 15, background: 'none', border: 'none', outline: 'none', fontFamily: 'inherit', color: (row.score || 1) >= 8 ? '#7ee8a2' : (row.score || 1) >= 5 ? '#C9A84C' : '#e88b7e' }}
                      />
                    </div>

                    {/* Evidence */}
                    <div style={{ padding: '6px 10px' }}>
                      <textarea value={row.evidence || ''} onChange={e => updateRow(row.id, 'evidence', e.target.value)}
                        placeholder="Specific examples from your team…" rows={2}
                        style={{ width: '100%', background: 'none', border: 'none', color: 'var(--cream)', fontFamily: 'inherit', fontSize: 12, outline: 'none', resize: 'none', padding: 0, lineHeight: 1.5 }}
                      />
                    </div>

                    {/* Notes */}
                    <div style={{ padding: '6px 10px' }}>
                      <textarea value={row.row_notes || ''} onChange={e => updateRow(row.id, 'row_notes', e.target.value)}
                        placeholder="Action items, gaps…" rows={2}
                        style={{ width: '100%', background: 'none', border: 'none', color: 'var(--cream)', fontFamily: 'inherit', fontSize: 12, outline: 'none', resize: 'none', padding: 0, lineHeight: 1.5 }}
                      />
                    </div>

                    {/* Actions */}
                    <div style={{ padding: '7px 6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
                      {/* Criteria toggle — only for template rows that have criteria */}
                      {(row.l1_criteria || row.l2_criteria || row.l3_criteria) && (
                        <button onClick={() => setExpandedRow(prev => prev === row.id ? null : row.id)}
                          title="View L1/L2/L3 benchmark criteria"
                          style={{ background: expandedRow === row.id ? 'rgba(201,168,76,.15)' : 'none', border: 'none', color: expandedRow === row.id ? 'var(--gold)' : 'var(--muted-2)', fontSize: 13, cursor: 'pointer', padding: '3px 5px', borderRadius: 3, lineHeight: 1 }}>🔍</button>
                      )}
                      {/* Delete */}
                      <button onClick={() => setConfirmDelete({ rowId: row.id, label: row.capability })}
                        title="Remove this capability"
                        style={{ background: 'none', border: 'none', color: 'var(--muted-2)', fontSize: 13, cursor: 'pointer', padding: '3px 5px', borderRadius: 3, lineHeight: 1, transition: 'color .15s' }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted-2)')}>🗑</button>
                    </div>
                  </div>

                  {/* Criteria expand — fixed benchmarks, read only */}
                  {expandedRow === row.id && (row.l1_criteria || row.l2_criteria || row.l3_criteria) && (
                    <div style={{ background: 'rgba(201,168,76,.04)', borderBottom: '1px solid rgba(201,168,76,.1)', borderLeft: '3px solid rgba(201,168,76,.25)', padding: '12px 14px' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 10 }}>Benchmark Criteria — {row.capability}</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                        {[{ level: 'L1', text: row.l1_criteria }, { level: 'L2', text: row.l2_criteria }, { level: 'L3', text: row.l3_criteria }].map(lc => (
                          <div key={lc.level}>
                            <div style={{ fontWeight: 700, color: LEVEL_COLOR[lc.level], fontSize: 10, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.08em' }}>{lc.level}</div>
                            <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.65 }}>{lc.text || '—'}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Add custom pivot section */}
      <div style={{ marginBottom: 22 }}>
        {!showAddPivot ? (
          <button onClick={() => setShowAddPivot(true)}
            style={{ width: '100%', background: 'rgba(255,255,255,.02)', border: '1px dashed rgba(255,255,255,.1)', borderRadius: 6, padding: '11px', color: 'var(--muted)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(201,168,76,.35)'; e.currentTarget.style.color = 'var(--gold)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.1)'; e.currentTarget.style.color = 'var(--muted)'; }}>
            + Add Custom Pivot Section
          </button>
        ) : (
          <div style={{ background: 'var(--ink-3)', border: '1px solid rgba(201,168,76,.2)', borderRadius: 6, padding: 14, display: 'flex', gap: 10, alignItems: 'center' }}>
            <input autoFocus value={newPivotName} onChange={e => setNewPivotName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addPivotSection(); if (e.key === 'Escape') { setShowAddPivot(false); setNewPivotName(''); } }}
              placeholder="e.g. Security & Compliance, Team Health, AI Readiness"
              style={{ flex: 1, background: 'var(--ink-2)', border: '1px solid var(--border-2)', color: 'var(--cream)', padding: '8px 12px', borderRadius: 4, fontFamily: 'inherit', fontSize: 13, outline: 'none' }} />
            <button className="btn btn-primary" style={{ fontSize: 12, padding: '8px 14px' }} onClick={addPivotSection}>Add</button>
            <button className="btn btn-ghost" style={{ fontSize: 12, padding: '8px 14px' }} onClick={() => { setShowAddPivot(false); setNewPivotName(''); }}>Cancel</button>
          </div>
        )}
      </div>

      {/* Bottom: overall notes + save */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <textarea className="inp" value={current.notes || ''} onChange={e => setCurrent(p => p ? { ...p, notes: e.target.value } : p)} onBlur={() => save(true)}
          rows={2} placeholder="Overall assessment notes…" style={{ flex: 1, resize: 'vertical' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button className="btn btn-outline" style={{ fontSize: 12 }} onClick={exportCSV}>⬇ Export CSV</button>
          <button className="btn btn-primary" style={{ fontSize: 12 }} onClick={() => save(false)} disabled={saving}>{saving ? 'Saving…' : savedMsg || 'Save'}</button>
        </div>
      </div>

      {/* Delete confirm */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setConfirmDelete(null); }}>
          <div className="modal-box" style={{ maxWidth: 380 }}>
            <div className="modal-head"><h3>Remove Capability</h3><button className="modal-close" onClick={() => setConfirmDelete(null)}>×</button></div>
            <div className="modal-body">
              <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.6 }}>
                Remove <strong style={{ color: 'var(--cream)' }}>{confirmDelete.label}</strong> from this assessment?
              </p>
            </div>
            <div className="modal-foot">
              <button className="btn btn-ghost" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button onClick={() => deleteRow(confirmDelete.rowId)}
                style={{ background: 'rgba(232,139,126,.12)', border: '1px solid rgba(232,139,126,.3)', color: 'var(--red)', borderRadius: 4, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
