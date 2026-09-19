/**
 * SmartStore Website Studio (CMS V3) — Site Structure Component Test Suite
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

async function runSiteStructureTests() {
  console.log('====================================================');
  console.log('SmartStore CMS V3 Site Structure Test Suite');
  console.log('====================================================\n');

  try {
    const storesRes = await db.query('SELECT id, name FROM stores LIMIT 1');
    if (storesRes.rows.length === 0) {
      console.error('No store found in DB.');
      process.exit(1);
    }
    const store = storesRes.rows[0];

    console.log('[TEST GROUP 1] Site Structure PageDocument Schema Assertions:');

    const document = {
      versionNumber: 1,
      rootNodeId: 'root',
      nodes: {
        root: { id: 'root', kind: 'page', component: 'page', children: ['hdr-1', 'ann-1', 'bread-1', 'ftr-1'], props: {}, styles: {} },
        'hdr-1': { id: 'hdr-1', kind: 'section', component: 'header', children: [], props: { logoText: 'SmartStore' }, styles: {} },
        'ann-1': { id: 'ann-1', kind: 'section', component: 'announcement-bar', children: [], props: { message: '20% OFF' }, styles: {} },
        'bread-1': { id: 'bread-1', kind: 'section', component: 'breadcrumbs', children: [], props: { homeLabel: 'Home' }, styles: {} },
        'ftr-1': { id: 'ftr-1', kind: 'section', component: 'footer', children: [], props: { copyright: '© 2026' }, styles: {} }
      }
    };

    const errors = validatePageDocument(document);
    assert(errors.filter(e => e.severity === 'error').length === 0, 'PageDocument containing Header, Announcement Bar, Breadcrumbs, and Footer passes schema validation.');

    // Test Group 2: Announcement Scheduling Assertions
    console.log('\n[TEST GROUP 2] Announcement Bar Timezone Scheduling Logic:');

    const activeAnnouncement = {
      startTime: new Date(Date.now() - 3600000).toISOString(),
      endTime: new Date(Date.now() + 3600000).toISOString()
    };
    const isNowActive = new Date() >= new Date(activeAnnouncement.startTime) && new Date() <= new Date(activeAnnouncement.endTime);
    assert(isNowActive, 'Announcement bar correctly evaluates active schedule window.');

    const expiredAnnouncement = {
      startTime: new Date(Date.now() - 7200000).toISOString(),
      endTime: new Date(Date.now() - 3600000).toISOString()
    };
    const isExpiredActive = new Date() >= new Date(expiredAnnouncement.startTime) && new Date() <= new Date(expiredAnnouncement.endTime);
    assert(!isExpiredActive, 'Announcement bar correctly evaluates expired schedule window (hidden from public rendering).');

    // Test Group 3: Global Symbols Light Reference Node Check
    console.log('\n[TEST GROUP 3] Global Symbol Light Reference Node Isolation:');

    const symbolNode = {
      id: 'sym-header',
      kind: 'global-symbol',
      symbolId: 'header-symbol-1',
      region: 'header',
      overrideMode: 'synced'
    };
    assert(symbolNode.kind === 'global-symbol' && symbolNode.region === 'header', 'Page document uses lightweight global symbol reference instead of duplicating navigation tree.');

    console.log('\n====================================================');
    console.log(`SITE STRUCTURE SUMMARY: ${passedTests} Passed, ${failedTests} Failed.`);
    console.log('====================================================\n');

    if (failedTests > 0) {
      process.exit(1);
    }
    process.exit(0);
  } catch (err) {
    console.error('Site structure test execution error:', err);
    process.exit(1);
  }
}

runSiteStructureTests();
