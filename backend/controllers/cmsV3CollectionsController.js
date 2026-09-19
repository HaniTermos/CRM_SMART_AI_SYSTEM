/**
 * SmartStore Website Studio (CMS V3) — Dynamic CMS Collections Controller
 */

const db = require('../config/database');

class CmsV3CollectionsController {
  static async getCollections(req, res) {
    try {
      const storeId = req.store.id;
      const result = await db.query(
        `SELECT * FROM cms_v3_collections WHERE store_id = $1 ORDER BY name ASC`,
        [storeId]
      );
      res.json({ collections: result.rows });
    } catch (err) {
      console.error('[COLLECTIONS CONTROLLER ERROR]', err);
      res.status(500).json({ error: 'Failed to fetch collections.' });
    }
  }

  static async createCollection(req, res) {
    try {
      const storeId = req.store.id;
      const { name, slug, description, singularName, icon } = req.body;

      if (!name || !slug) {
        return res.status(400).json({ error: 'Collection name and slug are required.' });
      }

      const result = await db.query(
        `INSERT INTO cms_v3_collections (store_id, name, slug, description, singular_name, icon)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (store_id, slug) DO UPDATE SET name = $2, description = $4, updated_at = NOW()
         RETURNING *`,
        [storeId, name, slug.toLowerCase(), description || '', singularName || name, icon || 'Folder']
      );

      res.json({ collection: result.rows[0] });
    } catch (err) {
      console.error('[COLLECTIONS CREATE ERROR]', err);
      res.status(500).json({ error: 'Failed to create collection.' });
    }
  }

  static async getCollectionItems(req, res) {
    try {
      const storeId = req.store.id;
      const { collectionId } = req.params;

      const result = await db.query(
        `SELECT * FROM cms_v3_collection_items WHERE store_id = $1 AND collection_id = $2 ORDER BY created_at DESC`,
        [storeId, collectionId]
      );

      res.json({ items: result.rows });
    } catch (err) {
      console.error('[COLLECTION ITEMS ERROR]', err);
      res.status(500).json({ error: 'Failed to fetch collection items.' });
    }
  }

  static async createCollectionItem(req, res) {
    try {
      const storeId = req.store.id;
      const { collectionId } = req.params;
      const { title, slug, fieldData } = req.body;

      if (!title || !slug) {
        return res.status(400).json({ error: 'Item title and slug are required.' });
      }

      const result = await db.query(
        `INSERT INTO cms_v3_collection_items (collection_id, store_id, title, slug, field_data, status)
         VALUES ($1, $2, $3, $4, $5, 'published')
         ON CONFLICT (collection_id, slug) DO UPDATE SET title = $3, field_data = $5, updated_at = NOW()
         RETURNING *`,
        [collectionId, storeId, title, slug.toLowerCase(), fieldData || {}]
      );

      res.json({ item: result.rows[0] });
    } catch (err) {
      console.error('[CREATE ITEM ERROR]', err);
      res.status(500).json({ error: 'Failed to create collection item.' });
    }
  }
}

module.exports = CmsV3CollectionsController;
