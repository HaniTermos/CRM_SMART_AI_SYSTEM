const db = require('../config/database');

class AiScheduledInsight {
  static async upsert({ store_id, kind, content_hash, summary, data_payload = {}, action_plan_id = null, expires_in_days = 7 }) {
    const res = await db.query(
      `INSERT INTO ai_scheduled_insights (store_id, kind, content_hash, summary, data_payload, action_plan_id, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW() + INTERVAL '1 day' * $7)
       ON CONFLICT (store_id, kind, content_hash) DO UPDATE SET
         summary = EXCLUDED.summary,
         data_payload = EXCLUDED.data_payload,
         action_plan_id = EXCLUDED.action_plan_id,
         expires_at = EXCLUDED.expires_at,
         created_at = NOW()
       RETURNING *`,
      [store_id, kind, content_hash, summary, data_payload, action_plan_id, expires_in_days]
    );
    return res.rows[0];
  }

  static async findActiveByStore(store_id) {
    const res = await db.query(
      `SELECT * FROM ai_scheduled_insights WHERE store_id = $1 AND expires_at > NOW() ORDER BY created_at DESC`,
      [store_id]
    );
    return res.rows;
  }
}

module.exports = AiScheduledInsight;
