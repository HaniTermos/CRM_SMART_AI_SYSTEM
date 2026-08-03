const express = require('express');
const router = express.Router({ mergeParams: true });
const aiController = require('../controllers/aiController');
const { authenticate, requireStoreAccess } = require('../middlewares/auth');

router.use(authenticate);

router.get('/customer/:customerId', requireStoreAccess, aiController.getInsights);
router.post('/customer/:customerId/generate', requireStoreAccess, aiController.generateInsight);
router.get('/reengagement', requireStoreAccess, aiController.getReengagement);
router.get('/recent-insights', requireStoreAccess, aiController.getRecentInsights);
router.get('/demand-history', requireStoreAccess, aiController.getDemandHistory);
router.post('/demand', requireStoreAccess, aiController.scoreDemand);
router.post('/chat', requireStoreAccess, aiController.chat);
router.get('/status', requireStoreAccess, aiController.getStatus);
router.post('/generate-campaign', requireStoreAccess, aiController.generateCampaign);

module.exports = router;
