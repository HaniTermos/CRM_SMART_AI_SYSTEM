const db = require('../config/database');

class CmsNavigation {
  static async findByStoreId(storeId, location = null) {
    let query = `SELECT * FROM cms_navigation_items WHERE store_id = $1`;
    const params = [storeId];
    if (location) {
      params.push(location);
      query += ` AND location = $2`;
    }
    query += ` ORDER BY location ASC, position ASC, created_at ASC`;
    const result = await db.query(query, params);
    return result.rows;
  }

  static async findById(id, storeId) {
    const result = await db.query(
      `SELECT * FROM cms_navigation_items WHERE id = $1 AND store_id = $2`,
      [id, storeId]
    );
    return result.rows[0] || null;
  }

  static async create(data) {
    const {
      store_id,
      location = 'header',
      label,
      url,
      page_id = null,
      position = 0,
      is_external = false,
      is_highlighted = false
    } = data;

    if (!store_id || !label || !url) {
      const err = new Error('store_id, label, and url are required');
      err.status = 400;
      throw err;
    }

    const result = await db.query(
      `INSERT INTO cms_navigation_items (
         store_id, location, label, url, page_id, position, is_external, is_highlighted
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [store_id, location, label, url, page_id, position, is_external, is_highlighted]
    );

    return result.rows[0];
  }

  static async update(id, storeId, updates) {
    const item = await this.findById(id, storeId);
    if (!item) {
      const err = new Error('Navigation item not found');
      err.status = 404;
      throw err;
    }

    const fields = [];
    const values = [];
    let paramIndex = 1;

    const allowed = ['location', 'label', 'url', 'page_id', 'position', 'is_external', 'is_highlighted'];

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && allowed.includes(key)) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (fields.length === 0) return item;

    values.push(id);
    values.push(storeId);

    const result = await db.query(
      `UPDATE cms_navigation_items SET ${fields.join(', ')}, updated_at = NOW()
       WHERE id = $${paramIndex} AND store_id = $${paramIndex + 1}
       RETURNING *`,
      values
    );

    return result.rows[0] || null;
  }

  static async delete(id, storeId) {
    const result = await db.query(
      `DELETE FROM cms_navigation_items WHERE id = $1 AND store_id = $2 RETURNING *`,
      [id, storeId]
    );
    return result.rows[0] || null;
  }

  static async updateBatch(storeId, items) {
    if (!Array.isArray(items)) return [];

    return await db.transaction(async (tx) => {
      const results = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.id) {
          const res = await tx.query(
            `UPDATE cms_navigation_items 
             SET label = $1, url = $2, location = $3, position = $4, is_external = $5, is_highlighted = $6, updated_at = NOW()
             WHERE id = $7 AND store_id = $8
             RETURNING *`,
            [item.label, item.url, item.location || 'header', i, !!item.is_external, !!item.is_highlighted, item.id, storeId]
          );
          if (res.rows[0]) results.push(res.rows[0]);
        }
      }
      return results;
    });
  }
}

module.exports = CmsNavigation;
