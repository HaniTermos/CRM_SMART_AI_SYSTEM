const express = require('express');
const router = express.Router({ mergeParams: true });
const inventoryController = require('../controllers/inventoryController');
const { authenticate, requireStoreAccess, requireStoreAdmin } = require('../middlewares/auth');

router.use(authenticate);
router.get('/', requireStoreAccess, inventoryController.getHistory);
router.post('/adjust', requireStoreAdmin, inventoryController.adjust);

module.exports = router;
