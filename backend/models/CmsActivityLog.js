const db = require('../config/database');

class CmsActivityLog {
  static async findByStoreId(storeId, limit = 25) {
    const result = await db.query(
      `SELECT cal.*, u.name as user_name, u.email as user_email
       FROM cms_activity_logs cal
       LEFT JOIN users u ON cal.user_id = u.id
       WHERE cal.store_id = $1
       ORDER BY cal.created_at DESC LIMIT $2`,
      [storeId, limit]
    );
    return result.rows;
  }

  static async log(storeId, userId, action, details = {}) {
    const result = await db.query(
      `INSERT INTO cms_activity_logs (store_id, user_id, action, details)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [storeId, userId || null, action, JSON.stringify(details)]
    );
    return result.rows[0];
  }
}

module.exports = CmsActivityLog;
