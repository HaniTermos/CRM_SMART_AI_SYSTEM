const { body } = require('express-validator');
const Category = require('../models/Category');
const { validate } = require('../middlewares/validate');

const createValidation = [
  body('name').notEmpty().trim().withMessage('Category name is required'),
  body('slug').notEmpty().trim().matches(/^[a-z0-9-]+$/).withMessage('Valid slug is required')
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
      if (error.code === '23505') { // Unique constraint
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

exports.delete = async (req, res, next) => {
  try {
    const deleted = await Category.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json({ success: true, data: { deleted: true } });
  } catch (error) {
    next(error);
  }
};
