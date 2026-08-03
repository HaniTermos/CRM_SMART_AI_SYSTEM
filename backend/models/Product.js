const db = require('../config/database');

class Product {
  static async create({ store_id, category_id, name, slug, description, price, stock, image_url, status = 'draft' }) {
    const result = await db.query(
      `INSERT INTO products (store_id, category_id, name, slug, description, price, stock, image_url, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [store_id, category_id, name, slug, description, price, stock, image_url, status]
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
    
    query += ' ORDER BY created_at DESC';
    
    const result = await db.query(query, params);
    return result.rows;
  }

  static async update(id, updates) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && !['id', 'created_at', 'updated_at', 'store_id'].includes(key)) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (fields.length === 0) return null;

    values.push(id);
    const result = await db.query(
      `UPDATE products SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  static async updateStock(id, newStock, client = db) {
    const result = await client.query(
      'UPDATE products SET stock = $1 WHERE id = $2 RETURNING *',
      [newStock, id]
    );
    return result.rows[0] || null;
  }

  static async delete(id) {
    const result = await db.query(
      'DELETE FROM products WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows[0] || null;
  }
}

module.exports = Product;
