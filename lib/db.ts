/**
 * lib/db.ts  — PostgreSQL database layer using 'pg'.
 *
 * Set DATABASE_URL in .env.local:
 *   DATABASE_URL=postgresql://user:password@localhost:5432/pivot_model
 *
 * Optional:
 *   DATABASE_SSL=true   (for managed hosting like Supabase, Railway, Neon)
 */

import { Pool } from 'pg';

// ─── Pool ─────────────────────────────────────────────────────────────────────

let _pool: Pool | null = null;

export function getPool(): Pool {
  if (!_pool) {
    _pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
      max: 10,
      idleTimeoutMillis: 30000,
    });
  }
  return _pool;
}

// ─── Query helpers ────────────────────────────────────────────────────────────

export async function query<T = Record<string, unknown>>(
  sql: string,
  values?: unknown[]
): Promise<T[]> {
  await ensureInit();
  const result = await getPool().query(sql, values);
  return result.rows as T[];
}

export async function queryOne<T = Record<string, unknown>>(
  sql: string,
  values?: unknown[]
): Promise<T | undefined> {
  const rows = await query<T>(sql, values);
  return rows[0];
}

export async function execute(sql: string, values?: unknown[]): Promise<number> {
  await ensureInit();
  const result = await getPool().query(sql, values);
  return result.rowCount ?? 0;
}

// ─── Schema init ──────────────────────────────────────────────────────────────

let _initialized = false;

async function ensureInit() {
  if (_initialized) return;
  _initialized = true;
  await initSchema();
}

