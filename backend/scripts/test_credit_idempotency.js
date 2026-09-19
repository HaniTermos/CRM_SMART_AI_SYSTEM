require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const db = require('../config/database');
const AiUsage = require('../models/AiUsage');

async function testCreditIdempotency() {
  console.log('[Test] Starting Credit & Token Ledger Idempotency Test Suite...');
  let passed = 0;
  let failed = 0;

  function assert(cond, msg) {
    if (cond) {
      console.log(`  ✓ ${msg}`);
      passed++;
    } else {
      console.error(`  ✕ FAIL: ${msg}`);
      failed++;
    }
  }

  try {
    const storeRes = await db.query(`SELECT id FROM stores LIMIT 1`);
    const store_id = storeRes.rows[0].id;
    const testKey = `test_idempotency_${Date.now()}`;

    // 1. Initial Credit Recording
    const record1 = await AiUsage.recordUsage({
      store_id,
      feature: 'chat',
      input_tokens: 100,
      output_tokens: 200,
      credits_used: 1.50,
      idempotency_key: testKey
    });

    assert(record1 && record1.id, 'Recorded initial AI usage ledger entry');

    // 2. Duplicate Recording with same idempotency key (Must return original record without duplicate insert)
    const record2 = await AiUsage.recordUsage({
      store_id,
      feature: 'chat',
      input_tokens: 100,
      output_tokens: 200,
      credits_used: 1.50,
      idempotency_key: testKey
    });

    assert(record2 && record2.id === record1.id, 'Duplicate call returned existing record (Idempotency enforced)');

    // Verify database row count for key is exactly 1
    const countRes = await db.query(`SELECT COUNT(*)::int AS count FROM ai_usage_ledger WHERE store_id = $1 AND idempotency_key = $2`, [store_id, testKey]);
    assert(countRes.rows[0].count === 1, 'Exactly 1 ledger record exists for idempotency key');

    // Cleanup
    await db.query(`DELETE FROM ai_usage_ledger WHERE idempotency_key = $1`, [testKey]);

    console.log(`\nCredit Idempotency Tests: ${passed} Passed, ${failed} Failed.`);
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('[Test] Unexpected error in Credit Idempotency test:', err);
    process.exit(1);
  }
}

testCreditIdempotency();
