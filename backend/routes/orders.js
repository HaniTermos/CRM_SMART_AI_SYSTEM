const express = require('express');
const router = express.Router({ mergeParams: true });
const orderController = require('../controllers/orderController');
const { authenticate, requireStoreAccess, requireStoreAdmin } = require('../middlewares/auth');

router.post('/checkout', orderController.checkout);
router.post('/lookup', orderController.lookupOrder);
router.use(authenticate);
router.get('/', requireStoreAccess, orderController.getAll);
router.get('/:id', requireStoreAccess, orderController.getById);
router.patch('/:id/status', requireStoreAdmin, orderController.updateStatus);

module.exports = router;
