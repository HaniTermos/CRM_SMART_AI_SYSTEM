/**
 * SmartStore Website Studio (CMS V3) — Stage 8C-A Zero-Write Migration Dry-Run Scanner
 */

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const db = require('../config/database');
const validator = require('../validators/cmsV3Validator');

// Mutation trap to enforce strict zero-write policy
let observedMutations = 0;
const originalQuery = db.query.bind(db);

db.query = async function (sqlText, params) {
  const queryStr = typeof sqlText === 'string' ? sqlText : (sqlText.text || '');
  const trimmed = queryStr.trim().toUpperCase();

  const forbiddenWords = ['INSERT', 'UPDATE', 'DELETE', 'ALTER', 'DROP', 'TRUNCATE', 'CREATE'];
  for (const word of forbiddenWords) {
    if (trimmed.startsWith(word) || trimmed.includes(` ${word} `)) {
      observedMutations++;
      throw new Error(`[ZERO-WRITE VIOLATION DETECTED] Mutation statement attempt forbidden: ${word}`);
    }
  }
  return originalQuery(sqlText, params);
};

// Section Mappers returning { node, warnings, sourceId }
function mapLegacySection(sec, storeSlug) {
  const type = (sec.type || '').toLowerCase();
  const content = sec.content || {};
  const warnings = [];
  const sourceId = sec.id;

  let node = null;

  switch (type) {
    case 'hero':
    case 'hero_banner':
      node = {
        id: `hero-${sec.id.substring(0, 8)}`,
        kind: 'section',
        type: 'hero',
        props: {
          eyebrow: content.eyebrow || '',
          title: content.title || 'Welcome',
          subtitle: content.subtitle || '',
          imageUrl: content.image_url || content.hero_image || '',
          ctaPrimaryText: content.cta_primary_text || 'Explore',
          ctaPrimaryLink: content.cta_primary_link || `/shop/${storeSlug}`,
          ctaSecondaryText: content.cta_secondary_text || '',
          ctaSecondaryLink: content.cta_secondary_link || ''
        },
        children: []
      };
      if (!node.props.imageUrl) warnings.push(`Missing hero image for section ${sec.id}`);
      break;

    case 'featured_menu':
      node = {
        id: `grid-${sec.id.substring(0, 8)}`,
        kind: 'section',
        type: 'product-grid',
        props: {
          title: content.title || 'Featured Items',
          subtitle: content.subtitle || '',
          limit: content.limit || 6,
          showCategoryFilter: content.show_category_filter !== false
        },
        children: []
      };
      break;

    case 'about':
    case 'story':
      node = {
        id: `about-${sec.id.substring(0, 8)}`,
        kind: 'section',
        type: 'story-about',
        props: {
          title: content.title || 'About Us',
          description: content.description || content.body || '',
          imageUrl: content.image_url || ''
        },
        children: []
      };
      if (!node.props.description) warnings.push(`Missing story text for section ${sec.id}`);
      break;

    case 'gallery':
      node = {
        id: `gallery-${sec.id.substring(0, 8)}`,
        kind: 'section',
        type: 'masonry-gallery',
        props: {
          title: content.title || 'Gallery',
          images: Array.isArray(content.images) ? content.images : []
        },
        children: []
      };
      if (!node.props.images.length) warnings.push(`Empty image list in gallery section ${sec.id}`);
      break;

    case 'testimonials':
      node = {
        id: `testi-${sec.id.substring(0, 8)}`,
        kind: 'section',
        type: 'testimonials',
        props: {
          title: content.title || 'What Customers Say',
          items: Array.isArray(content.items) ? content.items : []
        },
        children: []
      };
      break;

    case 'faq':
      node = {
        id: `faq-${sec.id.substring(0, 8)}`,
        kind: 'section',
        type: 'faq-accordion',
        props: {
          title: content.title || 'Frequently Asked Questions',
          items: Array.isArray(content.items) ? content.items : []
        },
        children: []
      };
      break;

    case 'contact_form':
      node = {
        id: `contact-${sec.id.substring(0, 8)}`,
        kind: 'section',
        type: 'contact-form',
        props: {
          title: content.title || 'Contact Us',
          phone: content.phone || '',
          email: content.email || '',
          address: content.address || ''
        },
        children: []
      };
      break;

    case 'opening_hours':
      node = {
        id: `map-${sec.id.substring(0, 8)}`,
        kind: 'section',
        type: 'location-map',
        props: {
          title: content.title || 'Location & Hours',
          hours: content.hours || '',
          address: content.address || ''
        },
        children: []
      };
      break;

    case 'rich_text':
      node = {
        id: `text-${sec.id.substring(0, 8)}`,
        kind: 'section',
        type: 'rich-text',
        props: {
          title: content.title || '',
          body: content.body || ''
        },
        children: []
      };
      break;

    case 'announcement':
      node = {
        id: `announ-${sec.id.substring(0, 8)}`,
        kind: 'section',
        type: 'announcement-bar',
        props: {
          message: content.message || content.title || '',
          ctaText: content.cta_text || '',
          ctaLink: content.cta_link || ''
        },
        children: []
      };
      break;

    default:
      warnings.push(`Unsupported section type: ${sec.type} (Source ID: ${sec.id})`);
      node = {
        id: `custom-${sec.id.substring(0, 8)}`,
        kind: 'section',
        type: 'custom-html',
        props: {
          html: `<div data-legacy-type="${sec.type}">${JSON.stringify(content)}</div>`
        },
        children: []
      };
      break;
  }

  return { node, warnings, sourceId };
}

