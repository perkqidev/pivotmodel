'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────
interface MapRow {
  id: number;
  sheet: string;
  section: string;
  item: string;
  description: string;
  self_score: number | null;
  mgr_score: number | null;
  target_score: number | null;
  status_text: string;
  notes: string;
  sort_order: number;
}

interface TalentMap {
  id: number;
  name: string;
  profile: Record<string, string>;
  row_count: number;
  created_at: string;
  updated_at: string;
}

type SheetKey = 'technical' | 'mindset' | 'ai' | 'knowledge';

const SHEET_LABELS: Record<SheetKey, string> = {
  technical: '🔧 Technical Skills',
  mindset:   '🧠 Product Mindset',
  ai:        '🤖 AI Readiness',
  knowledge: '📚 Knowledge Mgmt',
};

const PROFILE_FIELDS = [
  { key: 'engineer_name',    label: 'Engineer Name',        placeholder: 'Full name' },
  { key: 'employee_id',      label: 'Employee ID',          placeholder: 'e.g. ENG-001' },
  { key: 'team',             label: 'Team / Squad',         placeholder: 'e.g. Platform Team' },
  { key: 'reporting_manager',label: 'Reporting Manager',    placeholder: 'Name' },
  { key: 'job_title',        label: 'Job Title / Role',     placeholder: 'e.g. Senior Engineer' },
  { key: 'seniority_level',  label: 'Seniority Level',      placeholder: 'Junior / Mid / Senior / Lead / Principal' },
  { key: 'specialization',   label: 'Specialization',       placeholder: 'Backend / Frontend / DevOps / ML / Full-stack' },
  { key: 'total_experience', label: 'Total Experience (yrs)',placeholder: 'e.g. 7' },
  { key: 'employment_type',  label: 'Employment Type',      placeholder: 'Full-time / Contract / Offshore / Onshore' },
  { key: 'product_name',     label: 'Product Name',         placeholder: 'Product being assessed against' },
  { key: 'industry',         label: 'Industry / Domain',    placeholder: 'e.g. FinTech, SaaS' },
  { key: 'tech_stack',       label: 'Tech Stack (primary)', placeholder: 'e.g. Java, React, PostgreSQL' },
  { key: 'ai_phase',         label: 'AI Phase (current)',   placeholder: 'Phase 1 / 2 / 3' },
  { key: 'assessment_period',label: 'Assessment Period',    placeholder: 'e.g. Q1 2025' },
  { key: 'assessor_name',    label: 'Assessor Name',        placeholder: 'Who is doing the assessment' },
  { key: 'key_strengths',    label: 'Key Strengths',        placeholder: 'Top 3 strengths', wide: true },
  { key: 'priority_dev',     label: 'Priority Dev Areas',   placeholder: 'Main areas to develop', wide: true },
  { key: 'career_aspiration',label: 'Career Aspiration',    placeholder: 'What does this engineer want to grow into?', wide: true },
  { key: 'manager_comments', label: 'Manager Comments',     placeholder: 'Notes from manager', wide: true },
] as const;

