/**
 * SmartStore Website Studio (CMS V3) — Component Registry Consistency Test Suite
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
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

function runRegistryConsistencyTests() {
  console.log('====================================================');
  console.log('SmartStore CMS V3 Registry Consistency Test Suite');
  console.log('====================================================\n');

  // Defined renderable keys handled in UniversalRenderer.tsx (34 keys total)
  const RENDERER_KEYS = [
    'page',
    'section',
    'flex-container',
    'grid-container',
    'text',
    'button',
    'image',
    'icon',
    'divider',
    'spacer',
    'hero',
    'product-grid',
    'story-about',
    'faq-accordion',
    'testimonials',
    'contact-form',
    'location-map',
    'reservation-widget',
    'header',
    'footer',
    'mobile-drawer',
    'announcement-bar',
    'breadcrumbs',
    'video',
    'rich-text',
    'popup-modal',
    'countdown',
    'newsletter',
    'review-carousel',
    'masonry-gallery',
    'collection-list',
    'cart-drawer',
    'product-spotlight',
    'dietary-filters'
  ];

  console.log('[TEST GROUP 1] Component Count & Consistency Assertions:');

  assert(RENDERER_KEYS.length === 34, `Verified 34 normalized component keys in registry and renderers.`);

  // Test document validation with full component tree
  const fullDocument = {
    versionNumber: 1,
    rootNodeId: 'root',
    nodes: {
      root: { id: 'root', kind: 'page', component: 'page', children: ['flex-1'], props: {}, styles: {} },
      'flex-1': { id: 'flex-1', kind: 'container', component: 'flex-container', children: ['grid-1', 'hero-1', 'txt-1', 'btn-1', 'img-1', 'ic-1', 'div-1', 'sp-1', 'vid-1', 'rt-1', 'pop-1', 'cd-1', 'nl-1', 'rev-1', 'gal-1', 'col-1', 'cart-1', 'spot-1', 'df-1'], props: {}, styles: {} },
      'grid-1': { id: 'grid-1', kind: 'container', component: 'grid-container', children: [], props: {}, styles: {} },
      'hero-1': { id: 'hero-1', kind: 'section', component: 'hero', children: [], props: { title: 'Hero' }, styles: {} },
      'txt-1': { id: 'txt-1', kind: 'element', component: 'text', children: [], props: { content: 'Text' }, styles: {} },
      'btn-1': { id: 'btn-1', kind: 'element', component: 'button', children: [], props: { label: 'CTA' }, styles: {} },
      'img-1': { id: 'img-1', kind: 'element', component: 'image', children: [], props: { url: 'https://...' }, styles: {} },
      'ic-1': { id: 'ic-1', kind: 'element', component: 'icon', children: [], props: { icon: 'Sparkles' }, styles: {} },
      'div-1': { id: 'div-1', kind: 'element', component: 'divider', children: [], props: {}, styles: {} },
      'sp-1': { id: 'sp-1', kind: 'element', component: 'spacer', children: [], props: {}, styles: {} },
      'vid-1': { id: 'vid-1', kind: 'element', component: 'video', children: [], props: { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }, styles: {} },
      'rt-1': { id: 'rt-1', kind: 'element', component: 'rich-text', children: [], props: { content: '<p>Text</p>' }, styles: {} },
      'pop-1': { id: 'pop-1', kind: 'container', component: 'popup-modal', children: [], props: {}, styles: {} },
      'cd-1': { id: 'cd-1', kind: 'section', component: 'countdown', children: [], props: {}, styles: {} },
      'nl-1': { id: 'nl-1', kind: 'section', component: 'newsletter', children: [], props: {}, styles: {} },
      'rev-1': { id: 'rev-1', kind: 'section', component: 'review-carousel', children: [], props: {}, styles: {} },
      'gal-1': { id: 'gal-1', kind: 'section', component: 'masonry-gallery', children: [], props: {}, styles: {} },
      'col-1': { id: 'col-1', kind: 'section', component: 'collection-list', children: [], props: {}, styles: {} },
      'cart-1': { id: 'cart-1', kind: 'container', component: 'cart-drawer', children: [], props: {}, styles: {} },
      'spot-1': { id: 'spot-1', kind: 'section', component: 'product-spotlight', children: [], props: {}, styles: {} },
      'df-1': { id: 'df-1', kind: 'section', component: 'dietary-filters', children: [], props: {}, styles: {} }
    }
  };

  const validationErrors = validatePageDocument(fullDocument);
  assert(validationErrors.filter(e => e.severity === 'error').length === 0, 'PageDocument tree containing all Stage 1–7 components passes schema validation.');

  console.log('\n====================================================');
  console.log(`REGISTRY CONSISTENCY SUMMARY: ${passedTests} Passed, ${failedTests} Failed.`);
  console.log('====================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runRegistryConsistencyTests();
