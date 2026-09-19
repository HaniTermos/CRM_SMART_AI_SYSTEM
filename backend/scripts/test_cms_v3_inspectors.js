/**
 * SmartStore Website Studio (CMS V3) — Dedicated Inspectors Property Test Suite
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const db = require('../config/database');
const CmsV3Page = require('../models/CmsV3Page');
const CmsV3PageVersion = require('../models/CmsV3PageVersion');
const { validatePageDocument } = require('../validators/cmsV3Validator');

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

async function runInspectorTests() {
  console.log('====================================================');
  console.log('SmartStore CMS V3 Dedicated Inspectors Test Suite');
  console.log('====================================================\n');

  try {
    const storesRes = await db.query('SELECT id, name, slug FROM stores LIMIT 1');
    if (storesRes.rows.length === 0) {
      console.error('No store found in DB.');
      process.exit(1);
    }
    const store = storesRes.rows[0];

    console.log(`[SETUP] Testing Inspector Persistence for Store: ${store.name}`);

    let inspectorPage = await CmsV3Page.findBySlug(store.id, 'inspector-test-page');
    if (!inspectorPage) {
      inspectorPage = await CmsV3Page.create({
        store_id: store.id,
        title: 'Inspector Test Page',
        slug: 'inspector-test-page',
        page_type: 'custom'
      });
    }

    // Build document containing all 16 renderable components
    const document = {
      versionNumber: 1,
      rootNodeId: 'root',
      nodes: {
        root: { id: 'root', kind: 'page', component: 'page', children: ['flex-container-1'], props: {}, styles: {} },
        'flex-container-1': { id: 'flex-container-1', kind: 'container', component: 'flex-container', children: ['grid-container-1', 'text-1', 'button-1', 'image-1', 'icon-1', 'divider-1', 'spacer-1', 'hero-1', 'product-grid-1', 'story-about-1', 'faq-accordion-1', 'testimonials-1', 'contact-form-1', 'location-map-1', 'reservation-widget-1'], props: {}, styles: { base: { flexDirection: 'column' } } },
        'grid-container-1': { id: 'grid-container-1', kind: 'container', component: 'grid-container', children: [], props: {}, styles: { base: { columns: 3 } } },
        'text-1': { id: 'text-1', kind: 'element', component: 'text', children: [], props: { content: 'Custom Paragraph Text', tag: 'p' }, styles: { base: { fontSize: '1rem' } } },
        'button-1': { id: 'button-1', kind: 'element', component: 'button', children: [], props: { label: 'Order CTA', url: '/menu' }, styles: {} },
        'image-1': { id: 'image-1', kind: 'element', component: 'image', children: [], props: { url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5', alt: 'Fresh Bread' }, styles: {} },
        'icon-1': { id: 'icon-1', kind: 'element', component: 'icon', children: [], props: { icon: 'Sparkles' }, styles: {} },
        'divider-1': { id: 'divider-1', kind: 'element', component: 'divider', children: [], props: {}, styles: { base: { thickness: '2px' } } },
        'spacer-1': { id: 'spacer-1', kind: 'element', component: 'spacer', children: [], props: {}, styles: { base: { height: '3rem' } } },
        'hero-1': { id: 'hero-1', kind: 'section', component: 'hero', children: [], props: { title: 'Updated Hero Title', eyebrow: 'Welcome' }, styles: {} },
        'product-grid-1': { id: 'product-grid-1', kind: 'section', component: 'product-grid', children: [], props: { title: 'Best Sellers', columns: 4 }, styles: {} },
        'story-about-1': { id: 'story-about-1', kind: 'section', component: 'story-about', children: [], props: { title: 'Our Story', story: 'Handmade daily.' }, styles: {} },
        'faq-accordion-1': { id: 'faq-accordion-1', kind: 'section', component: 'faq-accordion', children: [], props: { title: 'Frequently Asked Questions' }, styles: {} },
        'testimonials-1': { id: 'testimonials-1', kind: 'section', component: 'testimonials', children: [], props: { title: 'Customer Ratings' }, styles: {} },
        'contact-form-1': { id: 'contact-form-1', kind: 'section', component: 'contact-form', children: [], props: { title: 'Send Us a Message' }, styles: {} },
        'location-map-1': { id: 'location-map-1', kind: 'section', component: 'location-map', children: [], props: { address: '123 Bakery St' }, styles: {} },
        'reservation-widget-1': { id: 'reservation-widget-1', kind: 'section', component: 'reservation-widget', children: [], props: { title: 'Reserve a Table Online' }, styles: {} }
      }
    };

    console.log('[TEST GROUP 1] Inspector Schema Validation & Draft Autosave:');

    const schemaErrors = validatePageDocument(document);
    assert(schemaErrors.filter(e => e.severity === 'error').length === 0, 'Mutated properties across all 16 component inspectors pass schema validation.');

    const draft = await CmsV3PageVersion.createDraft({
      page_id: inspectorPage.id,
      store_id: store.id,
      component_tree: document,
      change_summary: 'Dedicated inspectors full component tree draft update'
    });
    assert(draft && draft.id !== undefined, 'Persisted all 16 component inspector property updates to postgres DB draft.');

    const published = await CmsV3PageVersion.publishVersion(draft.id, store.id);
    assert(published.status === 'published', 'Published updated 16-component page version.');

    console.log('\n====================================================');
    console.log(`DEDICATED INSPECTORS SUMMARY: ${passedTests} Passed, ${failedTests} Failed.`);
    console.log('====================================================\n');

    if (failedTests > 0) {
      process.exit(1);
    }
    process.exit(0);
  } catch (err) {
    console.error('Inspector test execution error:', err);
    process.exit(1);
  }
}

runInspectorTests();
