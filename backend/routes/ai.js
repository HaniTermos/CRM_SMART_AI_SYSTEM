const express = require('express');
const router = express.Router({ mergeParams: true });
const aiController = require('../controllers/aiController');
const { authenticate, requireStoreAccess } = require('../middlewares/auth');

router.use(authenticate);

// Staff can generate and view AI insights
router.get('/customer/:customerId', requireStoreAccess, aiController.getInsights);
router.post('/customer/:customerId/generate', requireStoreAccess, aiController.generateInsight);

// Store-level AI routes
router.get('/reengagement', requireStoreAccess, aiController.getReengagement);
router.get('/recent-insights', requireStoreAccess, aiController.getRecentInsights);
router.get('/demand-history', requireStoreAccess, aiController.getDemandHistory);
router.post('/demand', requireStoreAccess, aiController.scoreDemand);

module.exports = router;
