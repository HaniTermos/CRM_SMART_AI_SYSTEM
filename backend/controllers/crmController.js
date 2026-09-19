const db = require('../config/database');

exports.getPipelines = async (req, res, next) => {
  try {
    const { storeId } = req.params;
    const result = await db.query(
      'SELECT * FROM crm_pipelines WHERE store_id = $1 ORDER BY created_at ASC',
      [storeId]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

exports.createPipeline = async (req, res, next) => {
  try {
    const { storeId } = req.params;
    const { name, description } = req.body;
    const result = await db.query(
      'INSERT INTO crm_pipelines (store_id, name, description) VALUES ($1, $2, $3) RETURNING *',
      [storeId, name, description]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

exports.getStages = async (req, res, next) => {
  try {
    const { storeId, pipelineId } = req.params;

    const pipelineResult = await db.query(
      'SELECT id FROM crm_pipelines WHERE id = $1 AND store_id = $2',
      [pipelineId, storeId]
    );
    if (pipelineResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pipeline not found' });
    }

    const result = await db.query(
      'SELECT * FROM crm_stages WHERE pipeline_id = $1 ORDER BY position ASC',
      [pipelineId]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

exports.createStage = async (req, res, next) => {
  try {
    const { storeId, pipelineId } = req.params;
    const { name, position } = req.body;

    const pipelineResult = await db.query(
      'SELECT id FROM crm_pipelines WHERE id = $1 AND store_id = $2',
      [pipelineId, storeId]
    );
    if (pipelineResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pipeline not found' });
    }

    const result = await db.query(
      'INSERT INTO crm_stages (pipeline_id, name, position) VALUES ($1, $2, $3) RETURNING *',
      [pipelineId, name, position || 0]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

exports.getDeals = async (req, res, next) => {
  try {
    const { storeId } = req.params;
    const { pipelineId } = req.query;
    
    let query = 'SELECT d.*, c.name as customer_name FROM crm_deals d LEFT JOIN customers c ON d.customer_id = c.id WHERE d.store_id = $1';
    const params = [storeId];
    
    if (pipelineId) {
      query += ' AND d.pipeline_id = $2';
      params.push(pipelineId);
    }
    
    query += ' ORDER BY d.created_at DESC';
    
    const result = await db.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

exports.getDeal = async (req, res, next) => {
  try {
    const { storeId, dealId } = req.params;
    const result = await db.query(
      'SELECT d.*, c.name as customer_name FROM crm_deals d LEFT JOIN customers c ON d.customer_id = c.id WHERE d.id = $1 AND d.store_id = $2',
      [dealId, storeId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Deal not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

exports.createDeal = async (req, res, next) => {
  try {
    const { storeId } = req.params;
    const { pipeline_id, stage_id, customer_id, title, value, status, expected_close_date } = req.body;

    const pipelineResult = await db.query(
      'SELECT id FROM crm_pipelines WHERE id = $1 AND store_id = $2',
      [pipeline_id, storeId]
    );
    if (pipelineResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pipeline not found' });
    }

    const stageResult = await db.query(
      'SELECT id FROM crm_stages WHERE id = $1 AND pipeline_id = $2',
      [stage_id, pipeline_id]
    );
    if (stageResult.rows.length === 0) {
      return res.status(400).json({ error: 'Stage does not belong to the selected pipeline' });
    }

    if (customer_id) {
      const customerResult = await db.query(
        'SELECT id FROM customers WHERE id = $1 AND store_id = $2',
        [customer_id, storeId]
      );
      if (customerResult.rows.length === 0) {
        return res.status(400).json({ error: 'Customer not found in this store' });
      }
    }

    const result = await db.query(
      `INSERT INTO crm_deals (store_id, pipeline_id, stage_id, customer_id, title, value, status, expected_close_date) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [storeId, pipeline_id, stage_id, customer_id || null, title, value || 0, status || 'open', expected_close_date || null]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

exports.updateDeal = async (req, res, next) => {
  try {
    const { storeId, dealId } = req.params;
    const { title, value, status, expected_close_date } = req.body;
    
    const result = await db.query(
      `UPDATE crm_deals SET title = COALESCE($1, title), value = COALESCE($2, value), 
       status = COALESCE($3, status), expected_close_date = COALESCE($4, expected_close_date), updated_at = NOW() 
       WHERE id = $5 AND store_id = $6 RETURNING *`,
      [title, value, status, expected_close_date, dealId, storeId]
    );
    
    if (result.rows.length === 0) return res.status(404).json({ error: 'Deal not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

exports.updateDealStage = async (req, res, next) => {
  try {
    const { storeId, dealId } = req.params;
    const { stage_id } = req.body;
    
    const stageResult = await db.query(
      `SELECT s.id FROM crm_stages s
       JOIN crm_pipelines p ON p.id = s.pipeline_id
       WHERE s.id = $1 AND p.store_id = $2`,
      [stage_id, storeId]
    );
    if (stageResult.rows.length === 0) {
      return res.status(400).json({ error: 'Stage does not belong to this store' });
    }

    const result = await db.query(
      'UPDATE crm_deals SET stage_id = $1, updated_at = NOW() WHERE id = $2 AND store_id = $3 RETURNING *',
      [stage_id, dealId, storeId]
    );
    
    if (result.rows.length === 0) return res.status(404).json({ error: 'Deal not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

exports.getDealNotes = async (req, res, next) => {
  try {
    const { storeId, dealId } = req.params;

    const dealResult = await db.query(
      'SELECT id FROM crm_deals WHERE id = $1 AND store_id = $2',
      [dealId, storeId]
    );
    if (dealResult.rows.length === 0) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    const result = await db.query(
      'SELECT n.*, u.name as user_name FROM crm_deal_notes n JOIN users u ON n.user_id = u.id WHERE n.deal_id = $1 ORDER BY n.created_at DESC',
      [dealId]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

exports.createDealNote = async (req, res, next) => {
  try {
    const { storeId, dealId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    const dealResult = await db.query(
      'SELECT id FROM crm_deals WHERE id = $1 AND store_id = $2',
      [dealId, storeId]
    );
    if (dealResult.rows.length === 0) {
      return res.status(404).json({ error: 'Deal not found' });
    }

    const result = await db.query(
      'INSERT INTO crm_deal_notes (deal_id, user_id, content) VALUES ($1, $2, $3) RETURNING *',
      [dealId, userId, content]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
};