const express = require('express');
const router = express.Router({ mergeParams: true });
const { authenticate, requireStoreAccess } = require('../middlewares/auth');
const dashboardController = require('../controllers/dashboardController');

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

router.get('/', dashboardController.getMetrics);
router.get('/metrics', dashboardController.getMetrics);
router.post('/layout', dashboardController.saveLayout);

module.exports = router;
