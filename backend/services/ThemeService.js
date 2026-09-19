const crypto = require('crypto');
const db = require('../config/database');
const CmsTheme = require('../models/CmsTheme');
const CmsSectionVariant = require('../models/CmsSectionVariant');
const CmsThemeAssignment = require('../models/CmsThemeAssignment');

class ThemeService {
  static async getGallery() {
    return await CmsTheme.findAll();
  }

  static async getSectionVariants() {
    return await CmsSectionVariant.findAll();
  }

  static async applyThemeAsDraft(store_id, theme_slug, user_id) {
    const theme = await CmsTheme.findBySlug(theme_slug);
    if (!theme) throw new Error(`Theme template '${theme_slug}' not found`);

    // Create a new draft theme version snapshot
    const version = await CmsThemeAssignment.createVersion({
      store_id,
      theme_id: theme.id,
      settings_snapshot: {
        theme_slug: theme.slug,
        theme_name: theme.name,
        colors: theme.colors,
        typography: theme.typography,
        global_styles: theme.global_styles
      },
      created_by: user_id
    });

    return version;
  }

  static async generatePreviewToken(store_id, page_id = null) {
    const token = crypto.randomBytes(24).toString('hex');
    const expires_at = new Date(Date.now() + 3600 * 1000); // 1 hour short-lived

    let targetPageId = null;
    if (page_id) {
      const checkPage = await db.query(`SELECT id FROM cms_pages WHERE id = $1 AND store_id = $2`, [page_id, store_id]);
      if (checkPage.rows.length > 0) {
        targetPageId = checkPage.rows[0].id;
      }
    }

    if (!targetPageId) {
      const pRes = await db.query(`SELECT id FROM cms_pages WHERE store_id = $1 LIMIT 1`, [store_id]);
      if (pRes.rows.length > 0) targetPageId = pRes.rows[0].id;
    }

    await db.query(
      `INSERT INTO cms_preview_tokens (token, store_id, page_id, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [token, store_id, targetPageId, expires_at]
    );

    return { token, expires_at, page_id: targetPageId };
  }

  static async validatePreviewToken(token, store_id) {
    const res = await db.query(
      `SELECT * FROM cms_preview_tokens WHERE token = $1 AND store_id = $2 AND expires_at > NOW()`,
      [token, store_id]
    );
    return res.rows.length > 0;
  }

  static async publishTheme(store_id, version_id) {
    return await CmsThemeAssignment.publishVersion(store_id, version_id);
  }

  static async rollbackTheme(store_id, target_version_id) {
    return await CmsThemeAssignment.publishVersion(store_id, target_version_id);
  }
}

module.exports = ThemeService;
