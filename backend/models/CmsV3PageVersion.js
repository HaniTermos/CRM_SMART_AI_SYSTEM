const db = require('../config/database');

class CmsV3PageVersion {
  static async findById(id, storeId) {
    const result = await db.query(
      `SELECT * FROM cms_v3_page_versions WHERE id = $1 AND store_id = $2`,
      [id, storeId]
    );
    return result.rows[0] || null;
  }

  static async findByPageId(pageId, storeId) {
    const result = await db.query(
      `SELECT id, page_id, store_id, version_number, status, change_summary, created_by, created_at
       FROM cms_v3_page_versions
       WHERE page_id = $1 AND store_id = $2
       ORDER BY version_number DESC`,
      [pageId, storeId]
    );
    return result.rows;
  }

  static async getNextVersionNumber(pageId, storeId) {
    const result = await db.query(
      `SELECT COALESCE(MAX(version_number), 0) + 1 as next_ver
       FROM cms_v3_page_versions
       WHERE page_id = $1 AND store_id = $2`,
      [pageId, storeId]
    );
    return parseInt(result.rows[0].next_ver, 10);
  }

  static async createDraft(data) {
    const { page_id, store_id, component_tree, theme_override = {}, change_summary = 'Draft save', created_by = null } = data;
    const versionNumber = await this.getNextVersionNumber(page_id, store_id);

    const result = await db.query(
      `INSERT INTO cms_v3_page_versions (page_id, store_id, version_number, status, component_tree, theme_override, change_summary, created_by)
       VALUES ($1, $2, $3, 'draft', $4, $5, $6, $7)
       RETURNING *`,
      [page_id, store_id, versionNumber, JSON.stringify(component_tree), JSON.stringify(theme_override), change_summary, created_by]
    );
    return result.rows[0];
  }

  static async updateDraft(id, storeId, { component_tree, theme_override, change_summary }) {
    const fields = [];
    const values = [];
    let idx = 1;

    if (component_tree) {
      fields.push(`component_tree = $${idx++}`);
      values.push(JSON.stringify(component_tree));
    }
    if (theme_override) {
      fields.push(`theme_override = $${idx++}`);
      values.push(JSON.stringify(theme_override));
    }
    if (change_summary) {
      fields.push(`change_summary = $${idx++}`);
      values.push(change_summary);
    }

    values.push(id, storeId);

    const result = await db.query(
      `UPDATE cms_v3_page_versions
       SET ${fields.join(', ')}
       WHERE id = $${idx++} AND store_id = $${idx} AND status = 'draft'
       RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  static async publishVersion(versionId, storeId) {
    const version = await this.findById(versionId, storeId);
    if (!version) {
      const err = new Error('Version not found');
      err.status = 404;
      throw err;
    }

    // Set this version status to published
    const updated = await db.query(
      `UPDATE cms_v3_page_versions
       SET status = 'published'
       WHERE id = $1 AND store_id = $2
       RETURNING *`,
      [versionId, storeId]
    );

    // Archive previous published versions for this page
    await db.query(
      `UPDATE cms_v3_page_versions
       SET status = 'archived'
       WHERE page_id = $1 AND store_id = $2 AND id != $3 AND status = 'published'`,
      [version.page_id, storeId, versionId]
    );

    return updated.rows[0];
  }
}

module.exports = CmsV3PageVersion;