// ── Default template ──────────────────────────────────────────────────────────
export const TALENT_MAP_TEMPLATE: Omit<MapRow, 'id' | 'map_id'>[] = [
  // Technical — 1. Design Methodologies
  { sheet:'technical', section:'1. Design Methodologies', item:'Domain-Driven Design (DDD)', description:'Bounded contexts, ubiquitous language, aggregates, context mapping for complex domain alignment', self_score:null, mgr_score:null, target_score:null, status_text:'', notes:'', sort_order:1 },
  { sheet:'technical', section:'1. Design Methodologies', item:'Component Model', description:'Self-contained, reusable components; independent development, testing, and replacement', self_score:null, mgr_score:null, target_score:null, status_text:'', notes:'', sort_order:2 },
  { sheet:'technical', section:'1. Design Methodologies', item:'Microservices & RESTful APIs', description:'Loosely coupled services; saga, circuit breaker, service discovery, API gateway patterns', self_score:null, mgr_score:null, target_score:null, status_text:'', notes:'', sort_order:3 },
  { sheet:'technical', section:'1. Design Methodologies', item:'Event-Driven Architecture (EDA)', description:'Publish/subscribe, event sourcing, CQRS; decoupled reactive systems using message brokers', self_score:null, mgr_score:null, target_score:null, status_text:'', notes:'', sort_order:4 },
  { sheet:'technical', section:'1. Design Methodologies', item:'Reactive Architecture', description:'Responsive, resilient, elastic, message-driven systems per the Reactive Manifesto', self_score:null, mgr_score:null, target_score:null, status_text:'', notes:'', sort_order:5 },
  { sheet:'technical', section:'1. Design Methodologies', item:'Pipeline / Data-Flow Architecture', description:'ETL, ML pipelines, stream processing (Kafka Streams, Flink); data-intensive products', self_score:null, mgr_score:null, target_score:null, status_text:'', notes:'', sort_order:6 },
  { sheet:'technical', section:'1. Design Methodologies', item:'Aspect-Oriented Programming (AOP)', description:'Isolation of cross-cutting concerns: logging, security, caching, transaction management', self_score:null, mgr_score:null, target_score:null, status_text:'', notes:'', sort_order:7 },
  // Technical — 2. Coding, AI & Dev Tools
  { sheet:'technical', section:'2. Coding, AI & Dev Tools', item:'Code Quality & Standards', description:'Extensibility, maintainability, consistent guidelines; readable, well-structured production code', self_score:null, mgr_score:null, target_score:null, status_text:'', notes:'', sort_order:8 },
  { sheet:'technical', section:'2. Coding, AI & Dev Tools', item:'Performance & Scalability', description:'Production-grade code; optimization, profiling, deployment readiness for scale', self_score:null, mgr_score:null, target_score:null, status_text:'', notes:'', sort_order:9 },
  { sheet:'technical', section:'2. Coding, AI & Dev Tools', item:'Security Practices', description:'Secure coding; OWASP Top 10 awareness, secrets management, vulnerability mitigation', self_score:null, mgr_score:null, target_score:null, status_text:'', notes:'', sort_order:10 },
  { sheet:'technical', section:'2. Coding, AI & Dev Tools', item:'Testability & Reliability', description:'TDD mindset; unit, integration, end-to-end tests; dependency injection, modular design', self_score:null, mgr_score:null, target_score:null, status_text:'', notes:'', sort_order:11 },
  { sheet:'technical', section:'2. Coding, AI & Dev Tools', item:'AI Readiness & Fluency', description:'AI-augmented development; prompt engineering; guided code generation; review of AI output', self_score:null, mgr_score:null, target_score:null, status_text:'', notes:'', sort_order:12 },
  { sheet:'technical', section:'2. Coding, AI & Dev Tools', item:'Dev Tools & Ecosystem', description:'IDE proficiency, version control, CI/CD tooling, static analysis, debugging tools', self_score:null, mgr_score:null, target_score:null, status_text:'', notes:'', sort_order:13 },
  // Technical — 3. System Understanding
  { sheet:'technical', section:'3. System Understanding', item:'Framework Mastery', description:'Spring-Boot, Go, Django, React, Quarkus; internals, state machines, configuration impact', self_score:null, mgr_score:null, target_score:null, status_text:'', notes:'', sort_order:14 },
  { sheet:'technical', section:'3. System Understanding', item:'Cloud & Infrastructure', description:'AWS / Azure / GCP; containerization (Docker, Kubernetes); service discovery, networking', self_score:null, mgr_score:null, target_score:null, status_text:'', notes:'', sort_order:15 },
  { sheet:'technical', section:'3. System Understanding', item:'Third-Party & Open Source', description:'OAuth 2.0, REST standards, cloud-native integrations; library evaluation and selection', self_score:null, mgr_score:null, target_score:null, status_text:'', notes:'', sort_order:16 },
  { sheet:'technical', section:'3. System Understanding', item:'Database Architecture', description:'Schema design, indexing, distributed DBs; storage optimization, query performance', self_score:null, mgr_score:null, target_score:null, status_text:'', notes:'', sort_order:17 },
  { sheet:'technical', section:'3. System Understanding', item:'Domain / Business Knowledge', description:'Depth of industry domain: FinTech, Healthcare, SaaS, E-commerce, etc.', self_score:null, mgr_score:null, target_score:null, status_text:'', notes:'', sort_order:18 },
  // Technical — 4. Operational Factors
  { sheet:'technical', section:'4. Operational Factors', item:'Application Architecture & Design', description:'Load handling, memory management, resource optimization; performance tuning in reviews', self_score:null, mgr_score:null, target_score:null, status_text:'', notes:'', sort_order:19 },
  { sheet:'technical', section:'4. Operational Factors', item:'Storage Management', description:'Data lifecycle planning; archival, purge strategies; cache and log management', self_score:null, mgr_score:null, target_score:null, status_text:'', notes:'', sort_order:20 },
  { sheet:'technical', section:'4. Operational Factors', item:'Monitoring & Observability', description:'Metrics (CPU, memory, error rates, latency); log collection; anomaly detection setup', self_score:null, mgr_score:null, target_score:null, status_text:'', notes:'', sort_order:21 },
  { sheet:'technical', section:'4. Operational Factors', item:'Cloud Cost Management', description:'Resource usage tracking; cost optimization in cloud environments; budget awareness', self_score:null, mgr_score:null, target_score:null, status_text:'', notes:'', sort_order:22 },
  // Technical — 5. Sizing & Deployment
  { sheet:'technical', section:'5. Sizing & Deployment', item:'Cloud Deployment', description:'Containerization, orchestration; multi-cloud; network planning; redundancy and failover', self_score:null, mgr_score:null, target_score:null, status_text:'', notes:'', sort_order:23 },
  { sheet:'technical', section:'5. Sizing & Deployment', item:'Database Sizing', description:'Schema efficiency, indexing, distributed architecture; scalability as data volume grows', self_score:null, mgr_score:null, target_score:null, status_text:'', notes:'', sort_order:24 },
  { sheet:'technical', section:'5. Sizing & Deployment', item:'DevOps & CI/CD', description:'Pipeline automation (Jenkins, GitHub Actions, Azure DevOps); IaC; automated testing in pipelines', self_score:null, mgr_score:null, target_score:null, status_text:'', notes:'', sort_order:25 },
  { sheet:'technical', section:'5. Sizing & Deployment', item:'Infrastructure as Code (IaC)', description:'Terraform, Pulumi, or equivalent; repeatable, version-controlled infrastructure provisioning', self_score:null, mgr_score:null, target_score:null, status_text:'', notes:'', sort_order:26 },
  // Mindset — Attitude
  { sheet:'mindset', section:'Attitude', item:'Results-focused & Resourceful', description:'Delivers business outcomes, not just tasks. Works through obstacles with determination.', self_score:null, mgr_score:null, target_score:null, status_text:'', notes:'', sort_order:1 },
  { sheet:'mindset', section:'Attitude', item:'Intellectual Curiosity', description:'Stays current with new technologies, domain trends, and customer feedback.', self_score:null, mgr_score:null, target_score:null, status_text:'', notes:'', sort_order:2 },
  { sheet:'mindset', section:'Attitude', item:'Flexibility & Adaptability', description:'Adapts to shifting requirements, changing priorities, and evolving business opportunities.', self_score:null, mgr_score:null, target_score:null, status_text:'', notes:'', sort_order:3 },
  { sheet:'mindset', section:'Attitude', item:'Detail-Oriented', description:'Pays close attention to integration points, usability, compliance, and quality factors.', self_score:null, mgr_score:null, target_score:null, status_text:'', notes:'', sort_order:4 },
  { sheet:'mindset', section:'Attitude', item:'Resilience & Tenacity', description:'Persists through technical challenges, tight deadlines, and unexpected setbacks.', self_score:null, mgr_score:null, target_score:null, status_text:'', notes:'', sort_order:5 },
  // Mindset — Collaboration
  { sheet:'mindset', section:'Collaboration', item:'Values Collective Knowledge', description:'Seeks diverse perspectives, communicates openly, and shares ownership of results.', self_score:null, mgr_score:null, target_score:null, status_text:'', notes:'', sort_order:6 },
  { sheet:'mindset', section:'Collaboration', item:'Customer / End-User Focus', description:'Empathizes with end users; designs solutions that deliver meaningful business value.', self_score:null, mgr_score:null, target_score:null, status_text:'', notes:'', sort_order:7 },
  { sheet:'mindset', section:'Collaboration', item:'Cross-functional Engagement', description:'Actively collaborates with PM, services, support, sales, and other stakeholders.', self_score:null, mgr_score:null, target_score:null, status_text:'', notes:'', sort_order:8 },
  { sheet:'mindset', section:'Collaboration', item:'Accountability for Outcomes', description:"Treats product quality and effectiveness as personal responsibility — not someone else's job.", self_score:null, mgr_score:null, target_score:null, status_text:'', notes:'', sort_order:9 },
  // Mindset — Knowledge
  { sheet:'mindset', section:'Knowledge', item:'Domain / Industry Knowledge', description:'Understands the industry, business workflows, and domain challenges well enough to make practical product decisions.', self_score:null, mgr_score:null, target_score:null, status_text:'', notes:'', sort_order:10 },
  { sheet:'mindset', section:'Knowledge', item:'Technology Awareness', description:'Aware of emerging tools and trends; can design innovative, future-ready solutions.', self_score:null, mgr_score:null, target_score:null, status_text:'', notes:'', sort_order:11 },
  { sheet:'mindset', section:'Knowledge', item:'Process Discipline', description:'Strong practices in validation, release management, risk mitigation; delivers predictably.', self_score:null, mgr_score:null, target_score:null, status_text:'', notes:'', sort_order:12 },
  { sheet:'mindset', section:'Knowledge', item:'Gap Analysis Capability', description:'Evaluates new features for impact on existing product — architecture, performance, compliance.', self_score:null, mgr_score:null, target_score:null, status_text:'', notes:'', sort_order:13 },
  // Mindset — Product Lifecycle
  { sheet:'mindset', section:'Product Lifecycle', item:'Roadmap Participation', description:'Actively participates in roadmap discussions; suggests features and priorities that increase customer value.', self_score:null, mgr_score:null, target_score:null, status_text:'', notes:'', sort_order:14 },
  { sheet:'mindset', section:'Product Lifecycle', item:'Technical & Feature Debt Management', description:'Balances short-term delivery with long-term quality by addressing debt proactively.', self_score:null, mgr_score:null, target_score:null, status_text:'', notes:'', sort_order:15 },
  { sheet:'mindset', section:'Product Lifecycle', item:'Data-Driven Product Decisions', description:'Uses reliability, scalability, and adoption insights to guide product strategy.', self_score:null, mgr_score:null, target_score:null, status_text:'', notes:'', sort_order:16 },
  { sheet:'mindset', section:'Product Lifecycle', item:'Project → Product Mindset Shift', description:'Has moved from executing specifications to owning outcomes and contributing to product evolution.', self_score:null, mgr_score:null, target_score:null, status_text:'', notes:'', sort_order:17 },
  // AI Readiness — Phase 1
  { sheet:'ai', section:'Phase 1 — AI-Augmented Development', item:'AI Tool Fluency', description:'Uses AI coding assistants (Claude Code, GitHub Copilot, Gemini) effectively in daily work', self_score:null, mgr_score:null, target_score:null, status_text:'', notes:'', sort_order:1 },
  { sheet:'ai', section:'Phase 1 — AI-Augmented Development', item:'Context Injection & Prompt Engineering', description:'Provides structured context (data models, env config, standards) to guide AI tool output quality', self_score:null, mgr_score:null, target_score:null, status_text:'', notes:'', sort_order:2 },
  { sheet:'ai', section:'Phase 1 — AI-Augmented Development', item:'AI Code Review & Validation', description:'Reviews AI-generated code for correctness, performance, security, and business logic accuracy', self_score:null, mgr_score:null, target_score:null, status_text:'', notes:'', sort_order:3 },
  { sheet:'ai', section:'Phase 1 — AI-Augmented Development', item:'Architectural Direction for AI', description:"Guides AI tools toward sound architectural decisions; doesn't just accept generated output", self_score:null, mgr_score:null, target_score:null, status_text:'', notes:'', sort_order:4 },
  { sheet:'ai', section:'Phase 1 — AI-Augmented Development', item:'Multi-Stage Review Process', description:'Applies automated scanning, business logic validation, context integrity, performance, and security checks on AI output', self_score:null, mgr_score:null, target_score:null, status_text:'', notes:'', sort_order:5 },
  { sheet:'ai', section:'Phase 1 — AI-Augmented Development', item:'Reference Pattern Implementation', description:'Creates reference implementations to guide AI tool for consistent architectural patterns across codebase', self_score:null, mgr_score:null, target_score:null, status_text:'', notes:'', sort_order:6 },
  { sheet:'ai', section:'Phase 1 — AI-Augmented Development', item:'AI Boundary Awareness', description:'Understands what AI tools can and cannot do; knows when to reject output and when to rely on it', self_score:null, mgr_score:null, target_score:null, status_text:'', notes:'', sort_order:7 },
  // AI — Phase 2
  { sheet:'ai', section:'Phase 2 — AI Features in Products', item:'LLM Interface Design', description:'Can design conversational / natural language interfaces layered over existing product functionality', self_score:null, mgr_score:null, target_score:null, status_text:'', notes:'', sort_order:8 },
  { sheet:'ai', section:'Phase 2 — AI Features in Products', item:'RAG-Based Analytics', description:'Understanding of Retrieval Augmented Generation; can implement conversational query over product data', self_score:null, mgr_score:null, target_score:null, status_text:'', notes:'', sort_order:9 },
  { sheet:'ai', section:'Phase 2 — AI Features in Products', item:'Agent-Based Workflow Automation', description:'Can design and implement AI agents for operational workflow automation within a product', self_score:null, mgr_score:null, target_score:null, status_text:'', notes:'', sort_order:10 },
  { sheet:'ai', section:'Phase 2 — AI Features in Products', item:'MCP Wrapper / API Exposure', description:'Can expose product capabilities via Model Context Protocol for external AI agents', self_score:null, mgr_score:null, target_score:null, status_text:'', notes:'', sort_order:11 },
  { sheet:'ai', section:'Phase 2 — AI Features in Products', item:'AI Integration Architecture', description:'Can integrate AI into legacy or existing architectures not originally designed for probabilistic output', self_score:null, mgr_score:null, target_score:null, status_text:'', notes:'', sort_order:12 },
  { sheet:'ai', section:'Phase 2 — AI Features in Products', item:'AI Quality Assurance', description:'Understands how to test and validate AI-powered features where output is probabilistic, not deterministic', self_score:null, mgr_score:null, target_score:null, status_text:'', notes:'', sort_order:13 },
  // AI — Phase 3
  { sheet:'ai', section:'Phase 3 — AI-Native Engineering', item:'ML Engineering Fundamentals', description:'Understanding of ML concepts, model training, evaluation, and production deployment', self_score:null, mgr_score:null, target_score:null, status_text:'', notes:'', sort_order:14 },
  { sheet:'ai', section:'Phase 3 — AI-Native Engineering', item:'Data Architecture for AI', description:'Treats data as a core product asset; designs data collection, curation, quality, and governance from day 1', self_score:null, mgr_score:null, target_score:null, status_text:'', notes:'', sort_order:15 },
  { sheet:'ai', section:'Phase 3 — AI-Native Engineering', item:'Experimentation-First Mindset', description:'Comfortable with rapid prototyping, probabilistic outcomes, and learning from failure', self_score:null, mgr_score:null, target_score:null, status_text:'', notes:'', sort_order:16 },
  { sheet:'ai', section:'Phase 3 — AI-Native Engineering', item:'Ethical AI Awareness', description:'Understands algorithmic bias, AI transparency, data privacy, and societal impact of AI-driven decisions', self_score:null, mgr_score:null, target_score:null, status_text:'', notes:'', sort_order:17 },
  { sheet:'ai', section:'Phase 3 — AI-Native Engineering', item:'AI-Native System Design', description:"Can design systems where AI is the core value proposition, not just a feature bolt-on", self_score:null, mgr_score:null, target_score:null, status_text:'', notes:'', sort_order:18 },
  // Knowledge Mgmt — Self-Evaluation
  { sheet:'knowledge', section:'Self-Evaluation', item:'Technical Skills Self-Rating', description:'Rate yourself on all technical competencies using the Technical Skills section.', self_score:null, mgr_score:null, target_score:null, status_text:'Last completed:', notes:'', sort_order:1 },
  { sheet:'knowledge', section:'Self-Evaluation', item:'Product Mindset Self-Rating', description:'Rate yourself on all mindset attributes using the Product Mindset section.', self_score:null, mgr_score:null, target_score:null, status_text:'Last completed:', notes:'', sort_order:2 },
  { sheet:'knowledge', section:'Self-Evaluation', item:'AI Readiness Self-Rating', description:'Rate yourself on AI phase readiness using the AI Readiness section.', self_score:null, mgr_score:null, target_score:null, status_text:'Last completed:', notes:'', sort_order:3 },
  { sheet:'knowledge', section:'Self-Evaluation', item:'Goal Setting (Quarterly)', description:'Document top 3 growth goals for this assessment period.', self_score:null, mgr_score:null, target_score:null, status_text:'Goals set:', notes:'', sort_order:4 },
  // Knowledge — Training
  { sheet:'knowledge', section:'Training & Development', item:'Technical Course / Certification', description:'Any courses, certifications, or workshops completed or in progress.', self_score:null, mgr_score:null, target_score:null, status_text:'Completed / In Progress', notes:'', sort_order:5 },
  { sheet:'knowledge', section:'Training & Development', item:'Domain Knowledge Development', description:'Industry reading, customer interaction, domain deep-dives.', self_score:null, mgr_score:null, target_score:null, status_text:'Activities completed:', notes:'', sort_order:6 },
  { sheet:'knowledge', section:'Training & Development', item:'Mentoring / Pair Programming', description:'Hours spent mentoring others or in structured pair programming.', self_score:null, mgr_score:null, target_score:null, status_text:'Hours this period:', notes:'', sort_order:7 },
  { sheet:'knowledge', section:'Training & Development', item:'AI Tools Training', description:'Training on AI-augmented development, prompt engineering, or AI tooling.', self_score:null, mgr_score:null, target_score:null, status_text:'Sessions completed:', notes:'', sort_order:8 },
  { sheet:'knowledge', section:'Training & Development', item:'Process / Agile / DevOps Training', description:'Agile, Scrum, Kanban, DevOps, or CI/CD practices training.', self_score:null, mgr_score:null, target_score:null, status_text:'Training completed:', notes:'', sort_order:9 },
  // Knowledge — Research
  { sheet:'knowledge', section:'Research & Industry', item:'Conference / Event Attendance', description:'Conferences, webinars, meetups, or industry events attended.', self_score:null, mgr_score:null, target_score:null, status_text:'Events attended:', notes:'', sort_order:10 },
  { sheet:'knowledge', section:'Research & Industry', item:'Research / Experimentation', description:'Time allocated to research, spike work, or technology exploration.', self_score:null, mgr_score:null, target_score:null, status_text:'Hours this period:', notes:'', sort_order:11 },
  { sheet:'knowledge', section:'Research & Industry', item:'Blog / Article / Publication', description:'Authored or contributed to technical content (internal or external).', self_score:null, mgr_score:null, target_score:null, status_text:'Published/Contributed:', notes:'', sort_order:12 },
  { sheet:'knowledge', section:'Research & Industry', item:'Internal Knowledge Sharing', description:'Brown-bag sessions, lunch-and-learns, or internal talks delivered.', self_score:null, mgr_score:null, target_score:null, status_text:'Sessions delivered:', notes:'', sort_order:13 },
  // Knowledge — Progress
  { sheet:'knowledge', section:'Progress Evaluation', item:'Training Completion Rate', description:'Percentage of planned training items completed this period.', self_score:null, mgr_score:null, target_score:null, status_text:'% complete:', notes:'', sort_order:14 },
  { sheet:'knowledge', section:'Progress Evaluation', item:'Self-Evaluation Improvement', description:'Compare current scores to previous period; quantify growth.', self_score:null, mgr_score:null, target_score:null, status_text:'Score delta:', notes:'', sort_order:15 },
  { sheet:'knowledge', section:'Progress Evaluation', item:'Delivery Efficiency', description:'Has skill development translated into measurable delivery improvement?', self_score:null, mgr_score:null, target_score:null, status_text:'Evidence:', notes:'', sort_order:16 },
  { sheet:'knowledge', section:'Progress Evaluation', item:'Goal Achievement', description:'Review goals set in Self-Evaluation. How many were achieved?', self_score:null, mgr_score:null, target_score:null, status_text:'Goals achieved:', notes:'', sort_order:17 },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function avg(...vals: (number | null)[]): number | null {
  const filled = vals.filter((v): v is number => v !== null && v > 0);
  if (!filled.length) return null;
  return Math.round((filled.reduce((a, b) => a + b) / filled.length) * 10) / 10;
}

function scoreColor(v: number | null): string {
  if (!v) return 'var(--muted)';
  return v <= 3 ? '#e88b7e' : v <= 6 ? '#C9A84C' : '#7ee8a2';
}

function ScoreInput({ value, onChange, label }: { value: number | null; onChange: (v: number | null) => void; label: string }) {
  const color = scoreColor(value);
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 3 }}>{label}</div>
      <input type="number" min={1} max={10} value={value ?? ''}
        placeholder="—"
        onChange={e => onChange(e.target.value ? Math.min(10, Math.max(1, +e.target.value)) : null)}
        style={{ width: 42, textAlign: 'center', background: value ? `${color}22` : 'var(--ink-2)', border: `1px solid ${value ? color + '55' : 'var(--ink-3)'}`,
          borderRadius: 6, color: value ? color : 'var(--muted)', fontWeight: value ? 700 : 400, fontSize: 14, padding: '3px 0', outline: 'none', fontFamily: 'inherit' }} />
    </div>
  );
}

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

