const express = require('express');
const router = express.Router({ mergeParams: true });
const reviewController = require('../controllers/reviewController');
const { authenticate, requireStoreAccess, requireStoreAdmin } = require('../middlewares/auth');

router.post('/submit', reviewController.createPublic);
router.post('/', reviewController.create);
router.use(authenticate);
router.get('/', requireStoreAccess, reviewController.getAll);
router.patch('/:id/status', requireStoreAdmin, reviewController.updateStatus);
router.delete('/:id', requireStoreAdmin, reviewController.delete);

module.exports = router;
