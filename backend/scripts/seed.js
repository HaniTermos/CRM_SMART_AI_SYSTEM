const db = require('../config/database');
const bcrypt = require('bcryptjs');

async function insertAndGetId(query, params) {
  const res = await db.query(query, params);
  return res.rows[0].id;
}

// Helper to pick random item from array
const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
// Helper to generate random number in range
const getRandInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

async function seed() {
  console.log('[SEED] Starting massive database seeding...');

  try {
    console.log('[SEED] 1/14 Cleaning up existing tables...');
    await db.query(`
      TRUNCATE 
        user_roles, order_items, customer_activities, product_reviews, 
        discount_codes, ai_insights, inventory_adjustments,
        crm_deal_notes, crm_deals, crm_stages, crm_pipelines, 
        email_campaigns, orders, products, categories, 
        customers, stores, users 
      RESTART IDENTITY CASCADE
    `);

    const passwordPlain = '123456';
    const hashedPassword = await bcrypt.hash(passwordPlain, 12);

    // ==========================================
    // 2. USERS
    // ==========================================
    console.log('[SEED] 2/14 Creating users...');
    const usersData = [
      { email: 'hani@example.com', name: 'Hani Termos', role: 'user' },
      { email: 'maya@example.com', name: 'Maya Khoury', role: 'user' },
      { email: 'sara@example.com', name: 'Sara Beauty', role: 'user' },
      { email: 'staff1@example.com', name: 'John Staff', role: 'user' },
      { email: 'staff2@example.com', name: 'Emma Staff', role: 'user' },
    ];
    const users = {};
    for (const u of usersData) {
      users[u.email] = await insertAndGetId(
        `INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4) RETURNING id`,
        [u.email, hashedPassword, u.name, u.role]
      );
    }

    // ==========================================
    // 3. STORES & ROLES
    // ==========================================
    console.log('[SEED] 3/14 Creating 3 stores...');
    const storesData = [
      { owner: 'hani@example.com', name: 'Sunrise Bakery', slug: 'sunrise-bakery', fee: 5.0, color: '#F97316' },
      { owner: 'maya@example.com', name: 'Lumina Boutique', slug: 'lumina-boutique', fee: 15.0, color: '#000000' },
      { owner: 'sara@example.com', name: 'Glow Cosmetics', slug: 'glow-cosmetics', fee: 3.0, color: '#EC4899' },
    ];
    const stores = {};
    for (const s of storesData) {
      const storeId = await insertAndGetId(
        `INSERT INTO stores (owner_user_id, name, slug, currency, shipping_fee, settings) VALUES ($1, $2, $3, 'USD', $4, $5) RETURNING id`,
        [users[s.owner], s.name, s.slug, s.fee, JSON.stringify({ accent_color: s.color })]
      );
      stores[s.slug] = storeId;
      await db.query(`INSERT INTO user_roles (user_id, store_id, role) VALUES ($1, $2, 'owner')`, [users[s.owner], storeId]);
    }

    // ==========================================
    // 4. CATEGORIES & PRODUCTS (10+ per store)
    // ==========================================
    console.log('[SEED] 4/14 Creating categories and products...');
    const catalog = {
      'sunrise-bakery': {
        categories: ['Pastries', 'Breads', 'Cakes', 'Beverages'],
        products: [
          { name: 'Butter Croissant', c: 'Pastries', p: 3.50, s: 50 }, { name: 'Pain au Chocolat', c: 'Pastries', p: 4.20, s: 40 },
          { name: 'Almond Croissant', c: 'Pastries', p: 4.50, s: 30 }, { name: 'Sourdough Loaf', c: 'Breads', p: 6.50, s: 20 },
          { name: 'Baguette', c: 'Breads', p: 2.80, s: 60 }, { name: 'Rye Bread', c: 'Breads', p: 5.50, s: 15 },
          { name: 'Cheesecake Slice', c: 'Cakes', p: 5.90, s: 25 }, { name: 'Carrot Cake', c: 'Cakes', p: 6.50, s: 10 },
          { name: 'Cold Brew', c: 'Beverages', p: 4.50, s: 40 }, { name: 'Hot Latte', c: 'Beverages', p: 4.00, s: 50 }
        ]
      },
      'lumina-boutique': {
        categories: ['Dresses', 'Tops', 'Bottoms', 'Accessories'],
        products: [
          { name: 'Silk Evening Gown', c: 'Dresses', p: 250.0, s: 5 }, { name: 'Summer Midi Dress', c: 'Dresses', p: 85.0, s: 15 },
          { name: 'Cotton Wrap Dress', c: 'Dresses', p: 120.0, s: 10 }, { name: 'Linen Blouse', c: 'Tops', p: 65.0, s: 25 },
          { name: 'Silk Camisole', c: 'Tops', p: 95.0, s: 20 }, { name: 'High-Waist Trousers', c: 'Bottoms', p: 110.0, s: 12 },
          { name: 'Denim Skirt', c: 'Bottoms', p: 75.0, s: 18 }, { name: 'Leather Belt', c: 'Accessories', p: 45.0, s: 30 },
          { name: 'Gold Hoop Earrings', c: 'Accessories', p: 60.0, s: 25 }, { name: 'Silk Scarf', c: 'Accessories', p: 35.0, s: 40 }
        ]
      },
      'glow-cosmetics': {
        categories: ['Face', 'Eyes', 'Lips', 'Skincare'],
        products: [
          { name: 'Matte Foundation', c: 'Face', p: 45.0, s: 50 }, { name: 'Hydrating Concealer', c: 'Face', p: 28.0, s: 45 },
          { name: 'Setting Powder', c: 'Face', p: 32.0, s: 60 }, { name: 'Volumizing Mascara', c: 'Eyes', p: 25.0, s: 70 },
          { name: 'Liquid Eyeliner', c: 'Eyes', p: 22.0, s: 55 }, { name: 'Eyeshadow Palette', c: 'Eyes', p: 55.0, s: 30 },
          { name: 'Matte Lipstick - Ruby', c: 'Lips', p: 24.0, s: 40 }, { name: 'Lip Gloss', c: 'Lips', p: 19.0, s: 65 },
          { name: 'Vitamin C Serum', c: 'Skincare', p: 65.0, s: 25 }, { name: 'Night Cream', c: 'Skincare', p: 58.0, s: 35 }
        ]
      }
    };

    const storeProducts = {}; // Maps storeSlug -> array of product objects {id, name, price}
    
    for (const [slug, data] of Object.entries(catalog)) {
      const storeId = stores[slug];
      storeProducts[slug] = [];
      const catIds = {};
      
      for (const catName of data.categories) {
        catIds[catName] = await insertAndGetId(
          `INSERT INTO categories (store_id, name, slug) VALUES ($1, $2, $3) RETURNING id`,
          [storeId, catName, catName.toLowerCase().replace(/\\s+/g, '-')]
        );
      }

      for (const p of data.products) {
        const prodId = await insertAndGetId(
          `INSERT INTO products (store_id, category_id, name, slug, price, stock, status) VALUES ($1, $2, $3, $4, $5, $6, 'active') RETURNING id`,
          [storeId, catIds[p.c], p.name, p.name.toLowerCase().replace(/\\s+/g, '-'), p.p, p.s]
        );
        storeProducts[slug].push({ id: prodId, name: p.name, price: p.p });
      }
    }

    // ==========================================
    // 5. DISCOUNT CODES (10+ total)
    // ==========================================
    console.log('[SEED] 5/14 Creating discount codes...');
    const codes = ['WELCOME10', 'VIP20', 'FREESHIP', 'SUMMER', 'FLASH50'];
    for (const slug of Object.keys(stores)) {
      for (let i=0; i<4; i++) {
        await db.query(
          `INSERT INTO discount_codes (store_id, code, type, value, active) VALUES ($1, $2, $3, $4, true)`,
          [stores[slug], `${codes[i]}${i}`, i%2===0?'percent':'fixed', i*5+10]
        );
      }
    }

    // ==========================================
    // 6. CUSTOMERS (10+ per store)
    // ==========================================
    console.log('[SEED] 6/14 Creating customers...');
    const storeCustomers = {}; // storeSlug -> [customerIds]
    const segments = ['new', 'active', 'vip', 'at_risk', 'churned'];
    
    for (const slug of Object.keys(stores)) {
      storeCustomers[slug] = [];
      for (let i = 1; i <= 12; i++) {
        const custId = await insertAndGetId(
          `INSERT INTO customers (store_id, name, phone, email, segment, total_orders, total_spent) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
          [stores[slug], `Customer ${i} ${slug.split('-')[0]}`, `+961000${slug.length}${i}${getRandInt(10,99)}`, `cust${i}@${slug}.com`, getRandom(segments), 0, 0]
        );
        storeCustomers[slug].push(custId);
      }
    }

    // ==========================================
    // 7. ORDERS & ITEMS (15+ per store)
    // ==========================================
    console.log('[SEED] 7/14 Creating orders & order items...');
    for (const slug of Object.keys(stores)) {
      for (let i = 1; i <= 15; i++) {
        const cId = getRandom(storeCustomers[slug]);
        const p1 = getRandom(storeProducts[slug]);
        const p2 = getRandom(storeProducts[slug]);
        
        const subtotal = p1.price * 2 + (p1.id !== p2.id ? p2.price * 1 : 0);
        const orderId = await insertAndGetId(
          `INSERT INTO orders (store_id, customer_id, order_number, status, payment_method, subtotal, total) 
           VALUES ($1, $2, $3, 'delivered', 'cash_on_delivery', $4, $5) RETURNING id`,
          [stores[slug], cId, `ORD-${slug.substring(0,3).toUpperCase()}-${1000+i}`, subtotal, subtotal]
        );

        await db.query(`INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, subtotal) VALUES ($1, $2, $3, $4, $5, $6)`, [orderId, p1.id, p1.name, p1.price, 2, p1.price * 2]);
        if (p1.id !== p2.id) {
          await db.query(`INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, subtotal) VALUES ($1, $2, $3, $4, $5, $6)`, [orderId, p2.id, p2.name, p2.price, 1, p2.price]);
        }
      }
    }

    // ==========================================
    // 8. PRODUCT REVIEWS (15+ total)
    // ==========================================
    console.log('[SEED] 8/14 Creating product reviews...');
    for (const slug of Object.keys(stores)) {
      for (let i = 0; i < 5; i++) {
        const prod = getRandom(storeProducts[slug]);
        await db.query(
          `INSERT INTO product_reviews (store_id, product_id, author_name, rating, comment, status, verified_purchase) VALUES ($1, $2, $3, $4, $5, 'approved', true)`,
          [stores[slug], prod.id, `Reviewer ${i}`, getRandInt(4, 5), 'Great quality product! Highly recommended.']
        );
      }
    }

    // ==========================================
    // 9. CUSTOMER ACTIVITIES (15+ total)
    // ==========================================
    console.log('[SEED] 9/14 Creating customer activities...');
    for (const slug of Object.keys(stores)) {
      for (let i = 0; i < 5; i++) {
        await db.query(
          `INSERT INTO customer_activities (store_id, customer_id, type, payload) VALUES ($1, $2, 'order_placed', '{"note":"User checked out rapidly"}')`,
          [stores[slug], getRandom(storeCustomers[slug])]
        );
      }
    }

    // ==========================================
    // 10. INVENTORY ADJUSTMENTS (15+ total)
    // ==========================================
    console.log('[SEED] 10/14 Creating inventory adjustments...');
    for (const slug of Object.keys(stores)) {
      for (let i = 0; i < 5; i++) {
        await db.query(
          `INSERT INTO inventory_adjustments (store_id, product_id, delta, reason, note) VALUES ($1, $2, $3, 'restock', 'Weekly stock delivery')`,
          [stores[slug], getRandom(storeProducts[slug]).id, getRandInt(10, 50)]
        );
      }
    }

    // ==========================================
    // 11. AI INSIGHTS (varied, realistic)
    // ==========================================
    console.log('[SEED] 11/14 Creating AI Insights...');
    const insightTemplates = [
      { summary: 'Customer has high repeat purchase rate in the snacks category.', next_action: 'Offer a bundle discount on complementary snack items.' },
      { summary: 'Customer placed 3 orders in the last month but average order value is below store median.', next_action: 'Recommend upsell items at checkout to increase AOV.' },
      { summary: 'Customer only buys during promotional periods and waits for discounts.', next_action: 'Add to early-access sale list to drive urgency.' },
      { summary: 'Customer has not ordered in 45 days after consistent weekly purchases.', next_action: 'Send a personalized "We miss you" email with a 10% discount.' },
      { summary: 'Customer prefers COD and always orders on weekends.', next_action: 'Target weekend SMS campaigns with COD reassurance messaging.' },
      { summary: 'Customer frequently buys gifts for others — high gifting behavior.', next_action: 'Promote gift wrapping and seasonal gift bundles.' },
      { summary: 'Customer is price-sensitive but loyal — always checks for deals.', next_action: 'Enroll in loyalty program and notify of exclusive member pricing.' },
      { summary: 'New customer with one high-value order — strong onboarding opportunity.', next_action: 'Send welcome series with top-rated products and store story.' },
    ];
    for (const slug of Object.keys(stores)) {
      for (let i = 0; i < 5; i++) {
        const template = insightTemplates[i % insightTemplates.length];
        await db.query(
          `INSERT INTO ai_insights (store_id, customer_id, kind, summary, next_action, email_subject, recommendations)
           VALUES ($1, $2, 'customer_analysis', $3, $4, $5, $6)`,
          [
            stores[slug],
            getRandom(storeCustomers[slug]),
            template.summary,
            template.next_action,
            'Follow-up from ' + storeFixtures[slug].name,
            JSON.stringify([{ type: 'discount', value: (10 + i * 5) + '%' }, { type: 'product_upsell', value: 'Related Items' }])
          ]
        );
      }
    }

    // ==========================================
    // 12. CRM PIPELINES & STAGES
    // ==========================================
    console.log('[SEED] 12/14 Creating CRM Pipelines & Stages...');
    const pipelines = {
      'sunrise-bakery': { name: 'Catering & Events', stages: ['Inquiry', 'Tasting', 'Deposit', 'Confirmed'] },
      'lumina-boutique': { name: 'VIP Sourcing', stages: ['Request', 'Sourcing', 'Fitting', 'Sold'] },
      'glow-cosmetics': { name: 'Bridal Bookings', stages: ['Lead', 'Trial Done', 'Retainer Paid', 'Booked'] }
    };
    
    const storeStages = {}; // Maps storeSlug -> array of stage IDs

    for (const [slug, data] of Object.entries(pipelines)) {
      const pipeId = await insertAndGetId(
        `INSERT INTO crm_pipelines (store_id, name) VALUES ($1, $2) RETURNING id`, 
        [stores[slug], data.name]
      );
      
      storeStages[slug] = [];
      for (let i=0; i<data.stages.length; i++) {
        const stageId = await insertAndGetId(
          `INSERT INTO crm_stages (pipeline_id, name, position) VALUES ($1, $2, $3) RETURNING id`,
          [pipeId, data.stages[i], i]
        );
        storeStages[slug].push({ stageId, pipeId });
      }
    }

    // ==========================================
    // 13. CRM DEALS & NOTES (10+ total)
    // ==========================================
    console.log('[SEED] 13/14 Creating CRM Deals & Notes...');
    for (const slug of Object.keys(stores)) {
      const stages = storeStages[slug];
      for (let i = 0; i < 5; i++) {
        const stageInfo = getRandom(stages);
        const dealId = await insertAndGetId(
          `INSERT INTO crm_deals (store_id, pipeline_id, stage_id, customer_id, title, value) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
          [stores[slug], stageInfo.pipeId, stageInfo.stageId, getRandom(storeCustomers[slug]), `Custom Deal ${i+1}`, getRandInt(150, 1000)]
        );
        // Note for deal
        const ownerEmail = storesData.find(s => s.slug === slug).owner;
        await db.query(
          `INSERT INTO crm_deal_notes (deal_id, user_id, content) VALUES ($1, $2, $3)`,
          [dealId, users[ownerEmail], `Followed up with client regarding Deal ${i+1}. Waiting for their response.`]
        );
      }
    }

    // ==========================================
    // 14. EMAIL CAMPAIGNS (10+ total)
    // ==========================================
    console.log('[SEED] 14/14 Creating Email Campaigns...');
    const campaignNames = ['Summer Sale', 'VIP Early Access', 'Abandoned Cart Recovery', 'Newsletter'];
    for (const slug of Object.keys(stores)) {
      for (let i = 0; i < 4; i++) {
        await db.query(
          `INSERT INTO email_campaigns (store_id, name, subject, content_html, status) VALUES ($1, $2, $3, $4, 'draft')`,
          [stores[slug], `${campaignNames[i]} - ${slug}`, `Don't miss our ${campaignNames[i]}!`, `<h1>Hello from ${slug}!</h1><p>Enjoy our latest updates.</p>`]
        );
      }
    }

    console.log('[SEED] ✓ Massive database seeding complete!');
    process.exit(0);

  } catch (error) {
    console.error('[SEED] ✗ Database seeding failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

seed();