const { body } = require('express-validator');
const Product = require('../models/Product');
const { validate } = require('../middlewares/validate');

const createValidation = [
  body('name').notEmpty().trim().withMessage('Product name is required'),
  body('slug').notEmpty().trim().matches(/^[a-zA-Z0-9_-]+$/).withMessage('Valid slug is required'),
  body('price').isNumeric().withMessage('Price must be a number'),
  body('stock').isInt({ min: 0 }).withMessage('Stock must be a positive integer'),
  body('category_id').optional({ nullable: true }).isUUID(),
  body('status').optional().isIn(['draft', 'active', 'archived'])
];

const updateValidation = [
  body('name').optional().notEmpty().trim(),
  body('slug').optional().notEmpty().trim().matches(/^[a-zA-Z0-9_-]+$/),
  body('price').optional().isNumeric(),
  body('stock').optional().isInt({ min: 0 }),
  body('category_id').optional({ nullable: true }).isUUID(),
  body('status').optional().isIn(['draft', 'active', 'archived'])
];

exports.create = [
  ...createValidation,
  validate,
  async (req, res, next) => {
    try {
      const existingSlug = await Product.findBySlug(req.params.storeId, req.body.slug);
      if (existingSlug) {
        return res.status(409).json({ error: 'Product slug is already taken in this store' });
      }

      const product = await Product.create({
        store_id: req.params.storeId,
        ...req.body
      });
      res.status(201).json({ success: true, data: product });
    } catch (error) {
      next(error);
    }
  }
];

exports.getAll = async (req, res, next) => {
  try {
    const activeOnly = req.query.active === 'true';
    const products = await Product.findByStore(req.params.storeId, { activeOnly });
    res.json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product || product.store_id !== req.params.storeId) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

exports.getBySlug = async (req, res, next) => {
  try {
    const product = await Product.findBySlug(req.params.storeId, req.params.slug);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

exports.update = [
  ...updateValidation,
  validate,
  async (req, res, next) => {
    try {
      const updatedProduct = await Product.update(req.params.id, req.body);
      if (!updatedProduct) {
        return res.status(404).json({ error: 'Product not found' });
      }
      res.json({ success: true, data: updatedProduct });
    } catch (error) {
      next(error);
    }
  }
];

exports.delete = async (req, res, next) => {
  try {
    const deleted = await Product.delete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ success: true, data: { deleted: true } });
  } catch (error) {
    next(error);
  }
};

exports.uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Construct public URL
    const baseUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
    const publicUrl = `${baseUrl}/uploads/${req.params.storeId}/${req.file.filename}`;

    res.json({
      success: true,
      data: {
        url: publicUrl,
        path: req.file.path
      }
    });
  } catch (error) {
    next(error);
  }
};
