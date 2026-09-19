const db = require('../config/database');

class CmsContactMessage {
  static async findByStoreId(storeId, filters = {}) {
    let query = `SELECT * FROM cms_contact_messages WHERE store_id = $1`;
    const params = [storeId];

    if (filters.status) {
      params.push(filters.status);
      query += ` AND status = $${params.length}`;
    }

    query += ` ORDER BY created_at DESC`;
    const result = await db.query(query, params);
    return result.rows;
  }

  static async findById(id, storeId) {
    const result = await db.query(
      `SELECT * FROM cms_contact_messages WHERE id = $1 AND store_id = $2`,
      [id, storeId]
    );
    return result.rows[0] || null;
  }

  static async create(data) {
    const {
      store_id,
      name,
      email,
      phone = null,
      topic = 'general',
      message,
      preferred_response_method = 'email'
    } = data;

    if (!store_id || !name || !email || !message) {
      const err = new Error('Name, email, and message are mandatory');
      err.status = 400;
      throw err;
    }

    // Rate limit check: max 5 messages per email per store per hour
    const rateCheck = await db.query(
      `SELECT COUNT(*) as count FROM cms_contact_messages 
       WHERE store_id = $1 AND email = $2 AND created_at > (NOW() - INTERVAL '1 hour')`,
      [store_id, email]
    );
    if (parseInt(rateCheck.rows[0].count || 0) >= 5) {
      const err = new Error('Rate limit exceeded. Please try submitting again later.');
      err.status = 429;
      throw err;
    }

    const result = await db.query(
      `INSERT INTO cms_contact_messages (
         store_id, name, email, phone, topic, message, preferred_response_method, status
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'open')
       RETURNING *`,
      [store_id, name, email, phone, topic, message, preferred_response_method]
    );

    return result.rows[0];
  }

  static async updateStatus(id, storeId, status) {
    const validStatuses = ['open', 'in_progress', 'resolved', 'spam'];
    if (!validStatuses.includes(status)) {
      const err = new Error(`Invalid status: ${status}`);
      err.status = 400;
      throw err;
    }

    const result = await db.query(
      `UPDATE cms_contact_messages SET status = $1 WHERE id = $2 AND store_id = $3 RETURNING *`,
      [status, id, storeId]
    );

    return result.rows[0] || null;
  }

  static async delete(id, storeId) {
    const result = await db.query(
      `DELETE FROM cms_contact_messages WHERE id = $1 AND store_id = $2 RETURNING *`,
      [id, storeId]
    );
    return result.rows[0] || null;
  }

  static async getAnalytics(storeId, days = 30) {
    const statusCounts = await db.query(
      `SELECT status, COUNT(*) as count
       FROM cms_contact_messages
       WHERE store_id = $1
       GROUP BY status`,
      [storeId]
    );

    const dailyCounts = await db.query(
      `SELECT DATE(created_at) as date, COUNT(*) as count
       FROM cms_contact_messages
       WHERE store_id = $1 AND created_at >= NOW() - INTERVAL '${parseInt(days)} days'
       GROUP BY DATE(created_at)
       ORDER BY DATE(created_at) ASC`,
      [storeId]
    );

    const topicCounts = await db.query(
      `SELECT topic, COUNT(*) as count
       FROM cms_contact_messages
       WHERE store_id = $1
       GROUP BY topic
       ORDER BY count DESC
       LIMIT 10`,
      [storeId]
    );

    const totalResult = await db.query(
      `SELECT COUNT(*) as total FROM cms_contact_messages WHERE store_id = $1`,
      [storeId]
    );

    return {
      total: parseInt(totalResult.rows[0].total || 0),
      by_status: statusCounts.rows.reduce((acc, r) => ({ ...acc, [r.status]: parseInt(r.count) }), {}),
      by_day: dailyCounts.rows.map((r) => ({ date: r.date, count: parseInt(r.count) })),
      by_topic: topicCounts.rows.map((r) => ({ topic: r.topic, count: parseInt(r.count) })),
    };
  }
}

module.exports = CmsContactMessage;
