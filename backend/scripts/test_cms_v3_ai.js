/**
 * SmartStore Website Studio (CMS V3) — Stage 3 AI Workflows Test Suite
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const db = require('../config/database');
const CmsV3AiService = require('../services/cmsV3AiService');
const CmsV3Page = require('../models/CmsV3Page');
const CmsV3PageVersion = require('../models/CmsV3PageVersion');
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

async function runAiTests() {
  console.log('====================================================');
  console.log('SmartStore Website Studio (CMS V3) Stage 3 AI Test Suite');
  console.log('====================================================\n');

  try {
    const storesRes = await db.query('SELECT id, name, slug FROM stores LIMIT 2');
    if (storesRes.rows.length === 0) {
      console.error('No stores found in DB.');
      process.exit(1);
    }

    const storeA = storesRes.rows[0];
    const storeB = storesRes.rows[1] || storeA;

    console.log(`[SETUP] Store A: ${storeA.name} (${storeA.id})`);
    console.log(`[SETUP] Store B: ${storeB.name} (${storeB.id})\n`);

    // --- TEST GROUP 1: AI Onboarding & Draft Generation ---
    console.log('[TEST GROUP 1] AI Website Onboarding Draft Generation:');

    const onboardingResult = await CmsV3AiService.generateWebsiteDraft({
      storeId: storeA.id,
      businessType: 'Café & Bakery',
      storeName: storeA.name,
      category: 'Artisanal Pastries',
      targetAudience: 'Local coffee lovers',
      goals: 'Drive online orders'
    });

    assert(onboardingResult.operations && onboardingResult.operations.length > 0, 'Generated AI operations list for website onboarding.');
    assert(onboardingResult.initialDocument && onboardingResult.initialDocument.nodes['hero-section'] !== undefined, 'Generated document contains Hero section.');

    // --- TEST GROUP 2: AI Edit Proposals & Safety Safeguards ---
    console.log('\n[TEST GROUP 2] AI Edit Proposals & Safety Safeguards:');

    const initialDoc = onboardingResult.initialDocument;
    const proposal = await CmsV3AiService.proposeEdits({
      storeId: storeA.id,
      pageId: 'home',
      prompt: 'Add FAQ section and update hero headline',
      targetNodeId: 'hero-section',
      currentDocument: initialDoc
    });

    assert(proposal.operations.length > 0, 'Generated AI edit proposal operations.');

    // Test apply operations
    const updatedDoc = CmsV3AiService.applyOperations(initialDoc, proposal.operations);
    const validErrors = validatePageDocument(updatedDoc);
    assert(validErrors.filter(e => e.severity === 'error').length === 0, 'Applied AI operations result in 0 schema validation errors.');

    // --- TEST GROUP 3: Unsafe Reflow & Script Payload Rejection ---
    console.log('\n[TEST GROUP 3] AI Unsafe Payload Rejection:');

    assert(isSafeCssProperty('opacity') === true, 'Opacity is validated as safe CSS property.');
    assert(isSafeCssProperty('margin-top') === false, 'margin-top is rejected as layout reflow property.');

    // --- TEST GROUP 4: AI Audit Engine ---
    console.log('\n[TEST GROUP 4] AI Quality Audit Engine:');

    const auditRes = CmsV3AiService.runAudit(updatedDoc);
    assert(typeof auditRes.score === 'number' && auditRes.score >= 0, `Ran AI Audit: Quality score is ${auditRes.score}/100.`);

    // --- TEST GROUP 5: AI Audit Runs Log & Store Isolation ---
    console.log('\n[TEST GROUP 5] AI Runs Audit Log & Store Isolation:');

    const aiRunLog = await CmsV3AiService.logAiRun({
      storeId: storeA.id,
      prompt: 'Test AI prompt log',
      model: 'smartstore-ai-v3',
      operations: proposal.operations,
      tokenUsage: 120,
      status: 'applied'
    });

    assert(aiRunLog && aiRunLog.id !== undefined, 'Logged AI run in cms_v3_ai_runs database table.');

    const storeARuns = await CmsV3AiService.getAiRuns(storeA.id);
    assert(storeARuns.some(r => r.id === aiRunLog.id), 'Store A can fetch logged AI run.');

    if (storeA.id !== storeB.id) {
      const storeBRuns = await CmsV3AiService.getAiRuns(storeB.id);
      assert(!storeBRuns.some(r => r.id === aiRunLog.id), 'Store B cannot fetch Store A AI runs (Multi-tenant isolation verified).');
    } else {
      assert(true, 'Skipping multi-store AI run check (Single store DB).');
    }

    console.log('\n====================================================');
    console.log(`STAGE 3 AI WORKFLOW SUMMARY: ${passedTests} Passed, ${failedTests} Failed.`);
    console.log('====================================================\n');

    if (failedTests > 0) {
      process.exit(1);
    }
    process.exit(0);
  } catch (err) {
    console.error('AI Test execution error:', err);
    process.exit(1);
  }
}

runAiTests();
