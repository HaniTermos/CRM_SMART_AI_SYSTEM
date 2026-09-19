const db = require('../config/database');
const PulseRecommendation = require('../models/PulseRecommendation');

const WHITELISTED_ACTIONS = [
  'create_task',
  'create_campaign_draft',
  'create_purchase_order_draft',
  'create_shift_draft',
  'feature_product',
  'add_upsell_badge'
];

class GrowthActionDispatcher {
  static async executeAction({ storeId, recommendationId, actionType, payload = {}, confirmed, userId, userRole }) {
    // 1. Verify recommendation exists and belongs to the store (security first)
    const rec = await PulseRecommendation.findById(recommendationId, storeId);
    if (!rec) {
      const err = new Error('Recommendation not found');
      err.status = 404;
      throw err;
    }

    // 2. Require explicit confirmation
    if (confirmed !== true) {
      const err = new Error('Confirmation is required to execute a growth action');
      err.status = 400;
      throw err;
    }

    // 3. Validate action_type is strictly whitelisted
    if (!WHITELISTED_ACTIONS.includes(actionType)) {
      const err = new Error(`Action type '${actionType}' is invalid or not allowed in Phase 2 whitelist`);
      err.status = 400;
      throw err;
    }

    // 4. Idempotency Check: if already executed, return cached result
    if (rec.status === 'executed' || rec.executed_at) {
      return {
        idempotent: true,
        message: 'Action was previously executed',
        status: 'executed',
        executed_at: rec.executed_at,
        result: rec.execution_result
      };
    }

    // 5. Execute inside DB transaction for atomic execution and audit logging
    return await db.transaction(async (tx) => {
      let targetEntityType = null;
      let targetEntityId = null;
      let executionResult = null;

      switch (actionType) {
        case 'create_task': {
          const title = payload.title || rec.title || 'Growth Action Task';
          const description = payload.description || rec.reason;
          const assignedTo = payload.assigned_to || null;

          const res = await tx.query(
            `INSERT INTO tasks (store_id, title, description, assigned_to, source)
             VALUES ($1, $2, $3, $4, 'growth_engine')
             RETURNING *`,
            [storeId, title, description, assignedTo]
          );

          targetEntityType = 'task';
          targetEntityId = res.rows[0].id;
          executionResult = res.rows[0];
          break;
        }

        case 'create_campaign_draft': {
          const name = payload.name || `Draft: ${rec.title}`;
          const subject = payload.subject || 'Special Offer for Our Regulars';
          const contentHtml = payload.content_html || `<p>${rec.reason}</p>`;
          const targetSegment = payload.target_segment || 'at_risk';

          const res = await tx.query(
            `INSERT INTO email_campaigns (store_id, name, subject, content_html, target_segment, status)
             VALUES ($1, $2, $3, $4, $5, 'draft')
             RETURNING *`,
            [storeId, name, subject, contentHtml, targetSegment]
          );

          targetEntityType = 'email_campaign';
          targetEntityId = res.rows[0].id;
          executionResult = res.rows[0];
          break;
        }

        case 'create_purchase_order_draft': {
          const supplierName = payload.supplier_name || 'Primary Supplier';
          const items = payload.items || [{ name: 'Inventory Restock', quantity: 50 }];
          const totalAmount = payload.total_amount || 150.00;

          const res = await tx.query(
            `INSERT INTO purchase_orders (store_id, supplier_name, items, total_amount, status)
             VALUES ($1, $2, $3, $4, 'draft')
             RETURNING *`,
            [storeId, supplierName, JSON.stringify(items), totalAmount]
          );

          targetEntityType = 'purchase_order';
          targetEntityId = res.rows[0].id;
          executionResult = res.rows[0];
          break;
        }

        case 'create_shift_draft': {
          const shiftUserId = payload.user_id || userId;
          const role = payload.role || 'staff';
          const startTime = payload.start_time || new Date(Date.now() + 86400000).toISOString();
          const endTime = payload.end_time || new Date(Date.now() + 86400000 + 28800000).toISOString();

          // Validate target user belongs to store
          const userCheck = await tx.query(
            `SELECT * FROM user_roles WHERE user_id = $1 AND store_id = $2`,
            [shiftUserId, storeId]
          );
          if (userCheck.rows.length === 0 && shiftUserId !== userId) {
            const err = new Error('Target shift user does not belong to this store');
            err.status = 403;
            throw err;
          }

          const res = await tx.query(
            `INSERT INTO shifts (store_id, user_id, role, start_time, end_time, status)
             VALUES ($1, $2, $3, $4, $5, 'draft')
             RETURNING *`,
            [storeId, shiftUserId, role, startTime, endTime]
          );

          targetEntityType = 'shift';
          targetEntityId = res.rows[0].id;
          executionResult = res.rows[0];
          break;
        }

        case 'feature_product': {
          const productId = payload.product_id;
          if (!productId) {
            const err = new Error('product_id is required for feature_product action');
            err.status = 400;
            throw err;
          }

          // Validate product belongs to store (Wrong-store target entity check)
          const prodCheck = await tx.query(
            `SELECT * FROM products WHERE id = $1 AND store_id = $2`,
            [productId, storeId]
          );
          if (prodCheck.rows.length === 0) {
            const err = new Error('Target product not found or belongs to another store');
            err.status = 403;
            throw err;
          }

          const res = await tx.query(
            `UPDATE products 
             SET status = 'active',
                 tags = array_append(ARRAY(SELECT unnest(tags) EXCEPT SELECT 'featured'), 'featured')
             WHERE id = $1 AND store_id = $2
             RETURNING *`,
            [productId, storeId]
          );

          targetEntityType = 'product';
          targetEntityId = productId;
          executionResult = res.rows[0];
          break;
        }

        case 'add_upsell_badge': {
          const productId = payload.product_id;
          if (!productId) {
            const err = new Error('product_id is required for add_upsell_badge action');
            err.status = 400;
            throw err;
          }

          // Validate product belongs to store (Wrong-store target entity check)
          const prodCheck = await tx.query(
            `SELECT * FROM products WHERE id = $1 AND store_id = $2`,
            [productId, storeId]
          );
          if (prodCheck.rows.length === 0) {
            const err = new Error('Target product not found or belongs to another store');
            err.status = 403;
            throw err;
          }

          const res = await tx.query(
            `UPDATE products 
             SET tags = array_append(ARRAY(SELECT unnest(tags) EXCEPT SELECT 'upsell'), 'upsell')
             WHERE id = $1 AND store_id = $2
             RETURNING *`,
            [productId, storeId]
          );

          targetEntityType = 'product';
          targetEntityId = productId;
          executionResult = res.rows[0];
          break;
        }

        default:
          throw new Error('Unsupported action type');
      }

      // 6. Record Audit Log entry
      const auditRes = await tx.query(
        `INSERT INTO growth_action_logs (store_id, recommendation_id, action_type, executed_by, target_entity_type, target_entity_id, payload, result)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          storeId,
          recommendationId,
          actionType,
          userId,
          targetEntityType,
          targetEntityId,
          JSON.stringify(payload),
          JSON.stringify(executionResult)
        ]
      );

      // 7. Update recommendation status to executed
      await tx.query(
        `UPDATE pulse_recommendations
         SET status = 'executed', executed_at = NOW(), execution_result = $1
         WHERE id = $2 AND store_id = $3`,
        [JSON.stringify(executionResult), recommendationId, storeId]
      );

      // 8. Auto-create growth experiment for impact tracking
      const ImpactTrackerService = require('./ImpactTrackerService');
      const experiment = await ImpactTrackerService.createExperimentForAction({
        storeId,
        recommendationId,
        actionLogId: auditRes.rows[0]?.id || null,
        actionType,
        targetEntityId,
        expectedImpact: rec.expected_impact
      }, tx);

      return {
        success: true,
        action_type: actionType,
        target_entity_type: targetEntityType,
        target_entity_id: targetEntityId,
        result: executionResult,
        experiment_id: experiment?.id
      };
    });
  }
}

module.exports = GrowthActionDispatcher;
