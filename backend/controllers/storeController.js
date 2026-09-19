const { body } = require('express-validator');
const Store = require('../models/Store');
const { validate } = require('../middlewares/validate');
const { initializeStoreCms } = require('../services/cmsInitializer');

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

      // Initialize CMS V2 defaults for the new store
      try {
        await initializeStoreCms(store.id, store.slug);
      } catch (cmsErr) {
        console.error('[CMS] Failed to initialize store CMS:', cmsErr.message);
      }

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
      const updatedStore = await Store.update(req.store.id, req.body);
      res.json({ success: true, data: updatedStore });
    } catch (error) {
      next(error);
    }
  }
];

exports.delete = async (req, res, next) => {
  try {
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

exports.getMyDashboardStats = async (req, res, next) => {
  try {
    const DashboardService = require('../services/DashboardService');
    const stores = await Store.findByUserId(req.user.id);
    if (!stores || stores.length === 0) {
      return res.status(404).json({ error: 'No store found for this account' });
    }
    const store = stores[0];
    const stats = await DashboardService.getAuthenticatedStoreStats(store.id);

    res.json({
      success: true,
      data: {
        store: {
          id: store.id,
          name: store.name,
          slug: store.slug,
          currency: store.currency,
          shipping_fee: store.shipping_fee,
          phone: store.settings?.phone || '',
          email: store.settings?.email || '',
          address: store.settings?.address || '',
          timezone: store.settings?.timezone || 'UTC+3',
          isOpen: store.settings?.isOpen !== false,
        },
        ...stats,
      },
    });
  } catch (error) {
    next(error);
  }
};


