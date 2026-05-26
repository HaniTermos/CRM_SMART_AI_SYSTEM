const { body } = require('express-validator');
const DiscountCode = require('../models/DiscountCode');
const { validate } = require('../middlewares/validate');

const createValidation = [
  body('code').notEmpty().trim().isAlphanumeric(),
  body('type').isIn(['percent', 'fixed']),
  body('value').isNumeric(),
  body('min_subtotal').optional().isNumeric(),
  body('max_uses').optional({ nullable: true }).isInt({ min: 1 }),
  body('expires_at').optional({ nullable: true }).isISO8601()
];

exports.create = [
  ...createValidation,
  validate,
  async (req, res, next) => {
    try {
      const code = await DiscountCode.create({
        store_id: req.params.storeId,
        ...req.body
      });
      res.status(201).json({ success: true, data: code });
    } catch (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Discount code already exists' });
      }
      next(error);
    }
  }
];

exports.getAll = async (req, res, next) => {
  try {
    const codes = await DiscountCode.findByStore(req.params.storeId);
    res.json({ success: true, data: codes });
  } catch (error) {
    next(error);
  }
};

exports.validateCode = [
  body('code').notEmpty().trim(),
  validate,
  async (req, res, next) => {
    try {
      const code = await DiscountCode.findByCode(req.params.storeId, req.body.code);
      
      if (!code) {
        return res.status(404).json({ error: 'Invalid discount code' });
      }
      if (!code.active) {
        return res.status(400).json({ error: 'Discount code is no longer active' });
      }
      if (code.expires_at && new Date(code.expires_at) < new Date()) {
        return res.status(400).json({ error: 'Discount code has expired' });
      }
      if (code.max_uses && code.used_count >= code.max_uses) {
        return res.status(400).json({ error: 'Discount code usage limit reached' });
      }

      // Safe return for public validation
      res.json({ 
        success: true, 
        data: {
          code: code.code,
          type: code.type,
          value: code.value,
          min_subtotal: code.min_subtotal
        } 
      });
    } catch (error) {
      next(error);
    }
  }
];

exports.toggle = [
  body('active').isBoolean(),
  validate,
  async (req, res, next) => {
    try {
      const code = await DiscountCode.update(req.params.id, { active: req.body.active });
      if (!code) {
        return res.status(404).json({ error: 'Code not found' });
      }
      res.json({ success: true, data: code });
    } catch (error) {
      next(error);
    }
  }
];

exports.delete = async (req, res, next) => {
  try {
    const deleted = await DiscountCode.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Code not found' });
    }
    res.json({ success: true, data: { deleted: true } });
  } catch (error) {
    next(error);
  }
};
