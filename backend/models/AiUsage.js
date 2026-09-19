const db = require('../config/database');

class AiUsage {
  static async recordUsage({ store_id, user_id = null, conversation_id = null, message_id = null, action_plan_id = null, provider = 'google', model = 'gemini-3.6-flash', feature, input_tokens = 0, output_tokens = 0, credits_used = 0.00, latency_ms = null, status = 'completed', idempotency_key = null }) {
    if (idempotency_key) {
      const existing = await db.query(
        `SELECT * FROM ai_usage_ledger WHERE store_id = $1 AND idempotency_key = $2`,
        [store_id, idempotency_key]
      );
      if (existing.rows.length > 0) return existing.rows[0];
    }

    const total_tokens = input_tokens + output_tokens;

    const res = await db.query(
      `INSERT INTO ai_usage_ledger 
       (store_id, user_id, conversation_id, message_id, action_plan_id, provider, model, feature, input_tokens, output_tokens, total_tokens, credits_used, latency_ms, status, idempotency_key)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *`,
      [store_id, user_id, conversation_id, message_id, action_plan_id, provider, model, feature, input_tokens, output_tokens, total_tokens, credits_used, latency_ms, status, idempotency_key]
    );

    // Deduct credits from balance if completed
    if (status === 'completed' && credits_used > 0) {
      await db.query(
        `INSERT INTO ai_store_balances (store_id, used_credits, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (store_id) DO UPDATE SET used_credits = ai_store_balances.used_credits + $2, updated_at = NOW()`,
        [store_id, credits_used]
      );
    }

    return res.rows[0];
  }

  static async getBalance(store_id) {
    const res = await db.query(
      `SELECT * FROM ai_store_balances WHERE store_id = $1`,
      [store_id]
    );

    if (res.rows.length === 0) {
      // Initialize default 100 credits for new stores
      const init = await db.query(
        `INSERT INTO ai_store_balances (store_id, monthly_credit_limit, used_credits) VALUES ($1, 100.00, 0.00) RETURNING *`,
        [store_id]
      );
      return init.rows[0];
    }

    return res.rows[0];
  }

  static async getUsageSummary(store_id) {
    const res = await db.query(
      `SELECT feature, 
              COUNT(*)::int AS total_requests,
              SUM(total_tokens)::int AS total_tokens,
              SUM(credits_used)::numeric(10,2) AS total_credits
       FROM ai_usage_ledger
       WHERE store_id = $1 AND status = 'completed'
       GROUP BY feature`,
      [store_id]
    );
    return res.rows;
  }
}

module.exports = AiUsage;
