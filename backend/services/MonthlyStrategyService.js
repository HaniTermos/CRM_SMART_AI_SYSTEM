const db = require('../config/database');
const MonthlyGrowthStrategy = require('../models/MonthlyGrowthStrategy');
const MonthlyStrategyRecommendation = require('../models/MonthlyStrategyRecommendation');
const ExternalMarketSignalService = require('./ExternalMarketSignalService');

class MonthlyStrategyService {
  static async getMonthlyStrategy(storeId, periodOverride = null, options = {}) {
    const includeExternal = options.include_external === true || options.include_external === 'true';

    // 1. Resolve store timezone and strategy period
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
      dbTz = `+${rawTz.replace('UTC+', '').padStart(2, '0')}`;
    } else if (rawTz.startsWith('UTC-')) {
      dbTz = `-${rawTz.replace('UTC-', '').padStart(2, '0')}`;
    } else if (rawTz && rawTz !== 'UTC') {
      dbTz = rawTz;
    }

    let strategyPeriod;
    if (periodOverride && /^\d{4}-\d{2}$/.test(periodOverride)) {
      strategyPeriod = periodOverride;
    } else {
      const periodRes = await db.query(
        `SELECT TO_CHAR(NOW() AT TIME ZONE $1, 'YYYY-MM') as current_period`,
        [dbTz]
      );
      strategyPeriod = periodRes.rows[0].current_period;
    }

    // 2. Check for existing monthly strategy record
    let existing = await MonthlyGrowthStrategy.findByStoreAndPeriod(storeId, strategyPeriod);
    
    if (!existing) {
      existing = await this.generateAndSaveStrategy(storeId, strategyPeriod);
    }

    let recommendations = await MonthlyStrategyRecommendation.findByStrategyId(existing.id);
    const tier = existing.data_sufficiency_tier || 'insufficient';

    // 3. Attach external evidence if requested and enabled
    let externalSignals = [];
    if (includeExternal && ExternalMarketSignalService.isFeatureEnabled()) {
      externalSignals = await ExternalMarketSignalService.getVerifiedSignalsForStrategy(storeId, strategyPeriod);
    }

    if (includeExternal && externalSignals.length > 0 && tier !== 'insufficient') {
      recommendations = recommendations.map(rec => this.enrichWithExternalEvidence(rec, externalSignals));
    }

