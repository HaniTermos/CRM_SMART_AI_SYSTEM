require('dotenv').config();
const db = require('../config/database');

async function audit() {
  console.log('========================================================');
  console.log('MIGRATION 010 COMPATIBILITY & CONFLICT AUDIT');
  console.log('========================================================\n');

  // 1. Migration History
  console.log('--- 1. MIGRATION HISTORY ---');
  const migrations = await db.query('SELECT id, filename, applied_at FROM _migrations ORDER BY filename');
  migrations.rows.forEach(m => console.log(`  [${m.id}] ${m.filename} — ${m.applied_at}`));

  // 2. All Public Tables
  console.log('\n--- 2. ALL PUBLIC TABLES ---');
  const tables = await db.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
  );
  tables.rows.forEach(r => console.log('  ' + r.table_name));

  // 3. Check for duplicate/conflicting table names
  console.log('\n--- 3. PHASE 2 TABLE CONFLICT CHECK ---');
  const phase2Tables = ['purchase_orders', 'growth_action_logs'];
  for (const tbl of phase2Tables) {
    const exists = tables.rows.find(r => r.table_name === tbl);
    console.log(`  ${tbl}: ${exists ? 'EXISTS in DB' : 'MISSING!'}`);
  }

  // 4. Check existing tasks, email_campaigns, shifts, products tables
  console.log('\n--- 4. EXISTING TABLES USED BY DISPATCHER ---');
  const dispatcherTables = ['tasks', 'email_campaigns', 'shifts', 'products', 'user_roles'];
  for (const tbl of dispatcherTables) {
    const exists = tables.rows.find(r => r.table_name === tbl);
    console.log(`  ${tbl}: ${exists ? 'EXISTS' : '*** NOT FOUND ***'}`);
    if (exists) {
      const cols = await db.query(
        "SELECT column_name, data_type, udt_name, is_nullable, column_default FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1 ORDER BY ordinal_position",
        [tbl]
      );
      cols.rows.forEach(c => {
        console.log(`    ${c.column_name} — ${c.udt_name}${c.column_default ? ' DEFAULT ' + c.column_default.substring(0, 40) : ''}`);
      });
    }
  }

  // 5. purchase_orders schema details
  console.log('\n--- 5. PURCHASE_ORDERS SCHEMA ---');
  const poCols = await db.query(
    "SELECT column_name, data_type, udt_name, column_default FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'purchase_orders' ORDER BY ordinal_position"
  );
  poCols.rows.forEach(c => {
    console.log(`  ${c.column_name} — ${c.udt_name}${c.column_default ? ' DEFAULT ' + c.column_default.substring(0, 40) : ''}`);
  });

  // 6. growth_action_logs schema details
  console.log('\n--- 6. GROWTH_ACTION_LOGS SCHEMA ---');
  const galCols = await db.query(
    "SELECT column_name, data_type, udt_name, column_default FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'growth_action_logs' ORDER BY ordinal_position"
  );
  galCols.rows.forEach(c => {
    console.log(`  ${c.column_name} — ${c.udt_name}${c.column_default ? ' DEFAULT ' + c.column_default.substring(0, 40) : ''}`);
  });

  // 7. Foreign key types audit
  console.log('\n--- 7. FOREIGN KEY TYPES AUDIT ---');
  const fkQuery = await db.query(`
    SELECT
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name IN ('purchase_orders', 'growth_action_logs', 'pulse_recommendations', 'daily_micro_pulses')
    ORDER BY tc.table_name, kcu.column_name
  `);
  fkQuery.rows.forEach(fk => {
    console.log(`  ${fk.table_name}.${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
  });

  // 8. pulse_recommendations status constraint
  console.log('\n--- 8. PULSE_RECOMMENDATIONS CHECK CONSTRAINTS ---');
  const checks = await db.query(`
    SELECT conname, pg_get_constraintdef(oid) as definition
    FROM pg_constraint
    WHERE conrelid = 'public.pulse_recommendations'::regclass AND contype = 'c'
  `);
  checks.rows.forEach(c => console.log(`  ${c.conname}: ${c.definition}`));

  // 9. pulse_recommendations executed_at / execution_result columns
  console.log('\n--- 9. PULSE_RECOMMENDATIONS EXECUTION COLUMNS ---');
  const prExecCols = await db.query(
    "SELECT column_name, udt_name, is_nullable FROM information_schema.columns WHERE table_name = 'pulse_recommendations' AND column_name IN ('executed_at', 'execution_result', 'status')"
  );
  prExecCols.rows.forEach(c => console.log(`  ${c.column_name} — ${c.udt_name} (nullable: ${c.is_nullable})`));

  // 10. Idempotent rerun test
  console.log('\n--- 10. IDEMPOTENT RERUN TEST ---');
  try {
    const migSql = require('fs').readFileSync(require('path').join(__dirname, '..', 'migrations', '010_revenue_growth_engine_phase2.sql'), 'utf8');
    await db.query(migSql);
    console.log('  ✅ Migration 010 re-executed without errors (idempotent)');
  } catch (err) {
    console.log(`  ❌ Migration 010 rerun FAILED: ${err.message}`);
  }

  console.log('\n========================================================');
  console.log('AUDIT COMPLETE');
  console.log('========================================================');
  process.exit(0);
}

audit().catch(err => { console.error('Audit error:', err); process.exit(1); });