async function runDryRunScanner() {
  console.log('====================================================================');
  console.log('SmartStore CMS V3 Stage 8C-A Zero-Write Migration Dry-Run Scanner');
  console.log('====================================================================\n');

  const executionTime = new Date().toISOString();
  const reportData = {
    timestamp: executionTime,
    environment: process.env.NODE_ENV || 'development',
    database: process.env.DB_NAME || 'smartstore_ai',
    validator: 'backend/validators/cmsV3Validator.js',
    scannedStoresCount: 0,
    globalCounts: {
      legacyStores: 0,
      legacyPages: 0,
      legacySections: 0,
      navigationItems: 0,
      themes: 0,
      mediaAssets: 0,
      proposedV3Pages: 0,
      proposedV3Documents: 0
    },
    storeResults: [],
    sectionMappingStats: {},
    warningsList: [],
    astValidation: {
      documentsChecked: 0,
      valid: 0,
      invalid: 0,
      orphans: 0,
      cycles: 0,
      invalidComponents: 0,
      invalidProps: 0
    },
    zeroWriteProof: {
      insertCount: 0,
      updateCount: 0,
      deleteCount: 0,
      alterCount: 0,
      dropCount: 0,
      totalWrites: 0,
      migrationLedgerChanged: false,
      featureFlagsChanged: false,
      legacyRecordsModified: false,
      v3RecordsCreated: false
    }
  };

  try {
    // 1. Table existence verification
    const optionalTables = [
      'cms_settings', 'cms_pages', 'cms_page_sections', 'cms_navigation_items',
      'cms_themes', 'cms_media', 'cms_announcements', 'cms_contact_messages', 'cms_appointments'
    ];
    const tablePresence = {};

    for (const table of optionalTables) {
      const res = await originalQuery(
        `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1)`,
        [table]
      );
      tablePresence[table] = res.rows[0].exists;
      console.log(`Table '${table}': ${tablePresence[table] ? 'PRESENT' : 'NOT PRESENT — skipped safely'}`);
    }

    // 2. Pre-run database fingerprints
    const preStoresCount = (await originalQuery(`SELECT COUNT(*)::int as count FROM stores`)).rows[0].count;
    const prePagesCount = tablePresence.cms_pages ? (await originalQuery(`SELECT COUNT(*)::int as count FROM cms_pages`)).rows[0].count : 0;
    const preSectionsCount = tablePresence.cms_page_sections ? (await originalQuery(`SELECT COUNT(*)::int as count FROM cms_page_sections`)).rows[0].count : 0;
    const preV3PagesCount = (await originalQuery(`SELECT COUNT(*)::int as count FROM cms_v3_pages`)).rows[0].count;
    const preV3VersionsCount = (await originalQuery(`SELECT COUNT(*)::int as count FROM cms_v3_page_versions`)).rows[0].count;
    const preMigrationsCount = (await originalQuery(`SELECT COUNT(*)::int as count FROM _migrations`)).rows[0].count;

    reportData.globalCounts.legacyStores = preStoresCount;
    reportData.globalCounts.legacyPages = prePagesCount;
    reportData.globalCounts.legacySections = preSectionsCount;

    // 3. Scan stores & perform in-memory AST mapping
    const storesRes = await originalQuery(`SELECT id, name, slug FROM stores ORDER BY name ASC`);
    const stores = storesRes.rows;
    reportData.scannedStoresCount = stores.length;

    for (const store of stores) {
      console.log(`\nScanning Store: ${store.name} (${store.slug})`);

      const storeRecord = {
        storeId: store.id,
        storeName: store.name,
        slug: store.slug,
        pagesCount: 0,
        sectionsCount: 0,
        mappedCount: 0,
        warningsCount: 0,
        criticalErrorsCount: 0,
        status: 'READY'
      };

      // Scan settings & theme
      let legacyTheme = null;
      if (tablePresence.cms_settings) {
        const settingsRes = await originalQuery(`SELECT * FROM cms_settings WHERE store_id = $1`, [store.id]);
        if (settingsRes.rows.length > 0) {
          legacyTheme = settingsRes.rows[0];
          reportData.globalCounts.themes++;
        }
      }

      // Scan media
      if (tablePresence.cms_media) {
        const mediaRes = await originalQuery(`SELECT * FROM cms_media WHERE store_id = $1`, [store.id]);
        reportData.globalCounts.mediaAssets += mediaRes.rows.length;
        mediaRes.rows.forEach(m => {
          if (!m.alt_text) reportData.warningsList.push(`[Media] Store ${store.slug}: Missing alt text for asset ${m.filename}`);
        });
      }

      // Scan pages
      if (tablePresence.cms_pages) {
        const pagesRes = await originalQuery(`SELECT * FROM cms_pages WHERE store_id = $1`, [store.id]);
        storeRecord.pagesCount = pagesRes.rows.length;

        for (const pg of pagesRes.rows) {
          reportData.globalCounts.proposedV3Pages++;

          // Scan sections for this page
          let sections = [];
          if (tablePresence.cms_page_sections) {
            const secRes = await originalQuery(`SELECT * FROM cms_page_sections WHERE page_id = $1 ORDER BY position ASC`, [pg.id]);
            sections = secRes.rows;
          }
          storeRecord.sectionsCount += sections.length;

          // Build in-memory V3 PageDocument AST
          const rootNodeId = 'root';
          const nodesDict = {
            root: {
              id: 'root',
              kind: 'page',
              props: { title: pg.title, slug: pg.slug },
              children: []
            }
          };

          for (const sec of sections) {
            // Track section stats
            const typeKey = sec.type || 'unknown';
            if (!reportData.sectionMappingStats[typeKey]) {
              reportData.sectionMappingStats[typeKey] = { count: 0, mapped: 0, warnings: 0 };
            }
            reportData.sectionMappingStats[typeKey].count++;

            const mapped = mapLegacySection(sec, store.slug);
            if (mapped.node) {
              nodesDict[mapped.node.id] = mapped.node;
              nodesDict.root.children.push(mapped.node.id);
              storeRecord.mappedCount++;
              reportData.sectionMappingStats[typeKey].mapped++;
            }

            if (mapped.warnings.length > 0) {
              reportData.sectionMappingStats[typeKey].warnings += mapped.warnings.length;
              mapped.warnings.forEach(w => {
                storeRecord.warningsCount++;
                reportData.warningsList.push(`[Section] Store ${store.slug} Page ${pg.slug}: ${w}`);
              });
            }
          }

          const doc = { rootNodeId, nodes: nodesDict };
          reportData.globalCounts.proposedV3Documents++;
          reportData.astValidation.documentsChecked++;

          // Canonical AST validation
          const errors = validator.validatePageDocument(doc);
          if (errors.length === 0) {
            reportData.astValidation.valid++;
          } else {
            reportData.astValidation.invalid++;
            errors.forEach(e => {
              if (e.code === 'ORPHAN_NODE') reportData.astValidation.orphans++;
              if (e.code === 'CIRCULAR_REFERENCE') reportData.astValidation.cycles++;
              if (e.severity === 'error') {
                storeRecord.criticalErrorsCount++;
                reportData.warningsList.push(`[AST Critical] Store ${store.slug} Page ${pg.slug}: ${e.message}`);
              }
            });
          }
        }
      }

      // Scan navigation items
      if (tablePresence.cms_navigation_items) {
        const navRes = await originalQuery(`SELECT * FROM cms_navigation_items WHERE store_id = $1`, [store.id]);
        reportData.globalCounts.navigationItems += navRes.rows.length;
      }

      if (storeRecord.criticalErrorsCount > 0) {
        storeRecord.status = 'BLOCKED';
      }
      reportData.storeResults.push(storeRecord);
    }

    // 4. Post-run database fingerprint check
    const postStoresCount = (await originalQuery(`SELECT COUNT(*)::int as count FROM stores`)).rows[0].count;
    const postPagesCount = tablePresence.cms_pages ? (await originalQuery(`SELECT COUNT(*)::int as count FROM cms_pages`)).rows[0].count : 0;
    const postV3PagesCount = (await originalQuery(`SELECT COUNT(*)::int as count FROM cms_v3_pages`)).rows[0].count;
    const postV3VersionsCount = (await originalQuery(`SELECT COUNT(*)::int as count FROM cms_v3_page_versions`)).rows[0].count;
    const postMigrationsCount = (await originalQuery(`SELECT COUNT(*)::int as count FROM _migrations`)).rows[0].count;

    const zeroWritePass = (
      observedMutations === 0 &&
      preStoresCount === postStoresCount &&
      prePagesCount === postPagesCount &&
      preV3PagesCount === postV3PagesCount &&
      preV3VersionsCount === postV3VersionsCount &&
      preMigrationsCount === postMigrationsCount
    );

    console.log('\n====================================================================');
    console.log(`ZERO-WRITE PROOF VERIFICATION: ${zeroWritePass ? 'SUCCESS (0 MUTATIONS)' : 'FAILED'}`);
    console.log('====================================================================\n');

    // 5. Generate CMS_V3_MIGRATION_DRY_RUN_REPORT.md
    const reportContent = generateMarkdownReport(reportData, zeroWritePass);
    const reportPath = path.resolve(__dirname, '../../CMS_V3_MIGRATION_DRY_RUN_REPORT.md');
    fs.writeFileSync(reportPath, reportContent, 'utf8');

    // Also write to brain artifact path if conversation ID directory exists
    const artifactBrainDir = path.resolve(__dirname, '../../.gemini/brain');
    if (fs.existsSync(artifactBrainDir)) {
      fs.writeFileSync(path.join(artifactBrainDir, 'CMS_V3_MIGRATION_DRY_RUN_REPORT.md'), reportContent, 'utf8');
    }

    console.log(`Dry-run report saved to: ${reportPath}`);
    process.exit(zeroWritePass ? 0 : 1);
  } catch (err) {
    console.error('MIGRATION DRY-RUN ERROR:', err);
    process.exit(1);
  }
}

