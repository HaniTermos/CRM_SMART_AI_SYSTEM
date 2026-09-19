/**
 * SmartStore Website Studio (CMS V3) — Read-Only Final Staging Data Consistency Audit
 */

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const db = require('../config/database');
const validator = require('../validators/cmsV3Validator');

async function runAudit() {
  console.log('====================================================================');
  console.log('SmartStore CMS V3 — Final Staging Data Consistency Audit (READ-ONLY)');
  console.log('====================================================================\n');

  // 1. Stores and Feature Flags
  const storesRes = await db.query(
    `SELECT s.id, s.name, s.slug, st.cms_v3_enabled, st.active_theme_id
     FROM stores s
     LEFT JOIN cms_v3_sites st ON s.id = st.store_id
     ORDER BY s.name`
  );

  const storeAudits = [];

  for (const s of storesRes.rows) {
    // Pages
    const pages = (await db.query(
      `SELECT id, title, slug, page_type, is_published, published_version_id, draft_version_id, seo_metadata
       FROM cms_v3_pages
       WHERE store_id = $1
       ORDER BY slug`,
      [s.id]
    )).rows;

    // Versions
    const versions = (await db.query(
      `SELECT v.id, v.page_id, v.version_number, v.status, v.change_summary, v.component_tree, p.slug as page_slug
       FROM cms_v3_page_versions v
       JOIN cms_v3_pages p ON v.page_id = p.id
       WHERE v.store_id = $1
       ORDER BY v.created_at`,
      [s.id]
    )).rows;

    // Themes
    const themes = (await db.query(
      `SELECT id, name, slug, colors, typography, global_styles
       FROM cms_v3_themes
       WHERE store_id = $1`,
      [s.id]
    )).rows;

    // Navigation
    const nav = (await db.query(
      `SELECT id, region, jsonb_array_length(items::jsonb) as item_count
       FROM cms_v3_navigation
       WHERE store_id = $1`,
      [s.id]
    )).rows;

    // Media usage
    const mediaUsage = (await db.query(
      `SELECT COUNT(*)::int as count
       FROM cms_v3_media_usage
       WHERE store_id = $1`,
      [s.id]
    )).rows[0].count;

    // AST validation check
    let validAstCount = 0;
    let invalidAstCount = 0;
    const pageDetails = [];

    for (const p of pages) {
      const pVers = versions.filter(v => v.page_id === p.id);
      const pubVer = versions.find(v => v.id === p.published_version_id);
      let astValid = false;
      if (pubVer && pubVer.component_tree) {
        const errs = validator.validatePageDocument(pubVer.component_tree);
        if (errs.length === 0) {
          validAstCount++;
          astValid = true;
        } else {
          invalidAstCount++;
        }
      }

      pageDetails.push({
        title: p.title,
        slug: p.slug,
        isPublished: p.is_published,
        versionCount: pVers.length,
        hasPublishedVersion: !!pubVer,
        astValid: astValid ? 'VALID' : (pubVer ? 'INVALID' : 'NO_PUBLISHED_VERSION'),
        traceability: pubVer?.change_summary || 'N/A'
      });
    }

    storeAudits.push({
      id: s.id,
      name: s.name,
      slug: s.slug,
      v3Enabled: s.cms_v3_enabled,
      activeThemeId: s.active_theme_id,
      pageCount: pages.length,
      versionCount: versions.length,
      publishedVersions: versions.filter(v => v.status === 'published').length,
      draftVersions: versions.filter(v => v.status === 'draft').length,
      themeCount: themes.length,
      navRegions: nav.map(n => `${n.region} (${n.item_count} items)`).join(', '),
      mediaUsageCount: mediaUsage,
      validAstCount,
      invalidAstCount,
      pages: pageDetails
    });
  }

  // 2. Cross-Store Isolation & Foreign Reference Check
  console.log('[ISOLATION CHECK] Auditing cross-tenant references in cms_v3_* tables...');
  const crossPageLeak = (await db.query(
    `SELECT COUNT(*)::int as c FROM cms_v3_pages p
     JOIN cms_v3_page_versions v ON p.id = v.page_id
     WHERE p.store_id != v.store_id`
  )).rows[0].c;

  const crossSiteLeak = (await db.query(
    `SELECT COUNT(*)::int as c FROM cms_v3_sites s
     JOIN cms_v3_themes t ON s.active_theme_id = t.id
     WHERE s.store_id != t.store_id`
  )).rows[0].c;

  // 3. Commerce & Legacy Table Fingerprints
  const fp = {};
  for (const t of ['products', 'orders', 'order_items', 'customers', 'reservations', 'inventory_adjustments', 'cms_pages', 'cms_page_sections', 'cms_settings', 'cms_navigation_items', 'cms_media', 'cms_themes']) {
    fp[t] = (await db.query(`SELECT COUNT(*)::int as c FROM ${t}`)).rows[0].c;
  }

  console.log('\n--- STORE AUDIT SUMMARY ---');
  console.table(storeAudits.map(s => ({
    Store: s.name,
    Slug: s.slug,
    'V3 Flag': s.v3Enabled,
    Pages: s.pageCount,
    Versions: s.versionCount,
    Themes: s.themeCount,
    'Media Refs': s.mediaUsageCount,
    'Valid ASTs': s.validAstCount
  })));

  console.log('\nCross-page store_id mismatch:', crossPageLeak);
  console.log('Cross-site theme store_id mismatch:', crossSiteLeak);
  console.log('\nCommerce & Legacy Table Fingerprints:', fp);

  // Write detailed audit data to disk for report generation
  fs.writeFileSync(
    path.resolve(__dirname, 'audit_data.json'),
    JSON.stringify({ storeAudits, crossPageLeak, crossSiteLeak, fp }, null, 2),
    'utf8'
  );
  process.exit(0);
}

runAudit();
