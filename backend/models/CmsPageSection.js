const db = require('../config/database');

const VALID_SECTION_TYPES = [
  'hero',
  'featured_menu',
  'about',
  'gallery',
  'testimonials',
  'faq',
  'contact_form',
  'map',
  'opening_hours',
  'rich_text',
  'cta',
  'social_links',
  'divider'
];

class CmsPageSection {
  static get VALID_SECTION_TYPES() { return VALID_SECTION_TYPES; }

  static async findByPageId(pageId, storeId = null) {
    let query = `SELECT * FROM cms_page_sections WHERE page_id = $1`;
    const params = [pageId];
    if (storeId) {
      params.push(storeId);
      query += ` AND store_id = $2`;
    }
    query += ` ORDER BY position ASC, created_at ASC`;
    const result = await db.query(query, params);
    return result.rows;
  }

  static async findById(id, storeId = null) {
    let query = `SELECT * FROM cms_page_sections WHERE id = $1`;
    const params = [id];
    if (storeId) {
      params.push(storeId);
      query += ` AND store_id = $2`;
    }
    const result = await db.query(query, params);
    return result.rows[0] || null;
  }

  static async create(data) {
    const {
      store_id,
      page_id,
      type,
      position = 0,
      is_visible = true,
      visibility = 'all',
      content = {},
      layout = {},
      appearance = {},
      background = {},
      responsive = {}
    } = data;

    if (!store_id || !page_id || !type) {
      const err = new Error('store_id, page_id, and type are required for a section');
      err.status = 400;
      throw err;
    }

    if (!VALID_SECTION_TYPES.includes(type)) {
      const err = new Error(`Invalid section type: ${type}`);
      err.status = 400;
      throw err;
    }

    // Auto-compute position if default
    let finalPosition = position;
    if (position === 0) {
      const countRes = await db.query(
        `SELECT COALESCE(MAX(position) + 1, 0) as next_pos FROM cms_page_sections WHERE page_id = $1`,
        [page_id]
      );
      finalPosition = parseInt(countRes.rows[0].next_pos || 0);
    }

    const result = await db.query(
      `INSERT INTO cms_page_sections (
         store_id, page_id, type, position, is_visible, visibility,
         content, layout, appearance, background, responsive
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        store_id,
        page_id,
        type,
        finalPosition,
        is_visible,
        visibility,
        JSON.stringify(content),
        JSON.stringify(layout),
        JSON.stringify(appearance),
        JSON.stringify(background),
        JSON.stringify(responsive)
      ]
    );

    return result.rows[0];
  }

  static async update(id, storeId, updates) {
    const section = await this.findById(id, storeId);
    if (!section) {
      const err = new Error('Section not found');
      err.status = 404;
      throw err;
    }

    const fields = [];
    const values = [];
    let paramIndex = 1;

    const allowed = ['position', 'is_visible', 'visibility', 'content', 'layout', 'appearance', 'background', 'responsive'];

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && allowed.includes(key)) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(typeof value === 'object' && value !== null ? JSON.stringify(value) : value);
        paramIndex++;
      }
    });

    if (fields.length === 0) return section;

    values.push(id);
    values.push(storeId);

    const result = await db.query(
      `UPDATE cms_page_sections SET ${fields.join(', ')}, updated_at = NOW()
       WHERE id = $${paramIndex} AND store_id = $${paramIndex + 1}
       RETURNING *`,
      values
    );

    return result.rows[0] || null;
  }

  static async reorder(pageId, storeId, sectionIds) {
    if (!Array.isArray(sectionIds)) return [];

    return await db.transaction(async (tx) => {
      const updated = [];
      for (let i = 0; i < sectionIds.length; i++) {
        const res = await tx.query(
          `UPDATE cms_page_sections SET position = $1, updated_at = NOW()
           WHERE id = $2 AND page_id = $3 AND store_id = $4
           RETURNING *`,
          [i, sectionIds[i], pageId, storeId]
        );
        if (res.rows[0]) updated.push(res.rows[0]);
      }
      return updated;
    });
  }

  static async duplicate(id, storeId) {
    const existing = await this.findById(id, storeId);
    if (!existing) {
      const err = new Error('Section not found');
      err.status = 404;
      throw err;
    }

    const duplicatedData = {
      store_id: existing.store_id,
      page_id: existing.page_id,
      type: existing.type,
      position: existing.position + 1,
      is_visible: existing.is_visible,
      visibility: existing.visibility,
      content: existing.content,
      layout: existing.layout,
      appearance: existing.appearance,
      background: existing.background,
      responsive: existing.responsive
    };

    return await this.create(duplicatedData);
  }

  static async delete(id, storeId) {
    const result = await db.query(
      `DELETE FROM cms_page_sections WHERE id = $1 AND store_id = $2 RETURNING *`,
      [id, storeId]
    );
    return result.rows[0] || null;
  }

  static async deleteByPageId(pageId, storeId) {
    const result = await db.query(
      `DELETE FROM cms_page_sections WHERE page_id = $1 AND store_id = $2 RETURNING *`,
      [pageId, storeId]
    );
    return result.rows;
  }
}

module.exports = CmsPageSection;
