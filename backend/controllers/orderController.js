const { body } = require('express-validator');
const Order = require('../models/Order');
const Customer = require('../models/Customer');
const { validate } = require('../middlewares/validate');
const orderService = require('../services/orderService');
const orderLookupService = require('../services/orderLookupService');

const checkoutValidation = [
  body('customer.name').notEmpty().trim(),
  body('customer.phone').notEmpty().trim(),
  body('customer.email').optional().isEmail().normalizeEmail(),
  body('shipping_address').isObject(),
  body('items').isArray({ min: 1 }),
  body('items.*.product_id').isUUID(),
  body('items.*.quantity').isInt({ min: 1 }),
  body('discount_code').optional().isString(),
  body('notes').optional().isString()
];

const updateStatusValidation = [
  body('status').isIn(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'])
];

/**
 * Store-scoped checkout endpoint.
 * Delegates to orderService.createOrder.
 */
exports.checkout = [
  ...checkoutValidation,
  validate,
  async (req, res, next) => {
    try {
      const { customer, shipping_address, items, discount_code, notes, table_label, floor_id } = req.body;
      const storeId = req.params.storeId;

      const result = await orderService.createOrder({
        storeId,
        customer,
        address: shipping_address,
        notes,
        discount_code,
        items,
        table_label,
        floor_id,
        payment_method: req.body.payment_method,
        payment_status: req.body.payment_status,
        source: req.body.source,
        logActivity: true
      });

      res.status(201).json({ success: true, data: result });
    } catch (error) {
      if (error.message.includes('stock') || error.message.includes('not found') || error.message.includes('not available')) {
        return res.status(400).json({ error: error.message });
      }
      next(error);
    }
  }
];

exports.lookupOrder = [
  body('order_number').notEmpty().trim(),
  body('phone').notEmpty().trim(),
  validate,
  async (req, res, next) => {
    try {
      const { order_number, phone } = req.body;
      const result = await orderLookupService.lookupOrder({
        storeId: req.params.storeId,
        orderNumber: order_number,
        phone
      });

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
];

exports.getAll = async (req, res, next) => {
  try {
    const orders = await Order.findByStore(req.params.storeId);
    res.json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order || order.store_id !== req.params.storeId) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

exports.updateStatus = [
  ...updateStatusValidation,
  validate,
  async (req, res, next) => {
    try {
      const order = await Order.updateStatus(req.params.id, req.params.storeId, req.body.status);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      // Log activity
      await Customer.logActivity({
        store_id: req.params.storeId,
        customer_id: order.customer_id,
        type: 'order_status_changed',
        payload: { order_number: order.order_number, new_status: req.body.status }
      });

      res.json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  }
];

exports.updatePaymentStatus = [
  body('payment_status').isIn(['unpaid', 'pending', 'paid', 'partially_paid', 'failed', 'refunded', 'partially_refunded']),
  body('refunded_amount').optional().isNumeric(),
  validate,
  async (req, res, next) => {
    try {
      const { payment_status, refunded_amount } = req.body;
      const order = await Order.updatePaymentStatus(req.params.id, req.params.storeId, payment_status, refunded_amount);
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      await Customer.logActivity({
        store_id: req.params.storeId,
        customer_id: order.customer_id,
        type: 'order_payment_status_changed',
        payload: { order_number: order.order_number, new_payment_status: payment_status, refunded_amount }
      });

      res.json({ success: true, data: order });
    } catch (error) {
      next(error);
    }
  }
];

