const express = require('express');
const router = express.Router({ mergeParams: true });
const discountController = require('../controllers/discountController');
const { authenticate, requireStoreAccess, requireStoreAdmin } = require('../middlewares/auth');

// Public route for storefront checkout validation
router.post('/validate', discountController.validateCode);

// Admin routes
router.use(authenticate);
router.get('/', requireStoreAccess, discountController.getAll);
router.post('/', requireStoreAdmin, discountController.create);
router.delete('/:id', requireStoreAdmin, discountController.delete);

module.exports = router;
