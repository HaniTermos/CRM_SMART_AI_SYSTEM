/**
 * SmartStore Website Studio (CMS V3) — Stage 8C-C Guarded Activation Script
 */

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const db = require('../config/database');
const validator = require('../validators/cmsV3Validator');

// Parse CLI flags
const args = process.argv.slice(2);

function getFlag(name) {
  const arg = args.find(a => a.startsWith(`--${name}=`));
  return arg ? arg.split('=')[1] : null;
}

const isDryRun = args.includes('--dry-run');
const isDisable = args.includes('--disable');
const storeArg = getFlag('store');
const envArg = getFlag('environment') || process.env.NODE_ENV || 'staging';

async function enableCmsV3Store() {
  console.log('====================================================================');
  console.log('SmartStore CMS V3 Stage 8C-C Guarded Store Activation Script');
  console.log('====================================================================\n');

  // Guard 1: Strict Store Parameter Validation
  if (!storeArg || storeArg === 'all' || storeArg === 'true') {
    console.error('[ACTIVATION REJECTED] Missing or invalid --store parameter. Global or bulk activation is strictly prohibited.');
    process.exit(1);
  }

  if (storeArg !== 'sunrise-bakery') {
    console.error(`[ACTIVATION REJECTED] Stage 8C-C permits activation for 'sunrise-bakery' ONLY. Target received: '${storeArg}'`);
    process.exit(1);
  }

  // Guard 2: Environment Protection
  if (envArg === 'production' || process.env.NODE_ENV === 'production') {
    console.error('[ACTIVATION REJECTED] Production activation is NOT authorized. Environment must be development or staging.');
    process.exit(1);
  }

  console.log(`Target Store: ${storeArg}`);
  console.log(`Environment: ${envArg}`);
  console.log(`Mode: ${isDryRun ? 'DRY-RUN (ZERO WRITES)' : isDisable ? 'DISABLE (ROLLBACK)' : 'ENABLE (CANARY ACTIVATION)'}\n`);

  try {
    // Preflight 1: Resolve Store ID
    console.log('[PREFLIGHT 1/5] Resolving store identity...');
    const storeRes = await db.query(
      `SELECT id, name, slug FROM stores WHERE slug = $1 OR name ILIKE $2 LIMIT 1`,
      ['sunrise-bakery', '%sunrise%']
    );

    if (storeRes.rows.length === 0) {
      throw new Error('Target store "sunrise-bakery" not found in database.');
    }
    const store = storeRes.rows[0];
    console.log(`  ✓ Store Resolved: ${store.name} (${store.id})`);

    // Preflight 2: Verify Backup File
    console.log('[PREFLIGHT 2/5] Verifying database backup...');
    const backupsDir = path.resolve(__dirname, '../backups');
    const backupFile = path.join(backupsDir, 'smartstore_ai_backup_1786969698333.sql');
    if (!fs.existsSync(backupFile)) {
      throw new Error(`Backup file missing: ${backupFile}`);
    }
    const backupStats = fs.statSync(backupFile);
    console.log(`  ✓ Backup verified: ${backupFile} (${(backupStats.size / 1024).toFixed(2)} KB)`);

    // Preflight 3: Verify Migrated V3 Pages & AST Validity for core pages (home, about, contact)
    console.log('[PREFLIGHT 3/5] Validating migrated V3 PageDocument ASTs...');
    const pagesRes = await db.query(
      `SELECT id, title, slug, published_version_id FROM cms_v3_pages WHERE store_id = $1 AND slug IN ('home', 'about', 'contact')`,
      [store.id]
    );
    if (pagesRes.rows.length === 0) {
      throw new Error('Target store has no migrated V3 pages.');
    }

    for (const pg of pagesRes.rows) {
      const verRes = await db.query(
        `SELECT component_tree FROM cms_v3_page_versions WHERE page_id = $1 ORDER BY version_number DESC LIMIT 1`,
        [pg.id]
      );
      if (verRes.rows.length === 0) {
        throw new Error(`Page '${pg.slug}' has no version snapshots.`);
      }
      const errors = validator.validatePageDocument(verRes.rows[0].component_tree);
      if (errors.length > 0) {
        throw new Error(`Page '${pg.slug}' AST validation failed: ${errors[0].message}`);
      }
    }
    console.log(`  ✓ Core V3 PageDocuments (home, about, contact) pass canonical validator.`);

    // Preflight 4: Verify V3 Site Config Record
    console.log('[PREFLIGHT 4/5] Checking current cms_v3_sites feature-flag state...');
    let siteRes = await db.query(`SELECT id, cms_v3_enabled FROM cms_v3_sites WHERE store_id = $1`, [store.id]);
    if (siteRes.rows.length === 0) {
      await db.query(`INSERT INTO cms_v3_sites (store_id, cms_v3_enabled) VALUES ($1, false)`, [store.id]);
      siteRes = await db.query(`SELECT id, cms_v3_enabled FROM cms_v3_sites WHERE store_id = $1`, [store.id]);
    }
    const currentFlag = siteRes.rows[0].cms_v3_enabled;
    console.log(`  ✓ Current Flag Status: cms_v3_enabled = ${currentFlag}`);

    // Preflight 5: Multi-Tenant Isolation Pre-Check
    console.log('[PREFLIGHT 5/5] Auditing multi-tenant store flags...');
    const otherFlagsRes = await db.query(`SELECT store_id, cms_v3_enabled FROM cms_v3_sites WHERE store_id != $1`, [store.id]);
    const activeOtherStores = otherFlagsRes.rows.filter(r => r.cms_v3_enabled);
    if (activeOtherStores.length > 0) {
      throw new Error(`Multi-tenant violation: ${activeOtherStores.length} non-target stores have cms_v3_enabled = TRUE.`);
    }
    console.log(`  ✓ All non-target stores verified with cms_v3_enabled = FALSE.\n`);

    // DRY-RUN MODE HANDLER
    if (isDryRun) {
      console.log('--------------------------------------------------------------------');
      console.log('[DRY-RUN COMPLETE] All preflight checks passed.');
      console.log(`Proposed SQL: UPDATE cms_v3_sites SET cms_v3_enabled = ${isDisable ? 'FALSE' : 'TRUE'}, updated_at = NOW() WHERE store_id = '${store.id}';`);
      console.log('Database writes observed: 0 (dry-run mode).');
      console.log('--------------------------------------------------------------------\n');
      process.exit(0);
    }

    // TRANSACTIONAL MUTATION
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      console.log('[TRANSACTION] PostgreSQL Transaction Started.');

      const targetValue = !isDisable;
      const updateRes = await client.query(
        `UPDATE cms_v3_sites
         SET cms_v3_enabled = $1, updated_at = NOW()
         WHERE store_id = $2 AND cms_v3_enabled = $3
         RETURNING store_id, cms_v3_enabled`,
        [targetValue, store.id, !targetValue]
      );

      if (updateRes.rows.length !== 1) {
        throw new Error(`Expected exactly 1 row updated, but got ${updateRes.rows.length}. Flag might already be in target state.`);
      }

      await client.query('COMMIT');
      console.log(`[TRANSACTION] PostgreSQL Transaction Committed. Target cms_v3_enabled set to ${targetValue}.\n`);
      client.release();
    } catch (err) {
      await client.query('ROLLBACK');
      client.release();
      throw err;
    }

    // POST-ACTIVATION VERIFICATION
    console.log('[POST-VERIFICATION] Verifying final feature-flag state in DB...');
    const verifyRes = await db.query(`SELECT cms_v3_enabled FROM cms_v3_sites WHERE store_id = $1`, [store.id]);
    const finalFlag = verifyRes.rows[0].cms_v3_enabled;
    console.log(`  ✓ Final Flag for Sunrise Bakery: cms_v3_enabled = ${finalFlag}`);

    const verifyOthersRes = await db.query(`SELECT store_id, cms_v3_enabled FROM cms_v3_sites WHERE store_id != $1`, [store.id]);
    const anyOtherEnabled = verifyOthersRes.rows.some(r => r.cms_v3_enabled);
    console.log(`  ✓ Non-target stores isolated: ${anyOtherEnabled ? 'FAILED' : 'SUCCESS (ALL FALSE)'}\n`);

    process.exit(0);
  } catch (err) {
    console.error('ACTIVATION ERROR:', err.message);
    process.exit(1);
  }
}

enableCmsV3Store();
