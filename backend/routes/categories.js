const express = require('express');
const router = express.Router({ mergeParams: true });
const categoryController = require('../controllers/categoryController');
const { authenticate, requireStoreAdmin } = require('../middlewares/auth');

// Public route
router.get('/', categoryController.getAll);

// Admin routes
router.use(authenticate);
router.post('/', requireStoreAdmin, categoryController.create);
router.delete('/:id', requireStoreAdmin, categoryController.delete);

module.exports = router;
