const db = require('../config/database');
const GrowthExperiment = require('../models/GrowthExperiment');

class ImpactTrackerService {
  static async createExperimentForAction({ storeId, recommendationId, actionLogId, actionType, targetEntityId, expectedImpact }, client = db) {
    const existing = await GrowthExperiment.findByRecommendationId(recommendationId);
    if (existing) {
      return existing;
    }

    const now = new Date();
    const baselineStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const baselineEnd = now.toISOString();
    const experimentEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

    let targetMetric = 'general_revenue';
    let targetEntityType = null;
    let baselineValue = 0;
    let initialStatus = 'running';

    switch (actionType) {
      case 'feature_product': {
        targetMetric = 'product_revenue';
        targetEntityType = 'product';
        if (targetEntityId) {
          const prodRevRes = await db.query(
            `SELECT COALESCE(SUM(
               CASE 
                 WHEN o.payment_status = 'refunded' THEN 0
                 WHEN o.payment_status IN ('paid', 'partially_refunded') THEN oi.subtotal
                 ELSE 0
               END
             ), 0) as total
             FROM order_items oi
             JOIN orders o ON oi.order_id = o.id
             WHERE o.store_id = $1 
               AND oi.product_id = $2 
               AND o.status != 'cancelled'
               AND o.created_at >= $3 AND o.created_at <= $4`,
            [storeId, targetEntityId, baselineStart, baselineEnd]
          );
          baselineValue = parseFloat(prodRevRes.rows[0].total || 0);
        }
        break;
      }

      case 'add_upsell_badge': {
        targetMetric = 'average_order_value';
        targetEntityType = 'product';
        const aovRes = await db.query(
          `SELECT 
             COUNT(*) as orders_count,
             COALESCE(SUM(
               CASE 
                 WHEN payment_status = 'refunded' THEN 0
                 WHEN payment_status IN ('paid', 'partially_refunded') THEN (total - COALESCE(refunded_amount, 0))
                 ELSE 0
               END
             ), 0) as total_rev
           FROM orders
           WHERE store_id = $1 
             AND status != 'cancelled'
             AND created_at >= $2 AND created_at <= $3`,
          [storeId, baselineStart, baselineEnd]
        );
        const count = parseInt(aovRes.rows[0].orders_count || 0);
        const rev = parseFloat(aovRes.rows[0].total_rev || 0);
        baselineValue = count > 0 ? parseFloat((rev / count).toFixed(2)) : 0;
        break;
      }

      case 'create_campaign_draft': {
        targetMetric = 'campaign_sent';
        targetEntityType = 'email_campaign';
        baselineValue = 0;
        initialStatus = 'awaiting_campaign_send';
        break;
      }

      case 'create_purchase_order_draft': {
        targetMetric = 'stockout_prevention';
        targetEntityType = 'purchase_order';
        const lowStockRes = await db.query(
          `SELECT COUNT(*) as count FROM products WHERE store_id = $1 AND stock <= COALESCE(min_stock, 5) AND status = 'active'`,
          [storeId]
        );
        baselineValue = parseInt(lowStockRes.rows[0].count || 0);
        break;
      }

      case 'create_task': {
        targetMetric = 'task_completion';
        targetEntityType = 'task';
        baselineValue = 0;
        break;
      }

      case 'create_shift_draft': {
        targetMetric = 'avg_prep_time';
        targetEntityType = 'shift';
        const prepRes = await db.query(
          `SELECT COALESCE(ROUND(AVG(EXTRACT(EPOCH FROM (ready_at - COALESCE(started_at, created_at))) / 60)::numeric, 1), 0) as avg_prep
           FROM kitchen_tickets
           WHERE store_id = $1 AND ready_at IS NOT NULL AND created_at >= $2 AND created_at <= $3`,
          [storeId, baselineStart, baselineEnd]
        );
        baselineValue = parseFloat(prepRes.rows[0].avg_prep || 0);
        break;
      }

      default:
        targetMetric = 'general_metric';
    }

    return await GrowthExperiment.create({
      store_id: storeId,
      recommendation_id: recommendationId,
      action_log_id: actionLogId,
      action_type: actionType,
      target_metric: targetMetric,
      target_entity_type: targetEntityType,
      target_entity_id: targetEntityId,
      baseline_value: baselineValue,
      baseline_period_start: baselineStart,
      baseline_period_end: baselineEnd,
      experiment_start: baselineEnd,
      experiment_end: experimentEnd,
      expected_impact: expectedImpact || 'Measured operational outcome',
      status: initialStatus
    }, client);
  }

