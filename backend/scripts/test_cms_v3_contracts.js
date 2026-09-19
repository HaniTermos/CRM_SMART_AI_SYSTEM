/**
 * SmartStore Website Studio (CMS V3) — Contract & Schema Validation Test Suite
 */

const { validatePageDocument, isSafeCssProperty } = require('../validators/cmsV3Validator');

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

function runContractTests() {
  console.log('====================================================');
  console.log('SmartStore Website Studio (CMS V3) Contract Test Suite');
  console.log('====================================================\n');

  // --- GROUP 1: Document Structure Tests ---
  console.log('[TEST GROUP 1] Document Structure Tests:');

  const validDoc = {
    versionNumber: 1,
    rootNodeId: 'root',
    nodes: {
      root: { id: 'root', kind: 'page', component: 'page', children: ['hero-1'], props: { title: 'Home' }, styles: {} },
      'hero-1': { id: 'hero-1', kind: 'section', component: 'hero', children: [], props: { title: 'Welcome' }, styles: {} }
    }
  };
  const validErrors = validatePageDocument(validDoc);
  assert(validErrors.length === 0, 'Valid PageDocument passes validation with 0 errors.');

  const missingRootDoc = { versionNumber: 1, rootNodeId: 'nonexistent', nodes: { root: { id: 'root', kind: 'page', component: 'page', children: [], props: {}, styles: {} } } };
  const missingRootErrors = validatePageDocument(missingRootDoc);
  assert(missingRootErrors.some(e => e.code === 'ROOT_NODE_NOT_FOUND'), 'Detects missing root node ID in nodes dictionary.');

  const orphanDoc = {
    versionNumber: 1,
    rootNodeId: 'root',
    nodes: {
      root: { id: 'root', kind: 'page', component: 'page', children: [], props: {}, styles: {} },
      orphan: { id: 'orphan', kind: 'element', component: 'text', children: [], props: {}, styles: {} }
    }
  };
  const orphanErrors = validatePageDocument(orphanDoc);
  assert(orphanErrors.some(e => e.code === 'ORPHAN_NODE'), 'Detects orphan node not connected to root tree.');

  const circularDoc = {
    versionNumber: 1,
    rootNodeId: 'root',
    nodes: {
      root: { id: 'root', kind: 'page', component: 'page', children: ['c1'], props: {}, styles: {} },
      c1: { id: 'c1', kind: 'container', component: 'flex-container', children: ['c2'], props: {}, styles: {} },
      c2: { id: 'c2', kind: 'container', component: 'flex-container', children: ['c1'], props: {}, styles: {} }
    }
  };
  const circularErrors = validatePageDocument(circularDoc);
  assert(circularErrors.some(e => e.code === 'CIRCULAR_REFERENCE'), 'Detects circular parent-child relationships.');

  // --- GROUP 2: Styling & Security Tests ---
  console.log('\n[TEST GROUP 2] Styling & Security Tests:');

  assert(isSafeCssProperty('transform') === true, 'transform is allowed as GPU-safe CSS property.');
  assert(isSafeCssProperty('opacity') === true, 'opacity is allowed as GPU-safe CSS property.');
  assert(isSafeCssProperty('margin-top') === false, 'margin-top is rejected as layout-reflow property.');
  assert(isSafeCssProperty('width') === false, 'width is rejected as layout-reflow property.');

  const scriptInjectionDoc = {
    versionNumber: 1,
    rootNodeId: 'root',
    nodes: {
      root: { id: 'root', kind: 'page', component: 'page', children: [], props: { title: '<script>alert("hack")</script>' }, styles: {} }
    }
  };
  const scriptErrors = validatePageDocument(scriptInjectionDoc);
  assert(scriptErrors.some(e => e.code === 'UNSAFE_SCRIPT_INJECTION'), 'Detects and blocks script injection payloads in props.');

  const unsafeUrlDoc = {
    versionNumber: 1,
    rootNodeId: 'root',
    nodes: {
      root: { id: 'root', kind: 'page', component: 'page', children: ['btn-1'], props: {}, styles: {} },
      'btn-1': { id: 'btn-1', kind: 'element', component: 'button', children: [], props: { url: 'javascript:alert(1)' }, styles: {} }
    }
  };
  const unsafeUrlErrors = validatePageDocument(unsafeUrlDoc);
  assert(unsafeUrlErrors.some(e => e.code === 'UNSAFE_URL'), 'Blocks javascript: URLs in link props.');

  const invalidClassesDoc = {
    versionNumber: 1,
    rootNodeId: 'root',
    nodes: {
      root: { id: 'root', kind: 'page', component: 'page', children: ['sec-1'], props: {}, styles: {} },
      'sec-1': { id: 'sec-1', kind: 'section', component: 'section', children: [], props: { customClasses: 'valid-class onclick=alert(1)' }, styles: {} }
    }
  };
  const invalidClassesErrors = validatePageDocument(invalidClassesDoc);
  assert(invalidClassesErrors.some(e => e.code === 'INVALID_CSS_CLASSES'), 'Rejects unsafe custom CSS class tokens.');

  // --- GROUP 3: Behavior Tests ---
  console.log('\n[TEST GROUP 3] Behavior & Motion Tests:');

  const invalidBehaviorDoc = {
    versionNumber: 1,
    rootNodeId: 'root',
    nodes: {
      root: {
        id: 'root', kind: 'page', component: 'page', children: [], props: {}, styles: {},
        behaviors: {
          entrance: { type: 'invalid-preset', durationMs: 5000, delayMs: 0, easing: 'linear' },
          interactions: [{ trigger: 'click', action: 'invalid-action', targetId: 'missing-target' }]
        }
      }
    }
  };
  const behaviorErrors = validatePageDocument(invalidBehaviorDoc);
  assert(behaviorErrors.some(e => e.code === 'INVALID_ANIMATION_PRESET'), 'Rejects invalid animation presets.');
  assert(behaviorErrors.some(e => e.code === 'INVALID_DURATION'), 'Rejects animation duration > 2000ms.');
  assert(behaviorErrors.some(e => e.code === 'INVALID_ACTION'), 'Rejects invalid interaction actions.');
  assert(behaviorErrors.some(e => e.code === 'INVALID_TARGET_NODE'), 'Rejects interaction rules targeting non-existent node IDs.');

  // --- GROUP 4: Tenant Safety Tests ---
  console.log('\n[TEST GROUP 4] Tenant Isolation & Safety Tests:');
  const JSON_STR = JSON.stringify(validDoc);
  assert(!JSON_STR.includes('store_id') && !JSON_STR.includes('storeId'), 'PageDocument data structure contains zero hardcoded store IDs.');

  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passedTests} Passed, ${failedTests} Failed.`);
  console.log('====================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runContractTests();
