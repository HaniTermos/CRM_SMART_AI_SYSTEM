const express = require('express');
const router = express.Router({ mergeParams: true });
const reportController = require('../controllers/reportController');
const { authenticate, requireStoreAccess } = require('../middlewares/auth');

router.use(authenticate);

router.get('/dashboard', requireStoreAccess, reportController.getDashboardMetrics);
router.get('/orders-with-items', requireStoreAccess, reportController.getOrdersWithItems);
router.get('/segments', requireStoreAccess, reportController.getSegments);

module.exports = router;