  static async evaluateOutcome(experiment) {
    const now = new Date();
    const expStart = experiment.experiment_start;
    const expEnd = new Date(experiment.experiment_end);

    // Rule: Campaign draft remains awaiting_campaign_send until sent
    if (experiment.action_type === 'create_campaign_draft') {
      if (experiment.target_entity_id) {
        const campRes = await db.query(
          `SELECT status FROM email_campaigns WHERE id = $1 AND store_id = $2`,
          [experiment.target_entity_id, experiment.store_id]
        );
        if (campRes.rows.length > 0 && campRes.rows[0].status !== 'sent') {
          return {
            actual_value: null,
            actual_impact: null,
            status: 'awaiting_campaign_send',
            result: null,
            completed_at: null
          };
        }
      } else {
        return {
          actual_value: null,
          actual_impact: null,
          status: 'awaiting_campaign_send',
          result: null,
          completed_at: null
        };
      }
    }

    // Rule: Tasks evaluate completion
    if (experiment.action_type === 'create_task') {
      if (experiment.target_entity_id) {
        const taskRes = await db.query(
          `SELECT status FROM tasks WHERE id = $1 AND store_id = $2`,
          [experiment.target_entity_id, experiment.store_id]
        );
        if (taskRes.rows.length > 0 && taskRes.rows[0].status === 'completed') {
          return {
            actual_value: 1,
            actual_impact: 1,
            status: 'completed',
            result: 'success',
            completed_at: now.toISOString()
          };
        }
      }
      if (now < expEnd) {
        return {
          actual_value: 0,
          actual_impact: 0,
          status: 'running',
          result: null,
          completed_at: null
        };
      } else {
        return {
          actual_value: 0,
          actual_impact: 0,
          status: 'inconclusive',
          result: null,
          completed_at: null
        };
      }
    }

    // Calculate actual numeric value post-execution
    let actualValue = 0;

    switch (experiment.target_metric) {
      case 'product_revenue': {
        const res = await db.query(
          `SELECT COALESCE(SUM(
             CASE 
               WHEN o.payment_status = 'refunded' THEN 0
               WHEN o.payment_status IN ('paid', 'partially_refunded') THEN oi.subtotal
               ELSE 0
             END
           ), 0) as total
           FROM order_items oi
           JOIN orders o ON oi.order_id = o.id
           WHERE o.store_id = $1 
             AND oi.product_id = $2 
             AND o.status != 'cancelled'
             AND o.created_at >= $3`,
          [experiment.store_id, experiment.target_entity_id, expStart]
        );
        actualValue = parseFloat(res.rows[0].total || 0);
        break;
      }

      case 'average_order_value': {
        const res = await db.query(
          `SELECT 
             COUNT(*) as count,
             COALESCE(SUM(
               CASE 
                 WHEN payment_status = 'refunded' THEN 0
                 WHEN payment_status IN ('paid', 'partially_refunded') THEN (total - COALESCE(refunded_amount, 0))
                 ELSE 0
               END
             ), 0) as total_rev
           FROM orders
           WHERE store_id = $1 
             AND status != 'cancelled'
             AND created_at >= $2`,
          [experiment.store_id, expStart]
        );
        const count = parseInt(res.rows[0].count || 0);
        const rev = parseFloat(res.rows[0].total_rev || 0);
        actualValue = count > 0 ? parseFloat((rev / count).toFixed(2)) : 0;
        break;
      }

      case 'stockout_prevention': {
        const res = await db.query(
          `SELECT COUNT(*) as count FROM products WHERE store_id = $1 AND stock <= COALESCE(min_stock, 5) AND status = 'active'`,
          [experiment.store_id]
        );
        actualValue = parseInt(res.rows[0].count || 0);
        break;
      }

      case 'avg_prep_time': {
        const res = await db.query(
          `SELECT COALESCE(ROUND(AVG(EXTRACT(EPOCH FROM (ready_at - COALESCE(started_at, created_at))) / 60)::numeric, 1), 0) as avg_prep
           FROM kitchen_tickets
           WHERE store_id = $1 AND ready_at IS NOT NULL AND created_at >= $2`,
          [experiment.store_id, expStart]
        );
        actualValue = parseFloat(res.rows[0].avg_prep || 0);
        break;
      }

      default:
        actualValue = 0;
    }

    const baseline = parseFloat(experiment.baseline_value || 0);
    const actualImpact = parseFloat((actualValue - baseline).toFixed(2));

    let result = 'neutral';
    let status = now >= expEnd ? 'completed' : 'running';

    if (experiment.target_metric === 'avg_prep_time') {
      // Lower prep time is success
      if (actualValue > 0 && actualValue <= baseline * 0.95) {
        result = 'success';
      } else if (actualValue > baseline * 1.05) {
        result = 'failure';
      }
    } else if (experiment.target_metric === 'stockout_prevention') {
      // Lower low-stock count is success
      if (actualValue < baseline) {
        result = 'success';
      } else if (actualValue > baseline) {
        result = 'failure';
      }
    } else {
      // Higher revenue/AOV is success
      if (actualValue >= baseline * 1.05 && actualImpact > 0) {
        result = 'success';
      } else if (actualValue < baseline * 0.95) {
        result = 'failure';
      }
    }

    return {
      actual_value: actualValue,
      actual_impact: actualImpact,
      status,
      result,
      completed_at: status === 'completed' ? now.toISOString() : null
    };
  }

