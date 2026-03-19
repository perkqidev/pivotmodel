'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface SkillRow {
  id: number;
  section: string;
  skill: string;
  why_matters: string;
  importance: 'Critical' | 'High' | 'Standard' | 'Nice to Have';
  min_level: number;
  ideal_level: number;
  depth: string;
  engineers_needed: number | null;
  seniority: string;
  notes: string;
  sort_order: number;
}

interface SkillProfile {
  id: number;
  name: string;
  context: Record<string, string>;
  row_count: number;
  created_at: string;
  updated_at: string;
}

const IMPORTANCE_COLOR: Record<string, string> = {
  'Critical':      '#e88b7e',
  'High':          '#C9A84C',
  'Standard':      '#7eb6e8',
  'Nice to Have':  '#9e9e9e',
};

const SECTIONS = [
  '1. Design Methodologies',
  '2. Coding, AI & Dev Tools',
  '3. System Understanding',
  '4. Operational Factors',
  '5. Sizing & Deployment',
  '6. AI Readiness',
];

const CONTEXT_FIELDS = [
  { key: 'product_name',    label: 'Product Name',           placeholder: 'e.g. MyApp v2' },
  { key: 'company',         label: 'Company / Organisation', placeholder: 'e.g. Acme Corp' },
  { key: 'product_owner',   label: 'Product Owner',          placeholder: 'Name' },
  { key: 'engineering_lead',label: 'Engineering Lead',       placeholder: 'Name' },
  { key: 'product_category',label: 'Product Category',       placeholder: 'Enterprise / Standalone / SaaS' },
  { key: 'tech_stack',      label: 'Primary Tech Stack',     placeholder: 'e.g. Java Spring Boot, React, PostgreSQL, AWS' },
  { key: 'offshore_mix',    label: 'Offshore / Onshore Mix', placeholder: 'e.g. 70% offshore / 30% onshore' },
  { key: 'maturity_level',  label: 'Current Maturity Level', placeholder: 'L1 / L2 / L3' },
  { key: 'ai_phase',        label: 'Current AI Phase',       placeholder: 'Phase 1 / 2 / 3' },
  { key: 'hiring_timeline', label: 'Hiring Timeline',        placeholder: 'Immediate / 3 months / 6 months / 12M+' },
  { key: 'key_gap',         label: 'Key Capability Gap',     placeholder: 'Biggest gap to address' },
  { key: 'biggest_risk',    label: 'Biggest Technical Risk', placeholder: 'Today\'s #1 technical risk' },
];

