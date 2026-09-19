const db = require('../config/database');

class Notification {
  static async create({ store_id, user_id, type, title, message, severity = 'info', link }) {
    const result = await db.query(
      `INSERT INTO notifications (store_id, user_id, type, title, message, severity, link)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [store_id || null, user_id || null, type, title, message, severity, link || null]
    );
    return result.rows[0];
  }

  static async findByUser(userId, { limit = 50, unreadOnly = false } = {}) {
    let query = 'SELECT * FROM notifications WHERE user_id = $1';
    const params = [userId];
    if (unreadOnly) {
      query += ' AND is_read = false';
    }
    query += ' ORDER BY created_at DESC LIMIT $2';
    params.push(limit);
    const result = await db.query(query, params);
    return result.rows;
  }

  static async findByStore(storeId, { limit = 50, unreadOnly = false } = {}) {
    let query = 'SELECT * FROM notifications WHERE store_id = $1';
    const params = [storeId];
    if (unreadOnly) {
      query += ' AND is_read = false';
    }
    query += ' ORDER BY created_at DESC LIMIT $2';
    params.push(limit);
    const result = await db.query(query, params);
    return result.rows;
  }

  static async getUnreadCount(userId) {
    const result = await db.query(
      'SELECT COUNT(*)::int AS count FROM notifications WHERE user_id = $1 AND is_read = false',
      [userId]
    );
    return result.rows[0].count;
  }

  static async markAsRead(id, userId) {
    const result = await db.query(
      'UPDATE notifications SET is_read = true WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );
    return result.rows[0] || null;
  }

  static async markAllAsRead(userId) {
    const result = await db.query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false RETURNING *',
      [userId]
    );
    return result.rows;
  }

  static async delete(id, userId) {
    const result = await db.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );
    return result.rows[0] || null;
  }
}

module.exports = Notification;
