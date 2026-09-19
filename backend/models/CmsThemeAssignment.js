const db = require('../config/database');

class CmsThemeAssignment {
  static async getAssignment(store_id) {
    const res = await db.query(
      `SELECT a.*,
              pub.version AS published_version_num, pub.settings_snapshot AS published_settings, pub.published_at,
              pub_theme.name AS published_theme_name, pub_theme.slug AS published_theme_slug,
              draft.version AS draft_version_num, draft.settings_snapshot AS draft_settings,
              draft_theme.name AS draft_theme_name, draft_theme.slug AS draft_theme_slug
       FROM cms_store_theme_assignments a
       LEFT JOIN cms_theme_versions pub ON a.published_theme_version_id = pub.id
       LEFT JOIN cms_themes pub_theme ON pub.theme_id = pub_theme.id
       LEFT JOIN cms_theme_versions draft ON a.draft_theme_version_id = draft.id
       LEFT JOIN cms_themes draft_theme ON draft.theme_id = draft_theme.id
       WHERE a.store_id = $1`,
      [store_id]
    );
    return res.rows[0] || null;
  }

  static async createVersion({ store_id, theme_id, settings_snapshot = {}, page_mappings = {}, section_mappings = {}, created_by = null }) {
    // Get next version number
    const verRes = await db.query(
      `SELECT COALESCE(MAX(version), 0) + 1 AS next_ver FROM cms_theme_versions WHERE store_id = $1`,
      [store_id]
    );
    const version = verRes.rows[0].next_ver;

    const res = await db.query(
      `INSERT INTO cms_theme_versions (store_id, theme_id, version, status, settings_snapshot, page_mappings, section_mappings, created_by)
       VALUES ($1, $2, $3, 'draft', $4, $5, $6, $7)
       RETURNING *`,
      [store_id, theme_id, version, settings_snapshot, page_mappings, section_mappings, created_by]
    );
    const newVersion = res.rows[0];

    // Assign as draft
    await db.query(
      `INSERT INTO cms_store_theme_assignments (store_id, draft_theme_version_id, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (store_id) DO UPDATE SET draft_theme_version_id = EXCLUDED.draft_theme_version_id, updated_at = NOW()`,
      [store_id, newVersion.id]
    );

    return newVersion;
  }

  static async publishVersion(store_id, version_id) {
    await db.query('BEGIN');
    try {
      // 1. Unpublish any existing published theme version for this store
      await db.query(
        `UPDATE cms_theme_versions SET status = 'archived' WHERE store_id = $1 AND status = 'published'`,
        [store_id]
      );

      // 2. Set target version to published
      const pubRes = await db.query(
        `UPDATE cms_theme_versions SET status = 'published', published_at = NOW() WHERE id = $1 AND store_id = $2 RETURNING *`,
        [version_id, store_id]
      );

      if (pubRes.rows.length === 0) throw new Error('Theme version not found or belongs to another store');

      // 3. Update assignment
      await db.query(
        `INSERT INTO cms_store_theme_assignments (store_id, published_theme_version_id, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (store_id) DO UPDATE SET published_theme_version_id = EXCLUDED.published_theme_version_id, updated_at = NOW()`,
        [store_id, version_id]
      );

      await db.query('COMMIT');
      return pubRes.rows[0];
    } catch (err) {
      await db.query('ROLLBACK');
      throw err;
    }
  }

  static async getVersionHistory(store_id) {
    const res = await db.query(
      `SELECT v.*, t.name AS theme_name, t.slug AS theme_slug 
       FROM cms_theme_versions v
       LEFT JOIN cms_themes t ON v.theme_id = t.id
       WHERE v.store_id = $1
       ORDER BY v.version DESC`,
      [store_id]
    );
    return res.rows;
  }
}

module.exports = CmsThemeAssignment;