export async function initSchema() {
  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id           SERIAL PRIMARY KEY,
      name         TEXT NOT NULL,
      email        TEXT NOT NULL UNIQUE,
      company      TEXT,
      role         TEXT,
      industry     TEXT,
      team_size    TEXT,
      linkedin     TEXT,
      bio          TEXT,
      status       TEXT NOT NULL DEFAULT 'active',
      is_admin     BOOLEAN NOT NULL DEFAULT FALSE,
      joined_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_login   TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS otp_codes (
      id         SERIAL PRIMARY KEY,
      email      TEXT NOT NULL,
      code       TEXT NOT NULL,
      purpose    TEXT NOT NULL DEFAULT 'login',
      expires_at TIMESTAMPTZ NOT NULL,
      used       BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS leads (
      id                SERIAL PRIMARY KEY,
      name              TEXT NOT NULL,
      email             TEXT NOT NULL,
      company           TEXT NOT NULL,
      role              TEXT,
      industry          TEXT,
      linkedin          TEXT,
      team_size         TEXT,
      offshore_model    TEXT,
      maturity_level    TEXT,
      current_operation TEXT,
      challenges        TEXT,
      expectations      TEXT,
      service           TEXT,
      preferred_contact TEXT,
      timezone          TEXT,
      availability      TEXT,
      timeline          TEXT,
      how_heard         TEXT,
      extra_notes       TEXT,
      status            TEXT NOT NULL DEFAULT 'new',
      source            TEXT,
      submitted_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS emb_assessments (
      id              SERIAL PRIMARY KEY,
      user_id         INTEGER NOT NULL REFERENCES users(id),
      team_name       TEXT NOT NULL DEFAULT 'My Team',
      assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,
      notes           TEXT,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS emb_rows (
      id            SERIAL PRIMARY KEY,
      assessment_id INTEGER NOT NULL REFERENCES emb_assessments(id) ON DELETE CASCADE,
      pivot_num     INTEGER NOT NULL,
      pivot_name    TEXT NOT NULL,
      capability    TEXT NOT NULL,
      l1_criteria   TEXT,
      l2_criteria   TEXT,
      l3_criteria   TEXT,
      current_level TEXT DEFAULT 'L1',
      score         INTEGER DEFAULT 1,
      evidence      TEXT,
      row_notes     TEXT,
      sort_order    INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS blog_posts (
      id           SERIAL PRIMARY KEY,
      title        TEXT NOT NULL,
      category     TEXT,
      excerpt      TEXT,
      body         TEXT,
      emoji        TEXT DEFAULT '📝',
      read_time    INTEGER DEFAULT 4,
      status       TEXT NOT NULL DEFAULT 'draft',
      author_name  TEXT DEFAULT 'The Pivot Model',
      published_at TIMESTAMPTZ,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS whitepapers (
      id           SERIAL PRIMARY KEY,
      title        TEXT NOT NULL,
      category     TEXT,
      description  TEXT,
      icon         TEXT DEFAULT '📄',
      pages        INTEGER DEFAULT 1,
      access       TEXT NOT NULL DEFAULT 'members',
      file_url     TEXT,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS settings (
      key        TEXT PRIMARY KEY,
      value      TEXT,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- ── Talent Management ─────────────────────────────────────────────────

    -- Skill Requirements Profiles (one per product/assessment)
    CREATE TABLE IF NOT EXISTS skill_profiles (
      id         SERIAL PRIMARY KEY,
      user_id    INTEGER NOT NULL REFERENCES users(id),
      name       TEXT NOT NULL DEFAULT 'New Profile',
      context    JSONB NOT NULL DEFAULT '{}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Skill requirement rows (editable grid)
    CREATE TABLE IF NOT EXISTS skill_req_rows (
      id               SERIAL PRIMARY KEY,
      profile_id       INTEGER NOT NULL REFERENCES skill_profiles(id) ON DELETE CASCADE,
      section          TEXT NOT NULL,
      skill            TEXT NOT NULL DEFAULT 'New Skill',
      why_matters      TEXT,
      importance       TEXT NOT NULL DEFAULT 'Standard',
      min_level        INTEGER NOT NULL DEFAULT 5,
      ideal_level      INTEGER NOT NULL DEFAULT 8,
      depth            TEXT NOT NULL DEFAULT 'D',
      engineers_needed INTEGER,
      seniority        TEXT,
      notes            TEXT,
      sort_order       INTEGER NOT NULL DEFAULT 0
    );

    -- Engineering Talent Maps (one per engineer assessment)
    CREATE TABLE IF NOT EXISTS talent_maps (
      id         SERIAL PRIMARY KEY,
      user_id    INTEGER NOT NULL REFERENCES users(id),
      name       TEXT NOT NULL DEFAULT 'New Assessment',
      profile    JSONB NOT NULL DEFAULT '{}',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Talent map rows (technical, mindset, ai, knowledge tabs)
    CREATE TABLE IF NOT EXISTS talent_map_rows (
      id           SERIAL PRIMARY KEY,
      map_id       INTEGER NOT NULL REFERENCES talent_maps(id) ON DELETE CASCADE,
      sheet        TEXT NOT NULL,
      section      TEXT NOT NULL,
      item         TEXT NOT NULL,
      description  TEXT,
      self_score   INTEGER,
      mgr_score    INTEGER,
      target_score INTEGER,
      status_text  TEXT,
      notes        TEXT,
      sort_order   INTEGER NOT NULL DEFAULT 0
    );
  `);
  await seedDefaults(pool);
}

async function seedDefaults(pool: Pool) {
  const { rows: pr } = await pool.query('SELECT COUNT(*) AS c FROM blog_posts');
  if (parseInt(pr[0].c) === 0) {
    await pool.query(`
      INSERT INTO blog_posts (title, category, excerpt, emoji, read_time, status, published_at) VALUES
        ('Why Most Offshore Engineering Teams Stay at L1','Engineering Maturity',
         'The L1 trap is real — and it''s not the offshore team''s fault.','🔒',4,'published', NOW() - INTERVAL '7 days'),
        ('The AI Readiness Paradox for Offshore Teams','AI & Developer Tools',
         'AI amplifies existing engineering maturity — it doesn''t create it.','🤖',5,'published', NOW() - INTERVAL '14 days'),
        ('Captive vs Third-Party Offshore: The Decision Framework','Offshore Operations',
         'Neither model is superior. The right choice depends on five factors.','🏗️',6,'published', NOW() - INTERVAL '21 days')
    `);
    await pool.query(`
      INSERT INTO whitepapers (title, category, description, icon, pages, access) VALUES
        ('The EMB Framework','Framework Reference',
         'Complete Engineering Maturity Benchmark reference with all criteria and scoring rubrics.','📊',24,'members'),
        ('AI Readiness for Offshore Teams','AI & Developer Tools',
         'Navigating Phases 1, 2 and 3 of AI adoption in offshore engineering centres.','🤖',18,'members'),
        ('The Offshore Team Scorecard','Tools & Templates',
         'Quick self-assessment tool — score your team in under 20 minutes.','✅',8,'public')
    `);
  }
  const { rows: sr } = await pool.query('SELECT COUNT(*) AS c FROM settings');
  if (parseInt(sr[0].c) === 0) {
    await pool.query(`
      INSERT INTO settings (key, value) VALUES
        ('site_name','The Pivot Model'),
        ('forum_enabled','false'),
        ('otp_enabled','true'),
        ('corp_email_only','true')
    `);
  }
}

// ─── Settings helpers ─────────────────────────────────────────────────────────

export async function getSetting(key: string): Promise<string | null> {
  const row = await queryOne<{ value: string }>('SELECT value FROM settings WHERE key = $1', [key]);
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await execute(`
    INSERT INTO settings (key, value, updated_at) VALUES ($1, $2, NOW())
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
  `, [key, value]);
}

// ─── EMB Template ─────────────────────────────────────────────────────────────

export const EMB_TEMPLATE = [
  { pivot_num: 1, pivot_name: 'Operational Excellence', capability: 'Code Quality & Review', l1_criteria: 'Code is functional; basic reviews happen ad-hoc', l2_criteria: 'Consistent PR reviews with quality gates; lint & static analysis in CI', l3_criteria: 'Ownership culture; engineers proactively raise quality standards', sort_order: 1 },
  { pivot_num: 1, pivot_name: 'Operational Excellence', capability: 'Testing Discipline', l1_criteria: 'Manual testing primarily; unit tests sparse', l2_criteria: 'Unit & integration tests standard; coverage tracked', l3_criteria: 'TDD mindset; test coverage > 80%; performance & regression suites', sort_order: 2 },
  { pivot_num: 1, pivot_name: 'Operational Excellence', capability: 'Documentation Standards', l1_criteria: 'Documentation sparse or outdated', l2_criteria: 'APIs and systems documented; runbooks maintained', l3_criteria: 'Living documentation culture; architecture decisions recorded', sort_order: 3 },
  { pivot_num: 1, pivot_name: 'Operational Excellence', capability: 'CI/CD & Build Pipeline', l1_criteria: 'Manual or semi-automated deployments', l2_criteria: 'Automated CI/CD; environments properly separated', l3_criteria: 'Zero-downtime deploys; feature flags; automated rollback', sort_order: 4 },
  { pivot_num: 1, pivot_name: 'Operational Excellence', capability: 'Incident & On-Call Management', l1_criteria: 'Reactive; escalation dependent on single individuals', l2_criteria: 'On-call rotation; post-mortems conducted', l3_criteria: 'Blameless culture; SLOs/SLAs defined and tracked; proactive alerting', sort_order: 5 },
  { pivot_num: 2, pivot_name: 'Pace of Product Evolution', capability: 'Sprint Velocity & Predictability', l1_criteria: 'Sprints frequently miss targets; estimation inconsistent', l2_criteria: 'Stable velocity; 80%+ sprint commitments met', l3_criteria: 'Predictable delivery with clear capacity planning; rarely misses', sort_order: 6 },
  { pivot_num: 2, pivot_name: 'Pace of Product Evolution', capability: 'Technical Debt Management', l1_criteria: 'Debt accumulates unchecked; no tracking', l2_criteria: 'Debt tracked and allocated budget in sprints', l3_criteria: 'Proactive refactoring; debt ratio declining; architectural clarity', sort_order: 7 },
  { pivot_num: 2, pivot_name: 'Pace of Product Evolution', capability: 'Feature Delivery Speed', l1_criteria: 'High cycle time; long lead times from idea to production', l2_criteria: 'Reasonable lead times; cycle time tracked and improving', l3_criteria: 'Lean flow; small batch sizes; continuous delivery', sort_order: 8 },
  { pivot_num: 2, pivot_name: 'Pace of Product Evolution', capability: 'Innovation & Continuous Improvement', l1_criteria: 'Reactive; no time for improvement', l2_criteria: 'Regular retrospectives; process improvements implemented', l3_criteria: 'Engineers drive innovation; experimentation encouraged; 20% improvement time', sort_order: 9 },
  { pivot_num: 3, pivot_name: 'Collaboration & Alignment', capability: 'Stakeholder Communication', l1_criteria: 'Communication reactive; status updates only when asked', l2_criteria: 'Regular structured updates; blockers surfaced proactively', l3_criteria: 'Engineers communicate business context; trusted partners to onshore', sort_order: 10 },
  { pivot_num: 3, pivot_name: 'Collaboration & Alignment', capability: 'Cross-Team Collaboration', l1_criteria: 'Siloed; minimal coordination outside own team', l2_criteria: 'Regular cross-team sync; dependencies managed', l3_criteria: 'Collaborative problem-solving; shared ownership across teams', sort_order: 11 },
  { pivot_num: 3, pivot_name: 'Collaboration & Alignment', capability: 'Cultural Integration', l1_criteria: 'Cultural gap significant; us-vs-them mentality', l2_criteria: 'Cultural awareness growing; some integration initiatives', l3_criteria: 'Genuinely integrated culture; offshore seen as equal partner', sort_order: 12 },
  { pivot_num: 3, pivot_name: 'Collaboration & Alignment', capability: 'Knowledge Sharing', l1_criteria: 'Knowledge siloed in individuals; no documentation culture', l2_criteria: 'Regular knowledge sharing sessions; wikis maintained', l3_criteria: 'Continuous learning culture; internal talks; mentoring programs', sort_order: 13 },
  { pivot_num: 4, pivot_name: 'Business Results', capability: 'Business Impact Awareness', l1_criteria: 'Engineers unaware of business metrics', l2_criteria: 'Team understands product KPIs; can connect work to outcomes', l3_criteria: 'Engineers drive business conversations; suggest product improvements', sort_order: 14 },
  { pivot_num: 4, pivot_name: 'Business Results', capability: 'KRA Achievement', l1_criteria: 'KRAs unclear or unmeasured', l2_criteria: 'KRAs defined per role; tracked quarterly', l3_criteria: 'KRAs tied to business OKRs; self-managed accountability', sort_order: 15 },
  { pivot_num: 4, pivot_name: 'Business Results', capability: 'Customer Orientation', l1_criteria: 'No direct customer interaction or feedback loop', l2_criteria: 'Engineers exposed to customer feedback; user stories understood', l3_criteria: 'Engineers participate in customer calls; empathy drives design', sort_order: 16 },
  { pivot_num: 4, pivot_name: 'Business Results', capability: 'Strategic Contribution', l1_criteria: 'Offshore purely execution; no input to strategy', l2_criteria: 'Offshore contributes to technical roadmap', l3_criteria: 'Offshore drives product innovation; strategic thought partner', sort_order: 17 },
];
