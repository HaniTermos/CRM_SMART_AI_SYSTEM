const db = require('../config/database');

class Product {
  static async create({ store_id, category_id, name, slug, description, price, stock, image_url, status = 'draft', prep_time = 10, is_available = true, is_featured = false, dietary_tags = [], allergens = [], modifiers = [] }) {
    const result = await db.query(
      `INSERT INTO products (store_id, category_id, name, slug, description, price, stock, image_url, status, prep_time, is_available, is_featured, dietary_tags, allergens, modifiers) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) 
       RETURNING *`,
      [store_id, category_id || null, name, slug, description || '', price, stock || 0, image_url || null, status, prep_time, is_available, is_featured, dietary_tags, allergens, JSON.stringify(modifiers || [])]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await db.query('SELECT * FROM products WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async findBySlug(storeId, slug) {
    const result = await db.query(
      'SELECT * FROM products WHERE store_id = $1 AND slug = $2', 
      [storeId, slug]
    );
    return result.rows[0] || null;
  }

  static async findByStore(storeId, { activeOnly = false } = {}) {
    let query = 'SELECT * FROM products WHERE store_id = $1';
    const params = [storeId];
    
    if (activeOnly) {
      query += ` AND status = 'active'`;
    }
    
    query += ' ORDER BY is_featured DESC, created_at DESC';
    
    const result = await db.query(query, params);
    return result.rows;
  }

  static async update(id, storeId, updates) {
    const allowed = ['category_id', 'name', 'slug', 'description', 'price', 'stock', 'image_url', 'status', 'prep_time', 'is_available', 'is_featured', 'dietary_tags', 'allergens', 'modifiers'];
    const fields = [];
    const values = [];
    let paramIndex = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && allowed.includes(key) && !['id', 'created_at', 'updated_at', 'store_id'].includes(key)) {
        fields.push(`${key} = $${paramIndex}`);
        if (key === 'modifiers') {
          values.push(JSON.stringify(value));
        } else {
          values.push(value);
        }
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      const result = await db.query('SELECT * FROM products WHERE id = $1 AND store_id = $2', [id, storeId]);
      return result.rows[0] || null;
    }

    values.push(id, storeId);
    const result = await db.query(
      `UPDATE products SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex} AND store_id = $${paramIndex + 1} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  static async duplicate(id, storeId) {
    const original = await db.query('SELECT * FROM products WHERE id = $1 AND store_id = $2', [id, storeId]);
    if (original.rows.length === 0) return null;
    const p = original.rows[0];
    const newSlug = `${p.slug}-copy-${Date.now()}`;
    const result = await db.query(
      `INSERT INTO products (store_id, category_id, name, slug, description, price, stock, image_url, status, prep_time, is_available, is_featured, dietary_tags, allergens, modifiers)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *`,
      [storeId, p.category_id, `${p.name} (Copy)`, newSlug, p.description, p.price, p.stock, p.image_url, p.status, p.prep_time, p.is_available, p.is_featured, p.dietary_tags, p.allergens, JSON.stringify(p.modifiers || [])]
    );
    return result.rows[0];
  }

  static async bulkUpdate(storeId, ids, updates) {
    const allowed = ['status', 'is_available', 'is_featured', 'category_id'];
    const fields = [];
    const values = [];
    let paramIndex = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && allowed.includes(key)) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (fields.length === 0 || !ids || ids.length === 0) {
      return [];
    }

    values.push(ids, storeId);
    const result = await db.query(
      `UPDATE products SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ANY($${paramIndex}::uuid[]) AND store_id = $${paramIndex + 1} RETURNING *`,
      values
    );
    return result.rows;
  }

  static async updateStock(id, newStock, client = db) {
    const result = await client.query(
      'UPDATE products SET stock = $1 WHERE id = $2 RETURNING *',
      [newStock, id]
    );
    return result.rows[0] || null;
  }

  static async delete(id, storeId) {
    const result = await db.query(
      'DELETE FROM products WHERE id = $1 AND store_id = $2 RETURNING *',
      [id, storeId]
    );
    return result.rows[0] || null;
  }
}

module.exports = Product;