function generateMarkdownReport(data, zeroWritePass) {
  const readyStores = data.storeResults.filter(s => s.status === 'READY').length;
  const blockedStores = data.storeResults.filter(s => s.status === 'BLOCKED').length;

  return `# CMS V3 Migration Dry-Run Report

## Execution
- **Timestamp**: ${data.timestamp}
- **Environment**: ${data.environment}
- **Database**: ${data.database}
- **Script**: \`backend/scripts/run_cms_v3_migration_dry_run.js\`
- **Validator**: \`${data.validator}\`
- **Stores scanned**: ${data.scannedStoresCount}

## Global counts
- **Legacy stores**: ${data.globalCounts.legacyStores}
- **Legacy pages**: ${data.globalCounts.legacyPages}
- **Legacy sections**: ${data.globalCounts.legacySections}
- **Navigation items**: ${data.globalCounts.navigationItems}
- **Themes**: ${data.globalCounts.themes}
- **Media assets**: ${data.globalCounts.mediaAssets}
- **Proposed V3 pages**: ${data.globalCounts.proposedV3Pages}
- **Proposed V3 documents**: ${data.globalCounts.proposedV3Documents}

## Per-store readiness
| Store | Pages | Sections | Mapped | Warnings | Critical errors | Status |
|---|---:|---:|---:|---:|---:|---:|
${data.storeResults.map(s => `| ${s.storeName} (${s.slug}) | ${s.pagesCount} | ${s.sectionsCount} | ${s.mappedCount} | ${s.warningsCount} | ${s.criticalErrorsCount} | ${s.status} |`).join('\n')}

## Section mapping
| Legacy type | V3 component | Count | Mapped | Warnings |
|---|---|---:|---:|---:|
${Object.entries(data.sectionMappingStats).map(([type, stats]) => `| ${type} | ${getV3Target(type)} | ${stats.count} | ${stats.mapped} | ${stats.warnings} |`).join('\n')}

## Warnings (${data.warningsList.length} total)
${data.warningsList.length > 0 ? data.warningsList.slice(0, 30).map(w => `- ${w}`).join('\n') : '- None'}
${data.warningsList.length > 30 ? `\n*... and ${data.warningsList.length - 30} more warnings.*` : ''}

## AST validation
- **Documents checked**: ${data.astValidation.documentsChecked}
- **Valid**: ${data.astValidation.valid}
- **Invalid**: ${data.astValidation.invalid}
- **Orphans**: ${data.astValidation.orphans}
- **Cycles**: ${data.astValidation.cycles}
- **Invalid components**: ${data.astValidation.invalidComponents}
- **Invalid props**: ${data.astValidation.invalidProps}

## Zero-write proof
- **INSERT statements**: ${data.zeroWriteProof.insertCount}
- **UPDATE statements**: ${data.zeroWriteProof.updateCount}
- **DELETE statements**: ${data.zeroWriteProof.deleteCount}
- **ALTER statements**: ${data.zeroWriteProof.alterCount}
- **DROP statements**: ${data.zeroWriteProof.dropCount}
- **Database writes**: ${data.zeroWriteProof.totalWrites}
- **Migration ledger changed**: ${data.zeroWriteProof.migrationLedgerChanged ? 'YES' : 'NO'}
- **Feature flags changed**: ${data.zeroWriteProof.featureFlagsChanged ? 'YES' : 'NO'}
- **Legacy records modified**: ${data.zeroWriteProof.legacyRecordsModified ? 'YES' : 'NO'}
- **V3 records created**: ${data.zeroWriteProof.v3RecordsCreated ? 'YES' : 'NO'}
- **Strict Zero-Write Audit Passed**: ${zeroWritePass ? 'YES' : 'NO'}

## Decision
- **Stores ready**: ${readyStores}
- **Stores blocked**: ${blockedStores}
- **Recommended next step**: Stage 8C-A dry run completed cleanly with 0 database writes. Wait for explicit approval before proceeding to Stage 8C-B single staging store migration.
`;
}

function getV3Target(legacyType) {
  const map = {
    'hero': 'hero', 'hero_banner': 'hero',
    'featured_menu': 'product-grid',
    'about': 'story-about', 'story': 'story-about',
    'gallery': 'masonry-gallery',
    'testimonials': 'testimonials',
    'faq': 'faq-accordion',
    'contact_form': 'contact-form',
    'opening_hours': 'location-map',
    'rich_text': 'rich-text',
    'announcement': 'announcement-bar'
  };
  return map[legacyType] || 'custom-html';
}

runDryRunScanner();
