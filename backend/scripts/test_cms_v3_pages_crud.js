const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const db = require('../config/database');
const CmsV3Page = require('../models/CmsV3Page');
const CmsV3PageVersion = require('../models/CmsV3PageVersion');
const assert = require('assert');

async function run() {
  console.log('====================================================');
  console.log('SmartStore CMS V3 Page Manager CRUD Test Suite');
  console.log('====================================================');

  let passed = 0;

  try {
    const storeRes = await db.query(`SELECT id FROM stores LIMIT 1`);
    const storeId = storeRes.rows[0].id;

    // 1. Create Blank Page
    const testSlug = `test-page-${Date.now()}`;
    const page = await CmsV3Page.create({
      store_id: storeId,
      title: 'Test Custom Page',
      slug: testSlug,
      page_type: 'custom',
      seo_metadata: { metaTitle: 'Test Page Title' }
    });
    assert(page.id, 'Page ID should be generated');
    console.log('  ✓ PASSED: Created custom page in cms_v3_pages.');
    passed++;

    // 2. Create Draft Version
    const draft = await CmsV3PageVersion.createDraft({
      page_id: page.id,
      store_id: storeId,
      component_tree: { rootNodeId: 'root', nodes: { root: { id: 'root', kind: 'page', children: [] } } },
      change_summary: 'Initial draft'
    });
    assert(draft.id, 'Draft ID should be generated');
    console.log('  ✓ PASSED: Created draft version in cms_v3_page_versions.');
    passed++;

    // 3. Update Page Details
    const updated = await CmsV3Page.update(page.id, storeId, {
      title: 'Updated Test Page',
      slug: `${testSlug}-updated`
    });
    assert.strictEqual(updated.title, 'Updated Test Page');
    console.log('  ✓ PASSED: Updated page title and slug.');
    passed++;

    // 4. Duplicate Page
    const dup = await CmsV3Page.duplicate(page.id, storeId, 'Duplicated Page', `${testSlug}-dup`);
    assert(dup.id, 'Duplicate page should be created');
    console.log('  ✓ PASSED: Duplicated page with draft version copy.');
    passed++;

    // 5. Version History Listing
    const versions = await CmsV3Page.getVersions(page.id, storeId);
    assert(versions.length >= 1, 'Should return at least 1 version');
    console.log('  ✓ PASSED: Queried page version timeline.');
    passed++;

    // 6. Delete Page
    await CmsV3Page.delete(page.id, storeId);
    await CmsV3Page.delete(dup.id, storeId);
    const deleted = await CmsV3Page.findById(page.id, storeId);
    assert.strictEqual(deleted, null, 'Page should be deleted');
    console.log('  ✓ PASSED: Deleted custom pages successfully.');
    passed++;

    console.log('\n====================================================');
    console.log(`PAGE CRUD SUMMARY: ${passed} Passed, 0 Failed.`);
    console.log('====================================================');
    process.exit(0);
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  }
}

run();
