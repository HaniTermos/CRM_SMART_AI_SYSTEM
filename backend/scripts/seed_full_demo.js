const db = require('../config/database');
const bcrypt = require('bcryptjs');

// ─────────────────────────────────────────────────────────────
// SmartStore AI — Full Demo Database Seeder
// Creates realistic data for 4 restaurants/cafés + admin + staff.
//
// Login credentials (all use the same password scheme):
//   Owner:  <name>@<store>.com      -> <StoreName>2026!
//   Staff:  staff@<store>.com        -> <StoreName>Staff2026!
//   Admin:  admin@smartstore.ai      -> AdminSmart2026!
//
// Run: node backend/scripts/seed_full_demo.js
// ─────────────────────────────────────────────────────────────

const SALT_ROUNDS = 12;

const DEMO_PASSWORD = 'SmartStore2026!';

const PASSWORD = {
  owner: () => DEMO_PASSWORD,
  staff: () => DEMO_PASSWORD,
  admin: DEMO_PASSWORD,
};

const ADMIN_USER = {
  email: 'admin@smartstore.ai',
  name: 'SmartStore Admin',
  role: 'admin',
};

const BUSINESSES = [
  {
    key: 'SunriseBakery',
    slug: 'sunrise-bakery',
    name: 'Sunrise Bakery',
    businessType: 'bakery',
    currency: 'USD',
    ownerEmail: 'hani@sunrisebakery.com',
    ownerName: 'Hani Termos',
    staffEmail: 'staff@sunrisebakery.com',
    staffName: 'Sara Baker',
    themeSlug: 'classic',
    primaryColor: '#190E85',
    accentColor: '#00E0FF',
    fontFamily: 'Inter',
    shippingFee: 5,
    categories: [
      { name: 'Pastries', slug: 'pastries' },
      { name: 'Breads', slug: 'breads' },
      { name: 'Beverages', slug: 'beverages' },
      { name: 'Cakes', slug: 'cakes' },
      { name: 'Breakfast', slug: 'breakfast' },
    ],
    products: [
      { name: 'Butter Croissant', slug: 'butter-croissant', price: 3.50, stock: 80, cat: 'Pastries', image: 'photo-1555507036-ab1f4038808a' },
      { name: 'Pain au Chocolat', slug: 'pain-au-chocolat', price: 4.20, stock: 60, cat: 'Pastries', image: 'photo-1608198093002-ad4e005484ec' },
      { name: 'Almond Muffin', slug: 'almond-muffin', price: 3.75, stock: 50, cat: 'Pastries', image: 'photo-1607958996333-41aef7caefaa' },
      { name: 'Artisan Sourdough', slug: 'artisan-sourdough', price: 6.50, stock: 40, cat: 'Breads', image: 'photo-1549931319-a545dcf3bc73' },
      { name: 'French Baguette', slug: 'french-baguette', price: 2.80, stock: 70, cat: 'Breads', image: 'photo-1597075687490-8f673c6c17f6' },
      { name: 'Cold Brew Coffee', slug: 'cold-brew', price: 4.50, stock: 100, cat: 'Beverages', image: 'photo-1517701604599-bb29b565090c' },
      { name: 'Vanilla Latte', slug: 'vanilla-latte', price: 5.00, stock: 90, cat: 'Beverages', image: 'photo-1572442388796-11668a67e53d' },
      { name: 'Classic Cheesecake', slug: 'classic-cheesecake', price: 6.00, stock: 35, cat: 'Cakes', image: 'photo-1524351199678-941a58a3df26' },
      { name: 'Avocado Toast', slug: 'avocado-toast', price: 8.50, stock: 45, cat: 'Breakfast', image: 'photo-1588137372308-15f75323ca8d' },
      { name: 'Egg & Cheese Sandwich', slug: 'egg-cheese-sandwich', price: 7.00, stock: 55, cat: 'Breakfast', image: 'photo-1553909489-cd47e3b4430a' },
    ],
  },
  {
    key: 'PastaParlor',
    slug: 'pasta-parlor',
    name: 'Pasta Parlor',
    businessType: 'restaurant',
    currency: 'USD',
    ownerEmail: 'mario@pastaparlor.com',
    ownerName: 'Mario Rossi',
    staffEmail: 'staff@pastaparlor.com',
    staffName: 'Giulia Neri',
    themeSlug: 'warm',
    primaryColor: '#C2410C',
    accentColor: '#F59E0B',
    fontFamily: 'Outfit',
    shippingFee: 0,
    categories: [
      { name: 'Starters', slug: 'starters' },
      { name: 'Pasta', slug: 'pasta' },
      { name: 'Pizza', slug: 'pizza' },
      { name: 'Salads', slug: 'salads' },
      { name: 'Desserts', slug: 'desserts' },
      { name: 'Drinks', slug: 'drinks' },
    ],
    products: [
      { name: 'Bruschetta Trio', slug: 'bruschetta-trio', price: 8.00, stock: 999, cat: 'Starters', image: 'photo-1572695157360-41f04f76be74' },
      { name: 'Spaghetti Carbonara', slug: 'spaghetti-carbonara', price: 15.00, stock: 999, cat: 'Pasta', image: 'photo-1612874742237-6526221588e3' },
      { name: 'Penne Arrabbiata', slug: 'penne-arrabbiata', price: 13.50, stock: 999, cat: 'Pasta', image: 'photo-1563379926898-05f4575a45d8' },
      { name: 'Margherita Pizza', slug: 'margherita-pizza', price: 12.00, stock: 999, cat: 'Pizza', image: 'photo-1574071318508-1cdbab80d002' },
      { name: 'Quattro Formaggi', slug: 'quattro-formaggi', price: 16.00, stock: 999, cat: 'Pizza', image: 'photo-1513104890138-7c749659a591' },
      { name: 'Caesar Salad', slug: 'caesar-salad', price: 10.00, stock: 999, cat: 'Salads', image: 'photo-1550304943-4f24f54ddde9' },
      { name: 'Tiramisu', slug: 'tiramisu', price: 7.50, stock: 60, cat: 'Desserts', image: 'photo-1571877227200-a0d98ea607e9' },
      { name: 'Cannoli', slug: 'cannoli', price: 6.50, stock: 50, cat: 'Desserts', image: 'photo-1551529834-525807d6b4f3' },
      { name: 'House Red Wine', slug: 'house-red-wine', price: 6.00, stock: 120, cat: 'Drinks', image: 'photo-1510812431401-41d2bd2722f3' },
      { name: 'Sparkling Water', slug: 'sparkling-water', price: 3.00, stock: 200, cat: 'Drinks', image: 'photo-1602143407151-01114192003f' },
    ],
  },
  {
    key: 'GreenBowl',
    slug: 'green-bowl',
    name: 'Green Bowl',
    businessType: 'cafe',
    currency: 'USD',
    ownerEmail: 'lisa@greenbowl.com',
    ownerName: 'Lisa Chen',
    staffEmail: 'staff@greenbowl.com',
    staffName: 'Tom Green',
    themeSlug: 'minimal',
    primaryColor: '#111827',
    accentColor: '#6366F1',
    fontFamily: 'DM Sans',
    shippingFee: 4,
    categories: [
      { name: 'Smoothies', slug: 'smoothies' },
      { name: 'Salads', slug: 'salads' },
      { name: 'Wraps', slug: 'wraps' },
      { name: 'Bowls', slug: 'bowls' },
      { name: 'Juices', slug: 'juices' },
    ],
    products: [
      { name: 'Acai Bowl', slug: 'acai-bowl', price: 10.50, stock: 70, cat: 'Bowls', image: 'photo-1590301157890-4810ed352733' },
      { name: 'Quinoa Power Salad', slug: 'quinoa-power-salad', price: 12.00, stock: 60, cat: 'Salads', image: 'photo-1512621776951-a57141f2eefd' },
      { name: 'Avocado & Hummus Wrap', slug: 'avocado-hummus-wrap', price: 9.50, stock: 55, cat: 'Wraps', image: 'photo-1626700051175-6818013e1d4f' },
      { name: 'Green Detox Juice', slug: 'green-detox-juice', price: 6.50, stock: 90, cat: 'Juices', image: 'photo-1610970881699-44a5587cabec' },
      { name: 'Berry Blast Smoothie', slug: 'berry-blast-smoothie', price: 7.50, stock: 80, cat: 'Smoothies', image: 'photo-1553530979-7ee52a2670c4' },
      { name: 'Tropical Smoothie', slug: 'tropical-smoothie', price: 7.00, stock: 75, cat: 'Smoothies', image: 'photo-1577805947697-89e18249d767' },
      { name: 'Kale Caesar Salad', slug: 'kale-caesar-salad', price: 11.50, stock: 50, cat: 'Salads', image: 'photo-1546793665-c74683f339c1' },
      { name: 'Falafel Bowl', slug: 'falafel-bowl', price: 11.00, stock: 65, cat: 'Bowls', image: 'photo-1543339308-43e59d6b73a6' },
      { name: 'Protein Energy Balls', slug: 'protein-energy-balls', price: 4.50, stock: 100, cat: 'Bowls', image: 'photo-1604382354936-07c5d9983bd3' },
      { name: 'Coconut Water', slug: 'coconut-water', price: 4.00, stock: 110, cat: 'Juices', image: 'photo-1536657464919-892534f60d6e' },
    ],
  },
  {
    key: 'ArabiCast',
    slug: 'arabicast',
    name: 'Arabi Cast',
    businessType: 'coffee_shop',
    currency: 'USD',
    ownerEmail: 'omar@arabicast.com',
    ownerName: 'Omar Khaled',
    staffEmail: 'staff@arabicast.com',
    staffName: 'Noor Saleh',
    themeSlug: 'dark',
    primaryColor: '#8B5CF6',
    accentColor: '#22D3EE',
    fontFamily: 'Poppins',
    shippingFee: 6,
    categories: [
      { name: 'Coffee', slug: 'coffee' },
      { name: 'Beans', slug: 'beans' },
      { name: 'Pastries', slug: 'pastries' },
      { name: 'Merch', slug: 'merch' },
    ],
    products: [
      { name: 'Turkish Coffee', slug: 'turkish-coffee', price: 4.50, stock: 120, cat: 'Coffee', image: 'photo-1514432324607-a09d9b4aefdd' },
      { name: 'Espresso', slug: 'espresso', price: 3.00, stock: 150, cat: 'Coffee', image: 'photo-1510591509098-f4fdc6d0ff04' },
      { name: 'Cardamom Latte', slug: 'cardamom-latte', price: 5.50, stock: 100, cat: 'Coffee', image: 'photo-1461023058943-07fcbe16d735' },
      { name: 'Ethiopian Beans 250g', slug: 'ethiopian-beans', price: 14.00, stock: 40, cat: 'Beans', image: 'photo-1559056199-641a0ac8b55e' },
      { name: 'Brazilian Beans 250g', slug: 'brazilian-beans', price: 12.00, stock: 45, cat: 'Beans', image: 'photo-1611854779393-1b2da9d400fe' },
      { name: 'Cardamom Bun', slug: 'cardamom-bun', price: 4.00, stock: 55, cat: 'Pastries', image: 'photo-1509365465985-25d11c17e812' },
      { name: 'Date Maamoul', slug: 'date-maamoul', price: 3.50, stock: 80, cat: 'Pastries', image: 'photo-1601050690597-df0568f73350' },
      { name: 'ArabiCast Tote Bag', slug: 'arabicast-tote', price: 18.00, stock: 30, cat: 'Merch', image: 'photo-1597484662317-c91d5e0eb8bd' },
      { name: 'Ceramic Dallah', slug: 'ceramic-dallah', price: 24.00, stock: 20, cat: 'Merch', image: 'photo-1610632380989-680fe40816c6' },
      { name: 'Iced Arabic Coffee', slug: 'iced-arabic-coffee', price: 5.00, stock: 90, cat: 'Coffee', image: 'photo-1517701604599-bb29b565090c' },
    ],
  },
];

