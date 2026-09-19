const { body, param } = require('express-validator');
const Category = require('../models/Category');
const { validate } = require('../middlewares/validate');

const createValidation = [
  body('name').notEmpty().trim().withMessage('Category name is required'),
  body('slug').notEmpty().trim().matches(/^[a-z0-9-]+$/).withMessage('Valid slug is required'),
  body('position').optional().isInt({ min: 0 })
];

const updateValidation = [
  body('name').optional().trim(),
  body('slug').optional().trim().matches(/^[a-z0-9-]+$/),
  body('position').optional().isInt({ min: 0 }),
  body('is_archived').optional().isBoolean()
];

exports.create = [
  ...createValidation,
  validate,
  async (req, res, next) => {
    try {
      const category = await Category.create({
        store_id: req.params.storeId,
        ...req.body
      });
      res.status(201).json({ success: true, data: category });
    } catch (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Category slug already exists' });
      }
      next(error);
    }
  }
];

exports.getAll = async (req, res, next) => {
  try {
    const categories = await Category.findByStore(req.params.storeId);
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category || category.store_id !== req.params.storeId) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

exports.update = [
  ...updateValidation,
  validate,
  async (req, res, next) => {
    try {
      const updated = await Category.update(req.params.id, req.params.storeId, req.body);
      if (!updated) {
        return res.status(404).json({ error: 'Category not found' });
      }
      res.json({ success: true, data: updated });
    } catch (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Category slug already exists' });
      }
      next(error);
    }
  }
];

exports.reorder = [
  body('orderedIds').isArray({ min: 1 }).withMessage('orderedIds array is required'),
  validate,
  async (req, res, next) => {
    try {
      await Category.reorder(req.params.storeId, req.body.orderedIds);
      const categories = await Category.findByStore(req.params.storeId);
      res.json({ success: true, data: categories });
    } catch (error) {
      next(error);
    }
  }
];

exports.delete = async (req, res, next) => {
  try {
    const deleted = await Category.delete(req.params.id, req.params.storeId);
    if (!deleted) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json({ success: true, data: { deleted: true } });
  } catch (error) {
    next(error);
  }
};
