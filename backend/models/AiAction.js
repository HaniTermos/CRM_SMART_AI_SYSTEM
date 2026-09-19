const db = require('../config/database');

class AiAction {
  static async createBatch(plan_id, store_id, actions = []) {
    const created = [];
    for (const act of actions) {
      const res = await db.query(
        `INSERT INTO ai_actions 
         (plan_id, store_id, type, classification, target_type, target_id, payload, reason, evidence, requires_confirmation)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          plan_id,
          store_id,
          act.type,
          act.classification || 'reversible',
          act.target_type || null,
          act.target_id || null,
          act.payload || {},
          act.reason || 'AI proposed action',
          act.evidence || [],
          act.requires_confirmation !== false
        ]
      );
      created.push(res.rows[0]);
    }
    return created;
  }

  static async findByPlan(plan_id, store_id) {
    const res = await db.query(
      `SELECT * FROM ai_actions WHERE plan_id = $1 AND store_id = $2 ORDER BY created_at ASC`,
      [plan_id, store_id]
    );
    return res.rows;
  }

  static async updateStatus(id, store_id, status, { result = {}, error_message = null, compensation_payload = {} } = {}) {
    const res = await db.query(
      `UPDATE ai_actions 
       SET status = $3, result = $4, error_message = $5, compensation_payload = $6, updated_at = NOW() 
       WHERE id = $1 AND store_id = $2 
       RETURNING *`,
      [id, store_id, status, result, error_message, compensation_payload]
    );
    return res.rows[0] || null;
  }
}

module.exports = AiAction;
