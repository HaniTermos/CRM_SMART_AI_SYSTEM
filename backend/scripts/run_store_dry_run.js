/**
 * SmartStore CMS V3 — Per-Store Read-Only Dry-Run Scanner
 *
 * Usage: node backend/scripts/run_store_dry_run.js --store=arabicast
 *
 * This script scans one legacy store's pages, sections, themes, navigation,
 * and media. It constructs proposed V3 PageDocument ASTs, validates them
 * with cmsV3Validator, and writes a markdown dry-run report.
 *
 * ZERO database writes. Uses a mutation trap identical to the Stage 8C-A scanner.
 */

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const db = require('../config/database');
const validator = require('../validators/cmsV3Validator');

// ── Mutation Trap ──
let observedMutations = 0;
const originalQuery = db.query.bind(db);
db.query = async function (sqlText, params) {
  const q = (typeof sqlText === 'string' ? sqlText : (sqlText.text || '')).trim().toUpperCase();
  for (const w of ['INSERT', 'UPDATE', 'DELETE', 'ALTER', 'DROP', 'TRUNCATE', 'CREATE TABLE']) {
    if (q.startsWith(w) || q.includes(` ${w} `)) {
      observedMutations++;
      throw new Error(`[ZERO-WRITE VIOLATION] ${w} detected — aborting.`);
    }
  }
  return originalQuery(sqlText, params);
};

// ── Section Mapper (identical to Stage 8C-A) ──
function mapLegacySection(sec, storeSlug) {
  const type = (sec.type || '').toLowerCase();
  const content = sec.content || {};
  const warnings = [];
  let node = null;

  switch (type) {
    case 'hero': case 'hero_banner':
      node = { id: `hero-${sec.id.substring(0,8)}`, kind: 'section', type: 'hero',
        props: { eyebrow: content.eyebrow||'', title: content.title||'Welcome', subtitle: content.subtitle||'', imageUrl: content.image_url||content.hero_image||'', ctaPrimaryText: content.cta_primary_text||'Explore', ctaPrimaryLink: content.cta_primary_link||`/shop/${storeSlug}`, ctaSecondaryText: content.cta_secondary_text||'', ctaSecondaryLink: content.cta_secondary_link||'' }, children: [] };
      if (!node.props.imageUrl) warnings.push(`Missing hero image for section ${sec.id}`);
      break;
    case 'featured_menu':
      node = { id: `grid-${sec.id.substring(0,8)}`, kind: 'section', type: 'product-grid',
        props: { title: content.title||'Featured Items', subtitle: content.subtitle||'', limit: content.limit||6, showCategoryFilter: content.show_category_filter !== false }, children: [] };
      break;
    case 'about': case 'story':
      node = { id: `about-${sec.id.substring(0,8)}`, kind: 'section', type: 'story-about',
        props: { title: content.title||'About Us', description: content.description||content.body||'', imageUrl: content.image_url||'' }, children: [] };
      if (!node.props.description) warnings.push(`Missing story text for section ${sec.id}`);
      break;
    case 'gallery':
      node = { id: `gallery-${sec.id.substring(0,8)}`, kind: 'section', type: 'masonry-gallery',
        props: { title: content.title||'Gallery', images: Array.isArray(content.images)?content.images:[] }, children: [] };
      if (!node.props.images.length) warnings.push(`Empty image list in gallery ${sec.id}`);
      break;
    case 'testimonials':
      node = { id: `testi-${sec.id.substring(0,8)}`, kind: 'section', type: 'testimonials',
        props: { title: content.title||'What Customers Say', items: Array.isArray(content.items)?content.items:[] }, children: [] };
      break;
    case 'faq':
      node = { id: `faq-${sec.id.substring(0,8)}`, kind: 'section', type: 'faq-accordion',
        props: { title: content.title||'FAQ', items: Array.isArray(content.items)?content.items:[] }, children: [] };
      break;
    case 'contact_form':
      node = { id: `contact-${sec.id.substring(0,8)}`, kind: 'section', type: 'contact-form',
        props: { title: content.title||'Contact Us', phone: content.phone||'', email: content.email||'', address: content.address||'' }, children: [] };
      break;
    case 'opening_hours':
      node = { id: `map-${sec.id.substring(0,8)}`, kind: 'section', type: 'location-map',
        props: { title: content.title||'Location & Hours', hours: content.hours||'', address: content.address||'' }, children: [] };
      break;
    case 'rich_text':
      node = { id: `text-${sec.id.substring(0,8)}`, kind: 'section', type: 'rich-text',
        props: { title: content.title||'', body: content.body||'' }, children: [] };
      break;
    case 'announcement':
      node = { id: `announ-${sec.id.substring(0,8)}`, kind: 'section', type: 'announcement-bar',
        props: { message: content.message||content.title||'', ctaText: content.cta_text||'', ctaLink: content.cta_link||'' }, children: [] };
      break;
    default:
      warnings.push(`Unsupported section type: ${sec.type} (ID: ${sec.id})`);
      node = { id: `custom-${sec.id.substring(0,8)}`, kind: 'section', type: 'custom-html',
        props: { html: `<div data-legacy-type="${sec.type}">${JSON.stringify(content)}</div>` }, children: [] };
      break;
  }
  return { node, warnings, sourceId: sec.id };
}

