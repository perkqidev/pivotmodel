'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Nav from '@/components/Nav';

type Tab = 'emb'|'drivers'|'benchmarks'|'scope'|'summary'|'kra'|'leadership';

const TABS: { id: Tab; label: string; num: number }[] = [
  { id:'emb', label:'1. Maturity', num:1 },
  { id:'drivers', label:'2. Business Drivers', num:2 },
  { id:'benchmarks', label:'3. Benchmarks', num:3 },
  { id:'scope', label:'4. Scope', num:4 },
  { id:'summary', label:'5. Summary', num:5 },
  { id:'kra', label:'6. Roles & KRA', num:6 },
  { id:'leadership', label:'7. Leadership', num:7 },
];

const LEVEL_LABELS: Record<string,string> = { L1:'◆ L1', L2:'⚙ L2', L3:'🚀 L3' };
const LEVEL_COLORS: Record<string,string> = { L1:'#ef4444', L2:'#f59e0b', L3:'#22c55e' };
const STATUS_COLORS: Record<string,string> = { 'on-track':'#22c55e','at-risk':'#f59e0b','off-track':'#ef4444','pending':'#6b7280','achieved':'#22c55e','in-progress':'#f59e0b','not-started':'#6b7280' };

function useAutoSave(data: unknown, saveFn: () => Promise<void>, deps: unknown[]) {
  const timerRef = useCallback(() => {}, []);
  useEffect(() => {
    const t = setTimeout(() => { saveFn().catch(() => {}); }, 1500);
    return () => clearTimeout(t);
  }, deps);
}

