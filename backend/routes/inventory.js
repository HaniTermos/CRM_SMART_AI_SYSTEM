const express = require('express');
const router = express.Router({ mergeParams: true });
const inventoryController = require('../controllers/inventoryController');
const { authenticate, requireStoreAccess, requireStoreAdmin } = require('../middlewares/auth');

router.use(authenticate);

// Staff/Admins can view history
router.get('/', requireStoreAccess, inventoryController.getHistory);

// Only admins/owners can adjust inventory directly
router.post('/adjust', requireStoreAdmin, inventoryController.adjust);

module.exports = router;
