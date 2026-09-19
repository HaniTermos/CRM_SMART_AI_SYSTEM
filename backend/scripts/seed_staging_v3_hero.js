const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const db = require('../config/database');
const CmsV3Page = require('../models/CmsV3Page');
const CmsV3PageVersion = require('../models/CmsV3PageVersion');

async function seedStagingHero() {
  console.log('[SEED V3 HERO] Initializing test V3 page on staging...');
  try {
    const storeRes = await db.query('SELECT id, name, slug FROM stores LIMIT 1');
    if (storeRes.rows.length === 0) {
      console.error('[SEED V3 HERO] No store found in database.');
      process.exit(1);
    }

    const store = storeRes.rows[0];
    console.log(`[SEED V3 HERO] Target store: ${store.name} (${store.slug}, ID: ${store.id})`);

    let page = await CmsV3Page.findBySlug(store.id, 'home');
    if (!page) {
      page = await CmsV3Page.create({
        store_id: store.id,
        title: 'Home',
        slug: 'home',
        page_type: 'home'
      });
      console.log(`[SEED V3 HERO] Created V3 page record (ID: ${page.id})`);
    } else {
      console.log(`[SEED V3 HERO] Found existing V3 page record (ID: ${page.id})`);
    }

    const initialHeroDocument = {
      versionNumber: 1,
      rootNodeId: 'root',
      nodes: {
        root: {
          id: 'root',
          kind: 'page',
          component: 'page',
          children: ['hero-section-1'],
          props: { title: 'Home Page' },
          styles: { base: { background: 'var(--color-background)' } }
        },
        'hero-section-1': {
          id: 'hero-section-1',
          kind: 'section',
          component: 'hero',
          variant: 'split',
          children: [],
          props: {
            eyebrow: 'Welcome to SmartStore',
            title: 'Crafted with Passion & High Quality',
            subtitle: 'Experience exceptional food and coffee made fresh daily.',
            primaryCtaText: 'Explore Menu',
            primaryCtaLink: '/menu',
            secondaryCtaText: 'Book Table',
            secondaryCtaLink: '/reservations',
            imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
            overlayOpacity: 0,
            focalPoint: 'center',
            contentAlign: 'left',
            mobileStackOrder: 'image_first',
            textColorScheme: 'dark'
          },
          styles: {
            base: {
              paddingY: '5rem',
              backgroundColor: 'var(--color-background)'
            },
            states: {
              hover: {}
            },
            responsive: {
              desktop: { flexDirection: 'row' },
              tablet: { flexDirection: 'column' },
              mobile: { flexDirection: 'column', textAlign: 'center' }
            }
          },
          behaviors: {
            entrance: {
              type: 'slide-up',
              durationMs: 600,
              delayMs: 100,
              easing: 'cubic-bezier(0.16, 1, 0.3, 1)'
            },
            hover: {
              scale: 1.02,
              durationMs: 200
            },
            reducedMotion: 'simplify'
          }
        }
      }
    };

    let draftVersion = await CmsV3PageVersion.createDraft({
      page_id: page.id,
      store_id: store.id,
      component_tree: initialHeroDocument,
      change_summary: 'Staging Hero initial seed'
    });

    await CmsV3Page.updateVersionPointers(page.id, store.id, {
      draftVersionId: draftVersion.id
    });

    console.log(`[SEED V3 HERO] ✓ Initialized draft version #${draftVersion.version_number} (ID: ${draftVersion.id})`);
    process.exit(0);
  } catch (err) {
    console.error('[SEED V3 HERO] ✗ Error seeding:', err.message);
    process.exit(1);
  }
}

seedStagingHero();
