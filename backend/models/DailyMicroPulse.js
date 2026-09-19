const db = require('../config/database');

class DailyMicroPulse {
  static async findByStoreAndDate(storeId, businessDate) {
    const result = await db.query(
      `SELECT * FROM daily_micro_pulses WHERE store_id = $1 AND business_date = $2`,
      [storeId, businessDate]
    );
    return result.rows[0] || null;
  }

  static async findById(id) {
    const result = await db.query(
      `SELECT * FROM daily_micro_pulses WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  static async create({ store_id, business_date, status = 'active', metrics_snapshot = {} }, client = db) {
    // ON CONFLICT DO NOTHING to prevent concurrent duplication race conditions
    const result = await client.query(
      `INSERT INTO daily_micro_pulses (store_id, business_date, status, metrics_snapshot)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (store_id, business_date) DO NOTHING
       RETURNING *`,
      [store_id, business_date, status, metrics_snapshot]
    );
    if (result.rows[0]) {
      return result.rows[0];
    }
    // If conflict occurred, fetch the existing record
    return await this.findByStoreAndDate(store_id, business_date);
  }
}

module.exports = DailyMicroPulse;