export default function AssessmentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('emb');
  const [assessment, setAssessment] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [collab, setCollab] = useState('');
  const [collabMsg, setCollabMsg] = useState('');
  const [showCollab, setShowCollab] = useState(false);

  useEffect(() => {
    fetch(`/api/assessments`).then(r => r.json()).then(d => {
      const all = [...(d.owned||[]), ...(d.shared||[])];
      const a = all.find((x: any) => String(x.id) === String(id));
      if (a) setAssessment(a);
    });
  }, [id]);

  async function addCollaborator() {
    if (!collab.trim()) return;
    const res = await fetch(`/api/assessments/${id}/collaborators`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ email: collab }) });
    const d = await res.json();
    setCollabMsg(d.success ? 'Collaborator added.' : d.error || 'Error');
    if (d.success) setCollab('');
  }

  async function exportExcel() {
    window.open(`/api/assessments/${id}/export`, '_blank');
  }

  const save = useCallback(async (endpoint: string, rows: unknown[]) => {
    setSaving(true);
    await fetch(`/api/assessments/${id}/${endpoint}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ rows }) });
    setSaving(false); setSaveMsg('Saved'); setTimeout(() => setSaveMsg(''), 2000);
  }, [id]);

  if (!assessment) return <div style={{minHeight:'100vh',background:'var(--ink)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--muted)'}}>Loading…</div>;

  return (
    <>
      <Nav />
      <div style={{ minHeight:'100vh',background:'var(--ink)',paddingTop:80 }}>
        {/* Header */}
        <div style={{ background:'var(--surface)',borderBottom:'1px solid var(--border)',padding:'16px 32px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:16 }}>
          <div style={{ display:'flex',alignItems:'center',gap:16 }}>
            <button onClick={() => router.push('/community')} style={{ background:'none',border:'1px solid var(--border)',borderRadius:8,padding:'6px 12px',color:'var(--muted)',fontSize:12,cursor:'pointer' }}>← Back</button>
            <div>
              <div style={{ fontWeight:700,color:'var(--fg)',fontSize:18 }}>{assessment.team_name}</div>
              <div style={{ color:'var(--muted)',fontSize:12 }}>{assessment.industry} · {assessment.assessment_date?.slice(0,10)||'No date'}</div>
            </div>
          </div>
          <div style={{ display:'flex',gap:8,alignItems:'center' }}>
            {saving && <span style={{color:'var(--muted)',fontSize:12}}>Saving…</span>}
            {saveMsg && <span style={{color:'#22c55e',fontSize:12}}>{saveMsg}</span>}
            <button onClick={() => setShowCollab(o=>!o)} style={{ background:'var(--card)',border:'1px solid var(--border)',borderRadius:8,padding:'6px 14px',color:'var(--fg)',fontSize:13,cursor:'pointer' }}>👥 Collaborators</button>
            <button onClick={exportExcel} style={{ background:'var(--gold)',border:'none',borderRadius:8,padding:'6px 14px',color:'#000',fontSize:13,fontWeight:700,cursor:'pointer' }}>📊 Export Excel</button>
          </div>
        </div>
        {showCollab && (
          <div style={{ background:'var(--card)',borderBottom:'1px solid var(--border)',padding:'12px 32px',display:'flex',gap:12,alignItems:'center' }}>
            <input value={collab} onChange={e=>setCollab(e.target.value)} placeholder="Collaborator email address" style={{ background:'var(--surface)',border:'1px solid var(--border)',borderRadius:8,padding:'8px 12px',color:'var(--fg)',fontSize:13,width:280,outline:'none' }} />
            <button onClick={addCollaborator} style={{ background:'var(--gold)',border:'none',borderRadius:8,padding:'8px 16px',color:'#000',fontWeight:700,fontSize:13,cursor:'pointer' }}>Invite</button>
            {collabMsg && <span style={{ fontSize:12,color:collabMsg.includes('Error')||collabMsg.includes('error')?'#ef4444':'#22c55e' }}>{collabMsg}</span>}
          </div>
        )}
        {/* Tabs */}
        <div style={{ display:'flex',gap:2,padding:'0 32px',background:'var(--surface)',borderBottom:'1px solid var(--border)',overflowX:'auto' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ padding:'12px 20px',background:'none',border:'none',borderBottom:`3px solid ${tab===t.id?'var(--gold)':'transparent'}`,color:tab===t.id?'var(--gold)':'var(--muted)',fontSize:13,fontWeight:tab===t.id?700:400,cursor:'pointer',whiteSpace:'nowrap' }}>
              {t.label}
            </button>
          ))}
        </div>
        {/* Module Content */}
        <div style={{ padding:32 }}>
          {tab === 'emb' && <EMBModule id={id} save={save} />}
          {tab === 'drivers' && <DriversModule id={id} save={save} />}
          {tab === 'benchmarks' && <BenchmarksModule id={id} save={save} />}
          {tab === 'scope' && <ScopeModule id={id} save={save} />}
          {tab === 'summary' && <SummaryModule id={id} />}
          {tab === 'kra' && <KRAModule id={id} save={save} />}
          {tab === 'leadership' && <LeadershipModule id={id} save={save} />}
        </div>
      </div>
    </>
  );
}

// ── Module 1: EMB ──────────────────────────────────────────────────────────────
function EMBModule({ id, save }: { id:string; save:(e:string,r:unknown[])=>Promise<void> }) {
  const [rows, setRows] = useState<any[]>([]);
  const [nudge, setNudge] = useState<{suggested_level:string;avg_score:number}|null>(null);
  useEffect(() => { fetch(`/api/assessments/${id}/emb`).then(r=>r.json()).then(d=>setRows(d.rows||[])); }, [id]);
  const pillars = [...new Set(rows.map(r => r.pivot_name))];
  async function doSave() {
    const res = await fetch(`/api/assessments/${id}/emb`, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ rows }) });
    const d = await res.json();
    if (d.intelligence) setNudge(d.intelligence);
  }
  useEffect(() => { if (!rows.length) return; const t = setTimeout(() => doSave(), 1500); return () => clearTimeout(t); }, [rows]);
  function update(rowId: number, field: string, val: string) { setRows(prev => prev.map(r => r.id===rowId ? {...r,[field]:val} : r)); }
  return (
    <div>
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24 }}>
        <div><h2 style={{color:'var(--fg)',margin:0}}>Engineering Maturity Benchmark</h2><p style={{color:'var(--muted)',fontSize:13,margin:'4px 0 0'}}>Rate each capability across 5 pillars. Changes auto-save.</p></div>
        <button onClick={async()=>{const res=await fetch(`/api/assessments/${id}/emb`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({})});const d=await res.json();if(d.id)setRows(prev=>[...prev,{id:d.id,pivot_num:1,pivot_name:'Operational Excellence',capability:'New Capability',current_level:'L1',score_icon:'diamond',evidence:'',gap_notes:'',sort_order:99}]);}} style={{background:'var(--gold)',border:'none',borderRadius:8,padding:'8px 16px',color:'#000',fontWeight:700,cursor:'pointer',fontSize:13}}>+ Add Row</button>
      </div>
      {nudge && <div style={{ background:'rgba(201,168,76,0.1)',border:'1px solid var(--gold)',borderRadius:12,padding:'12px 16px',marginBottom:24,fontSize:13,color:'var(--fg)' }}>💡 <strong>Intelligence Nudge:</strong> Based on your scores (avg {nudge.avg_score}/3), the computed maturity level is <strong style={{color:'var(--gold)'}}>{nudge.suggested_level}</strong>. Consider adjusting your overall rating.</div>}
      {pillars.map(pillar => (
        <div key={pillar} style={{ marginBottom:32 }}>
          <div style={{ fontWeight:700,color:'var(--gold)',fontSize:14,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em' }}>{pillar}</div>
          <div style={{ background:'var(--surface)',borderRadius:12,overflow:'hidden',border:'1px solid var(--border)' }}>
            <div style={{ display:'grid',gridTemplateColumns:'2fr 2fr 2fr 2fr 120px 1fr 1fr',gap:0,background:'var(--card)',padding:'10px 16px',fontSize:12,fontWeight:600,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.05em' }}>
              <div>Capability</div><div>L1 Criteria</div><div>L2 Criteria</div><div>L3 Criteria</div><div>Level</div><div>Evidence</div><div>Gap Notes</div>
            </div>
            {rows.filter(r=>r.pivot_name===pillar).map((row,i) => (
              <div key={row.id} style={{ display:'grid',gridTemplateColumns:'2fr 2fr 2fr 2fr 120px 1fr 1fr',gap:0,padding:'10px 16px',borderTop:'1px solid var(--border)',background:i%2===0?'transparent':'rgba(255,255,255,0.02)',alignItems:'start' }}>
                <div style={{ color:'var(--fg)',fontSize:13,fontWeight:500,paddingRight:8 }}>{row.capability}</div>
                <div style={{ color:'var(--muted)',fontSize:12,paddingRight:8,lineHeight:1.4 }}>{row.l1_criteria}</div>
                <div style={{ color:'var(--muted)',fontSize:12,paddingRight:8,lineHeight:1.4 }}>{row.l2_criteria}</div>
                <div style={{ color:'var(--muted)',fontSize:12,paddingRight:8,lineHeight:1.4 }}>{row.l3_criteria}</div>
                <select value={row.current_level||'L1'} onChange={e=>update(row.id,'current_level',e.target.value)} style={{ background:'var(--card)',border:'1px solid var(--border)',borderRadius:6,padding:'4px 8px',color:LEVEL_COLORS[row.current_level||'L1'],fontWeight:700,fontSize:13,cursor:'pointer',outline:'none' }}>
                  {['L1','L2','L3'].map(l=><option key={l} value={l}>{LEVEL_LABELS[l]}</option>)}
                </select>
                <textarea value={row.evidence||''} onChange={e=>update(row.id,'evidence',e.target.value)} placeholder="Evidence…" rows={2} style={{ background:'var(--card)',border:'1px solid var(--border)',borderRadius:6,padding:'4px 8px',color:'var(--fg)',fontSize:12,resize:'vertical',width:'100%',outline:'none' }} />
                <textarea value={row.gap_notes||''} onChange={e=>update(row.id,'gap_notes',e.target.value)} placeholder="Gap notes…" rows={2} style={{ background:'var(--card)',border:'1px solid var(--border)',borderRadius:6,padding:'4px 8px',color:'var(--fg)',fontSize:12,resize:'vertical',width:'100%',outline:'none' }} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Module 2: Business Drivers ─────────────────────────────────────────────────
function DriversModule({ id, save }: { id:string; save:(e:string,r:unknown[])=>Promise<void> }) {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { fetch(`/api/assessments/${id}/drivers`).then(r=>r.json()).then(d=>setRows(d.rows||[])); }, [id]);
  useEffect(() => { if (!rows.length) return; const t = setTimeout(() => save('drivers',rows), 1500); return () => clearTimeout(t); }, [rows]);
  function update(rowId: number, field: string, val: string) { setRows(prev=>prev.map(r=>r.id===rowId?{...r,[field]:val}:r)); }
  async function addRow() { const res = await fetch(`/api/assessments/${id}/drivers`,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'}); const d=await res.json(); if(d.id) setRows(prev=>[...prev,{id:d.id,category:'Cost',driver_name:'New Driver',description:'',current_state:'',target_state:'',priority:'Medium',notes:''}]); }
  async function deleteRow(rowId: number) { await fetch(`/api/assessments/${id}/drivers`,{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({row_id:rowId})}); setRows(prev=>prev.filter(r=>r.id!==rowId)); }
  const CATS = ['Cost','Scale','Expansion','Risk','Other'];
  const PRIOS = ['High','Medium','Low'];
  return (
    <div>
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24 }}>
        <div><h2 style={{color:'var(--fg)',margin:0}}>Business Drivers</h2><p style={{color:'var(--muted)',fontSize:13,margin:'4px 0 0'}}>Why the team exists — cost, scale, expansion, and strategic rationale.</p></div>
        <button onClick={addRow} style={{background:'var(--gold)',border:'none',borderRadius:8,padding:'8px 16px',color:'#000',fontWeight:700,cursor:'pointer',fontSize:13}}>+ Add Driver</button>
      </div>
      <div style={{ background:'var(--surface)',borderRadius:12,overflow:'hidden',border:'1px solid var(--border)' }}>
        <div style={{ display:'grid',gridTemplateColumns:'120px 1fr 1.5fr 1.5fr 1.5fr 100px 1fr 40px',gap:0,background:'var(--card)',padding:'10px 16px',fontSize:12,fontWeight:600,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.05em' }}>
          <div>Category</div><div>Driver</div><div>Description</div><div>Current State</div><div>Target State</div><div>Priority</div><div>Notes</div><div></div>
        </div>
        {rows.map((row,i) => (
          <div key={row.id} style={{ display:'grid',gridTemplateColumns:'120px 1fr 1.5fr 1.5fr 1.5fr 100px 1fr 40px',gap:0,padding:'10px 16px',borderTop:'1px solid var(--border)',background:i%2===0?'transparent':'rgba(255,255,255,0.02)',alignItems:'start' }}>
            <select value={row.category} onChange={e=>update(row.id,'category',e.target.value)} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:6,padding:'4px 8px',color:'var(--fg)',fontSize:12,cursor:'pointer',outline:'none'}}>
              {CATS.map(c=><option key={c}>{c}</option>)}
            </select>
            <input value={row.driver_name} onChange={e=>update(row.id,'driver_name',e.target.value)} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:6,padding:'4px 8px',color:'var(--fg)',fontSize:12,outline:'none',width:'100%'}} />
            <textarea value={row.description||''} onChange={e=>update(row.id,'description',e.target.value)} rows={2} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:6,padding:'4px 8px',color:'var(--fg)',fontSize:12,resize:'vertical',width:'100%',outline:'none'}} />
            <textarea value={row.current_state||''} onChange={e=>update(row.id,'current_state',e.target.value)} rows={2} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:6,padding:'4px 8px',color:'var(--fg)',fontSize:12,resize:'vertical',width:'100%',outline:'none'}} />
            <textarea value={row.target_state||''} onChange={e=>update(row.id,'target_state',e.target.value)} rows={2} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:6,padding:'4px 8px',color:'var(--fg)',fontSize:12,resize:'vertical',width:'100%',outline:'none'}} />
            <select value={row.priority} onChange={e=>update(row.id,'priority',e.target.value)} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:6,padding:'4px 8px',color:row.priority==='High'?'#ef4444':row.priority==='Medium'?'#f59e0b':'#22c55e',fontWeight:600,fontSize:12,cursor:'pointer',outline:'none'}}>
              {PRIOS.map(p=><option key={p}>{p}</option>)}
            </select>
            <textarea value={row.notes||''} onChange={e=>update(row.id,'notes',e.target.value)} rows={2} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:6,padding:'4px 8px',color:'var(--fg)',fontSize:12,resize:'vertical',width:'100%',outline:'none'}} />
            <button onClick={()=>deleteRow(row.id)} style={{background:'none',border:'none',color:'#ef4444',cursor:'pointer',fontSize:16,padding:4}}>✕</button>
          </div>
        ))}
        {rows.length===0 && <div style={{padding:32,textAlign:'center',color:'var(--muted)',fontSize:13}}>No drivers yet. Click + Add Driver to start.</div>}
      </div>
    </div>
  );
}

// ── Module 3: Benchmarks ───────────────────────────────────────────────────────
function BenchmarksModule({ id, save }: { id:string; save:(e:string,r:unknown[])=>Promise<void> }) {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { fetch(`/api/assessments/${id}/benchmarks`).then(r=>r.json()).then(d=>setRows(d.rows||[])); }, [id]);
  useEffect(() => { if (!rows.length) return; const t = setTimeout(() => save('benchmarks',rows), 1500); return () => clearTimeout(t); }, [rows]);
  function update(rowId: number, field: string, val: string) { setRows(prev=>prev.map(r=>r.id===rowId?{...r,[field]:val}:r)); }
  async function addRow() { const res=await fetch(`/api/assessments/${id}/benchmarks`,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'}); const d=await res.json(); if(d.id) setRows(prev=>[...prev,{id:d.id,pillar:'Delivery',kpi_name:'New KPI',unit:'%',target_value:'',current_value:'',status:'pending',notes:''}]); }
  const pillars = [...new Set(rows.map(r => r.pillar))];
  const STATUSES = ['pending','on-track','at-risk','off-track'];
  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24}}>
        <div><h2 style={{color:'var(--fg)',margin:0}}>Performance Benchmarks</h2><p style={{color:'var(--muted)',fontSize:13,margin:'4px 0 0'}}>~27 KPIs across Delivery, Quality, People, and Operations pillars.</p></div>
        <button onClick={addRow} style={{background:'var(--gold)',border:'none',borderRadius:8,padding:'8px 16px',color:'#000',fontWeight:700,cursor:'pointer',fontSize:13}}>+ Add KPI</button>
      </div>
      {pillars.map(pillar => (
        <div key={pillar} style={{marginBottom:28}}>
          <div style={{fontWeight:700,color:'var(--gold)',fontSize:14,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.05em'}}>{pillar}</div>
          <div style={{background:'var(--surface)',borderRadius:12,overflow:'hidden',border:'1px solid var(--border)'}}>
            <div style={{display:'grid',gridTemplateColumns:'2fr 80px 100px 100px 120px 1fr 40px',gap:0,background:'var(--card)',padding:'10px 16px',fontSize:12,fontWeight:600,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.05em'}}>
              <div>KPI</div><div>Unit</div><div>Target</div><div>Current</div><div>Status</div><div>Notes</div><div></div>
            </div>
            {rows.filter(r=>r.pillar===pillar).map((row,i)=>(
              <div key={row.id} style={{display:'grid',gridTemplateColumns:'2fr 80px 100px 100px 120px 1fr 40px',gap:0,padding:'10px 16px',borderTop:'1px solid var(--border)',background:i%2===0?'transparent':'rgba(255,255,255,0.02)',alignItems:'center'}}>
                <div style={{color:'var(--fg)',fontSize:13}}>{row.kpi_name}</div>
                <div style={{color:'var(--muted)',fontSize:12}}>{row.unit}</div>
                <div style={{color:'var(--muted)',fontSize:12}}>{row.target_value}</div>
                <input value={row.current_value||''} onChange={e=>update(row.id,'current_value',e.target.value)} placeholder="–" style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:6,padding:'4px 8px',color:'var(--fg)',fontSize:13,outline:'none',width:'100%'}} />
                <select value={row.status} onChange={e=>update(row.id,'status',e.target.value)} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:6,padding:'4px 8px',color:STATUS_COLORS[row.status],fontWeight:600,fontSize:12,cursor:'pointer',outline:'none'}}>
                  {STATUSES.map(s=><option key={s}>{s}</option>)}
                </select>
                <input value={row.notes||''} onChange={e=>update(row.id,'notes',e.target.value)} placeholder="Notes…" style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:6,padding:'4px 8px',color:'var(--fg)',fontSize:12,outline:'none',width:'100%'}} />
                <button onClick={async()=>{await fetch(`/api/assessments/${id}/benchmarks`,{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({row_id:row.id})});setRows(prev=>prev.filter(r=>r.id!==row.id));}} style={{background:'none',border:'none',color:'#ef4444',cursor:'pointer',fontSize:16,padding:4}}>✕</button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Module 4: Scope ────────────────────────────────────────────────────────────
function ScopeModule({ id, save }: { id:string; save:(e:string,r:unknown[])=>Promise<void> }) {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { fetch(`/api/assessments/${id}/scope`).then(r=>r.json()).then(d=>setRows(d.rows||[])); }, [id]);
  useEffect(() => { if (!rows.length) return; const t = setTimeout(() => save('scope',rows), 1500); return () => clearTimeout(t); }, [rows]);
  function update(rowId: number, field: string, val: string|number) { setRows(prev=>prev.map(r=>r.id===rowId?{...r,[field]:val}:r)); }
  const pillars = [...new Set(rows.map(r => r.pillar))];
  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24}}>
        <div><h2 style={{color:'var(--fg)',margin:0}}>Scope of Product Engineering</h2><p style={{color:'var(--muted)',fontSize:13,margin:'4px 0 0'}}>Per-activity required vs current level across 5 pillars. Gap is computed automatically.</p></div>
        <button onClick={async()=>{const res=await fetch(`/api/assessments/${id}/scope`,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});const d=await res.json();if(d.id)setRows(prev=>[...prev,{id:d.id,pillar:'Operational Excellence',activity:'New Activity',required_level:1,current_level:1,gap:0,notes:''}]);}} style={{background:'var(--gold)',border:'none',borderRadius:8,padding:'8px 16px',color:'#000',fontWeight:700,cursor:'pointer',fontSize:13}}>+ Add Activity</button>
      </div>
      {pillars.map(pillar=>(
        <div key={pillar} style={{marginBottom:28}}>
          <div style={{fontWeight:700,color:'var(--gold)',fontSize:14,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.05em'}}>{pillar}</div>
          <div style={{background:'var(--surface)',borderRadius:12,overflow:'hidden',border:'1px solid var(--border)'}}>
            <div style={{display:'grid',gridTemplateColumns:'2fr 120px 120px 80px 1fr 40px',gap:0,background:'var(--card)',padding:'10px 16px',fontSize:12,fontWeight:600,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.05em'}}>
              <div>Activity</div><div>Required Level (1–3)</div><div>Current Level (1–3)</div><div>Gap</div><div>Notes</div><div></div>
            </div>
            {rows.filter(r=>r.pillar===pillar).map((row,i)=>(
              <div key={row.id} style={{display:'grid',gridTemplateColumns:'2fr 120px 120px 80px 1fr 40px',gap:0,padding:'10px 16px',borderTop:'1px solid var(--border)',background:i%2===0?'transparent':'rgba(255,255,255,0.02)',alignItems:'center'}}>
                <div style={{color:'var(--fg)',fontSize:13}}>{row.activity}</div>
                <input type="number" min={1} max={3} value={row.required_level} onChange={e=>update(row.id,'required_level',parseInt(e.target.value))} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:6,padding:'4px 8px',color:'var(--fg)',fontSize:13,outline:'none',width:80}} />
                <input type="number" min={1} max={3} value={row.current_level} onChange={e=>update(row.id,'current_level',parseInt(e.target.value))} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:6,padding:'4px 8px',color:'var(--fg)',fontSize:13,outline:'none',width:80}} />
                <div style={{fontWeight:700,color:row.gap>0?'#ef4444':'#22c55e',fontSize:14}}>{row.gap>0?`-${row.gap}`:'✓'}</div>
                <input value={row.notes||''} onChange={e=>update(row.id,'notes',e.target.value)} placeholder="Notes…" style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:6,padding:'4px 8px',color:'var(--fg)',fontSize:12,outline:'none',width:'100%'}} />
                <button onClick={async()=>{await fetch(`/api/assessments/${id}/scope`,{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({row_id:row.id})});setRows(prev=>prev.filter(r=>r.id!==row.id));}} style={{background:'none',border:'none',color:'#ef4444',cursor:'pointer',fontSize:16,padding:4}}>✕</button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Module 5: Summary (Radar Chart) ───────────────────────────────────────────
function SummaryModule({ id }: { id:string }) {
  const [embRows, setEmbRows] = useState<any[]>([]);
  const [scopeRows, setScopeRows] = useState<any[]>([]);
  useEffect(() => {
    fetch(`/api/assessments/${id}/emb`).then(r=>r.json()).then(d=>setEmbRows(d.rows||[]));
    fetch(`/api/assessments/${id}/scope`).then(r=>r.json()).then(d=>setScopeRows(d.rows||[]));
  }, [id]);
  const PILLARS = ['Operational Excellence','Pace of Product Evolution','Collaboration & Alignment','Business Results','People & Talent'];
  const embScores = PILLARS.map(p => {
    const pr = embRows.filter(r=>r.pivot_name===p);
    if (!pr.length) return 0;
    return pr.reduce((a,r)=>a+(r.current_level==='L3'?3:r.current_level==='L2'?2:1),0)/pr.length;
  });
  const scopeScores = PILLARS.map(p => {
    const pr = scopeRows.filter(r=>r.pillar===p);
    if (!pr.length) return 0;
    const avgCurrent = pr.reduce((a,r)=>a+(r.current_level||1),0)/pr.length;
    return avgCurrent;
  });
  const cx=200, cy=200, r=150;
  function polarToXY(angle: number, radius: number) { const a=(angle-90)*Math.PI/180; return { x:cx+radius*Math.cos(a), y:cy+radius*Math.sin(a) }; }
  const N=5; const angles=Array.from({length:N},(_,i)=>i*(360/N));
  function pathFromScores(scores: number[], maxScore: number) {
    const pts = scores.map((s,i)=>polarToXY(angles[i], (s/maxScore)*r));
    return pts.map((p,i)=>`${i===0?'M':'L'}${p.x},${p.y}`).join(' ')+'Z';
  }
  const gridLevels = [1,2,3];
  return (
    <div>
      <h2 style={{color:'var(--fg)',marginBottom:8}}>Competency Maturity Summary</h2>
      <p style={{color:'var(--muted)',fontSize:13,marginBottom:32}}>Auto-derived from Modules 1 (Maturity) and 4 (Scope). No manual input.</p>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:32}}>
        <div style={{background:'var(--surface)',borderRadius:16,padding:24,border:'1px solid var(--border)'}}>
          <div style={{fontWeight:700,color:'var(--fg)',marginBottom:16}}>Maturity Radar (Module 1)</div>
          <svg width={400} height={400} style={{display:'block',margin:'0 auto'}}>
            {gridLevels.map(l=>(
              <polygon key={l} points={angles.map(a=>{const p=polarToXY(a,(l/3)*r);return `${p.x},${p.y}`;}).join(' ')} fill="none" stroke="var(--border)" strokeWidth={1} />
            ))}
            {angles.map((a,i)=>{const p=polarToXY(a,r+20);return<text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fontSize={11} fill="var(--muted)" style={{fontSize:11}}>{PILLARS[i].split(' ')[0]}</text>;})}
            <path d={pathFromScores(embScores,3)} fill="rgba(201,168,76,0.2)" stroke="var(--gold)" strokeWidth={2} />
            <path d={pathFromScores(scopeScores,3)} fill="rgba(99,172,255,0.1)" stroke="#63acff" strokeWidth={2} strokeDasharray="4,4" />
          </svg>
          <div style={{display:'flex',gap:16,justifyContent:'center',marginTop:8}}>
            <div style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:'var(--muted)'}}><div style={{width:20,height:3,background:'var(--gold)'}}></div>Maturity (M1)</div>
            <div style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:'var(--muted)'}}><div style={{width:20,height:3,background:'#63acff',borderTop:'2px dashed #63acff'}}></div>Scope (M4)</div>
          </div>
        </div>
        <div style={{background:'var(--surface)',borderRadius:16,padding:24,border:'1px solid var(--border)'}}>
          <div style={{fontWeight:700,color:'var(--fg)',marginBottom:16}}>Pillar Breakdown</div>
          {PILLARS.map((p,i)=>(
            <div key={p} style={{marginBottom:16}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                <div style={{fontSize:13,color:'var(--fg)'}}>{p}</div>
                <div style={{fontSize:12,color:'var(--muted)'}}>{(embScores[i]/3*100).toFixed(0)}%</div>
              </div>
              <div style={{background:'var(--card)',borderRadius:4,height:8,overflow:'hidden'}}>
                <div style={{width:`${(embScores[i]/3)*100}%`,height:'100%',background:'var(--gold)',borderRadius:4,transition:'width 0.5s'}}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Module 6: KRA ──────────────────────────────────────────────────────────────
function KRAModule({ id, save }: { id:string; save:(e:string,r:unknown[])=>Promise<void> }) {
  const [rows, setRows] = useState<any[]>([]);
  const [roleFilter, setRoleFilter] = useState('All');
  useEffect(() => { fetch(`/api/assessments/${id}/kra`).then(r=>r.json()).then(d=>setRows(d.rows||[])); }, [id]);
  useEffect(() => { if (!rows.length) return; const t = setTimeout(() => save('kra',rows), 1500); return () => clearTimeout(t); }, [rows]);
  function update(rowId: number, field: string, val: string) { setRows(prev=>prev.map(r=>r.id===rowId?{...r,[field]:val}:r)); }
  const ROLES=['VP','Director','Manager','Developer']; const STATUSES=['not-started','in-progress','achieved'];
  const filtered = roleFilter==='All' ? rows : rows.filter(r=>r.role_level===roleFilter);
  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24}}>
        <div><h2 style={{color:'var(--fg)',margin:0}}>Roles & Performance KRA</h2><p style={{color:'var(--muted)',fontSize:13,margin:'4px 0 0'}}>Key Result Areas by role level.</p></div>
        <div style={{display:'flex',gap:8}}>
          {['All',...ROLES].map(r=><button key={r} onClick={()=>setRoleFilter(r)} style={{background:roleFilter===r?'var(--gold)':'var(--card)',border:'1px solid var(--border)',borderRadius:6,padding:'6px 12px',color:roleFilter===r?'#000':'var(--fg)',fontSize:12,fontWeight:roleFilter===r?700:400,cursor:'pointer'}}>{r}</button>)}
          <button onClick={async()=>{const res=await fetch(`/api/assessments/${id}/kra`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({role_level:roleFilter==='All'?'Manager':roleFilter})});const d=await res.json();if(d.id)setRows(prev=>[...prev,{id:d.id,role_level:roleFilter==='All'?'Manager':roleFilter,person_name:'',kra_name:'New KRA',description:'',target:'',current:'',status:'not-started',notes:''}]);}} style={{background:'var(--gold)',border:'none',borderRadius:8,padding:'6px 14px',color:'#000',fontWeight:700,cursor:'pointer',fontSize:13}}>+ Add KRA</button>
        </div>
      </div>
      <div style={{background:'var(--surface)',borderRadius:12,overflow:'hidden',border:'1px solid var(--border)'}}>
        <div style={{display:'grid',gridTemplateColumns:'100px 120px 1.5fr 2fr 1fr 1fr 120px 1fr 40px',gap:0,background:'var(--card)',padding:'10px 16px',fontSize:12,fontWeight:600,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.05em'}}>
          <div>Role</div><div>Person</div><div>KRA</div><div>Description</div><div>Target</div><div>Current</div><div>Status</div><div>Notes</div><div></div>
        </div>
        {filtered.map((row,i)=>(
          <div key={row.id} style={{display:'grid',gridTemplateColumns:'100px 120px 1.5fr 2fr 1fr 1fr 120px 1fr 40px',gap:0,padding:'10px 16px',borderTop:'1px solid var(--border)',background:i%2===0?'transparent':'rgba(255,255,255,0.02)',alignItems:'start'}}>
            <select value={row.role_level} onChange={e=>update(row.id,'role_level',e.target.value)} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:6,padding:'4px',color:'var(--fg)',fontSize:12,cursor:'pointer',outline:'none'}}>
              {ROLES.map(r=><option key={r}>{r}</option>)}
            </select>
            <input value={row.person_name||''} onChange={e=>update(row.id,'person_name',e.target.value)} placeholder="Name…" style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:6,padding:'4px 6px',color:'var(--fg)',fontSize:12,outline:'none',width:'100%'}} />
            <input value={row.kra_name} onChange={e=>update(row.id,'kra_name',e.target.value)} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:6,padding:'4px 6px',color:'var(--fg)',fontSize:12,outline:'none',width:'100%'}} />
            <textarea value={row.description||''} onChange={e=>update(row.id,'description',e.target.value)} rows={2} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:6,padding:'4px 6px',color:'var(--fg)',fontSize:12,resize:'vertical',width:'100%',outline:'none'}} />
            <input value={row.target||''} onChange={e=>update(row.id,'target',e.target.value)} placeholder="Target…" style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:6,padding:'4px 6px',color:'var(--fg)',fontSize:12,outline:'none',width:'100%'}} />
            <input value={row.current||''} onChange={e=>update(row.id,'current',e.target.value)} placeholder="Current…" style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:6,padding:'4px 6px',color:'var(--fg)',fontSize:12,outline:'none',width:'100%'}} />
            <select value={row.status} onChange={e=>update(row.id,'status',e.target.value)} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:6,padding:'4px',color:STATUS_COLORS[row.status],fontWeight:600,fontSize:12,cursor:'pointer',outline:'none'}}>
              {STATUSES.map(s=><option key={s}>{s}</option>)}
            </select>
            <textarea value={row.notes||''} onChange={e=>update(row.id,'notes',e.target.value)} rows={2} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:6,padding:'4px 6px',color:'var(--fg)',fontSize:12,resize:'vertical',width:'100%',outline:'none'}} />
            <button onClick={async()=>{await fetch(`/api/assessments/${id}/kra`,{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({row_id:row.id})});setRows(prev=>prev.filter(r=>r.id!==row.id));}} style={{background:'none',border:'none',color:'#ef4444',cursor:'pointer',fontSize:16,padding:4}}>✕</button>
          </div>
        ))}
        {filtered.length===0 && <div style={{padding:32,textAlign:'center',color:'var(--muted)',fontSize:13}}>No KRAs yet.</div>}
      </div>
    </div>
  );
}

// ── Module 7: Leadership ───────────────────────────────────────────────────────
function LeadershipModule({ id, save }: { id:string; save:(e:string,r:unknown[])=>Promise<void> }) {
  const [rows, setRows] = useState<any[]>([]);
  const [newLeader, setNewLeader] = useState('');
  const [newRole, setNewRole] = useState('');
  useEffect(() => { fetch(`/api/assessments/${id}/leadership`).then(r=>r.json()).then(d=>setRows(d.rows||[])); }, [id]);
  useEffect(() => { if (!rows.length) return; const t = setTimeout(() => save('leadership',rows), 1500); return () => clearTimeout(t); }, [rows]);
  function update(rowId: number, field: string, val: string|number) { setRows(prev=>prev.map(r=>r.id===rowId?{...r,[field]:val}:r)); }
  const leaders = [...new Set(rows.map(r=>r.leader_name))];
  async function addLeader() {
    if (!newLeader.trim()) return;
    const res=await fetch(`/api/assessments/${id}/leadership`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({leader_name:newLeader,leader_role:newRole})});
    const d=await res.json();
    if(d.success){fetch(`/api/assessments/${id}/leadership`).then(r=>r.json()).then(d=>setRows(d.rows||[]));setNewLeader('');setNewRole('');}
  }
  async function deleteLeader(leader_name: string) { await fetch(`/api/assessments/${id}/leadership`,{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({leader_name})}); setRows(prev=>prev.filter(r=>r.leader_name!==leader_name)); }
  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24}}>
        <div><h2 style={{color:'var(--fg)',margin:0}}>Leadership Qualities</h2><p style={{color:'var(--muted)',fontSize:13,margin:'4px 0 0'}}>20 skills per leader. Mandatory skills are flagged. Score 0–10.</p></div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <input value={newLeader} onChange={e=>setNewLeader(e.target.value)} placeholder="Leader name" style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:8,padding:'8px 12px',color:'var(--fg)',fontSize:13,outline:'none',width:160}} />
          <input value={newRole} onChange={e=>setNewRole(e.target.value)} placeholder="Role title" style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:8,padding:'8px 12px',color:'var(--fg)',fontSize:13,outline:'none',width:140}} />
          <button onClick={addLeader} style={{background:'var(--gold)',border:'none',borderRadius:8,padding:'8px 16px',color:'#000',fontWeight:700,cursor:'pointer',fontSize:13}}>+ Add Leader</button>
        </div>
      </div>
      {leaders.map(leader=>{
        const leaderRows = rows.filter(r=>r.leader_name===leader);
        const leaderRole = leaderRows[0]?.leader_role||'';
        const mandatoryScore = leaderRows.filter(r=>r.is_mandatory).reduce((a,r)=>a+r.score,0);
        const mandatoryMax = leaderRows.filter(r=>r.is_mandatory).length*10;
        const totalScore = leaderRows.reduce((a,r)=>a+r.score,0);
        return (
          <div key={leader} style={{marginBottom:32}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
              <div>
                <span style={{fontWeight:700,color:'var(--gold)',fontSize:16}}>{leader}</span>
                {leaderRole&&<span style={{color:'var(--muted)',fontSize:13,marginLeft:8}}>{leaderRole}</span>}
                <span style={{color:'var(--muted)',fontSize:12,marginLeft:16}}>Total: {totalScore}/{leaderRows.length*10} · Mandatory: {mandatoryScore}/{mandatoryMax}</span>
              </div>
              <button onClick={()=>deleteLeader(leader)} style={{background:'none',border:'1px solid #ef4444',borderRadius:6,padding:'4px 10px',color:'#ef4444',cursor:'pointer',fontSize:12}}>Remove</button>
            </div>
            <div style={{background:'var(--surface)',borderRadius:12,overflow:'hidden',border:'1px solid var(--border)'}}>
              <div style={{display:'grid',gridTemplateColumns:'2fr 80px 1fr 40px',gap:0,background:'var(--card)',padding:'10px 16px',fontSize:12,fontWeight:600,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.05em'}}>
                <div>Skill</div><div>Score (0–10)</div><div>Notes</div><div>M</div>
              </div>
              {leaderRows.map((row,i)=>(
                <div key={row.id} style={{display:'grid',gridTemplateColumns:'2fr 80px 1fr 40px',gap:0,padding:'8px 16px',borderTop:'1px solid var(--border)',background:i%2===0?'transparent':'rgba(255,255,255,0.02)',alignItems:'center'}}>
                  <div style={{color:'var(--fg)',fontSize:13,fontWeight:row.is_mandatory?600:400}}>{row.skill_name}</div>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <input type="range" min={0} max={10} value={row.score} onChange={e=>update(row.id,'score',parseInt(e.target.value))} style={{width:60,accentColor:'var(--gold)'}} />
                    <span style={{color:'var(--gold)',fontWeight:700,fontSize:14,minWidth:16}}>{row.score}</span>
                  </div>
                  <input value={row.notes||''} onChange={e=>update(row.id,'notes',e.target.value)} placeholder="Notes…" style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:6,padding:'4px 8px',color:'var(--fg)',fontSize:12,outline:'none',width:'100%'}} />
                  <div style={{textAlign:'center',color:row.is_mandatory?'#f59e0b':'var(--border)',fontSize:14}} title={row.is_mandatory?'Mandatory':''}>★</div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      {leaders.length===0&&<div style={{textAlign:'center',color:'var(--muted)',padding:48,fontSize:14}}>Add leaders using the form above. Each leader gets all 20 leadership skills to rate.</div>}
    </div>
  );
}
