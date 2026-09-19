require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const db = require('../config/database');
const CmsSectionVariant = require('../models/CmsSectionVariant');

async function testSectionVariantRegistry() {
  console.log('[Test] Starting Section Variant Registry Test Suite...');
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
    // 1. Find all section variants
    const all = await CmsSectionVariant.findAll();
    assert(all.length >= 13, `Registry returns at least 13 section variants (Actual: ${all.length})`);

    // 2. Find hero variants
    const heroVariants = await CmsSectionVariant.findByType('hero');
    assert(heroVariants.length >= 4, 'Hero section registry includes at least 4 hero variants (fullscreen, split_left, split_right, default)');

    // 3. Find specific variant
    const splitLeft = await CmsSectionVariant.findSpecific('hero', 'split_left');
    assert(splitLeft && splitLeft.display_name === 'Split Image Left', 'Retrieved specific variant definition by section_type and variant_name');

    // 4. Verify cms_page_sections altered columns exist
    const pageSecRes = await db.query(
      `SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'cms_page_sections' AND column_name = 'element_overrides')`
    );
    assert(pageSecRes.rows[0].exists, 'cms_page_sections table includes element_overrides column');

    console.log(`\nSection Variant Registry Tests: ${passed} Passed, ${failed} Failed.`);
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('[Test] Unexpected error in Section Variant Registry test:', err);
    process.exit(1);
  }
}

testSectionVariantRegistry();
