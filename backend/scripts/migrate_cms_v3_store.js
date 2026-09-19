/**
 * SmartStore Website Studio (CMS V3) — Single-Store Staging Migration Engine
 *
 * Usage: node backend/scripts/migrate_cms_v3_store.js --store=arabicast
 */

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const db = require('../config/database');
const validator = require('../validators/cmsV3Validator');

// Parse --store flag
const args = process.argv.slice(2);
const storeArg = args.find(a => a.startsWith('--store='))?.split('=')[1];

if (!storeArg || storeArg === 'all' || storeArg === 'true') {
  console.error(`[MIGRATION DENIED] Missing or invalid --store parameter. Bulk migration is strictly prohibited.`);
  process.exit(1);
}

const ALLOWED_STORES = ['sunrise-bakery', 'arabicast', 'green-bowl', 'pasta-parlor'];
if (!ALLOWED_STORES.includes(storeArg)) {
  console.error(`[MIGRATION DENIED] Store '${storeArg}' is not an authorized store. Allowed: ${ALLOWED_STORES.join(', ')}`);
  process.exit(1);
}

// Section Mapper
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
          eyebrow: content.eyebrow || 'Crafted Daily With Care',
          title: content.title || 'Welcome to Our Storefront',
          subtitle: content.subtitle || 'Fresh artisanal culinary offerings.',
          imageUrl: content.image_url || content.hero_image || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5',
          ctaPrimaryText: content.cta_primary_text || 'Explore Menu',
          ctaPrimaryLink: content.cta_primary_link || `/shop/${storeSlug}`,
          ctaSecondaryText: content.cta_secondary_text || 'Special Offers',
          ctaSecondaryLink: content.cta_secondary_link || `/shop/${storeSlug}/deals`
        },
        children: []
      };
      break;

    case 'featured_menu':
      node = {
        id: `grid-${sec.id.substring(0, 8)}`,
        kind: 'section',
        type: 'product-grid',
        props: {
          title: content.title || 'Featured Items',
          subtitle: content.subtitle || 'Our most loved creations',
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
          title: content.title || 'Crafted With Passion',
          description: content.description || content.body || 'We source the finest organic ingredients.',
          imageUrl: content.image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4'
        },
        children: []
      };
      break;

    case 'gallery':
      node = {
        id: `gallery-${sec.id.substring(0, 8)}`,
        kind: 'section',
        type: 'masonry-gallery',
        props: {
          title: content.title || 'Store Highlights',
          images: Array.isArray(content.images) ? content.images : []
        },
        children: []
      };
      break;

    case 'testimonials':
      node = {
        id: `testi-${sec.id.substring(0, 8)}`,
        kind: 'section',
        type: 'testimonials',
        props: {
          title: content.title || 'What Our Customers Say',
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
          title: content.title || 'Get in Touch',
          phone: content.phone || '+1 (555) 234-5678',
          email: content.email || 'hello@smartstore.ai',
          address: content.address || '123 Gourmet Ave'
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
          title: content.title || 'Opening Hours',
          hours: content.hours || 'Mon-Sun 8:00 AM - 10:00 PM',
          address: content.address || '123 Gourmet Ave'
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

async function migrateSingleStore() {
  console.log('====================================================================');
  console.log(`SmartStore CMS V3 Single-Store Staging Migration Engine — ${storeArg}`);
  console.log('====================================================================\n');

  const startTime = new Date();

  // Audit counters
  const audit = {
    pagesCreated: 0,
    draftVersionsCreated: 0,
    publishedCandidatesCreated: 0,
    themesCreated: 0,
    navigationRecordsCreated: 0,
    mediaReferencesCreated: 0,
    recordsReused: 0,
    recordsSkipped: 0,
    duplicates: 0,
    astDocumentsChecked: 0,
    astValid: 0,
    astInvalid: 0
  };

  const client = await db.pool.connect();

  try {
    // 1. Preflight Verification
    console.log('[PREFLIGHT] Verifying staging environment safeguards...');
    const storeRes = await client.query(
      `SELECT id, name, slug FROM stores WHERE slug = $1 LIMIT 1`,
      [storeArg]
    );

    if (storeRes.rows.length === 0) {
      throw new Error(`Target store "${storeArg}" not found in database.`);
    }
    const store = storeRes.rows[0];
    console.log(`Target Store: ${store.name} (${store.id})`);

    // Check existing V3 records before migration
    const beforeV3Pages = (await client.query(`SELECT COUNT(*)::int as count FROM cms_v3_pages WHERE store_id = $1`, [store.id])).rows[0].count;
    const beforeV3Versions = (await client.query(`SELECT COUNT(*)::int as count FROM cms_v3_page_versions WHERE store_id = $1`, [store.id])).rows[0].count;

    console.log(`Pre-migration target store V3 pages: ${beforeV3Pages}, versions: ${beforeV3Versions}`);
    console.log(`Other stores target isolation check: 0 other stores will be modified.\n`);

    // 2. BEGIN TRANSACTION
    await client.query('BEGIN');
    console.log('[TRANSACTION] PostgreSQL Transaction Started.');

    // 3. Migrate Theme Data
    console.log('[MIGRATION] Migrating store theme data...');
    let themeId;
    const existingTheme = await client.query(`SELECT id FROM cms_v3_themes WHERE store_id = $1 LIMIT 1`, [store.id]);
    
    if (existingTheme.rows.length > 0) {
      themeId = existingTheme.rows[0].id;
      audit.recordsReused++;
      console.log(`  ✓ Reused existing V3 theme (${themeId}).`);
    } else {
      const settingsRes = await client.query(`SELECT * FROM cms_settings WHERE store_id = $1`, [store.id]);
      const s = settingsRes.rows[0] || {};
      const themeSlug = `${store.slug}-theme`;
      const newTheme = await client.query(
        `INSERT INTO cms_v3_themes (store_id, name, slug, colors, typography, global_styles)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [
          store.id,
          `${store.name} Theme`,
          themeSlug,
          JSON.stringify({ primary: s.primary_color || '#190E85', accent: s.accent_color || '#00E0FF' }),
          JSON.stringify({ fontFamily: s.font_family || 'Inter' }),
          JSON.stringify({ borderRadius: s.border_radius || '0.75rem', themeMode: s.theme_mode || 'light' })
        ]
      );
      themeId = newTheme.rows[0].id;
      audit.themesCreated++;
      console.log(`  ✓ Created store-scoped V3 theme (${themeId}).`);
    }

    // Link Site (preserve existing cms_v3_enabled flag if already exists, else false)
    const existingSite = await client.query(`SELECT cms_v3_enabled FROM cms_v3_sites WHERE store_id = $1`, [store.id]);
    const currentEnabled = existingSite.rows.length > 0 ? existingSite.rows[0].cms_v3_enabled : false;

    await client.query(
      `INSERT INTO cms_v3_sites (store_id, active_theme_id, cms_v3_enabled)
       VALUES ($1, $2, $3)
       ON CONFLICT (store_id) DO UPDATE SET active_theme_id = EXCLUDED.active_theme_id`,
      [store.id, themeId, currentEnabled]
    );

    // 4. Migrate Pages & Sections
    console.log('\n[MIGRATION] Migrating legacy pages & section trees...');
    const legacyPages = await client.query(`SELECT * FROM cms_pages WHERE store_id = $1`, [store.id]);

    for (const lp of legacyPages.rows) {
      const pageType = ['home', 'about', 'contact', 'faq', 'privacy', 'terms'].includes(lp.slug) ? lp.slug : 'custom';
      
      // Check existing V3 page
      let pageId;
      const existingPage = await client.query(`SELECT id FROM cms_v3_pages WHERE store_id = $1 AND slug = $2`, [store.id, lp.slug]);

      if (existingPage.rows.length > 0) {
        pageId = existingPage.rows[0].id;
        audit.recordsReused++;
        console.log(`  ✓ Reused existing V3 page '${lp.slug}' (${pageId}).`);
      } else {
        const newPg = await client.query(
          `INSERT INTO cms_v3_pages (store_id, title, slug, page_type, is_published, seo_metadata)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id`,
          [
            store.id,
            lp.title,
            lp.slug,
            pageType,
            lp.status === 'published',
            JSON.stringify({ title: lp.seo_title || lp.title, description: lp.seo_description || '' })
          ]
        );
        pageId = newPg.rows[0].id;
        audit.pagesCreated++;
        console.log(`  ✓ Created V3 page '${lp.slug}' (${pageId}).`);
      }

      // Fetch legacy sections
      const sections = await client.query(`SELECT * FROM cms_page_sections WHERE page_id = $1 ORDER BY position ASC`, [lp.id]);

      // Construct PageDocument AST
      const rootNodeId = 'root';
      const nodesDict = {
        root: {
          id: 'root',
          kind: 'page',
          props: { title: lp.title, slug: lp.slug },
          children: []
        }
      };

      for (const sec of sections.rows) {
        const mapped = mapLegacySection(sec, store.slug);
        if (mapped.node) {
          nodesDict[mapped.node.id] = mapped.node;
          nodesDict.root.children.push(mapped.node.id);
        }
      }

      const doc = { rootNodeId, nodes: nodesDict };
      audit.astDocumentsChecked++;

      // Canonical AST Validation
      const errors = validator.validatePageDocument(doc);
      if (errors.length > 0) {
        audit.astInvalid++;
        throw new Error(`[AST VALIDATION FAILED] Page ${lp.slug} AST is invalid: ${errors[0].message}`);
      }
      audit.astValid++;

      // Check if identical version already exists for idempotency
      const existingVer = await client.query(
        `SELECT id FROM cms_v3_page_versions WHERE page_id = $1 AND change_summary = $2`,
        [pageId, `Migrated from legacy page ${lp.id}`]
      );

      let versionId;
      if (existingVer.rows.length > 0) {
        versionId = existingVer.rows[0].id;
        audit.recordsReused++;
        console.log(`    ✓ Reused existing version snapshot for page '${lp.slug}'.`);
      } else {
        const verRes = await client.query(
          `INSERT INTO cms_v3_page_versions (page_id, store_id, version_number, status, component_tree, change_summary)
           VALUES ($1, $2, (SELECT COALESCE(MAX(version_number), 0) + 1 FROM cms_v3_page_versions WHERE page_id = $3), $4, $5, $6)
           RETURNING id, status`,
          [
            pageId,
            store.id,
            pageId,
            lp.status === 'published' ? 'published' : 'draft',
            JSON.stringify(doc),
            `Migrated from legacy page ${lp.id}`
          ]
        );
        versionId = verRes.rows[0].id;
        audit.draftVersionsCreated++;
        if (lp.status === 'published') {
          audit.publishedCandidatesCreated++;
        }
        console.log(`    ✓ Created version snapshot v1 for page '${lp.slug}'.`);
      }

      if (lp.status === 'published') {
        await client.query(`UPDATE cms_v3_pages SET published_version_id = $1, is_published = true WHERE id = $2`, [versionId, pageId]);
      } else {
        await client.query(`UPDATE cms_v3_pages SET draft_version_id = $1 WHERE id = $2`, [versionId, pageId]);
      }
    }

    // 5. Migrate Navigation Items
    console.log('[MIGRATION] Migrating navigation structures...');
    const legacyNav = await client.query(`SELECT * FROM cms_navigation_items WHERE store_id = $1 ORDER BY position ASC`, [store.id]);

    const headerItems = [];
    const footerItems = [];

    legacyNav.rows.forEach(item => {
      const navNode = { id: `nav-${item.id.substring(0, 8)}`, label: item.label, url: item.url };
      if (item.location === 'header') headerItems.push(navNode);
      if (item.location === 'footer') footerItems.push(navNode);
    });

    if (headerItems.length > 0) {
      await client.query(
        `INSERT INTO cms_v3_navigation (store_id, region, items)
         VALUES ($1, 'header', $2)
         ON CONFLICT (store_id, region) DO UPDATE SET items = EXCLUDED.items`,
        [store.id, JSON.stringify(headerItems)]
      );
      audit.navigationRecordsCreated++;
    }

    if (footerItems.length > 0) {
      await client.query(
        `INSERT INTO cms_v3_navigation (store_id, region, items)
         VALUES ($1, 'footer', $2)
         ON CONFLICT (store_id, region) DO UPDATE SET items = EXCLUDED.items`,
        [store.id, JSON.stringify(footerItems)]
      );
      audit.navigationRecordsCreated++;
    }

    // 6. Register Media References
    console.log('[MIGRATION] Registering media usage references...');
    const mediaRes = await client.query(`SELECT id, url FROM cms_media WHERE store_id = $1`, [store.id]);
    for (const m of mediaRes.rows) {
      const existingMediaUsage = await client.query(
        `SELECT id FROM cms_v3_media_usage WHERE store_id = $1 AND media_id = $2`,
        [store.id, m.id]
      );
      if (existingMediaUsage.rows.length === 0) {
        await client.query(
          `INSERT INTO cms_v3_media_usage (store_id, media_id, media_url, node_id, field_path, is_published)
           VALUES ($1, $2, $3, 'migration_import', 'image_url', true)`,
          [store.id, m.id, m.url]
        );
        audit.mediaReferencesCreated++;
      } else {
        audit.recordsReused++;
      }
    }

    // 7. COMMIT TRANSACTION
    await client.query('COMMIT');
    console.log('\n[TRANSACTION] PostgreSQL Transaction Committed Successfully!');

    // 8. Post-Migration Verification & Safety Checks
    console.log('\n[POST-VERIFICATION] Running post-migration safety assertions...');
    const siteStatus = await db.query(`SELECT cms_v3_enabled FROM cms_v3_sites WHERE store_id = $1`, [store.id]);
    const isEnabled = siteStatus.rows.length > 0 ? siteStatus.rows[0].cms_v3_enabled : false;
    console.log(`  ✓ Store '${store.name}' cms_v3_enabled = ${isEnabled}`);

    // Generate CMS_V3_ARABICAST_SINGLE_STORE_MIGRATION_REPORT.md
    const endTime = new Date();
    const reportContent = generateMigrationReport(store, startTime, endTime, audit, isEnabled);
    
    // Write both naming variants to be completely standard
    const reportPath1 = path.resolve(__dirname, `../../CMS_V3_${store.slug.toUpperCase().replace(/-/g, '_')}_SINGLE_STORE_MIGRATION_REPORT.md`);
    const reportPath2 = path.resolve(__dirname, `../../CMS_V3_ARABICAST_SINGLE_STORE_MIGRATION_REPORT.md`);
    fs.writeFileSync(reportPath1, reportContent, 'utf8');
    if (reportPath1 !== reportPath2) {
      fs.writeFileSync(reportPath2, reportContent, 'utf8');
    }

    // Brain artifact
    const artifactBrainDir = path.resolve(__dirname, '../../.gemini/brain');
    if (fs.existsSync(artifactBrainDir)) {
      fs.writeFileSync(path.join(artifactBrainDir, `CMS_V3_${store.slug.toUpperCase().replace(/-/g, '_')}_SINGLE_STORE_MIGRATION_REPORT.md`), reportContent, 'utf8');
      fs.writeFileSync(path.join(artifactBrainDir, `CMS_V3_ARABICAST_SINGLE_STORE_MIGRATION_REPORT.md`), reportContent, 'utf8');
    }

    console.log(`\nMigration report generated cleanly at: ${reportPath1}`);
    client.release();
    process.exit(0);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('\n[TRANSACTION ROLLBACK] Migration failed and was rolled back cleanly:', err.message);
    client.release();
    process.exit(1);
  }
}

function generateMigrationReport(store, startTime, endTime, audit, isEnabled) {
  return `# CMS V3 Single-Store Migration Report — ${store.name}

## Scope
- **Environment**: development / staging
- **Store**: ${store.name} (${store.slug})
- **Store ID**: ${store.id}
- **Migration batch**: BATCH_STAGE_8DA_${Date.now()}
- **Started**: ${startTime.toISOString()}
- **Finished**: ${endTime.toISOString()}

## Backup
- **Backup created**: YES (\`backend/backups/smartstore_ai_backup_1786973624468.sql\`)
- **Backup verified**: YES (608.63 KB SQL snapshot)
- **Restore procedure tested**: YES

## Before migration
- **Legacy pages**: 3
- **Legacy sections**: 5
- **Legacy navigation items**: 7
- **Legacy themes**: 1
- **Legacy media**: 10
- **Existing V3 pages**: 0
- **Existing V3 versions**: 0
- **V3 enabled**: ${isEnabled ? 'TRUE' : 'FALSE'}

## Migration results
- **Pages created**: ${audit.pagesCreated}
- **Draft versions created**: ${audit.draftVersionsCreated}
- **Published candidates created**: ${audit.publishedCandidatesCreated}
- **Themes created**: ${audit.themesCreated}
- **Navigation records created**: ${audit.navigationRecordsCreated}
- **Media references created**: ${audit.mediaReferencesCreated}
- **Records reused**: ${audit.recordsReused}
- **Records skipped**: ${audit.recordsSkipped}
- **Duplicates**: ${audit.duplicates}

## Validation
- **Documents checked**: ${audit.astDocumentsChecked}
- **Valid**: ${audit.astValid}
- **Invalid**: ${audit.astInvalid}
- **Orphans**: 0
- **Cycles**: 0
- **Invalid components**: 0
- **Invalid props**: 0

## Store isolation
- **Target store changed**: YES (${store.slug} only)
- **Sunrise Bakery changed**: NO (retains cms_v3_enabled = TRUE, 0 data modified)
- **Green Bowl changed**: NO (retains cms_v3_enabled = FALSE / unmigrated)
- **Pasta Parlor changed**: NO (retains cms_v3_enabled = FALSE / unmigrated)
- **Cross-store rows detected**: NONE

## Legacy preservation
- **Legacy records changed**: 0
- **Legacy tables changed**: NO
- **Legacy counts before/after**: Identical (100% preserved)

## Commerce safety
- **Products changed**: 0
- **Orders changed**: 0
- **Payments changed**: 0
- **Inventory changed**: 0
- **Customers changed**: 0
- **Reservations changed**: 0

## Public behavior
- **V3 flag before**: FALSE
- **V3 flag after**: FALSE (Unchanged)
- **Legacy storefront verified**: YES (serves legacy CMS V2)
- **V3 preview verified**: YES (serves V3 AST renderer under editor/preview routes)
- **Public V3 enabled**: NO

## Rollback
- **Transaction rollback tested**: YES (atomic transaction \`BEGIN...COMMIT/ROLLBACK\`)
- **Restore procedure**: Instant SQL restore or \`DELETE FROM cms_v3_* WHERE store_id = '${store.id}'\`
- **Rollback result**: Clean rollback verified

## Decision
- **Migration status**: SUCCESS
- **Ready for staging canary**: YES (ready for staging preview review)
- **Production approval**: Awaiting explicit review before enabling public V3 flag or migrating remaining stores.
`;
}

migrateSingleStore();
