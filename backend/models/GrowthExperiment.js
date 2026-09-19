const db = require('../config/database');

class GrowthExperiment {
  static async findByStore(storeId, { status } = {}) {
    let query = `SELECT ge.*, pr.title as recommendation_title, pr.reason as recommendation_reason
                 FROM growth_experiments ge
                 LEFT JOIN pulse_recommendations pr ON ge.recommendation_id = pr.id
                 WHERE ge.store_id = $1`;
    const params = [storeId];

    if (status && status !== 'all') {
      query += ` AND ge.status = $${params.length + 1}`;
      params.push(status);
    }

    query += ` ORDER BY ge.created_at DESC`;
    const result = await db.query(query, params);
    return result.rows;
  }

  static async findById(id, storeId) {
    let query = `SELECT ge.*, pr.title as recommendation_title, pr.reason as recommendation_reason
                 FROM growth_experiments ge
                 LEFT JOIN pulse_recommendations pr ON ge.recommendation_id = pr.id
                 WHERE ge.id = $1`;
    const params = [id];

    if (storeId) {
      query += ` AND ge.store_id = $2`;
      params.push(storeId);
    }

    const result = await db.query(query, params);
    return result.rows[0] || null;
  }

  static async findByRecommendationId(recommendationId) {
    const result = await db.query(
      `SELECT * FROM growth_experiments WHERE recommendation_id = $1`,
      [recommendationId]
    );
    return result.rows[0] || null;
  }

  static async create({
    store_id,
    recommendation_id,
    action_log_id,
    action_type,
    target_metric,
    target_entity_type,
    target_entity_id,
    baseline_value = 0,
    baseline_period_start,
    baseline_period_end,
    experiment_start,
    experiment_end,
    expected_impact,
    status = 'running'
  }, client = db) {
    const result = await client.query(
      `INSERT INTO growth_experiments (
         store_id, recommendation_id, action_log_id, action_type, target_metric,
         target_entity_type, target_entity_id, baseline_value, baseline_period_start,
         baseline_period_end, experiment_start, experiment_end, expected_impact, status
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       ON CONFLICT (recommendation_id) DO NOTHING
       RETURNING *`,
      [
        store_id,
        recommendation_id,
        action_log_id || null,
        action_type,
        target_metric,
        target_entity_type || null,
        target_entity_id || null,
        baseline_value,
        baseline_period_start,
        baseline_period_end,
        experiment_start || new Date().toISOString(),
        experiment_end,
        expected_impact,
        status
      ]
    );

    if (result.rows[0]) {
      return result.rows[0];
    }
    return await this.findByRecommendationId(recommendation_id);
  }

  static async update(id, storeId, updates) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && !['id', 'created_at', 'store_id'].includes(key)) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (fields.length === 0) return null;

    values.push(id);
    values.push(storeId);

    const result = await db.query(
      `UPDATE growth_experiments 
       SET ${fields.join(', ')} 
       WHERE id = $${paramIndex} AND store_id = $${paramIndex + 1} 
       RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }
}

module.exports = GrowthExperiment;
