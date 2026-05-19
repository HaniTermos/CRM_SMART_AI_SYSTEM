const db = require('../config/database');

class Category {
  static async create({ store_id, name, slug }) {
    const result = await db.query(
      `INSERT INTO categories (store_id, name, slug) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [store_id, name, slug]
    );
    return result.rows[0];
  }

  static async findByStore(storeId) {
    const result = await db.query(
      'SELECT * FROM categories WHERE store_id = $1 ORDER BY name ASC',
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

  static async delete(id) {
    const result = await db.query(
      'DELETE FROM categories WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows[0] || null;
  }
}

module.exports = Category;
