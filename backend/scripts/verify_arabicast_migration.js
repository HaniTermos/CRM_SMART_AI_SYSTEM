/**
 * SmartStore Website Studio (CMS V3) — Arabi Cast Migration Verification Suite
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const db = require('../config/database');
const validator = require('../validators/cmsV3Validator');

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

async function verifyArabiCastMigration() {
  console.log('====================================================================');
  console.log('SmartStore CMS V3 Stage 8D-A Arabi Cast Migration Verification');
  console.log('====================================================================\n');

  try {
    // 1. Feature Flags
    console.log('[CHECK 1/4] Auditing feature flags across all stores...');
    const flagsRes = await db.query(
      `SELECT s.name, s.slug, st.cms_v3_enabled 
       FROM stores s LEFT JOIN cms_v3_sites st ON s.id = st.store_id 
       ORDER BY s.name`
    );

    flagsRes.rows.forEach(r => {
      if (r.slug === 'sunrise-bakery') {
        assert(r.cms_v3_enabled === true, `Sunrise Bakery feature flag is TRUE (active canary).`);
      } else if (r.slug === 'arabicast') {
        assert(r.cms_v3_enabled === false, `Arabi Cast feature flag is FALSE (migrated but not publicly enabled).`);
      } else {
        assert(r.cms_v3_enabled !== true, `Store '${r.name}' feature flag is FALSE/NULL (unmigrated).`);
      }
    });

    // 2. AST Documents Integrity
    console.log('\n[CHECK 2/4] Validating Arabi Cast V3 PageDocuments...');
    const arabiStore = flagsRes.rows.find(r => r.slug === 'arabicast');
    const arabiPages = await db.query(
      `SELECT p.id, p.title, p.slug, p.published_version_id, v.component_tree, v.change_summary
       FROM cms_v3_pages p
       JOIN cms_v3_page_versions v ON p.published_version_id = v.id
       WHERE p.store_id = (SELECT id FROM stores WHERE slug = 'arabicast')
       ORDER BY p.slug`
    );

    assert(arabiPages.rows.length === 3, `Arabi Cast has exactly 3 published candidate pages.`);
    for (const pg of arabiPages.rows) {
      const errors = validator.validatePageDocument(pg.component_tree);
      assert(errors.length === 0, `Page '${pg.slug}' AST is 100% valid.`);
      assert(pg.change_summary.includes('Migrated from legacy page'), `Page '${pg.slug}' has legacy source traceability.`);
    }

    // 3. Multi-Tenant Store Isolation
    console.log('\n[CHECK 3/4] Checking multi-tenant store isolation...');
    const greenBowlV3 = (await db.query(`SELECT COUNT(*)::int as c FROM cms_v3_pages WHERE store_id = (SELECT id FROM stores WHERE slug = 'green-bowl')`)).rows[0].c;
    const pastaParlorV3 = (await db.query(`SELECT COUNT(*)::int as c FROM cms_v3_pages WHERE store_id = (SELECT id FROM stores WHERE slug = 'pasta-parlor')`)).rows[0].c;

    assert(greenBowlV3 === 0, `Green Bowl has 0 V3 pages.`);
    assert(pastaParlorV3 === 0, `Pasta Parlor has 0 V3 pages.`);

    // 4. Commerce & Legacy Table Fingerprints
    console.log('\n[CHECK 4/4] Verifying commerce and legacy table fingerprints...');
    const prodCount = (await db.query(`SELECT COUNT(*)::int as c FROM products`)).rows[0].c;
    const ordCount = (await db.query(`SELECT COUNT(*)::int as c FROM orders`)).rows[0].c;
    const custCount = (await db.query(`SELECT COUNT(*)::int as c FROM customers`)).rows[0].c;
    const resCount = (await db.query(`SELECT COUNT(*)::int as c FROM reservations`)).rows[0].c;
    const invCount = (await db.query(`SELECT COUNT(*)::int as c FROM inventory_adjustments`)).rows[0].c;

    assert(prodCount === 44, `Products count = 44 (0 modified).`);
    assert(ordCount === 80, `Orders count = 80 (0 modified).`);
    assert(custCount === 48, `Customers count = 48 (0 modified).`);
    assert(resCount === 40, `Reservations count = 40 (0 modified).`);
    assert(invCount === 40, `Inventory adjustments count = 40 (0 modified).`);

    console.log('\n====================================================================');
    console.log(`ARABI CAST MIGRATION VERIFICATION SUMMARY: ${passed} Passed, ${failed} Failed.`);
    console.log('====================================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('VERIFICATION ERROR:', err);
    process.exit(1);
  }
}

verifyArabiCastMigration();
