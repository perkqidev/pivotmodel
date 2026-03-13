/**
 * scripts/init-db.js
 * Run once after setting up your PostgreSQL database:
 *   node scripts/init-db.js
 *
 * Requires DATABASE_URL in .env.local (loaded via --env-file or dotenv).
 */

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined });
  console.log('Connected. Running schema...');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
      company TEXT, role TEXT, industry TEXT, team_size TEXT, linkedin TEXT, bio TEXT,
      status TEXT NOT NULL DEFAULT 'active', is_admin BOOLEAN NOT NULL DEFAULT FALSE,
      joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), last_login TIMESTAMPTZ
    );
    CREATE TABLE IF NOT EXISTS otp_codes (
      id SERIAL PRIMARY KEY, email TEXT NOT NULL, code TEXT NOT NULL,
      purpose TEXT NOT NULL DEFAULT 'login', expires_at TIMESTAMPTZ NOT NULL,
      used BOOLEAN NOT NULL DEFAULT FALSE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS leads (
      id SERIAL PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL, company TEXT NOT NULL,
      role TEXT, industry TEXT, linkedin TEXT, team_size TEXT, offshore_model TEXT,
      maturity_level TEXT, current_operation TEXT, challenges TEXT, expectations TEXT,
      service TEXT, preferred_contact TEXT, timezone TEXT, availability TEXT, timeline TEXT,
      how_heard TEXT, extra_notes TEXT, status TEXT NOT NULL DEFAULT 'new', source TEXT,
      submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS emb_assessments (
      id SERIAL PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id),
      team_name TEXT NOT NULL DEFAULT 'My Team', assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,
      notes TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS emb_rows (
      id SERIAL PRIMARY KEY, assessment_id INTEGER NOT NULL REFERENCES emb_assessments(id) ON DELETE CASCADE,
      pivot_num INTEGER NOT NULL, pivot_name TEXT NOT NULL, capability TEXT NOT NULL,
      l1_criteria TEXT, l2_criteria TEXT, l3_criteria TEXT, current_level TEXT DEFAULT 'L1',
      score INTEGER DEFAULT 1, evidence TEXT, row_notes TEXT, sort_order INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS blog_posts (
      id SERIAL PRIMARY KEY, title TEXT NOT NULL, category TEXT, excerpt TEXT, body TEXT,
      emoji TEXT DEFAULT '📝', read_time INTEGER DEFAULT 4, status TEXT NOT NULL DEFAULT 'draft',
      author_name TEXT DEFAULT 'The Pivot Model', published_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS whitepapers (
      id SERIAL PRIMARY KEY, title TEXT NOT NULL, category TEXT, description TEXT,
      icon TEXT DEFAULT '📄', pages INTEGER DEFAULT 1, access TEXT NOT NULL DEFAULT 'members',
      file_url TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY, value TEXT, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  // Seed blog posts
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
        ('The EMB Framework','Framework Reference','Complete EMB reference with all criteria.','📊',24,'members'),
        ('AI Readiness for Offshore Teams','AI & Developer Tools','Phases 1-3 of AI adoption.','🤖',18,'members'),
        ('The Offshore Team Scorecard','Tools & Templates','Score your team in 20 minutes.','✅',8,'public')
    `);
    console.log('Seeded blog posts and whitepapers.');
  }

  // Seed settings
  const { rows: sr } = await pool.query('SELECT COUNT(*) AS c FROM settings');
  if (parseInt(sr[0].c) === 0) {
    await pool.query(`
      INSERT INTO settings (key, value) VALUES
        ('site_name','The Pivot Model'),('forum_enabled','false'),
        ('otp_enabled','true'),('corp_email_only','true')
    `);
    console.log('Seeded settings.');
  }

  console.log('✅ Schema ready.');
  await pool.end();
}

main().catch(e => { console.error(e); process.exit(1); });
