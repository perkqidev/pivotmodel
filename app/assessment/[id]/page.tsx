'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Nav from '@/components/Nav';

type Module = 'emb' | 'drivers' | 'scope' | 'benchmarks' | 'maturity' | 'summary' | 'kra' | 'leadership' | 'talent' | 'skillset';

const SECTIONS_CONFIG: {
  id: string;
  title: string;
  description: string;
  icon: string;
  accent: string;
  tabs: { id: Module; label: string; hint: string }[];
}[] = [
  {
    id: 'maturity-assessment',
    title: 'Eng. Maturity',
    description: 'Assess your engineering team\u2019s current capabilities and maturity',
    icon: '\u{1F4CA}',
    accent: 'var(--gold)',
    tabs: [
      { id: 'emb', label: 'EMB Maturity', hint: 'Rate capabilities across 5 pillars' },
      { id: 'drivers', label: 'Business Drivers', hint: 'Document why the team exists' },
      { id: 'scope', label: 'Scope', hint: 'Map activities and find gaps' },
      { id: 'benchmarks', label: 'Benchmarks', hint: 'Track KPIs and performance' },
      { id: 'maturity', label: 'Competency Maturity', hint: 'Evaluate overall maturity factors' },
      { id: 'summary', label: 'Summary', hint: 'Auto-generated overview' },
    ],
  },
  {
    id: 'roles-leadership',
    title: 'Roles & Leaders',
    description: 'Define expectations for each role and evaluate leadership readiness',
    icon: '\u{1F465}',
    accent: '#63acff',
    tabs: [
      { id: 'kra', label: 'Roles & KRA', hint: 'Set goals by role and pillar' },
      { id: 'leadership', label: 'Leadership Qualities', hint: 'Score leadership skills per leader' },
    ],
  },
  {
    id: 'talent-skills',
    title: 'Talent & Skills',
    description: 'Map individual engineer capabilities and identify team skill gaps',
    icon: '\u{1F3AF}',
    accent: '#22c55e',
    tabs: [
      { id: 'talent', label: 'Talent Map', hint: 'Profile each engineer\u2019s skills' },
      { id: 'skillset', label: 'Skillset Requirements', hint: 'Define required skills and find gaps' },
    ],
  },
];

const LEVEL_LABELS: Record<string,string> = { L1:'◆ L1', L2:'⚙ L2', L3:'🚀 L3' };
const LEVEL_COLORS: Record<string,string> = { L1:'#ef4444', L2:'#f59e0b', L3:'#22c55e' };
const STATUS_COLORS: Record<string,string> = { 'on-track':'#22c55e','at-risk':'#f59e0b','off-track':'#ef4444','pending':'#6b7280','achieved':'#22c55e','in-progress':'#f59e0b','not-started':'#6b7280' };

