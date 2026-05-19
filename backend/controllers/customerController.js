const { body } = require('express-validator');
const Customer = require('../models/Customer');
const { validate } = require('../middlewares/validate');

const updateValidation = [
  body('segment').optional().isIn(['new', 'active', 'vip', 'at_risk', 'churned']),
  body('notes').optional().isString()
];

exports.getAll = async (req, res, next) => {
  try {
    const customers = await Customer.findByStore(req.params.storeId);
    res.json({ success: true, data: customers });
  } catch (error) {
    next(error);
  }
};

exports.getById = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer || customer.store_id !== req.params.storeId) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
};

exports.update = [
  ...updateValidation,
  validate,
  async (req, res, next) => {
    try {
      const customer = await Customer.update(req.params.id, req.body);
      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }
      res.json({ success: true, data: customer });
    } catch (error) {
      next(error);
    }
  }
];

exports.getActivities = async (req, res, next) => {
  try {
    const activities = await Customer.getActivities(req.params.id);
    res.json({ success: true, data: activities });
  } catch (error) {
    next(error);
  }
};

exports.addActivity = [
  body('type').notEmpty().trim(),
  body('payload').optional().isObject(),
  validate,
  async (req, res, next) => {
    try {
      const activity = await Customer.logActivity({
        store_id: req.params.storeId,
        customer_id: req.params.id,
        type: req.body.type,
        payload: req.body.payload || {}
      });
      res.status(201).json({ success: true, data: activity });
    } catch (error) {
      next(error);
    }
  }
];
