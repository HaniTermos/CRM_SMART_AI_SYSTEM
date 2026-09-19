const db = require('../config/database');

class AiContextBuilder {
  static async buildStoreContext(store_id, page_context = 'dashboard') {
    const storeRes = await db.query(`SELECT id, name, slug, currency, business_type FROM stores WHERE id = $1`, [store_id]);
    if (storeRes.rows.length === 0) throw new Error('Store not found');
    const store = storeRes.rows[0];

    const [salesRes, ordersRes, productsRes, lowStockRes] = await Promise.all([
      db.query(
        `SELECT COALESCE(SUM(total), 0)::numeric(10,2) AS total_revenue, COUNT(*)::int AS total_orders 
         FROM orders WHERE store_id = $1 AND created_at >= NOW() - INTERVAL '30 days'`,
        [store_id]
      ),
      db.query(
        `SELECT status, COUNT(*)::int AS count FROM orders WHERE store_id = $1 GROUP BY status`,
        [store_id]
      ),
      db.query(`SELECT COUNT(*)::int AS total_products FROM products WHERE store_id = $1`, [store_id]),
      db.query(
        `SELECT COUNT(*)::int AS low_stock_count FROM products WHERE store_id = $1 AND stock <= min_stock`,
        [store_id]
      )
    ]);

    const orderStatusMap = {};
    ordersRes.rows.forEach(r => { orderStatusMap[r.status] = r.count; });

    return {
      store_id: store.id,
      store_name: store.name,
      store_slug: store.slug,
      currency: store.currency,
      business_type: store.business_type,
      page_context,
      metrics: {
        revenue_30d: salesRes.rows[0].total_revenue,
        orders_30d: salesRes.rows[0].total_orders,
        order_statuses: orderStatusMap,
        total_products: productsRes.rows[0].total_products,
        low_stock_products: lowStockRes.rows[0].low_stock_count
      },
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = AiContextBuilder;
