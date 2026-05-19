const db = require('../config/database');

exports.getStoreBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const result = await db.query(
      `SELECT id, name, slug, currency, shipping_fee 
       FROM stores 
       WHERE slug = $1`,
      [slug]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Store not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

exports.getStoreProducts = async (req, res, next) => {
  try {
    const { storeId } = req.params;
    const result = await db.query(
      `SELECT id, name, slug, price, image_url, description, category_id, stock
       FROM products 
       WHERE store_id = $1 AND status = 'active'
       ORDER BY created_at DESC`,
      [storeId]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

exports.getStoreProductBySlug = async (req, res, next) => {
  try {
    const { storeId, slug } = req.params;
    const result = await db.query(
      `SELECT id, name, slug, price, image_url, description, stock
       FROM products 
       WHERE store_id = $1 AND slug = $2 AND status = 'active'`,
      [storeId, slug]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

exports.getStoreCategories = async (req, res, next) => {
  try {
    const { storeId } = req.params;
    const result = await db.query(
      `SELECT id, name
       FROM categories 
       WHERE store_id = $1
       ORDER BY name ASC`,
      [storeId]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

exports.getProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const result = await db.query(
      `SELECT id, author_name, rating, comment, verified_purchase, created_at
       FROM product_reviews 
       WHERE product_id = $1 AND status = 'approved'
       ORDER BY created_at DESC`,
      [productId]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

exports.placeOrder = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { customer, address, notes, discount_code, items } = req.body;

    const storeRes = await db.query('SELECT id, shipping_fee FROM stores WHERE slug = $1', [slug]);
    if (storeRes.rows.length === 0) return res.status(404).json({ error: 'Store not found' });
    const store = storeRes.rows[0];

    // Find or create customer
    let customerId;
    const custRes = await db.query('SELECT id FROM customers WHERE store_id = $1 AND phone = $2', [store.id, customer.phone]);
    if (custRes.rows.length > 0) {
      customerId = custRes.rows[0].id;
      // Update name/email if provided
      await db.query('UPDATE customers SET name = $1, email = COALESCE($2, email) WHERE id = $3', [customer.name, customer.email, customerId]);
    } else {
      const newCust = await db.query(
        'INSERT INTO customers (store_id, name, phone, email) VALUES ($1, $2, $3, $4) RETURNING id',
        [store.id, customer.name, customer.phone, customer.email]
      );
      customerId = newCust.rows[0].id;
    }

    // Calculate subtotal from products
    let subtotal = 0;
    const orderItemsData = [];
    for (const item of items) {
      const prodRes = await db.query('SELECT name, price FROM products WHERE id = $1 AND store_id = $2', [item.product_id, store.id]);
      if (prodRes.rows.length > 0) {
        const prod = prodRes.rows[0];
        const qty = item.quantity || 1;
        subtotal += Number(prod.price) * qty;
        orderItemsData.push({ product_id: item.product_id, product_name: prod.name, quantity: qty, unit_price: Number(prod.price) });
      }
    }

    // Apply discount (mock implementation)
    let discountAmount = 0;
    if (discount_code) {
      const discRes = await db.query("SELECT type, value FROM discount_codes WHERE store_id = $1 AND code = $2 AND active = true", [store.id, discount_code.toUpperCase()]);
      if (discRes.rows.length > 0) {
        const disc = discRes.rows[0];
        if (disc.type === 'percent') discountAmount = subtotal * (Number(disc.value) / 100);
        else discountAmount = Number(disc.value);
      }
    }

    const total = Math.max(0, subtotal - discountAmount) + Number(store.shipping_fee || 0);

    // Create order
    const orderNumber = `ORD-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const orderRes = await db.query(
      `INSERT INTO orders (store_id, customer_id, order_number, subtotal, discount_amount, total, status, shipping_address, notes)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, $8) RETURNING id, order_number`,
      [store.id, customerId, orderNumber, subtotal, discountAmount, total, JSON.stringify(address), notes]
    );
    const orderId = orderRes.rows[0].id;

    // Create order items
    for (const oi of orderItemsData) {
      await db.query(
        'INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, subtotal) VALUES ($1, $2, $3, $4, $5, $6)',
        [orderId, oi.product_id, oi.product_name, oi.quantity, oi.unit_price, oi.quantity * oi.unit_price]
      );
      // Deduct stock
      await db.query('UPDATE products SET stock = GREATEST(0, stock - $1) WHERE id = $2', [oi.quantity, oi.product_id]);
    }

    res.json({ success: true, data: { order_number: orderNumber, id: orderId } });
  } catch (error) {
    next(error);
  }
};

exports.validateDiscount = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { code, subtotal } = req.body;

    const storeRes = await db.query('SELECT id FROM stores WHERE slug = $1', [slug]);
    if (storeRes.rows.length === 0) return res.status(404).json({ error: 'Store not found' });
    const storeId = storeRes.rows[0].id;

    const discRes = await db.query(
      "SELECT id, type, value, min_subtotal FROM discount_codes WHERE store_id = $1 AND code = $2 AND active = true",
      [storeId, code.toUpperCase()]
    );

    if (discRes.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or inactive discount code' });
    }

    const disc = discRes.rows[0];
    if (disc.min_subtotal && subtotal < Number(disc.min_subtotal)) {
      return res.status(400).json({ error: `Minimum order amount of ${disc.min_subtotal} required` });
    }

    let amount = 0;
    if (disc.type === 'percent') {
      amount = subtotal * (Number(disc.value) / 100);
    } else {
      amount = Number(disc.value);
    }

    res.json({ success: true, data: { code: code.toUpperCase(), amount } });
  } catch (error) {
    next(error);
  }
};

exports.lookupOrder = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { orderNumber, phone } = req.body;

    const storeRes = await db.query('SELECT id, name, currency FROM stores WHERE slug = $1', [slug]);
    if (storeRes.rows.length === 0) return res.status(404).json({ error: 'Store not found' });
    const store = storeRes.rows[0];

    const orderRes = await db.query(
      `SELECT o.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone
       FROM orders o
       JOIN customers c ON o.customer_id = c.id
       WHERE o.store_id = $1 AND o.order_number = $2 AND c.phone = $3`,
      [store.id, orderNumber.toUpperCase(), phone]
    );

    if (orderRes.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found or phone number does not match' });
    }

    const order = orderRes.rows[0];
    const itemsRes = await db.query('SELECT * FROM order_items WHERE order_id = $1', [order.id]);
    const items = itemsRes.rows.map(item => ({
      ...item,
      subtotal: item.quantity * Number(item.unit_price)
    }));

    res.json({
      success: true,
      data: {
        order,
        items,
        store: { currency: store.currency },
        customer: { name: order.customer_name }
      }
    });
  } catch (error) {
    next(error);
  }
};



