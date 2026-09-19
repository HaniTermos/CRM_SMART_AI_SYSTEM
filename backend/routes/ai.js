const express = require('express');
const router = express.Router({ mergeParams: true });
const { authenticate, requireStoreAccess } = require('../middlewares/auth');
const aiController = require('../controllers/aiController');

function getStoreIdForRequest(req, res, next) {
  if (req.params.storeId && req.params.storeId !== 'me') {
    req.storeId = req.params.storeId;
    return requireStoreAccess(req, res, next);
  }
  req.storeId = req.user.store_id || req.user.active_store_id;
  if (!req.storeId) return res.status(400).json({ error: 'Store context missing' });
  next();
}

const handleStoreScope = (req, res, next) => {
  if (req.baseUrl && req.baseUrl.startsWith('/api/ai')) {
    res.setHeader('X-API-Deprecated', 'true');
    res.setHeader('X-API-Deprecated-Replacement', '/api/stores/me/ai');
    res.setHeader('Deprecation', 'true');
    res.setHeader('Link', '</api/stores/me/ai>; rel="successor-version"');
  }

  const targetStoreId = req.params.storeId || req.user?.store_id;
  if (targetStoreId && targetStoreId !== 'me') {
    req.storeId = targetStoreId;
  }
  next();
};

router.use(authenticate, getStoreIdForRequest, handleStoreScope);

// Conversations
router.get('/conversations', aiController.getConversations);
router.post('/conversations', aiController.createConversation);
router.get('/conversations/:conversationId', aiController.getConversationById);
router.patch('/conversations/:conversationId', aiController.updateConversation);
router.delete('/conversations/:conversationId', aiController.deleteConversation);
router.post('/conversations/:conversationId/messages', aiController.sendMessage);
router.post('/messages', aiController.sendMessage);

// Action Plans
router.get('/action-plans', aiController.getActionPlans);
router.post('/action-plans', aiController.createActionPlan);
router.get('/action-plans/:planId', aiController.getActionPlan);
router.patch('/action-plans/:planId', aiController.updateActionPlan);
router.post('/action-plans/:planId/approve', aiController.approveActionPlan);
router.post('/action-plans/:planId/cancel', aiController.cancelActionPlan);
router.post('/action-plans/:planId/proceed', aiController.proceedActionPlan);
router.post('/action-plans/:planId/rollback', aiController.rollbackActionPlan);

// Briefing, Credits & Usage
router.get('/briefing', aiController.getBriefing);
router.get('/credits', aiController.getCreditsBalance);
router.get('/usage', aiController.getUsage);
router.get('/usage/summary', aiController.getUsageSummary);
router.get('/usage/by-feature', aiController.getUsageByFeature);

// Insights & Demand Scoring
router.get('/recent-insights', aiController.getRecentInsights);
router.get('/demand-history', aiController.getDemandHistory);
router.get('/reengagement', aiController.getReengagement);

// Customer Insights
router.post('/customer/:customerId/generate', aiController.generateCustomerInsight);
router.get('/customer/:customerId', aiController.getCustomerInsights);

module.exports = router;
