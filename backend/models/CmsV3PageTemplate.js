const db = require('../config/database');

class CmsV3PageTemplate {
  static async getTemplates(category = null) {
    let query = `
      SELECT id, store_id, theme_slug, name, slug, category, description, thumbnail_url, is_system, created_at
      FROM cms_v3_page_templates
      WHERE store_id IS NULL
    `;
    const params = [];

    if (category && category !== 'all') {
      query += ` AND category = $1`;
      params.push(category);
    }

    query += ` ORDER BY name ASC`;
    const result = await db.query(query, params);
    return result.rows;
  }

  static async findById(id) {
    const result = await db.query(
      `SELECT * FROM cms_v3_page_templates WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  static async findBySlug(slug) {
    const result = await db.query(
      `SELECT * FROM cms_v3_page_templates WHERE slug = $1`,
      [slug]
    );
    return result.rows[0] || null;
  }
}

module.exports = CmsV3PageTemplate;
