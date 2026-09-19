const db = require('../config/database');
const DailyMicroPulse = require('../models/DailyMicroPulse');
const PulseRecommendation = require('../models/PulseRecommendation');

class GrowthEngineService {
  static async getDailyPulse(storeId, dateOverride = null) {
    // 1. Fetch store timezone
    const storeRes = await db.query(
      `SELECT id, name, settings FROM stores WHERE id = $1`,
      [storeId]
    );
    if (storeRes.rows.length === 0) {
      throw new Error('Store not found');
    }
    const store = storeRes.rows[0];
    const rawTz = store.settings?.timezone || 'UTC+3';

    let dbTz = 'UTC';
    if (rawTz.startsWith('UTC+')) {
      const hours = rawTz.replace('UTC+', '').padStart(2, '0');
      dbTz = `+${hours}`;
    } else if (rawTz.startsWith('UTC-')) {
      const hours = rawTz.replace('UTC-', '').padStart(2, '0');
      dbTz = `-${hours}`;
    } else if (rawTz && rawTz !== 'UTC') {
      dbTz = rawTz;
    }

    // 2. Determine business date (store local date or override)
    let businessDate;
    if (dateOverride && /^\d{4}-\d{2}-\d{2}$/.test(dateOverride)) {
      businessDate = dateOverride;
    } else {
      const dateRes = await db.query(
        `SELECT (NOW() AT TIME ZONE $1)::date as current_date`,
        [dbTz]
      );
      businessDate = dateRes.rows[0].current_date.toISOString().split('T')[0];
    }

    // 3. Check for existing pulse for (storeId, businessDate) to guarantee idempotency
    const existingPulse = await DailyMicroPulse.findByStoreAndDate(storeId, businessDate);
    if (existingPulse) {
      const recommendations = await PulseRecommendation.findByPulseId(existingPulse.id);
      const snapshot = existingPulse.metrics_snapshot || {};
      const sufficiencyTier = snapshot.sufficiency_tier || 'insufficient';

      return {
        ...existingPulse,
        business_date: existingPulse.business_date.toISOString ? existingPulse.business_date.toISOString().split('T')[0] : existingPulse.business_date,
        sufficiency_tier: sufficiencyTier,
        recommendations,
        setup_actions: sufficiencyTier === 'insufficient' ? this.getSetupActions() : []
      };
    }

    // 4. Compute Metrics Snapshot
    const snapshot = await this.computeMetricsSnapshot(storeId, dbTz);
    const totalOrders = snapshot.total_alltime_orders || 0;

    // 5. Determine Sufficiency Tier
    let sufficiencyTier = 'insufficient';
    let pulseStatus = 'insufficient_data';

    if (totalOrders >= 30) {
      sufficiencyTier = 'sufficient';
      pulseStatus = 'active';
    } else if (totalOrders >= 3) {
      sufficiencyTier = 'limited';
      pulseStatus = 'active';
    }

    snapshot.sufficiency_tier = sufficiencyTier;

    // 6. Create Daily Micro Pulse record idempotently
    const pulse = await db.transaction(async (tx) => {
      const newPulse = await DailyMicroPulse.create({
        store_id: storeId,
        business_date: businessDate,
        status: pulseStatus,
        metrics_snapshot: snapshot
      }, tx);

      // 7. Generate recommendations ONLY if data tier is limited or sufficient
      if (sufficiencyTier !== 'insufficient') {
        const generatedRecs = this.generateRecommendations(storeId, newPulse.id, snapshot, sufficiencyTier);
        if (generatedRecs.length > 0) {
          await PulseRecommendation.createMany(generatedRecs, tx);
        }
      }

      return newPulse;
    });

    const recommendations = await PulseRecommendation.findByPulseId(pulse.id);

    return {
      ...pulse,
      business_date: pulse.business_date.toISOString ? pulse.business_date.toISOString().split('T')[0] : pulse.business_date,
      sufficiency_tier: sufficiencyTier,
      recommendations,
      setup_actions: sufficiencyTier === 'insufficient' ? this.getSetupActions() : []
    };
  }

