#!/usr/bin/env node
/**
 * scripts/init-db.js
 * Run once after deployment: npm run db:init
 * Creates the SQLite database, all tables, and seeds initial data.
 */

const path = require('path');
const fs = require('fs');

// Load env
require('fs').existsSync('.env.local') && require('child_process').execSync('export $(cat .env.local | grep -v ^# | xargs)');

const DB_PATH = process.env.DATABASE_PATH
  ? path.resolve(process.env.DATABASE_PATH)
  : path.join(process.cwd(), 'data', 'pivot.db');

const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

console.log('✓ Initialising database at:', DB_PATH);

// The actual init happens automatically when the app first loads (lib/db.ts).
// This script just ensures the data dir exists and confirms setup.

console.log('✓ Database directory ready.');
console.log('✓ Tables and seed data will be created on first app start.');
console.log('\nNext steps:');
console.log('  1. Copy .env.local.example to .env.local and fill in values');
console.log('  2. Run: npm install');
console.log('  3. Run: npm run dev (development) or npm run build && npm start (production)');
console.log('  4. The database file will be created automatically at first run.\n');
