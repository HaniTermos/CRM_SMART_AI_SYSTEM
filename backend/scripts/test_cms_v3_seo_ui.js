const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const db = require('../config/database');
const CmsV3Page = require('../models/CmsV3Page');
const assert = require('assert');

async function run() {
  console.log('====================================================');
  console.log('SmartStore CMS V3 SEO Studio Test Suite');
  console.log('====================================================');

  let passed = 0;

  try {
    const storeRes = await db.query(`SELECT id FROM stores LIMIT 1`);
    const storeId = storeRes.rows[0].id;

    const pageRes = await db.query(`SELECT id FROM cms_v3_pages WHERE store_id = $1 LIMIT 1`, [storeId]);
    if (pageRes.rows.length === 0) {
      console.log('No pages found, skipping');
      process.exit(0);
    }
    const pageId = pageRes.rows[0].id;

    // 1. Save SEO Metadata
    const seoMeta = {
      metaTitle: 'Sunrise Bakery | Artisan Breads in Downtown',
      metaDescription: 'Fresh organic sourdough, pastries, and specialty espresso.',
      ogImage: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200'
    };

    const updated = await CmsV3Page.update(pageId, storeId, {
      seo_metadata: seoMeta
    });

    assert.strictEqual(updated.seo_metadata.metaTitle, seoMeta.metaTitle);
    console.log('  ✓ PASSED: Persisted SEO metadata in cms_v3_pages.');
    passed++;

    console.log('\n====================================================');
    console.log(`SEO STUDIO SUMMARY: ${passed} Passed, 0 Failed.`);
    console.log('====================================================');
    process.exit(0);
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  }
}

run();
