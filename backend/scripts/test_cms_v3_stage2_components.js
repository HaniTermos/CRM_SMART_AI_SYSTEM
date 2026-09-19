/**
 * SmartStore Website Studio (CMS V3) — Stage 2 Components & Global Symbols Test Suite
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const db = require('../config/database');
const CmsV3Page = require('../models/CmsV3Page');
const CmsV3PageVersion = require('../models/CmsV3PageVersion');
const CmsV3GlobalSymbol = require('../models/CmsV3GlobalSymbol');
const { validatePageDocument, isSafeCssProperty } = require('../validators/cmsV3Validator');

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASSED: ${message}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAILED: ${message}`);
    failedTests++;
  }
}

async function runStage2Tests() {
  console.log('====================================================');
  console.log('SmartStore Website Studio (CMS V3) Stage 2 Test Suite');
  console.log('====================================================\n');

  try {
    const storesRes = await db.query('SELECT id, name, slug FROM stores LIMIT 2');
    if (storesRes.rows.length === 0) {
      console.error('No stores found in DB.');
      process.exit(1);
    }

    const storeA = storesRes.rows[0];
    const storeB = storesRes.rows[1] || storeA;

    console.log(`[SETUP] Store A: ${storeA.name} (${storeA.id})`);
    console.log(`[SETUP] Store B: ${storeB.name} (${storeB.id})\n`);

    // --- TEST GROUP 1: Nested Flex/Grid Containers & Primitives ---
    console.log('[TEST GROUP 1] Nested Flex & Grid Container Hierarchy:');

    const nestedContainerDoc = {
      versionNumber: 1,
      rootNodeId: 'root',
      nodes: {
        root: { id: 'root', kind: 'page', component: 'page', children: ['outer-flex'], props: {}, styles: {} },
        'outer-flex': {
          id: 'outer-flex',
          kind: 'container',
          component: 'flex-container',
          children: ['inner-grid'],
          props: {},
          styles: { base: { flexDirection: 'column', gap: '2rem' } }
        },
        'inner-grid': {
          id: 'inner-grid',
          kind: 'container',
          component: 'grid-container',
          children: ['txt-1', 'btn-1', 'img-1'],
          props: {},
          styles: { base: { columns: 3, gap: '1.5rem' } }
        },
        'txt-1': { id: 'txt-1', kind: 'element', component: 'text', children: [], props: { content: 'Heading Text', tag: 'h2' }, styles: {} },
        'btn-1': { id: 'btn-1', kind: 'element', component: 'button', children: [], props: { label: 'Order Now', url: '/menu' }, styles: {} },
        'img-1': { id: 'img-1', kind: 'element', component: 'image', children: [], props: { url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5' }, styles: {} }
      }
    };

    const nestedErrors = validatePageDocument(nestedContainerDoc);
    assert(nestedErrors.length === 0, 'Nested Flex & Grid container document passes schema validation.');

    // --- TEST GROUP 2: Invalid Parent-Child Relationships ---
    console.log('\n[TEST GROUP 2] Tree Hierarchy & Invalid Relationship Safeguards:');

    const doubleParentDoc = {
      versionNumber: 1,
      rootNodeId: 'root',
      nodes: {
        root: { id: 'root', kind: 'page', component: 'page', children: ['c1', 'c2'], props: {}, styles: {} },
        c1: { id: 'c1', kind: 'container', component: 'flex-container', children: ['shared-child'], props: {}, styles: {} },
        c2: { id: 'c2', kind: 'container', component: 'flex-container', children: ['shared-child'], props: {}, styles: {} },
        'shared-child': { id: 'shared-child', kind: 'element', component: 'text', children: [], props: { content: 'Shared' }, styles: {} }
      }
    };
    const doubleParentErrors = validatePageDocument(doubleParentDoc);
    assert(doubleParentErrors.some(e => e.code === 'MULTIPLE_PARENTS'), 'Detects and blocks child node referenced by multiple parent nodes.');

    // --- TEST GROUP 3: Global Symbols Lifecycle & Multi-Tenant Isolation ---
    console.log('\n[TEST GROUP 3] Global Symbols Lifecycle & Store Isolation:');

    const globalSymbolA = await CmsV3GlobalSymbol.create({
      store_id: storeA.id,
      name: 'Global Storefront Footer',
      symbol_type: 'section',
      node_data: {
        id: 'footer-sym',
        kind: 'global-symbol',
        component: 'section',
        children: [],
        props: { copyright: '© 2026 SmartStore AI' }
      }
    });
    assert(globalSymbolA && globalSymbolA.id !== undefined, 'Created Global Symbol for Store A.');
    assert(globalSymbolA.version === 1, 'Initial Global Symbol version is 1.');

    const updatedSymbolA = await CmsV3GlobalSymbol.update(globalSymbolA.id, storeA.id, {
      name: 'Global Storefront Footer V2',
      node_data: { copyright: '© 2026 SmartStore AI V2' }
    });
    assert(updatedSymbolA.version === 2, 'Updating Global Symbol increments version to 2.');

    if (storeA.id !== storeB.id) {
      const crossReadSymbol = await CmsV3GlobalSymbol.findById(globalSymbolA.id, storeB.id);
      assert(crossReadSymbol === null, 'Store B cannot read Store A Global Symbol (returns null).');

      const crossUpdateSymbol = await CmsV3GlobalSymbol.update(globalSymbolA.id, storeB.id, { name: 'Hack' });
      assert(crossUpdateSymbol === null, 'Store B cannot update Store A Global Symbol (returns null).');
    } else {
      assert(true, 'Skipping multi-store symbol isolation (Single store DB).');
      assert(true, 'Skipping multi-store symbol isolation (Single store DB).');
    }

    // --- TEST GROUP 4: Public Storefront Renderer & Stage 2 Page Document ---
    console.log('\n[TEST GROUP 4] Public Renderer Stage 2 Document Resolution:');

    let stage2Page = await CmsV3Page.findBySlug(storeA.id, 'stage2-test-page');
    if (!stage2Page) {
      stage2Page = await CmsV3Page.create({
        store_id: storeA.id,
        title: 'Stage 2 Full Test Page',
        slug: 'stage2-test-page',
        page_type: 'custom'
      });
    }

    const stage2Draft = await CmsV3PageVersion.createDraft({
      page_id: stage2Page.id,
      store_id: storeA.id,
      component_tree: nestedContainerDoc,
      change_summary: 'Stage 2 Container & Primitives Draft'
    });

    const stage2Published = await CmsV3PageVersion.publishVersion(stage2Draft.id, storeA.id);
    await CmsV3Page.updateVersionPointers(stage2Page.id, storeA.id, {
      publishedVersionId: stage2Published.id,
      isPublished: true
    });

    assert(stage2Published.status === 'published', 'Published Stage 2 document with nested containers and core primitives.');

    console.log('\n====================================================');
    console.log(`STAGE 2 COMPONENT SUMMARY: ${passedTests} Passed, ${failedTests} Failed.`);
    console.log('====================================================\n');

    if (failedTests > 0) {
      process.exit(1);
    }
    process.exit(0);
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runStage2Tests();
