const db = require('../config/database');

class CmsTheme {
  static async findAll() {
    const res = await db.query(`SELECT * FROM cms_themes WHERE is_published = TRUE ORDER BY category, name`);
    return res.rows;
  }

  static async findBySlug(slug) {
    const res = await db.query(`SELECT * FROM cms_themes WHERE slug = $1`, [slug]);
    return res.rows[0] || null;
  }

  static async findById(id) {
    const res = await db.query(`SELECT * FROM cms_themes WHERE id = $1`, [id]);
    return res.rows[0] || null;
  }

  static async findByCategory(category) {
    const res = await db.query(`SELECT * FROM cms_themes WHERE category = $1 AND is_published = TRUE ORDER BY name`, [category]);
    return res.rows;
  }
}

module.exports = CmsTheme;
