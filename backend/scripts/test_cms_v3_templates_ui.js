const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const db = require('../config/database');
const CmsV3PageTemplate = require('../models/CmsV3PageTemplate');
const CmsV3Page = require('../models/CmsV3Page');
const CmsV3PageVersion = require('../models/CmsV3PageVersion');
const assert = require('assert');

async function run() {
  console.log('====================================================');
  console.log('SmartStore CMS V3 Template Gallery Test Suite');
  console.log('====================================================');

  let passed = 0;

  try {
    const storeRes = await db.query(`SELECT id FROM stores LIMIT 1`);
    const storeId = storeRes.rows[0].id;

    // 1. Query Templates
    const templates = await CmsV3PageTemplate.getTemplates();
    assert(templates.length >= 3, 'Should return seeded system templates');
    console.log(`  ✓ PASSED: Found ${templates.length} system templates in cms_v3_page_templates.`);
    passed++;

    // 2. Fetch Bakery Template by Slug
    const bakeryTmpl = await CmsV3PageTemplate.findBySlug('bakery-artisan-starter');
    assert(bakeryTmpl, 'Bakery template should exist');
    assert(bakeryTmpl.component_tree?.rootNodeId, 'Template component_tree should be a valid PageDocument');
    console.log('  ✓ PASSED: Loaded Bakery Starter PageDocument AST.');
    passed++;

    // 3. Instantiate Page from Template
    const testSlug = `bakery-inst-${Date.now()}`;
    const page = await CmsV3Page.create({
      store_id: storeId,
      title: 'Artisanal Bakery Staging Page',
      slug: testSlug,
      page_type: 'custom'
    });

    const draft = await CmsV3PageVersion.createDraft({
      page_id: page.id,
      store_id: storeId,
      component_tree: bakeryTmpl.component_tree,
      change_summary: 'Instantiated from bakery-artisan-starter'
    });

    await CmsV3Page.updateVersionPointers(page.id, storeId, {
      draftVersionId: draft.id
    });

    assert(draft.id, 'Draft should be created');
    console.log('  ✓ PASSED: Successfully cloned template AST into store-scoped draft page.');
    passed++;

    // Cleanup
    await CmsV3Page.delete(page.id, storeId);
    console.log('  ✓ PASSED: Cleaned up test page.');
    passed++;

    console.log('\n====================================================');
    console.log(`TEMPLATE GALLERY SUMMARY: ${passed} Passed, 0 Failed.`);
    console.log('====================================================');
    process.exit(0);
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  }
}

run();
