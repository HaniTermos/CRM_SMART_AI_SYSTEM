const db = require('../config/database');

const SYSTEM_SLUGS = [
  'home',
  'menu',
  'about',
  'contact',
  'faq',
  'privacy',
  'terms',
  'delivery-policy',
  'reservation-policy'
];

class CmsPageV2 {
  static get SYSTEM_SLUGS() { return SYSTEM_SLUGS; }

  static async findByStoreId(storeId) {
    const result = await db.query(
      `SELECT p.*, 
              (SELECT COUNT(*) FROM cms_page_sections s WHERE s.page_id = p.id AND s.is_visible = true) as visible_sections_count,
              (SELECT COUNT(*) FROM cms_page_sections s WHERE s.page_id = p.id) as total_sections_count,
              (SELECT MAX(version) FROM cms_page_versions v WHERE v.page_id = p.id) as max_version
       FROM cms_pages p 
       WHERE p.store_id = $1 
       ORDER BY p.is_system_page DESC, p.title ASC`,
      [storeId]
    );
    return result.rows;
  }

  static async findById(id, storeId = null) {
    let query = `SELECT * FROM cms_pages WHERE id = $1`;
    const params = [id];
    if (storeId) {
      params.push(storeId);
      query += ` AND store_id = $2`;
    }
    const result = await db.query(query, params);
    return result.rows[0] || null;
  }

  static async findBySlug(storeId, slug) {
    const result = await db.query(
      `SELECT * FROM cms_pages WHERE store_id = $1 AND slug = $2`,
      [storeId, slug]
    );
    return result.rows[0] || null;
  }

  static async create(data) {
    const {
      store_id,
      title,
      slug,
      type = 'custom',
      is_system_page = false,
      show_in_navigation = true,
      navigation_label = null,
      seo_title = null,
      seo_description = null,
      social_image_url = null,
      status = 'draft'
    } = data;

    if (!store_id || !title || !slug) {
      const err = new Error('store_id, title, and slug are required');
      err.status = 400;
      throw err;
    }

    const sanitizedSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');

    // Check slug uniqueness per store
    const existing = await this.findBySlug(store_id, sanitizedSlug);
    if (existing) {
      const err = new Error(`Page with slug "${sanitizedSlug}" already exists`);
      err.status = 400;
      throw err;
    }

    const result = await db.query(
      `INSERT INTO cms_pages (
         store_id, title, slug, type, is_system_page, show_in_navigation,
         navigation_label, seo_title, seo_description, social_image_url, status
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        store_id,
        title,
        sanitizedSlug,
        type,
        is_system_page,
        show_in_navigation,
        navigation_label || title,
        seo_title || title,
        seo_description,
        social_image_url,
        status
      ]
    );

    return result.rows[0];
  }

  static async update(id, storeId, updates) {
    const page = await this.findById(id, storeId);
    if (!page) {
      const err = new Error('Page not found');
      err.status = 404;
      throw err;
    }

    // Slug handling
    if (updates.slug && updates.slug !== page.slug) {
      if (page.is_system_page) {
        const err = new Error('Cannot change slug of system page');
        err.status = 400;
        throw err;
      }
      const sanitizedSlug = updates.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
      const existing = await this.findBySlug(storeId, sanitizedSlug);
      if (existing && existing.id !== id) {
        const err = new Error(`Page with slug "${sanitizedSlug}" already exists`);
        err.status = 400;
        throw err;
      }
      updates.slug = sanitizedSlug;
    }

    const fields = [];
    const values = [];
    let paramIndex = 1;

    const allowed = [
      'title', 'slug', 'show_in_navigation', 'navigation_label',
      'seo_title', 'seo_description', 'social_image_url', 'status', 'scheduled_publish_at'
    ];

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && allowed.includes(key)) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (fields.length === 0) return page;

    values.push(id);
    values.push(storeId);

    const result = await db.query(
      `UPDATE cms_pages SET ${fields.join(', ')}, updated_at = NOW()
       WHERE id = $${paramIndex} AND store_id = $${paramIndex + 1}
       RETURNING *`,
      values
    );

    return result.rows[0] || null;
  }

  static async delete(id, storeId) {
    const page = await this.findById(id, storeId);
    if (!page) {
      const err = new Error('Page not found');
      err.status = 404;
      throw err;
    }

    if (page.is_system_page) {
      const err = new Error('System pages cannot be deleted');
      err.status = 400;
      throw err;
    }

    const result = await db.query(
      `DELETE FROM cms_pages WHERE id = $1 AND store_id = $2 RETURNING *`,
      [id, storeId]
    );
    return result.rows[0] || null;
  }
}

module.exports = CmsPageV2;
