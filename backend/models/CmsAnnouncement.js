const db = require('../config/database');

class CmsAnnouncement {
  static async findByStoreId(storeId) {
    const result = await db.query(
      `SELECT * FROM cms_announcements WHERE store_id = $1 ORDER BY created_at DESC`,
      [storeId]
    );
    return result.rows;
  }

  static async findActivePublishedByStoreId(storeId) {
    const result = await db.query(
      `SELECT * FROM cms_announcements 
       WHERE store_id = $1 
         AND status = 'published' 
         AND is_enabled = true
         AND (start_date IS NULL OR start_date <= NOW())
         AND (end_date IS NULL OR end_date >= NOW())
       ORDER BY created_at DESC LIMIT 1`,
      [storeId]
    );
    return result.rows[0] || null;
  }

  static async findById(id, storeId) {
    let query = `SELECT * FROM cms_announcements WHERE id = $1`;
    const params = [id];
    if (storeId) {
      params.push(storeId);
      query += ` AND store_id = $2`;
    }
    const result = await db.query(query, params);
    return result.rows[0] || null;
  }

  static async create(data) {
    const { store_id, title, message, cta_text = null, cta_link = null, start_date = null, end_date = null, is_enabled = true, status = 'draft' } = data;
    const result = await db.query(
      `INSERT INTO cms_announcements (store_id, title, message, cta_text, cta_link, start_date, end_date, is_enabled, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [store_id, title, message, cta_text, cta_link, start_date, end_date, is_enabled, status]
    );
    return result.rows[0];
  }

  static async update(id, storeId, updates) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    const allowed = ['title', 'message', 'cta_text', 'cta_link', 'start_date', 'end_date', 'is_enabled', 'status'];

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && allowed.includes(key)) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (fields.length === 0) return await this.findById(id, storeId);

    values.push(id);
    values.push(storeId);

    const result = await db.query(
      `UPDATE cms_announcements SET ${fields.join(', ')}, updated_at = NOW()
       WHERE id = $${paramIndex} AND store_id = $${paramIndex + 1}
       RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  static async publish(id, storeId) {
    return await this.update(id, storeId, { status: 'published' });
  }

  static async delete(id, storeId) {
    const result = await db.query(
      `DELETE FROM cms_announcements WHERE id = $1 AND store_id = $2 RETURNING *`,
      [id, storeId]
    );
    return result.rows[0] || null;
  }
}

module.exports = CmsAnnouncement;