  static async recalculateExperiment(id, storeId) {
    const experiment = await GrowthExperiment.findById(id, storeId);
    if (!experiment) {
      const err = new Error('Experiment not found');
      err.status = 404;
      throw err;
    }

    const outcome = await this.evaluateOutcome(experiment);
    return await GrowthExperiment.update(id, storeId, outcome);
  }

  static async completeExperiment(id, storeId) {
    const experiment = await GrowthExperiment.findById(id, storeId);
    if (!experiment) {
      const err = new Error('Experiment not found');
      err.status = 404;
      throw err;
    }

    const outcome = await this.evaluateOutcome(experiment);
    outcome.status = 'completed';
    outcome.completed_at = new Date().toISOString();

    return await GrowthExperiment.update(id, storeId, outcome);
  }

  static async getImpactSummary(storeId) {
    const experiments = await GrowthExperiment.findByStore(storeId);

    // Auto-recalculate running experiments
    for (const exp of experiments) {
      if (exp.status === 'running') {
        await this.recalculateExperiment(exp.id, storeId);
      }
    }

    const updatedExperiments = await GrowthExperiment.findByStore(storeId);

    const REVENUE_METRICS = ['product_revenue', 'average_order_value'];
    const OPERATIONAL_METRICS = ['stockout_prevention', 'task_completion', 'avg_prep_time'];

    let totalMeasuredRevenueImpact = 0;
    let activeRunning = 0;
    let completedSuccess = 0;
    let completedNeutral = 0;
    let completedFailure = 0;
    let inconclusiveCount = 0;
    let awaitingSendCount = 0;

    // Operational impact trackers
    let stockoutsPrevented = 0;
    let tasksCompleted = 0;
    let prepTimeReduced = 0;

    const breakdown = updatedExperiments.map(e => {
      if (e.status === 'running') activeRunning++;
      else if (e.status === 'inconclusive') inconclusiveCount++;
      else if (e.status === 'awaiting_campaign_send') awaitingSendCount++;

      if (e.result === 'success') {
        completedSuccess++;
        // Only valid revenue metrics contribute to measured net revenue lift
        if (REVENUE_METRICS.includes(e.target_metric) && e.actual_impact) {
          totalMeasuredRevenueImpact += parseFloat(e.actual_impact);
        }
        // Track operational impact separately
        if (e.target_metric === 'stockout_prevention' && e.actual_impact) {
          stockoutsPrevented += Math.abs(parseFloat(e.actual_impact));
        }
        if (e.target_metric === 'task_completion') {
          tasksCompleted += 1;
        }
        if (e.target_metric === 'avg_prep_time' && e.actual_impact) {
          prepTimeReduced += Math.abs(parseFloat(e.actual_impact));
        }
      } else if (e.result === 'neutral') {
        completedNeutral++;
      } else if (e.result === 'failure') {
        completedFailure++;
      }

      // Classify impact type for each experiment
      const isRevenueMetric = REVENUE_METRICS.includes(e.target_metric);
      const impactLabel = isRevenueMetric
        ? 'Observed revenue change after action'
        : 'Measured operational outcome';

      return {
        id: e.id,
        action_type: e.action_type,
        target_metric: e.target_metric,
        expected_impact: e.expected_impact,
        baseline_value: e.baseline_value,
        actual_value: e.actual_value,
        actual_impact: e.actual_impact,
        impact_type: isRevenueMetric ? 'revenue' : 'operational',
        impact_label: impactLabel,
        status: e.status,
        result: e.result,
        recommendation_title: e.recommendation_title
      };
    });

    return {
      total_experiments: updatedExperiments.length,
      active_running: activeRunning,
      completed_success: completedSuccess,
      completed_neutral: completedNeutral,
      completed_failure: completedFailure,
      inconclusive: inconclusiveCount,
      awaiting_campaign_send: awaitingSendCount,
      // Revenue impact: only from valid revenue metrics (product_revenue, average_order_value)
      total_measured_revenue_impact: parseFloat(totalMeasuredRevenueImpact.toFixed(2)),
      // Operational impact: reported separately, never inflates revenue lift
      operational_impact: {
        stockouts_prevented: stockoutsPrevented,
        tasks_completed: tasksCompleted,
        prep_time_reduced_minutes: parseFloat(prepTimeReduced.toFixed(1))
      },
      attribution_note: 'Observed change measured over 7-day experiment window. Seasonality, day-of-week effects, and external factors may influence outcomes. These are measured deltas, not causal attributions.',
      breakdown
    };
  }
}

module.exports = ImpactTrackerService;
