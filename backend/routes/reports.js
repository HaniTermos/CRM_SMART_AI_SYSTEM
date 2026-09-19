const express = require('express');
const router = express.Router({ mergeParams: true });
const { authenticate, requireStoreAccess } = require('../middlewares/auth');
const reportsController = require('../controllers/reportsController');

function getStoreIdForRequest(req, res, next) {
  if (req.params.storeId && req.params.storeId !== 'me') {
    req.storeId = req.params.storeId;
    return requireStoreAccess(req, res, next);
  }
  req.storeId = req.user.store_id || req.user.active_store_id;
  if (!req.storeId) return res.status(400).json({ error: 'Store context missing' });
  next();
}

router.use(authenticate, getStoreIdForRequest);

router.get('/overview', reportsController.getOverview);
router.get('/dashboard', reportsController.getDashboardMetrics);
router.get('/orders-with-items', reportsController.getOrdersWithItems);
router.get('/revenue-by-category', reportsController.getRevenueByCategory);
router.get('/sales-by-channel', reportsController.getSalesByChannel);
router.get('/hourly-density', reportsController.getHourlyDensity);
router.get('/sales', reportsController.getSales);
router.get('/menu-performance', reportsController.getMenuPerformance);
router.get('/guests-retention', reportsController.getGuests);
router.get('/guests', reportsController.getGuests);
router.get('/operations', reportsController.getOperations);
router.get('/inventory-profit', reportsController.getInventory);
router.get('/inventory', reportsController.getInventory);
router.get('/staff', reportsController.getStaff);
router.get('/marketing', reportsController.getMarketing);
router.get('/forecast-accuracy', reportsController.getForecastAccuracy);

module.exports = router;
