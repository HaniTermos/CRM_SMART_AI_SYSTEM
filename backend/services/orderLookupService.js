const db = require('../config/database');

function badRequest(message) {
  const err = new Error(message);
  err.statusCode = 400;
  return err;
}

async function lookupOrder({ storeId, orderNumber, phone }) {
  const storeRes = await db.query('SELECT id, currency FROM stores WHERE id = $1', [storeId]);
  const store = storeRes.rows[0] || { currency: null };

  const orderRes = await db.query(
    `SELECT o.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone
     FROM orders o
     JOIN customers c ON o.customer_id = c.id
     WHERE o.store_id = $1 AND o.order_number = $2 AND c.phone = $3`,
    [storeId, (orderNumber || '').toUpperCase(), phone]
  );

  if (orderRes.rows.length === 0) {
    throw badRequest('Order not found or phone number does not match');
  }

  const order = orderRes.rows[0];

  const itemsRes = await db.query('SELECT * FROM order_items WHERE order_id = $1', [order.id]);
  const items = itemsRes.rows.map(item => ({
    ...item,
    subtotal: item.quantity * Number(item.unit_price)
  }));

  return {
    order,
    items,
    store: { currency: store.currency },
    customer: { name: order.customer_name }
  };
}

module.exports = { lookupOrder };
