/**
 * SmartStore Website Studio (CMS V3) — Full Integration & Readiness Test Suite
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const db = require('../config/database');
const { validatePageDocument } = require('../validators/cmsV3Validator');

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

async function runFullReadinessTests() {
  console.log('====================================================');
  console.log('SmartStore CMS V3 Full Product Readiness Test Suite');
  console.log('====================================================\n');

  try {
    // 1. Verify Staging Store & Page Document
    const storeRes = await db.query(`SELECT id FROM stores WHERE slug = 'sunrise-bakery' OR name ILIKE '%sunrise%' LIMIT 1`);
    assert(storeRes.rows.length === 1, 'Staging store "Sunrise Bakery & Café" exists in PostgreSQL.');

    const storeId = storeRes.rows[0].id;

    const pageRes = await db.query(`SELECT id, title, slug, is_published FROM cms_v3_pages WHERE store_id = $1 AND slug = 'home-staging'`, [storeId]);
    assert(pageRes.rows.length === 1, 'Staging page "Home Staging" exists in cms_v3_pages.');

    const versionRes = await db.query(`SELECT version_number, component_tree FROM cms_v3_page_versions WHERE store_id = $1 AND page_id = $2`, [storeId, pageRes.rows[0].id]);
    assert(versionRes.rows.length === 1, 'Published version document exists in cms_v3_page_versions.');

    const componentTree = versionRes.rows[0].component_tree;
    const errors = validatePageDocument(componentTree);
    if (errors.length > 0) {
      console.log('Validation errors:', JSON.stringify(errors, null, 2));
    }
    assert(errors.filter(e => e.severity === 'error').length === 0, 'Staging PageDocument containing all 34 normalized components passes schema validation.');

    console.log('\n====================================================');
    console.log(`FULL READINESS SUMMARY: ${passedTests} Passed, ${failedTests} Failed.`);
    console.log('====================================================\n');

    if (failedTests > 0) {
      process.exit(1);
    }
    process.exit(0);
  } catch (err) {
    console.error('Readiness test error:', err);
    process.exit(1);
  }
}

runFullReadinessTests();
