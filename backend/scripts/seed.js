const db = require('../config/database');
const bcrypt = require('bcryptjs');

async function seed() {
  console.log('[SEED] Starting database seeding...');

  try {
    // 1. Clean up existing data in reverse dependency order
    console.log('[SEED] Cleaning up existing tables...');
    await db.query('TRUNCATE users, stores, user_roles, categories, products, customers, orders, order_items, customer_activities, discount_codes, product_reviews, ai_insights CASCADE');

    // 2. Create default User
    console.log('[SEED] Creating default user...');
    const hashedPassword = await bcrypt.hash('123456', 12);
    const userRes = await db.query(
      `INSERT INTO users (email, password_hash, name, role) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id`,
      ['demo@example.com', hashedPassword, 'Hani Termos', 'user']
    );
    const userId = userRes.rows[0].id;
    console.log(`[SEED] Created user demo@example.com (ID: ${userId})`);

    // 3. Create default Store
    console.log('[SEED] Creating store...');
    const storeRes = await db.query(
      `INSERT INTO stores (owner_user_id, name, slug, currency, shipping_fee, settings)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        userId,
        'Sunrise Bakery',
        'sunrise-bakery',
        'USD',
        5.00,
        JSON.stringify({
          logo_url: '',
          accent_color: '#F97316',
          announcement: 'Welcome to Sunrise Bakery! Freshly baked daily.'
        })
      ]
    );
    const storeId = storeRes.rows[0].id;
    console.log(`[SEED] Created store "sunrise-bakery" (ID: ${storeId})`);

    // 4. Create User Role (Owner)
    console.log('[SEED] Assigning user role...');
    await db.query(
      `INSERT INTO user_roles (user_id, store_id, role)
       VALUES ($1, $2, 'owner')`,
      [userId, storeId]
    );

    // 5. Create Categories
    console.log('[SEED] Creating categories...');
    const catRes1 = await db.query(
      `INSERT INTO categories (store_id, name, slug) VALUES ($1, $2, $3) RETURNING id`,
      [storeId, 'Pastries', 'pastries']
    );
    const catRes2 = await db.query(
      `INSERT INTO categories (store_id, name, slug) VALUES ($1, $2, $3) RETURNING id`,
      [storeId, 'Breads', 'breads']
    );
    const catRes3 = await db.query(
      `INSERT INTO categories (store_id, name, slug) VALUES ($1, $2, $3) RETURNING id`,
      [storeId, 'Beverages', 'beverages']
    );
    const catPastriesId = catRes1.rows[0].id;
    const catBreadsId = catRes2.rows[0].id;
    const catBeveragesId = catRes3.rows[0].id;

    // 6. Create Products
    console.log('[SEED] Creating products...');
    const p1 = await db.query(
      `INSERT INTO products (store_id, category_id, name, slug, description, price, stock, status, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', $8) RETURNING id`,
      [
        storeId,
        catPastriesId,
        'Buttery Butter Croissant',
        'butter-croissant',
        'Classic French croissant made with layers of buttery, laminated pastry dough, baked to golden flaky perfection.',
        3.50,
        50,
        'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=300'
      ]
    );

    const p2 = await db.query(
      `INSERT INTO products (store_id, category_id, name, slug, description, price, stock, status, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', $8) RETURNING id`,
      [
        storeId,
        catBreadsId,
        'Artisanal Sourdough Bread',
        'sourdough-bread',
        'Our signature loaf. Naturally leavened sourdough bread with a crispy crust and a soft, tangy, airy interior.',
        6.50,
        30,
        'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&q=80&w=300'
      ]
    );

    const p3 = await db.query(
      `INSERT INTO products (store_id, category_id, name, slug, description, price, stock, status, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', $8) RETURNING id`,
      [
        storeId,
        catBeveragesId,
        'Cold Brew Iced Coffee',
        'cold-brew',
        'Slow-steeped for 18 hours for a smooth, bold taste with notes of dark chocolate and low acidity.',
        4.00,
        25,
        'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&q=80&w=300'
      ]
    );

    const p4 = await db.query(
      `INSERT INTO products (store_id, category_id, name, slug, description, price, stock, status, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', $8) RETURNING id`,
      [
        storeId,
        catPastriesId,
        'Pain au Chocolat',
        'pain-au-chocolat',
        'Flaky French puff pastry wrapping rich, semi-sweet dark chocolate bars. Perfect when warmed up!',
        4.20,
        40,
        'https://images.unsplash.com/photo-1608198093002-ad4e005484ec?auto=format&fit=crop&q=80&w=300'
      ]
    );

    const prodCroissantId = p1.rows[0].id;
    const prodSourdoughId = p2.rows[0].id;
    const prodColdBrewId = p3.rows[0].id;
    const prodPainId = p4.rows[0].id;

    // 7. Create Discount Codes
    console.log('[SEED] Creating discount codes...');
    await db.query(
      `INSERT INTO discount_codes (store_id, code, type, value, min_subtotal, active)
       VALUES ($1, $2, $3, $4, $5, true)`,
      [storeId, 'WELCOME10', 'percent', 10, 0]
    );
    await db.query(
      `INSERT INTO discount_codes (store_id, code, type, value, min_subtotal, active)
       VALUES ($1, $2, $3, $4, $5, true)`,
      [storeId, 'FREESHIP5', 'fixed', 5, 20]
    );

    // 8. Create Customers
    console.log('[SEED] Creating customers...');
    const custRes1 = await db.query(
      `INSERT INTO customers (store_id, name, phone, email, total_orders, total_spent, segment, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [storeId, 'Alice Johnson', '+96170123456', 'alice@example.com', 2, 35.00, 'vip', 'Regular weekend customer. Prefers extra chocolate.']
    );

    const custRes2 = await db.query(
      `INSERT INTO customers (store_id, name, phone, email, total_orders, total_spent, segment, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [storeId, 'Bob Smith', '+96171888999', 'bob@example.com', 1, 14.50, 'new', 'First time ordering sourdough. Found us via Instagram.']
    );

    const custAliceId = custRes1.rows[0].id;
    const custBobId = custRes2.rows[0].id;

    // 9. Create Orders and Order Items
    console.log('[SEED] Creating orders...');
    // Alice's completed Order 1
    const o1 = await db.query(
      `INSERT INTO orders (store_id, customer_id, order_number, status, payment_method, subtotal, shipping_fee, discount_amount, total, shipping_address, notes)
       VALUES ($1, $2, $3, 'delivered', 'cash_on_delivery', $4, $5, $6, $7, $8, $9) RETURNING id`,
      [
        storeId,
        custAliceId,
        'ORD-554123',
        20.00,
        5.00,
        2.00,
        23.00,
        JSON.stringify({ address: 'Beirut, Main Road', block: 'B', floor: 3 }),
        'Deliver after 4 PM please.'
      ]
    );
    const order1Id = o1.rows[0].id;
    await db.query(
      `INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, subtotal)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [order1Id, prodCroissantId, 'Buttery Butter Croissant', 3.50, 4, 14.00]
    );
    await db.query(
      `INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, subtotal)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [order1Id, prodColdBrewId, 'Cold Brew Iced Coffee', 4.00, 15, 6.00]
    );

    // Bob's pending Order 2
    const o2 = await db.query(
      `INSERT INTO orders (store_id, customer_id, order_number, status, payment_method, subtotal, shipping_fee, discount_amount, total, shipping_address, notes)
       VALUES ($1, $2, $3, 'pending', 'cash_on_delivery', $4, $5, $6, $7, $8, $9) RETURNING id`,
      [
        storeId,
        custBobId,
        'ORD-982142',
        14.70,
        5.00,
        0.00,
        19.70,
        JSON.stringify({ address: 'Byblos, Old Souks', block: 'Block C', floor: 1 }),
        'Call before arrival.'
      ]
    );
    const order2Id = o2.rows[0].id;
    await db.query(
      `INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, subtotal)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [order2Id, prodSourdoughId, 'Artisanal Sourdough Bread', 6.50, 1, 6.50]
    );
    await db.query(
      `INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, subtotal)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [order2Id, prodPainId, 'Pain au Chocolat', 4.20, 2, 8.40]
    );

    // 10. Create Product Reviews
    console.log('[SEED] Creating product reviews...');
    await db.query(
      `INSERT INTO product_reviews (store_id, product_id, customer_phone, author_name, rating, comment, status, verified_purchase)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [storeId, prodSourdoughId, '+96170123456', 'Alice Johnson', 5, 'The absolute best sourdough in the country! Perfect crust and beautifully airy inside.', 'approved', true]
    );
    await db.query(
      `INSERT INTO product_reviews (store_id, product_id, customer_phone, author_name, rating, comment, status, verified_purchase)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [storeId, prodCroissantId, '+96171000000', 'Marc K.', 4, 'Very delicious and light. Wish they had almond croissants too!', 'approved', false]
    );

    // 11. Create Customer Activities
    console.log('[SEED] Creating customer activities...');
    await db.query(
      `INSERT INTO customer_activities (store_id, customer_id, type, payload)
       VALUES ($1, $2, $3, $4)`,
      [storeId, custAliceId, 'order_placed', JSON.stringify({ order_number: 'ORD-554123', total: 23.00 })]
    );
    await db.query(
      `INSERT INTO customer_activities (store_id, customer_id, type, payload)
       VALUES ($1, $2, $3, $4)`,
      [storeId, custBobId, 'order_placed', JSON.stringify({ order_number: 'ORD-982142', total: 19.70 })]
    );

    // 12. Create AI Insights
    console.log('[SEED] Creating AI insights...');
    await db.query(
      `INSERT INTO ai_insights (store_id, customer_id, kind, summary, next_action, email_subject, email_body, recommendations)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        storeId,
        custAliceId,
        'customer_analysis',
        'Alice Johnson is a highly valuable VIP customer who buys artisanal products weekly. Her preferences lean strongly towards sourdough and sweet pastries.',
        'Target with a customized VIP email offering a sneak peek of our upcoming cheese pastries and an exclusive 15% discount.',
        'Thank you for being our VIP, Alice! Here is a special treat...',
        'Dear Alice,\n\nWe appreciate your loyalty! Here is a special 15% discount code (VIPBAKE15) for your next purchase.\n\nWarmly,\nSunrise Bakery',
        JSON.stringify([
          { type: 'discount_code', value: 'VIPBAKE15' },
          { type: 'product_recommendation', value: 'Pain au Chocolat' }
        ])
      ]
    );

    console.log('[SEED] ✓ Database successfully seeded!');
    process.exit(0);
  } catch (error) {
    console.error('[SEED] ✗ Database seeding failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

seed();
