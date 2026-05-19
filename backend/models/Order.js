const db = require('../config/database');

class Order {
  /**
   * Creates an order and its items in a transaction.
   * Logs a customer activity for the order placement.
   */
  static async createWithItems({ 
    store_id, 
    customer_id, 
    order_number, 
    payment_method, 
    subtotal, 
    shipping_fee, 
    discount_code, 
    discount_amount, 
    total, 
    shipping_address, 
    notes,
    items 
  }, client) {
    // Note: We expect the caller to wrap this in db.transaction if they don't provide a client
    const execute = async (tx) => {
      const orderResult = await tx.query(
        `INSERT INTO orders (store_id, customer_id, order_number, payment_method, subtotal, shipping_fee, discount_code, discount_amount, total, shipping_address, notes) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
         RETURNING *`,
        [store_id, customer_id, order_number, payment_method, subtotal, shipping_fee, discount_code, discount_amount, total, shipping_address, notes]
      );
      
      const order = orderResult.rows[0];

      // Insert all items
      for (const item of items) {
        await tx.query(
          `INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity, subtotal) 
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [order.id, item.product_id, item.product_name, item.unit_price, item.quantity, item.subtotal]
        );
      }

      // Update customer stats
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
    // Join with customers to get name/phone for the list view
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

  static async updateStatus(id, status) {
    const result = await db.query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    return result.rows[0] || null;
  }
}

module.exports = Order;
