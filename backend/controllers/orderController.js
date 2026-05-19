const { body } = require('express-validator');
const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Product = require('../models/Product');
const db = require('../config/database');
const { validate } = require('../middlewares/validate');

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
 * Public checkout endpoint.
 * Handles the full transaction: Upsert customer -> Check stock -> Create order -> Deduct stock -> Log activity
 */
exports.checkout = [
  ...checkoutValidation,
  validate,
  async (req, res, next) => {
    try {
      const { customer, shipping_address, items, discount_code, notes } = req.body;
      const storeId = req.params.storeId;

      const result = await db.transaction(async (client) => {
        // 1. Process customer (find or create by phone)
        let dbCustomer = await Customer.findByPhone(storeId, customer.phone);
        if (!dbCustomer) {
          dbCustomer = await Customer.create({
            store_id: storeId,
            name: customer.name,
            phone: customer.phone,
            email: customer.email,
            segment: 'new'
          });
        } else if (customer.name || customer.email) {
          // Update details if they changed
          dbCustomer = await Customer.update(dbCustomer.id, {
            name: customer.name || dbCustomer.name,
            email: customer.email || dbCustomer.email
          }, client);
        }

        // 2. Validate products and calculate totals
        let subtotal = 0;
        const processedItems = [];

        for (const item of items) {
          const product = await Product.findById(item.product_id);
          if (!product || product.store_id !== storeId) {
            throw new Error(`Product ${item.product_id} not found`);
          }
          if (product.status !== 'active') {
            throw new Error(`Product ${product.name} is not available`);
          }
          if (product.stock < item.quantity) {
            throw new Error(`Not enough stock for ${product.name}. Available: ${product.stock}`);
          }

          const itemSubtotal = product.price * item.quantity;
          subtotal += itemSubtotal;

          processedItems.push({
            product_id: product.id,
            product_name: product.name,
            unit_price: product.price,
            quantity: item.quantity,
            subtotal: itemSubtotal
          });

          // Deduct stock
          await Product.updateStock(product.id, product.stock - item.quantity, client);
        }

        // 3. Process discount (simplified for MVP)
        let discountAmount = 0;
        if (discount_code) {
          // A real implementation would query the discount_codes table
          // For now, assume it's valid if passed (as frontend validates it)
          // discountAmount = ... 
        }

        // 4. Calculate total
        const shippingFee = req.store?.shipping_fee || 0; // Requires looking up store if not passed
        const total = subtotal - discountAmount + Number(shippingFee);

        // 5. Generate unique order number (e.g., ORD-123456)
        const orderNumber = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;

        // 6. Create order
        const order = await Order.createWithItems({
          store_id: storeId,
          customer_id: dbCustomer.id,
          order_number: orderNumber,
          payment_method: 'cash_on_delivery',
          subtotal,
          shipping_fee: shippingFee,
          discount_code,
          discount_amount: discountAmount,
          total,
          shipping_address,
          notes,
          items: processedItems
        }, client);

        // 7. Log activity
        await Customer.logActivity({
          store_id: storeId,
          customer_id: dbCustomer.id,
          type: 'order_placed',
          payload: { order_number: order.order_number, total: order.total }
        }, client);

        return order;
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
      const order = await Order.findByNumber(req.params.storeId, order_number);

      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      // Verify phone number (last 4 digits like the original SmartStore-AI logic)
      if (!order.customer.phone.endsWith(phone.slice(-4))) {
        return res.status(403).json({ error: 'Phone verification failed' });
      }

      res.json({ success: true, data: order });
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
      const order = await Order.updateStatus(req.params.id, req.body.status);
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
