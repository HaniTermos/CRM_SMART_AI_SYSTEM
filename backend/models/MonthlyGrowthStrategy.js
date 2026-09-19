const db = require('../config/database');

class MonthlyGrowthStrategy {
  static async findByStoreAndPeriod(storeId, strategyPeriod) {
    const result = await db.query(
      `SELECT * FROM monthly_growth_strategies 
       WHERE store_id = $1 AND strategy_period = $2`,
      [storeId, strategyPeriod]
    );
    return result.rows[0] || null;
  }

  static async findByStore(storeId) {
    const result = await db.query(
      `SELECT * FROM monthly_growth_strategies 
       WHERE store_id = $1 
       ORDER BY strategy_period DESC`,
      [storeId]
    );
    return result.rows;
  }

  static async create({
    store_id,
    strategy_period,
    status = 'active',
    data_sufficiency_tier = 'sufficient',
    metrics_snapshot = {},
    past_outcomes_summary = {}
  }, client = db) {
    const result = await client.query(
      `INSERT INTO monthly_growth_strategies (
         store_id, strategy_period, status, data_sufficiency_tier, metrics_snapshot, past_outcomes_summary
       ) VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (store_id, strategy_period) DO NOTHING
       RETURNING *`,
      [
        store_id,
        strategy_period,
        status,
        data_sufficiency_tier,
        metrics_snapshot,
        past_outcomes_summary
      ]
    );

    if (result.rows[0]) {
      return result.rows[0];
    }
    return await this.findByStoreAndPeriod(store_id, strategy_period);
  }
}

module.exports = MonthlyGrowthStrategy;
