const express = require('express');
const router = express.Router({ mergeParams: true });
const discountController = require('../controllers/discountController');
const { authenticate, requireStoreAccess, requireStoreAdmin } = require('../middlewares/auth');

router.post('/validate', discountController.validateCode);
router.use(authenticate);
router.get('/', requireStoreAccess, discountController.getAll);
router.post('/', requireStoreAdmin, discountController.create);
router.delete('/:id', requireStoreAdmin, discountController.delete);

module.exports = router;
