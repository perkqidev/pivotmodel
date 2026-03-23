import { Pool } from 'pg';
let _pool: Pool | null = null;
export function getPool(): Pool {
  if (!_pool) _pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined, max: 10, idleTimeoutMillis: 30000 });
  return _pool;
}
export async function query<T = Record<string, unknown>>(sql: string, values?: unknown[]): Promise<T[]> {
  await ensureInit(); const result = await getPool().query(sql, values); return result.rows as T[];
}
export async function queryOne<T = Record<string, unknown>>(sql: string, values?: unknown[]): Promise<T | undefined> {
  const rows = await query<T>(sql, values); return rows[0];
}
export async function execute(sql: string, values?: unknown[]): Promise<number> {
  await ensureInit(); const result = await getPool().query(sql, values); return result.rowCount ?? 0;
}
let _initialized = false;
async function ensureInit() { if (_initialized) return; _initialized = true; await initSchema(); }

export async function initSchema() {
  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, company TEXT, role TEXT, industry TEXT, team_size TEXT, linkedin TEXT, bio TEXT, status TEXT NOT NULL DEFAULT 'active', is_admin BOOLEAN NOT NULL DEFAULT FALSE, joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), last_login TIMESTAMPTZ);
    CREATE TABLE IF NOT EXISTS otp_codes (id SERIAL PRIMARY KEY, email TEXT NOT NULL, code TEXT NOT NULL, purpose TEXT NOT NULL DEFAULT 'login', expires_at TIMESTAMPTZ NOT NULL, used BOOLEAN NOT NULL DEFAULT FALSE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS assessments (id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), team_name TEXT NOT NULL DEFAULT 'My Team', industry TEXT, assessment_date DATE NOT NULL DEFAULT CURRENT_DATE, notes TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS assessment_collaborators (id SERIAL PRIMARY KEY, assessment_id INTEGER NOT NULL REFERENCES assessments(id) ON DELETE CASCADE, user_id INTEGER NOT NULL REFERENCES users(id), invited_by INTEGER NOT NULL REFERENCES users(id), invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(assessment_id, user_id));
    CREATE TABLE IF NOT EXISTS assessment_emb (id SERIAL PRIMARY KEY, assessment_id INTEGER NOT NULL REFERENCES assessments(id) ON DELETE CASCADE, pivot_num INTEGER NOT NULL, pivot_name TEXT NOT NULL, capability TEXT NOT NULL, l1_criteria TEXT, l2_criteria TEXT, l3_criteria TEXT, current_level TEXT DEFAULT 'L1', score_icon TEXT DEFAULT 'diamond', evidence TEXT, gap_notes TEXT, sort_order INTEGER DEFAULT 0);
    CREATE TABLE IF NOT EXISTS assessment_business_drivers (id SERIAL PRIMARY KEY, assessment_id INTEGER NOT NULL REFERENCES assessments(id) ON DELETE CASCADE, category TEXT NOT NULL DEFAULT 'Cost', driver_name TEXT NOT NULL DEFAULT 'New Driver', description TEXT, current_state TEXT, target_state TEXT, priority TEXT NOT NULL DEFAULT 'Medium', notes TEXT, sort_order INTEGER DEFAULT 0);
    CREATE TABLE IF NOT EXISTS assessment_benchmarks (id SERIAL PRIMARY KEY, assessment_id INTEGER NOT NULL REFERENCES assessments(id) ON DELETE CASCADE, pillar TEXT NOT NULL, kpi_name TEXT NOT NULL, unit TEXT, target_value TEXT, current_value TEXT, status TEXT NOT NULL DEFAULT 'pending', notes TEXT, sort_order INTEGER DEFAULT 0);
    CREATE TABLE IF NOT EXISTS assessment_scope (id SERIAL PRIMARY KEY, assessment_id INTEGER NOT NULL REFERENCES assessments(id) ON DELETE CASCADE, pillar TEXT NOT NULL, activity TEXT NOT NULL DEFAULT 'New Activity', required_level INTEGER NOT NULL DEFAULT 1, current_level INTEGER NOT NULL DEFAULT 1, gap INTEGER NOT NULL DEFAULT 0, notes TEXT, sort_order INTEGER DEFAULT 0);
    CREATE TABLE IF NOT EXISTS assessment_kra (id SERIAL PRIMARY KEY, assessment_id INTEGER NOT NULL REFERENCES assessments(id) ON DELETE CASCADE, role_level TEXT NOT NULL DEFAULT 'Manager', person_name TEXT, kra_name TEXT NOT NULL DEFAULT 'New KRA', description TEXT, target TEXT, current TEXT, status TEXT NOT NULL DEFAULT 'not-started', notes TEXT, sort_order INTEGER DEFAULT 0);
    CREATE TABLE IF NOT EXISTS assessment_leadership (id SERIAL PRIMARY KEY, assessment_id INTEGER NOT NULL REFERENCES assessments(id) ON DELETE CASCADE, leader_name TEXT NOT NULL DEFAULT 'Leader', leader_role TEXT, skill_name TEXT NOT NULL, is_mandatory BOOLEAN NOT NULL DEFAULT FALSE, score INTEGER NOT NULL DEFAULT 0, notes TEXT, sort_order INTEGER DEFAULT 0);
    CREATE TABLE IF NOT EXISTS chat_usage (id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), message_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
    CREATE INDEX IF NOT EXISTS chat_usage_user_time ON chat_usage(user_id, message_at);
    CREATE TABLE IF NOT EXISTS blog_posts (id SERIAL PRIMARY KEY, title TEXT NOT NULL, category TEXT, excerpt TEXT, body TEXT, emoji TEXT DEFAULT '📝', read_time INTEGER DEFAULT 4, status TEXT NOT NULL DEFAULT 'draft', author_name TEXT DEFAULT 'The Pivot Model', published_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS whitepapers (id SERIAL PRIMARY KEY, title TEXT NOT NULL, category TEXT, description TEXT, icon TEXT DEFAULT '📄', pages INTEGER DEFAULT 1, access TEXT NOT NULL DEFAULT 'members', file_url TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS leads (id SERIAL PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL, company TEXT NOT NULL, role TEXT, industry TEXT, linkedin TEXT, team_size TEXT, challenges TEXT, service TEXT, status TEXT NOT NULL DEFAULT 'new', source TEXT, submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
  `);
  await seedDefaults(pool);
}

async function seedDefaults(pool: Pool) {
  const { rows: ar } = await pool.query("SELECT id FROM users WHERE email = 'pivotrics@gmail.com'");
  if (ar.length === 0) await pool.query("INSERT INTO users (name, email, status, is_admin) VALUES ('Admin', 'pivotrics@gmail.com', 'active', TRUE)");
  const { rows: sr } = await pool.query('SELECT COUNT(*) AS c FROM settings');
  if (parseInt(sr[0].c) === 0) await pool.query(`INSERT INTO settings (key, value) VALUES ('site_name','The Pivot Model'),('chat_enabled','false'),('chat_api_key',''),('chat_system_prompt','You are a helpful assistant for The Pivot Model book. Answer questions about engineering team maturity, offshore operations, and the EMB framework only.'),('chat_limit_day','20'),('chat_limit_week','80'),('chat_limit_month','200'),('otp_enabled','true')`);
  const { rows: pr } = await pool.query('SELECT COUNT(*) AS c FROM blog_posts');
  if (parseInt(pr[0].c) === 0) {
    await pool.query(`INSERT INTO blog_posts (title,category,excerpt,emoji,read_time,status,published_at) VALUES ('Why Most Offshore Engineering Teams Stay at L1','Engineering Maturity','The L1 trap is real — and it''s not the offshore team''s fault.','🔒',4,'published',NOW()-INTERVAL '7 days'),('The AI Readiness Paradox for Offshore Teams','AI & Developer Tools','AI amplifies existing engineering maturity — it doesn''t create it.','🤖',5,'published',NOW()-INTERVAL '14 days'),('Captive vs Third-Party Offshore: The Decision Framework','Offshore Operations','Neither model is superior. The right choice depends on five factors.','🏗️',6,'published',NOW()-INTERVAL '21 days')`);
    await pool.query(`INSERT INTO whitepapers (title,category,description,icon,pages,access) VALUES ('The EMB Framework','Framework Reference','Complete Engineering Maturity Benchmark reference with all criteria and scoring rubrics.','📊',24,'members'),('AI Readiness for Offshore Teams','AI & Developer Tools','Navigating Phases 1, 2 and 3 of AI adoption in offshore engineering centres.','🤖',18,'members'),('The Offshore Team Scorecard','Tools & Templates','Quick self-assessment tool — score your team in under 20 minutes.','✅',8,'public')`);
  }
}

export async function getSetting(key: string): Promise<string | null> {
  const row = await queryOne<{ value: string }>('SELECT value FROM settings WHERE key = $1', [key]);
  return row?.value ?? null;
}
export async function setSetting(key: string, value: string): Promise<void> {
  await execute(`INSERT INTO settings (key,value,updated_at) VALUES ($1,$2,NOW()) ON CONFLICT (key) DO UPDATE SET value=EXCLUDED.value,updated_at=NOW()`, [key, value]);
}

export const EMB_TEMPLATE = [
  { pivot_num:1,pivot_name:'Operational Excellence',capability:'Code Quality & Review',l1_criteria:'Code is functional; basic reviews happen ad-hoc',l2_criteria:'Consistent PR reviews with quality gates; lint & static analysis in CI',l3_criteria:'Ownership culture; engineers proactively raise quality standards',sort_order:1},
  { pivot_num:1,pivot_name:'Operational Excellence',capability:'Testing Discipline',l1_criteria:'Manual testing primarily; unit tests sparse',l2_criteria:'Unit & integration tests standard; coverage tracked',l3_criteria:'TDD mindset; test coverage > 80%; performance & regression suites',sort_order:2},
  { pivot_num:1,pivot_name:'Operational Excellence',capability:'CI/CD & Build Pipeline',l1_criteria:'Manual or semi-automated deployments',l2_criteria:'Automated CI/CD; environments properly separated',l3_criteria:'Zero-downtime deploys; feature flags; automated rollback',sort_order:3},
  { pivot_num:1,pivot_name:'Operational Excellence',capability:'Incident & On-Call Management',l1_criteria:'Reactive; escalation dependent on single individuals',l2_criteria:'On-call rotation; post-mortems conducted',l3_criteria:'Blameless culture; SLOs/SLAs defined and tracked; proactive alerting',sort_order:4},
  { pivot_num:1,pivot_name:'Operational Excellence',capability:'Documentation Standards',l1_criteria:'Documentation sparse or outdated',l2_criteria:'APIs and systems documented; runbooks maintained',l3_criteria:'Living documentation culture; architecture decisions recorded',sort_order:5},
  { pivot_num:2,pivot_name:'Pace of Product Evolution',capability:'Sprint Velocity & Predictability',l1_criteria:'Sprints frequently miss targets; estimation inconsistent',l2_criteria:'Stable velocity; 80%+ sprint commitments met',l3_criteria:'Predictable delivery with clear capacity planning',sort_order:6},
  { pivot_num:2,pivot_name:'Pace of Product Evolution',capability:'Technical Debt Management',l1_criteria:'Debt accumulates unchecked; no tracking',l2_criteria:'Debt tracked and allocated budget in sprints',l3_criteria:'Proactive refactoring; debt ratio declining; architectural clarity',sort_order:7},
  { pivot_num:2,pivot_name:'Pace of Product Evolution',capability:'Feature Delivery Speed',l1_criteria:'High cycle time; long lead times',l2_criteria:'Reasonable lead times; cycle time tracked and improving',l3_criteria:'Lean flow; small batch sizes; continuous delivery',sort_order:8},
  { pivot_num:2,pivot_name:'Pace of Product Evolution',capability:'Innovation & Continuous Improvement',l1_criteria:'Reactive; no time for improvement',l2_criteria:'Regular retrospectives; process improvements implemented',l3_criteria:'Engineers drive innovation; experimentation encouraged',sort_order:9},
  { pivot_num:3,pivot_name:'Collaboration & Alignment',capability:'Stakeholder Communication',l1_criteria:'Communication reactive; status updates only when asked',l2_criteria:'Regular structured updates; blockers surfaced proactively',l3_criteria:'Engineers communicate business context; trusted partners to onshore',sort_order:10},
  { pivot_num:3,pivot_name:'Collaboration & Alignment',capability:'Cross-Team Collaboration',l1_criteria:'Siloed; minimal coordination outside own team',l2_criteria:'Regular cross-team sync; dependencies managed',l3_criteria:'Collaborative problem-solving; shared ownership across teams',sort_order:11},
  { pivot_num:3,pivot_name:'Collaboration & Alignment',capability:'Cultural Integration',l1_criteria:'Cultural gap significant; us-vs-them mentality',l2_criteria:'Cultural awareness growing; some integration initiatives',l3_criteria:'Genuinely integrated culture; offshore seen as equal partner',sort_order:12},
  { pivot_num:3,pivot_name:'Collaboration & Alignment',capability:'Knowledge Sharing',l1_criteria:'Knowledge siloed in individuals; no documentation culture',l2_criteria:'Regular knowledge sharing sessions; wikis maintained',l3_criteria:'Continuous learning culture; internal talks; mentoring programs',sort_order:13},
  { pivot_num:4,pivot_name:'Business Results',capability:'Business Impact Awareness',l1_criteria:'Engineers unaware of business metrics',l2_criteria:'Team understands product KPIs; can connect work to outcomes',l3_criteria:'Engineers drive business conversations; suggest product improvements',sort_order:14},
  { pivot_num:4,pivot_name:'Business Results',capability:'KRA Achievement',l1_criteria:'KRAs unclear or unmeasured',l2_criteria:'KRAs defined per role; tracked quarterly',l3_criteria:'KRAs tied to business OKRs; self-managed accountability',sort_order:15},
  { pivot_num:4,pivot_name:'Business Results',capability:'Customer Orientation',l1_criteria:'No direct customer interaction or feedback loop',l2_criteria:'Engineers exposed to customer feedback; user stories understood',l3_criteria:'Engineers participate in customer calls; empathy drives design',sort_order:16},
  { pivot_num:4,pivot_name:'Business Results',capability:'Strategic Contribution',l1_criteria:'Offshore purely execution; no input to strategy',l2_criteria:'Offshore contributes to technical roadmap',l3_criteria:'Offshore drives product innovation; strategic thought partner',sort_order:17},
  { pivot_num:5,pivot_name:'People & Talent',capability:'Hiring Quality',l1_criteria:'Reactive hiring; skills assessed informally',l2_criteria:'Structured interviews; defined scorecards; bar-raiser in process',l3_criteria:'Elite talent pipeline; offshore competes globally for top talent',sort_order:18},
  { pivot_num:5,pivot_name:'People & Talent',capability:'Retention & Growth',l1_criteria:'High attrition; no career framework',l2_criteria:'Career paths defined; mentoring present; attrition tracked',l3_criteria:'Low attrition; strong internal mobility; engineers actively growing',sort_order:19},
  { pivot_num:5,pivot_name:'People & Talent',capability:'Leadership Pipeline',l1_criteria:'No defined senior / staff / principal track offshore',l2_criteria:'Senior engineers visible; team leads emerging',l3_criteria:'Strong offshore leadership; directors and VPs developed internally',sort_order:20},
  { pivot_num:5,pivot_name:'People & Talent',capability:'AI & Tool Adoption',l1_criteria:'No AI tooling; awareness low',l2_criteria:'Copilot / AI tools adopted; productivity improving',l3_criteria:'AI-native workflows; engineers amplified 2x+ by tooling',sort_order:21},
];

export const BENCHMARK_TEMPLATE = [
  {pillar:'Delivery',kpi_name:'Sprint Completion Rate',unit:'%',target_value:'85',sort_order:1},{pillar:'Delivery',kpi_name:'Deployment Frequency',unit:'per week',target_value:'3',sort_order:2},{pillar:'Delivery',kpi_name:'Lead Time for Changes',unit:'days',target_value:'5',sort_order:3},{pillar:'Delivery',kpi_name:'Change Failure Rate',unit:'%',target_value:'10',sort_order:4},{pillar:'Delivery',kpi_name:'Mean Time to Restore',unit:'hours',target_value:'4',sort_order:5},{pillar:'Delivery',kpi_name:'Cycle Time',unit:'days',target_value:'3',sort_order:6},{pillar:'Delivery',kpi_name:'Release Predictability',unit:'%',target_value:'90',sort_order:7},
  {pillar:'Quality',kpi_name:'Test Coverage',unit:'%',target_value:'80',sort_order:8},{pillar:'Quality',kpi_name:'Production Bug Rate',unit:'bugs/sprint',target_value:'2',sort_order:9},{pillar:'Quality',kpi_name:'Code Review Coverage',unit:'%',target_value:'100',sort_order:10},{pillar:'Quality',kpi_name:'Technical Debt Ratio',unit:'%',target_value:'15',sort_order:11},{pillar:'Quality',kpi_name:'Security Scan Pass Rate',unit:'%',target_value:'100',sort_order:12},{pillar:'Quality',kpi_name:'Performance SLA Compliance',unit:'%',target_value:'99',sort_order:13},
  {pillar:'People',kpi_name:'Team Attrition Rate',unit:'%/year',target_value:'15',sort_order:14},{pillar:'People',kpi_name:'Time to Hire',unit:'days',target_value:'30',sort_order:15},{pillar:'People',kpi_name:'Training Hours per Engineer',unit:'hrs/quarter',target_value:'20',sort_order:16},{pillar:'People',kpi_name:'Employee NPS',unit:'score',target_value:'30',sort_order:17},{pillar:'People',kpi_name:'Internal Promotion Rate',unit:'%',target_value:'20',sort_order:18},{pillar:'People',kpi_name:'AI Tool Adoption Rate',unit:'%',target_value:'70',sort_order:19},
  {pillar:'Operations',kpi_name:'On-call Incidents per Month',unit:'count',target_value:'5',sort_order:20},{pillar:'Operations',kpi_name:'P1 Incident Resolution Time',unit:'hours',target_value:'2',sort_order:21},{pillar:'Operations',kpi_name:'System Uptime',unit:'%',target_value:'99.9',sort_order:22},{pillar:'Operations',kpi_name:'Post-mortem Completion Rate',unit:'%',target_value:'100',sort_order:23},{pillar:'Operations',kpi_name:'Infrastructure Cost per Engineer',unit:'USD/month',target_value:'500',sort_order:24},{pillar:'Operations',kpi_name:'CI/CD Pipeline Success Rate',unit:'%',target_value:'95',sort_order:25},{pillar:'Operations',kpi_name:'Documentation Coverage',unit:'%',target_value:'80',sort_order:26},{pillar:'Operations',kpi_name:'Runbook Completeness',unit:'%',target_value:'90',sort_order:27},
];

export const SCOPE_TEMPLATE = [
  {pillar:'Operational Excellence',activity:'Code review & quality gates',sort_order:1},{pillar:'Operational Excellence',activity:'Automated testing',sort_order:2},{pillar:'Operational Excellence',activity:'CI/CD pipeline ownership',sort_order:3},{pillar:'Operational Excellence',activity:'Infrastructure & cloud management',sort_order:4},{pillar:'Operational Excellence',activity:'Security scanning & compliance',sort_order:5},
  {pillar:'Pace of Product Evolution',activity:'Sprint planning & estimation',sort_order:6},{pillar:'Pace of Product Evolution',activity:'Technical roadmap input',sort_order:7},{pillar:'Pace of Product Evolution',activity:'Architecture decision making',sort_order:8},{pillar:'Pace of Product Evolution',activity:'Tech debt tracking & remediation',sort_order:9},
  {pillar:'Collaboration & Alignment',activity:'Stakeholder reporting',sort_order:10},{pillar:'Collaboration & Alignment',activity:'Cross-team coordination',sort_order:11},{pillar:'Collaboration & Alignment',activity:'Onshore-offshore synchronisation',sort_order:12},
  {pillar:'Business Results',activity:'Business KPI tracking',sort_order:13},{pillar:'Business Results',activity:'Customer feedback integration',sort_order:14},{pillar:'Business Results',activity:'Product discovery & ideation',sort_order:15},
  {pillar:'People & Talent',activity:'Hiring & interviewing',sort_order:16},{pillar:'People & Talent',activity:'Mentoring & coaching',sort_order:17},{pillar:'People & Talent',activity:'Performance management',sort_order:18},{pillar:'People & Talent',activity:'AI & tooling enablement',sort_order:19},
];

export const LEADERSHIP_SKILLS = [
  {skill_name:'Strategic Thinking',is_mandatory:true},{skill_name:'Technical Credibility',is_mandatory:true},{skill_name:'Team Building',is_mandatory:true},{skill_name:'Stakeholder Management',is_mandatory:true},{skill_name:'Communication & Presence',is_mandatory:true},{skill_name:'Decision Making Under Uncertainty',is_mandatory:true},{skill_name:'Coaching & Mentoring',is_mandatory:false},{skill_name:'Conflict Resolution',is_mandatory:false},{skill_name:'Data-Driven Mindset',is_mandatory:false},{skill_name:'Change Management',is_mandatory:false},{skill_name:'Cross-Cultural Intelligence',is_mandatory:false},{skill_name:'Accountability & Ownership',is_mandatory:true},{skill_name:'Innovation & Experimentation',is_mandatory:false},{skill_name:'Customer Empathy',is_mandatory:false},{skill_name:'Hiring & Talent Bar',is_mandatory:true},{skill_name:'AI Fluency',is_mandatory:false},{skill_name:'Process Design',is_mandatory:false},{skill_name:'Influence Without Authority',is_mandatory:false},{skill_name:'Resilience & Grit',is_mandatory:false},{skill_name:'Financial Acumen',is_mandatory:false},
];
