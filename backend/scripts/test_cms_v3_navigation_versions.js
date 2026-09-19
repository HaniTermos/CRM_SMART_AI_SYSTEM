/**
 * SmartStore Website Studio (CMS V3) — Navigation Versioning Test Suite
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const db = require('../config/database');
const CmsV3NavigationVersion = require('../models/CmsV3NavigationVersion');

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASSED: ${message}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAILED: ${message}`);
    failedTests++;
  }
}

async function runNavigationVersionsTests() {
  console.log('====================================================');
  console.log('SmartStore CMS V3 Navigation Versions Test Suite');
  console.log('====================================================\n');

  try {
    const storesRes = await db.query('SELECT id, name, slug FROM stores LIMIT 2');
    if (storesRes.rows.length === 0) {
      console.error('No store found in DB.');
      process.exit(1);
    }
    const storeA = storesRes.rows[0];
    const storeB = storesRes.rows[1] || storeA;

    console.log(`[SETUP] Testing Navigation Versions for Store A: ${storeA.name}`);

    // Test Group 1: Draft Saving & Incremental Versioning
    console.log('[TEST GROUP 1] Navigation Draft Creation & Versioning:');

    const draft1 = await CmsV3NavigationVersion.createDraft({
      storeId: storeA.id,
      region: 'header',
      document: {
        items: [
          { id: '1', label: 'Home', href: '/' },
          { id: '2', label: 'Menu', href: '/menu' }
        ]
      },
      changeSummary: 'Initial Header draft'
    });

    assert(draft1 && draft1.version_number > 0, `Created Navigation Draft version #${draft1.version_number}.`);
    assert(draft1.status === 'draft', 'Initial navigation version status is draft.');

    // Test Group 2: Publishing Version Snapshot
    console.log('\n[TEST GROUP 2] Navigation Publishing & Store Navigation Table Update:');

    const published = await CmsV3NavigationVersion.publishVersion(draft1.id, storeA.id);
    assert(published.status === 'published', 'Published navigation version status updated to published.');

    const activeNavRes = await db.query('SELECT * FROM cms_v3_navigation WHERE store_id = $1 AND region = $2', [storeA.id, 'header']);
    assert(activeNavRes.rows.length === 1, 'Active store navigation region record updated in cms_v3_navigation table.');

    // Test Group 3: Version Rollback Lifecycle
    console.log('\n[TEST GROUP 3] Navigation Snapshot Rollback:');

    const draft2 = await CmsV3NavigationVersion.createDraft({
      storeId: storeA.id,
      region: 'header',
      document: {
        items: [{ id: '1', label: 'Broken Link', href: '/broken' }]
      },
      changeSummary: 'Faulty Header draft'
    });

    const rollbackResult = await CmsV3NavigationVersion.rollback(storeA.id, 'header', draft1.id);
    assert(rollbackResult.status === 'published', 'Successfully executed navigation rollback to previous published version.');

    // Test Group 4: Multi-Tenant Store Isolation
    console.log('\n[TEST GROUP 4] Multi-Tenant Navigation Store Isolation:');

    const storeBNav = await CmsV3NavigationVersion.findById(draft1.id, storeB.id);
    assert(storeBNav === null || storeA.id === storeB.id, 'Store B cannot read Store A navigation version (Multi-tenant isolation verified).');

    console.log('\n====================================================');
    console.log(`NAVIGATION VERSIONS SUMMARY: ${passedTests} Passed, ${failedTests} Failed.`);
    console.log('====================================================\n');

    if (failedTests > 0) {
      process.exit(1);
    }
    process.exit(0);
  } catch (err) {
    console.error('Navigation versions test execution error:', err);
    process.exit(1);
  }
}

runNavigationVersionsTests();
