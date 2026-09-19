/**
 * SmartStore Website Studio (CMS V3) — Stage 8C-C Route & Rollback Verification
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const db = require('../config/database');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASSED: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAILED: ${message}`);
    failed++;
  }
}

async function verifyActivationRoutes() {
  console.log('====================================================');
  console.log('SmartStore CMS V3 Stage 8C-C Route Verification');
  console.log('====================================================\n');

  try {
    const storeRes = await db.query(`SELECT id, slug FROM stores WHERE slug = 'sunrise-bakery'`);
    const storeId = storeRes.rows[0].id;

    // 1. Check feature flag in DB
    const siteRes = await db.query(`SELECT cms_v3_enabled FROM cms_v3_sites WHERE store_id = $1`, [storeId]);
    assert(siteRes.rows[0].cms_v3_enabled === true, 'Sunrise Bakery feature flag is TRUE.');

    // 2. Query V3 page & published version for home
    const homePage = await db.query(`SELECT * FROM cms_v3_pages WHERE store_id = $1 AND slug = 'home'`, [storeId]);
    assert(homePage.rows.length === 1 && homePage.rows[0].is_published === true, 'Sunrise Bakery home page is published candidate.');

    const verRes = await db.query(`SELECT * FROM cms_v3_page_versions WHERE id = $1`, [homePage.rows[0].published_version_id]);
    assert(verRes.rows.length === 1 && verRes.rows[0].component_tree.rootNodeId === 'root', 'Published version AST retrieved.');

    // 3. Multi-tenant store isolation check
    const otherStore = await db.query(`SELECT id, slug FROM stores WHERE slug != 'sunrise-bakery' LIMIT 1`);
    if (otherStore.rows.length > 0) {
      const otherSite = await db.query(`SELECT cms_v3_enabled FROM cms_v3_sites WHERE store_id = $1`, [otherStore.rows[0].id]);
      const otherFlag = otherSite.rows.length > 0 ? otherSite.rows[0].cms_v3_enabled : false;
      assert(otherFlag === false, `Store '${otherStore.rows[0].slug}' remains isolated with cms_v3_enabled = FALSE.`);
    }

    console.log('\n====================================================');
    console.log(`ROUTE VERIFICATION SUMMARY: ${passed} Passed, ${failed} Failed.`);
    console.log('====================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('ROUTE VERIFICATION ERROR:', err);
    process.exit(1);
  }
}

verifyActivationRoutes();
