const db = require('../config/database');

class Category {
  static async create({ store_id, name, slug, position = 0 }) {
    const result = await db.query(
      `INSERT INTO categories (store_id, name, slug, position) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [store_id, name, slug, position]
    );
    return result.rows[0];
  }

  static async findByStore(storeId) {
    const result = await db.query(
      'SELECT * FROM categories WHERE store_id = $1 AND is_archived = false ORDER BY position ASC, name ASC',
      [storeId]
    );
    return result.rows;
  }

  static async findById(id) {
    const result = await db.query(
      'SELECT * FROM categories WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  static async update(id, storeId, updates) {
    const allowed = ['name', 'slug', 'position', 'is_archived'];
    const fields = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (allowed.includes(key) && value !== undefined) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (fields.length === 0) {
      const result = await db.query('SELECT * FROM categories WHERE id = $1 AND store_id = $2', [id, storeId]);
      return result.rows[0] || null;
    }

    values.push(id, storeId);
    const result = await db.query(
      `UPDATE categories SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex} AND store_id = $${paramIndex + 1} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  static async reorder(storeId, orderedIds) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');
      for (let i = 0; i < orderedIds.length; i++) {
        await client.query(
          'UPDATE categories SET position = $1, updated_at = NOW() WHERE id = $2 AND store_id = $3',
          [i, orderedIds[i], storeId]
        );
      }
      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async delete(id, storeId) {
    const result = await db.query(
      'DELETE FROM categories WHERE id = $1 AND store_id = $2 RETURNING *',
      [id, storeId]
    );
    return result.rows[0] || null;
  }
}

module.exports = Category;
