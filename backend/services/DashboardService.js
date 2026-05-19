const db = require('../config/database');

class DashboardService {
  /**
   * Generates the metrics dashboard data matching the TanStack/Supabase frontend expectations
   */
  static async getMetrics(storeId) {
    // 1. Total Revenue
    const revenueResult = await db.query(
      `SELECT SUM(total) as revenue 
       FROM orders 
       WHERE store_id = $1 AND status != 'cancelled'`,
      [storeId]
    );
    const revenue = parseFloat(revenueResult.rows[0].revenue || 0);

    // 2. Active Orders
    const ordersResult = await db.query(
      `SELECT COUNT(*) as count 
       FROM orders 
       WHERE store_id = $1 AND status IN ('pending', 'confirmed', 'shipped')`,
      [storeId]
    );
    const activeOrders = parseInt(ordersResult.rows[0].count || 0);

    // 3. Low Stock Alerts
    const stockResult = await db.query(
      `SELECT COUNT(*) as count 
       FROM products 
       WHERE store_id = $1 AND stock <= 5 AND status = 'active'`,
      [storeId]
    );
    const lowStockAlerts = parseInt(stockResult.rows[0].count || 0);

    // 4. Total Customers
    const customersResult = await db.query(
      `SELECT COUNT(*) as count 
       FROM customers 
       WHERE store_id = $1`,
      [storeId]
    );
    const totalCustomers = parseInt(customersResult.rows[0].count || 0);

    // 5. Recent Orders List
    const recentOrdersResult = await db.query(
      `SELECT o.id, o.order_number, o.total, o.status, o.created_at, c.name as customer_name 
       FROM orders o
       JOIN customers c ON o.customer_id = c.id
       WHERE o.store_id = $1
       ORDER BY o.created_at DESC
       LIMIT 5`,
      [storeId]
    );

    return {
      totalRevenue: revenue,
      activeOrders,
      lowStockAlerts,
      totalCustomers,
      recentOrders: recentOrdersResult.rows
    };
  }
}

module.exports = DashboardService;
