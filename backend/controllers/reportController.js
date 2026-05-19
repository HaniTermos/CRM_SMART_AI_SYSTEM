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
