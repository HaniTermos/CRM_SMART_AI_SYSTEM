const { body } = require('express-validator');
const InventoryAdjustment = require('../models/InventoryAdjustment');
const { validate } = require('../middlewares/validate');
const db = require('../config/database');

const adjustValidation = [
  body('product_id').isUUID(),
  body('delta').isInt(),
  body('reason').notEmpty().trim(),
  body('note').optional({ nullable: true }).isString()
];

exports.adjust = [
  ...adjustValidation,
  validate,
  async (req, res, next) => {
    try {
      const adjustment = await InventoryAdjustment.create({
        store_id: req.params.storeId,
        product_id: req.body.product_id,
        delta: req.body.delta,
        reason: req.body.reason,
        note: req.body.note,
        created_by: req.user.id
      });
      const productRes = await db.query('SELECT stock FROM products WHERE id = $1', [req.body.product_id]);
      res.status(201).json({ success: true, data: { ...adjustment, stock: productRes.rows[0]?.stock } });
    } catch (error) {
      next(error);
    }
  }
];

exports.getHistory = async (req, res, next) => {
  try {
    const history = await InventoryAdjustment.findByStore(req.params.storeId);
    res.json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
};
