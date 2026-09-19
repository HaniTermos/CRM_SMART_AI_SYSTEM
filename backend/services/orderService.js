const db = require('../config/database');
const KitchenTicket = require('../models/KitchenTicket');
const Customer = require('../models/Customer');
const discountService = require('./discountService');

function badRequest(message) {
  const err = new Error(message);
  err.statusCode = 400;
  return err;
}

async function createOrder({ storeId, customer, address, notes, discount_code, items, table_label, floor_id, payment_method, payment_status, source = 'dine_in', logActivity = false }) {
  const storeRes = await db.query('SELECT id, shipping_fee FROM stores WHERE id = $1', [storeId]);
  if (storeRes.rows.length === 0) {
    throw badRequest('Store not found');
  }
  const store = storeRes.rows[0];

  // Find or create customer by phone
  let customerId;
  const custRes = await db.query('SELECT id FROM customers WHERE store_id = $1 AND phone = $2', [storeId, customer.phone]);
  if (custRes.rows.length > 0) {
    customerId = custRes.rows[0].id;
    await db.query('UPDATE customers SET name = $1, email = COALESCE($2, email) WHERE id = $3', [customer.name, customer.email, customerId]);
  } else {
    const newCust = await db.query(
      'INSERT INTO customers (store_id, name, phone, email) VALUES ($1, $2, $3, $4) RETURNING id',
      [storeId, customer.name, customer.phone, customer.email]
    );
    customerId = newCust.rows[0].id;
  }

  // Validate products belong to store and calculate subtotal
  let subtotal = 0;
  const orderItemsData = [];
  for (const item of items || []) {
    const prodRes = await db.query('SELECT id, name, price, stock, status FROM products WHERE id = $1 AND store_id = $2', [item.product_id, storeId]);
    if (prodRes.rows.length === 0) {
      throw badRequest(`Product ${item.product_id} not found`);
    }
    const prod = prodRes.rows[0];
    if (prod.status !== 'active') {
      throw badRequest(`Product ${prod.name} is not available`);
    }
    const qty = item.quantity || 1;
    if (prod.stock < qty) {
      throw badRequest(`Not enough stock for ${prod.name}. Available: ${prod.stock}`);
    }
    subtotal += Number(prod.price) * qty;
    orderItemsData.push({
      product_id: item.product_id,
      product_name: prod.name,
      quantity: qty,
      unit_price: Number(prod.price)
    });
  }

  // Validate discount and compute discount amount
  let discountAmount = 0;
  if (discount_code) {
    const discountResult = await discountService.validateDiscount({
      storeId,
      code: discount_code,
      subtotal,
      phone: customer.phone,
      email: customer.email
    });
    discountAmount = discountResult.amount;
  }

  const total = Math.max(0, subtotal - discountAmount) + Number(store.shipping_fee || 0);
  const orderNumber = `ORD-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

  const paymentMethod = payment_method || 'cash_on_delivery';

  const orderSource = source || (table_label || floor_id ? 'dine_in' : 'takeaway');

  const orderRes = await db.query(
    `INSERT INTO orders (store_id, customer_id, order_number, subtotal, shipping_fee, discount_code, discount_amount, total, status, payment_method, payment_status, shipping_address, notes, table_label, floor_id, source)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', $9, $10, $11, $12, $13, $14, $15) RETURNING id, order_number`,
    [
      storeId,
      customerId,
      orderNumber,
      subtotal,
      Number(store.shipping_fee || 0),
      discount_code ? discount_code.toUpperCase() : null,
      discountAmount,
      total,
      paymentMethod,
      payment_status || null,
      JSON.stringify(address || {}),
      notes || null,
      table_label || null,
      floor_id || null,
      orderSource
    ]
  );
  const orderId = orderRes.rows[0].id;

  // Insert order items, update stock, log adjustments and low-stock alerts
  for (const oi of orderItemsData) {
    await db.query(
      'INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, subtotal) VALUES ($1, $2, $3, $4, $5, $6)',
      [orderId, oi.product_id, oi.product_name, oi.quantity, oi.unit_price, oi.quantity * oi.unit_price]
    );

    await db.query('UPDATE products SET stock = GREATEST(0, stock - $1) WHERE id = $2', [oi.quantity, oi.product_id]);

    await db.query(
      `INSERT INTO inventory_adjustments (store_id, product_id, delta, reason, note)
       VALUES ($1, $2, $3, 'sale', $4)`,
      [storeId, oi.product_id, -oi.quantity, `Order #${orderNumber}`]
    );

    const checkStock = await db.query('SELECT name, stock, min_stock FROM products WHERE id = $1', [oi.product_id]);
    if (checkStock.rows[0]) {
      const p = checkStock.rows[0];
      if (p.min_stock > 0 && p.stock <= p.min_stock) {
        await db.query(
          `INSERT INTO tasks (store_id, title, description, status, source)
           VALUES ($1, $2, $3, 'todo', 'system')`,
          [storeId, `Restock ${p.name}`, `Low stock alert: Stock is ${p.stock} (Min: ${p.min_stock})`]
        );
      }
    }
  }

  // Auto-create Kitchen Ticket
  await KitchenTicket.create({
    store_id: storeId,
    order_id: orderId,
    status: 'pending',
    station: 'All',
    priority: 0
  });

  // Update customer order stats
  await db.query(
    `UPDATE customers
     SET total_orders = total_orders + 1,
         total_spent = total_spent + $1,
         last_order_at = NOW()
     WHERE id = $2`,
    [total, customerId]
  );

  if (logActivity) {
    await Customer.logActivity({
      store_id: storeId,
      customer_id: customerId,
      type: 'order_placed',
      payload: { order_number: orderNumber, total }
    });
  }

  return { order_number: orderNumber, id: orderId };
}

module.exports = { createOrder };
