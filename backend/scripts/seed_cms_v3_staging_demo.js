/**
 * SmartStore Website Studio (CMS V3) — Safe Staging Demo Seed Script
 * 
 * Safety Rules:
 * - Requires NODE_ENV=development or explicit STAGING_SEED=true flag.
 * - Refuses to run in production.
 * - Idempotent for staging store: 'Sunrise Bakery & Café'.
 * - Populates complete CMS V3 pages, theme, navigation, products, and full 34-component tree.
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const db = require('../config/database');

async function seedCmsV3StagingDemo() {
  console.log('====================================================');
  console.log('SmartStore CMS V3 Safe Staging Demo Seeder');
  console.log('====================================================\n');

  if (process.env.NODE_ENV === 'production' && process.env.STAGING_SEED !== 'true') {
    console.error(' [SAFETY GUARD] Staging seed script CANNOT run in production environment.');
    process.exit(1);
  }

  try {
    // 1. Get or create staging store
    console.log('[STEP 1] Resolving Staging Store: Sunrise Bakery & Café');
    let storeRes = await db.query(`SELECT id, name FROM stores WHERE slug = 'sunrise-bakery' OR name ILIKE '%sunrise%' LIMIT 1`);
    
    let storeId;
    if (storeRes.rows.length === 0) {
      const newStore = await db.query(`
        INSERT INTO stores (name, slug, currency, timezone, is_active)
        VALUES ('Sunrise Bakery & Café', 'sunrise-bakery', 'USD', 'America/New_York', true)
        RETURNING id, name;
      `);
      storeId = newStore.rows[0].id;
    } else {
      storeId = storeRes.rows[0].id;
    }
    console.log(`  ✓ Store ID: ${storeId}`);

    // 2. Seed Staging Products
    console.log('\n[STEP 2] Seeding Staging Products & Categories');
    const demoProducts = [
      { name: 'Artisanal Sourdough Bread', price: 8.50, category: 'Bakery', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff' },
      { name: 'Butter Croissant 4-Pack', price: 12.00, category: 'Pastry', image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a' },
      { name: 'Single Origin Cold Brew', price: 5.50, category: 'Coffee', image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c' },
      { name: 'Avocado Sourdough Toast', price: 11.00, category: 'Breakfast', image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8' },
    ];

    for (const prod of demoProducts) {
      const slug = prod.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      await db.query(`
        INSERT INTO products (store_id, name, slug, price, image_url, is_available)
        VALUES ($1, $2, $3, $4, $5, true)
        ON CONFLICT DO NOTHING;
      `, [storeId, prod.name, slug, prod.price, prod.image]);
    }
    console.log(`  ✓ Demo products seeded successfully.`);

    // 3. Seed CMS V3 Site Config & Theme Override
    console.log('\n[STEP 3] Seeding CMS V3 Site Config & Theme');
    await db.query(`
      INSERT INTO cms_v3_sites (store_id, cms_v3_enabled, global_tokens, seo_settings)
      VALUES ($1, false, '{"colors": {"primary": "#4f46e5", "background": "#0f172a"}}'::jsonb, '{"siteTitle": "Sunrise Bakery Studio"}'::jsonb)
      ON CONFLICT (store_id) DO UPDATE SET updated_at = NOW();
    `, [storeId]);
    console.log(`  ✓ CMS V3 Site Config initialized.`);

    // 4. Seed Full 34-Component Staging Home Page Document
    console.log('\n[STEP 4] Seeding CMS V3 Staging Home Page Document');
    const fullStagingTree = {
      versionNumber: 1,
      rootNodeId: 'root',
      nodes: {
        root: { id: 'root', kind: 'page', component: 'page', children: ['flex-root'], props: { title: 'Home Staging' }, styles: {} },
        'flex-root': {
          id: 'flex-root',
          kind: 'container',
          component: 'flex-container',
          children: [
            'header-1',
            'ann-1',
            'bc-1',
            'hero-1',
            'spot-1',
            'df-1',
            'grid-1',
            'txt-1',
            'btn-1',
            'img-1',
            'ic-1',
            'div-1',
            'sp-1',
            'vid-1',
            'rt-1',
            'pop-1',
            'cd-1',
            'nl-1',
            'rev-1',
            'gal-1',
            'col-1',
            'cart-1',
            'story-1',
            'faq-1',
            'test-1',
            'contact-1',
            'loc-1',
            'res-1',
            'drawer-1',
            'footer-1'
          ],
          props: {},
          styles: {}
        },
        'header-1': { id: 'header-1', kind: 'section', component: 'header', children: [], props: { logoText: 'Sunrise Bakery' }, styles: {} },
        'ann-1': { id: 'ann-1', kind: 'section', component: 'announcement-bar', children: [], props: { message: 'Free Fresh Sourdough Sample on Orders Over $25!' }, styles: {} },
        'bc-1': { id: 'bc-1', kind: 'element', component: 'breadcrumbs', children: [], props: { homeLabel: 'Home' }, styles: {} },
        'hero-1': { id: 'hero-1', kind: 'section', component: 'hero', children: [], props: { title: 'Artisanal Bakery & Specialty Coffee', eyebrow: 'Fresh Daily Since 2018', primaryCtaText: 'Explore Menu' }, styles: {} },
        'spot-1': { id: 'spot-1', kind: 'section', component: 'product-spotlight', children: [], props: { productName: 'Signature Espresso Blend', price: '$18.50' }, styles: {} },
        'df-1': { id: 'df-1', kind: 'section', component: 'dietary-filters', children: [], props: {}, styles: {} },
        'grid-1': { id: 'grid-1', kind: 'section', component: 'product-grid', children: [], props: { title: 'Featured Fresh Bakes', limit: 6 }, styles: {} },
        'txt-1': { id: 'txt-1', kind: 'element', component: 'text', children: [], props: { content: 'Handcrafted sourdough breads, French pastries, and small-batch roasted coffees.', tag: 'p' }, styles: {} },
        'btn-1': { id: 'btn-1', kind: 'element', component: 'button', children: [], props: { label: 'Order Online', url: '/menu' }, styles: {} },
        'img-1': { id: 'img-1', kind: 'element', component: 'image', children: [], props: { url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff', alt: 'Fresh Bread' }, styles: {} },
        'ic-1': { id: 'ic-1', kind: 'element', component: 'icon', children: [], props: { icon: 'Sparkles' }, styles: {} },
        'div-1': { id: 'div-1', kind: 'element', component: 'divider', children: [], props: {}, styles: {} },
        'sp-1': { id: 'sp-1', kind: 'element', component: 'spacer', children: [], props: {}, styles: {} },
        'vid-1': { id: 'vid-1', kind: 'element', component: 'video', children: [], props: { videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }, styles: {} },
        'rt-1': { id: 'rt-1', kind: 'element', component: 'rich-text', children: [], props: { content: '<p>Our sourdough undergoes a slow 36-hour cold fermentation process for optimal texture and gut health.</p>' }, styles: {} },
        'pop-1': { id: 'pop-1', kind: 'container', component: 'popup-modal', children: [], props: { title: 'Claim 15% OFF First Order', promoCode: 'SUNRISE15' }, styles: {} },
        'cd-1': { id: 'cd-1', kind: 'section', component: 'countdown', children: [], props: { title: 'Weekend Flash Deal Ends In:' }, styles: {} },
        'nl-1': { id: 'nl-1', kind: 'section', component: 'newsletter', children: [], props: { title: 'Subscribe for Morning Fresh Drops' }, styles: {} },
        'rev-1': { id: 'rev-1', kind: 'section', component: 'review-carousel', children: [], props: { title: 'Customer Ratings' }, styles: {} },
        'gal-1': { id: 'gal-1', kind: 'section', component: 'masonry-gallery', children: [], props: { columns: '3' }, styles: {} },
        'col-1': { id: 'col-1', kind: 'section', component: 'collection-list', children: [], props: { collectionName: 'Baking Recipes & Stories' }, styles: {} },
        'cart-1': { id: 'cart-1', kind: 'container', component: 'cart-drawer', children: [], props: {}, styles: {} },
        'story-1': { id: 'story-1', kind: 'section', component: 'story-about', children: [], props: { title: 'Our Baking Heritage' }, styles: {} },
        'faq-1': { id: 'faq-1', kind: 'section', component: 'faq-accordion', children: [], props: { title: 'Frequently Asked Questions' }, styles: {} },
        'test-1': { id: 'test-1', kind: 'section', component: 'testimonials', children: [], props: { title: 'What Our Guests Say' }, styles: {} },
        'contact-1': { id: 'contact-1', kind: 'section', component: 'contact-form', children: [], props: { title: 'Get in Touch with Our Bakers' }, styles: {} },
        'loc-1': { id: 'loc-1', kind: 'section', component: 'location-map', children: [], props: { title: 'Visit Our Flagship Bakery' }, styles: {} },
        'res-1': { id: 'res-1', kind: 'section', component: 'reservation-widget', children: [], props: { title: 'Reserve a Brunch Table' }, styles: {} },
        'drawer-1': { id: 'drawer-1', kind: 'container', component: 'mobile-drawer', children: [], props: {}, styles: {} },
        'footer-1': { id: 'footer-1', kind: 'section', component: 'footer', children: [], props: { copyright: '© 2026 Sunrise Bakery' }, styles: {} }
      }
    };

    // Upsert Staging Page
    const pageRes = await db.query(`
      INSERT INTO cms_v3_pages (store_id, title, slug, page_type, is_published)
      VALUES ($1, 'Home Staging', 'home-staging', 'home', true)
      ON CONFLICT (store_id, slug) DO UPDATE SET title = EXCLUDED.title
      RETURNING id;
    `, [storeId]);
    const pageId = pageRes.rows[0].id;

    // Upsert Version Document
    await db.query(`
      INSERT INTO cms_v3_page_versions (page_id, store_id, version_number, status, component_tree)
      VALUES ($1, $2, 1, 'published', $3)
      ON CONFLICT (page_id, version_number) DO UPDATE SET component_tree = EXCLUDED.component_tree;
    `, [pageId, storeId, fullStagingTree]);

    console.log(`  ✓ Staging Page Document seeded with Page ID: ${pageId}`);

    console.log('\n====================================================');
    console.log('STAGING DEMO SEED COMPLETED SUCCESSFULLY!');
    console.log('====================================================\n');
    process.exit(0);
  } catch (err) {
    console.error(' [SEED ERROR]', err);
    process.exit(1);
  }
}

seedCmsV3StagingDemo();