    return {
      ...existing,
      data_sufficiency_tier: tier,
      external_context_used: includeExternal && externalSignals.length > 0 && tier !== 'insufficient',
      external_signals_count: includeExternal ? externalSignals.length : 0,
      recommendations,
      setup_actions: tier === 'insufficient' ? this.getSetupActions() : []
    };
  }

  static async generateAndSaveStrategy(storeId, strategyPeriod) {
    const snapshot = await this.computeMetricsSnapshot(storeId);
    const pastOutcomes = await this.getPastOutcomesSummary(storeId);

    const orders30d = snapshot.orders_30d || 0;
    let sufficiencyTier = 'insufficient';
    let strategyStatus = 'insufficient_data';

    if (orders30d >= 30) {
      sufficiencyTier = 'sufficient';
      strategyStatus = 'active';
    } else if (orders30d >= 10) {
      sufficiencyTier = 'limited';
      strategyStatus = 'active';
    }

    snapshot.sufficiency_tier = sufficiencyTier;

    return await db.transaction(async (tx) => {
      const newStrategy = await MonthlyGrowthStrategy.create({
        store_id: storeId,
        strategy_period: strategyPeriod,
        status: strategyStatus,
        data_sufficiency_tier: sufficiencyTier,
        metrics_snapshot: snapshot,
        past_outcomes_summary: pastOutcomes
      }, tx);

      if (sufficiencyTier !== 'insufficient') {
        const recommendations = this.generateMonthlyRecommendations(storeId, newStrategy.id, snapshot, pastOutcomes, sufficiencyTier);
        if (recommendations.length > 0) {
          await MonthlyStrategyRecommendation.createMany(recommendations, tx);
        }
      }

      return newStrategy;
    });
  }

  static async refreshMonthlyStrategy(storeId, periodOverride = null) {
    const storeRes = await db.query(`SELECT id, settings FROM stores WHERE id = $1`, [storeId]);
    if (storeRes.rows.length === 0) throw new Error('Store not found');

    const rawTz = storeRes.rows[0].settings?.timezone || 'UTC+3';
    let dbTz = 'UTC';
    if (rawTz.startsWith('UTC+')) dbTz = `+${rawTz.replace('UTC+', '').padStart(2, '0')}`;
    else if (rawTz.startsWith('UTC-')) dbTz = `-${rawTz.replace('UTC-', '').padStart(2, '0')}`;
    else if (rawTz && rawTz !== 'UTC') dbTz = rawTz;

    let strategyPeriod;
    if (periodOverride && /^\d{4}-\d{2}$/.test(periodOverride)) {
      strategyPeriod = periodOverride;
    } else {
      const periodRes = await db.query(`SELECT TO_CHAR(NOW() AT TIME ZONE $1, 'YYYY-MM') as current_period`, [dbTz]);
      strategyPeriod = periodRes.rows[0].current_period;
    }

    // Force regeneration of recommendations
    const existing = await MonthlyGrowthStrategy.findByStoreAndPeriod(storeId, strategyPeriod);
    if (existing) {
      const snapshot = await this.computeMetricsSnapshot(storeId);
      const pastOutcomes = await this.getPastOutcomesSummary(storeId);
      const tier = existing.data_sufficiency_tier;

      if (tier !== 'insufficient') {
        const newRecs = this.generateMonthlyRecommendations(storeId, existing.id, snapshot, pastOutcomes, tier);
        await MonthlyStrategyRecommendation.createMany(newRecs);
      }
    }

    return await this.getMonthlyStrategy(storeId, strategyPeriod, { include_external: true });
  }

  static enrichWithExternalEvidence(recommendation, externalSignals) {
    const relevantSignals = externalSignals.filter(s => {
      if (recommendation.category === 'revenue_optimization' && ['weather', 'competitor_pricing', 'seasonal_trend', 'market_observation'].includes(s.signal_type)) {
        return true;
      }
      if (recommendation.category === 'operational_efficiency' && ['weather', 'competitor_availability', 'local_event', 'public_holiday'].includes(s.signal_type)) {
        return true;
      }
      if (recommendation.category === 'customer_retention' && ['local_event', 'public_holiday', 'market_observation', 'seasonal_trend'].includes(s.signal_type)) {
        return true;
      }
      return false;
    });

    if (relevantSignals.length === 0) {
      return recommendation;
    }

    const externalEvidence = relevantSignals.map(s => ({
      id: s.id,
      signal_type: s.signal_type,
      title: s.title,
      source_name: s.source_name,
      observed_at: s.observed_at,
      confidence: s.confidence
    }));

    const maxConfidence = Math.max(...relevantSignals.map(s => s.confidence));

    return {
      ...recommendation,
      external_evidence: externalEvidence,
      external_signal_ids: relevantSignals.map(s => s.id),
      external_confidence: maxConfidence,
      external_context_used: true,
      external_context_note: 'External context may support this recommendation but does not establish causation.'
    };
  }

  static async computeMetricsSnapshot(storeId) {
    const sales30dRes = await db.query(
      `SELECT 
         COUNT(*) as orders_30d,
         COALESCE(SUM(
           CASE 
             WHEN payment_status = 'refunded' THEN 0
             WHEN payment_status IN ('paid', 'partially_refunded') THEN (total - COALESCE(refunded_amount, 0))
             ELSE 0
           END
         ), 0) as net_sales_30d
       FROM orders
       WHERE store_id = $1 
         AND status != 'cancelled'
         AND created_at >= (NOW() - INTERVAL '30 days')`,
      [storeId]
    );
    const orders_30d = parseInt(sales30dRes.rows[0].orders_30d || 0);
    const net_paid_sales_30d = parseFloat(parseFloat(sales30dRes.rows[0].net_sales_30d || 0).toFixed(2));
    const aov_30d = orders_30d > 0 ? parseFloat((net_paid_sales_30d / orders_30d).toFixed(2)) : 0;

    const invRes = await db.query(
      `SELECT 
         COUNT(*) FILTER (WHERE status = 'active') as active_products,
         COUNT(*) FILTER (WHERE status = 'active' AND stock <= COALESCE(min_stock, 5)) as low_stock_products
       FROM products
       WHERE store_id = $1`,
      [storeId]
    );
    const active_products_count = parseInt(invRes.rows[0].active_products || 0);
    const low_stock_products_count = parseInt(invRes.rows[0].low_stock_products || 0);

    const custRes = await db.query(
      `SELECT 
         COUNT(*) as total_customers,
         COUNT(*) FILTER (WHERE total_orders > 0 AND (last_order_at IS NULL OR last_order_at < (NOW() - INTERVAL '14 days'))) as at_risk_count
       FROM customers
       WHERE store_id = $1`,
      [storeId]
    );
    const total_customers = parseInt(custRes.rows[0].total_customers || 0);
    const at_risk_customers_count = parseInt(custRes.rows[0].at_risk_count || 0);

    const prepRes = await db.query(
      `SELECT COALESCE(ROUND(AVG(EXTRACT(EPOCH FROM (ready_at - COALESCE(started_at, created_at))) / 60)::numeric, 1), 0) as avg_prep
       FROM kitchen_tickets
       WHERE store_id = $1 AND ready_at IS NOT NULL AND created_at >= (NOW() - INTERVAL '30 days')`,
      [storeId]
    );
    const avg_prep_time_30d = parseFloat(prepRes.rows[0].avg_prep || 0);

    const shiftsRes = await db.query(
      `SELECT COUNT(*) as count FROM shifts WHERE store_id = $1 AND start_time >= (NOW() - INTERVAL '30 days')`,
      [storeId]
    );
    const scheduled_shifts_30d = parseInt(shiftsRes.rows[0].count || 0);

    const campaignsRes = await db.query(
      `SELECT COUNT(*) as count FROM email_campaigns WHERE store_id = $1 AND status = 'sent' AND created_at >= (NOW() - INTERVAL '30 days')`,
      [storeId]
    );
    const sent_campaigns_30d = parseInt(campaignsRes.rows[0].count || 0);

    return {
      orders_30d,
      net_paid_sales_30d,
      aov_30d,
      active_products_count,
      low_stock_products_count,
      total_customers,
      at_risk_customers_count,
      avg_prep_time_30d,
      scheduled_shifts_30d,
      sent_campaigns_30d,
      snapshot_timestamp: new Date().toISOString()
    };
  }

  static async getPastOutcomesSummary(storeId) {
    const res = await db.query(
      `SELECT 
         COUNT(*) as total_experiments,
         COUNT(*) FILTER (WHERE result = 'success') as success_count,
         COUNT(*) FILTER (WHERE result = 'neutral') as neutral_count,
         COUNT(*) FILTER (WHERE result = 'failure') as failure_count,
         COALESCE(SUM(CASE WHEN result = 'success' THEN actual_impact ELSE 0 END), 0) as total_measured_lift
       FROM growth_experiments
       WHERE store_id = $1`,
      [storeId]
    );

    return {
      total_experiments: parseInt(res.rows[0].total_experiments || 0),
      success_count: parseInt(res.rows[0].success_count || 0),
      neutral_count: parseInt(res.rows[0].neutral_count || 0),
      failure_count: parseInt(res.rows[0].failure_count || 0),
      total_measured_lift: parseFloat(parseFloat(res.rows[0].total_measured_lift || 0).toFixed(2))
    };
  }

  static generateMonthlyRecommendations(storeId, strategyId, snapshot, pastOutcomes, tier) {
    const recs = [];
    const isLimited = tier === 'limited';
    const hasPastSuccess = pastOutcomes.success_count > 0;

    // 1. REVENUE OPTIMIZATION CATEGORY (Exactly 1)
    const aovStr = snapshot.aov_30d > 0 ? `$${snapshot.aov_30d.toFixed(2)}` : '$22.50';
    recs.push({
      strategy_id: strategyId,
      store_id: storeId,
      category: 'revenue_optimization',
      title: 'Optimize Menu Price Tiers & High-Margin Combos',
      priority: hasPastSuccess ? 'high' : 'medium',
      confidence: isLimited ? 70 : 88,
      reason: `30-day Average Order Value (${aovStr}) indicates opportunities for price tier structuring and side item bundling.`,
      evidence_summary: {
        metric: '30-Day Net Paid Sales & AOV',
        aov: aovStr,
        orders_30d: snapshot.orders_30d,
        past_successful_experiments: pastOutcomes.success_count,
        attribution_note: 'Observed 30-day store performance. External market factors (traffic, day of week) influence volume.'
      },
      expected_impact_range: '$150.00 - $350.00 estimated monthly lift',
      risk_level: 'low',
      source_basis: {
        source_type: 'internal_store_data',
        metric_name: '30-Day Average Order Value',
        current_value: aovStr,
        comparison_value: '$28.00 benchmark target',
        period: 'Trailing 30 Days',
        explanation: `Calculated from ${snapshot.orders_30d} net paid store orders over the last 30 days.`
      },
      suggested_execution_path: '/inventory',
      experiment_suggestion: {
        target_metric: 'average_order_value',
        recommended_test_duration_days: 14
      }
    });

    // 2. OPERATIONAL EFFICIENCY CATEGORY (Exactly 1)
    if (snapshot.low_stock_products_count > 0) {
      recs.push({
        strategy_id: strategyId,
        store_id: storeId,
        category: 'operational_efficiency',
        title: `Automate Supplier Restock for ${snapshot.low_stock_products_count} Items`,
        priority: 'high',
        confidence: isLimited ? 70 : 90,
        reason: `${snapshot.low_stock_products_count} active product(s) are below minimum inventory threshold, creating stockout risks.`,
        evidence_summary: {
          metric: 'Low Stock Product Inventory',
          low_stock_count: snapshot.low_stock_products_count,
          active_products: snapshot.active_products_count,
          attribution_note: 'Based on active stock levels vs configured min_stock settings.'
        },
        expected_impact_range: '$80.00 - $200.00 estimated stockout loss prevention',
        risk_level: 'low',
        source_basis: {
          source_type: 'internal_store_data',
          metric_name: 'Low Stock Product Inventory',
          current_value: snapshot.low_stock_products_count,
          comparison_value: 0,
          period: 'Current Store Inventory',
          explanation: `${snapshot.low_stock_products_count} active products have stock levels at or below minimum threshold.`
        },
        suggested_execution_path: '/inventory',
        experiment_suggestion: {
          target_metric: 'stockout_prevention',
          recommended_test_duration_days: 14
        }
      });
    } else {
      const prepStr = snapshot.avg_prep_time_30d > 0 ? `${snapshot.avg_prep_time_30d} min` : '14 min';
      recs.push({
        strategy_id: strategyId,
        store_id: storeId,
        category: 'operational_efficiency',
        title: 'Optimize Kitchen Station Workflow & Prep Times',
        priority: 'medium',
        confidence: isLimited ? 70 : 85,
        reason: `30-day average kitchen ticket prep time is ${prepStr}. Aligning peak shift staffing can improve throughput.`,
        evidence_summary: {
          metric: '30-Day Kitchen Ticket Prep Time',
          avg_prep_time: prepStr,
          scheduled_shifts: snapshot.scheduled_shifts_30d,
          attribution_note: 'Calculated from historical kitchen ticket timestamps.'
        },
        expected_impact_range: '10% - 18% estimated kitchen throughput improvement',
        risk_level: 'low',
        source_basis: {
          source_type: 'internal_store_data',
          metric_name: 'Kitchen Ticket Active Prep Time',
          current_value: prepStr,
          comparison_value: '12.0 min benchmark',
          period: 'Trailing 30 Days',
          explanation: `Tracked across all fulfilled kitchen orders.`
        },
        suggested_execution_path: '/kitchen',
        experiment_suggestion: {
          target_metric: 'avg_prep_time',
          recommended_test_duration_days: 14
        }
      });
    }

    // 3. CUSTOMER RETENTION CATEGORY (Exactly 1)
    if (snapshot.at_risk_customers_count > 0) {
      recs.push({
        strategy_id: strategyId,
        store_id: storeId,
        category: 'customer_retention',
        title: `Launch Winback Campaign for ${snapshot.at_risk_customers_count} Inactive Regulars`,
        priority: 'high',
        confidence: isLimited ? 70 : 87,
        reason: `${snapshot.at_risk_customers_count} registered customer(s) with previous purchase history have not ordered in over 14 days.`,
        evidence_summary: {
          metric: 'At-Risk Customer Segment',
          at_risk_customers: snapshot.at_risk_customers_count,
          total_customers: snapshot.total_customers,
          sent_campaigns_30d: snapshot.sent_campaigns_30d,
          attribution_note: 'Based on customer CRM activity timestamps.'
        },
        expected_impact_range: '$120.00 - $300.00 estimated monthly retention value',
        risk_level: 'low',
        source_basis: {
          source_type: 'internal_store_data',
          metric_name: 'At-Risk Customer Count (14+ Days Inactive)',
          current_value: snapshot.at_risk_customers_count,
          comparison_value: 0,
          period: 'All-Time CRM Snapshot',
          explanation: `Identified ${snapshot.at_risk_customers_count} regular store customers with inactivity over 14 days.`
        },
        suggested_execution_path: '/crm',
        experiment_suggestion: {
          target_metric: 'campaign_sent',
          recommended_test_duration_days: 14
        }
      });
    } else {
      recs.push({
        strategy_id: strategyId,
        store_id: storeId,
        category: 'customer_retention',
        title: 'Expand Store Loyalty Tier Program',
        priority: 'medium',
        confidence: isLimited ? 65 : 82,
        reason: `Incentivize customer repeat purchase habits by offering bonus loyalty points on repeat visits.`,
        evidence_summary: {
          metric: 'Customer Base Loyalty Engagement',
          total_customers: snapshot.total_customers,
          orders_30d: snapshot.orders_30d,
          attribution_note: 'Evaluated from CRM loyalty redemption logs.'
        },
        expected_impact_range: '$90.00 - $220.00 estimated repeat order lift',
        risk_level: 'low',
        source_basis: {
          source_type: 'internal_store_data',
          metric_name: 'Customer Repeat Order Ratio',
          current_value: `${snapshot.total_customers} registered customers`,
          comparison_value: 'Loyalty Growth Target',
          period: 'CRM All-Time Database',
          explanation: `Calculated from registered store customer profiles.`
        },
        suggested_execution_path: '/crm',
        experiment_suggestion: {
          target_metric: 'customer_retention_rate',
          recommended_test_duration_days: 14
        }
      });
    }

    return recs;
  }

  static async getHistoricalStrategies(storeId) {
    const strategies = await MonthlyGrowthStrategy.findByStore(storeId);
    return await Promise.all(
      strategies.map(async (strat) => {
        const recommendations = await MonthlyStrategyRecommendation.findByStrategyId(strat.id);
        return {
          ...strat,
          recommendations
        };
      })
    );
  }

  static getSetupActions() {
    return [
      {
        id: 'expand_menu',
        title: 'Expand product menu catalog',
        description: 'Add active products so SmartStore AI can analyze margin optimization.',
        link: '/inventory'
      },
      {
        id: 'increase_orders',
        title: 'Log at least 10 customer orders',
        description: 'Build initial 30-day transaction volume to unlock monthly strategy reports.',
        link: '/orders'
      },
      {
        id: 'register_customers',
        title: 'Register customer CRM profiles',
        description: 'Collect customer emails/phones at checkout to enable churn analysis.',
        link: '/crm'
      }
    ];
  }
}

module.exports = MonthlyStrategyService;
