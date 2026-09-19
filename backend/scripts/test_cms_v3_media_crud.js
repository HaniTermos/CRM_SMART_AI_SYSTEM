const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const db = require('../config/database');
const CmsMedia = require('../models/CmsMedia');
const assert = require('assert');

async function run() {
  console.log('====================================================');
  console.log('SmartStore CMS V3 Media Library CRUD Test Suite');
  console.log('====================================================');

  let passed = 0;

  try {
    const storeRes = await db.query(`SELECT id FROM stores LIMIT 1`);
    const storeId = storeRes.rows[0].id;

    // 1. Create Media Asset
    const asset = await CmsMedia.create({
      store_id: storeId,
      filename: 'sourdough-fresh.jpg',
      url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200',
      alt_text: 'Fresh artisanal sourdough loaf'
    });
    assert(asset.id, 'Asset should have an ID');
    console.log('  ✓ PASSED: Created media asset in cms_media.');
    passed++;

    // 2. Fetch Assets for Store
    const list = await CmsMedia.findByStoreId(storeId);
    assert(list.length >= 1, 'Should return media assets');
    console.log(`  ✓ PASSED: Found ${list.length} media assets for store.`);
    passed++;

    // 3. Delete Asset
    await CmsMedia.delete(asset.id, storeId);
    const deleted = await CmsMedia.findById(asset.id, storeId);
    assert.strictEqual(deleted, null);
    console.log('  ✓ PASSED: Deleted media asset successfully.');
    passed++;

    console.log('\n====================================================');
    console.log(`MEDIA CRUD SUMMARY: ${passed} Passed, 0 Failed.`);
    console.log('====================================================');
    process.exit(0);
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  }
}

run();
