const db = require('../config/database');

class PulseRecommendation {
  static async findByPulseId(pulseId) {
    const result = await db.query(
      `SELECT * FROM pulse_recommendations 
       WHERE pulse_id = $1 
       ORDER BY CASE category 
         WHEN 'revenue' THEN 1 
         WHEN 'operations' THEN 2 
         WHEN 'customer_growth' THEN 3 
         ELSE 4 
       END`,
      [pulseId]
    );
    return result.rows;
  }

  static async findById(id, storeId = null) {
    let query = `SELECT * FROM pulse_recommendations WHERE id = $1`;
    const params = [id];

    if (storeId) {
      query += ` AND store_id = $2`;
      params.push(storeId);
    }

    const result = await db.query(query, params);
    return result.rows[0] || null;
  }

  static async createMany(recommendations, client = db) {
    const created = [];
    for (const rec of recommendations) {
      const result = await client.query(
        `INSERT INTO pulse_recommendations (
           pulse_id, store_id, category, title, priority, confidence, reason, expected_impact, target_role, source_basis, status
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (pulse_id, category) DO UPDATE 
         SET title = EXCLUDED.title,
             priority = EXCLUDED.priority,
             confidence = EXCLUDED.confidence,
             reason = EXCLUDED.reason,
             expected_impact = EXCLUDED.expected_impact,
             target_role = EXCLUDED.target_role,
             source_basis = EXCLUDED.source_basis,
             updated_at = NOW()
         RETURNING *`,
        [
          rec.pulse_id,
          rec.store_id,
          rec.category,
          rec.title,
          rec.priority || 'medium',
          rec.confidence || 70,
          rec.reason,
          rec.expected_impact,
          rec.target_role || 'owner',
          rec.source_basis || {},
          rec.status || 'active'
        ]
      );
      created.push(result.rows[0]);
    }
    return created;
  }

  static async markAsViewed(id, storeId) {
    const result = await db.query(
      `UPDATE pulse_recommendations 
       SET status = 'viewed', viewed_at = NOW() 
       WHERE id = $1 AND store_id = $2 
       RETURNING *`,
      [id, storeId]
    );
    return result.rows[0] || null;
  }

  static async markAsDismissed(id, storeId) {
    const result = await db.query(
      `UPDATE pulse_recommendations 
       SET status = 'dismissed', dismissed_at = NOW() 
       WHERE id = $1 AND store_id = $2 
       RETURNING *`,
      [id, storeId]
    );
    return result.rows[0] || null;
  }
}

module.exports = PulseRecommendation;