// ── Default template rows ─────────────────────────────────────────────────────
export const SKILL_REQ_TEMPLATE: Omit<SkillRow, 'id' | 'profile_id'>[] = [
  // 1. Design Methodologies
  { section:'1. Design Methodologies', skill:'Domain-Driven Design (DDD)', why_matters:'Aligns architecture with business domains. Critical for complex, multi-context products.', importance:'Critical', min_level:6, ideal_level:8, depth:'D+E', engineers_needed:null, seniority:'Senior / Lead', notes:'Bounded contexts, ubiquitous language, aggregates, context mapping.', sort_order:1 },
  { section:'1. Design Methodologies', skill:'Component Model / Modular Design', why_matters:'Enables independent development and testing of product modules. Foundation for team scalability.', importance:'Critical', min_level:5, ideal_level:8, depth:'D+B', engineers_needed:null, seniority:'Mid / Senior', notes:'Self-contained components with well-defined interfaces.', sort_order:2 },
  { section:'1. Design Methodologies', skill:'Microservices & RESTful APIs', why_matters:'Required if product is distributed or expects high scale. Enables independent deployment and resilience.', importance:'High', min_level:5, ideal_level:8, depth:'D+E', engineers_needed:null, seniority:'Senior / Lead', notes:'Saga, circuit breaker, service discovery, API gateway patterns.', sort_order:3 },
  { section:'1. Design Methodologies', skill:'Event-Driven Architecture (EDA)', why_matters:'Required for real-time features, decoupled systems, or high-throughput products.', importance:'High', min_level:4, ideal_level:7, depth:'D', engineers_needed:null, seniority:'Senior', notes:'Publish/subscribe, event sourcing, CQRS. Kafka, RabbitMQ.', sort_order:4 },
  { section:'1. Design Methodologies', skill:'Pipeline / Data-Flow Architecture', why_matters:'Required for data-intensive products, analytics platforms, or ML pipelines.', importance:'Standard', min_level:4, ideal_level:7, depth:'D+B', engineers_needed:null, seniority:'Mid / Senior', notes:'ETL, Apache Flink, Kafka Streams. Critical if AI/ML pipelines present.', sort_order:5 },
  { section:'1. Design Methodologies', skill:'Reactive Architecture', why_matters:'Needed for products requiring high throughput or real-time data processing.', importance:'Standard', min_level:4, ideal_level:7, depth:'D', engineers_needed:null, seniority:'Senior', notes:'Responsive, resilient, elastic, message-driven per Reactive Manifesto.', sort_order:6 },
  { section:'1. Design Methodologies', skill:'Aspect-Oriented Programming (AOP)', why_matters:'Useful for cleanly separating cross-cutting concerns: logging, security, caching.', importance:'Nice to Have', min_level:3, ideal_level:6, depth:'B', engineers_needed:null, seniority:'Mid', notes:'Aspects, join points, advice, pointcuts.', sort_order:7 },
  // 2. Coding, AI & Dev Tools
  { section:'2. Coding, AI & Dev Tools', skill:'Code Extensibility & Maintainability', why_matters:'Production code must endure the full product lifespan. #1 cause of velocity decline over time.', importance:'Critical', min_level:6, ideal_level:9, depth:'D+E', engineers_needed:null, seniority:'Mid / Senior', notes:'Consistent guidelines, readable structure, peer reviews.', sort_order:8 },
  { section:'2. Coding, AI & Dev Tools', skill:'Performance & Scalability', why_matters:'Code must run reliably in production at expected and peak load.', importance:'Critical', min_level:6, ideal_level:8, depth:'D+E', engineers_needed:null, seniority:'Senior', notes:'Profile early, not late. Proactive review in senior-led code review.', sort_order:9 },
  { section:'2. Coding, AI & Dev Tools', skill:'Security Coding Practices', why_matters:'Security must be embedded throughout development — not bolted on at release.', importance:'Critical', min_level:5, ideal_level:8, depth:'D+B', engineers_needed:null, seniority:'Mid / Senior', notes:'OWASP Top 10, secrets management. Critical for FinTech, Healthcare.', sort_order:10 },
  { section:'2. Coding, AI & Dev Tools', skill:'Testability & Test Architecture', why_matters:'Code written with testing in mind reduces defects and builds deployment confidence.', importance:'Critical', min_level:6, ideal_level:8, depth:'D+B', engineers_needed:null, seniority:'Mid / Senior', notes:'Unit, integration, end-to-end. DI, modular design, separation of concerns.', sort_order:11 },
  { section:'2. Coding, AI & Dev Tools', skill:'AI-Augmented Development (Phase 1)', why_matters:'Engineers must guide, review, and validate AI output — not just write code.', importance:'Critical', min_level:5, ideal_level:8, depth:'D+B', engineers_needed:null, seniority:'Mid / Senior', notes:'Prompt engineering, context injection, multi-stage review. Claude Code, Copilot.', sort_order:12 },
  { section:'2. Coding, AI & Dev Tools', skill:'Prompt Engineering', why_matters:'Quality of AI output is directly proportional to prompt quality.', importance:'High', min_level:4, ideal_level:7, depth:'D+B', engineers_needed:null, seniority:'Mid / Senior', notes:'Context injection, incremental prompting, reference patterns.', sort_order:13 },
  { section:'2. Coding, AI & Dev Tools', skill:'Dev Toolchain & Ecosystem', why_matters:'Broad knowledge of IDEs, static analysis, linting, code review tools, version control.', importance:'Standard', min_level:5, ideal_level:7, depth:'B', engineers_needed:null, seniority:'All levels', notes:'Git, SonarQube, ESLint, IDEs. Standard for all product engineers.', sort_order:14 },
  // 3. System Understanding
  { section:'3. System Understanding', skill:'Framework Mastery (Primary Stack)', why_matters:'Engineers must understand framework internals — not just API surface.', importance:'Critical', min_level:7, ideal_level:9, depth:'D+E', engineers_needed:null, seniority:'Senior / Lead', notes:'Spring-Boot, Go, Quarkus, Django, React. Understand state machines, config impacts.', sort_order:15 },
  { section:'3. System Understanding', skill:'Cloud Platform & Services', why_matters:'Modern products are cloud-native. Engineers must navigate the full cloud ecosystem.', importance:'Critical', min_level:5, ideal_level:8, depth:'D+B', engineers_needed:null, seniority:'Mid / Senior', notes:'AWS / Azure / GCP. Compute, networking, storage, IAM, managed services.', sort_order:16 },
  { section:'3. System Understanding', skill:'Containerization & Orchestration', why_matters:'Docker and Kubernetes are table-stakes for cloud-native products.', importance:'Critical', min_level:5, ideal_level:8, depth:'D+B', engineers_needed:null, seniority:'Mid / Senior', notes:'Docker, Kubernetes, Helm. Container networking, resource limits, rolling deployments.', sort_order:17 },
  { section:'3. System Understanding', skill:'Database Architecture & Design', why_matters:"Data is the product's most critical asset. Schema design directly affects user experience.", importance:'Critical', min_level:6, ideal_level:9, depth:'D+E', engineers_needed:null, seniority:'Senior', notes:'PostgreSQL, MySQL, MongoDB, Redis. Indexing strategy, schema evolution.', sort_order:18 },
  { section:'3. System Understanding', skill:'Third-Party & Open-Source Integration', why_matters:'Products depend on external components. Engineers must evaluate and integrate with judgment.', importance:'High', min_level:5, ideal_level:7, depth:'B+E', engineers_needed:null, seniority:'Senior', notes:'OAuth 2.0, REST standards, SDKs. Ability to inspect open-source internals.', sort_order:19 },
  { section:'3. System Understanding', skill:'Domain / Business Knowledge', why_matters:'Engineers must understand the business domain to make practical decisions without constant PM oversight.', importance:'High', min_level:5, ideal_level:8, depth:'B+E', engineers_needed:null, seniority:'Senior / Lead', notes:'Industry-specific workflows, terminology, compliance context.', sort_order:20 },
  // 4. Operational Factors
  { section:'4. Operational Factors', skill:'Application Performance Tuning', why_matters:'Product must handle expected and peak load efficiently. Performance issues in production are costly.', importance:'Critical', min_level:6, ideal_level:8, depth:'D+E', engineers_needed:null, seniority:'Senior', notes:'Load handling, memory profiling, resource contention detection.', sort_order:21 },
  { section:'4. Operational Factors', skill:'Monitoring & Observability', why_matters:'Continuous monitoring is the only way to detect issues before users report them.', importance:'Critical', min_level:5, ideal_level:8, depth:'D+B', engineers_needed:null, seniority:'Mid / Senior', notes:'Metrics, distributed tracing, log aggregation, anomaly detection. Prometheus, Grafana, DataDog.', sort_order:22 },
  { section:'4. Operational Factors', skill:'Production Incident Response', why_matters:'Engineers must diagnose and resolve production issues rapidly. MTTR is a key maturity metric.', importance:'High', min_level:5, ideal_level:7, depth:'D+E', engineers_needed:null, seniority:'Senior', notes:'On-call readiness, runbooks, post-incident reviews, blameless culture.', sort_order:23 },
  { section:'4. Operational Factors', skill:'Cloud Cost Optimization', why_matters:'Resource usage directly affects operating costs. Cost overruns are a common cause of offshore tension.', importance:'High', min_level:4, ideal_level:7, depth:'D+B', engineers_needed:null, seniority:'Mid / Senior', notes:'AWS Cost Explorer, Azure Cost Management. Right-sizing, reserved instances.', sort_order:24 },
  { section:'4. Operational Factors', skill:'Security Operations (DevSecOps)', why_matters:'Security cannot be a separate team responsibility. Engineers must own it throughout delivery.', importance:'High', min_level:5, ideal_level:7, depth:'D+B', engineers_needed:null, seniority:'Mid / Senior', notes:'Secrets management, SAST/DAST, dependency scanning. Critical for regulated industries.', sort_order:25 },
  // 5. Sizing & Deployment
  { section:'5. Sizing & Deployment', skill:'CI/CD Pipeline Design & Operation', why_matters:'Frequent release cycles require fully automated build, test, and deploy pipelines.', importance:'Critical', min_level:6, ideal_level:9, depth:'D+B', engineers_needed:null, seniority:'Mid / Senior', notes:'Jenkins, GitHub Actions, Azure DevOps, GitLab CI. Pipeline as code.', sort_order:26 },
  { section:'5. Sizing & Deployment', skill:'Infrastructure as Code (IaC)', why_matters:'Repeatable, auditable infrastructure is essential for consistency and disaster recovery.', importance:'High', min_level:5, ideal_level:8, depth:'D+B', engineers_needed:null, seniority:'Mid / Senior', notes:'Terraform, Pulumi, AWS CDK, Ansible. Version-controlled infrastructure.', sort_order:27 },
  { section:'5. Sizing & Deployment', skill:'Cloud Deployment Architecture', why_matters:'Engineers must design and operate cloud deployments — not just hand off to Ops.', importance:'Critical', min_level:5, ideal_level:8, depth:'D+E', engineers_needed:null, seniority:'Senior', notes:'Docker/Kubernetes, load balancing, auto-scaling, multi-AZ/region failover.', sort_order:28 },
  { section:'5. Sizing & Deployment', skill:'Automated Testing in Pipelines', why_matters:'Automated test gates in CI/CD prevent regressions from reaching production.', importance:'Critical', min_level:5, ideal_level:8, depth:'D+B', engineers_needed:null, seniority:'Mid / Senior', notes:'Unit, integration, smoke, contract, load tests in pipeline. Shift-left quality strategy.', sort_order:29 },
  { section:'5. Sizing & Deployment', skill:'Database Sizing & Scalability', why_matters:'Undersized databases are a common cause of product failure at scale.', importance:'High', min_level:5, ideal_level:8, depth:'D+E', engineers_needed:null, seniority:'Senior', notes:'Schema efficiency, indexing strategy, read replicas, partitioning.', sort_order:30 },
  { section:'5. Sizing & Deployment', skill:'Capacity Planning & Auto-Scaling', why_matters:'Products must scale with business growth. Over-provisioning wastes budget; under-provisioning causes outages.', importance:'High', min_level:4, ideal_level:7, depth:'D+E', engineers_needed:null, seniority:'Senior', notes:'Load testing, horizontal/vertical scaling, auto-scaling policies. Plan for 3–5x current load.', sort_order:31 },
  // 6. AI Readiness
  { section:'6. AI Readiness', skill:'AI Tool Integration (Phase 1)', why_matters:'Engineers who cannot use AI tools effectively will fall behind in velocity and quality.', importance:'Critical', min_level:5, ideal_level:8, depth:'D+B', engineers_needed:null, seniority:'Mid / Senior', notes:'Claude Code, GitHub Copilot, Gemini. Prompt engineering, context injection, multi-stage code review.', sort_order:32 },
  { section:'6. AI Readiness', skill:'AI Code Review & Validation (Phase 1)', why_matters:'Every line of AI-generated code needs review by someone who deeply understands the domain.', importance:'Critical', min_level:6, ideal_level:8, depth:'D+E', engineers_needed:null, seniority:'Senior', notes:'Business logic validation, performance review, security audit, cross-model validation.', sort_order:33 },
  { section:'6. AI Readiness', skill:'LLM Interface Design (Phase 2)', why_matters:'Required if product roadmap includes conversational or natural language interfaces.', importance:'Standard', min_level:4, ideal_level:7, depth:'D+B', engineers_needed:null, seniority:'Senior', notes:'Prompt design for UX, LLM integration patterns, fallback handling.', sort_order:34 },
];