// ── CLI ──
const storeSlug = (process.argv.find(a => a.startsWith('--store=')) || '').split('=')[1];
if (!storeSlug) { console.error('Usage: --store=<slug>'); process.exit(1); }

async function run() {
  console.log(`====================================================================`);
  console.log(`CMS V3 Next-Store Dry Run — ${storeSlug}`);
  console.log(`====================================================================\n`);

  const storeRes = await originalQuery(`SELECT id, name, slug FROM stores WHERE slug = $1`, [storeSlug]);
  if (storeRes.rows.length === 0) { console.error(`Store '${storeSlug}' not found.`); process.exit(1); }
  const store = storeRes.rows[0];

  // Legacy data
  const pages = (await db.query(`SELECT * FROM cms_pages WHERE store_id = $1 ORDER BY title`, [store.id])).rows;
  const allWarnings = [];
  const pageReports = [];

  for (const lp of pages) {
    const sections = (await db.query(`SELECT * FROM cms_page_sections WHERE page_id = $1 ORDER BY position`, [lp.id])).rows;

    const nodesDict = { root: { id: 'root', kind: 'page', props: { title: lp.title, slug: lp.slug }, children: [] } };
    const sectionSummaries = [];

    for (const sec of sections) {
      const m = mapLegacySection(sec, store.slug);
      if (m.node) { nodesDict[m.node.id] = m.node; nodesDict.root.children.push(m.node.id); }
      sectionSummaries.push({ type: sec.type, v3Type: m.node?.type || 'N/A', sourceId: sec.id });
      allWarnings.push(...m.warnings);
    }

    const doc = { rootNodeId: 'root', nodes: nodesDict };
    const errors = validator.validatePageDocument(doc);

    pageReports.push({
      title: lp.title, slug: lp.slug, status: lp.status,
      legacySections: sections.length,
      v3Nodes: Object.keys(nodesDict).length - 1,
      astValid: errors.length === 0 ? 'YES' : 'NO',
      astErrors: errors.map(e => e.message),
      sections: sectionSummaries
    });
  }

  const themes = (await db.query(`SELECT * FROM cms_settings WHERE store_id = $1`, [store.id])).rows;
  const navItems = (await db.query(`SELECT * FROM cms_navigation_items WHERE store_id = $1`, [store.id])).rows;
  const media = (await db.query(`SELECT * FROM cms_media WHERE store_id = $1`, [store.id])).rows;

  const criticalErrors = pageReports.filter(p => p.astValid === 'NO').length;
  const ready = criticalErrors === 0 && pages.length > 0;

  // Build report
  const reportName = `CMS_V3_${store.name.toUpperCase().replace(/\s+/g, '_')}_NEXT_STORE_DRY_RUN.md`;
  const report = `# ${store.name} — CMS V3 Next-Store Dry-Run Report

## Scope
- **Store**: ${store.name} (${store.slug})
- **Store ID**: ${store.id}
- **Environment**: ${process.env.NODE_ENV || 'development'}
- **Date**: ${new Date().toISOString()}
- **Mode**: READ-ONLY (zero writes enforced via mutation trap)
- **Observed mutations**: ${observedMutations}

## Legacy inventory
- **Legacy pages**: ${pages.length}
- **Legacy sections**: ${pages.reduce((a, p) => a + (pageReports.find(r => r.slug === p.slug)?.legacySections || 0), 0)}
- **Theme settings**: ${themes.length}
- **Navigation items**: ${navItems.length}
- **Media assets**: ${media.length}

## Proposed V3 documents
| Page | Slug | Status | Legacy Sections | V3 Nodes | AST Valid |
|---|---|---|---:|---:|---|
${pageReports.map(p => `| ${p.title} | ${p.slug} | ${p.status} | ${p.legacySections} | ${p.v3Nodes} | ${p.astValid} |`).join('\n')}

## Section mapping detail
${pageReports.map(p => `### ${p.title} (${p.slug})
${p.sections.length === 0 ? '- No sections found.\n' : p.sections.map(s => `- Legacy \`${s.type}\` → V3 \`${s.v3Type}\` (source: ${s.sourceId})`).join('\n')}
${p.astErrors.length > 0 ? `\n**AST Errors:**\n${p.astErrors.map(e => `- ${e}`).join('\n')}` : ''}
`).join('\n')}

## Warnings
${allWarnings.length === 0 ? '- None' : allWarnings.map(w => `- ${w}`).join('\n')}

## Critical errors
${criticalErrors === 0 ? '- None' : `- ${criticalErrors} page(s) failed AST validation.`}

## Store readiness
- **Ready for migration**: ${ready ? 'YES' : 'NO — resolve critical errors first'}
- **Database writes**: 0 (confirmed by mutation trap)
- **Feature flags changed**: 0
- **Legacy tables changed**: 0
- **Commerce tables changed**: 0
`;

  const reportPath = path.resolve(__dirname, '../../' + reportName);
  fs.writeFileSync(reportPath, report, 'utf8');
  console.log(`Report saved: ${reportPath}`);
  console.log(`Pages: ${pages.length}, Sections: ${pages.reduce((a, p) => a + (pageReports.find(r => r.slug === p.slug)?.legacySections || 0), 0)}, Warnings: ${allWarnings.length}, Critical: ${criticalErrors}, Mutations: ${observedMutations}\n`);
  process.exit(criticalErrors > 0 ? 1 : 0);
}

run();