// ── Main component ────────────────────────────────────────────────────────────
export default function TalentMapSpreadsheet({ userId }: { userId: number }) {
  const [maps, setMaps] = useState<TalentMap[]>([]);
  const [current, setCurrent] = useState<TalentMap | null>(null);
  const [rows, setRows] = useState<MapRow[]>([]);
  const [tab, setTab] = useState<'profile' | SheetKey>('profile');
  const [profile, setProfile] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [confirmDel, setConfirmDel] = useState<{ rowId: number; item: string } | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();

  async function loadList() {
    const d = await fetch('/api/talent/talent-map').then(r => r.json());
    setMaps(d.maps || []);
    setLoading(false);
  }

  async function loadMap(id: number) {
    const d = await fetch(`/api/talent/talent-map?id=${id}`).then(r => r.json());
    setCurrent(d.map);
    setRows(d.rows || []);
    setProfile(d.map.profile || {});
  }

  useEffect(() => { loadList(); }, []);

  const scheduleSave = useCallback(() => {
    if (!current) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => doSave(false), 1800);
  }, [current, rows, profile]);

  async function doSave(explicit = true) {
    if (!current) return;
    if (explicit) setSaving(true);
    await fetch('/api/talent/talent-map', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: current.id, name: current.name, profile, rows }),
    });
    if (explicit) { setSaving(false); setSavedMsg('Saved'); setTimeout(() => setSavedMsg(''), 2000); }
  }

  function updateRow(id: number, patch: Partial<MapRow>) {
    setRows(r => r.map(row => row.id === id ? { ...row, ...patch } : row));
    scheduleSave();
  }

  function updateProfile(key: string, val: string) {
    setProfile(p => ({ ...p, [key]: val }));
    scheduleSave();
  }

  async function createNew() {
    if (!newName.trim()) return;
    const res = await fetch('/api/talent/talent-map', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), templateRows: TALENT_MAP_TEMPLATE }),
    }).then(r => r.json());
    setShowNew(false); setNewName('');
    await loadList();
    await loadMap(res.id);
  }

  async function addRow(sheet: string, section: string) {
    if (!current) return;
    const maxOrder = Math.max(0, ...rows.filter(r => r.sheet === sheet && r.section === section).map(r => r.sort_order));
    const res = await fetch('/api/talent/talent-map', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add_row', mapId: current.id, sheet, section, sortOrder: maxOrder + 1 }),
    }).then(r => r.json());
    if (res.row) setRows(prev => [...prev, res.row]);
  }

  async function deleteRow(rowId: number) {
    await fetch('/api/talent/talent-map', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete_row', rowId }),
    });
    setRows(prev => prev.filter(r => r.id !== rowId));
    setConfirmDel(null);
  }

  async function deleteMap() {
    if (!current) return;
    await fetch(`/api/talent/talent-map?id=${current.id}`, { method: 'DELETE' });
    setCurrent(null); setRows([]); setProfile({});
    loadList();
  }

  // ── Excel download ──────────────────────────────────────────────────────────
  async function downloadExcel() {
    const XLSX = await import('xlsx');
    const wb = XLSX.utils.book_new();
    const engName = profile['engineer_name'] || current?.name || 'Engineer';

    // Sheet 1: Profile
    const profData = [
      ['Engineering Talent Profile', engName],
      ['The Pivot Model — Engineering Talent Management Framework'],
      [],
      ...PROFILE_FIELDS.map(f => [f.label, profile[f.key] || '']),
    ];
    const wsProf = XLSX.utils.aoa_to_sheet(profData);
    wsProf['!cols'] = [{ wch: 28 }, { wch: 50 }];
    XLSX.utils.book_append_sheet(wb, wsProf, 'Engineer Profile');

    // Sheet 2: Technical Skills
    const techRows = rows.filter(r => r.sheet === 'technical');
    const techData = [
      ['Technical Skills Assessment', engName],
      [],
      ['Skill Area', 'Competency Description', 'Self (1-10)', 'Manager (1-10)', 'Target (1-10)', 'Average', 'Notes'],
      ...techRows.map(r => [r.section, r.item, r.self_score || '', r.mgr_score || '', r.target_score || '', avg(r.self_score, r.mgr_score) ?? '', r.notes || '']),
    ];
    const wsTech = XLSX.utils.aoa_to_sheet(techData);
    wsTech['!cols'] = [22, 40, 10, 12, 10, 10, 36].map(w => ({ wch: w }));
    XLSX.utils.book_append_sheet(wb, wsTech, 'Technical Skills');

    // Sheet 3: Product Mindset
    const mindRows = rows.filter(r => r.sheet === 'mindset');
    const mindData = [
      ['Product Mindset Assessment', engName],
      [],
      ['Section', 'Attribute', 'Description', 'Self (1-10)', 'Manager (1-10)', 'Average', 'Notes'],
      ...mindRows.map(r => [r.section, r.item, r.description || '', r.self_score || '', r.mgr_score || '', avg(r.self_score, r.mgr_score) ?? '', r.notes || '']),
    ];
    const wsMind = XLSX.utils.aoa_to_sheet(mindData);
    wsMind['!cols'] = [18, 28, 40, 10, 12, 10, 32].map(w => ({ wch: w }));
    XLSX.utils.book_append_sheet(wb, wsMind, 'Product Mindset');

    // Sheet 4: AI Readiness
    const aiRows = rows.filter(r => r.sheet === 'ai');
    const aiData = [
      ['AI Readiness Assessment', engName],
      [],
      ['Phase', 'Capability', 'What This Means', 'Self (1-10)', 'Manager (1-10)', 'Average', 'Notes'],
      ...aiRows.map(r => [r.section, r.item, r.description || '', r.self_score || '', r.mgr_score || '', avg(r.self_score, r.mgr_score) ?? '', r.notes || '']),
    ];
    const wsAI = XLSX.utils.aoa_to_sheet(aiData);
    wsAI['!cols'] = [28, 30, 44, 10, 12, 10, 32].map(w => ({ wch: w }));
    XLSX.utils.book_append_sheet(wb, wsAI, 'AI Readiness');

    // Sheet 5: Knowledge Management
    const knRows = rows.filter(r => r.sheet === 'knowledge');
    const knData = [
      ['Knowledge Management Tracker', engName],
      [],
      ['Area', 'Item / Topic', 'Status / Date', 'Score (1-10)', 'Notes'],
      ...knRows.map(r => [r.section, r.item, r.status_text || '', r.self_score || '', r.notes || '']),
    ];
    const wsKn = XLSX.utils.aoa_to_sheet(knData);
    wsKn['!cols'] = [22, 38, 22, 12, 40].map(w => ({ wch: w }));
    XLSX.utils.book_append_sheet(wb, wsKn, 'Knowledge Mgmt');

    XLSX.writeFile(wb, `Talent-Map-${engName.replace(/\s+/g, '-')}.xlsx`);
  }

  // ── Section grouped rows ────────────────────────────────────────────────────
  function getSheetRows(sheet: string) {
    const sheetRows = rows.filter(r => r.sheet === sheet);
    const sections = Array.from(new Set<string>(sheetRows.map(r => r.section)));
    return { sheetRows, sections };
  }

  function sectionAvg(sheet: string, section: string) {
    const r = rows.filter(x => x.sheet === sheet && x.section === section);
    const scores = r.flatMap(x => [x.self_score, x.mgr_score].filter((v): v is number => v !== null));
    if (!scores.length) return null;
    return (scores.reduce((a, b) => a + b) / scores.length).toFixed(1);
  }

  // ── Render list ─────────────────────────────────────────────────────────────
  if (loading) return <div style={{ color: 'var(--muted)', padding: 24 }}>Loading…</div>;

  if (!current) return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ color: 'var(--gold)', fontFamily: 'var(--font-display)', fontSize: 22, margin: 0 }}>Engineering Talent Map</h2>
          <p style={{ color: 'var(--muted)', fontSize: 13, margin: '4px 0 0' }}>Assess, track, and develop engineering talent — technical skills, product mindset, AI readiness, and knowledge management.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowNew(true)}>＋ New Assessment</button>
      </div>

      {maps.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)', border: '1px dashed var(--ink-3)', borderRadius: 12 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>👤</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--cream)', marginBottom: 8 }}>No talent assessments yet</div>
          <div style={{ fontSize: 13, marginBottom: 20 }}>Create one per engineer to track skills, mindset, and AI readiness.</div>
          <button className="btn-primary" onClick={() => setShowNew(true)}>Create first assessment</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {maps.map(m => (
            <div key={m.id} onClick={() => loadMap(m.id)}
              style={{ background: 'var(--ink-2)', border: '1px solid var(--ink-3)', borderRadius: 10, padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--gold-d)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--ink-3)')}>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--cream)', fontSize: 15 }}>{m.name}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{m.row_count} items · Updated {new Date(m.updated_at).toLocaleDateString()}</div>
              </div>
              <span style={{ color: 'var(--gold)', fontSize: 18 }}>→</span>
            </div>
          ))}
        </div>
      )}

      {showNew && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9000 }}>
          <div style={{ background: 'var(--ink-1)', border: '1px solid var(--ink-3)', borderRadius: 14, padding: 32, width: 400 }}>
            <h3 style={{ color: 'var(--gold)', margin: '0 0 16px', fontFamily: 'var(--font-display)' }}>New Talent Assessment</h3>
            <input value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && createNew()}
              placeholder="e.g. Jane Smith — Q2 2025" autoFocus
              style={{ width: '100%', background: 'var(--ink-2)', border: '1px solid var(--ink-3)', color: 'var(--cream)', borderRadius: 8, padding: '10px 14px', fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 16 }} />
            <p style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 20px' }}>Loads with the full assessment template across 4 sections. Add, remove, or rename any rows.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-ghost" onClick={() => setShowNew(false)}>Cancel</button>
              <button className="btn-primary" onClick={createNew}>Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ── Render assessment ───────────────────────────────────────────────────────
  const TABS: Array<['profile' | SheetKey, string]> = [
    ['profile',   '👤 Profile'],
    ['technical', '🔧 Technical'],
    ['mindset',   '🧠 Mindset'],
    ['ai',        '🤖 AI Readiness'],
    ['knowledge', '📚 Knowledge'],
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
        <button onClick={() => { doSave(); setCurrent(null); setRows([]); setProfile({}); setTab('profile'); }} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 13, padding: 0 }}>← Assessments</button>
        <div style={{ flex: 1 }}>
          <InlineEdit value={current.name} onSave={v => { setCurrent(c => c ? { ...c, name: v } : c); scheduleSave(); }} />
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {savedMsg && <span style={{ fontSize: 12, color: 'var(--gold)', opacity: 0.8 }}>{savedMsg}</span>}
          {saving && <span style={{ fontSize: 12, color: 'var(--muted)' }}>Saving…</span>}
          <button className="btn-ghost" style={{ fontSize: 12 }} onClick={downloadExcel}>⬇ Download Excel</button>
          <button className="btn-primary" style={{ fontSize: 12 }} onClick={() => doSave()}>Save</button>
          <button onClick={deleteMap} style={{ background: 'none', border: 'none', color: '#e88b7e', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '0 4px' }} title="Delete">🗑</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--ink-3)', flexWrap: 'wrap' }}>
        {TABS.map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ background: tab === id ? 'var(--gold)' : 'none', color: tab === id ? 'var(--ink)' : 'var(--muted)', border: 'none', borderRadius: '6px 6px 0 0', padding: '8px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Profile tab */}
      {tab === 'profile' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {PROFILE_FIELDS.map(f => (
            <div key={f.key} style={{ gridColumn: (f as {wide?: boolean}).wide ? '1 / -1' : undefined }}>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--muted)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{f.label}</label>
              <input value={profile[f.key] || ''} onChange={e => updateProfile(f.key, e.target.value)}
                placeholder={f.placeholder}
                style={{ width: '100%', background: 'var(--ink-2)', border: '1px solid var(--ink-3)', color: 'var(--cream)', borderRadius: 8, padding: '9px 12px', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => (e.target.style.borderColor = 'var(--gold-d)')}
                onBlur={e => (e.target.style.borderColor = 'var(--ink-3)')} />
            </div>
          ))}
        </div>
      )}

      {/* Score sheets: technical, mindset, ai */}
      {(tab === 'technical' || tab === 'mindset' || tab === 'ai') && (() => {
        const { sections } = getSheetRows(tab);
        const sheetRows = rows.filter(r => r.sheet === tab);
        const showMgr = tab !== 'ai';
        return (
          <div>
            {sections.map(section => (
              <div key={section} style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--gold)', background: 'rgba(201,168,76,.12)', padding: '3px 12px', borderRadius: 20, border: '1px solid var(--gold-d)' }}>{section}</span>
                    {sectionAvg(tab, section) && <span style={{ fontSize: 12, color: 'var(--muted)' }}>avg {sectionAvg(tab, section)}</span>}
                  </div>
                  <button onClick={() => addRow(tab, section)}
                    style={{ background: 'none', border: '1px dashed var(--ink-3)', color: 'var(--muted)', borderRadius: 6, padding: '4px 12px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
                    ＋ Add item
                  </button>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--ink-3)' }}>
                        <th style={{ textAlign: 'left', padding: '6px 10px', fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>Competency</th>
                        <th style={{ textAlign: 'left', padding: '6px 10px', fontSize: 11, color: 'var(--muted)', fontWeight: 600, minWidth: 200 }}>Description</th>
                        <th style={{ padding: '6px 10px', fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>Self</th>
                        {showMgr && <th style={{ padding: '6px 10px', fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>Mgr</th>}
                        <th style={{ padding: '6px 10px', fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>Target</th>
                        <th style={{ padding: '6px 10px', fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>Avg</th>
                        <th style={{ textAlign: 'left', padding: '6px 10px', fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>Notes</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {sheetRows.filter(r => r.section === section).map((row, ri) => {
                        const a = avg(row.self_score, showMgr ? row.mgr_score : null);
                        return (
                          <tr key={row.id} style={{ borderBottom: '1px solid rgba(255,255,255,.04)', background: ri % 2 === 0 ? 'rgba(255,255,255,.01)' : 'transparent' }}>
                            <td style={{ padding: '8px 10px', minWidth: 160, maxWidth: 220 }}>
                              <InlineEdit value={row.item} onSave={v => updateRow(row.id, { item: v })} />
                            </td>
                            <td style={{ padding: '8px 10px', minWidth: 200 }}>
                              <InlineEdit value={row.description || ''} onSave={v => updateRow(row.id, { description: v })} placeholder="Description…" multiline />
                            </td>
                            <td style={{ padding: '8px 8px' }}>
                              <ScoreInput value={row.self_score} onChange={v => updateRow(row.id, { self_score: v })} label="" />
                            </td>
                            {showMgr && (
                              <td style={{ padding: '8px 8px' }}>
                                <ScoreInput value={row.mgr_score} onChange={v => updateRow(row.id, { mgr_score: v })} label="" />
                              </td>
                            )}
                            <td style={{ padding: '8px 8px' }}>
                              <ScoreInput value={row.target_score} onChange={v => updateRow(row.id, { target_score: v })} label="" />
                            </td>
                            <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                              {a !== null && <span style={{ fontWeight: 700, color: scoreColor(a), fontSize: 14 }}>{a}</span>}
                            </td>
                            <td style={{ padding: '8px 10px', minWidth: 140 }}>
                              <InlineEdit value={row.notes || ''} onSave={v => updateRow(row.id, { notes: v })} placeholder="Notes…" multiline />
                            </td>
                            <td style={{ padding: '8px 8px' }}>
                              {confirmDel?.rowId === row.id ? (
                                <span style={{ display: 'flex', gap: 4 }}>
                                  <button onClick={() => deleteRow(row.id)} style={{ background: '#e88b7e22', border: '1px solid #e88b7e', color: '#e88b7e', borderRadius: 4, padding: '2px 8px', fontSize: 11, cursor: 'pointer' }}>Del</button>
                                  <button onClick={() => setConfirmDel(null)} style={{ background: 'none', border: '1px solid var(--ink-3)', color: 'var(--muted)', borderRadius: 4, padding: '2px 8px', fontSize: 11, cursor: 'pointer' }}>✕</button>
                                </span>
                              ) : (
                                <button onClick={() => setConfirmDel({ rowId: row.id, item: row.item })}
                                  style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 14, opacity: 0.5 }}>🗑</button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Knowledge tab — has status_text instead of mgr_score */}
      {tab === 'knowledge' && (() => {
        const { sections } = getSheetRows('knowledge');
        const knRows = rows.filter(r => r.sheet === 'knowledge');
        return (
          <div>
            {sections.map(section => (
              <div key={section} style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--gold)', background: 'rgba(201,168,76,.12)', padding: '3px 12px', borderRadius: 20, border: '1px solid var(--gold-d)' }}>{section}</span>
                  <button onClick={() => addRow('knowledge', section)}
                    style={{ background: 'none', border: '1px dashed var(--ink-3)', color: 'var(--muted)', borderRadius: 6, padding: '4px 12px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>
                    ＋ Add item
                  </button>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--ink-3)' }}>
                      {['Item / Topic','Description','Status / Date','Score','Notes',''].map((h,i) => (
                        <th key={i} style={{ textAlign: 'left', padding: '6px 10px', fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {knRows.filter(r => r.section === section).map((row, ri) => (
                      <tr key={row.id} style={{ borderBottom: '1px solid rgba(255,255,255,.04)', background: ri % 2 === 0 ? 'rgba(255,255,255,.01)' : 'transparent' }}>
                        <td style={{ padding: '8px 10px', minWidth: 160 }}>
                          <InlineEdit value={row.item} onSave={v => updateRow(row.id, { item: v })} />
                        </td>
                        <td style={{ padding: '8px 10px', minWidth: 180 }}>
                          <InlineEdit value={row.description || ''} onSave={v => updateRow(row.id, { description: v })} placeholder="Description…" multiline />
                        </td>
                        <td style={{ padding: '8px 10px', minWidth: 120 }}>
                          <InlineEdit value={row.status_text || ''} onSave={v => updateRow(row.id, { status_text: v })} placeholder="Status / date…" />
                        </td>
                        <td style={{ padding: '8px 8px' }}>
                          <ScoreInput value={row.self_score} onChange={v => updateRow(row.id, { self_score: v })} label="" />
                        </td>
                        <td style={{ padding: '8px 10px', minWidth: 140 }}>
                          <InlineEdit value={row.notes || ''} onSave={v => updateRow(row.id, { notes: v })} placeholder="Notes…" multiline />
                        </td>
                        <td style={{ padding: '8px 8px' }}>
                          {confirmDel?.rowId === row.id ? (
                            <span style={{ display: 'flex', gap: 4 }}>
                              <button onClick={() => deleteRow(row.id)} style={{ background: '#e88b7e22', border: '1px solid #e88b7e', color: '#e88b7e', borderRadius: 4, padding: '2px 8px', fontSize: 11, cursor: 'pointer' }}>Del</button>
                              <button onClick={() => setConfirmDel(null)} style={{ background: 'none', border: '1px solid var(--ink-3)', color: 'var(--muted)', borderRadius: 4, padding: '2px 8px', fontSize: 11, cursor: 'pointer' }}>✕</button>
                            </span>
                          ) : (
                            <button onClick={() => setConfirmDel({ rowId: row.id, item: row.item })}
                              style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 14, opacity: 0.5 }}>🗑</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  );
}