// ── Inline edit component ─────────────────────────────────────────────────────
function InlineEdit({ value, onSave, placeholder = 'Click to edit', multiline = false }: {
  value: string; onSave: (v: string) => void; placeholder?: string; multiline?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
  useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);
  useEffect(() => { setDraft(value); }, [value]);
  function commit() {
    setEditing(false);
    const t = draft.trim();
    if (t !== value) onSave(t || value);
    else setDraft(value);
  }
  const shared = {
    value: draft,
    onChange: (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) => setDraft(e.target.value),
    onBlur: commit,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (!multiline && e.key === 'Enter') commit();
      if (e.key === 'Escape') { setDraft(value); setEditing(false); }
    },
    style: { background: 'none', border: 'none', outline: 'none', width: '100%', fontFamily: 'inherit', fontSize: 'inherit', color: 'inherit', resize: 'none' as const, padding: 0 }
  };
  if (editing) return multiline ? <textarea ref={ref as React.RefObject<HTMLTextAreaElement>} rows={2} {...shared} /> : <input ref={ref as React.RefObject<HTMLInputElement>} {...shared} />;
  return (
    <span onClick={() => setEditing(true)} title="Click to edit"
      style={{ cursor: 'text', display: 'block', borderBottom: '1px dashed rgba(255,255,255,.12)', minHeight: 20 }}>
      {value || <span style={{ color: 'var(--muted-2)', fontStyle: 'italic' }}>{placeholder}</span>}
    </span>
  );
}

