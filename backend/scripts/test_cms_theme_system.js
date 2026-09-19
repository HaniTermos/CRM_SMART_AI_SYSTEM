require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const db = require('../config/database');
const ThemeService = require('../services/ThemeService');
const CmsThemeAssignment = require('../models/CmsThemeAssignment');

async function testCmsThemeSystem() {
  console.log('[Test] Starting CMS Theme System Test Suite...');
  let passed = 0;
  let failed = 0;

  function assert(cond, msg) {
    if (cond) {
      console.log(`  ✓ ${msg}`);
      passed++;
    } else {
      console.error(`  ✕ FAIL: ${msg}`);
      failed++;
    }
  }

  try {
    // 1. Gallery seeds count
    const gallery = await ThemeService.getGallery();
    assert(gallery.length >= 25, `CMS Theme Gallery returns >= 25 templates (Actual: ${gallery.length})`);

    // 2. Section variants catalog count
    const variants = await ThemeService.getSectionVariants();
    assert(variants.length >= 13, `CMS Section Variants returns >= 13 variants (Actual: ${variants.length})`);

    // 3. Draft theme application
    const storeRes = await db.query(`SELECT id FROM stores LIMIT 1`);
    const store_id = storeRes.rows[0].id;

    const draftVer = await ThemeService.applyThemeAsDraft(store_id, 'modern-cafe');
    assert(draftVer && draftVer.id && draftVer.status === 'draft', 'Applied theme preset as draft version');

    // 4. Preview Token Generation
    const tokenData = await ThemeService.generatePreviewToken(store_id, draftVer.id);
    assert(tokenData && tokenData.token, 'Generated short-lived preview token');

    const isValid = await ThemeService.validatePreviewToken(tokenData.token, store_id);
    assert(isValid === true, 'Validated preview token against store');

    // Cleanup draft version
    await db.query(`DELETE FROM cms_store_theme_assignments WHERE store_id = $1`, [store_id]);
    await db.query(`DELETE FROM cms_theme_versions WHERE id = $1`, [draftVer.id]);

    console.log(`\nCMS Theme System Tests: ${passed} Passed, ${failed} Failed.`);
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('[Test] Unexpected error in CMS Theme test:', err);
    process.exit(1);
  }
}

testCmsThemeSystem();
