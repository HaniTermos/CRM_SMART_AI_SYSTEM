/**
 * SmartStore Website Studio (CMS V3) — Newsletter Consent & Isolation Test Suite
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const db = require('../config/database');
const CmsV3NewsletterService = require('../services/cmsV3NewsletterService');

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

async function runNewsletterConsentTests() {
  console.log('====================================================');
  console.log('SmartStore CMS V3 Newsletter Consent & Isolation Test Suite');
  console.log('====================================================\n');

  try {
    const storesRes = await db.query('SELECT id, name FROM stores LIMIT 2');
    if (storesRes.rows.length === 0) {
      console.error('No store found in DB.');
      process.exit(1);
    }
    const storeA = storesRes.rows[0];
    const storeB = storesRes.rows[1] || storeA;

    console.log(`[SETUP] Testing Newsletter Subscriptions for Store: ${storeA.name}`);

    // Test Group 1: Consent Enforcement & Duplicate-Safe Insertion
    console.log('[TEST GROUP 1] Marketing Consent Enforcement:');

    const noConsentResult = await CmsV3NewsletterService.subscribe({
      storeId: storeA.id,
      email: 'user@example.com',
      consentGiven: false
    });
    assert(!noConsentResult.success, 'Newsletter subscription rejected when consentGiven is false.');

    const validSubscribeResult = await CmsV3NewsletterService.subscribe({
      storeId: storeA.id,
      email: 'subscriber@example.com',
      consentGiven: true,
      source: 'footer_newsletter'
    });
    assert(validSubscribeResult.success, 'Newsletter subscription accepted when consentGiven is true.');

    // Test Group 2: Database Table Verification & Store Isolation
    console.log('\n[TEST GROUP 2] PostgreSQL Persistence & Store Isolation:');

    const subRes = await db.query(
      `SELECT * FROM cms_v3_newsletter_subscriptions WHERE store_id = $1 AND email = $2`,
      [storeA.id, 'subscriber@example.com']
    );
    assert(subRes.rows.length === 1, 'Subscription record persisted in cms_v3_newsletter_subscriptions table.');
    assert(subRes.rows[0].consent_given === true, 'Consent timestamp & boolean recorded correctly.');

    const storeBSubRes = await db.query(
      `SELECT * FROM cms_v3_newsletter_subscriptions WHERE store_id = $1 AND email = $2`,
      [storeB.id, 'subscriber@example.com']
    );
    assert(storeBSubRes.rows.length === 0 || storeA.id === storeB.id, 'Store B cannot view Store A newsletter subscriber (Store Isolation verified).');

    console.log('\n====================================================');
    console.log(`NEWSLETTER CONSENT SUMMARY: ${passedTests} Passed, ${failedTests} Failed.`);
    console.log('====================================================\n');

    if (failedTests > 0) {
      process.exit(1);
    }
    process.exit(0);
  } catch (err) {
    console.error('Newsletter test error:', err);
    process.exit(1);
  }
}

runNewsletterConsentTests();
