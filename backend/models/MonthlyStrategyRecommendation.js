const db = require('../config/database');

class MonthlyStrategyRecommendation {
  static async findByStrategyId(strategyId) {
    const result = await db.query(
      `SELECT * FROM monthly_strategy_recommendations 
       WHERE strategy_id = $1 
       ORDER BY CASE category 
         WHEN 'revenue_optimization' THEN 1 
         WHEN 'operational_efficiency' THEN 2 
         WHEN 'customer_retention' THEN 3 
         ELSE 4 
       END`,
      [strategyId]
    );
    return result.rows;
  }

  static async findById(id) {
    const result = await db.query(
      `SELECT * FROM monthly_strategy_recommendations WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  static async createMany(recommendations, client = db) {
    const created = [];
    for (const rec of recommendations) {
      const result = await client.query(
        `INSERT INTO monthly_strategy_recommendations (
           strategy_id, store_id, category, title, priority, confidence, reason,
           evidence_summary, expected_impact_range, risk_level, source_basis,
           suggested_execution_path, experiment_suggestion, status
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         ON CONFLICT (strategy_id, category) DO UPDATE 
         SET title = EXCLUDED.title,
             priority = EXCLUDED.priority,
             confidence = EXCLUDED.confidence,
             reason = EXCLUDED.reason,
             evidence_summary = EXCLUDED.evidence_summary,
             expected_impact_range = EXCLUDED.expected_impact_range,
             risk_level = EXCLUDED.risk_level,
             source_basis = EXCLUDED.source_basis,
             suggested_execution_path = EXCLUDED.suggested_execution_path,
             experiment_suggestion = EXCLUDED.experiment_suggestion,
             updated_at = NOW()
         RETURNING *`,
        [
          rec.strategy_id,
          rec.store_id,
          rec.category,
          rec.title,
          rec.priority || 'medium',
          rec.confidence || 70,
          rec.reason,
          rec.evidence_summary || {},
          rec.expected_impact_range,
          rec.risk_level || 'low',
          rec.source_basis || {},
          rec.suggested_execution_path,
          rec.experiment_suggestion || {},
          rec.status || 'active'
        ]
      );
      created.push(result.rows[0]);
    }
    return created;
  }

  static async markAsViewed(id, storeId) {
    const result = await db.query(
      `UPDATE monthly_strategy_recommendations 
       SET status = 'viewed', updated_at = NOW() 
       WHERE id = $1 AND store_id = $2 
       RETURNING *`,
      [id, storeId]
    );
    return result.rows[0] || null;
  }

  static async markAsDismissed(id, storeId) {
    const result = await db.query(
      `UPDATE monthly_strategy_recommendations 
       SET status = 'dismissed', updated_at = NOW() 
       WHERE id = $1 AND store_id = $2 
       RETURNING *`,
      [id, storeId]
    );
    return result.rows[0] || null;
  }
}

module.exports = MonthlyStrategyRecommendation;
