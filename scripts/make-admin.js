/**
 * scripts/make-admin.js
 * Grant admin rights to an email address, creating the user if it doesn't exist:
 *   node scripts/make-admin.js you@example.com
 *
 * Reads DATABASE_URL from .env.local, so it targets whichever database that
 * file points at — local by default.
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

/** Minimal .env.local reader — dotenv isn't a dependency of this project. */
function loadEnv(file) {
  const full = path.join(__dirname, '..', file);
  if (!fs.existsSync(full)) return;
  for (const line of fs.readFileSync(full, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!m) continue;
    const value = m[2].replace(/^["']|["']$/g, '');
    if (!(m[1] in process.env)) process.env[m[1]] = value;
  }
}
loadEnv('.env.local');

async function main() {
  const email = (process.argv[2] || '').trim().toLowerCase();
  if (!email || !email.includes('@')) {
    console.error('Usage: node scripts/make-admin.js you@example.com');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  });

  const existing = await pool.query('SELECT id, name, is_admin FROM users WHERE lower(email) = $1', [email]);

  if (existing.rows.length === 0) {
    const name = email.split('@')[0];
    await pool.query(
      "INSERT INTO users (name, email, status, is_admin) VALUES ($1, $2, 'active', TRUE)",
      [name, email]
    );
    console.log(`Created ${email} as an admin.`);
  } else if (existing.rows[0].is_admin) {
    console.log(`${email} is already an admin.`);
  } else {
    await pool.query('UPDATE users SET is_admin = TRUE, status = $2 WHERE lower(email) = $1', [email, 'active']);
    console.log(`${email} is now an admin.`);
  }

  const { rows } = await pool.query('SELECT email, is_admin FROM users ORDER BY is_admin DESC, email');
  console.log('\nUsers:');
  rows.forEach(r => console.log(`  ${r.is_admin ? 'admin ' : '      '} ${r.email}`));

  await pool.end();
}

main().catch(err => {
  console.error(err.message || err);
  process.exit(1);
});
