const express = require('express');
const router = express.Router({ mergeParams: true });
const customerController = require('../controllers/customerController');
const { authenticate, requireStoreAccess, requireStoreAdmin } = require('../middlewares/auth');

router.use(authenticate);
router.get('/', requireStoreAccess, customerController.getAll);
router.get('/:id', requireStoreAccess, customerController.getById);
router.get('/:id/history', requireStoreAccess, customerController.getActivities);
router.put('/:id', requireStoreAdmin, customerController.update);
router.post('/:id/activity', requireStoreAdmin, customerController.addActivity);

module.exports = router;
