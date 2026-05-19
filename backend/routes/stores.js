const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const { authenticate, requireStoreAccess, requireStoreAdmin } = require('../middlewares/auth');

// Public route
router.get('/slug/:slug', storeController.getBySlug);

// Protected routes (requires auth)
router.use(authenticate);

router.post('/', storeController.create);
router.get('/me', storeController.myStores);

// Store-scoped protected routes
router.get('/:storeId', requireStoreAccess, storeController.getById);
router.get('/:storeId/alerts', requireStoreAccess, storeController.getAlerts);
router.put('/:storeId', requireStoreAdmin, storeController.update);
router.delete('/:storeId', requireStoreAdmin, storeController.delete);

module.exports = router;
