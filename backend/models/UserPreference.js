const db = require('../config/database');

class UserPreference {
  static async findByUserId(userId) {
    const result = await db.query(
      'SELECT * FROM user_preferences WHERE user_id = $1',
      [userId]
    );
    return result.rows[0] || null;
  }

  static async createDefaults(userId) {
    const result = await db.query(
      `INSERT INTO user_preferences (user_id)
       VALUES ($1)
       ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW()
       RETURNING *`,
      [userId]
    );
    return result.rows[0];
  }

  static async update(userId, updates) {
    const allowed = ['dashboard_theme', 'nav_mode', 'density', 'reduced_motion', 'default_date_range', 'default_dashboard_page'];
    const fields = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowed.includes(key) && value !== undefined) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (fields.length === 0) {
      return this.findByUserId(userId);
    }

    values.push(userId);
    const result = await db.query(
      `UPDATE user_preferences SET ${fields.join(', ')}, updated_at = NOW()
       WHERE user_id = $${paramIndex}
       RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }
}

module.exports = UserPreference;
