/**
 * SmartStore Website Studio (CMS V3) — Marketing Components Test Suite
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

function runMarketingTests() {
  console.log('====================================================');
  console.log('SmartStore CMS V3 Marketing Components Test Suite');
  console.log('====================================================\n');

  console.log('[TEST GROUP 1] Countdown & Review Carousel Schema Assertions:');

  const mktDoc = {
    versionNumber: 1,
    rootNodeId: 'root',
    nodes: {
      root: { id: 'root', kind: 'page', component: 'page', children: ['cd-1', 'rev-1', 'nl-1'], props: {}, styles: {} },
      'cd-1': { id: 'cd-1', kind: 'section', component: 'countdown', children: [], props: { targetDate: '2026-12-31T23:59:59Z' }, styles: {} },
      'rev-1': { id: 'rev-1', kind: 'section', component: 'review-carousel', children: [], props: { source: 'manual' }, styles: {} },
      'nl-1': { id: 'nl-1', kind: 'section', component: 'newsletter', children: [], props: { title: 'Subscribe' }, styles: {} }
    }
  };

  const errors = validatePageDocument(mktDoc);
  assert(errors.filter(e => e.severity === 'error').length === 0, 'PageDocument containing Countdown, Review Carousel, and Newsletter passes schema validation.');

  console.log('\n====================================================');
  console.log(`MARKETING SUMMARY: ${passedTests} Passed, ${failedTests} Failed.`);
  console.log('====================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runMarketingTests();
