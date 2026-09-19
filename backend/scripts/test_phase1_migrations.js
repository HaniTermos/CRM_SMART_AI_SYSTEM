require('dotenv').config();
const db = require('../config/database');

async function testPhase1Migrations() {
  console.log('[Test] Starting Phase 1 Migration Verification Test Suite...');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ ${message}`);
      passed++;
    } else {
      console.error(`  ✕ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Verify AI Tables
    const aiTables = [
      'ai_store_balances',
      'ai_conversations',
      'ai_action_plans',
      'ai_messages',
      'ai_actions',
      'ai_action_execution_logs',
      'ai_usage_ledger',
      'ai_scheduled_insights',
    ];
    for (const table of aiTables) {
      const res = await db.query(
        `SELECT EXISTS (
           SELECT FROM information_schema.tables 
           WHERE table_schema = 'public' AND table_name = $1
         )`,
        [table]
      );
      assert(res.rows[0].exists, `Table '${table}' exists in database`);
    }

    // 2. Verify CMS Theme Tables
    const cmsTables = [
      'cms_themes',
      'cms_section_variants',
      'cms_theme_versions',
      'cms_store_theme_assignments',
      'user_dashboard_layouts',
    ];
    for (const table of cmsTables) {
      const res = await db.query(
        `SELECT EXISTS (
           SELECT FROM information_schema.tables 
           WHERE table_schema = 'public' AND table_name = $1
         )`,
        [table]
      );
      assert(res.rows[0].exists, `Table '${table}' exists in database`);
    }

    // 3. Verify Theme Seed Count (>= 25)
    const themesRes = await db.query(`SELECT COUNT(*)::int AS count FROM cms_themes`);
    assert(themesRes.rows[0].count >= 25, `Seeded at least 25 Theme Category Templates (Found: ${themesRes.rows[0].count})`);

    // 4. Verify Section Variant Registry Seeds (>= 10)
    const variantsRes = await db.query(`SELECT COUNT(*)::int AS count FROM cms_section_variants`);
    assert(variantsRes.rows[0].count >= 10, `Seeded Section Variants Catalog (Found: ${variantsRes.rows[0].count})`);

    // 5. Test Action Plan Store-Scoped Idempotency Constraint
    const storeRes = await db.query(`SELECT id FROM stores LIMIT 1`);
    if (storeRes.rows.length > 0) {
      const storeId = storeRes.rows[0].id;
      const idempotencyKey = `test_key_${Date.now()}`;

      // First insert should succeed
      await db.query(
        `INSERT INTO ai_action_plans (store_id, title, summary, idempotency_key) VALUES ($1, 'Test Plan', 'Summary', $2)`,
        [storeId, idempotencyKey]
      );

      // Duplicate insert for same store must fail on unique constraint
      let duplicateFailed = false;
      try {
        await db.query(
          `INSERT INTO ai_action_plans (store_id, title, summary, idempotency_key) VALUES ($1, 'Test Plan 2', 'Summary', $2)`,
          [storeId, idempotencyKey]
        );
      } catch (err) {
        duplicateFailed = err.code === '23505'; // Unique violation
      }
      assert(duplicateFailed, 'Action Plan store-scoped idempotency constraint enforces uniqueness');

      // Cleanup test plan
      await db.query(`DELETE FROM ai_action_plans WHERE idempotency_key = $1`, [idempotencyKey]);
    }

    // 6. Test Credit Usage Ledger Idempotency
    if (storeRes.rows.length > 0) {
      const storeId = storeRes.rows[0].id;
      const usageKey = `usage_key_${Date.now()}`;

      await db.query(
        `INSERT INTO ai_usage_ledger (store_id, model, feature, input_tokens, output_tokens, total_tokens, credits_used, idempotency_key)
         VALUES ($1, 'gemini-3.6-flash', 'chat', 10, 20, 30, 1.5, $2)`,
        [storeId, usageKey]
      );

      let usageDupFailed = false;
      try {
        await db.query(
          `INSERT INTO ai_usage_ledger (store_id, model, feature, input_tokens, output_tokens, total_tokens, credits_used, idempotency_key)
           VALUES ($1, 'gemini-3.6-flash', 'chat', 10, 20, 30, 1.5, $2)`,
          [storeId, usageKey]
        );
      } catch (err) {
        usageDupFailed = err.code === '23505';
      }
      assert(usageDupFailed, 'Credit Usage Ledger idempotency constraint enforces request uniqueness');

      await db.query(`DELETE FROM ai_usage_ledger WHERE idempotency_key = $1`, [usageKey]);
    }

    // 7. Test Published Theme Constraint (Max 1 published version per store)
    if (storeRes.rows.length > 0) {
      const storeId = storeRes.rows[0].id;
      const v1Res = await db.query(
        `INSERT INTO cms_theme_versions (store_id, version, status, settings_snapshot) VALUES ($1, 99991, 'published', '{}') RETURNING id`,
        [storeId]
      );

      let pubThemeDupFailed = false;
      try {
        await db.query(
          `INSERT INTO cms_theme_versions (store_id, version, status, settings_snapshot) VALUES ($1, 99992, 'published', '{}')`,
          [storeId]
        );
      } catch (err) {
        pubThemeDupFailed = err.code === '23505';
      }
      assert(pubThemeDupFailed, 'Partial index idx_one_published_theme_per_store limits published themes to 1 per store');

      await db.query(`DELETE FROM cms_theme_versions WHERE store_id = $1 AND version IN (99991, 99992)`, [storeId]);
    }

    console.log(`\nPhase 1 Migration Tests: ${passed} Passed, ${failed} Failed.`);
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('[Test] Unexpected error running migration tests:', err);
    process.exit(1);
  }
}

testPhase1Migrations();
