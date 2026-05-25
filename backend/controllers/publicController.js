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

    let customerId;
    const custRes = await db.query('SELECT id FROM customers WHERE store_id = $1 AND phone = $2', [store.id, customer.phone]);
    if (custRes.rows.length > 0) {
      customerId = custRes.rows[0].id;
      await db.query('UPDATE customers SET name = $1, email = COALESCE($2, email) WHERE id = $3', [customer.name, customer.email, customerId]);
    } else {
      const newCust = await db.query(
        'INSERT INTO customers (store_id, name, phone, email) VALUES ($1, $2, $3, $4) RETURNING id',
        [store.id, customer.name, customer.phone, customer.email]
      );
      customerId = newCust.rows[0].id;
    }

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

    let discountAmount = 0;
    if (discount_code) {
      const normalizedCode = discount_code.toUpperCase();
      const discRes = await db.query(
        "SELECT type, value, min_subtotal FROM discount_codes WHERE store_id = $1 AND code = $2 AND active = true",
        [store.id, normalizedCode]
      );

      if (discRes.rows.length > 0) {
        const disc = discRes.rows[0];
        if (disc.min_subtotal && subtotal < Number(disc.min_subtotal)) {
          return res.status(400).json({ error: `Minimum order amount of ${disc.min_subtotal} required` });
        }
        if (disc.type === 'percent') discountAmount = subtotal * (Number(disc.value) / 100);
        else discountAmount = Number(disc.value);
      } else {
        const dealRes = await db.query(
          `SELECT d.value, c.phone AS customer_phone, c.email AS customer_email
           FROM crm_deals d
           JOIN customers c ON c.id = d.customer_id
           WHERE d.store_id = $1 AND d.redemption_code = $2 AND d.redeemed_at IS NOT NULL`,
          [store.id, normalizedCode]
        );

        if (dealRes.rows.length === 0) {
          return res.status(400).json({ error: 'Invalid or inactive discount code' });
        }

        const deal = dealRes.rows[0];
        if (deal.customer_phone !== customer.phone) {
          return res.status(400).json({ error: 'Discount code does not match your phone number' });
        }
        if (deal.customer_email && customer.email && deal.customer_email !== customer.email) {
          return res.status(400).json({ error: 'Discount code does not match your email address' });
        }

        discountAmount = Number(deal.value);
      }
    }

    const total = Math.max(0, subtotal - discountAmount) + Number(store.shipping_fee || 0);

    const orderNumber = `ORD-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const orderRes = await db.query(
      `INSERT INTO orders (store_id, customer_id, order_number, subtotal, shipping_fee, discount_code, discount_amount, total, status, shipping_address, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9, $10) RETURNING id, order_number`,
      [
        store.id,
        customerId,
        orderNumber,
        subtotal,
        Number(store.shipping_fee || 0),
        discount_code ? discount_code.toUpperCase() : null,
        discountAmount,
        total,
        JSON.stringify(address),
        notes,
      ]
    );
    const orderId = orderRes.rows[0].id;

    for (const oi of orderItemsData) {
      await db.query(
        'INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, subtotal) VALUES ($1, $2, $3, $4, $5, $6)',
        [orderId, oi.product_id, oi.product_name, oi.quantity, oi.unit_price, oi.quantity * oi.unit_price]
      );
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
    const { code, subtotal, phone, email } = req.body;

    if (!code) return res.status(400).json({ error: 'Discount code is required' });

    const storeRes = await db.query('SELECT id FROM stores WHERE slug = $1', [slug]);
    if (storeRes.rows.length === 0) return res.status(404).json({ error: 'Store not found' });
    const storeId = storeRes.rows[0].id;

    const normalizedCode = code.toUpperCase();
    const discRes = await db.query(
      "SELECT id, type, value, min_subtotal FROM discount_codes WHERE store_id = $1 AND code = $2 AND active = true",
      [storeId, normalizedCode]
    );

    if (discRes.rows.length > 0) {
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

      return res.json({ success: true, data: { code: normalizedCode, amount } });
    }

    const dealRes = await db.query(
      `SELECT d.value, c.phone AS customer_phone, c.email AS customer_email
       FROM crm_deals d
       JOIN customers c ON c.id = d.customer_id
       WHERE d.store_id = $1 AND d.redemption_code = $2 AND d.redeemed_at IS NOT NULL`,
      [storeId, normalizedCode]
    );

    if (dealRes.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or inactive discount code' });
    }

    const deal = dealRes.rows[0];
    if (!phone) {
      return res.status(400).json({ error: 'Enter your phone number to validate this deal redemption code' });
    }
    if (deal.customer_phone !== phone.trim()) {
      return res.status(400).json({ error: 'This deal code does not match your phone number' });
    }
    if (email && deal.customer_email && deal.customer_email !== email.trim()) {
      return res.status(400).json({ error: 'This deal code does not match your email address' });
    }

    res.json({ success: true, data: { code: normalizedCode, amount: Number(deal.value) } });
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

exports.lookupDeals = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { phone, email } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required.' });
    }

    const storeRes = await db.query(
      'SELECT id, name, currency FROM stores WHERE slug = $1',
      [slug]
    );
    if (storeRes.rows.length === 0) {
      return res.status(404).json({ error: 'Store not found' });
    }
    const store = storeRes.rows[0];

    const customerQuery = [
      'SELECT id, name, email, phone FROM customers WHERE store_id = $1 AND phone = $2',
    ];
    const params = [store.id, phone];

    if (email) {
      customerQuery[0] += ' AND email = $3';
      params.push(email);
    }

    const customerRes = await db.query(customerQuery[0], params);
    if (customerRes.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found with that phone number' });
    }
    const customer = customerRes.rows[0];

    const dealsRes = await db.query(
      `SELECT d.id, d.title, d.value, d.status, d.expected_close_date, d.created_at,
              d.redemption_code, d.redeemed_at,
              p.name as pipeline_name, s.name as stage_name
       FROM crm_deals d
       JOIN crm_pipelines p ON d.pipeline_id = p.id
       JOIN crm_stages s ON d.stage_id = s.id
       WHERE d.store_id = $1 AND d.customer_id = $2
       ORDER BY d.created_at DESC`,
      [store.id, customer.id]
    );

    res.json({
      success: true,
      data: {
        store: { id: store.id, name: store.name, currency: store.currency },
        customer,
        deals: dealsRes.rows,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.redeemDeal = async (req, res, next) => {
  try {
    const { slug, dealId } = req.params;
    const { phone, email } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required.' });
    }

    const storeRes = await db.query(
      'SELECT id, name, currency FROM stores WHERE slug = $1',
      [slug]
    );
    if (storeRes.rows.length === 0) {
      return res.status(404).json({ error: 'Store not found' });
    }
    const store = storeRes.rows[0];

    const customerQuery = ['SELECT id, name, email, phone FROM customers WHERE store_id = $1 AND phone = $2'];
    const params = [store.id, phone];
    if (email) {
      customerQuery[0] += ' AND email = $3';
      params.push(email);
    }

    const customerRes = await db.query(customerQuery[0], params);
    if (customerRes.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found with that phone number' });
    }
    const customer = customerRes.rows[0];

    const dealRes = await db.query(
      `SELECT d.*, c.id as customer_id, c.name as customer_name
       FROM crm_deals d
       JOIN customers c ON d.customer_id = c.id
       WHERE d.id = $1 AND d.store_id = $2`,
      [dealId, store.id]
    );

    if (dealRes.rows.length === 0) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    const deal = dealRes.rows[0];
    if (deal.customer_id !== customer.id) {
      return res.status(404).json({ error: 'This deal is not linked to the provided customer contact.' });
    }

    const redemptionCode = deal.redemption_code || `DEAL-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const redemptionNotes = deal.redemption_notes
      ? `${deal.redemption_notes}\nRedeemed via customer portal.`
      : 'Redeemed via customer portal.';

    const updatedDealRes = await db.query(
      `UPDATE crm_deals
       SET redemption_code = $1,
           redeemed_at = COALESCE(redeemed_at, NOW()),
           status = $2,
           redemption_notes = $3,
           updated_at = NOW()
       WHERE id = $4 AND store_id = $5
       RETURNING id, title, value, status, expected_close_date, created_at, redemption_code, redeemed_at, redemption_notes, pipeline_id, stage_id, customer_id`,
      [redemptionCode, 'won', redemptionNotes, dealId, store.id]
    );

    const updatedDeal = updatedDealRes.rows[0];
    const pipelineStageRes = await db.query(
      `SELECT p.name as pipeline_name, s.name as stage_name
       FROM crm_pipelines p
       JOIN crm_stages s ON s.pipeline_id = p.id
       WHERE p.id = $1 AND s.id = $2`,
      [updatedDeal.pipeline_id, updatedDeal.stage_id]
    );

    const pipelineStage = pipelineStageRes.rows[0] || { pipeline_name: null, stage_name: null };

    res.json({
      success: true,
      data: {
        customer,
        deal: {
          ...updatedDeal,
          pipeline_name: pipelineStage.pipeline_name,
          stage_name: pipelineStage.stage_name,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};



