const DashboardService = require('../services/DashboardService');
const db = require('../config/database');

exports.getDashboardMetrics = async (req, res, next) => {
  try {
    const metrics = await DashboardService.getMetrics(req.params.storeId);
    res.json({ success: true, data: metrics });
  } catch (error) {
    next(error);
  }
};

exports.getOrdersWithItems = async (req, res, next) => {
  try {
    const { storeId } = req.params;
    const sinceIso = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    
    const ordersResult = await db.query(
      `SELECT id, total, status, created_at
       FROM orders
       WHERE store_id = $1 AND created_at >= $2
       ORDER BY created_at ASC`,
      [storeId, sinceIso]
    );
    
    const orders = ordersResult.rows;
    if (orders.length > 0) {
      const orderIds = orders.map(o => o.id);
      const itemsResult = await db.query(
        `SELECT order_id, product_name, quantity, unit_price
         FROM order_items
         WHERE order_id = ANY($1)`,
        [orderIds]
      );
      
      const itemsByOrderId = {};
      for (const item of itemsResult.rows) {
        if (!itemsByOrderId[item.order_id]) itemsByOrderId[item.order_id] = [];
        itemsByOrderId[item.order_id].push(item);
      }
      
      for (const order of orders) {
        order.order_items = itemsByOrderId[order.id] || [];
      }
    }

    res.json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

exports.getSegments = async (req, res, next) => {
  try {
    const { storeId } = req.params;
    const result = await db.query(
      `SELECT segment FROM customers WHERE store_id = $1`,
      [storeId]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

exports.getRevenueByCategory = async (req, res, next) => {
  try {
    const { storeId } = req.params;
    const { days = 90 } = req.query;
    const sinceIso = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000).toISOString();

    const result = await db.query(
      `SELECT COALESCE(c.name, 'Uncategorized') AS name,
              SUM(oi.subtotal) AS revenue,
              SUM(oi.quantity) AS quantity
       FROM order_items oi
       JOIN orders o ON oi.order_id = o.id
       LEFT JOIN products p ON oi.product_id = p.id
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE o.store_id = $1
         AND o.status NOT IN ('cancelled')
         AND o.created_at >= $2
       GROUP BY c.name
       ORDER BY revenue DESC`,
      [storeId, sinceIso]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

exports.getSalesByChannel = async (req, res, next) => {
  try {
    const { storeId } = req.params;
    const { days = 90 } = req.query;
    const sinceIso = new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000).toISOString();

    const result = await db.query(
      `SELECT source AS name,
              COUNT(*) AS orders,
              SUM(total) AS revenue,
              ROUND(COUNT(*) * 100.0 / NULLIF(SUM(COUNT(*)) OVER (), 0), 1) AS percentage
       FROM orders
       WHERE store_id = $1
         AND status NOT IN ('cancelled')
         AND created_at >= $2
       GROUP BY source
       ORDER BY revenue DESC`,
      [storeId, sinceIso]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

exports.getHourlyDensity = async (req, res, next) => {
  try {
    const { storeId } = req.params;
    const { weeks = 4 } = req.query;
    const sinceIso = new Date(Date.now() - Number(weeks) * 7 * 24 * 60 * 60 * 1000).toISOString();

    const result = await db.query(
      `SELECT EXTRACT(DOW FROM created_at) AS day_of_week,
              EXTRACT(HOUR FROM created_at) AS hour,
              COUNT(*) AS orders
       FROM orders
       WHERE store_id = $1
         AND status NOT IN ('cancelled')
         AND created_at >= $2
       GROUP BY day_of_week, hour`,
      [storeId, sinceIso]
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};
