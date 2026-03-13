/**
 * lib/db.ts
 * SQLite database layer using better-sqlite3.
 *
 * Works with any Node.js hosting (VPS like NettiGritty).
 * The database is a single file — no separate DB server needed.
 * To switch to MySQL/PostgreSQL later, replace the adapter here only.
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DATABASE_PATH
  ? path.resolve(process.env.DATABASE_PATH)
  : path.join(process.cwd(), 'data', 'pivot.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL'); // Better concurrent read performance
    _db.pragma('foreign_keys = ON');
    initSchema(_db);
  }
  return _db;
}

// ─── SCHEMA ───────────────────────────────────────────────────────────────

function initSchema(db: Database.Database) {
  db.exec(`
    -- Members / Users
    CREATE TABLE IF NOT EXISTS users (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      name         TEXT NOT NULL,
      email        TEXT NOT NULL UNIQUE,
      company      TEXT,
      role         TEXT,
      industry     TEXT,
      team_size    TEXT,
      linkedin     TEXT,
      bio          TEXT,
      status       TEXT NOT NULL DEFAULT 'active',   -- active | suspended | pending
      is_admin     INTEGER NOT NULL DEFAULT 0,
      joined_at    TEXT NOT NULL DEFAULT (datetime('now')),
      last_login   TEXT
    );

    -- OTP Codes (for email verification)
    CREATE TABLE IF NOT EXISTS otp_codes (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      email      TEXT NOT NULL,
      code       TEXT NOT NULL,
      purpose    TEXT NOT NULL DEFAULT 'login',      -- login | register
      expires_at TEXT NOT NULL,
      used       INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Consulting Leads
    CREATE TABLE IF NOT EXISTS leads (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
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
      status            TEXT NOT NULL DEFAULT 'new', -- new | contacted | converted | closed
      source            TEXT,
      submitted_at      TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- EMB Assessments (spreadsheet rows per user)
    CREATE TABLE IF NOT EXISTS emb_assessments (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id         INTEGER NOT NULL REFERENCES users(id),
      team_name       TEXT NOT NULL DEFAULT 'My Team',
      assessment_date TEXT NOT NULL DEFAULT (date('now')),
      notes           TEXT,
      created_at      TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- EMB Assessment Rows (individual capability scores)
    CREATE TABLE IF NOT EXISTS emb_rows (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      assessment_id INTEGER NOT NULL REFERENCES emb_assessments(id) ON DELETE CASCADE,
      pivot_num     INTEGER NOT NULL,               -- 1-4
      pivot_name    TEXT NOT NULL,
      capability    TEXT NOT NULL,
      l1_criteria   TEXT,
      l2_criteria   TEXT,
      l3_criteria   TEXT,
      current_level TEXT DEFAULT 'L1',              -- L1 | L2 | L3
      score         INTEGER DEFAULT 1,              -- 1-10
      evidence      TEXT,
      row_notes     TEXT,
      sort_order    INTEGER DEFAULT 0
    );

    -- Blog Posts
    CREATE TABLE IF NOT EXISTS blog_posts (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      title        TEXT NOT NULL,
      category     TEXT,
      excerpt      TEXT,
      body         TEXT,
      emoji        TEXT DEFAULT '📝',
      read_time    INTEGER DEFAULT 4,
      status       TEXT NOT NULL DEFAULT 'draft',   -- draft | published
      author_name  TEXT DEFAULT 'The Pivot Model',
      published_at TEXT,
      created_at   TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Whitepapers
    CREATE TABLE IF NOT EXISTS whitepapers (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      title        TEXT NOT NULL,
      category     TEXT,
      description  TEXT,
      icon         TEXT DEFAULT '📄',
      pages        INTEGER DEFAULT 1,
      access       TEXT NOT NULL DEFAULT 'members', -- public | members
      file_url     TEXT,
      created_at   TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Site Settings (key-value)
    CREATE TABLE IF NOT EXISTS settings (
      key        TEXT PRIMARY KEY,
      value      TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Seed default data if tables are empty
  seedDefaults(db);
}

// ─── SEED DATA ────────────────────────────────────────────────────────────

function seedDefaults(db: Database.Database) {
  const postCount = (db.prepare('SELECT COUNT(*) as c FROM blog_posts').get() as { c: number }).c;
  if (postCount === 0) {
    db.exec(`
      INSERT INTO blog_posts (title, category, excerpt, emoji, read_time, status, published_at) VALUES
        ('Why Most Offshore Engineering Teams Stay at L1', 'Engineering Maturity', 'The L1 trap is real — and it''s not the offshore team''s fault.', '🔒', 4, 'published', datetime('now', '-7 days')),
        ('The AI Readiness Paradox for Offshore Teams', 'AI & Developer Tools', 'AI amplifies existing engineering maturity — it doesn''t create it.', '🤖', 5, 'published', datetime('now', '-14 days')),
        ('Captive vs Third-Party Offshore: The Decision Framework', 'Offshore Operations', 'Neither model is superior. The right choice depends on five factors.', '🏗️', 6, 'published', datetime('now', '-21 days'));

      INSERT INTO whitepapers (title, category, description, icon, pages, access) VALUES
        ('The EMB Framework', 'Framework Reference', 'Complete Engineering Maturity Benchmark reference with all criteria and scoring rubrics.', '📊', 24, 'members'),
        ('AI Readiness for Offshore Teams', 'AI & Developer Tools', 'Navigating Phases 1, 2 and 3 of AI adoption in offshore engineering centres.', '🤖', 18, 'members'),
        ('The Offshore Team Scorecard', 'Tools & Templates', 'Quick self-assessment tool — score your team in under 20 minutes.', '✅', 8, 'public');
    `);
  }

  const settingCount = (db.prepare('SELECT COUNT(*) as c FROM settings').get() as { c: number }).c;
  if (settingCount === 0) {
    db.exec(`
      INSERT INTO settings (key, value) VALUES
        ('site_name', 'The Pivot Model'),
        ('forum_enabled', 'false'),
        ('otp_enabled', 'true'),
        ('corp_email_only', 'true');
    `);
  }
}

// ─── HELPERS ──────────────────────────────────────────────────────────────

export function getSetting(key: string): string | null {
  const db = getDb();
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined;
  return row?.value ?? null;
}

export function setSetting(key: string, value: string): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `).run(key, value);
}

// Default EMB template (pre-populated capabilities for new assessments)
export const EMB_TEMPLATE = [
  // Pivot 1: Operational Excellence
  { pivot_num: 1, pivot_name: 'Operational Excellence', capability: 'Code Quality & Review', l1_criteria: 'Code is functional; basic reviews happen ad-hoc', l2_criteria: 'Consistent PR reviews with quality gates; lint & static analysis in CI', l3_criteria: 'Ownership culture; engineers proactively raise quality standards', sort_order: 1 },
  { pivot_num: 1, pivot_name: 'Operational Excellence', capability: 'Testing Discipline', l1_criteria: 'Manual testing primarily; unit tests sparse', l2_criteria: 'Unit & integration tests standard; coverage tracked', l3_criteria: 'TDD mindset; test coverage > 80%; performance & regression suites', sort_order: 2 },
  { pivot_num: 1, pivot_name: 'Operational Excellence', capability: 'Documentation Standards', l1_criteria: 'Documentation sparse or outdated', l2_criteria: 'APIs and systems documented; runbooks maintained', l3_criteria: 'Living documentation culture; architecture decisions recorded', sort_order: 3 },
  { pivot_num: 1, pivot_name: 'Operational Excellence', capability: 'CI/CD & Build Pipeline', l1_criteria: 'Manual or semi-automated deployments', l2_criteria: 'Automated CI/CD; environments properly separated', l3_criteria: 'Zero-downtime deploys; feature flags; automated rollback', sort_order: 4 },
  { pivot_num: 1, pivot_name: 'Operational Excellence', capability: 'Incident & On-Call Management', l1_criteria: 'Reactive; escalation dependent on single individuals', l2_criteria: 'On-call rotation; post-mortems conducted', l3_criteria: 'Blameless culture; SLOs/SLAs defined and tracked; proactive alerting', sort_order: 5 },
  // Pivot 2: Pace of Product Evolution
  { pivot_num: 2, pivot_name: 'Pace of Product Evolution', capability: 'Sprint Velocity & Predictability', l1_criteria: 'Sprints frequently miss targets; estimation inconsistent', l2_criteria: 'Stable velocity; 80%+ sprint commitments met', l3_criteria: 'Predictable delivery with clear capacity planning; rarely misses', sort_order: 6 },
  { pivot_num: 2, pivot_name: 'Pace of Product Evolution', capability: 'Technical Debt Management', l1_criteria: 'Debt accumulates unchecked; no tracking', l2_criteria: 'Debt tracked and allocated budget in sprints', l3_criteria: 'Proactive refactoring; debt ratio declining; architectural clarity', sort_order: 7 },
  { pivot_num: 2, pivot_name: 'Pace of Product Evolution', capability: 'Feature Delivery Speed', l1_criteria: 'High cycle time; long lead times from idea to production', l2_criteria: 'Reasonable lead times; cycle time tracked and improving', l3_criteria: 'Lean flow; small batch sizes; continuous delivery', sort_order: 8 },
  { pivot_num: 2, pivot_name: 'Pace of Product Evolution', capability: 'Innovation & Continuous Improvement', l1_criteria: 'Reactive; no time for improvement', l2_criteria: 'Regular retrospectives; process improvements implemented', l3_criteria: 'Engineers drive innovation; experimentation encouraged; 20% improvement time', sort_order: 9 },
  // Pivot 3: Collaboration & Alignment
  { pivot_num: 3, pivot_name: 'Collaboration & Alignment', capability: 'Stakeholder Communication', l1_criteria: 'Communication reactive; status updates only when asked', l2_criteria: 'Regular structured updates; blockers surfaced proactively', l3_criteria: 'Engineers communicate business context; trusted partners to onshore', sort_order: 10 },
  { pivot_num: 3, pivot_name: 'Collaboration & Alignment', capability: 'Cross-Team Collaboration', l1_criteria: 'Siloed; minimal coordination outside own team', l2_criteria: 'Regular cross-team sync; dependencies managed', l3_criteria: 'Collaborative problem-solving; shared ownership across teams', sort_order: 11 },
  { pivot_num: 3, pivot_name: 'Collaboration & Alignment', capability: 'Cultural Integration', l1_criteria: 'Cultural gap significant; us-vs-them mentality', l2_criteria: 'Cultural awareness growing; some integration initiatives', l3_criteria: 'Genuinely integrated culture; offshore seen as equal partner', sort_order: 12 },
  { pivot_num: 3, pivot_name: 'Collaboration & Alignment', capability: 'Knowledge Sharing', l1_criteria: 'Knowledge siloed in individuals; no documentation culture', l2_criteria: 'Regular knowledge sharing sessions; wikis maintained', l3_criteria: 'Continuous learning culture; internal talks; mentoring programs', sort_order: 13 },
  // Pivot 4: Business Results
  { pivot_num: 4, pivot_name: 'Business Results', capability: 'Business Impact Awareness', l1_criteria: 'Engineers unaware of business metrics', l2_criteria: 'Team understands product KPIs; can connect work to outcomes', l3_criteria: 'Engineers drive business conversations; suggest product improvements', sort_order: 14 },
  { pivot_num: 4, pivot_name: 'Business Results', capability: 'KRA Achievement', l1_criteria: 'KRAs unclear or unmeasured', l2_criteria: 'KRAs defined per role; tracked quarterly', l3_criteria: 'KRAs tied to business OKRs; self-managed accountability', sort_order: 15 },
  { pivot_num: 4, pivot_name: 'Business Results', capability: 'Customer Orientation', l1_criteria: 'No direct customer interaction or feedback loop', l2_criteria: 'Engineers exposed to customer feedback; user stories understood', l3_criteria: 'Engineers participate in customer calls; empathy drives design', sort_order: 16 },
  { pivot_num: 4, pivot_name: 'Business Results', capability: 'Strategic Contribution', l1_criteria: 'Offshore purely execution; no input to strategy', l2_criteria: 'Offshore contributes to technical roadmap', l3_criteria: 'Offshore drives product innovation; strategic thought partner', sort_order: 17 },
];
