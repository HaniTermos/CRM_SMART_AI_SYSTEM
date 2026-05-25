const AiService = require('../services/AiService');
const AiInsight = require('../models/AiInsight');
const Customer = require('../models/Customer');
const Order = require('../models/Order');
const db = require('../config/database');

exports.generateInsight = async (req, res, next) => {
  try {
    const storeId = req.params.storeId;
    const customerId = req.params.customerId;

    const customer = await Customer.findById(customerId);
    if (!customer || customer.store_id !== storeId) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const ordersResult = await db.query(
      'SELECT * FROM orders WHERE customer_id = $1 ORDER BY created_at DESC',
      [customerId]
    );

    const insightData = await AiService.generateInsight(req.store, customer, ordersResult.rows);

    const savedInsight = await AiInsight.create({
      store_id: storeId,
      customer_id: customerId,
      ...insightData
    });

    res.status(201).json({ success: true, data: savedInsight });
  } catch (error) {
    next(error);
  }
};

exports.getInsights = async (req, res, next) => {
  try {
    const insights = await AiInsight.findByCustomer(req.params.customerId);
    res.json({ success: true, data: insights });
  } catch (error) {
    next(error);
  }
};

exports.getReengagement = async (req, res, next) => {
  try {
    const { storeId } = req.params;
    const result = await db.query(
      `SELECT id, name, email, phone, last_order_at, segment, total_orders, total_spent
       FROM customers 
       WHERE store_id = $1 
         AND last_order_at < NOW() - INTERVAL '30 days'
         AND segment != 'churned'
       ORDER BY last_order_at ASC
       LIMIT 10`,
      [storeId]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

exports.getRecentInsights = async (req, res, next) => {
  try {
    const { storeId } = req.params;
    const result = await db.query(
      `SELECT ai.*, c.name as customer_name, c.email as customer_email
       FROM ai_insights ai
       LEFT JOIN customers c ON ai.customer_id = c.id
       WHERE ai.store_id = $1 AND ai.kind != 'product_demand'
       ORDER BY ai.created_at DESC
       LIMIT 10`,
      [storeId]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

exports.getDemandHistory = async (req, res, next) => {
  try {
    const { storeId } = req.params;
    const result = await db.query(
      `SELECT id, created_at, summary, next_action, email_subject, recommendations
       FROM ai_insights
       WHERE store_id = $1 AND kind = 'product_demand'
       ORDER BY created_at DESC
       LIMIT 20`,
      [storeId]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

exports.scoreDemand = async (req, res, next) => {
  try {
    const { storeId } = req.params;
    const { idea, targetPrice } = req.body;

    if (!idea || idea.trim().length < 3) {
      return res.status(400).json({ error: 'Product idea must be at least 3 characters long.' });
    }

    const insightData = await AiService.scoreDemand(req.store, idea.trim(), targetPrice);

    const savedInsight = await AiInsight.create({
      store_id: storeId,
      customer_id: null,
      ...insightData
    });

    res.status(201).json({ success: true, data: savedInsight });
  } catch (error) {
    next(error);
  }
};


