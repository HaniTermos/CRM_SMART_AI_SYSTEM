const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const db = require('../config/database');
const CmsV3Page = require('../models/CmsV3Page');
const assert = require('assert');

async function run() {
  console.log('====================================================');
  console.log('SmartStore CMS V3 Theme Studio Test Suite');
  console.log('====================================================');

  let passed = 0;

  try {
    const storeRes = await db.query(`SELECT id FROM stores LIMIT 1`);
    const storeId = storeRes.rows[0].id;

    // 1. Load System Themes
    const themesRes = await db.query(`SELECT * FROM cms_v3_themes WHERE store_id IS NULL`);
    assert(themesRes.rows.length >= 8, 'Should have at least 8 system themes');
    console.log(`  ✓ PASSED: Found ${themesRes.rows.length} system themes.`);
    passed++;

    // 2. Apply Theme as Draft Pointer
    const targetTheme = themesRes.rows[0];
    const siteConfig = await CmsV3Page.updateSiteConfig(storeId, {
      draft_theme_id: targetTheme.id,
      global_tokens: { colors: targetTheme.colors }
    });
    assert.strictEqual(siteConfig.draft_theme_id, targetTheme.id);
    console.log('  ✓ PASSED: Applied theme as draft pointer in cms_v3_sites.');
    passed++;

    // 3. Update Custom Tokens
    const updatedTokens = {
      colors: { primary: '#4338CA', background: '#FFFFFF' }
    };
    const savedConfig = await CmsV3Page.updateSiteConfig(storeId, {
      global_tokens: updatedTokens
    });
    assert.strictEqual(savedConfig.global_tokens?.colors?.primary, '#4338CA');
    console.log('  ✓ PASSED: Saved custom design tokens to store configuration.');
    passed++;

    // 4. Publish Theme
    const publishedConfig = await CmsV3Page.updateSiteConfig(storeId, {
      active_theme_id: targetTheme.id
    });
    assert.strictEqual(publishedConfig.active_theme_id, targetTheme.id);
    console.log('  ✓ PASSED: Published theme to active_theme_id in cms_v3_sites.');
    passed++;

    console.log('\n====================================================');
    console.log(`THEME STUDIO SUMMARY: ${passed} Passed, 0 Failed.`);
    console.log('====================================================');
    process.exit(0);
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  }
}

run();
