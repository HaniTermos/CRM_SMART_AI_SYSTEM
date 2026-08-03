const db = require('../config/database');

class AiInsight {
  static async create({ store_id, customer_id, kind, summary, next_action, email_subject, email_body, recommendations, model }) {
    const result = await db.query(
      `INSERT INTO ai_insights (store_id, customer_id, kind, summary, next_action, email_subject, email_body, recommendations, model) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [store_id, customer_id, kind, summary, next_action, email_subject, email_body, JSON.stringify(recommendations || []), model]
    );
    return result.rows[0];
  }

  static async findByCustomer(customerId) {
    const result = await db.query(
      'SELECT * FROM ai_insights WHERE customer_id = $1 ORDER BY created_at DESC',
      [customerId]
    );
    return result.rows;
  }
}

module.exports = AiInsight;
