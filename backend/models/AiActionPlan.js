const db = require('../config/database');

class AiActionPlan {
  static async create({ store_id, conversation_id, title, summary, estimated_impact = {}, risk_level = 'medium', idempotency_key = null, created_by = null }) {
    if (idempotency_key) {
      const existing = await db.query(
        `SELECT * FROM ai_action_plans WHERE store_id = $1 AND idempotency_key = $2`,
        [store_id, idempotency_key]
      );
      if (existing.rows.length > 0) return existing.rows[0];
    }

    const res = await db.query(
      `INSERT INTO ai_action_plans (store_id, conversation_id, title, summary, estimated_impact, risk_level, idempotency_key, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [store_id, conversation_id, title, summary, estimated_impact, risk_level, idempotency_key, created_by]
    );
    return res.rows[0];
  }

  static async findById(id, store_id) {
    const res = await db.query(
      `SELECT p.*, 
              (SELECT json_agg(a.*) FROM ai_actions a WHERE a.plan_id = p.id) AS actions
       FROM ai_action_plans p
       WHERE p.id = $1 AND p.store_id = $2`,
      [id, store_id]
    );
    return res.rows[0] || null;
  }

  static async findByStore(store_id, { status = null, limit = 20, offset = 0 } = {}) {
    let sql = `SELECT * FROM ai_action_plans WHERE store_id = $1`;
    const params = [store_id];

    if (status) {
      params.push(status);
      sql += ` AND status = $${params.length}`;
    }

    params.push(limit, offset);
    sql += ` ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const res = await db.query(sql, params);
    return res.rows;
  }

  static async updateStatus(id, store_id, status, { approved_by = null } = {}) {
    let extra = '';
    const params = [id, store_id, status];

    if (status === 'approved' && approved_by) {
      params.push(approved_by);
      extra = `, approved_by = $4, approved_at = NOW()`;
    } else if (['completed', 'failed', 'cancelled', 'rolled_back'].includes(status)) {
      extra = `, completed_at = NOW()`;
    }

    const res = await db.query(
      `UPDATE ai_action_plans SET status = $3, updated_at = NOW() ${extra} WHERE id = $1 AND store_id = $2 RETURNING *`,
      params
    );
    return res.rows[0] || null;
  }
}

module.exports = AiActionPlan;