  static async computeMetricsSnapshot(storeId, dbTz) {
    // Total Orders
    const totalOrdersRes = await db.query(
      `SELECT COUNT(*) as count FROM orders WHERE store_id = $1`,
      [storeId]
    );
    const total_alltime_orders = parseInt(totalOrdersRes.rows[0].count || 0);

    // Orders & Net Revenue 7d
    const stats7dRes = await db.query(
      `SELECT 
         COUNT(*) as orders_7d,
         COALESCE(SUM(
           CASE 
             WHEN payment_status = 'refunded' THEN 0
             WHEN payment_status IN ('paid', 'partially_refunded') THEN (total - COALESCE(refunded_amount, 0))
             ELSE 0
           END
         ), 0) as revenue_7d
       FROM orders
       WHERE store_id = $1 
         AND status != 'cancelled'
         AND created_at >= (NOW() - INTERVAL '7 days')`,
      [storeId]
    );
    const orders_7d = parseInt(stats7dRes.rows[0].orders_7d || 0);
    const revenue_7d = parseFloat(parseFloat(stats7dRes.rows[0].revenue_7d || 0).toFixed(2));
    const aov_7d = orders_7d > 0 ? parseFloat((revenue_7d / orders_7d).toFixed(2)) : 0;

    // Active Products & Low Stock
    const productsRes = await db.query(
      `SELECT 
         COUNT(*) FILTER (WHERE status = 'active') as active_count,
         COUNT(*) FILTER (WHERE status = 'active' AND stock <= COALESCE(min_stock, 5)) as low_stock_count
       FROM products
       WHERE store_id = $1`,
      [storeId]
    );
    const active_products_count = parseInt(productsRes.rows[0].active_count || 0);
    const low_stock_products_count = parseInt(productsRes.rows[0].low_stock_count || 0);

    // At-risk customers (ordered in past, but not in last 14 days)
    const atRiskRes = await db.query(
      `SELECT COUNT(*) as count
       FROM customers
       WHERE store_id = $1 
         AND total_orders > 0 
         AND (last_order_at IS NULL OR last_order_at < (NOW() - INTERVAL '14 days'))`,
      [storeId]
    );
    const at_risk_customers_count = parseInt(atRiskRes.rows[0].count || 0);

    // Kitchen Prep Time
    const prepRes = await db.query(
      `SELECT COALESCE(ROUND(AVG(EXTRACT(EPOCH FROM (ready_at - COALESCE(started_at, created_at))) / 60)::numeric, 1), 0) as avg_prep
       FROM kitchen_tickets
       WHERE store_id = $1 AND ready_at IS NOT NULL`,
      [storeId]
    );
    const avg_prep_time_mins = parseFloat(prepRes.rows[0].avg_prep || 0);

    return {
      total_alltime_orders,
      orders_7d,
      revenue_7d,
      aov_7d,
      active_products_count,
      low_stock_products_count,
      at_risk_customers_count,
      avg_prep_time_mins,
      snapshot_timestamp: new Date().toISOString()
    };
  }

