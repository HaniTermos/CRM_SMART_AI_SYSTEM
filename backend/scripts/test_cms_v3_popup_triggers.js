/**
 * SmartStore Website Studio (CMS V3) — Popup Triggers & Schedule Test Suite
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

function runPopupTriggersTests() {
  console.log('====================================================');
  console.log('SmartStore CMS V3 Popup Triggers & Schedule Test Suite');
  console.log('====================================================\n');

  console.log('[TEST GROUP 1] Popup Document Schema Validation:');

  const popupDoc = {
    versionNumber: 1,
    rootNodeId: 'root',
    nodes: {
      root: { id: 'root', kind: 'page', component: 'page', children: ['pop-1'], props: {}, styles: {} },
      'pop-1': {
        id: 'pop-1',
        kind: 'container',
        component: 'popup-modal',
        children: [],
        props: {
          config: {
            id: 'pop-1',
            title: '15% OFF Promo',
            triggerType: 'exit_intent',
            promoCode: 'SAVE15',
            dismissible: true
          }
        },
        styles: {}
      }
    }
  };

  const errors = validatePageDocument(popupDoc);
  assert(errors.filter(e => e.severity === 'error').length === 0, 'Popup modal document passes schema validation.');

  console.log('\n====================================================');
  console.log(`POPUP TRIGGERS SUMMARY: ${passedTests} Passed, ${failedTests} Failed.`);
  console.log('====================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runPopupTriggersTests();
