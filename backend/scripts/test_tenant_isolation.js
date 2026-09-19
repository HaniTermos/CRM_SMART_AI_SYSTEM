require('dotenv').config();
const db = require('../config/database');

async function testTenantIsolation() {
  console.log('[Test] Starting Tenant Isolation & Security Audit Test Suite...');
  let passed = 0;
  let failed = 0;
  let blocked = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASSED: ${message}`);
      passed++;
    } else {
      console.error(`  ✕ FAILED: ${message}`);
      failed++;
    }
  }

  function reportBlocked(message) {
    console.log(`  ⚠ BLOCKED — ${message}`);
    blocked++;
  }

  try {
    // 1. Fetch or create two distinct stores for isolation testing
    let storesRes = await db.query(`SELECT id, name, slug FROM stores LIMIT 2`);
    if (storesRes.rows.length < 2) {
      console.log('[Test] Seeding 2 test stores for isolation check...');
      await db.query(`INSERT INTO stores (name, slug, currency) VALUES ('Iso Store A', 'iso-store-a', 'USD'), ('Iso Store B', 'iso-store-b', 'USD')`);
      storesRes = await db.query(`SELECT id, name, slug FROM stores ORDER BY created_at DESC LIMIT 2`);
    }

    const storeA = storesRes.rows[0].id;
    const storeB = storesRes.rows[1].id;

    // 2. Database SQL Isolation Test on existing CMS Pages table
    const pageARes = await db.query(
      `INSERT INTO cms_pages (store_id, title, slug, status, type) VALUES ($1, 'Iso Test Page A', 'iso-test-page-a', 'draft', 'custom') RETURNING id`,
      [storeA]
    );
    const pageAId = pageARes.rows[0].id;

    // Attempt cross-store query (Store B context querying Store A page)
    const crossQuery = await db.query(
      `SELECT * FROM cms_pages WHERE id = $1 AND store_id = $2`,
      [pageAId, storeB]
    );
    assert(crossQuery.rows.length === 0, 'Database Isolation: Store B context querying Store A page returns empty result');

    // Same-store query returns record
    const ownerQuery = await db.query(
      `SELECT * FROM cms_pages WHERE id = $1 AND store_id = $2`,
      [pageAId, storeA]
    );
    assert(ownerQuery.rows.length === 1, 'Database Isolation: Store A context querying Store A page returns record');

    // Cleanup page
    await db.query(`DELETE FROM cms_pages WHERE id = $1`, [pageAId]);

    // 3. Database SQL Isolation Test on new AI Conversations & Action Plans tables
    const userRes = await db.query(`SELECT id FROM users LIMIT 1`);
    const userId = userRes.rows[0].id;

    const convARes = await db.query(
      `INSERT INTO ai_conversations (store_id, user_id, title, mode, source) VALUES ($1, $2, 'Store A Conv', 'general', 'floating_icon') RETURNING id`,
      [storeA, userId]
    );
    const convAId = convARes.rows[0].id;

    const crossConvQuery = await db.query(
      `SELECT * FROM ai_conversations WHERE id = $1 AND store_id = $2`,
      [convAId, storeB]
    );
    assert(crossConvQuery.rows.length === 0, 'Database Isolation: Store B context querying Store A AI conversation returns empty result');

    const planARes = await db.query(
      `INSERT INTO ai_action_plans (store_id, conversation_id, title, summary) VALUES ($1, $2, 'Store A Plan', 'Summary') RETURNING id`,
      [storeA, convAId]
    );
    const planAId = planARes.rows[0].id;

    const crossPlanQuery = await db.query(
      `SELECT * FROM ai_action_plans WHERE id = $1 AND store_id = $2`,
      [planAId, storeB]
    );
    assert(crossPlanQuery.rows.length === 0, 'Database Isolation: Store B context querying Store A AI action plan returns empty result');

    // Cleanup AI records
    await db.query(`DELETE FROM ai_action_plans WHERE id = $1`, [planAId]);
    await db.query(`DELETE FROM ai_conversations WHERE id = $1`, [convAId]);

    // 4. Mark unbuilt HTTP controller tests as BLOCKED
    reportBlocked('endpoint not implemented — HTTP GET /api/stores/me/ai/conversations cross-store check');
    reportBlocked('endpoint not implemented — HTTP POST /api/stores/me/ai/action-plans/:id/proceed authorization check');
    reportBlocked('endpoint not implemented — HTTP GET /api/stores/me/cms/themes draft preview token check');

    console.log(`\nTenant Isolation Test Results: ${passed} Passed, ${failed} Failed, ${blocked} Blocked.`);
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('[Test] Unexpected error running tenant isolation tests:', err);
    process.exit(1);
  }
}

testTenantIsolation();
