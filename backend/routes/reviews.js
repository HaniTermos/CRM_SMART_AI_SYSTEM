const express = require('express');
const router = express.Router({ mergeParams: true });
const db = require('../config/database');
const reviewController = require('../controllers/reviewController');
const { authenticate, requireStoreAccess, requireStoreAdmin } = require('../middlewares/auth');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function resolveStoreId(req, res, next) {
  try {
    const slugOrId = req.params.storeSlug;
    if (!slugOrId) {
      return res.status(400).json({ error: 'Store slug or ID required.' });
    }

    if (UUID_REGEX.test(slugOrId)) {
      req.storeId = slugOrId;
      req.params.storeId = slugOrId;
      return next();
    }

    const result = await db.query('SELECT id FROM stores WHERE slug = $1', [slugOrId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Store not found' });
    }

    req.storeId = result.rows[0].id;
    req.params.storeId = result.rows[0].id;
    next();
  } catch (error) {
    next(error);
  }
}

router.post('/submit', reviewController.createPublic);
router.use(authenticate);
router.use(resolveStoreId);
router.get('/', requireStoreAccess, reviewController.getAll);
router.patch('/:id/status', requireStoreAdmin, reviewController.updateStatus);
router.delete('/:id', requireStoreAdmin, reviewController.delete);

module.exports = router;
