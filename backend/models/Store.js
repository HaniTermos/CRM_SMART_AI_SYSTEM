const db = require('../config/database');

class Store {
  static async create({ owner_user_id, name, slug, currency = 'USD', shipping_fee = 0 }) {
    return db.transaction(async (client) => {
      // Create the store
      const storeResult = await client.query(
        `INSERT INTO stores (owner_user_id, name, slug, currency, shipping_fee) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING *`,
        [owner_user_id, name, slug, currency, shipping_fee]
      );
      
      const store = storeResult.rows[0];

      // Assign the owner role in user_roles
      await client.query(
        `INSERT INTO user_roles (user_id, store_id, role) VALUES ($1, $2, 'owner')`,
        [owner_user_id, store.id]
      );

      return store;
    });
  }

  static async findByUserId(userId) {
    // A user can access stores where they are the owner OR have a role
    const result = await db.query(
      `SELECT s.*, r.role as my_role 
       FROM stores s
       JOIN user_roles r ON s.id = r.store_id
       WHERE r.user_id = $1
       ORDER BY s.created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  static async findById(id) {
    const result = await db.query(
      'SELECT * FROM stores WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  static async findBySlug(slug) {
    const result = await db.query(
      'SELECT * FROM stores WHERE slug = $1',
      [slug]
    );
    return result.rows[0] || null;
  }

  static async update(id, updates) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && !['id', 'created_at', 'updated_at', 'owner_user_id'].includes(key)) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (fields.length === 0) return null;

    values.push(id);
    const result = await db.query(
      `UPDATE stores SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  static async delete(id) {
    const result = await db.query(
      'DELETE FROM stores WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows[0] || null;
  }
}

module.exports = Store;
