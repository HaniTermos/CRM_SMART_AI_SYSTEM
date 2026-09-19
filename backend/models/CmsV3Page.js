const db = require('../config/database');

class CmsV3Page {
  static async findByStoreId(storeId) {
    const result = await db.query(
      `SELECT p.*,
              (SELECT version_number FROM cms_v3_page_versions v WHERE v.id = p.published_version_id) as published_version,
              (SELECT version_number FROM cms_v3_page_versions v WHERE v.id = p.draft_version_id) as draft_version
       FROM cms_v3_pages p
       WHERE p.store_id = $1
       ORDER BY p.updated_at DESC`,
      [storeId]
    );
    return result.rows;
  }

  static async findById(id, storeId) {
    const result = await db.query(
      `SELECT * FROM cms_v3_pages WHERE id = $1 AND store_id = $2`,
      [id, storeId]
    );
    return result.rows[0] || null;
  }

  static async findBySlug(storeId, slug) {
    const result = await db.query(
      `SELECT * FROM cms_v3_pages WHERE store_id = $1 AND slug = $2`,
      [storeId, slug]
    );
    return result.rows[0] || null;
  }

  static async create(data) {
    const { store_id, title, slug, page_type = 'custom', seo_metadata = {} } = data;
    const result = await db.query(
      `INSERT INTO cms_v3_pages (store_id, title, slug, page_type, seo_metadata)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [store_id, title, slug, page_type, JSON.stringify(seo_metadata)]
    );
    return result.rows[0];
  }

  static async update(id, storeId, data) {
    const { title, slug, page_type, seo_metadata } = data;
    const fields = [];
    const values = [];
    let idx = 1;

    if (title !== undefined) {
      fields.push(`title = $${idx++}`);
      values.push(title);
    }
    if (slug !== undefined) {
      fields.push(`slug = $${idx++}`);
      values.push(slug);
    }
    if (page_type !== undefined) {
      fields.push(`page_type = $${idx++}`);
      values.push(page_type);
    }
    if (seo_metadata !== undefined) {
      fields.push(`seo_metadata = $${idx++}`);
      values.push(JSON.stringify(seo_metadata));
    }

    fields.push(`updated_at = NOW()`);
    values.push(id, storeId);

    const result = await db.query(
      `UPDATE cms_v3_pages
       SET ${fields.join(', ')}
       WHERE id = $${idx++} AND store_id = $${idx}
       RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  static async delete(id, storeId) {
    const page = await this.findById(id, storeId);
    if (!page) return null;
    if (page.page_type === 'home') {
      throw new Error('System Home page cannot be deleted.');
    }

    await db.query(`DELETE FROM cms_v3_pages WHERE id = $1 AND store_id = $2`, [id, storeId]);
    return true;
  }

  static async duplicate(id, storeId, newTitle, newSlug) {
    const page = await this.findById(id, storeId);
    if (!page) throw new Error('Source page not found');

    const createdPage = await this.create({
      store_id: storeId,
      title: newTitle || `${page.title} (Copy)`,
      slug: newSlug || `${page.slug}-copy-${Date.now().toString().slice(-4)}`,
      page_type: page.page_type === 'home' ? 'custom' : page.page_type,
      seo_metadata: page.seo_metadata || {}
    });

    // Copy draft version if available
    const CmsV3PageVersion = require('./CmsV3PageVersion');
    let sourceVersion = null;
    if (page.draft_version_id) {
      sourceVersion = await CmsV3PageVersion.findById(page.draft_version_id, storeId);
    } else if (page.published_version_id) {
      sourceVersion = await CmsV3PageVersion.findById(page.published_version_id, storeId);
    }

    if (sourceVersion) {
      const newDraft = await CmsV3PageVersion.createDraft({
        page_id: createdPage.id,
        store_id: storeId,
        component_tree: sourceVersion.component_tree,
        theme_override: sourceVersion.theme_override,
        change_summary: `Duplicated from ${page.title}`
      });

      await this.updateVersionPointers(createdPage.id, storeId, {
        draftVersionId: newDraft.id
      });
    }

    return this.findById(createdPage.id, storeId);
  }

  static async getVersions(pageId, storeId) {
    const result = await db.query(
      `SELECT v.id, v.page_id, v.version_number, v.status, v.change_summary, v.created_at,
              u.name as author_name, u.email as author_email
       FROM cms_v3_page_versions v
       LEFT JOIN users u ON u.id = v.created_by
       WHERE v.page_id = $1 AND v.store_id = $2
       ORDER BY v.version_number DESC`,
      [pageId, storeId]
    );
    return result.rows;
  }

  static async updateVersionPointers(id, storeId, { draftVersionId, publishedVersionId, isPublished }) {
    const fields = [];
    const values = [];
    let idx = 1;

    if (draftVersionId !== undefined) {
      fields.push(`draft_version_id = $${idx++}`);
      values.push(draftVersionId);
    }
    if (publishedVersionId !== undefined) {
      fields.push(`published_version_id = $${idx++}`);
      values.push(publishedVersionId);
    }
    if (isPublished !== undefined) {
      fields.push(`is_published = $${idx++}`);
      values.push(isPublished);
    }

    fields.push(`updated_at = NOW()`);
    values.push(id, storeId);

    const result = await db.query(
      `UPDATE cms_v3_pages
       SET ${fields.join(', ')}
       WHERE id = $${idx++} AND store_id = $${idx}
       RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  // Site Configuration & Feature Flag methods
  static async getSiteConfig(storeId) {
    const result = await db.query(
      `SELECT s.*, 
              t_act.name as active_theme_name, t_act.slug as active_theme_slug,
              t_dft.name as draft_theme_name, t_dft.slug as draft_theme_slug
       FROM cms_v3_sites s
       LEFT JOIN cms_v3_themes t_act ON t_act.id = s.active_theme_id
       LEFT JOIN cms_v3_themes t_dft ON t_dft.id = s.draft_theme_id
       WHERE s.store_id = $1`,
      [storeId]
    );
    if (result.rows.length === 0) {
      const created = await db.query(
        `INSERT INTO cms_v3_sites (store_id, cms_v3_enabled) VALUES ($1, FALSE) RETURNING *`,
        [storeId]
      );
      return created.rows[0];
    }
    return result.rows[0];
  }

  static async updateSiteConfig(storeId, updates) {
    const { cms_v3_enabled, active_theme_id, draft_theme_id, global_tokens, seo_settings } = updates;
    const result = await db.query(
      `INSERT INTO cms_v3_sites (store_id, cms_v3_enabled, active_theme_id, draft_theme_id, global_tokens, seo_settings)
       VALUES ($1, COALESCE($2, FALSE), $3, $4, COALESCE($5, '{}'::jsonb), COALESCE($6, '{}'::jsonb))
       ON CONFLICT (store_id) DO UPDATE
       SET cms_v3_enabled = COALESCE($2, cms_v3_sites.cms_v3_enabled),
           active_theme_id = COALESCE($3, cms_v3_sites.active_theme_id),
           draft_theme_id = COALESCE($4, cms_v3_sites.draft_theme_id),
           global_tokens = COALESCE($5, cms_v3_sites.global_tokens),
           seo_settings = COALESCE($6, cms_v3_sites.seo_settings),
           updated_at = NOW()
       RETURNING *`,
      [storeId, cms_v3_enabled, active_theme_id, draft_theme_id, JSON.stringify(global_tokens || {}), JSON.stringify(seo_settings || {})]
    );
    return result.rows[0];
  }
}

module.exports = CmsV3Page;
