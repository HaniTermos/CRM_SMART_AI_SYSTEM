const { body } = require('express-validator');
const ProductReview = require('../models/ProductReview');
const { validate } = require('../middlewares/validate');

const createValidation = [
  body('product_id').isUUID(),
  body('customer_phone').optional({ nullable: true }).isString(),
  body('author_name').notEmpty().trim(),
  body('rating').isInt({ min: 1, max: 5 }),
  body('comment').optional({ nullable: true }).isString()
];

exports.createPublic = [
  ...createValidation,
  validate,
  async (req, res, next) => {
    try {
      const db = require('../config/database');
      const storeRes = await db.query('SELECT id FROM stores WHERE slug = $1', [req.params.storeSlug]);
      if (storeRes.rows.length === 0) {
        return res.status(404).json({ error: 'Store not found' });
      }
      const store = storeRes.rows[0];

      const review = await ProductReview.create({
        store_id: store.id,
        ...req.body
      });
      res.status(201).json({ success: true, data: review });
    } catch (error) {
      next(error);
    }
  }
];


exports.getAll = async (req, res, next) => {
  try {
    const { status } = req.query;
    const storeId = req.storeId || req.params.storeId;
    const reviews = await ProductReview.findByStore(storeId, status);
    res.json({ success: true, data: reviews });
  } catch (error) {
    next(error);
  }
};

exports.updateStatus = [
  body('status').isIn(['pending', 'approved', 'hidden']),
  validate,
  async (req, res, next) => {
    try {
      const storeId = req.storeId || req.params.storeId;
      const review = await ProductReview.updateStatus(req.params.id, storeId, req.body.status);
      if (!review) return res.status(404).json({ error: 'Review not found' });
      res.json({ success: true, data: review });
    } catch (error) {
      next(error);
    }
  }
];

exports.delete = async (req, res, next) => {
  try {
    const storeId = req.storeId || req.params.storeId;
    const deleted = await ProductReview.delete(req.params.id, storeId);
    if (!deleted) return res.status(404).json({ error: 'Review not found' });
    res.json({ success: true, data: { deleted: true } });
  } catch (error) {
    next(error);
  }
};
