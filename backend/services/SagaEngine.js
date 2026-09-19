const AiAction = require('../models/AiAction');
const AiExecutionLog = require('../models/AiExecutionLog');
const AiToolRegistry = require('./AiToolRegistry');

class SagaEngine {
  static async executeAction(store_id, action) {
    const tool = AiToolRegistry.getTool(action.type);
    if (!tool) {
      throw new Error(`Unsupported action type: '${action.type}'`);
    }

    await AiAction.updateStatus(action.id, store_id, 'executing');

    try {
      const result = await tool.execute(store_id, action.payload);
      
      await AiExecutionLog.log({
        action_id: action.id,
        plan_id: action.plan_id,
        store_id,
        status: 'completed',
        request_payload: action.payload,
        result_payload: result
      });

      const updated = await AiAction.updateStatus(action.id, store_id, 'completed', {
        result,
        compensation_payload: result.compensation || {}
      });

      return { success: true, action: updated };
    } catch (err) {
      await AiExecutionLog.log({
        action_id: action.id,
        plan_id: action.plan_id,
        store_id,
        status: 'failed',
        request_payload: action.payload,
        error_message: err.message
      });

      const updated = await AiAction.updateStatus(action.id, store_id, 'failed', {
        error_message: err.message
      });

      return { success: false, action: updated, error: err.message };
    }
  }

  static async rollbackPlan(store_id, plan_id, actions = []) {
    const results = [];
    // Rollback in reverse execution order
    const completedActions = [...actions].filter(a => a.status === 'completed').reverse();

    for (const act of completedActions) {
      if (act.classification === 'external' || act.classification === 'irreversible') {
        console.warn(`[SagaEngine] Action '${act.id}' classified as '${act.classification}'. Requires human review — skipping automatic compensation.`);
        results.push({ action_id: act.id, status: 'requires_human_review', classification: act.classification });
        continue;
      }

      if (act.compensation_payload && act.compensation_payload.type) {
        const compTool = AiToolRegistry.getTool(act.compensation_payload.type);
        if (compTool) {
          try {
            const compRes = await compTool.execute(store_id, act.compensation_payload.payload || {});
            await AiAction.updateStatus(act.id, store_id, 'rolled_back', { result: compRes });
            results.push({ action_id: act.id, status: 'rolled_back', result: compRes });
          } catch (err) {
            results.push({ action_id: act.id, status: 'rollback_failed', error: err.message });
          }
        }
      }
    }

    return results;
  }
}

module.exports = SagaEngine;
