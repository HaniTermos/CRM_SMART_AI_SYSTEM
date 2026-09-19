const AiActionPlan = require('../models/AiActionPlan');
const AiAction = require('../models/AiAction');
const SagaEngine = require('./SagaEngine');

class AiExecutionEngine {
  static async proceedPlan(store_id, plan_id, user_id) {
    const plan = await AiActionPlan.findById(plan_id, store_id);
    if (!plan) throw new Error('Action plan not found');
    if (['executing', 'completed'].includes(plan.status)) {
      throw new Error(`Plan is already ${plan.status}`);
    }

    await AiActionPlan.updateStatus(plan_id, store_id, 'approved', { approved_by: user_id });
    await AiActionPlan.updateStatus(plan_id, store_id, 'executing');

    const actions = await AiAction.findByPlan(plan_id, store_id);
    let allSuccess = true;
    let anySuccess = false;

    for (const act of actions) {
      if (act.status === 'completed') {
        anySuccess = true;
        continue;
      }

      const res = await SagaEngine.executeAction(store_id, act);
      if (res.success) {
        anySuccess = true;
      } else {
        allSuccess = false;
        break; // Stop execution sequence on first failure
      }
    }

    const finalStatus = allSuccess ? 'completed' : (anySuccess ? 'partially_completed' : 'failed');
    return await AiActionPlan.updateStatus(plan_id, store_id, finalStatus);
  }

  static async rollbackPlan(store_id, plan_id) {
    const plan = await AiActionPlan.findById(plan_id, store_id);
    if (!plan) throw new Error('Action plan not found');

    const actions = await AiAction.findByPlan(plan_id, store_id);
    const rollbackResults = await SagaEngine.rollbackPlan(store_id, plan_id, actions);

    const updatedPlan = await AiActionPlan.updateStatus(plan_id, store_id, 'rolled_back');
    return { plan: updatedPlan, rollback_results: rollbackResults };
  }
}

module.exports = AiExecutionEngine;
