require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const db = require('../config/database');
const CmsThemeAssignment = require('../models/CmsThemeAssignment');

async function testThemeAssignment() {
  console.log('[Test] Starting Theme Assignment & Published Constraint Test Suite...');
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

    // 1. Create two versions
    const v1 = await CmsThemeAssignment.createVersion({ store_id, settings_snapshot: { name: 'V1' } });
    const v2 = await CmsThemeAssignment.createVersion({ store_id, settings_snapshot: { name: 'V2' } });

    assert(v1.version < v2.version, 'Version numbers increment monotonically');

    // 2. Publish V1
    const pub1 = await CmsThemeAssignment.publishVersion(store_id, v1.id);
    assert(pub1.status === 'published', 'Published Version 1');

    // 3. Publish V2 (Replaces V1 as published theme)
    const pub2 = await CmsThemeAssignment.publishVersion(store_id, v2.id);
    assert(pub2.status === 'published', 'Published Version 2');

    // Verify V1 is now archived
    const checkV1 = await db.query(`SELECT status FROM cms_theme_versions WHERE id = $1`, [v1.id]);
    assert(checkV1.rows[0].status === 'archived', 'Version 1 automatically archived when Version 2 published');

    // Verify only 1 published theme exists for store
    const countPub = await db.query(`SELECT COUNT(*)::int AS count FROM cms_theme_versions WHERE store_id = $1 AND status = 'published'`, [store_id]);
    assert(countPub.rows[0].count === 1, 'Exactly 1 published theme version exists for store');

    // Cleanup
    await db.query(`DELETE FROM cms_store_theme_assignments WHERE store_id = $1`, [store_id]);
    await db.query(`DELETE FROM cms_theme_versions WHERE store_id = $1 AND version IN ($2, $3)`, [store_id, v1.version, v2.version]);

    console.log(`\nTheme Assignment Tests: ${passed} Passed, ${failed} Failed.`);
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('[Test] Unexpected error in Theme Assignment test:', err);
    process.exit(1);
  }
}

testThemeAssignment();