// ── Score pill ────────────────────────────────────────────────────────────────
function ScorePill({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  const color = value <= 3 ? '#e88b7e' : value <= 6 ? '#C9A84C' : '#7ee8a2';
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 3 }}>{label}</div>
      <input type="number" min={1} max={10} value={value}
        onChange={e => onChange(Math.min(10, Math.max(1, +e.target.value)))}
        style={{ width: 44, textAlign: 'center', background: `${color}22`, border: `1px solid ${color}55`,
          borderRadius: 6, color, fontWeight: 700, fontSize: 14, padding: '2px 0', outline: 'none', fontFamily: 'inherit' }}
      />
    </div>
  );
}

// ── Importance badge ──────────────────────────────────────────────────────────
function ImportanceBadge({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const opts = ['Critical','High','Standard','Nice to Have'] as const;
  const color = IMPORTANCE_COLOR[value] || '#9e9e9e';
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ background: `${color}22`, border: `1px solid ${color}55`, color,
        borderRadius: 6, fontSize: 11, padding: '2px 6px', fontWeight: 600, fontFamily: 'inherit', outline: 'none', cursor: 'pointer' }}>
      {opts.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function SkillRequirementsSpreadsheet({ userId }: { userId: number }) {
  const [profiles, setProfiles] = useState<SkillProfile[]>([]);
  const [current, setCurrent] = useState<SkillProfile | null>(null);
  const [rows, setRows] = useState<SkillRow[]>([]);
  const [tab, setTab] = useState<'context' | 'matrix'>('context');
  const [context, setContext] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [confirmDel, setConfirmDel] = useState<{ rowId: number; skill: string } | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [activeSection, setActiveSection] = useState(SECTIONS[0]);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();

  async function loadList() {
    const d = await fetch('/api/talent/skill-req').then(r => r.json());
    setProfiles(d.profiles || []);
    setLoading(false);
  }

  async function loadProfile(id: number) {
    const d = await fetch(`/api/talent/skill-req?id=${id}`).then(r => r.json());
    setCurrent(d.profile);
    setRows(d.rows || []);
    setContext(d.profile.context || {});
  }

  useEffect(() => { loadList(); }, []);

  const scheduleSave = useCallback(() => {
    if (!current) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => doSave(false), 1800);
  }, [current, rows, context]);

  async function doSave(explicit = true) {
    if (!current) return;
    if (explicit) setSaving(true);
    await fetch('/api/talent/skill-req', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: current.id, name: current.name, context, rows }),
    });
    if (explicit) { setSaving(false); setSavedMsg('Saved'); setTimeout(() => setSavedMsg(''), 2000); }
  }

  function updateRow(id: number, patch: Partial<SkillRow>) {
    setRows(r => r.map(row => row.id === id ? { ...row, ...patch } : row));
    scheduleSave();
  }

  function updateContext(key: string, val: string) {
    setContext(c => ({ ...c, [key]: val }));
    scheduleSave();
  }

  async function createNew() {
    if (!newName.trim()) return;
    const res = await fetch('/api/talent/skill-req', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), templateRows: SKILL_REQ_TEMPLATE }),
    }).then(r => r.json());
    setShowNew(false); setNewName('');
    await loadList();
    await loadProfile(res.id);
  }

  async function addRow(section: string) {
    if (!current) return;
    const maxOrder = Math.max(0, ...rows.filter(r => r.section === section).map(r => r.sort_order));
    const res = await fetch('/api/talent/skill-req', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add_row', profileId: current.id, section, sortOrder: maxOrder + 1 }),
    }).then(r => r.json());
    if (res.row) setRows(prev => [...prev, res.row]);
  }

  async function deleteRow(rowId: number) {
    await fetch('/api/talent/skill-req', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete_row', rowId }),
    });
    setRows(prev => prev.filter(r => r.id !== rowId));
    setConfirmDel(null);
  }

  async function deleteProfile() {
    if (!current) return;
    await fetch(`/api/talent/skill-req?id=${current.id}`, { method: 'DELETE' });
    setCurrent(null); setRows([]); setContext({});
    loadList();
  }

  // ── Excel download ──────────────────────────────────────────────────────────
  async function downloadExcel() {
    const XLSX = await import('xlsx');
    const wb = XLSX.utils.book_new();

    // Sheet 1: Context
    const ctxData = [
      ['Technical Skillset Requirements — Product Context'],
      ['The Pivot Model'],
      [],
      ...CONTEXT_FIELDS.map(f => [f.label, context[f.key] || '']),
    ];
    const wsCtx = XLSX.utils.aoa_to_sheet(ctxData);
    wsCtx['!cols'] = [{ wch: 30 }, { wch: 50 }];
    XLSX.utils.book_append_sheet(wb, wsCtx, 'Product Context');

    // Sheet 2: Skills Matrix
    const hdr = ['Domain','Skill / Competency','Why This Matters','Importance','Min Level','Ideal Level','Depth / Breadth / Exp','# Engineers','Seniority','Notes'];
    const matData = [
      ['Technical Skill Requirements Matrix'],
      ['The Pivot Model — Define required skills per domain'],
      [],
      hdr,
      ...rows.map(r => [r.section, r.skill, r.why_matters||'', r.importance, r.min_level, r.ideal_level, r.depth, r.engineers_needed||'', r.seniority||'', r.notes||'']),
    ];
    const wsMat = XLSX.utils.aoa_to_sheet(matData);
    wsMat['!cols'] = [22,28,36,14,8,8,14,10,16,36].map(w => ({ wch: w }));
    XLSX.utils.book_append_sheet(wb, wsMat, 'Skill Requirements');

    // Sheet 3: Summary
    const critical = rows.filter(r => r.importance === 'Critical');
    const sumData = [
      ['Requirements Summary'],
      [],
      ['Total skills defined', rows.length],
      ['Critical skills', critical.length],
      ['High priority skills', rows.filter(r => r.importance === 'High').length],
      ['Standard skills', rows.filter(r => r.importance === 'Standard').length],
      [],
      ['Section', 'Skill Count', 'Critical Count'],
      ...SECTIONS.map(s => [s, rows.filter(r => r.section === s).length, rows.filter(r => r.section === s && r.importance === 'Critical').length]),
    ];
    const wsSum = XLSX.utils.aoa_to_sheet(sumData);
    wsSum['!cols'] = [{ wch: 30 }, { wch: 16 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(wb, wsSum, 'Summary');

    XLSX.writeFile(wb, `Skill-Requirements-${(current?.name || 'export').replace(/\s+/g, '-')}.xlsx`);
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  if (loading) return <div style={{ color: 'var(--muted)', padding: 24 }}>Loading…</div>;

  if (!current) return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ color: 'var(--gold)', fontFamily: 'var(--font-display)', fontSize: 22, margin: 0 }}>Skill Requirements</h2>
          <p style={{ color: 'var(--muted)', fontSize: 13, margin: '4px 0 0' }}>Define the technical skills your product engineering team needs — before hiring or restructuring.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowNew(true)}>＋ New Profile</button>
      </div>

      {profiles.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)', border: '1px dashed var(--ink-3)', borderRadius: 12 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎯</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--cream)', marginBottom: 8 }}>No skill profiles yet</div>
          <div style={{ fontSize: 13, marginBottom: 20 }}>Create one to define what your product engineering team needs.</div>
          <button className="btn-primary" onClick={() => setShowNew(true)}>Create first profile</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {profiles.map(p => (
            <div key={p.id} onClick={() => loadProfile(p.id)}
              style={{ background: 'var(--ink-2)', border: '1px solid var(--ink-3)', borderRadius: 10, padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--gold-d)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--ink-3)')}>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--cream)', fontSize: 15 }}>{p.name}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{p.row_count} skills defined · Updated {new Date(p.updated_at).toLocaleDateString()}</div>
              </div>
              <span style={{ color: 'var(--gold)', fontSize: 18 }}>→</span>
            </div>
          ))}
        </div>
      )}

      {showNew && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9000 }}>
          <div style={{ background: 'var(--ink-1)', border: '1px solid var(--ink-3)', borderRadius: 14, padding: 32, width: 400 }}>
            <h3 style={{ color: 'var(--gold)', margin: '0 0 16px', fontFamily: 'var(--font-display)' }}>New Skill Profile</h3>
            <input value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && createNew()}
              placeholder="e.g. MyApp v2 — Hiring Plan" autoFocus
              style={{ width: '100%', background: 'var(--ink-2)', border: '1px solid var(--ink-3)', color: 'var(--cream)', borderRadius: 8, padding: '10px 14px', fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 16 }} />
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 20px' }}>Loads with 34 default skills across 6 domains. You can remove, edit, or add your own.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-ghost" onClick={() => setShowNew(false)}>Cancel</button>
              <button className="btn-primary" onClick={createNew}>Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const sectionRows = rows.filter(r => r.section === activeSection);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
        <button onClick={() => { doSave(); setCurrent(null); setRows([]); setContext({}); }} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 13, padding: 0 }}>← Profiles</button>
        <div style={{ flex: 1 }}>
        <InlineEdit value={current.name}
            onSave={v => { setCurrent(c => c ? { ...c, name: v } : c); scheduleSave(); }}
            placeholder="Profile name" />
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {savedMsg && <span style={{ fontSize: 12, color: 'var(--gold)', opacity: 0.8 }}>{savedMsg}</span>}
          {saving && <span style={{ fontSize: 12, color: 'var(--muted)' }}>Saving…</span>}
          <button className="btn-ghost" style={{ fontSize: 12 }} onClick={downloadExcel}>⬇ Download Excel</button>
          <button className="btn-primary" style={{ fontSize: 12 }} onClick={() => doSave()}>Save</button>
          <button onClick={deleteProfile} style={{ background: 'none', border: 'none', color: '#e88b7e', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '0 4px' }} title="Delete profile">🗑</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--ink-3)', paddingBottom: 0 }}>
        {[['context','📋 Context'],['matrix','📊 Skills Matrix']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id as 'context' | 'matrix')}
            style={{ background: tab === id ? 'var(--gold)' : 'none', color: tab === id ? 'var(--ink)' : 'var(--muted)', border: 'none', borderRadius: '6px 6px 0 0', padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Context tab */}
      {tab === 'context' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {CONTEXT_FIELDS.map(f => (
            <div key={f.key}>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{f.label}</label>
              <input value={context[f.key] || ''} onChange={e => updateContext(f.key, e.target.value)}
                placeholder={f.placeholder}
                style={{ width: '100%', background: 'var(--ink-2)', border: '1px solid var(--ink-3)', color: 'var(--cream)', borderRadius: 8, padding: '9px 12px', fontSize: 13, outline: 'none', boxSizing: 'border-box',
                  transition: 'border-color .2s' }}
                onFocus={e => (e.target.style.borderColor = 'var(--gold-d)')}
                onBlur={e => (e.target.style.borderColor = 'var(--ink-3)')} />
            </div>
          ))}
        </div>
      )}

      {/* Matrix tab */}
      {tab === 'matrix' && (
        <div>
          {/* Section pill nav */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
            {SECTIONS.map(s => (
              <button key={s} onClick={() => setActiveSection(s)}
                style={{ background: activeSection === s ? 'rgba(201,168,76,.18)' : 'var(--ink-2)', border: `1px solid ${activeSection === s ? 'var(--gold-d)' : 'var(--ink-3)'}`,
                  color: activeSection === s ? 'var(--gold)' : 'var(--muted)', borderRadius: 20, padding: '5px 14px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', fontWeight: activeSection === s ? 600 : 400 }}>
                {s.split('. ')[1]} <span style={{ opacity: .6 }}>({rows.filter(r => r.section === s).length})</span>
              </button>
            ))}
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--ink-3)' }}>
                  {['Skill / Competency','Why It Matters','Importance','Min','Ideal','D/B/E','# Eng','Seniority','Notes',''].map((h, i) => (
                    <th key={i} style={{ textAlign: 'left', padding: '8px 10px', fontSize: 11, color: 'var(--muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sectionRows.map((row, ri) => (
                  <tr key={row.id} style={{ borderBottom: '1px solid rgba(255,255,255,.04)', background: ri % 2 === 0 ? 'rgba(255,255,255,.01)' : 'transparent' }}>
                    <td style={{ padding: '9px 10px', minWidth: 180, maxWidth: 220 }}>
                      <InlineEdit value={row.skill} onSave={v => updateRow(row.id, { skill: v })} />
                    </td>
                    <td style={{ padding: '9px 10px', minWidth: 200, maxWidth: 260 }}>
                      <InlineEdit value={row.why_matters || ''} onSave={v => updateRow(row.id, { why_matters: v })} placeholder="Why this matters…" multiline />
                    </td>
                    <td style={{ padding: '9px 10px', whiteSpace: 'nowrap' }}>
                      <ImportanceBadge value={row.importance} onChange={v => updateRow(row.id, { importance: v as SkillRow['importance'] })} />
                    </td>
                    <td style={{ padding: '9px 8px' }}>
                      <input type="number" min={1} max={10} value={row.min_level}
                        onChange={e => updateRow(row.id, { min_level: +e.target.value })}
                        style={{ width: 40, textAlign: 'center', background: 'var(--ink-2)', border: '1px solid var(--ink-3)', color: 'var(--cream)', borderRadius: 6, padding: '3px 0', outline: 'none', fontFamily: 'inherit' }} />
                    </td>
                    <td style={{ padding: '9px 8px' }}>
                      <input type="number" min={1} max={10} value={row.ideal_level}
                        onChange={e => updateRow(row.id, { ideal_level: +e.target.value })}
                        style={{ width: 40, textAlign: 'center', background: 'var(--ink-2)', border: '1px solid var(--ink-3)', color: '#7ee8a2', borderRadius: 6, padding: '3px 0', outline: 'none', fontFamily: 'inherit' }} />
                    </td>
                    <td style={{ padding: '9px 10px', minWidth: 70 }}>
                      <InlineEdit value={row.depth} onSave={v => updateRow(row.id, { depth: v })} />
                    </td>
                    <td style={{ padding: '9px 8px' }}>
                      <input type="number" min={0} value={row.engineers_needed || ''}
                        onChange={e => updateRow(row.id, { engineers_needed: e.target.value ? +e.target.value : null })}
                        placeholder="—"
                        style={{ width: 44, textAlign: 'center', background: 'var(--ink-2)', border: '1px solid var(--ink-3)', color: 'var(--cream)', borderRadius: 6, padding: '3px 0', outline: 'none', fontFamily: 'inherit' }} />
                    </td>
                    <td style={{ padding: '9px 10px', minWidth: 120 }}>
                      <InlineEdit value={row.seniority || ''} onSave={v => updateRow(row.id, { seniority: v })} placeholder="Seniority…" />
                    </td>
                    <td style={{ padding: '9px 10px', minWidth: 160 }}>
                      <InlineEdit value={row.notes || ''} onSave={v => updateRow(row.id, { notes: v })} placeholder="Notes…" multiline />
                    </td>
                    <td style={{ padding: '9px 8px' }}>
                      {confirmDel?.rowId === row.id ? (
                        <span style={{ display: 'flex', gap: 4 }}>
                          <button onClick={() => deleteRow(row.id)} style={{ background: '#e88b7e22', border: '1px solid #e88b7e', color: '#e88b7e', borderRadius: 4, padding: '2px 8px', fontSize: 11, cursor: 'pointer' }}>Del</button>
                          <button onClick={() => setConfirmDel(null)} style={{ background: 'none', border: '1px solid var(--ink-3)', color: 'var(--muted)', borderRadius: 4, padding: '2px 8px', fontSize: 11, cursor: 'pointer' }}>✕</button>
                        </span>
                      ) : (
                        <button onClick={() => setConfirmDel({ rowId: row.id, skill: row.skill })}
                          style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 14, opacity: 0.6 }} title="Remove row">🗑</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={() => addRow(activeSection)}
            style={{ marginTop: 12, background: 'rgba(201,168,76,.08)', border: '1px dashed var(--gold-d)', color: 'var(--gold)', borderRadius: 8, padding: '7px 18px', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
            ＋ Add skill to {activeSection.split('. ')[1]}
          </button>
        </div>
      )}
    </div>
  );
}
