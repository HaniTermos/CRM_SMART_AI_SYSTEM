const db = require('../config/database');

class CmsMedia {
  static async findByStoreId(storeId) {
    const result = await db.query(
      `SELECT * FROM cms_media WHERE store_id = $1 ORDER BY created_at DESC`,
      [storeId]
    );
    return result.rows;
  }

  static async findById(id, storeId) {
    let query = `SELECT * FROM cms_media WHERE id = $1`;
    const params = [id];
    if (storeId) {
      params.push(storeId);
      query += ` AND store_id = $2`;
    }
    const result = await db.query(query, params);
    return result.rows[0] || null;
  }

  static async create(data) {
    const { store_id, filename, url, mime_type, file_size, alt_text = '', created_by = null } = data;
    const result = await db.query(
      `INSERT INTO cms_media (store_id, filename, url, mime_type, file_size, alt_text, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [store_id, filename, url, mime_type || 'image/jpeg', file_size || 0, alt_text, created_by]
    );
    return result.rows[0];
  }

  static async update(id, storeId, updates) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (updates.alt_text !== undefined) {
      fields.push(`alt_text = $${paramIndex}`);
      values.push(updates.alt_text);
      paramIndex++;
    }

    if (updates.filename !== undefined) {
      fields.push(`filename = $${paramIndex}`);
      values.push(updates.filename);
      paramIndex++;
    }

    if (fields.length === 0) return await this.findById(id, storeId);

    values.push(id);
    values.push(storeId);

    const result = await db.query(
      `UPDATE cms_media SET ${fields.join(', ')}, updated_at = NOW()
       WHERE id = $${paramIndex} AND store_id = $${paramIndex + 1}
       RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  static async delete(id, storeId) {
    const result = await db.query(
      `DELETE FROM cms_media WHERE id = $1 AND store_id = $2 RETURNING *`,
      [id, storeId]
    );
    return result.rows[0] || null;
  }
}

module.exports = CmsMedia;
