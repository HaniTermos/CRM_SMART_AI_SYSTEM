/**
 * SmartStore Website Studio (CMS V3) — Section Mappers Unit & Fixture Verification
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const validator = require('../validators/cmsV3Validator');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASSED: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAILED: ${message}`);
    failed++;
  }
}

// Section mapper logic matching run_cms_v3_migration_dry_run.js
function mapLegacySection(sec, storeSlug = 'sunrise-bakery') {
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

function runSectionMapperFixtures() {
  console.log('====================================================');
  console.log('SmartStore CMS V3 Section Mapper Fixture Test Suite');
  console.log('====================================================\n');

  const fixtures = [
    { id: '11111111-1111-1111-1111-111111111111', type: 'hero_banner', content: { title: 'Hero Banner', hero_image: 'https://ex.com/a.jpg' } },
    { id: '22222222-2222-2222-2222-222222222222', type: 'featured_menu', content: { title: 'Featured', limit: 8 } },
    { id: '33333333-3333-3333-3333-333333333333', type: 'story', content: { title: 'Story', description: 'Our history' } },
    { id: '44444444-4444-4444-4444-444444444444', type: 'gallery', content: { title: 'Gallery', images: ['https://ex.com/1.jpg'] } },
    { id: '55555555-5555-5555-5555-555555555555', type: 'testimonials', content: { title: 'Reviews', items: [{ name: 'Alice', comment: 'Great', rating: 5 }] } },
    { id: '66666666-6666-6666-6666-666666666666', type: 'faq', content: { title: 'FAQ', items: [{ question: 'Hours?', answer: '8am-10pm' }] } },
    { id: '77777777-7777-7777-7777-777777777777', type: 'contact_form', content: { title: 'Contact Us', email: 'hello@ex.com' } },
    { id: '88888888-8888-8888-8888-888888888888', type: 'opening_hours', content: { title: 'Hours', hours: 'Mon-Sun 8am-10pm' } },
    { id: '99999999-9999-9999-9999-999999999999', type: 'rich_text', content: { title: 'Policy', body: '<p>Terms of service...</p>' } },
    { id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', type: 'announcement', content: { title: 'Promo', message: '10% off today!' } },
    { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', type: 'unknown_custom_widget', content: { raw: 'data' } }
  ];

  const rootNodeId = 'root';
  const nodesDict = {
    root: { id: 'root', kind: 'page', props: { title: 'Fixture Page' }, children: [] }
  };

  fixtures.forEach((f) => {
    const res = mapLegacySection(f);
    assert(res.node !== null, `Mapped fixture section type '${f.type}' to V3 type '${res.node.type}'.`);
    nodesDict[res.node.id] = res.node;
    nodesDict.root.children.push(res.node.id);
  });

  const fullDoc = { rootNodeId, nodes: nodesDict };
  const errors = validator.validatePageDocument(fullDoc);
  assert(errors.length === 0, 'Complete multi-component fixture PageDocument passes canonical validator.');

  console.log('\n====================================================');
  console.log(`FIXTURE MAPPER SUMMARY: ${passed} Passed, ${failed} Failed.`);
  console.log('====================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runSectionMapperFixtures();
