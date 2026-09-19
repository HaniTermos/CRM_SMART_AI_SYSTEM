const db = require('../config/database');

class Order {
  static async createWithItems({ 
    store_id, 
    customer_id, 
    order_number, 
    payment_method = 'cash_on_delivery', 
    payment_status,
    refunded_amount = 0,
    subtotal, 
    shipping_fee, 
    discount_code, 
    discount_amount, 
    total, 
    shipping_address, 
    notes,
    source = 'dine_in',
    items 
  }, client) {
    const execute = async (tx) => {
      // Determine default payment_status if not explicitly provided
      let resolvedPaymentStatus = payment_status;
      if (!resolvedPaymentStatus) {
        if (payment_method === 'cash_on_delivery') {
          resolvedPaymentStatus = 'unpaid';
        } else if (payment_method === 'card' || payment_method === 'online' || payment_method === 'stripe') {
          resolvedPaymentStatus = 'pending';
        } else if (payment_method === 'cash') {
          resolvedPaymentStatus = 'paid';
        } else {
          resolvedPaymentStatus = 'unpaid';
        }
      }

      const orderResult = await tx.query(
        `INSERT INTO orders (store_id, customer_id, order_number, payment_method, payment_status, refunded_amount, subtotal, shipping_fee, discount_code, discount_amount, total, shipping_address, notes, source) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) 
         RETURNING *`,
        [store_id, customer_id, order_number, payment_method, resolvedPaymentStatus, refunded_amount, subtotal, shipping_fee, discount_code, discount_amount, total, shipping_address, notes, source]
      );
      
      const order = orderResult.rows[0];

      for (const item of items) {
        await tx.query(
          `INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, subtotal) 
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [order.id, item.product_id, item.product_name, item.unit_price, item.quantity, item.subtotal]
        );
      }

      await tx.query(
        `UPDATE customers 
         SET total_orders = total_orders + 1, 
             total_spent = total_spent + $1,
             last_order_at = now()
         WHERE id = $2`,
        [total, customer_id]
      );

      return order;
    };

    if (client) {
      return execute(client);
    } else {
      return db.transaction(execute);
    }
  }

  static async findById(id) {
    const result = await db.query('SELECT * FROM orders WHERE id = $1', [id]);
    const order = result.rows[0];
    if (!order) return null;

    const itemsResult = await db.query('SELECT * FROM order_items WHERE order_id = $1', [id]);
    order.items = itemsResult.rows;

    const customerResult = await db.query('SELECT name, phone, email FROM customers WHERE id = $1', [order.customer_id]);
    order.customer = customerResult.rows[0];

    return order;
  }

  static async findByNumber(storeId, orderNumber) {
    const result = await db.query('SELECT * FROM orders WHERE store_id = $1 AND order_number = $2', [storeId, orderNumber]);
    const order = result.rows[0];
    if (!order) return null;

    const itemsResult = await db.query('SELECT * FROM order_items WHERE order_id = $1', [order.id]);
    order.items = itemsResult.rows;

    const customerResult = await db.query('SELECT name, phone, email FROM customers WHERE id = $1', [order.customer_id]);
    order.customer = customerResult.rows[0];

    return order;
  }

  static async findByStore(storeId) {
    const result = await db.query(
      `SELECT o.*, c.name as customer_name, c.phone as customer_phone 
       FROM orders o
       JOIN customers c ON o.customer_id = c.id
       WHERE o.store_id = $1 
       ORDER BY o.created_at DESC`,
      [storeId]
    );
    return result.rows;
  }

  static async updateStatus(id, storeId, status) {
    const result = await db.query(
      'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 AND store_id = $3 RETURNING *',
      [status, id, storeId]
    );
    return result.rows[0] || null;
  }

  static async updatePaymentStatus(id, storeId, payment_status, refunded_amount) {
    const allowed = ['unpaid', 'pending', 'paid', 'partially_paid', 'failed', 'refunded', 'partially_refunded'];
    if (!allowed.includes(payment_status)) {
      throw new Error(`Invalid payment_status: ${payment_status}`);
    }

    let query = 'UPDATE orders SET payment_status = $1';
    const params = [payment_status];
    let paramIndex = 2;

    if (refunded_amount !== undefined) {
      query += `, refunded_amount = $${paramIndex}`;
      params.push(refunded_amount);
      paramIndex++;
    }

    query += `, updated_at = NOW() WHERE id = $${paramIndex} AND store_id = $${paramIndex + 1} RETURNING *`;
    params.push(id, storeId);

    const result = await db.query(query, params);
    return result.rows[0] || null;
  }
}

module.exports = Order;
