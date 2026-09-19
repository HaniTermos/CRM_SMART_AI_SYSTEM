/**
 * SmartStore Website Studio (CMS V3) — Rich Media Test Suite
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

function runRichMediaTests() {
  console.log('====================================================');
  console.log('SmartStore CMS V3 Rich Media Test Suite');
  console.log('====================================================\n');

  console.log('[TEST GROUP 1] Video & Masonry Gallery Schema Assertions:');

  const mediaDoc = {
    versionNumber: 1,
    rootNodeId: 'root',
    nodes: {
      root: { id: 'root', kind: 'page', component: 'page', children: ['vid-1', 'gal-1', 'rt-1'], props: {}, styles: {} },
      'vid-1': { id: 'vid-1', kind: 'element', component: 'video', children: [], props: { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }, styles: {} },
      'gal-1': { id: 'gal-1', kind: 'section', component: 'masonry-gallery', children: [], props: { columns: '3' }, styles: {} },
      'rt-1': { id: 'rt-1', kind: 'element', component: 'rich-text', children: [], props: { content: '<p>Fresh bakery daily.</p>' }, styles: {} }
    }
  };

  const errors = validatePageDocument(mediaDoc);
  assert(errors.filter(e => e.severity === 'error').length === 0, 'PageDocument containing Video, Masonry Gallery, and Rich Text passes schema validation.');

  console.log('\n====================================================');
  console.log(`RICH MEDIA SUMMARY: ${passedTests} Passed, ${failedTests} Failed.`);
  console.log('====================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runRichMediaTests();