export default function AssessmentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [activeModule, setActiveModule] = useState<Module>('emb');
  const [assessment, setAssessment] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [collab, setCollab] = useState('');
  const [collabMsg, setCollabMsg] = useState('');
  const [showCollab, setShowCollab] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [moduleStatus, setModuleStatus] = useState<Record<Module, boolean>>({ emb:false, drivers:false, scope:false, benchmarks:false, maturity:false, summary:false, kra:false, leadership:false, talent:false, skillset:false });

  /* Track mobile vs desktop and auto-close sidebar on switch */
  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(false);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    fetch(`/api/assessments`).then(r => r.json()).then(d => {
      const all = [...(d.owned||[]), ...(d.shared||[])];
      const a = all.find((x: any) => String(x.id) === String(id));
      if (a) setAssessment(a);
    });
  }, [id]);

  /* Lightweight check: which modules have data */
  useEffect(() => {
    const endpoints: { mod: Module; url: string; check: (d:any)=>boolean }[] = [
      { mod:'emb', url:'emb', check:d=>(d.rows||[]).length>0 },
      { mod:'drivers', url:'drivers', check:d=>(d.rows||[]).length>0 },
      { mod:'scope', url:'scope', check:d=>(d.rows||[]).length>0 },
      { mod:'benchmarks', url:'benchmarks', check:d=>(d.rows||[]).length>0 },
      { mod:'maturity', url:'maturity', check:d=>(d.rows||[]).length>0 },
      { mod:'kra', url:'kra', check:d=>(d.rows||[]).length>0 },
      { mod:'leadership', url:'leadership', check:d=>(d.rows||[]).length>0 },
      { mod:'talent', url:'talent', check:d=>(d.engineers||[]).length>0 },
      { mod:'skillset', url:'skillset', check:d=>(d.items||[]).length>0||(d.context||[]).length>0 },
    ];
    const status: Record<string,boolean> = { summary:false };
    Promise.all(endpoints.map(ep =>
      fetch(`/api/assessments/${id}/${ep.url}`).then(r=>r.json()).then(d=>{ status[ep.mod]=ep.check(d); }).catch(()=>{})
    )).then(() => {
      status.summary = !!(status.emb || status.scope);
      setModuleStatus(status as Record<Module, boolean>);
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
        <div className="assess-header" style={{ background:'var(--surface)',borderBottom:'1px solid var(--border)',padding:'16px 32px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:16,flexWrap:'wrap' }}>
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
            <button onClick={exportExcel} style={{ background:'var(--gold)',border:'none',borderRadius:8,padding:'6px 14px',color:'var(--gold-btn-text)',fontSize:13,fontWeight:700,cursor:'pointer' }}>📊 Export Excel</button>
          </div>
        </div>
        {showCollab && (
          <div style={{ background:'var(--card)',borderBottom:'1px solid var(--border)',padding:'12px 32px',display:'flex',gap:12,alignItems:'center' }}>
            <input value={collab} onChange={e=>setCollab(e.target.value)} placeholder="Collaborator email address" style={{ background:'var(--surface)',border:'1px solid var(--border)',borderRadius:8,padding:'8px 12px',color:'var(--fg)',fontSize:13,width:280,outline:'none' }} />
            <button onClick={addCollaborator} style={{ background:'var(--gold)',border:'none',borderRadius:8,padding:'8px 16px',color:'var(--gold-btn-text)',fontWeight:700,fontSize:13,cursor:'pointer' }}>Invite</button>
            {collabMsg && <span style={{ fontSize:12,color:collabMsg.includes('Error')||collabMsg.includes('error')?'#ef4444':'#22c55e' }}>{collabMsg}</span>}
          </div>
        )}
        {/* Sidebar + Content */}
        <div style={{ display:'flex',minHeight:'calc(100vh - 140px)',position:'relative' }}>
          {isMobile && <button className="assess-menu-btn" onClick={() => setSidebarOpen(o => !o)} aria-label="Toggle sidebar">{sidebarOpen ? '✕' : '☰'}</button>}
          {isMobile && sidebarOpen && <div className="assess-overlay" onClick={() => setSidebarOpen(false)} />}
          {/* Sidebar */}
          <div className={`assess-sidebar${isMobile && sidebarOpen ? ' open' : ''}`} style={{ width:240,minWidth:240,background:'var(--surface)',borderRight:'1px solid var(--border)',padding:'16px 0',overflowY:'auto' }}>
            {/* Progress indicator */}
            {(() => {
              const total = 10;
              const startedCount = Object.values(moduleStatus).filter(Boolean).length;
              const pct = (startedCount / total) * 100;
              const label = startedCount === 0 ? 'No modules started yet' : startedCount === total ? 'All modules complete' : `${total - startedCount} modules remaining`;
              return (
                <div style={{ padding:'8px 16px 14px',borderBottom:'1px solid var(--border)',marginBottom:8 }}>
                  <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6 }}>
                    <span style={{ fontSize:11,fontWeight:700,color:'var(--fg)',letterSpacing:'0.03em' }}>Progress {startedCount}/{total}</span>
                  </div>
                  <div style={{ background:'var(--card)',borderRadius:4,height:6,overflow:'hidden',marginBottom:4 }}>
                    <div style={{ width:`${pct}%`,height:'100%',background:'#22c55e',borderRadius:4,transition:'width 0.5s' }} />
                  </div>
                  <div style={{ fontSize:10,color:'var(--muted)' }}>{label}</div>
                </div>
              );
            })()}
            {SECTIONS_CONFIG.map(sec => {
              const groupActive = sec.tabs.some(t => t.id === activeModule);
              return (
                <div key={sec.id} style={{ marginBottom:8 }}>
                  {/* Group header */}
                  <div style={{ padding:'10px 16px',borderLeft:`3px solid ${groupActive ? sec.accent : 'transparent'}` }}>
                    <div style={{ display:'flex',alignItems:'center',gap:8 }}>
                      <span style={{ fontSize:16 }}>{sec.icon}</span>
                      <span style={{ fontWeight:700,fontSize:12,color:groupActive ? 'var(--fg)' : 'var(--muted)',textTransform:'uppercase',letterSpacing:'0.05em' }}>{sec.title}</span>
                    </div>
                    <div style={{ fontSize:10,color:'var(--muted)',opacity:0.8,marginTop:2,paddingLeft:24 }}>{sec.description}</div>
                  </div>
                  {/* Module items */}
                  {sec.tabs.map(tab => {
                    const isActive = activeModule === tab.id;
                    const hasData = moduleStatus[tab.id];
                    return (
                      <div
                        key={tab.id}
                        onClick={() => { setActiveModule(tab.id); setSidebarOpen(false); }}
                        style={{
                          padding:'8px 16px 8px 32px',
                          fontSize:13,
                          color: isActive ? sec.accent : 'var(--muted)',
                          fontWeight: isActive ? 600 : 400,
                          background: isActive ? `${sec.accent}14` : 'transparent',
                          borderLeft: `3px solid ${isActive ? sec.accent : 'transparent'}`,
                          cursor:'pointer',
                          transition:'all 0.15s',
                        }}
                        onMouseEnter={e => { if (!isActive) { e.currentTarget.style.color = 'var(--fg)'; e.currentTarget.style.background = 'var(--hover-bg)'; }}}
                        onMouseLeave={e => { if (!isActive) { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.background = 'transparent'; }}}
                      >
                        <div style={{ display:'flex',alignItems:'center',gap:6 }}>
                          <span style={{ width:6,height:6,borderRadius:'50%',background:hasData?'#22c55e':'#6b7280',flexShrink:0 }} />
                          {tab.label}
                        </div>
                        <div style={{ fontSize:10,color:'var(--muted)',opacity:0.8,marginTop:1,paddingLeft:12 }}>{tab.hint}</div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
          {/* Main Content */}
          <div className="assess-main" style={{ flex:1,padding:32,overflowY:'auto' }}>
            {activeModule === 'emb' && <EMBModule id={id} save={save} />}
            {activeModule === 'drivers' && <DriversModule id={id} save={save} />}
            {activeModule === 'scope' && <ScopeModule id={id} save={save} />}
            {activeModule === 'benchmarks' && <BenchmarksModule id={id} save={save} />}
            {activeModule === 'maturity' && <MaturityModule id={id} save={save} />}
            {activeModule === 'summary' && <SummaryModule id={id} />}
            {activeModule === 'kra' && <KRAModule id={id} save={save} />}
            {activeModule === 'leadership' && <LeadershipModule id={id} save={save} />}
            {activeModule === 'talent' && <TalentMapModule id={id} />}
            {activeModule === 'skillset' && <SkillsetModule id={id} />}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Module 1: EMB ──────────────────────────────────────────────────────────────
function EMBModule({ id, save }: { id:string; save:(e:string,r:unknown[])=>Promise<void> }) {
  const [rows, setRows] = useState<any[]>([]);
  const [nudge, setNudge] = useState<{suggested_level:string;avg_score:number}|null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [confirmingId, setConfirmingId] = useState<number|null>(null);
  const confirmTimer = useRef<ReturnType<typeof setTimeout>|null>(null);
  function requestDelete(rid: number) { setConfirmingId(rid); if (confirmTimer.current) clearTimeout(confirmTimer.current); confirmTimer.current = setTimeout(() => setConfirmingId(null), 3000); }
  function cancelDelete() { setConfirmingId(null); if (confirmTimer.current) clearTimeout(confirmTimer.current); }
  function toggleCriteria(rid: number) { setExpanded(prev => { const n = new Set(prev); n.has(rid) ? n.delete(rid) : n.add(rid); return n; }); }
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
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24,gap:12,flexWrap:'wrap' as const }}>
        <div><h2 style={{color:'var(--fg)',margin:0}}>Engineering Maturity Benchmark</h2><p style={{color:'var(--muted)',fontSize:13,margin:'4px 0 0'}}>Evaluate your engineering team's maturity across 5 pillars. For each capability, select your current level (L1 / L2 / L3) and record evidence to support your rating. Changes save automatically.</p></div>
      </div>
      {nudge && <div style={{ background:'rgba(201,168,76,0.1)',border:'1px solid var(--gold)',borderRadius:12,padding:'12px 16px',marginBottom:24,fontSize:13,color:'var(--fg)' }}>💡 <strong>Intelligence Nudge:</strong> Based on your scores (avg {nudge.avg_score}/3), the computed maturity level is <strong style={{color:'var(--gold)'}}>{nudge.suggested_level}</strong>. Consider adjusting your overall rating.</div>}
      {pillars.map(pillar => (
        <div key={pillar} style={{ marginBottom:32 }}>
          <div style={{ fontWeight:700,color:'var(--gold)',fontSize:14,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em',display:'flex',alignItems:'center',justifyContent:'space-between' }}><span>{pillar}</span><button onClick={async()=>{const res=await fetch(`/api/assessments/${id}/emb`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pivot_name:pillar})});const d=await res.json();if(d.id)setRows(prev=>[...prev,{id:d.id,pivot_name:pillar,capability:'New Capability',current_level:'L1',evidence:'',gap_notes:'',sort_order:99}]);}} style={{background:'var(--gold)',border:'none',borderRadius:6,padding:'3px 10px',color:'var(--gold-btn-text)',fontWeight:700,cursor:'pointer',fontSize:11}}>+ Add Row</button></div>
          <div className="scroll-table" style={{ background:'var(--surface)',borderRadius:12,overflow:'hidden',border:'1px solid var(--border)' }}>
            <div style={{ display:'grid',gridTemplateColumns:'1.5fr 100px 2fr 2fr 36px',gap:'0 12px',background:'var(--card)',padding:'10px 16px',fontSize:11,fontWeight:600,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.05em' }}>
              <div>Capability</div><div>Current Level</div><div>Evidence & Proof</div><div>Improvement Notes</div><div></div>
            </div>
            {rows.filter(r=>r.pivot_name===pillar).map((row,i) => (
              <div key={row.id}>
                <div style={{ display:'grid',gridTemplateColumns:'1.5fr 100px 2fr 2fr 36px',gap:'0 12px',padding:'12px 16px',borderTop:'1px solid var(--border)',background:i%2===0?'transparent':'rgba(255,255,255,0.02)',alignItems:'start' }}>
                  <div style={{ display:'flex',alignItems:'center',gap:6 }}>
                    {(row.l1_criteria||row.l2_criteria||row.l3_criteria) && <button onClick={()=>toggleCriteria(row.id)} style={{background:'none',border:'none',color:'var(--muted)',cursor:'pointer',fontSize:10,padding:0}} title="Toggle criteria">{expanded.has(row.id)?'▼':'▶'}</button>}
                    <span style={{ color:'var(--fg)',fontSize:13,fontWeight:500 }}>{row.capability}</span>
                  </div>
                  <select value={row.current_level||'L1'} onChange={e=>update(row.id,'current_level',e.target.value)} style={{ background:'var(--card)',border:'1px solid var(--border)',borderRadius:6,padding:'6px 8px',color:LEVEL_COLORS[row.current_level||'L1'],fontWeight:700,fontSize:13,cursor:'pointer',outline:'none' }}>
                    {['L1','L2','L3'].map(l=><option key={l} value={l}>{LEVEL_LABELS[l]}</option>)}
                  </select>
                  <textarea value={row.evidence||''} onChange={e=>update(row.id,'evidence',e.target.value)} placeholder="What supports this level? e.g. metrics, processes in place…" rows={2} style={{ background:'var(--card)',border:'1px solid var(--border)',borderRadius:6,padding:'8px 12px',color:'var(--fg)',fontSize:12,resize:'vertical',width:'100%',outline:'none' }} />
                  <textarea value={row.gap_notes||''} onChange={e=>update(row.id,'gap_notes',e.target.value)} placeholder="What's needed to reach the next level?…" rows={2} style={{ background:'var(--card)',border:'1px solid var(--border)',borderRadius:6,padding:'8px 12px',color:'var(--fg)',fontSize:12,resize:'vertical',width:'100%',outline:'none' }} />
                  {confirmingId===row.id ? (
                    <div style={{display:'flex',gap:2}}>
                      <button onClick={async()=>{cancelDelete();await fetch(`/api/assessments/${id}/emb`,{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({row_id:row.id})});setRows(prev=>prev.filter(r=>r.id!==row.id));}} style={{background:'none',border:'none',color:'#22c55e',cursor:'pointer',fontSize:16,padding:2}} title="Confirm delete">✓</button>
                      <button onClick={cancelDelete} style={{background:'none',border:'none',color:'var(--muted)',cursor:'pointer',fontSize:14,padding:2}} title="Cancel">✗</button>
                    </div>
                  ) : (
                    <button onClick={()=>requestDelete(row.id)} style={{background:'none',border:'none',color:'#ef4444',cursor:'pointer',fontSize:16,padding:4}}>✕</button>
                  )}
                </div>
                {expanded.has(row.id) && (row.l1_criteria||row.l2_criteria||row.l3_criteria) && (
                  <div style={{padding:'8px 16px 12px 40px',borderTop:'1px dashed var(--border)',background:'rgba(201,168,76,0.03)',display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
                    <div><div style={{fontSize:11,fontWeight:600,color:'#ef4444',marginBottom:4}}>◆ L1 (Basic)</div><div style={{fontSize:12,color:'var(--muted)',lineHeight:1.5}}>{row.l1_criteria||'–'}</div></div>
                    <div><div style={{fontSize:11,fontWeight:600,color:'#f59e0b',marginBottom:4}}>⚙ L2 (Developing)</div><div style={{fontSize:12,color:'var(--muted)',lineHeight:1.5}}>{row.l2_criteria||'–'}</div></div>
                    <div><div style={{fontSize:11,fontWeight:600,color:'#22c55e',marginBottom:4}}>🚀 L3 (Optimised)</div><div style={{fontSize:12,color:'var(--muted)',lineHeight:1.5}}>{row.l3_criteria||'–'}</div></div>
                  </div>
                )}
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
  const [confirmingId, setConfirmingId] = useState<number|null>(null);
  const confirmTimer = useRef<ReturnType<typeof setTimeout>|null>(null);
  function requestDelete(rid: number) { setConfirmingId(rid); if (confirmTimer.current) clearTimeout(confirmTimer.current); confirmTimer.current = setTimeout(() => setConfirmingId(null), 3000); }
  function cancelDelete() { setConfirmingId(null); if (confirmTimer.current) clearTimeout(confirmTimer.current); }
  useEffect(() => { fetch(`/api/assessments/${id}/drivers`).then(r=>r.json()).then(d=>setRows(d.rows||[])); }, [id]);
  useEffect(() => { if (!rows.length) return; const t = setTimeout(() => save('drivers',rows), 1500); return () => clearTimeout(t); }, [rows]);
  function update(rowId: number, field: string, val: string|boolean) { setRows(prev=>prev.map(r=>r.id===rowId?{...r,[field]:val}:r)); }
  async function addRow(cat:string) { const res = await fetch(`/api/assessments/${id}/drivers`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({category:cat})}); const d=await res.json(); if(d.id) setRows(prev=>[...prev,{id:d.id,category:cat,driver_name:'New Driver',description:'',is_mandatory:false,considerations:'',notes:''}]); }
  async function deleteRow(rowId: number) { await fetch(`/api/assessments/${id}/drivers`,{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({row_id:rowId})}); setRows(prev=>prev.filter(r=>r.id!==rowId)); }
  const CATS = ['Engineering Cost','Scale of Engineering Operations','Strategic Business Expansion'];
  const categories = [...new Set(rows.map(r => r.category))];
  return (
    <div>
      <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24,gap:12,flexWrap:'wrap' as const }}>
        <div><h2 style={{color:'var(--fg)',margin:0}}>Business Drivers</h2><p style={{color:'var(--muted)',fontSize:13,margin:'4px 0 0'}}>Document the business reasons behind your engineering team. Capture cost drivers, scale factors, and strategic growth plans to help leadership understand investment priorities.</p></div>
      </div>
      {categories.map(cat => (
        <div key={cat} style={{marginBottom:28}}>
          <div style={{fontWeight:700,color:'var(--gold)',fontSize:14,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.05em',display:'flex',alignItems:'center',justifyContent:'space-between'}}><span>{cat}</span><button onClick={()=>addRow(cat)} style={{background:'var(--gold)',border:'none',borderRadius:6,padding:'3px 10px',color:'var(--gold-btn-text)',fontWeight:700,cursor:'pointer',fontSize:11}}>+ Add Driver</button></div>
          <div className="scroll-table" style={{ background:'var(--surface)',borderRadius:12,overflow:'hidden',border:'1px solid var(--border)' }}>
            <div style={{ display:'grid',gridTemplateColumns:'1.2fr 1.5fr 70px 2.5fr 1.5fr 36px',gap:'0 12px',background:'var(--card)',padding:'10px 16px',fontSize:12,fontWeight:600,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.05em' }}>
              <div>Driver Name</div><div>What It Means</div><div>Required?</div><div>Key Considerations</div><div>Additional Notes</div><div></div>
            </div>
            {rows.filter(r=>r.category===cat).map((row,i) => (
              <div key={row.id} style={{ display:'grid',gridTemplateColumns:'1.2fr 1.5fr 70px 2.5fr 1.5fr 36px',gap:'0 12px',padding:'12px 16px',borderTop:'1px solid var(--border)',background:i%2===0?'transparent':'rgba(255,255,255,0.02)',alignItems:'start' }}>
                <input value={row.driver_name} onChange={e=>update(row.id,'driver_name',e.target.value)} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:6,padding:'8px 12px',color:'var(--fg)',fontSize:12,outline:'none',width:'100%'}} />
                <textarea value={row.description||''} onChange={e=>update(row.id,'description',e.target.value)} placeholder="Describe this driver and its impact…" rows={2} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:6,padding:'8px 12px',color:'var(--fg)',fontSize:12,resize:'vertical',width:'100%',outline:'none'}} />
                <div style={{display:'flex',justifyContent:'center',paddingTop:4}}>
                  <button onClick={()=>update(row.id,'is_mandatory',!row.is_mandatory)} style={{background:row.is_mandatory?'var(--gold)':'var(--card)',border:'1px solid var(--border)',borderRadius:6,padding:'4px 10px',color:row.is_mandatory?'var(--gold-btn-text)':'var(--muted)',fontSize:12,cursor:'pointer',fontWeight:row.is_mandatory?700:400}}>{row.is_mandatory?'Yes':'No'}</button>
                </div>
                <textarea value={row.considerations||''} onChange={e=>update(row.id,'considerations',e.target.value)} placeholder="What factors should leadership consider?" rows={3} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:6,padding:'8px 12px',color:'var(--fg)',fontSize:12,resize:'vertical',width:'100%',outline:'none'}} />
                <textarea value={row.notes||''} onChange={e=>update(row.id,'notes',e.target.value)} placeholder="Timeline, owner, or follow-up notes…" rows={2} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:6,padding:'8px 12px',color:'var(--fg)',fontSize:12,resize:'vertical',width:'100%',outline:'none'}} />
                {confirmingId===row.id ? (
                  <div style={{display:'flex',gap:2}}>
                    <button onClick={()=>{cancelDelete();deleteRow(row.id);}} style={{background:'none',border:'none',color:'#22c55e',cursor:'pointer',fontSize:16,padding:2}} title="Confirm delete">✓</button>
                    <button onClick={cancelDelete} style={{background:'none',border:'none',color:'var(--muted)',cursor:'pointer',fontSize:14,padding:2}} title="Cancel">✗</button>
                  </div>
                ) : (
                  <button onClick={()=>requestDelete(row.id)} style={{background:'none',border:'none',color:'#ef4444',cursor:'pointer',fontSize:16,padding:4}}>✕</button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
      {rows.length===0 && <div style={{textAlign:'center',padding:48}}>
        <div style={{border:'2px dashed var(--border)',borderRadius:16,padding:'40px 24px',maxWidth:400,margin:'0 auto'}}>
          <div style={{fontSize:32,marginBottom:12}}>📋</div>
          <div style={{color:'var(--fg)',fontWeight:600,fontSize:15,marginBottom:6}}>No business drivers documented yet</div>
          <div style={{color:'var(--muted)',fontSize:13,marginBottom:16}}>Capture cost, scale, and strategic reasons for your engineering team.</div>
          <button onClick={()=>addRow('Engineering Cost')} style={{background:'var(--gold)',border:'none',borderRadius:8,padding:'8px 16px',color:'var(--gold-btn-text)',fontWeight:700,cursor:'pointer',fontSize:13}}>+ Add Driver</button>
        </div>
      </div>}
    </div>
  );
}

// ── Module 3: Benchmarks ───────────────────────────────────────────────────────
function BenchmarksModule({ id, save }: { id:string; save:(e:string,r:unknown[])=>Promise<void> }) {
  const [rows, setRows] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [confirmingId, setConfirmingId] = useState<number|null>(null);
  const confirmTimer = useRef<ReturnType<typeof setTimeout>|null>(null);
  function requestDelete(rid: number) { setConfirmingId(rid); if (confirmTimer.current) clearTimeout(confirmTimer.current); confirmTimer.current = setTimeout(() => setConfirmingId(null), 3000); }
  function cancelDelete() { setConfirmingId(null); if (confirmTimer.current) clearTimeout(confirmTimer.current); }
  useEffect(() => { fetch(`/api/assessments/${id}/benchmarks`).then(r=>r.json()).then(d=>setRows(d.rows||[])); }, [id]);
  useEffect(() => { if (!rows.length) return; const t = setTimeout(() => save('benchmarks',rows), 1500); return () => clearTimeout(t); }, [rows]);
  function update(rowId: number, field: string, val: string) { setRows(prev=>prev.map(r=>r.id===rowId?{...r,[field]:val}:r)); }
  async function addRow(pillar: string, sub_category: string) { const res=await fetch(`/api/assessments/${id}/benchmarks`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pillar,sub_category})}); const d=await res.json(); if(d.id) setRows(prev=>[...prev,{id:d.id,pillar,sub_category,kpi_name:'New KPI',unit:'%',target_value:'',current_value:'',status:'pending',notes:'',weight:0,definition:''}]); }
  const pillars = [...new Set(rows.map(r => r.pillar))];
  const STATUSES = ['pending','on-track','at-risk','off-track'];
  function toggleDef(rowId: number) { setExpanded(prev => { const n = new Set(prev); n.has(rowId) ? n.delete(rowId) : n.add(rowId); return n; }); }
  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24,gap:12,flexWrap:'wrap' as const}}>
        <div><h2 style={{color:'var(--fg)',margin:0}}>Performance Benchmarks</h2><p style={{color:'var(--muted)',fontSize:13,margin:'4px 0 0'}}>Track your team's performance against key metrics. Set targets, enter current values, and mark the status of each KPI. Click the arrow next to any KPI to see its full definition.</p></div>
      </div>
      {pillars.map(pillar => {
        const pillarRows = rows.filter(r=>r.pillar===pillar);
        const subCats = [...new Set(pillarRows.map(r=>r.sub_category||''))];
        return (
          <div key={pillar} style={{marginBottom:28}}>
            <div style={{fontWeight:700,color:'var(--gold)',fontSize:14,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.05em'}}>{pillar}</div>
            {subCats.map(sub => (
              <div key={sub} style={{marginBottom:16}}>
                {sub && <div style={{fontSize:12,color:'var(--muted)',fontWeight:600,padding:'6px 16px',background:'rgba(201,168,76,0.08)',borderRadius:'8px 8px 0 0',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span>{sub}</span>
                  <button onClick={()=>addRow(pillar,sub)} style={{background:'var(--gold)',border:'none',borderRadius:6,padding:'3px 10px',color:'var(--gold-btn-text)',fontWeight:700,cursor:'pointer',fontSize:11}}>+ Add KPI</button>
                </div>}
                <div className="scroll-table" style={{background:'var(--surface)',borderRadius:sub?'0 0 12px 12px':'12px',overflow:'hidden',border:'1px solid var(--border)'}}>
                  <div style={{display:'grid',gridTemplateColumns:'1.2fr 50px 60px 70px 100px 110px 2fr 36px',gap:'0 12px',background:'var(--card)',padding:'10px 16px',fontSize:11,fontWeight:600,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.05em'}}>
                    <div>KPI Name</div><div>Weight</div><div>Unit</div><div>Target</div><div>Actual</div><div>Status</div><div>Notes</div><div></div>
                  </div>
                  {pillarRows.filter(r=>(r.sub_category||'')===sub).map((row,i)=>(
                    <div key={row.id}>
                      <div style={{display:'grid',gridTemplateColumns:'1.2fr 50px 60px 70px 100px 110px 2fr 36px',gap:'0 12px',padding:'10px 16px',borderTop:'1px solid var(--border)',background:i%2===0?'transparent':'rgba(255,255,255,0.02)',alignItems:'center'}}>
                        <div style={{display:'flex',alignItems:'center',gap:6}}>
                          <button onClick={()=>toggleDef(row.id)} style={{background:'none',border:'none',color:'var(--muted)',cursor:'pointer',fontSize:10,padding:0}} title="Toggle definition">{expanded.has(row.id)?'▼':'▶'}</button>
                          <span style={{color:'var(--fg)',fontSize:13}}>{row.kpi_name}</span>
                        </div>
                        <div style={{color:'var(--muted)',fontSize:12}}>{row.weight ? `${(row.weight*100).toFixed(0)}%` : '–'}</div>
                        <div style={{color:'var(--muted)',fontSize:12}}>{row.unit}</div>
                        <div style={{color:'var(--muted)',fontSize:12}}>{row.target_value}</div>
                        <input value={row.current_value||''} onChange={e=>update(row.id,'current_value',e.target.value)} placeholder="Actual value" style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:6,padding:'8px 12px',color:'var(--fg)',fontSize:13,outline:'none',width:'100%'}} />
                        <select value={row.status} onChange={e=>update(row.id,'status',e.target.value)} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:6,padding:'8px 12px',color:STATUS_COLORS[row.status],fontWeight:600,fontSize:12,cursor:'pointer',outline:'none'}}>
                          {STATUSES.map(s=><option key={s}>{s}</option>)}
                        </select>
                        <input value={row.notes||''} onChange={e=>update(row.id,'notes',e.target.value)} placeholder="Why this value, or what to improve…" style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:6,padding:'8px 12px',color:'var(--fg)',fontSize:12,outline:'none',width:'100%'}} />
                        {confirmingId===row.id ? (
                          <div style={{display:'flex',gap:2}}>
                            <button onClick={async()=>{cancelDelete();await fetch(`/api/assessments/${id}/benchmarks`,{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({row_id:row.id})});setRows(prev=>prev.filter(r=>r.id!==row.id));}} style={{background:'none',border:'none',color:'#22c55e',cursor:'pointer',fontSize:16,padding:2}} title="Confirm delete">✓</button>
                            <button onClick={cancelDelete} style={{background:'none',border:'none',color:'var(--muted)',cursor:'pointer',fontSize:14,padding:2}} title="Cancel">✗</button>
                          </div>
                        ) : (
                          <button onClick={()=>requestDelete(row.id)} style={{background:'none',border:'none',color:'#ef4444',cursor:'pointer',fontSize:16,padding:4}}>✕</button>
                        )}
                      </div>
                      {expanded.has(row.id) && row.definition && (
                        <div style={{padding:'4px 16px 8px 40px',fontSize:12,color:'var(--muted)',lineHeight:1.5,borderTop:'1px dashed var(--border)',background:'rgba(201,168,76,0.03)'}}>
                          <strong>Definition:</strong> {row.definition}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

// ── Module 4: Scope ────────────────────────────────────────────────────────────
function ScopeModule({ id, save }: { id:string; save:(e:string,r:unknown[])=>Promise<void> }) {
  const [rows, setRows] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [confirmingId, setConfirmingId] = useState<number|null>(null);
  const confirmTimer = useRef<ReturnType<typeof setTimeout>|null>(null);
  function requestDelete(rid: number) { setConfirmingId(rid); if (confirmTimer.current) clearTimeout(confirmTimer.current); confirmTimer.current = setTimeout(() => setConfirmingId(null), 3000); }
  function cancelDelete() { setConfirmingId(null); if (confirmTimer.current) clearTimeout(confirmTimer.current); }
  useEffect(() => { fetch(`/api/assessments/${id}/scope`).then(r=>r.json()).then(d=>setRows(d.rows||[])); }, [id]);
  useEffect(() => { if (!rows.length) return; const t = setTimeout(() => save('scope',rows), 1500); return () => clearTimeout(t); }, [rows]);
  function update(rowId: number, field: string, val: string|number) { setRows(prev=>prev.map(r=>r.id===rowId?{...r,[field]:val}:r)); }
  const pillars = [...new Set(rows.map(r => r.pillar))];
  const LEVEL_ICONS: Record<number,string> = {1:'◆ L1',2:'⚙ L2',3:'🚀 L3'};
  const LEVEL_CLR: Record<number,string> = {1:'#ef4444',2:'#f59e0b',3:'#22c55e'};
  function toggleGuide(rowId: number) { setExpanded(prev => { const n = new Set(prev); n.has(rowId) ? n.delete(rowId) : n.add(rowId); return n; }); }
  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24,gap:12,flexWrap:'wrap' as const}}>
        <div><h2 style={{color:'var(--fg)',margin:0}}>Scope of Product Engineering</h2><p style={{color:'var(--muted)',fontSize:13,margin:'4px 0 0'}}>Map the scope of your product engineering activities. Set the target maturity level and your current level for each — the gap is calculated automatically. Expand any row to see L1/L2/L3 guidance.</p></div>
      </div>
      {pillars.map(pillar=>(
        <div key={pillar} style={{marginBottom:28}}>
          <div style={{fontWeight:700,color:'var(--gold)',fontSize:14,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.05em',display:'flex',alignItems:'center',justifyContent:'space-between'}}><span>{pillar}</span><button onClick={async()=>{const res=await fetch(`/api/assessments/${id}/scope`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({pillar})});const d=await res.json();if(d.id)setRows(prev=>[...prev,{id:d.id,pillar,activity:'New Activity',required_level:1,current_level:1,gap:0,notes:'',l1_guidance:'',l2_guidance:'',l3_guidance:''}]);}} style={{background:'var(--gold)',border:'none',borderRadius:6,padding:'3px 10px',color:'var(--gold-btn-text)',fontWeight:700,cursor:'pointer',fontSize:11}}>+ Add Activity</button></div>
          <div className="scroll-table" style={{background:'var(--surface)',borderRadius:12,overflow:'hidden',border:'1px solid var(--border)'}}>
            <div style={{display:'grid',gridTemplateColumns:'1.2fr 100px 100px 60px 2fr 36px',gap:'0 12px',background:'var(--card)',padding:'10px 16px',fontSize:12,fontWeight:600,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.05em'}}>
              <div>Activity</div><div>Target Level</div><div>Current Level</div><div>Gap</div><div>Action Notes</div><div></div>
            </div>
            {rows.filter(r=>r.pillar===pillar).map((row,i)=>(
              <div key={row.id}>
                <div style={{display:'grid',gridTemplateColumns:'1.2fr 100px 100px 60px 2fr 36px',gap:'0 12px',padding:'12px 16px',borderTop:'1px solid var(--border)',background:i%2===0?'transparent':'rgba(255,255,255,0.02)',alignItems:'center'}}>
                  <div style={{display:'flex',alignItems:'center',gap:6}}>
                    {(row.l1_guidance||row.l2_guidance||row.l3_guidance) && <button onClick={()=>toggleGuide(row.id)} style={{background:'none',border:'none',color:'var(--muted)',cursor:'pointer',fontSize:10,padding:0}} title="Toggle guidance">{expanded.has(row.id)?'▼':'▶'}</button>}
                    <span style={{color:'var(--fg)',fontSize:13}}>{row.activity}</span>
                  </div>
                  <select value={row.required_level} onChange={e=>update(row.id,'required_level',parseInt(e.target.value))} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:6,padding:'8px 12px',color:LEVEL_CLR[row.required_level]||'var(--fg)',fontWeight:700,fontSize:13,cursor:'pointer',outline:'none'}}>
                    {[1,2,3].map(l=><option key={l} value={l}>{LEVEL_ICONS[l]}</option>)}
                  </select>
                  <select value={row.current_level} onChange={e=>update(row.id,'current_level',parseInt(e.target.value))} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:6,padding:'8px 12px',color:LEVEL_CLR[row.current_level]||'var(--fg)',fontWeight:700,fontSize:13,cursor:'pointer',outline:'none'}}>
                    {[1,2,3].map(l=><option key={l} value={l}>{LEVEL_ICONS[l]}</option>)}
                  </select>
                  <div style={{fontWeight:700,color:Math.max(0,row.required_level-row.current_level)>0?'#ef4444':'#22c55e',fontSize:14}}>{Math.max(0,row.required_level-row.current_level)>0?`-${Math.max(0,row.required_level-row.current_level)}`:'✓'}</div>
                  <input value={row.notes||''} onChange={e=>update(row.id,'notes',e.target.value)} placeholder="Steps to close the gap, or context…" style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:6,padding:'8px 12px',color:'var(--fg)',fontSize:12,outline:'none',width:'100%'}} />
                  {confirmingId===row.id ? (
                    <div style={{display:'flex',gap:2}}>
                      <button onClick={async()=>{cancelDelete();await fetch(`/api/assessments/${id}/scope`,{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({row_id:row.id})});setRows(prev=>prev.filter(r=>r.id!==row.id));}} style={{background:'none',border:'none',color:'#22c55e',cursor:'pointer',fontSize:16,padding:2}} title="Confirm delete">✓</button>
                      <button onClick={cancelDelete} style={{background:'none',border:'none',color:'var(--muted)',cursor:'pointer',fontSize:14,padding:2}} title="Cancel">✗</button>
                    </div>
                  ) : (
                    <button onClick={()=>requestDelete(row.id)} style={{background:'none',border:'none',color:'#ef4444',cursor:'pointer',fontSize:16,padding:4}}>✕</button>
                  )}
                </div>
                {expanded.has(row.id) && (
                  <div style={{padding:'8px 16px 12px 40px',borderTop:'1px dashed var(--border)',background:'rgba(201,168,76,0.03)',display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
                    <div><div style={{fontSize:11,fontWeight:600,color:'#ef4444',marginBottom:4}}>◆ L1 Guidance</div><div style={{fontSize:12,color:'var(--muted)',lineHeight:1.5}}>{row.l1_guidance||'–'}</div></div>
                    <div><div style={{fontSize:11,fontWeight:600,color:'#f59e0b',marginBottom:4}}>⚙ L2 Guidance</div><div style={{fontSize:12,color:'var(--muted)',lineHeight:1.5}}>{row.l2_guidance||'–'}</div></div>
                    <div><div style={{fontSize:11,fontWeight:600,color:'#22c55e',marginBottom:4}}>🚀 L3 Guidance</div><div style={{fontSize:12,color:'var(--muted)',lineHeight:1.5}}>{row.l3_guidance||'–'}</div></div>
                  </div>
                )}
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
  const SCOPE_PILLARS = ['Product Enhancement & Sustenance','Thought Leadership','Business Result Focused','Customer Satisfaction','High Performance Talent'];
  const scopeScores = SCOPE_PILLARS.map(p => {
    const pr = scopeRows.filter(r=>r.pillar===p);
    if (!pr.length) return 0;
    return pr.reduce((a,r)=>a+(r.current_level||1),0)/pr.length;
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
      <p style={{color:'var(--muted)',fontSize:13,marginBottom:32}}>Your auto-generated overview. The radar chart and breakdown are built from your EMB Maturity and Scope data — complete those modules to see results here.</p>
      <div className="grid-stack" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:32}}>
        <div style={{background:'var(--surface)',borderRadius:16,padding:24,border:'1px solid var(--border)'}}>
          <div style={{fontWeight:700,color:'var(--fg)',marginBottom:16}}>Maturity Radar</div>
          <svg width={400} height={400} style={{display:'block',margin:'0 auto'}}>
            {gridLevels.map(l=>(
              <polygon key={l} points={angles.map(a=>{const p=polarToXY(a,(l/3)*r);return `${p.x},${p.y}`;}).join(' ')} fill="none" stroke="var(--border)" strokeWidth={1} />
            ))}
            {angles.map((a,i)=>{const p=polarToXY(a,r+20);return<text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fontSize={11} fill="var(--muted)" style={{fontSize:11}}>{PILLARS[i].split(' ').slice(0,2).join(' ')}</text>;})}
            <path d={pathFromScores(embScores,3)} fill="rgba(201,168,76,0.2)" stroke="var(--gold)" strokeWidth={2} />
            <path d={pathFromScores(scopeScores,3)} fill="rgba(99,172,255,0.1)" stroke="#63acff" strokeWidth={2} strokeDasharray="4,4" />
          </svg>
          <div style={{display:'flex',gap:16,justifyContent:'center',marginTop:8}}>
            <div style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:'var(--muted)'}}><div style={{width:20,height:3,background:'var(--gold)'}}></div>EMB Maturity</div>
            <div style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:'var(--muted)'}}><div style={{width:20,height:3,background:'#63acff',borderTop:'2px dashed #63acff'}}></div>Scope Assessment</div>
          </div>
        </div>
        <div style={{background:'var(--surface)',borderRadius:16,padding:24,border:'1px solid var(--border)'}}>
          <div style={{fontWeight:700,color:'var(--fg)',marginBottom:16}}>Pillar-by-Pillar Scores</div>
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

// ── Module 6: Competency Maturity Levels ────────────────────────────────────────
function MaturityModule({ id, save }: { id:string; save:(e:string,r:unknown[])=>Promise<void> }) {
  const [rows, setRows] = useState<any[]>([]);
  const [confirmingId, setConfirmingId] = useState<number|null>(null);
  const confirmTimer = useRef<ReturnType<typeof setTimeout>|null>(null);
  function requestDelete(rid: number) { setConfirmingId(rid); if (confirmTimer.current) clearTimeout(confirmTimer.current); confirmTimer.current = setTimeout(() => setConfirmingId(null), 3000); }
  function cancelDelete() { setConfirmingId(null); if (confirmTimer.current) clearTimeout(confirmTimer.current); }
  useEffect(() => { fetch(`/api/assessments/${id}/maturity`).then(r=>r.json()).then(d=>setRows(d.rows||[])); }, [id]);
  useEffect(() => { if (!rows.length) return; const t = setTimeout(() => save('maturity',rows), 1500); return () => clearTimeout(t); }, [rows]);
  function update(rowId: number, field: string, val: string|number) { setRows(prev=>prev.map(r=>r.id===rowId?{...r,[field]:val}:r)); }
  async function addRow() { const res=await fetch(`/api/assessments/${id}/maturity`,{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'}); const d=await res.json(); if(d.id) setRows(prev=>[...prev,{id:d.id,factor_name:'New Factor',maturity_level:1,ownership_level:'',skill_level:'',business_value:'',notes:''}]); }
  async function deleteRow(rowId: number) { await fetch(`/api/assessments/${id}/maturity`,{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({row_id:rowId})}); setRows(prev=>prev.filter(r=>r.id!==rowId)); }
  const LEVEL_CLR: Record<number,string> = {1:'#ef4444',2:'#f59e0b',3:'#22c55e'};
  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24,gap:12,flexWrap:'wrap' as const}}>
        <div><h2 style={{color:'var(--fg)',margin:0}}>Competency Maturity Levels</h2><p style={{color:'var(--muted)',fontSize:13,margin:'4px 0 0'}}>Assess the key factors that shape your team's overall maturity. For each, select a level and describe current ownership, skill capability, and the business value it delivers.</p></div>
        <button onClick={addRow} style={{background:'var(--gold)',border:'none',borderRadius:8,padding:'8px 16px',color:'var(--gold-btn-text)',fontWeight:700,cursor:'pointer',fontSize:13}}>+ Add Factor</button>
      </div>
      <div className="scroll-table" style={{background:'var(--surface)',borderRadius:12,overflow:'hidden',border:'1px solid var(--border)'}}>
        <div style={{display:'grid',gridTemplateColumns:'1.2fr 90px 1.5fr 1.5fr 1.5fr 1.2fr 36px',gap:'0 12px',background:'var(--card)',padding:'10px 16px',fontSize:12,fontWeight:600,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.05em'}}>
          <div>Factor Name</div><div>Maturity Level</div><div>Who Owns This</div><div>Skill Capability</div><div>Business Impact</div><div>Notes</div><div></div>
        </div>
        {rows.map((row,i)=>(
          <div key={row.id} style={{display:'grid',gridTemplateColumns:'1.2fr 90px 1.5fr 1.5fr 1.5fr 1.2fr 36px',gap:'0 12px',padding:'12px 16px',borderTop:'1px solid var(--border)',background:i%2===0?'transparent':'rgba(255,255,255,0.02)',alignItems:'start'}}>
            <input value={row.factor_name} onChange={e=>update(row.id,'factor_name',e.target.value)} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:6,padding:'8px 12px',color:'var(--fg)',fontSize:13,fontWeight:500,outline:'none',width:'100%'}} />
            <select value={row.maturity_level} onChange={e=>update(row.id,'maturity_level',parseInt(e.target.value))} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:6,padding:'8px 12px',color:LEVEL_CLR[row.maturity_level]||'var(--fg)',fontWeight:700,fontSize:13,cursor:'pointer',outline:'none'}}>
              <option value={1}>◆ L1</option><option value={2}>⚙ L2</option><option value={3}>🚀 L3</option>
            </select>
            <textarea value={row.ownership_level||''} onChange={e=>update(row.id,'ownership_level',e.target.value)} rows={2} placeholder="Who drives this? e.g. team lead, shared across org…" style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:6,padding:'8px 12px',color:'var(--fg)',fontSize:12,resize:'vertical',width:'100%',outline:'none'}} />
            <textarea value={row.skill_level||''} onChange={e=>update(row.id,'skill_level',e.target.value)} rows={2} placeholder="What skills exist? e.g. CI/CD, testing, automation…" style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:6,padding:'8px 12px',color:'var(--fg)',fontSize:12,resize:'vertical',width:'100%',outline:'none'}} />
            <textarea value={row.business_value||''} onChange={e=>update(row.id,'business_value',e.target.value)} rows={2} placeholder="How does this impact business outcomes?" style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:6,padding:'8px 12px',color:'var(--fg)',fontSize:12,resize:'vertical',width:'100%',outline:'none'}} />
            <textarea value={row.notes||''} onChange={e=>update(row.id,'notes',e.target.value)} rows={2} placeholder="Context, blockers, or improvement plans…" style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:6,padding:'8px 12px',color:'var(--fg)',fontSize:12,resize:'vertical',width:'100%',outline:'none'}} />
            {confirmingId===row.id ? (
              <div style={{display:'flex',gap:2}}>
                <button onClick={()=>{cancelDelete();deleteRow(row.id);}} style={{background:'none',border:'none',color:'#22c55e',cursor:'pointer',fontSize:16,padding:2}} title="Confirm delete">✓</button>
                <button onClick={cancelDelete} style={{background:'none',border:'none',color:'var(--muted)',cursor:'pointer',fontSize:14,padding:2}} title="Cancel">✗</button>
              </div>
            ) : (
              <button onClick={()=>requestDelete(row.id)} style={{background:'none',border:'none',color:'#ef4444',cursor:'pointer',fontSize:16,padding:4}}>✕</button>
            )}
          </div>
        ))}
        {rows.length===0 && <div style={{textAlign:'center',padding:48}}>
          <div style={{border:'2px dashed var(--border)',borderRadius:16,padding:'40px 24px',maxWidth:400,margin:'0 auto'}}>
            <div style={{fontSize:32,marginBottom:12}}>📊</div>
            <div style={{color:'var(--fg)',fontWeight:600,fontSize:15,marginBottom:6}}>No maturity factors yet</div>
            <div style={{color:'var(--muted)',fontSize:13,marginBottom:16}}>Assess ownership, skills, and business value across key areas.</div>
            <button onClick={addRow} style={{background:'var(--gold)',border:'none',borderRadius:8,padding:'8px 16px',color:'var(--gold-btn-text)',fontWeight:700,cursor:'pointer',fontSize:13}}>+ Add Factor</button>
          </div>
        </div>}
      </div>
    </div>
  );
}

// ── Module 7: KRA ──────────────────────────────────────────────────────────────
function KRAModule({ id, save }: { id:string; save:(e:string,r:unknown[])=>Promise<void> }) {
  const [rows, setRows] = useState<any[]>([]);
  const [roleFilter, setRoleFilter] = useState('All');
  const [confirmingId, setConfirmingId] = useState<number|null>(null);
  const confirmTimer = useRef<ReturnType<typeof setTimeout>|null>(null);
  function requestDelete(rid: number) { setConfirmingId(rid); if (confirmTimer.current) clearTimeout(confirmTimer.current); confirmTimer.current = setTimeout(() => setConfirmingId(null), 3000); }
  function cancelDelete() { setConfirmingId(null); if (confirmTimer.current) clearTimeout(confirmTimer.current); }
  useEffect(() => { fetch(`/api/assessments/${id}/kra`).then(r=>r.json()).then(d=>setRows(d.rows||[])); }, [id]);
  useEffect(() => { if (!rows.length) return; const t = setTimeout(() => save('kra',rows), 1500); return () => clearTimeout(t); }, [rows]);
  function update(rowId: number, field: string, val: string) { setRows(prev=>prev.map(r=>r.id===rowId?{...r,[field]:val}:r)); }
  const ROLES=['Sr Director, Engineering/ VP','Senior Manager/ Director, Engineering','Manager / Project Lead','Developer / Senior Developer'];
  const STATUSES=['not-started','in-progress','achieved'];
  const PILLARS=['Operational Excellence','Pace of Product Evolution','Alignment','Business Results Focused'];
  const filtered = roleFilter==='All' ? rows : rows.filter(r=>r.role_level===roleFilter);
  const roles = [...new Set(filtered.map(r=>r.role_level))];
  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24,gap:12,flexWrap:'wrap' as const}}>
        <div><h2 style={{color:'var(--fg)',margin:0}}>Roles & Performance KRA</h2><p style={{color:'var(--muted)',fontSize:13,margin:'4px 0 0'}}>Define measurable goals for each role level. Set targets, track progress, and update status. Use the role filter to focus on a specific level.</p></div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          {['All',...ROLES].map(r=><button key={r} onClick={()=>setRoleFilter(r)} style={{background:roleFilter===r?'var(--gold)':'var(--card)',border:'1px solid var(--border)',borderRadius:6,padding:'8px 12px',color:roleFilter===r?'var(--gold-btn-text)':'var(--fg)',fontSize:11,fontWeight:roleFilter===r?700:400,cursor:'pointer'}}>{r==='All'?'All':r.split(',')[0]}</button>)}
        </div>
      </div>
      {roles.map(role => {
        const roleRows = filtered.filter(r=>r.role_level===role);
        const rolePillars = [...new Set(roleRows.map(r=>r.pillar||''))];
        return (
          <div key={role} style={{marginBottom:32}}>
            <div style={{fontWeight:700,color:'var(--gold)',fontSize:14,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.05em',display:'flex',alignItems:'center',justifyContent:'space-between'}}><span>{role}</span><button onClick={async()=>{const res=await fetch(`/api/assessments/${id}/kra`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({role_level:role,pillar:'Operational Excellence'})});const d=await res.json();if(d.id)setRows(prev=>[...prev,{id:d.id,role_level:role,pillar:'Operational Excellence',person_name:'',kra_name:'New KRA',description:'',target:'',current:'',status:'not-started',notes:''}]);}} style={{background:'var(--gold)',border:'none',borderRadius:6,padding:'3px 10px',color:'var(--gold-btn-text)',fontWeight:700,cursor:'pointer',fontSize:11}}>+ Add KRA</button></div>
            {rolePillars.map(pillar => (
              <div key={pillar} style={{marginBottom:12}}>
                {pillar && <div style={{fontSize:12,color:'var(--muted)',fontWeight:600,padding:'4px 16px',background:'rgba(201,168,76,0.06)'}}>{pillar}</div>}
                <div className="scroll-table" style={{background:'var(--surface)',borderRadius:8,overflow:'hidden',border:'1px solid var(--border)'}}>
                  {roleRows.filter(r=>(r.pillar||'')===pillar).map((row,i)=>(
                    <div key={row.id} style={{display:'grid',gridTemplateColumns:'1.5fr 2.5fr 0.8fr 0.8fr 110px 1.5fr 36px',gap:'0 12px',padding:'10px 16px',borderTop:i>0?'1px solid var(--border)':'none',background:i%2===0?'transparent':'rgba(255,255,255,0.02)',alignItems:'start'}}>
                      <input value={row.kra_name} onChange={e=>update(row.id,'kra_name',e.target.value)} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:6,padding:'8px 12px',color:'var(--fg)',fontSize:12,outline:'none',width:'100%'}} />
                      <textarea value={row.description||''} onChange={e=>update(row.id,'description',e.target.value)} rows={1} placeholder="What does success look like?" style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:6,padding:'8px 12px',color:'var(--fg)',fontSize:12,resize:'vertical',width:'100%',outline:'none'}} />
                      <input value={row.target||''} onChange={e=>update(row.id,'target',e.target.value)} placeholder="Goal e.g. 95%" style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:6,padding:'8px 12px',color:'var(--fg)',fontSize:12,outline:'none',width:'100%'}} />
                      <input value={row.current||''} onChange={e=>update(row.id,'current',e.target.value)} placeholder="Actual e.g. 78%" style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:6,padding:'8px 12px',color:'var(--fg)',fontSize:12,outline:'none',width:'100%'}} />
                      <select value={row.status} onChange={e=>update(row.id,'status',e.target.value)} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:6,padding:'4px',color:STATUS_COLORS[row.status],fontWeight:600,fontSize:12,cursor:'pointer',outline:'none'}}>
                        {STATUSES.map(s=><option key={s}>{s}</option>)}
                      </select>
                      <textarea value={row.notes||''} onChange={e=>update(row.id,'notes',e.target.value)} rows={1} placeholder="Progress notes or blockers…" style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:6,padding:'8px 12px',color:'var(--fg)',fontSize:12,resize:'vertical',width:'100%',outline:'none'}} />
                      {confirmingId===row.id ? (
                        <div style={{display:'flex',gap:2}}>
                          <button onClick={async()=>{cancelDelete();await fetch(`/api/assessments/${id}/kra`,{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({row_id:row.id})});setRows(prev=>prev.filter(r=>r.id!==row.id));}} style={{background:'none',border:'none',color:'#22c55e',cursor:'pointer',fontSize:16,padding:2}} title="Confirm delete">✓</button>
                          <button onClick={cancelDelete} style={{background:'none',border:'none',color:'var(--muted)',cursor:'pointer',fontSize:14,padding:2}} title="Cancel">✗</button>
                        </div>
                      ) : (
                        <button onClick={()=>requestDelete(row.id)} style={{background:'none',border:'none',color:'#ef4444',cursor:'pointer',fontSize:16,padding:4}}>✕</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
      })}
      {filtered.length===0 && <div style={{textAlign:'center',padding:48}}>
        <div style={{border:'2px dashed var(--border)',borderRadius:16,padding:'40px 24px',maxWidth:400,margin:'0 auto'}}>
          <div style={{fontSize:32,marginBottom:12}}>🎯</div>
          <div style={{color:'var(--fg)',fontWeight:600,fontSize:15,marginBottom:6}}>No Key Result Areas defined yet</div>
          <div style={{color:'var(--muted)',fontSize:13}}>Select a role level above, then click '+ Add KRA' to set goals.</div>
        </div>
      </div>}
    </div>
  );
}

// ── Module 8: Leadership ───────────────────────────────────────────────────────
function LeadershipModule({ id, save }: { id:string; save:(e:string,r:unknown[])=>Promise<void> }) {
  const [rows, setRows] = useState<any[]>([]);
  const [newLeader, setNewLeader] = useState('');
  const [newRole, setNewRole] = useState('');
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [confirmingId, setConfirmingId] = useState<string|number|null>(null);
  const confirmTimer = useRef<ReturnType<typeof setTimeout>|null>(null);
  function requestDelete(rid: string|number) { setConfirmingId(rid); if (confirmTimer.current) clearTimeout(confirmTimer.current); confirmTimer.current = setTimeout(() => setConfirmingId(null), 3000); }
  function cancelDelete() { setConfirmingId(null); if (confirmTimer.current) clearTimeout(confirmTimer.current); }
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
  async function deleteSkill(rowId: number) { await fetch(`/api/assessments/${id}/leadership`,{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({row_id:rowId})}); setRows(prev=>prev.filter(r=>r.id!==rowId)); }
  function toggleDetail(rowId: number) { setExpanded(prev => { const n = new Set(prev); n.has(rowId) ? n.delete(rowId) : n.add(rowId); return n; }); }
  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24,gap:12,flexWrap:'wrap' as const}}>
        <div><h2 style={{color:'var(--fg)',margin:0}}>Leadership Qualities</h2><p style={{color:'var(--muted)',fontSize:13,margin:'4px 0 0'}}>Evaluate each engineering leader across standardised leadership skills. Mandatory skills are marked with a star — focus on these first. Expand any skill to see its detailed breakdown.</p></div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <input value={newLeader} onChange={e=>setNewLeader(e.target.value)} placeholder="e.g. Jane Smith" style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:8,padding:'8px 12px',color:'var(--fg)',fontSize:13,outline:'none',width:160}} />
          <input value={newRole} onChange={e=>setNewRole(e.target.value)} placeholder="e.g. Sr. Engineering Manager" style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:8,padding:'8px 12px',color:'var(--fg)',fontSize:13,outline:'none',width:140}} />
          <button onClick={addLeader} style={{background:'var(--gold)',border:'none',borderRadius:8,padding:'8px 16px',color:'var(--gold-btn-text)',fontWeight:700,cursor:'pointer',fontSize:13}}>+ Add Leader</button>
        </div>
      </div>
      {leaders.map(leader=>{
        const leaderRows = rows.filter(r=>r.leader_name===leader);
        const leaderRole = leaderRows[0]?.leader_role||'';
        const categories = [...new Set(leaderRows.map(r=>r.skill_category||''))];
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
              {confirmingId===`leader:${leader}` ? (
                <div style={{display:'flex',gap:6,alignItems:'center'}}>
                  <span style={{fontSize:12,color:'#ef4444'}}>Remove?</span>
                  <button onClick={()=>{cancelDelete();deleteLeader(leader);}} style={{background:'none',border:'1px solid #22c55e',borderRadius:6,padding:'4px 10px',color:'#22c55e',cursor:'pointer',fontSize:12}}>Yes</button>
                  <button onClick={cancelDelete} style={{background:'none',border:'1px solid var(--border)',borderRadius:6,padding:'4px 10px',color:'var(--muted)',cursor:'pointer',fontSize:12}}>No</button>
                </div>
              ) : (
                <button onClick={()=>requestDelete(`leader:${leader}`)} style={{background:'none',border:'1px solid #ef4444',borderRadius:6,padding:'4px 10px',color:'#ef4444',cursor:'pointer',fontSize:12}}>Remove Leader</button>
              )}
            </div>
            {categories.map(cat => {
              const catRows = leaderRows.filter(r=>(r.skill_category||'')===cat);
              return (
                <div key={cat} style={{marginBottom:16}}>
                  {cat && <div style={{fontSize:12,color:'var(--muted)',fontWeight:600,padding:'6px 16px',background:'rgba(201,168,76,0.08)',borderRadius:'8px 8px 0 0',textTransform:'uppercase',letterSpacing:'0.05em'}}>{cat}</div>}
                  <div className="scroll-table" style={{background:'var(--surface)',borderRadius:cat?'0 0 12px 12px':'12px',overflow:'hidden',border:'1px solid var(--border)'}}>
                    {catRows.map((row,i)=>(
                      <div key={row.id}>
                        <div style={{display:'grid',gridTemplateColumns:'1.2fr 100px 2fr 28px 36px',gap:'0 12px',padding:'10px 16px',borderTop:i>0?'1px solid var(--border)':'none',background:i%2===0?'transparent':'rgba(255,255,255,0.02)',alignItems:'center'}}>
                          <div style={{display:'flex',alignItems:'center',gap:6}}>
                            {row.detailed_skills && <button onClick={()=>toggleDetail(row.id)} style={{background:'none',border:'none',color:'var(--muted)',cursor:'pointer',fontSize:10,padding:0}}>{expanded.has(row.id)?'▼':'▶'}</button>}
                            <span style={{color:'var(--fg)',fontSize:13,fontWeight:row.is_mandatory?600:400}}>{row.skill_name}</span>
                          </div>
                          <div style={{display:'flex',alignItems:'center',gap:8}}>
                            <input type="range" min={0} max={10} value={row.score} onChange={e=>update(row.id,'score',parseInt(e.target.value))} style={{width:50,accentColor:'var(--gold)'}} />
                            <span style={{color:'var(--gold)',fontWeight:700,fontSize:14,minWidth:16}}>{row.score}</span>
                          </div>
                          <input value={row.notes||''} onChange={e=>update(row.id,'notes',e.target.value)} placeholder="Observations or development actions…" style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:6,padding:'8px 12px',color:'var(--fg)',fontSize:12,outline:'none',width:'100%'}} />
                          <div style={{textAlign:'center',color:row.is_mandatory?'#f59e0b':'var(--border)',fontSize:14}} title={row.is_mandatory?'Mandatory':''}>★</div>
                          {confirmingId===row.id ? (
                            <div style={{display:'flex',gap:2}}>
                              <button onClick={()=>{cancelDelete();deleteSkill(row.id);}} style={{background:'none',border:'none',color:'#22c55e',cursor:'pointer',fontSize:14,padding:2}} title="Confirm delete">✓</button>
                              <button onClick={cancelDelete} style={{background:'none',border:'none',color:'var(--muted)',cursor:'pointer',fontSize:12,padding:2}} title="Cancel">✗</button>
                            </div>
                          ) : (
                            <button onClick={()=>requestDelete(row.id)} style={{background:'none',border:'none',color:'#ef4444',cursor:'pointer',fontSize:14,padding:2}}>✕</button>
                          )}
                        </div>
                        {expanded.has(row.id) && row.detailed_skills && (
                          <div style={{padding:'4px 16px 8px 40px',fontSize:12,color:'var(--muted)',lineHeight:1.5,borderTop:'1px dashed var(--border)',background:'rgba(201,168,76,0.03)'}}>
                            <strong>Detailed Skills:</strong> {row.detailed_skills}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
      {leaders.length===0&&<div style={{textAlign:'center',padding:48}}>
        <div style={{border:'2px dashed var(--border)',borderRadius:16,padding:'40px 24px',maxWidth:400,margin:'0 auto'}}>
          <div style={{fontSize:32,marginBottom:12}}>👥</div>
          <div style={{color:'var(--fg)',fontWeight:600,fontSize:15,marginBottom:6}}>No leaders added yet</div>
          <div style={{color:'var(--muted)',fontSize:13}}>Enter a name and role above, then click '+ Add Leader' to begin the assessment.</div>
        </div>
      </div>}
    </div>
  );
}

// ── Module 9: Engineering Talent Map ──────────────────────────────────────────
type TalentSubTab = 'profile'|'technical'|'mindset'|'knowledge'|'ai'|'tracker';
function TalentMapModule({ id }: { id:string }) {
  const [engineers, setEngineers] = useState<any[]>([]);
  const [selectedEng, setSelectedEng] = useState<number|null>(null);
  const [subTab, setSubTab] = useState<TalentSubTab>('profile');
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [confirmingId, setConfirmingId] = useState<number|null>(null);
  const confirmTimer = useRef<ReturnType<typeof setTimeout>|null>(null);
  function requestDelete(rid: number) { setConfirmingId(rid); if (confirmTimer.current) clearTimeout(confirmTimer.current); confirmTimer.current = setTimeout(() => setConfirmingId(null), 3000); }
  function cancelDelete() { setConfirmingId(null); if (confirmTimer.current) clearTimeout(confirmTimer.current); }

  useEffect(() => {
    fetch(`/api/assessments/${id}/talent`).then(r=>r.json()).then(d=>{
      setEngineers(d.engineers||[]);
      if (d.engineers?.length && !selectedEng) setSelectedEng(d.engineers[0].id);
    });
  }, [id]);

  const eng = engineers.find(e => e.id === selectedEng);

  async function addEngineer() {
    if (!newName.trim()) return;
    const res = await fetch(`/api/assessments/${id}/talent`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:newName})});
    const d = await res.json();
    if (d.id) {
      // Refetch to get skills
      const r2 = await fetch(`/api/assessments/${id}/talent`).then(r=>r.json());
      setEngineers(r2.engineers||[]);
      setSelectedEng(d.id);
      setNewName('');
    }
  }

  async function deleteEngineer(engId: number) {
    await fetch(`/api/assessments/${id}/talent`,{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({engineer_id:engId})});
    setEngineers(prev => prev.filter(e => e.id !== engId));
    if (selectedEng === engId) setSelectedEng(engineers.find(e => e.id !== engId)?.id || null);
  }

  function updateEng(field: string, val: string) {
    setEngineers(prev => prev.map(e => e.id===selectedEng ? {...e,[field]:val} : e));
  }

  function updateSkill(skillId: number, field: string, val: string|number) {
    setEngineers(prev => prev.map(e => e.id===selectedEng ? {...e, skills: e.skills.map((s:any) => s.id===skillId ? {...s,[field]:val} : s)} : e));
  }

  // Auto-save with debounce
  useEffect(() => {
    if (!eng) return;
    const t = setTimeout(async () => {
      setSaving(true);
      await fetch(`/api/assessments/${id}/talent`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({engineer:eng,skills:eng.skills})});
      setSaving(false); setSaveMsg('Saved'); setTimeout(()=>setSaveMsg(''),2000);
    }, 1500);
    return () => clearTimeout(t);
  }, [eng]);

  function toggleDetail(rowId: number) { setExpanded(prev => { const n = new Set(prev); n.has(rowId) ? n.delete(rowId) : n.add(rowId); return n; }); }

  const SECTIONS_MAP: Record<TalentSubTab, string> = { profile:'', technical:'Technical Skills', mindset:'Product Mindset', knowledge:'Knowledge Management', ai:'AI Readiness', tracker:'' };
  const SUB_TABS: {id:TalentSubTab;label:string}[] = [
    {id:'profile',label:'Profile'},{id:'technical',label:'Technical Skills'},{id:'mindset',label:'Product Mindset'},
    {id:'knowledge',label:'Knowledge Mgmt'},{id:'ai',label:'AI Readiness'},{id:'tracker',label:'Team Tracker'},
  ];

  const SCORE_CLR = (s:number) => s>=8?'#22c55e':s>=5?'#f59e0b':s>=1?'#ef4444':'var(--muted)';

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24,gap:12,flexWrap:'wrap' as const}}>
        <div><h2 style={{color:'var(--fg)',margin:0}}>Engineering Talent Map</h2><p style={{color:'var(--muted)',fontSize:13,margin:'4px 0 0'}}>Build a complete profile for each engineer. Assess technical skills, product mindset, knowledge management, and AI readiness. Use Team Tracker to compare the whole team at a glance.</p></div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          {saving && <span style={{color:'var(--muted)',fontSize:12}}>Saving…</span>}
          {saveMsg && <span style={{color:'#22c55e',fontSize:12}}>{saveMsg}</span>}
          <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="e.g. John Doe" style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:8,padding:'8px 12px',color:'var(--fg)',fontSize:13,outline:'none',width:160}} />
          <button onClick={addEngineer} style={{background:'var(--gold)',border:'none',borderRadius:8,padding:'8px 16px',color:'var(--gold-btn-text)',fontWeight:700,cursor:'pointer',fontSize:13}}>+ Add Engineer</button>
        </div>
      </div>

      {/* Engineer selector tabs */}
      {engineers.length > 0 && (
        <div style={{display:'flex',gap:4,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
          {engineers.map(e => (
            <div key={e.id} style={{display:'flex',alignItems:'center',gap:0}}>
              <button onClick={()=>setSelectedEng(e.id)} style={{background:selectedEng===e.id?'var(--gold)':'var(--card)',border:'1px solid var(--border)',borderRadius:'8px 0 0 8px',padding:'8px 14px',color:selectedEng===e.id?'var(--gold-btn-text)':'var(--fg)',fontSize:13,fontWeight:selectedEng===e.id?700:400,cursor:'pointer'}}>{e.name}</button>
              {confirmingId===e.id ? (
                <div style={{display:'flex',alignItems:'center',background:selectedEng===e.id?'var(--gold)':'var(--card)',border:'1px solid var(--border)',borderLeft:'none',borderRadius:'0 8px 8px 0',padding:'4px 6px',gap:2}}>
                  <button onClick={()=>{cancelDelete();deleteEngineer(e.id);}} style={{background:'none',border:'none',color:'#22c55e',cursor:'pointer',fontSize:14,padding:2}} title="Confirm delete">✓</button>
                  <button onClick={cancelDelete} style={{background:'none',border:'none',color:'var(--muted)',cursor:'pointer',fontSize:12,padding:2}} title="Cancel">✗</button>
                </div>
              ) : (
                <button onClick={()=>requestDelete(e.id)} style={{background:selectedEng===e.id?'var(--gold)':'var(--card)',border:'1px solid var(--border)',borderLeft:'none',borderRadius:'0 8px 8px 0',padding:'8px 8px',color:'#ef4444',cursor:'pointer',fontSize:12}}>✕</button>
              )}
            </div>
          ))}
        </div>
      )}

      {eng && (
        <>
          {/* Sub-tabs */}
          <div style={{position:'relative',marginBottom:20}}>
            <div className="talent-subtabs" style={{display:'flex',gap:2,background:'var(--surface)',borderRadius:8,border:'1px solid var(--border)',overflowX:'auto'}}>
              {SUB_TABS.map(st => (
                <button key={st.id} onClick={()=>setSubTab(st.id)} style={{flexShrink:0,padding:'10px 16px',background:'none',border:'none',borderBottom:`3px solid ${subTab===st.id?'var(--gold)':'transparent'}`,color:subTab===st.id?'var(--gold)':'var(--muted)',fontSize:12,fontWeight:subTab===st.id?700:400,cursor:'pointer',whiteSpace:'nowrap'}}>
                  {st.label}
                </button>
              ))}
            </div>
            <div style={{position:'absolute',right:0,top:0,bottom:0,width:24,background:'linear-gradient(to right,transparent,var(--surface))',borderRadius:'0 8px 8px 0',pointerEvents:'none'}} />
          </div>

          {/* Profile sub-tab */}
          {subTab === 'profile' && (
            <div style={{background:'var(--surface)',borderRadius:12,border:'1px solid var(--border)',padding:24}}>
              <div className="grid-stack" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                {([
                  ['name','Name'],['employee_id','Employee ID'],['team','Team'],['reports_to','Reports To'],
                  ['job_title','Job Title'],['level','Level'],['specialisation','Specialisation'],['employment','Employment Type'],
                  ['product_name','Product'],['industry','Industry'],['ai_phase','AI Phase'],['primary_stack','Primary Stack'],
                ] as [string,string][]).map(([field,label]) => (
                  <div key={field}>
                    <div style={{fontSize:12,color:'var(--muted)',fontWeight:600,marginBottom:4}}>{label}</div>
                    {field==='level' ? (
                      <select value={eng[field]||'Mid'} onChange={e=>updateEng(field,e.target.value)} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:6,padding:'8px 12px',color:'var(--fg)',fontSize:13,outline:'none',width:'100%'}}>
                        {['Junior','Mid','Senior','Staff','Principal','Lead','Manager'].map(l=><option key={l}>{l}</option>)}
                      </select>
                    ) : field==='employment' ? (
                      <select value={eng[field]||'Full-time'} onChange={e=>updateEng(field,e.target.value)} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:6,padding:'8px 12px',color:'var(--fg)',fontSize:13,outline:'none',width:'100%'}}>
                        {['Full-time','Part-time','Contract','Intern'].map(l=><option key={l}>{l}</option>)}
                      </select>
                    ) : field==='ai_phase' ? (
                      <select value={eng[field]||'Phase 1'} onChange={e=>updateEng(field,e.target.value)} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:6,padding:'8px 12px',color:'var(--fg)',fontSize:13,outline:'none',width:'100%'}}>
                        {['Phase 1','Phase 2','Phase 3'].map(l=><option key={l}>{l}</option>)}
                      </select>
                    ) : (
                      <input value={eng[field]||''} onChange={e=>updateEng(field,e.target.value)} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:6,padding:'8px 12px',color:'var(--fg)',fontSize:13,outline:'none',width:'100%'}} />
                    )}
                  </div>
                ))}
              </div>
              <div className="grid-stack" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginTop:16}}>
                {([['key_strengths','Key Strengths'],['development_focus','Development Focus'],['training_recommendation','Training Recommendation'],['career_goal','Career Goal'],['manager_notes','Manager Notes']] as [string,string][]).map(([field,label]) => (
                  <div key={field}>
                    <div style={{fontSize:12,color:'var(--muted)',fontWeight:600,marginBottom:4}}>{label}</div>
                    <textarea value={eng[field]||''} onChange={e=>updateEng(field,e.target.value)} rows={3} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:6,padding:'8px 12px',color:'var(--fg)',fontSize:13,resize:'vertical',width:'100%',outline:'none'}} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skill assessment sub-tabs (technical, mindset, knowledge, ai) */}
          {['technical','mindset','knowledge','ai'].includes(subTab) && (
            <div>
              {(() => {
                const section = SECTIONS_MAP[subTab];
                const sectionSkills = (eng.skills || []).filter((s:any) => s.section === section);
                const categories = [...new Set(sectionSkills.map((s:any) => s.category))] as string[];
                return categories.map((cat) => (
                  <div key={cat} style={{marginBottom:20}}>
                    <div style={{fontSize:12,color:'var(--muted)',fontWeight:600,padding:'6px 16px',background:'rgba(201,168,76,0.08)',borderRadius:'8px 8px 0 0',textTransform:'uppercase',letterSpacing:'0.05em'}}>{cat}</div>
                    <div className="scroll-table" style={{background:'var(--surface)',borderRadius:'0 0 12px 12px',overflow:'hidden',border:'1px solid var(--border)'}}>
                      <div style={{display:'grid',gridTemplateColumns:'1.2fr 64px 64px 64px 2fr 40px',gap:'0 12px',background:'var(--card)',padding:'8px 16px',fontSize:11,fontWeight:600,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.05em'}}>
                        <div>Skill</div><div>Self Score</div><div>Mgr Score</div><div>Target</div><div>Notes</div><div></div>
                      </div>
                      {sectionSkills.filter((s:any)=>s.category===cat).map((skill:any,i:number)=>(
                        <div key={skill.id}>
                          <div style={{display:'grid',gridTemplateColumns:'1.2fr 64px 64px 64px 2fr 40px',gap:'0 12px',padding:'10px 16px',borderTop:'1px solid var(--border)',background:i%2===0?'transparent':'rgba(255,255,255,0.02)',alignItems:'center'}}>
                            <div style={{display:'flex',alignItems:'center',gap:6}}>
                              {skill.description && <button onClick={()=>toggleDetail(skill.id)} style={{background:'none',border:'none',color:'var(--muted)',cursor:'pointer',fontSize:10,padding:0}}>{expanded.has(skill.id)?'▼':'▶'}</button>}
                              <span style={{color:'var(--fg)',fontSize:13}}>{skill.skill_name}</span>
                            </div>
                            <div style={{display:'flex',alignItems:'center',gap:4}}>
                              <input type="number" min={0} max={10} value={skill.self_score} onChange={e=>updateSkill(skill.id,'self_score',parseInt(e.target.value)||0)} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:6,padding:'8px 12px',color:SCORE_CLR(skill.self_score),fontWeight:700,fontSize:13,outline:'none',width:44,textAlign:'center'}} />
                            </div>
                            <div style={{display:'flex',alignItems:'center',gap:4}}>
                              <input type="number" min={0} max={10} value={skill.manager_score} onChange={e=>updateSkill(skill.id,'manager_score',parseInt(e.target.value)||0)} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:6,padding:'8px 12px',color:SCORE_CLR(skill.manager_score),fontWeight:700,fontSize:13,outline:'none',width:44,textAlign:'center'}} />
                            </div>
                            <div style={{display:'flex',alignItems:'center',gap:4}}>
                              <input type="number" min={0} max={10} value={skill.target_score} onChange={e=>updateSkill(skill.id,'target_score',parseInt(e.target.value)||0)} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:6,padding:'8px 12px',color:'var(--muted)',fontWeight:700,fontSize:13,outline:'none',width:44,textAlign:'center'}} />
                            </div>
                            <input value={skill.notes||''} onChange={e=>updateSkill(skill.id,'notes',e.target.value)} placeholder="Development plan or evidence…" style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:6,padding:'8px 12px',color:'var(--fg)',fontSize:12,outline:'none',width:'100%'}} />
                            <div style={{textAlign:'center',color:skill.target_score > 0 && skill.manager_score < skill.target_score ? '#ef4444' : '#22c55e',fontSize:12,fontWeight:700}}>
                              {skill.target_score > 0 ? (skill.manager_score >= skill.target_score ? '✓' : `-${skill.target_score - skill.manager_score}`) : '–'}
                            </div>
                          </div>
                          {expanded.has(skill.id) && skill.description && (
                            <div style={{padding:'4px 16px 8px 40px',fontSize:12,color:'var(--muted)',lineHeight:1.5,borderTop:'1px dashed var(--border)',background:'rgba(201,168,76,0.03)'}}>
                              {skill.description}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ));
              })()}
            </div>
          )}

          {/* Team Tracker sub-tab */}
          {subTab === 'tracker' && (
            <div className="scroll-table" style={{background:'var(--surface)',borderRadius:12,border:'1px solid var(--border)',overflow:'hidden'}}>
              <div style={{display:'grid',gridTemplateColumns:'1.5fr 0.8fr repeat(4,80px) 140px',gap:'0 12px',background:'var(--card)',padding:'10px 16px',fontSize:11,fontWeight:600,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.05em'}}>
                <div>Engineer</div><div>Level</div><div>Technical</div><div>Mindset</div><div>Knowledge</div><div>AI Ready</div><div>Overall</div>
              </div>
              {engineers.map((e,i) => {
                const getAvg = (section:string) => {
                  const sk = (e.skills||[]).filter((s:any)=>s.section===section);
                  if (!sk.length) return 0;
                  return sk.reduce((a:number,s:any)=>a+s.manager_score,0)/sk.length;
                };
                const techAvg = getAvg('Technical Skills');
                const mindAvg = getAvg('Product Mindset');
                const knowAvg = getAvg('Knowledge Management');
                const aiAvg = getAvg('AI Readiness');
                const overall = (techAvg+mindAvg+knowAvg+aiAvg)/4;
                return (
                  <div key={e.id} style={{display:'grid',gridTemplateColumns:'1.5fr 0.8fr repeat(4,80px) 140px',gap:'0 12px',padding:'12px 16px',borderTop:'1px solid var(--border)',background:i%2===0?'transparent':'rgba(255,255,255,0.02)',alignItems:'center'}}>
                    <div style={{color:'var(--fg)',fontSize:13,fontWeight:500}}>{e.name}</div>
                    <div style={{color:'var(--muted)',fontSize:12}}>{e.level||'–'}</div>
                    <div style={{color:SCORE_CLR(techAvg),fontWeight:700,fontSize:13}}>{techAvg.toFixed(1)}</div>
                    <div style={{color:SCORE_CLR(mindAvg),fontWeight:700,fontSize:13}}>{mindAvg.toFixed(1)}</div>
                    <div style={{color:SCORE_CLR(knowAvg),fontWeight:700,fontSize:13}}>{knowAvg.toFixed(1)}</div>
                    <div style={{color:SCORE_CLR(aiAvg),fontWeight:700,fontSize:13}}>{aiAvg.toFixed(1)}</div>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <div style={{flex:1,background:'var(--card)',borderRadius:4,height:8,overflow:'hidden'}}>
                        <div style={{width:`${(overall/10)*100}%`,height:'100%',background:SCORE_CLR(overall),borderRadius:4,transition:'width 0.5s'}}></div>
                      </div>
                      <span style={{color:SCORE_CLR(overall),fontWeight:700,fontSize:13,minWidth:28}}>{overall.toFixed(1)}</span>
                    </div>
                  </div>
                );
              })}
              {engineers.length===0 && <div style={{textAlign:'center',padding:48}}>
                <div style={{border:'2px dashed var(--border)',borderRadius:16,padding:'40px 24px',maxWidth:400,margin:'0 auto'}}>
                  <div style={{fontSize:32,marginBottom:12}}>👤</div>
                  <div style={{color:'var(--fg)',fontWeight:600,fontSize:15,marginBottom:6}}>No engineers on the team yet</div>
                  <div style={{color:'var(--muted)',fontSize:13}}>Add one above to start building your talent map.</div>
                </div>
              </div>}
            </div>
          )}
        </>
      )}
      {engineers.length===0 && <div style={{textAlign:'center',padding:48}}>
        <div style={{border:'2px dashed var(--border)',borderRadius:16,padding:'40px 24px',maxWidth:400,margin:'0 auto'}}>
          <div style={{fontSize:32,marginBottom:12}}>🧑‍💻</div>
          <div style={{color:'var(--fg)',fontWeight:600,fontSize:15,marginBottom:6}}>No engineers added yet</div>
          <div style={{color:'var(--muted)',fontSize:13}}>Enter a name above and click '+ Add Engineer' to create a full assessment profile.</div>
        </div>
      </div>}
    </div>
  );
}

// ── Module 10: Technical Skillset Requirements ─────────────────────────────────
function SkillsetModule({ id }: { id:string }) {
  const [context, setContext] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [confirmingId, setConfirmingId] = useState<number|null>(null);
  const confirmTimer = useRef<ReturnType<typeof setTimeout>|null>(null);
  function requestDelete(rid: number) { setConfirmingId(rid); if (confirmTimer.current) clearTimeout(confirmTimer.current); confirmTimer.current = setTimeout(() => setConfirmingId(null), 3000); }
  function cancelDelete() { setConfirmingId(null); if (confirmTimer.current) clearTimeout(confirmTimer.current); }

  useEffect(() => {
    fetch(`/api/assessments/${id}/skillset`).then(r=>r.json()).then(d=>{
      setContext(d.context||[]);
      setItems(d.items||[]);
    });
  }, [id]);

  function updateCtx(rowId: number, val: string) { setContext(prev=>prev.map(c=>c.id===rowId?{...c,field_value:val}:c)); }
  function updateItem(rowId: number, field: string, val: string) { setItems(prev=>prev.map(i=>i.id===rowId?{...i,[field]:val}:i)); }

  // Auto-save
  useEffect(() => {
    if (!context.length && !items.length) return;
    const t = setTimeout(async () => {
      setSaving(true);
      await fetch(`/api/assessments/${id}/skillset`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({context,items})});
      setSaving(false); setSaveMsg('Saved'); setTimeout(()=>setSaveMsg(''),2000);
    }, 1500);
    return () => clearTimeout(t);
  }, [context, items]);

  async function addItem(section:string, category:string) {
    const res=await fetch(`/api/assessments/${id}/skillset`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'item',section,category})});
    const d=await res.json();
    if(d.id) setItems(prev=>[...prev,{id:d.id,section,category,item_name:'New Skill',description:'',importance:'Important',current_level:'',required_level:'Intermediate',gap:'',notes:''}]);
  }
  async function deleteItem(rowId:number) {
    await fetch(`/api/assessments/${id}/skillset`,{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'item',row_id:rowId})});
    setItems(prev=>prev.filter(i=>i.id!==rowId));
  }

  function toggleDetail(rowId: number) { setExpanded(prev => { const n = new Set(prev); n.has(rowId) ? n.delete(rowId) : n.add(rowId); return n; }); }

  const IMPORTANCE_CLR: Record<string,string> = {'Critical':'#ef4444','Important':'#f59e0b','Nice-to-Have':'#6b7280'};
  const LEVEL_CLR: Record<string,string> = {'Advanced':'#22c55e','Intermediate':'#f59e0b','Basic':'#ef4444','':'var(--muted)'};
  const sections = [...new Set(items.map(i=>i.section))];
  const groups = [...new Set(context.map(c=>c.field_group))];

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24,gap:12,flexWrap:'wrap' as const}}>
        <div><h2 style={{color:'var(--fg)',margin:0}}>Technical Skillset Requirements</h2><p style={{color:'var(--muted)',fontSize:13,margin:'4px 0 0'}}>Define the technical skills your product requires and assess your team against them. The gap analysis at the bottom highlights where critical shortfalls exist.</p></div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          {saving && <span style={{color:'var(--muted)',fontSize:12}}>Saving…</span>}
          {saveMsg && <span style={{color:'#22c55e',fontSize:12}}>{saveMsg}</span>}
        </div>
      </div>

      {/* Product Context */}
      <div style={{marginBottom:28}}>
        <div style={{fontWeight:700,color:'var(--gold)',fontSize:14,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.05em'}}>Product Context</div>
        {groups.map(group => (
          <div key={group} style={{marginBottom:12}}>
            <div style={{fontSize:12,color:'var(--muted)',fontWeight:600,padding:'6px 16px',background:'rgba(201,168,76,0.08)',borderRadius:'8px 8px 0 0',textTransform:'capitalize'}}>{group}</div>
            <div style={{background:'var(--surface)',borderRadius:'0 0 12px 12px',border:'1px solid var(--border)',padding:16}}>
              <div className="grid-stack" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                {context.filter(c=>c.field_group===group).map(c => (
                  <div key={c.id}>
                    <div style={{fontSize:12,color:'var(--muted)',fontWeight:600,marginBottom:4}}>{c.field_name}</div>
                    <input value={c.field_value||''} onChange={e=>updateCtx(c.id,e.target.value)} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:6,padding:'8px 12px',color:'var(--fg)',fontSize:13,outline:'none',width:'100%'}} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Skill Requirements */}
      {sections.map(section => {
        const sectionItems = items.filter(i=>i.section===section);
        const cats = [...new Set(sectionItems.map(i=>i.category||''))];
        return (
          <div key={section} style={{marginBottom:28}}>
            <div style={{fontWeight:700,color:'var(--gold)',fontSize:14,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.05em'}}>{section}</div>
            {cats.map(cat => (
              <div key={cat} style={{marginBottom:16}}>
                {cat && <div style={{fontSize:12,color:'var(--muted)',fontWeight:600,padding:'6px 16px',background:'rgba(201,168,76,0.08)',borderRadius:'8px 8px 0 0',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span>{cat}</span>
                  <button onClick={()=>addItem(section,cat)} style={{background:'var(--gold)',border:'none',borderRadius:6,padding:'3px 10px',color:'var(--gold-btn-text)',fontWeight:700,cursor:'pointer',fontSize:11}}>+ Add Skill</button>
                </div>}
                <div className="scroll-table" style={{background:'var(--surface)',borderRadius:cat?'0 0 12px 12px':'12px',overflow:'hidden',border:'1px solid var(--border)'}}>
                  <div style={{display:'grid',gridTemplateColumns:'1.5fr 90px 90px 90px 56px 2fr 36px',gap:'0 12px',background:'var(--card)',padding:'8px 16px',fontSize:11,fontWeight:600,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'0.05em'}}>
                    <div>Skill Name</div><div>Priority</div><div>Required</div><div>Current</div><div>Gap</div><div>Action Notes</div><div></div>
                  </div>
                  {sectionItems.filter(i=>(i.category||'')===cat).map((item,i)=>(
                    <div key={item.id}>
                      <div style={{display:'grid',gridTemplateColumns:'1.5fr 90px 90px 90px 56px 2fr 36px',gap:'0 12px',padding:'10px 16px',borderTop:'1px solid var(--border)',background:i%2===0?'transparent':'rgba(255,255,255,0.02)',alignItems:'center'}}>
                        <div style={{display:'flex',alignItems:'center',gap:6}}>
                          {item.description && <button onClick={()=>toggleDetail(item.id)} style={{background:'none',border:'none',color:'var(--muted)',cursor:'pointer',fontSize:10,padding:0}}>{expanded.has(item.id)?'▼':'▶'}</button>}
                          <input value={item.item_name} onChange={e=>updateItem(item.id,'item_name',e.target.value)} style={{background:'transparent',border:'none',color:'var(--fg)',fontSize:13,outline:'none',width:'100%'}} />
                        </div>
                        <select value={item.importance||'Important'} onChange={e=>updateItem(item.id,'importance',e.target.value)} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:6,padding:'8px 12px',color:IMPORTANCE_CLR[item.importance]||'var(--fg)',fontWeight:600,fontSize:11,cursor:'pointer',outline:'none'}}>
                          {['Critical','Important','Nice-to-Have'].map(v=><option key={v}>{v}</option>)}
                        </select>
                        <select value={item.required_level||''} onChange={e=>updateItem(item.id,'required_level',e.target.value)} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:6,padding:'8px 12px',color:LEVEL_CLR[item.required_level]||'var(--fg)',fontWeight:600,fontSize:11,cursor:'pointer',outline:'none'}}>
                          {['Basic','Intermediate','Advanced'].map(v=><option key={v}>{v}</option>)}
                        </select>
                        <select value={item.current_level||''} onChange={e=>updateItem(item.id,'current_level',e.target.value)} style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:6,padding:'8px 12px',color:LEVEL_CLR[item.current_level]||'var(--fg)',fontWeight:600,fontSize:11,cursor:'pointer',outline:'none'}}>
                          <option value="">–</option>
                          {['Basic','Intermediate','Advanced'].map(v=><option key={v}>{v}</option>)}
                        </select>
                        <div style={{fontWeight:700,fontSize:12,color:item.current_level&&item.required_level?(item.current_level===item.required_level||(['Advanced'].includes(item.current_level)&&['Basic','Intermediate'].includes(item.required_level))||(['Intermediate','Advanced'].includes(item.current_level)&&item.required_level==='Basic')?'#22c55e':'#ef4444'):'var(--muted)'}}>
                          {item.current_level ? (item.current_level===item.required_level||(['Advanced'].includes(item.current_level)&&['Basic','Intermediate'].includes(item.required_level))||(['Intermediate','Advanced'].includes(item.current_level)&&item.required_level==='Basic') ? '✓' : 'GAP') : '–'}
                        </div>
                        <input value={item.notes||''} onChange={e=>updateItem(item.id,'notes',e.target.value)} placeholder="How to close the gap, or why acceptable…" style={{background:'var(--card)',border:'1px solid var(--border)',borderRadius:6,padding:'8px 12px',color:'var(--fg)',fontSize:12,outline:'none',width:'100%'}} />
                        {confirmingId===item.id ? (
                          <div style={{display:'flex',gap:2}}>
                            <button onClick={()=>{cancelDelete();deleteItem(item.id);}} style={{background:'none',border:'none',color:'#22c55e',cursor:'pointer',fontSize:16,padding:2}} title="Confirm delete">✓</button>
                            <button onClick={cancelDelete} style={{background:'none',border:'none',color:'var(--muted)',cursor:'pointer',fontSize:14,padding:2}} title="Cancel">✗</button>
                          </div>
                        ) : (
                          <button onClick={()=>requestDelete(item.id)} style={{background:'none',border:'none',color:'#ef4444',cursor:'pointer',fontSize:16,padding:4}}>✕</button>
                        )}
                      </div>
                      {expanded.has(item.id) && item.description && (
                        <div style={{padding:'4px 16px 8px 40px',fontSize:12,color:'var(--muted)',lineHeight:1.5,borderTop:'1px dashed var(--border)',background:'rgba(201,168,76,0.03)'}}>
                          {item.description}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
      })}

      {/* Gap Analysis Summary */}
      {items.length > 0 && (
        <div style={{marginBottom:28}}>
          <div style={{fontWeight:700,color:'var(--gold)',fontSize:14,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.05em'}}>Gap Analysis Summary</div>
          <div style={{background:'var(--surface)',borderRadius:12,border:'1px solid var(--border)',padding:24}}>
            <div className="grid-stack" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16}}>
              {(() => {
                const total = items.length;
                const assessed = items.filter(i=>i.current_level).length;
                const gaps = items.filter(i => {
                  if (!i.current_level || !i.required_level) return false;
                  const levels = ['Basic','Intermediate','Advanced'];
                  return levels.indexOf(i.current_level) < levels.indexOf(i.required_level);
                }).length;
                const met = items.filter(i => {
                  if (!i.current_level || !i.required_level) return false;
                  const levels = ['Basic','Intermediate','Advanced'];
                  return levels.indexOf(i.current_level) >= levels.indexOf(i.required_level);
                }).length;
                return (
                  <>
                    <div style={{textAlign:'center'}}>
                      <div style={{fontSize:36,fontWeight:700,color:'var(--fg)'}}>{total}</div>
                      <div style={{fontSize:12,color:'var(--muted)'}}>Total Skills</div>
                    </div>
                    <div style={{textAlign:'center'}}>
                      <div style={{fontSize:36,fontWeight:700,color:'#22c55e'}}>{met}</div>
                      <div style={{fontSize:12,color:'var(--muted)'}}>Requirements Met</div>
                    </div>
                    <div style={{textAlign:'center'}}>
                      <div style={{fontSize:36,fontWeight:700,color:'#ef4444'}}>{gaps}</div>
                      <div style={{fontSize:12,color:'var(--muted)'}}>Gaps Identified</div>
                    </div>
                  </>
                );
              })()}
            </div>
            {/* Critical gaps list */}
            {(() => {
              const criticalGaps = items.filter(i => {
                if (!i.current_level || !i.required_level || i.importance !== 'Critical') return false;
                const levels = ['Basic','Intermediate','Advanced'];
                return levels.indexOf(i.current_level) < levels.indexOf(i.required_level);
              });
              if (!criticalGaps.length) return null;
              return (
                <div style={{marginTop:16,padding:16,background:'rgba(239,68,68,0.08)',borderRadius:8,border:'1px solid rgba(239,68,68,0.2)'}}>
                  <div style={{fontSize:12,fontWeight:700,color:'#ef4444',marginBottom:8,textTransform:'uppercase'}}>Critical Gaps</div>
                  {criticalGaps.map(g => (
                    <div key={g.id} style={{fontSize:13,color:'var(--fg)',marginBottom:4}}>
                      <strong>{g.item_name}</strong> <span style={{color:'var(--muted)'}}>({g.section} / {g.category})</span> — Current: {g.current_level}, Required: {g.required_level}
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {items.length===0 && context.length===0 && <div style={{textAlign:'center',padding:48}}>
        <div style={{border:'2px dashed var(--border)',borderRadius:16,padding:'40px 24px',maxWidth:400,margin:'0 auto'}}>
          <div style={{fontSize:32,marginBottom:12}}>🔧</div>
          <div style={{color:'var(--fg)',fontWeight:600,fontSize:15,marginBottom:6}}>No skill requirements defined yet</div>
          <div style={{color:'var(--muted)',fontSize:13}}>If you used a template, data should appear here — otherwise add skills manually.</div>
        </div>
      </div>}
    </div>
  );
}
