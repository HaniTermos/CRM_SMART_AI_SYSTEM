const { body } = require('express-validator');
const DiscountCode = require('../models/DiscountCode');
const { validate } = require('../middlewares/validate');
const discountService = require('../services/discountService');

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
      const result = await discountService.validateDiscount({
        storeId: req.params.storeId,
        code: req.body.code,
        subtotal: req.body.subtotal,
        phone: req.body.phone,
        email: req.body.email
      });

      const data = result.source === 'crm_deal'
        ? { code: result.code, type: 'fixed', value: result.amount, min_subtotal: null }
        : { code: result.code, type: result.type, value: result.value, min_subtotal: result.min_subtotal };

      res.json({ success: true, data });
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
      const code = await DiscountCode.update(req.params.id, req.params.storeId, { active: req.body.active });
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
    const deleted = await DiscountCode.delete(req.params.id, req.params.storeId);
    if (!deleted) {
      return res.status(404).json({ error: 'Code not found' });
    }
    res.json({ success: true, data: { deleted: true } });
  } catch (error) {
    next(error);
  }
};
