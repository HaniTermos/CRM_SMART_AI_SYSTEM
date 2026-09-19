/**
 * SmartStore Website Studio (CMS V3) — Store-Safe Navigation Validation Test Suite
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const db = require('../config/database');
const CmsV3NavigationValidator = require('../validators/cmsV3NavigationValidator');

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

async function runNavigationValidationTests() {
  console.log('====================================================');
  console.log('SmartStore CMS V3 Navigation Validation Test Suite');
  console.log('====================================================\n');

  try {
    const storesRes = await db.query('SELECT id, name FROM stores LIMIT 2');
    if (storesRes.rows.length === 0) {
      console.error('No store found in DB.');
      process.exit(1);
    }
    const storeA = storesRes.rows[0];

    console.log('[TEST GROUP 1] Protocol Safety & Unsafe Link Rejection:');

    const unsafeTree = [
      { id: '1', label: 'XSS Attack', href: 'javascript:alert(1)' },
      { id: '2', label: 'Data Payload', href: 'data:text/html,hack' }
    ];

    const unsafeResult = await CmsV3NavigationValidator.validateNavigationTree(unsafeTree, storeA.id);
    assert(!unsafeResult.isValid, 'Navigation validator rejects javascript: and data: unsafe protocols.');
    assert(unsafeResult.errors.some(e => e.code === 'UNSAFE_PROTOCOL'), 'Error code UNSAFE_PROTOCOL returned for malicious links.');

    console.log('\n[TEST GROUP 2] Dropdown Depth Limits & Circular Loop Safeguards:');

    const excessiveDepthTree = [
      {
        id: '1',
        label: 'Level 1',
        children: [
          {
            id: '2',
            label: 'Level 2',
            children: [
              {
                id: '3',
                label: 'Level 3',
                children: [
                  { id: '4', label: 'Level 4 (Excessive Depth)' }
                ]
              }
            ]
          }
        ]
      }
    ];

    const depthResult = await CmsV3NavigationValidator.validateNavigationTree(excessiveDepthTree, storeA.id);
    assert(!depthResult.isValid, 'Navigation validator rejects dropdown depth exceeding 3 levels.');
    assert(depthResult.errors.some(e => e.code === 'EXCESSIVE_DEPTH'), 'Error code EXCESSIVE_DEPTH returned for deep dropdown trees.');

    console.log('\n[TEST GROUP 3] Valid Navigation Tree Acceptance:');

    const validTree = [
      { id: '1', label: 'Home', href: '/' },
      { id: '2', label: 'Menu', href: '/menu' },
      { id: '3', label: 'Call Us', href: 'tel:+15550192834' }
    ];

    const validResult = await CmsV3NavigationValidator.validateNavigationTree(validTree, storeA.id);
    assert(validResult.isValid, 'Valid navigation tree passes validator with 0 errors.');

    console.log('\n====================================================');
    console.log(`NAVIGATION VALIDATION SUMMARY: ${passedTests} Passed, ${failedTests} Failed.`);
    console.log('====================================================\n');

    if (failedTests > 0) {
      process.exit(1);
    }
    process.exit(0);
  } catch (err) {
    console.error('Navigation validation test error:', err);
    process.exit(1);
  }
}

runNavigationValidationTests();
