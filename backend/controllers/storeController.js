const { body } = require('express-validator');
const Store = require('../models/Store');
const { validate } = require('../middlewares/validate');

const createValidation = [
  body('name').notEmpty().trim().withMessage('Store name is required'),
  body('slug').notEmpty().trim().matches(/^[a-z0-9-]+$/).withMessage('Valid slug is required (lowercase letters, numbers, hyphens)'),
  body('currency').optional().isLength({ min: 3, max: 3 }),
  body('shipping_fee').optional().isNumeric()
];

const updateValidation = [
  body('name').optional().notEmpty().trim(),
  body('currency').optional().isLength({ min: 3, max: 3 }),
  body('shipping_fee').optional().isNumeric(),
  body('settings').optional().isObject()
];

exports.create = [
  ...createValidation,
  validate,
  async (req, res, next) => {
    try {
      const existingSlug = await Store.findBySlug(req.body.slug);
      if (existingSlug) {
        return res.status(409).json({ error: 'Store slug is already taken' });
      }

      const store = await Store.create({
        owner_user_id: req.user.id,
        ...req.body
      });
      res.status(201).json({ success: true, data: store });
    } catch (error) {
      next(error);
    }
  }
];

exports.myStores = async (req, res, next) => {
  try {
    const stores = await Store.findByUserId(req.user.id);
    res.json({ success: true, data: stores });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    // req.store is populated by requireStoreAccess middleware
    res.json({ success: true, data: req.store });
  } catch (error) {
    next(error);
  }
};

exports.getBySlug = async (req, res, next) => {
  try {
    const store = await Store.findBySlug(req.params.slug);
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }
    // Public endpoint for storefront, return safe fields only
    const safeStore = {
      id: store.id,
      name: store.name,
      slug: store.slug,
      currency: store.currency,
      shipping_fee: store.shipping_fee,
      settings: store.settings
    };
    res.json({ success: true, data: safeStore });
  } catch (error) {
    next(error);
  }
};

exports.update = [
  ...updateValidation,
  validate,
  async (req, res, next) => {
    try {
      // req.store is populated by requireStoreAdmin middleware
      const updatedStore = await Store.update(req.store.id, req.body);
      res.json({ success: true, data: updatedStore });
    } catch (error) {
      next(error);
    }
  }
];

exports.delete = async (req, res, next) => {
  try {
    // We only allow the actual owner to delete a store
    if (req.userRole !== 'owner') {
      return res.status(403).json({ error: 'Only the store owner can delete the store' });
    }
    
    await Store.delete(req.store.id);
    res.json({ success: true, data: { deleted: true } });
  } catch (error) {
    next(error);
  }
};

exports.getAlerts = async (req, res, next) => {
  try {
    const db = require('../config/database');
    const { storeId } = req.params;
    
    const pendingOrdersRes = await db.query(
      `SELECT id, total, created_at FROM orders WHERE store_id = $1 AND status = 'pending' ORDER BY created_at ASC`,
      [storeId]
    );
    const pendingOrdersCount = pendingOrdersRes.rows.length;

    const lowStockRes = await db.query(
      `SELECT id, name, stock FROM products WHERE store_id = $1 AND stock <= 10 AND status = 'active'`,
      [storeId]
    );
    const lowStockCount = lowStockRes.rows.length;

    res.json({
      success: true,
      data: [
        { id: 'pending_orders', type: 'pending_orders', count: pendingOrdersCount, message: `${pendingOrdersCount} pending orders need fulfillment.` },
        { id: 'low_stock', type: 'low_stock', count: lowStockCount, message: `${lowStockCount} products are low in stock.` }
      ]
    });
  } catch (error) {
    next(error);
  }
};

