const fs = require('fs');
const path = require('path');
const db = require('../config/database');

async function run() {
  const migrationsDir = path.join(__dirname, '..', 'migrations');
  await db.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      filename TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  const applied = await db.query('SELECT filename FROM _migrations ORDER BY filename');
  const appliedSet = new Set(applied.rows.map((r) => r.filename));
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    console.log('[MIGRATE] No migration files found.');
    process.exit(0);
  }

  let appliedCount = 0;

  for (const file of files) {
    if (appliedSet.has(file)) {
      console.log(`[MIGRATE] Skipping (already applied): ${file}`);
      continue;
    }

    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');

    console.log(`[MIGRATE] Applying: ${file}`);
    try {
      await db.query('BEGIN');
      await db.query(sql);
      await db.query('INSERT INTO _migrations (filename) VALUES ($1)', [file]);
      await db.query('COMMIT');
      console.log(`[MIGRATE] ✓ Applied: ${file}`);
      appliedCount++;
    } catch (err) {
      await db.query('ROLLBACK');
      console.error(`[MIGRATE] ✗ Failed: ${file}`);
      console.error(err.message);
      process.exit(1);
    }
  }

  if (appliedCount === 0) {
    console.log('[MIGRATE] All migrations already applied.');
  } else {
    console.log(`[MIGRATE] Done. Applied ${appliedCount} migration(s).`);
  }

  process.exit(0);
}

run();