  static generateRecommendations(storeId, pulseId, snapshot, tier) {
    const recs = [];
    const isLimited = tier === 'limited';

    // 1. REVENUE CATEGORY (Exactly 1)
    const aovStr = snapshot.aov_7d > 0 ? `$${snapshot.aov_7d.toFixed(2)}` : '$20.00';
    recs.push({
      pulse_id: pulseId,
      store_id: storeId,
      category: 'revenue',
      title: 'Promote High-Margin Menu Combos',
      priority: snapshot.aov_7d < 25 ? 'medium' : 'low',
      confidence: isLimited ? 70 : 88,
      reason: `Current average order value (${aovStr}) highlights cross-selling potential for side items and beverages.`,
      expected_impact: '$35.00 - $75.00 estimated revenue lift',
      target_role: 'owner',
      source_basis: {
        source_type: 'internal_store_data',
        metric_name: 'Average Order Value (7d)',
        current_value: aovStr,
        comparison_value: '$25.00 benchmark',
        period: 'Last 7 days',
        explanation: `Calculated from ${snapshot.orders_7d} store orders over the trailing 7-day period.`
      }
    });

    // 2. OPERATIONS CATEGORY (Exactly 1)
    if (snapshot.low_stock_products_count > 0) {
      recs.push({
        pulse_id: pulseId,
        store_id: storeId,
        category: 'operations',
        title: `Restock ${snapshot.low_stock_products_count} Low-Stock Products`,
        priority: 'high',
        confidence: isLimited ? 70 : 92,
        reason: `${snapshot.low_stock_products_count} active menu item(s) have inventory levels below minimum threshold.`,
        expected_impact: '$20.00 - $50.00 estimated stockout prevention',
        target_role: 'manager',
        source_basis: {
          source_type: 'internal_store_data',
          metric_name: 'Low Stock Product Count',
          current_value: snapshot.low_stock_products_count,
          comparison_value: 0,
          period: 'Current Store Inventory',
          explanation: `${snapshot.low_stock_products_count} active products are currently at or below minimum threshold.`
        }
      });
    } else {
      const prepTimeStr = snapshot.avg_prep_time_mins > 0 ? `${snapshot.avg_prep_time_mins} min` : '15 min';
      recs.push({
        pulse_id: pulseId,
        store_id: storeId,
        category: 'operations',
        title: 'Maintain Kitchen Station Efficiency',
        priority: 'medium',
        confidence: isLimited ? 70 : 85,
        reason: `Average active kitchen prep time is currently ${prepTimeStr}.`,
        expected_impact: '10% - 15% estimated kitchen throughput improvement',
        target_role: 'kitchen',
        source_basis: {
          source_type: 'internal_store_data',
          metric_name: 'Active Prep Time',
          current_value: prepTimeStr,
          comparison_value: '12 min benchmark',
          period: 'Completed Kitchen Tickets',
          explanation: `Tracked across historical order fulfillment tickets.`
        }
      });
    }

    // 3. CUSTOMER GROWTH CATEGORY (Exactly 1)
    if (snapshot.at_risk_customers_count > 0) {
      recs.push({
        pulse_id: pulseId,
        store_id: storeId,
        category: 'customer_growth',
        title: `Re-engage ${snapshot.at_risk_customers_count} At-Risk Regular Customers`,
        priority: 'medium',
        confidence: isLimited ? 65 : 82,
        reason: `${snapshot.at_risk_customers_count} customer(s) with order history have not placed an order in over 14 days.`,
        expected_impact: '$40.00 - $90.00 estimated customer retention value',
        target_role: 'marketing',
        source_basis: {
          source_type: 'internal_store_data',
          metric_name: 'At-Risk Customer Count',
          current_value: snapshot.at_risk_customers_count,
          comparison_value: 0,
          period: '14+ Days Inactivity',
          explanation: `Identified ${snapshot.at_risk_customers_count} registered customers with recent inactivity.`
        }
      });
    } else {
      recs.push({
        pulse_id: pulseId,
        store_id: storeId,
        category: 'customer_growth',
        title: 'Launch First-Time Visitor Loyalty Perk',
        priority: 'medium',
        confidence: isLimited ? 65 : 80,
        reason: `Build customer repeat order habits by incentivizing registration on checkout.`,
        expected_impact: '$25.00 - $55.00 estimated repeat order lift',
        target_role: 'marketing',
        source_basis: {
          source_type: 'internal_store_data',
          metric_name: 'Customer Base Expansion',
          current_value: `${snapshot.total_alltime_orders} total orders`,
          comparison_value: 'Growth Target',
          period: 'All-Time CRM Snapshot',
          explanation: `Recommendation based on total order count to build return customer habits.`
        }
      });
    }

    return recs;
  }

  static getSetupActions() {
    return [
      {
        id: 'add_products',
        title: 'Add products to store menu',
        description: 'List active products so customers can place orders.',
        link: '/inventory'
      },
      {
        id: 'first_order',
        title: 'Record initial customer orders',
        description: 'Log at least 3 orders to enable revenue analysis.',
        link: '/orders'
      },
      {
        id: 'verify_settings',
        title: 'Verify store timezone & hours',
        description: 'Ensure accurate daily metric snapshots by configuring settings.',
        link: '/settings'
      }
    ];
  }
}

module.exports = GrowthEngineService;
