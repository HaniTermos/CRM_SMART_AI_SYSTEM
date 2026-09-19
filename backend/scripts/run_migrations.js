const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const db = require('../config/database');

async function run() {
  const isDryRun = process.argv.includes('--dry-run');
  const isValidate = process.argv.includes('--validate');
  console.log(`[MIGRATE] Migration Engine initialized (Environment: ${process.env.NODE_ENV || 'development'}, Database: ${process.env.DB_NAME || 'smartstore_ai'}, Mode: ${isValidate ? 'VALIDATE (Rollback Transaction)' : (isDryRun ? 'DRY-RUN' : 'APPLY')})...`);

  const migrationsDir = path.join(__dirname, '..', 'migrations');
  
  if (!isDryRun && !isValidate) {
    await db.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        filename TEXT NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
  }

  let appliedSet = new Set();
  try {
    const applied = await db.query('SELECT filename FROM _migrations ORDER BY filename');
    appliedSet = new Set(applied.rows.map((r) => r.filename));
  } catch (err) {
    if (!isDryRun && !isValidate) throw err;
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    console.log('[MIGRATE] No migration files found.');
    process.exit(0);
  }

  if (isValidate) {
    console.log('[MIGRATE VALIDATE] Starting rollback transaction validation...');
    try {
      await db.query('BEGIN');

      for (const file of files) {
        if (appliedSet.has(file)) {
          console.log(`[MIGRATE VALIDATE] Skipping previously recorded migration: ${file}`);
          continue;
        }

        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, 'utf8');

        console.log(`[MIGRATE VALIDATE] Executing migration in transaction: ${file}`);
        await db.query(sql);
      }

      // Assertions on the uncommitted schema
      console.log('[MIGRATE VALIDATE] Verifying uncommitted schema assertions...');

      const checkTables = [
        'ai_store_balances', 'ai_conversations', 'ai_action_plans', 'ai_messages',
        'ai_actions', 'ai_action_execution_logs', 'ai_usage_ledger', 'ai_scheduled_insights',
        'cms_themes', 'cms_section_variants', 'cms_theme_versions', 'cms_store_theme_assignments',
        'user_dashboard_layouts'
      ];

      for (const table of checkTables) {
        const res = await db.query(
          `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1)`,
          [table]
        );
        if (!res.rows[0].exists) throw new Error(`Table '${table}' missing during validation`);
      }

      const themesCount = await db.query(`SELECT COUNT(*)::int AS count FROM cms_themes`);
      if (themesCount.rows[0].count < 25) throw new Error(`Theme seeds < 25 (Found: ${themesCount.rows[0].count})`);

      const variantsCount = await db.query(`SELECT COUNT(*)::int AS count FROM cms_section_variants`);
      if (variantsCount.rows[0].count < 10) throw new Error(`Section variants seeds < 10 (Found: ${variantsCount.rows[0].count})`);

      console.log('[MIGRATE VALIDATE] All schema assertions PASSED cleanly.');

      // Rollback transaction to leave DB clean
      await db.query('ROLLBACK');
      console.log('[MIGRATE VALIDATE] ✓ Rolled back transaction. Database remains unmodified and unpolluted.');
      process.exit(0);
    } catch (err) {
      await db.query('ROLLBACK');
      console.error('[MIGRATE VALIDATE] ✗ Transaction validation FAILED:', err.message);
      process.exit(1);
    }
  }

  let appliedCount = 0;

  for (const file of files) {
    if (appliedSet.has(file)) {
      console.log(`[MIGRATE] Skipping (already applied in _migrations): ${file}`);
      continue;
    }

    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');

    if (isDryRun) {
      console.log(`[MIGRATE DRY-RUN] Would apply unapplied migration: ${file}`);
      appliedCount++;
      continue;
    }

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
      console.error(`[MIGRATE] ✗ Failed applying ${file}:`, err.message);
      process.exit(1);
    }
  }

  if (appliedCount === 0) {
    console.log('[MIGRATE] All migrations already applied and recorded in _migrations.');
  } else {
    console.log(`[MIGRATE] Done. ${isDryRun ? 'Dry run validated' : 'Applied'} ${appliedCount} migration(s).`);
  }

  process.exit(0);
}

run();