const FIRST_NAMES = ['Alice','Bob','Carla','David','Emma','Fadi','Grace','Hassan','Ivy','Jack','Karla','Liam','Maya','Noah','Olivia','Pia','Quinn','Rami','Sofia','Tarek','Uma','Victor','Wendy','Xander','Yara','Zack'];
const LAST_NAMES = ['Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Rodriguez','Martinez','Hernandez','Lopez','Gonzalez','Wilson','Anderson','Thomas','Taylor','Moore','Jackson','Martin','Lee','Perez','Thompson','White','Harris'];
const DOMAINS = ['gmail.com','yahoo.com','outlook.com','hotmail.com','icloud.com'];
const CITIES = ['Beirut','Tripoli','Sidon','Tyre','Byblos','Zahle','Jounieh','Baalbek'];

function unsplash(id) {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=600&q=80`;
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(daysBack = 90) {
  const d = new Date();
  d.setDate(d.getDate() - rand(0, daysBack));
  d.setHours(rand(8, 22), rand(0, 59), 0, 0);
  return d.toISOString();
}

function randomPhone() {
  return `+96170${rand(100000, 999999)}`;
}

function orderNumber(storeSlug, index) {
  const prefix = storeSlug.split('-').map((s) => s[0].toUpperCase()).join('');
  return `${prefix}-${100000 + index}`;
}

async function hash(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function ensureThemes() {
  const res = await db.query(`SELECT id, slug FROM cms_themes`);
  const map = {};
  for (const row of res.rows) map[row.slug] = row.id;
  return map;
}

async function seed() {
  console.log('[SEED] Starting full demo seed...');

  await db.transaction(async (client) => {
    // ── 1. Clean slate ─────────────────────────────────────────
    const tables = [
      'user_preferences','notifications','cms_contact_messages','cms_media','cms_navigation_items',
      'cms_announcements','cms_page_sections','cms_page_versions','cms_pages','cms_settings',
      'cms_preview_tokens','kitchen_tickets','order_items','orders','product_reviews','discount_codes',
      'inventory_adjustments','purchase_orders','products','categories','reservations','floor_layouts',
      'floors','crm_deal_notes','crm_deals','crm_stages','crm_pipelines','customer_points','loyalty_tiers',
      'customer_activities','customers','email_campaigns','tasks','shifts','user_roles','users','stores',
    ];
    await client.query(`TRUNCATE ${tables.join(', ')} CASCADE`);
    console.log('[SEED] Tables truncated.');

    // ── 2. Admin user ──────────────────────────────────────────
    const adminPw = await hash(PASSWORD.admin);
    const adminRes = await client.query(
      `INSERT INTO users (email, password_hash, name, role) VALUES ($1,$2,$3,$4) RETURNING id`,
      [ADMIN_USER.email, adminPw, ADMIN_USER.name, ADMIN_USER.role]
    );
    const adminId = adminRes.rows[0].id;
    await client.query(
      `INSERT INTO user_preferences (user_id) VALUES ($1)`,
      [adminId]
    );
    console.log(`[SEED] Admin: ${ADMIN_USER.email} / ${PASSWORD.admin}`);

    // ── 3. Theme map ───────────────────────────────────────────
    const themeMap = await ensureThemes();

    // ── 4. Per-business seeding ────────────────────────────────
    for (const biz of BUSINESSES) {
      console.log(`\n[SEED] Seeding ${biz.name}...`);

      // users
      const ownerPw = await hash(PASSWORD.owner(biz.key));
      const ownerRes = await client.query(
        `INSERT INTO users (email, password_hash, name, role) VALUES ($1,$2,$3,$4) RETURNING id`,
        [biz.ownerEmail, ownerPw, biz.ownerName, 'user']
      );
      const ownerId = ownerRes.rows[0].id;

      const staffPw = await hash(PASSWORD.staff(biz.key));
      const staffRes = await client.query(
        `INSERT INTO users (email, password_hash, name, role) VALUES ($1,$2,$3,$4) RETURNING id`,
        [biz.staffEmail, staffPw, biz.staffName, 'user']
      );
      const staffId = staffRes.rows[0].id;

      await client.query(
        `INSERT INTO user_preferences (user_id, dashboard_theme, nav_mode) VALUES ($1,$2,$3)`,
        [ownerId, 'system', 'dock']
      );
      await client.query(
        `INSERT INTO user_preferences (user_id, dashboard_theme, nav_mode) VALUES ($1,$2,$3)`,
        [staffId, 'system', 'dock']
      );

      // store
      const storeRes = await client.query(
        `INSERT INTO stores (owner_user_id, name, slug, currency, shipping_fee, business_type, settings, theme_config)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
        [
          ownerId,
          biz.name,
          biz.slug,
          biz.currency,
          biz.shippingFee,
          biz.businessType,
          JSON.stringify({ logo_url: '', accent_color: biz.accentColor, announcement: `Welcome to ${biz.name}!` }),
          JSON.stringify({ primaryColor: biz.primaryColor, accentColor: biz.accentColor, fontFamily: biz.fontFamily }),
        ]
      );
      const storeId = storeRes.rows[0].id;

      await client.query(`INSERT INTO user_roles (user_id, store_id, role) VALUES ($1,$2,'owner')`, [ownerId, storeId]);
      await client.query(`INSERT INTO user_roles (user_id, store_id, role) VALUES ($1,$2,'staff')`, [staffId, storeId]);

      console.log(`  Owner: ${biz.ownerEmail} / ${PASSWORD.owner(biz.key)}`);
      console.log(`  Staff: ${biz.staffEmail} / ${PASSWORD.staff(biz.key)}`);

      // categories
      const categoryMap = {};
      for (let i = 0; i < biz.categories.length; i++) {
        const c = biz.categories[i];
        const res = await client.query(
          `INSERT INTO categories (store_id, name, slug, position) VALUES ($1,$2,$3,$4) RETURNING id`,
          [storeId, c.name, c.slug, i]
        );
        categoryMap[c.name] = res.rows[0].id;
      }

      // products
      const productMap = {};
      for (const p of biz.products) {
        const res = await client.query(
          `INSERT INTO products (store_id, category_id, name, slug, description, price, stock, status, image_url,
             cost, prep_time, prep_time_minutes, is_available, is_featured, dietary_tags, allergens)
           VALUES ($1,$2,$3,$4,$5,$6,$7,'active',$8,$9,$10,$11,true,$12,$13,$14) RETURNING id`,
          [
            storeId,
            categoryMap[p.cat],
            p.name,
            p.slug,
            `Delicious ${p.name.toLowerCase()} made fresh daily.`,
            p.price,
            p.stock,
            unsplash(p.image),
            +(p.price * 0.35).toFixed(2),
            rand(5, 20),
            rand(5, 20),
            Math.random() > 0.7,
            p.cat === 'Salads' || p.cat === 'Bowls' || p.cat === 'Wraps' ? ['vegetarian'] : [],
            p.cat === 'Pastries' || p.name.includes('Bread') ? ['gluten'] : [],
          ]
        );
        productMap[p.slug] = { id: res.rows[0].id, ...p };
      }

      // discount codes
      await client.query(
        `INSERT INTO discount_codes (store_id, code, type, value, min_subtotal, max_uses, used_count, active, expires_at)
         VALUES ($1,'WELCOME10','percent',10,0,100,12,true,NOW()+INTERVAL '60 days')`,
        [storeId]
      );
      await client.query(
        `INSERT INTO discount_codes (store_id, code, type, value, min_subtotal, max_uses, used_count, active, expires_at)
         VALUES ($1,'VIP20','percent',20,30,50,4,true,NOW()+INTERVAL '30 days')`,
        [storeId]
      );

      // customers
      const customers = [];
      for (let i = 0; i < 12; i++) {
        const fname = randItem(FIRST_NAMES);
        const lname = randItem(LAST_NAMES);
        const phone = randomPhone();
        const email = `${fname.toLowerCase()}.${lname.toLowerCase()}${rand(1,99)}@${randItem(DOMAINS)}`;
        const segment = randItem(['new','active','vip','at_risk','churned']);
        const res = await client.query(
          `INSERT INTO customers (store_id, name, phone, email, segment, notes) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
          [
            storeId,
            `${fname} ${lname}`,
            phone,
            email,
            segment,
            `${fname} prefers ${randItem(['delivery','pickup','dine-in'])}.`,
          ]
        );
        customers.push({ id: res.rows[0].id, name: `${fname} ${lname}`, phone, email, segment });
      }

      // loyalty tiers
      const tierRes = await client.query(
        `INSERT INTO loyalty_tiers (store_id, name, min_points, multiplier, benefits)
         VALUES ($1,'Bronze',0,1.0,'["5% birthday discount"]'),
                ($1,'Silver',200,1.25,'["10% birthday discount","priority support"]'),
                ($1,'Gold',500,1.5,'["15% birthday discount","free delivery","early access"]')
         RETURNING id`,
        [storeId]
      );
      const tierIds = tierRes.rows.map((r) => r.id);

      // customer points
      for (const c of customers) {
        const points = rand(0, 600);
        let tierId = tierIds[0];
        if (points >= 500) tierId = tierIds[2];
        else if (points >= 200) tierId = tierIds[1];
        await client.query(
          `INSERT INTO customer_points (store_id, customer_id, points, lifetime_points, tier_id) VALUES ($1,$2,$3,$4,$5)`,
          [storeId, c.id, points, points + rand(0, 200), tierId]
        );
      }

      // orders + items
      const statuses = ['pending','confirmed','shipped','delivered','cancelled'];
      const sources = ['dine_in','delivery','pickup','online'];
      const paymentMethods = ['cash_on_delivery','credit_card','wallet'];
      let orderIndex = 1;
      const productList = Object.values(productMap);

      for (let i = 0; i < 20; i++) {
        const customer = randItem(customers);
        const status = statuses[Math.min(i % statuses.length + rand(0,1), statuses.length - 1)];
        const source = randItem(sources);
        const paymentMethod = randItem(paymentMethods);
        const itemCount = rand(1, 4);
        let subtotal = 0;
        const orderItems = [];
        for (let j = 0; j < itemCount; j++) {
          const prod = randItem(productList);
          const qty = rand(1, 3);
          const line = +(prod.price * qty).toFixed(2);
          subtotal += line;
          orderItems.push({ productId: prod.id, name: prod.name, price: prod.price, qty, line });
        }
        const discount = i % 5 === 0 ? +(subtotal * 0.1).toFixed(2) : 0;
        const shipping = source === 'delivery' ? biz.shippingFee : 0;
        const total = +(subtotal + shipping - discount).toFixed(2);
        const createdAt = randomDate();

        const orderRes = await client.query(
          `INSERT INTO orders (store_id, customer_id, order_number, status, payment_method, payment_status, source,
             subtotal, shipping_fee, discount_amount, total, shipping_address, notes, created_at, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING id`,
          [
            storeId,
            customer.id,
            orderNumber(biz.slug, orderIndex++),
            status,
            paymentMethod,
            Math.random() > 0.2 ? 'paid' : 'unpaid',
            source,
            subtotal,
            shipping,
            discount,
            total,
            JSON.stringify({ address: `${rand(1,50)} ${randItem(CITIES)} St`, city: randItem(CITIES), floor: rand(1,6) }),
            randItem(['No onions','Extra sauce','Call on arrival','Leave at door','']),
            createdAt,
            createdAt,
          ]
        );
        const orderId = orderRes.rows[0].id;

        for (const item of orderItems) {
          await client.query(
            `INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, subtotal) VALUES ($1,$2,$3,$4,$5,$6)`,
            [orderId, item.productId, item.name, item.price, item.qty, item.line]
          );
        }

        // kitchen ticket for active food orders
        if (['pending','confirmed','shipped','delivered'].includes(status) && Math.random() > 0.3) {
          await client.query(
            `INSERT INTO kitchen_tickets (store_id, order_id, status, station, priority, created_at)
             VALUES ($1,$2,$3,$4,$5,$6)`,
            [storeId, orderId, randItem(['pending','preparing','ready']), randItem(['Grill','Cold','Pastry','Bar']), rand(0,2), createdAt]
          );
        }

        // customer activity
        await client.query(
          `INSERT INTO customer_activities (store_id, customer_id, type, payload, created_at)
           VALUES ($1,$2,'order', $3, $4)`,
          [storeId, customer.id, JSON.stringify({ order_id: orderId, total }), createdAt]
        );

        // update customer totals (rough)
        if (status !== 'cancelled') {
          await client.query(
            `UPDATE customers SET total_orders = total_orders + 1, total_spent = total_spent + $1, last_order_at = $2 WHERE id = $3`,
            [total, createdAt, customer.id]
          );
        }
      }

      // reviews
      for (let i = 0; i < 8; i++) {
        const prod = randItem(productList);
        const cust = randItem(customers);
        await client.query(
          `INSERT INTO product_reviews (store_id, product_id, customer_phone, author_name, rating, comment, status, verified_purchase, created_at)
           VALUES ($1,$2,$3,$4,$5,$6,'approved',$7,$8)`,
          [
            storeId,
            prod.id,
            cust.phone,
            cust.name,
            rand(3,5),
            randItem(['Amazing!','Really good.','Would order again.','Best in town.','Tasty and fresh.']),
            Math.random() > 0.3,
            randomDate(60),
          ]
        );
      }

      // inventory adjustments
      for (const p of productList) {
        await client.query(
          `INSERT INTO inventory_adjustments (store_id, product_id, delta, reason, note, created_by)
           VALUES ($1,$2,$3,'restock','Initial stock load',$4)`,
          [storeId, p.id, p.stock, ownerId]
        );
      }

      // purchase order
      await client.query(
        `INSERT INTO purchase_orders (store_id, supplier_name, items, total_amount, status)
         VALUES ($1,$2,$3,$4,'received')`,
        [
          storeId,
          randItem(['Sysco','GFS','US Foods','Local Farms','Organic Supply Co']),
          JSON.stringify(productList.slice(0,3).map((p) => ({ name: p.name, qty: rand(20,50), unit_price: +(p.price*0.35).toFixed(2) }))),
          rand(100,400),
        ]
      );

      // floors & reservations
      const floorRes = await client.query(
        `INSERT INTO floors (store_id, name, order_index, is_active) VALUES ($1,'Main Floor',0,true),($1,'Terrace',1,true) RETURNING id`,
        [storeId]
      );
      const floorIds = floorRes.rows.map((r) => r.id);
      for (const floorId of floorIds) {
        await client.query(
          `INSERT INTO floor_layouts (floor_id, name, is_default) VALUES ($1,$2,$3)`,
          [floorId, 'Default Layout', true]
        );
      }
      for (let i = 0; i < 10; i++) {
        const cust = randItem(customers);
        const date = new Date();
        date.setDate(date.getDate() + rand(-7, 14));
        const time = `${String(rand(10,21)).padStart(2,'0')}:00:00`;
        await client.query(
          `INSERT INTO reservations (store_id, customer_name, customer_phone, guests, date, time, floor_id, table_label, status, notes)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [
            storeId,
            cust.name,
            cust.phone,
            rand(1,6),
            date.toISOString().split('T')[0],
            time,
            randItem(floorIds),
            `T${rand(1,6)}`,
            randItem(['pending','confirmed','cancelled','seated']),
            randItem(['Anniversary','Business lunch','Birthday','Window seat','']),
          ]
        );
      }

      // CRM pipeline
      const pipelineRes = await client.query(
        `INSERT INTO crm_pipelines (store_id, name, description) VALUES ($1,'Sales Pipeline','Default sales pipeline') RETURNING id`,
        [storeId]
      );
      const pipelineId = pipelineRes.rows[0].id;
      const stagesRes = await client.query(
        `INSERT INTO crm_stages (pipeline_id, name, position) VALUES ($1,'New Lead',0),($1,'Qualified',1),($1,'Proposal',2),($1,'Closed Won',3) RETURNING id`,
        [pipelineId]
      );
      const stageIds = stagesRes.rows.map((r) => r.id);
      for (let i = 0; i < 5; i++) {
        const cust = randItem(customers);
        await client.query(
          `INSERT INTO crm_deals (store_id, pipeline_id, stage_id, customer_id, title, value, status, expected_close_date)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [
            storeId,
            pipelineId,
            randItem(stageIds),
            cust.id,
            randItem(['Catering event','Corporate lunch','Wedding cake','Monthly coffee subscription','Holiday party']),
            rand(200,2000),
            randItem(['open','won','lost']),
            new Date(Date.now() + rand(7,60)*24*60*60*1000).toISOString().split('T')[0],
          ]
        );
      }

      // email campaigns
      await client.query(
        `INSERT INTO email_campaigns (store_id, name, subject, content_html, status, target_segment, sent_count, scheduled_at)
         VALUES ($1,'Summer Promo','Beat the heat with our new iced menu','<p>Check out our refreshing summer drinks.</p>','sent','active',245,NOW()-INTERVAL '10 days')`,
        [storeId]
      );
      await client.query(
        `INSERT INTO email_campaigns (store_id, name, subject, content_html, status, target_segment, scheduled_at)
         VALUES ($1,'VIP Dinner','Exclusive tasting night','<p>Join us for an exclusive tasting menu.</p>','scheduled','vip',NOW()+INTERVAL '5 days')`,
        [storeId]
      );

      // tasks & shifts
      for (let i = 0; i < 3; i++) {
        await client.query(
          `INSERT INTO tasks (store_id, title, description, assigned_to, status, due_date, source)
           VALUES ($1,$2,$3,$4,$5,$6,'manual')`,
          [
            storeId,
            randItem(['Update menu photos','Call supplier','Schedule staff training','Clean patio furniture']),
            'Created from demo seed.',
            staffId,
            randItem(['todo','in_progress','done']),
            new Date(Date.now() + rand(-2,7)*24*60*60*1000).toISOString(),
          ]
        );
      }
      for (let i = 0; i < 5; i++) {
        const start = new Date();
        start.setDate(start.getDate() + i);
        start.setHours(rand(8,14), 0, 0, 0);
        const end = new Date(start);
        end.setHours(start.getHours() + 8);
        await client.query(
          `INSERT INTO shifts (store_id, user_id, role, start_time, end_time, status)
           VALUES ($1,$2,$3,$4,$5,'scheduled')`,
          [storeId, i % 2 === 0 ? ownerId : staffId, i % 2 === 0 ? 'manager' : 'server', start.toISOString(), end.toISOString()]
        );
      }

      // CMS settings
      const themeId = themeMap[biz.themeSlug];
      await client.query(
        `INSERT INTO cms_settings (store_id, logo_url, favicon_url, primary_color, accent_color, font_family,
           button_style, border_radius, theme_mode, layout_type, theme_id, seo_title, seo_description, version, published_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
        [
          storeId,
          unsplash(biz.products[0].image),
          '',
          biz.primaryColor,
          biz.accentColor,
          biz.fontFamily,
          'rounded',
          '0.75rem',
          biz.themeSlug === 'dark' ? 'dark' : 'light',
          'modern',
          themeId,
          `${biz.name} — Order Online`,
          `Discover fresh, delicious offerings at ${biz.name}. Order online for pickup or delivery.`,
          1,
          new Date().toISOString(),
        ]
      );

      // CMS pages
      const homeRes = await client.query(
        `INSERT INTO cms_pages (store_id, slug, title, type, is_system_page, status, show_in_navigation, navigation_label,
           seo_title, seo_description, published_at)
         VALUES ($1,'home','Home','system',true,'published',false,'Home',$2,$3,$4) RETURNING id`,
        [storeId, `${biz.name} — Home`, `Welcome to ${biz.name}`, new Date().toISOString()]
      );
      const homeId = homeRes.rows[0].id;

      const aboutRes = await client.query(
        `INSERT INTO cms_pages (store_id, slug, title, type, is_system_page, status, show_in_navigation, navigation_label,
           seo_title, seo_description, published_at)
         VALUES ($1,'about','About Us','custom',false,'published',true,'About',$2,$3,$4) RETURNING id`,
        [storeId, `About ${biz.name}`, `Our story and values`, new Date().toISOString()]
      );
      const contactRes = await client.query(
        `INSERT INTO cms_pages (store_id, slug, title, type, is_system_page, status, show_in_navigation, navigation_label,
           seo_title, seo_description, published_at)
         VALUES ($1,'contact','Contact','custom',false,'published',true,'Contact',$2,$3,$4) RETURNING id`,
        [storeId, `Contact ${biz.name}`, `Get in touch`, new Date().toISOString()]
      );

      // CMS sections for home
      const heroSection = {
        pageId: homeId,
        type: 'hero',
        position: 0,
        content: {
          title: `Welcome to ${biz.name}`,
          subtitle: 'Fresh flavors, crafted with passion.',
          cta_primary_text: 'Order Now',
          cta_primary_link: `/shop/${biz.slug}`,
          image_url: unsplash(biz.products[0].image),
        },
      };
      const featuredSection = {
        pageId: homeId,
        type: 'featured_menu',
        position: 1,
        content: { title: 'Customer Favorites', subtitle: 'Most loved items', limit: 4, show_category_filter: true },
      };
      const aboutSection = {
        pageId: homeId,
        type: 'about',
        position: 2,
        content: {
          title: 'Our Story',
          description: `${biz.name} has been serving the community with passion and quality since day one.`,
          image_url: unsplash(biz.products[1].image),
        },
      };
      const contactSection = {
        pageId: homeId,
        type: 'contact_form',
        position: 3,
        content: { title: 'Get in Touch', phone: randomPhone(), email: biz.ownerEmail, address: randItem(CITIES) },
      };
      for (const s of [heroSection, featuredSection, aboutSection, contactSection]) {
        await client.query(
          `INSERT INTO cms_page_sections (store_id, page_id, type, position, content)
           VALUES ($1,$2,$3,$4,$5)`,
          [storeId, s.pageId, s.type, s.position, JSON.stringify(s.content)]
        );
      }

      // CMS navigation
      await client.query(
        `INSERT INTO cms_navigation_items (store_id, location, label, url, position, is_external, is_highlighted)
         VALUES ($1,'header','Home','/shop/${biz.slug}',0,false,false),
                ($1,'header','Menu','/shop/${biz.slug}/pages/menu',1,false,false),
                ($1,'header','About','/shop/${biz.slug}/pages/about',2,false,false),
                ($1,'header','Contact','/shop/${biz.slug}/pages/contact',3,false,false),
                ($1,'footer','Home','/shop/${biz.slug}',0,false,false),
                ($1,'footer','About','/shop/${biz.slug}/pages/about',1,false,false),
                ($1,'footer','Contact','/shop/${biz.slug}/pages/contact',2,false,false)`,
        [storeId]
      );

      // CMS announcements
      await client.query(
        `INSERT INTO cms_announcements (store_id, title, message, cta_text, cta_link, is_enabled, status, start_date, end_date)
         VALUES ($1,'Grand Opening Offer','Get 10% off your first online order','Order Now','/shop/${biz.slug}',true,'published',NOW()-INTERVAL '5 days',NOW()+INTERVAL '25 days')`,
        [storeId]
      );

      // CMS media
      for (const p of biz.products) {
        await client.query(
          `INSERT INTO cms_media (store_id, filename, url, mime_type, file_size, alt_text, created_by)
           VALUES ($1,$2,$3,'image/jpeg',$4,$5,$6)`,
          [storeId, `${p.slug}.jpg`, unsplash(p.image), rand(50,300)*1024, p.name, ownerId]
        );
      }

      // CMS contact messages
      for (let i = 0; i < 6; i++) {
        const cust = randItem(customers);
        await client.query(
          `INSERT INTO cms_contact_messages (store_id, name, email, phone, topic, message, preferred_response_method, status, created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [
            storeId,
            cust.name,
            cust.email,
            cust.phone,
            randItem(['general','catering','feedback','order']),
            randItem(['Hi, do you offer catering?','Love your products!','Can I customize an order?','What are your opening hours?','Thanks for the great service.']),
            randItem(['email','phone']),
            randItem(['open','in_progress','resolved']),
            randomDate(60),
          ]
        );
      }

      // QR codes
      await client.query(
        `INSERT INTO qr_codes (store_id, type, label, target_url, image_path, scan_count, metadata)
         VALUES ($1,'menu','Table Menu', '/shop/${biz.slug}', '/uploads/qr/menu-placeholder.svg', ${rand(20,200)}, '{}'),
                ($1,'page','Homepage', '/shop/${biz.slug}', '/uploads/qr/home-placeholder.svg', ${rand(10,100)}, '{}')`,
        [storeId]
      );

      // notifications
      for (let i = 0; i < 4; i++) {
        await client.query(
          `INSERT INTO notifications (store_id, user_id, type, title, message, severity, link, is_read)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [
            storeId,
            ownerId,
            randItem(['order','review','reservation','task']),
            randItem(['New order received','New 5-star review','Reservation confirmed','Task due soon']),
            randItem(['A new order just came in.','Someone left a great review.','A reservation has been confirmed.']),
            randItem(['info','success','warning']),
            '/cms',
            Math.random() > 0.5,
          ]
        );
      }

      // CMS activity logs
      await client.query(
        `INSERT INTO cms_activity_logs (store_id, user_id, action, details)
         VALUES ($1,$2,'publish_page',$3),
                ($1,$2,'update_draft_settings',$4),
                ($1,$2,'upload_media',$5)`,
        [
          storeId,
          ownerId,
          JSON.stringify({ page_id: homeId, page_title: 'Home' }),
          JSON.stringify({ theme_id: themeId }),
          JSON.stringify({ count: biz.products.length }),
        ]
      );
    }

  });

  console.log('\n[SEED] ✅ Full demo seed completed successfully.');
  console.log('\n────────────────────────────────────────────────────────────');
  console.log('Login credentials');
  console.log('────────────────────────────────────────────────────────────');
  console.log(`Admin  : ${ADMIN_USER.email} / ${PASSWORD.admin}`);
  for (const biz of BUSINESSES) {
    console.log(`${biz.name.padEnd(20)} Owner: ${biz.ownerEmail.padEnd(35)} / ${PASSWORD.owner(biz.key)}`);
    console.log(`${''.padEnd(20)} Staff: ${biz.staffEmail.padEnd(35)} / ${PASSWORD.staff(biz.key)}`);
  }
  console.log('────────────────────────────────────────────────────────────\n');
  process.exit(0);
}

seed().catch((err) => {
  console.error('[SEED] ❌ Seeding failed:', err);
  process.exit(1);
});
