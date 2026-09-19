const db = require('../config/database');

class UserDashboardLayout {
  static async getLayout(user_id, store_id, mode = 'today') {
    const res = await db.query(
      `SELECT * FROM user_dashboard_layouts WHERE user_id = $1 AND store_id = $2 AND mode = $3`,
      [user_id, store_id, mode]
    );
    return res.rows[0] || null;
  }

  static async saveLayout(user_id, store_id, mode, layout_config = []) {
    const res = await db.query(
      `INSERT INTO user_dashboard_layouts (user_id, store_id, mode, layout_config, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (user_id, store_id, mode) DO UPDATE SET
         layout_config = EXCLUDED.layout_config,
         updated_at = NOW()
       RETURNING *`,
      [user_id, store_id, mode, JSON.stringify(layout_config)]
    );
    return res.rows[0];
  }
}

module.exports = UserDashboardLayout;
