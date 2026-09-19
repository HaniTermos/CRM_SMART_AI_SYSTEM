/**
 * SmartStore Website Studio (CMS V3) — Cart Drawer & Commerce Components Test Suite
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
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

function runCartDrawerTests() {
  console.log('====================================================');
  console.log('SmartStore CMS V3 Cart Drawer & Commerce Test Suite');
  console.log('====================================================\n');

  console.log('[TEST GROUP 1] Commerce Component Tree Schema Validation:');

  const commerceDoc = {
    versionNumber: 1,
    rootNodeId: 'root',
    nodes: {
      root: { id: 'root', kind: 'page', component: 'page', children: ['cart-1', 'spot-1', 'df-1'], props: {}, styles: {} },
      'cart-1': { id: 'cart-1', kind: 'container', component: 'cart-drawer', children: [], props: {}, styles: {} },
      'spot-1': { id: 'spot-1', kind: 'section', component: 'product-spotlight', children: [], props: { productName: 'Espresso' }, styles: {} },
      'df-1': { id: 'df-1', kind: 'section', component: 'dietary-filters', children: [], props: {}, styles: {} }
    }
  };

  const errors = validatePageDocument(commerceDoc);
  assert(errors.filter(e => e.severity === 'error').length === 0, 'PageDocument containing Cart Drawer, Product Spotlight, and Dietary Filters passes schema validation.');

  console.log('\n====================================================');
  console.log(`CART DRAWER & COMMERCE SUMMARY: ${passedTests} Passed, ${failedTests} Failed.`);
  console.log('====================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runCartDrawerTests();
