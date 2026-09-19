/**
 * SmartStore Website Studio (CMS V3) — Navigation Version Model
 * Manages draft saving, version publishing, and rollback snapshots in cms_v3_navigation_versions
 */

const db = require('../config/database');

class CmsV3NavigationVersion {
  static async createDraft({ storeId, region, document, createdBy, changeSummary }) {
    const nextVerRes = await db.query(
      `SELECT COALESCE(MAX(version_number), 0) + 1 as next_ver
       FROM cms_v3_navigation_versions
       WHERE store_id = $1 AND region = $2`,
      [storeId, region]
    );
    const nextVer = parseInt(nextVerRes.rows[0].next_ver, 10);

    const result = await db.query(
      `INSERT INTO cms_v3_navigation_versions (store_id, region, version_number, status, document, created_by)
       VALUES ($1, $2, $3, 'draft', $4, $5)
       RETURNING *`,
      [storeId, region, nextVer, JSON.stringify(document || {}), createdBy || null]
    );

    return result.rows[0];
  }

  static async updateDraft(id, storeId, document) {
    const result = await db.query(
      `UPDATE cms_v3_navigation_versions
       SET document = $1
       WHERE id = $2 AND store_id = $3 AND status = 'draft'
       RETURNING *`,
      [JSON.stringify(document), id, storeId]
    );
    return result.rows[0] || null;
  }

  static async findById(id, storeId) {
    const result = await db.query(
      `SELECT * FROM cms_v3_navigation_versions WHERE id = $1 AND store_id = $2`,
      [id, storeId]
    );
    return result.rows[0] || null;
  }

  static async findLatestDraft(storeId, region) {
    const result = await db.query(
      `SELECT * FROM cms_v3_navigation_versions
       WHERE store_id = $1 AND region = $2 AND status = 'draft'
       ORDER BY version_number DESC LIMIT 1`,
      [storeId, region]
    );
    return result.rows[0] || null;
  }

  static async findPublished(storeId, region) {
    const result = await db.query(
      `SELECT * FROM cms_v3_navigation_versions
       WHERE store_id = $1 AND region = $2 AND status = 'published'
       ORDER BY version_number DESC LIMIT 1`,
      [storeId, region]
    );
    return result.rows[0] || null;
  }

  static async publishVersion(id, storeId) {
    const versionRes = await db.query(
      `SELECT * FROM cms_v3_navigation_versions WHERE id = $1 AND store_id = $2`,
      [id, storeId]
    );
    const targetVersion = versionRes.rows[0];
    if (!targetVersion) return null;

    // Archive previous published versions for this region
    await db.query(
      `UPDATE cms_v3_navigation_versions
       SET status = 'archived'
       WHERE store_id = $1 AND region = $2 AND status = 'published' AND id != $3`,
      [storeId, targetVersion.region, id]
    );

    // Update target version to published
    const publishedRes = await db.query(
      `UPDATE cms_v3_navigation_versions
       SET status = 'published'
       WHERE id = $1 AND store_id = $2
       RETURNING *`,
      [id, storeId]
    );

    // Also update current active navigation region in cms_v3_navigation table
    await db.query(
      `INSERT INTO cms_v3_navigation (store_id, region, items, appearance)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (store_id, region)
       DO UPDATE SET items = $3, appearance = $4, updated_at = NOW()`,
      [
        storeId,
        targetVersion.region,
        JSON.stringify(targetVersion.document.items || []),
        JSON.stringify(targetVersion.document.appearance || {})
      ]
    );

    return publishedRes.rows[0];
  }

  static async rollback(storeId, region, targetVersionId) {
    const targetRes = await db.query(
      `SELECT * FROM cms_v3_navigation_versions WHERE id = $1 AND store_id = $2`,
      [targetVersionId, storeId]
    );
    const targetVersion = targetRes.rows[0];
    if (!targetVersion) return null;

    // Create a new immutable published version snapshot copied from target
    const newDraft = await this.createDraft({
      storeId,
      region,
      document: targetVersion.document,
      changeSummary: `Rollback to version #${targetVersion.version_number}`
    });

    return await this.publishVersion(newDraft.id, storeId);
  }
}

module.exports = CmsV3NavigationVersion;
