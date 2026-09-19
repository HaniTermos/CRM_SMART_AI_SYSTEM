const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const db = require('../config/database');

async function postExecutionVerify() {
  console.log('--- POST-EXECUTION VERIFICATION AUDIT ---');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ ${message}`);
      passed++;
    } else {
      console.error(`  ✕ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Verify Migration Ledger
  const appliedRes = await db.query(`SELECT filename FROM _migrations ORDER BY filename`);
  const filenames = appliedRes.rows.map((r) => r.filename);
  assert(filenames.includes('022_stores_business_type_check.sql'), '_migrations ledger contains 022_stores_business_type_check.sql');
  assert(filenames.includes('023_ai_copilot_system.sql'), '_migrations ledger contains 023_ai_copilot_system.sql');
  assert(filenames.includes('024_cms_themes_and_editor.sql'), '_migrations ledger contains 024_cms_themes_and_editor.sql');

  // 2. Verify AI Tables
  const aiTables = [
    'ai_store_balances', 'ai_conversations', 'ai_action_plans',
    'ai_messages', 'ai_actions', 'ai_action_execution_logs',
    'ai_usage_ledger', 'ai_scheduled_insights'
  ];
  for (const table of aiTables) {
    const res = await db.query(
      `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1)`,
      [table]
    );
    assert(res.rows[0].exists, `AI Table '${table}' exists`);
  }

  // 3. Verify CMS & Theme Tables
  const cmsTables = [
    'cms_themes', 'cms_section_variants', 'cms_theme_versions',
    'cms_store_theme_assignments', 'user_dashboard_layouts'
  ];
  for (const table of cmsTables) {
    const res = await db.query(
      `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1)`,
      [table]
    );
    assert(res.rows[0].exists, `CMS/Theme Table '${table}' exists`);
  }

  // 4. Verify cms_page_sections Columns
  const sectionCols = ['variant_name', 'element_overrides', 'custom_override_active'];
  for (const col of sectionCols) {
    const res = await db.query(
      `SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'cms_page_sections' AND column_name = $1)`,
      [col]
    );
    assert(res.rows[0].exists, `cms_page_sections column '${col}' exists`);
  }

  // 5. Data Preservation Check
  const baselinePath = path.join(__dirname, '../backups/baseline_counts.json');
  if (fs.existsSync(baselinePath)) {
    const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
    console.log('\n--- DATA PRESERVATION ASSERTIONS ---');
    for (const [table, oldCount] of Object.entries(baseline)) {
      const res = await db.query(`SELECT COUNT(*)::int AS count FROM "${table}"`);
      const newCount = res.rows[0].count;
      assert(newCount >= oldCount, `Data Preserved for '${table}': Before=${oldCount}, After=${newCount}`);
    }
  }

  // 6. Seed Counts Verification
  console.log('\n--- SEED & CONSTRAINT ASSERTIONS ---');
  const themeCountRes = await db.query(`SELECT COUNT(*)::int AS count FROM cms_themes`);
  assert(themeCountRes.rows[0].count >= 25, `Seeded Theme Templates count >= 25 (Actual: ${themeCountRes.rows[0].count})`);

  const variantCountRes = await db.query(`SELECT COUNT(*)::int AS count FROM cms_section_variants`);
  assert(variantCountRes.rows[0].count >= 13, `Seeded Section Variants count >= 13 (Actual: ${variantCountRes.rows[0].count})`);

  const v1Themes = ['classic', 'warm', 'minimal', 'dark'];
  for (const slug of v1Themes) {
    const res = await db.query(`SELECT EXISTS (SELECT 1 FROM cms_themes WHERE slug = $1)`, [slug]);
    assert(res.rows[0].exists, `Existing V1 Theme '${slug}' preserved in cms_themes`);
  }

  // Unique constraint checks
  const dupSlugCheck = await db.query(`SELECT slug, COUNT(*) FROM cms_themes GROUP BY slug HAVING COUNT(*) > 1`);
  assert(dupSlugCheck.rows.length === 0, 'All cms_themes slugs are unique');

  const dupVariantCheck = await db.query(`SELECT section_type, variant_name, COUNT(*) FROM cms_section_variants GROUP BY section_type, variant_name HAVING COUNT(*) > 1`);
  assert(dupVariantCheck.rows.length === 0, 'All cms_section_variants combinations are unique');

  console.log(`\nPost-Execution Verification Results: ${passed} Passed, ${failed} Failed.`);
  process.exit(failed > 0 ? 1 : 0);
}

postExecutionVerify();
