const db = require('../config/database');

const SYSTEM_PAGES = [
  { slug: 'home', title: 'Home' },
  { slug: 'about', title: 'About Us' },
  { slug: 'contact', title: 'Contact Us' },
  { slug: 'faq', title: 'Frequently Asked Questions' },
  { slug: 'privacy', title: 'Privacy Policy' },
  { slug: 'terms', title: 'Terms & Conditions' },
  { slug: 'delivery-policy', title: 'Delivery Policy' },
  { slug: 'reservation-policy', title: 'Reservation Policy' }
];

const DEFAULT_HEADER_NAV = [
  { label: 'Home', path: '', position: 0 },
  { label: 'Menu', path: '', position: 1 },
  { label: 'Deals', path: '/deals', position: 2 },
  { label: 'About', path: '/pages/about', position: 3 },
  { label: 'Contact', path: '/pages/contact', position: 4 },
  { label: 'FAQ', path: '/pages/faq', position: 5 }
];

const DEFAULT_FOOTER_NAV = [
  { label: 'Privacy Policy', path: '/pages/privacy', position: 0 },
  { label: 'Terms of Service', path: '/pages/terms', position: 1 },
  { label: 'Delivery Policy', path: '/pages/delivery-policy', position: 2 },
  { label: 'Reservation Policy', path: '/pages/reservation-policy', position: 3 }
];

async function initializeStoreCms(storeId, storeSlug) {
  return await db.transaction(async (tx) => {
    // 1. CMS settings
    await tx.query(
      `INSERT INTO cms_settings (store_id, logo_url, primary_color, accent_color)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (store_id) DO NOTHING`,
      [
        storeId,
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&auto=format&fit=crop',
        '#190E85',
        '#00E0FF'
      ]
    );

    // 2. System pages
    for (const page of SYSTEM_PAGES) {
      await tx.query(
        `INSERT INTO cms_pages (store_id, slug, title, type, is_system_page, show_in_navigation, navigation_label, status, content_draft, content_published)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, '', '')
         ON CONFLICT (store_id, slug) DO NOTHING`,
        [
          storeId,
          page.slug,
          page.title,
          page.slug === 'home' ? 'home' : page.slug,
          true,
          true,
          page.title,
          'published'
        ]
      );
    }

    // 3. Home page default sections
    const homePageRes = await tx.query(
      `SELECT id FROM cms_pages WHERE store_id = $1 AND slug = 'home'`,
      [storeId]
    );
    const homePageId = homePageRes.rows[0]?.id;

    if (homePageId) {
      const sections = [
        {
          type: 'hero',
          position: 0,
          content: {
            eyebrow: 'Crafted Daily With Care',
            title: 'Welcome to Our Storefront',
            subtitle: 'Fresh artisanal culinary offerings and specialty coffee.',
            image_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop',
            cta_primary_text: 'Explore Menu',
            cta_primary_link: `/shop/${storeSlug}`,
            cta_secondary_text: 'Special Offers',
            cta_secondary_link: `/shop/${storeSlug}/deals`
          },
          appearance: { preset: 'solid', background_color: '#190E85', text_color: '#FFFFFF', accent_color: '#00E0FF' },
          background: { type: 'image', image_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop', overlay_opacity: 40 }
        },
        {
          type: 'featured_menu',
          position: 1,
          content: { title: 'Featured Items', subtitle: 'Our most loved creations', limit: 6, show_category_filter: true }
        },
        {
          type: 'about',
          position: 2,
          content: {
            title: 'Crafted With Passion',
            description: 'We source the finest organic ingredients to prepare incredible food and drinks for our community.',
            image_url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop'
          }
        },
        {
          type: 'gallery',
          position: 3,
          content: {
            title: 'Store Highlights',
            images: [
              'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&auto=format&fit=crop',
              'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&auto=format&fit=crop'
            ]
          }
        },
        {
          type: 'testimonials',
          position: 4,
          content: {
            title: 'What Our Customers Say',
            items: [{ name: 'Jessica R.', comment: 'Outstanding food, great ambiance, and fast delivery!', rating: 5 }]
          }
        },
        {
          type: 'faq',
          position: 5,
          content: {
            title: 'Frequently Asked Questions',
            items: [{ question: 'What are your store hours?', answer: 'We are open 7 days a week from 8:00 AM to 10:00 PM.' }]
          }
        },
        {
          type: 'contact_form',
          position: 6,
          content: { title: 'Get in Touch', phone: '+1 (555) 234-5678', email: 'hello@smartstore.ai', address: '123 Gourmet Ave, Culinary District' }
        }
      ];

      for (const s of sections) {
        await tx.query(
          `INSERT INTO cms_page_sections (
             store_id, page_id, type, position, content, layout, appearance, background, responsive
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT DO NOTHING`,
          [
            storeId,
            homePageId,
            s.type,
            s.position,
            JSON.stringify(s.content || {}),
            JSON.stringify(s.layout || { width: 'contained', padding_top: 'medium', padding_bottom: 'medium', align: 'center' }),
            JSON.stringify(s.appearance || { preset: 'solid', background_color: '#ffffff', text_color: '#0F172A', accent_color: '#190E85', border_radius: '0.75rem' }),
            JSON.stringify(s.background || { type: 'solid', image_url: '', overlay_opacity: 0 }),
            JSON.stringify(s.responsive || { stack_on_mobile: true })
          ]
        );
      }
    }

    // 4. Rich text sections for policy pages
    await tx.query(
      `INSERT INTO cms_page_sections (store_id, page_id, type, position, content)
       SELECT $1, p.id, 'rich_text', 0, jsonb_build_object('title', p.title, 'body', '')
       FROM cms_pages p
       WHERE p.store_id = $1 AND p.slug != 'home'
         AND NOT EXISTS (SELECT 1 FROM cms_page_sections WHERE page_id = p.id)`,
      [storeId]
    );

    // 5. Default navigation
    for (const item of DEFAULT_HEADER_NAV) {
      await tx.query(
        `INSERT INTO cms_navigation_items (store_id, location, label, url, position)
         VALUES ($1, 'header', $2, $3, $4)
         ON CONFLICT DO NOTHING`,
        [storeId, item.label, `/shop/${storeSlug}${item.path}`, item.position]
      );
    }

    for (const item of DEFAULT_FOOTER_NAV) {
      await tx.query(
        `INSERT INTO cms_navigation_items (store_id, location, label, url, position)
         VALUES ($1, 'footer', $2, $3, $4)
         ON CONFLICT DO NOTHING`,
        [storeId, item.label, `/shop/${storeSlug}${item.path}`, item.position]
      );
    }
  });
}

module.exports = { initializeStoreCms };
