const db = require('../config/database');

class CmsSettings {
  static async findByStoreId(storeId) {
    const result = await db.query(
      `SELECT * FROM cms_settings WHERE store_id = $1`,
      [storeId]
    );
    if (result.rows.length === 0) {
      // Auto-initialize default settings row if missing
      return await this.createDefault(storeId);
    }
    return result.rows[0];
  }

  static async createDefault(storeId) {
    const result = await db.query(
      `INSERT INTO cms_settings (store_id)
       VALUES ($1)
       ON CONFLICT (store_id) DO UPDATE SET updated_at = NOW()
       RETURNING *`,
      [storeId]
    );
    return result.rows[0];
  }

  static async updateDraft(storeId, updates) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    const allowedKeys = [
      'logo_url', 'favicon_url', 'primary_color', 'accent_color',
      'font_family', 'button_style', 'border_radius', 'theme_mode',
      'layout_type', 'homepage_draft', 'seo_title', 'seo_description', 'social_image_url', 'theme_id'
    ];

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && allowedKeys.includes(key)) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(typeof value === 'object' && value !== null ? JSON.stringify(value) : value);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      return await this.findByStoreId(storeId);
    }

    values.push(storeId);

    const result = await db.query(
      `UPDATE cms_settings 
       SET ${fields.join(', ')}, updated_at = NOW()
       WHERE store_id = $${paramIndex}
       RETURNING *`,
      values
    );

    return result.rows[0] || null;
  }

  static async publish(storeId) {
    const current = await this.findByStoreId(storeId);
    const draftContent = current.homepage_draft || {};

    const result = await db.query(
      `UPDATE cms_settings 
       SET homepage_published = $1,
           published_at = NOW(),
           version = version + 1,
           updated_at = NOW()
       WHERE store_id = $2
       RETURNING *`,
      [JSON.stringify(draftContent), storeId]
    );

    return result.rows[0];
  }

  static async rollback(storeId) {
    const current = await this.findByStoreId(storeId);
    if (!current.homepage_published) {
      const err = new Error('No published version available for rollback');
      err.status = 400;
      throw err;
    }

    const publishedContent = current.homepage_published;

    const result = await db.query(
      `UPDATE cms_settings 
       SET homepage_draft = $1,
           updated_at = NOW()
       WHERE store_id = $2
       RETURNING *`,
      [JSON.stringify(publishedContent), storeId]
    );

    return result.rows[0];
  }
}

module.exports = CmsSettings;
