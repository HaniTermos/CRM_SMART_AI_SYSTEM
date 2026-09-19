const db = require('../config/database');
const CmsPageSection = require('./CmsPageSection');

class CmsPageVersion {
  static async findByPageId(pageId, storeId) {
    const result = await db.query(
      `SELECT * FROM cms_page_versions WHERE page_id = $1 AND store_id = $2 ORDER BY version DESC`,
      [pageId, storeId]
    );
    return result.rows;
  }

  static async findById(id, storeId) {
    const result = await db.query(
      `SELECT * FROM cms_page_versions WHERE id = $1 AND store_id = $2`,
      [id, storeId]
    );
    return result.rows[0] || null;
  }

  static async createVersion(pageId, storeId, userId = null) {
    // Transactional version creation
    return await db.transaction(async (tx) => {
      // 1. Get current page metadata
      const pageRes = await tx.query(`SELECT * FROM cms_pages WHERE id = $1 AND store_id = $2`, [pageId, storeId]);
      if (pageRes.rows.length === 0) throw new Error('Page not found');
      const page = pageRes.rows[0];

      // 2. Get current sections
      const sectionsRes = await tx.query(
        `SELECT * FROM cms_page_sections WHERE page_id = $1 AND store_id = $2 ORDER BY position ASC`,
        [pageId, storeId]
      );
      const sections = sectionsRes.rows;

      // 3. Compute version number
      const verRes = await tx.query(
        `SELECT COALESCE(MAX(version) + 1, 1) as next_ver FROM cms_page_versions WHERE page_id = $1`,
        [pageId]
      );
      const nextVer = parseInt(verRes.rows[0].next_ver || 1);

      // 4. Create version record
      const versionRes = await tx.query(
        `INSERT INTO cms_page_versions (store_id, page_id, version, sections_snapshot, page_metadata_snapshot, created_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          storeId,
          pageId,
          nextVer,
          JSON.stringify(sections),
          JSON.stringify({
            title: page.title,
            slug: page.slug,
            seo_title: page.seo_title,
            seo_description: page.seo_description,
            social_image_url: page.social_image_url
          }),
          userId
        ]
      );
      const newVersion = versionRes.rows[0];

      // 5. Update page published_version_id and status
      await tx.query(
        `UPDATE cms_pages 
         SET status = 'published',
             published_at = NOW(),
             published_version_id = $1,
             updated_at = NOW()
         WHERE id = $2 AND store_id = $3`,
        [newVersion.id, pageId, storeId]
      );

      return newVersion;
    });
  }

  static async restoreVersion(pageId, versionId, storeId) {
    return await db.transaction(async (tx) => {
      const verRes = await tx.query(
        `SELECT * FROM cms_page_versions WHERE id = $1 AND page_id = $2 AND store_id = $3`,
        [versionId, pageId, storeId]
      );
      if (verRes.rows.length === 0) throw new Error('Version snapshot not found');
      const versionRecord = verRes.rows[0];

      const sections = versionRecord.sections_snapshot || [];

      // Wipe current page sections and replace with snapshot
      await tx.query(`DELETE FROM cms_page_sections WHERE page_id = $1 AND store_id = $2`, [pageId, storeId]);

      for (let i = 0; i < sections.length; i++) {
        const s = sections[i];
        await tx.query(
          `INSERT INTO cms_page_sections (
             store_id, page_id, type, position, is_visible, visibility,
             content, layout, appearance, background, responsive
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            storeId,
            pageId,
            s.type,
            i,
            s.is_visible !== undefined ? s.is_visible : true,
            s.visibility || 'all',
            JSON.stringify(s.content || {}),
            JSON.stringify(s.layout || {}),
            JSON.stringify(s.appearance || {}),
            JSON.stringify(s.background || {}),
            JSON.stringify(s.responsive || {})
          ]
        );
      }

      // Update page metadata snapshot
      const meta = versionRecord.page_metadata_snapshot || {};
      await tx.query(
        `UPDATE cms_pages 
         SET title = COALESCE($1, title),
             seo_title = $2,
             seo_description = $3,
             social_image_url = $4,
             draft_version_id = $5,
             updated_at = NOW()
         WHERE id = $6 AND store_id = $7`,
        [meta.title, meta.seo_title, meta.seo_description, meta.social_image_url, versionRecord.id, pageId, storeId]
      );

      return versionRecord;
    });
  }
}

module.exports = CmsPageVersion;
