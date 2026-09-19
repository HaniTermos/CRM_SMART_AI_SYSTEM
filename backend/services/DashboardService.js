const db = require('../config/database');
const UserDashboardLayout = require('../models/UserDashboardLayout');

class DashboardService {
  static async getDashboardMetrics(store_id, mode = 'today', user_id = null) {
    const storeRes = await db.query(
      `SELECT * FROM stores WHERE id = $1`,
      [store_id]
    );
    
    if (storeRes.rows.length === 0) {
      const err = new Error('Store not found');
      err.status = 404;
      throw err;
    }

    const store = storeRes.rows[0];

    // Today & Yesterday Sales Aggregations
    const salesAggRes = await db.query(
      `SELECT
        COALESCE(SUM(CASE WHEN DATE(created_at) = CURRENT_DATE THEN total ELSE 0 END), 0)::numeric(10,2) AS today_revenue,
        COALESCE(SUM(CASE WHEN DATE(created_at) = CURRENT_DATE - INTERVAL '1 day' THEN total ELSE 0 END), 0)::numeric(10,2) AS yesterday_revenue,
        COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END)::int AS today_total_orders,
        COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE AND status = 'delivered' THEN 1 END)::int AS today_completed_orders,
        COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE AND status IN ('pending', 'confirmed', 'shipped') THEN 1 END)::int AS today_pending_orders,
        COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE AND status = 'cancelled' THEN 1 END)::int AS today_cancelled_orders,
        COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE - INTERVAL '1 day' THEN 1 END)::int AS yesterday_orders,
        COUNT(*)::int AS total_orders,
        COALESCE(AVG(CASE WHEN status != 'cancelled' THEN total END), 0)::numeric(10,2) AS avg_order_value
       FROM orders WHERE store_id = $1`,
      [store_id]
    );

    const agg = salesAggRes.rows[0] || {};
    const todayRevenue = Number(agg.today_revenue || 0);
    const yesterdayRevenue = Number(agg.yesterday_revenue || 0);
    const revenueComparison = yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 : 0;

    const todayTotalOrders = Number(agg.today_total_orders || 0);
    const yesterdayOrders = Number(agg.yesterday_orders || 0);
    const orderComparison = yesterdayOrders > 0 ? ((todayTotalOrders - yesterdayOrders) / yesterdayOrders) * 100 : 0;

    // Customers Count
    const customerRes = await db.query(
      `SELECT COUNT(*)::int AS total_customers FROM customers WHERE store_id = $1`,
      [store_id]
    );
    const totalCustomers = Number(customerRes.rows[0]?.total_customers || 0);

    // KDS Active Ticket Times
    const kdsRes = await db.query(
      `SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (NOW() - created_at))/60), 12)::numeric(10,1) AS avg_prep_time
       FROM kitchen_tickets WHERE store_id = $1 AND status IN ('pending', 'preparing')`,
      [store_id]
    );
    const avgActivePrepTime = Number(kdsRes.rows[0]?.avg_prep_time || 12);

    // Reservations Aggregations
    const resAggRes = await db.query(
      `SELECT status, COUNT(*)::int AS count
       FROM reservations
       WHERE store_id = $1 AND DATE(reservation_time) = CURRENT_DATE
       GROUP BY status`,
      [store_id]
    );

    const reservationsBreakdown = {
      pending: 0,
      confirmed: 0,
      seated: 0,
      completed: 0,
      noShow: 0,
      cancelled: 0,
    };

    let tonightReservations = 0;
    for (const r of resAggRes.rows) {
      const cnt = Number(r.count || 0);
      tonightReservations += cnt;
      if (r.status in reservationsBreakdown) {
        reservationsBreakdown[r.status] = cnt;
      }
    }

    // User Layout Config
    let savedLayout = [];
    if (user_id) {
      try {
        const layoutRecord = await UserDashboardLayout.getLayout(user_id, store_id, mode);
        if (layoutRecord) savedLayout = layoutRecord.layout_config;
      } catch {
        // Fallback if table is empty
      }
    }

    const hasActivity = Number(agg.total_orders || 0) > 0 || tonightReservations > 0;

    return {
      store,
      todayRevenue,
      yesterdayRevenue,
      revenueComparison,
      todayOrders: todayTotalOrders,
      todayTotalOrders,
      todayCompletedOrders: Number(agg.today_completed_orders || 0),
      todayPendingOrders: Number(agg.today_pending_orders || 0),
      todayCancelledOrders: Number(agg.today_cancelled_orders || 0),
      yesterdayOrders,
      orderComparison,
      avgOrderValue: Number(agg.avg_order_value || 0),
      totalCustomers,
      avgPrepTime: avgActivePrepTime,
      avgTotalTicketTime: avgActivePrepTime + 5,
      avgActivePrepTime,
      tonightReservations,
      reservationsBreakdown,
      totalOrders: Number(agg.total_orders || 0),
      hasActivity,
      timezoneUsed: store.settings?.timezone || store.timezone || 'UTC',
      mode,
      saved_layout: savedLayout,
    };
  }

  static async getAuthenticatedStoreStats(store_id) {
    return await this.getDashboardMetrics(store_id, 'today', null);
  }

  static async saveUserLayout(user_id, store_id, mode, layout_config) {
    return await UserDashboardLayout.saveLayout(user_id, store_id, mode, layout_config);
  }
}

module.exports = DashboardService;
