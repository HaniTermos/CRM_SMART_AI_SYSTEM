const db = require('../config/database');

class UserRole {
  static async addMember({ store_id, email, role }) {
    // Look up user by email
    const userResult = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      throw new Error('User not found. They must register first.');
    }
    const userId = userResult.rows[0].id;

    // Insert role
    try {
      const result = await db.query(
        `INSERT INTO user_roles (user_id, store_id, role) 
         VALUES ($1, $2, $3) 
         RETURNING *`,
        [userId, store_id, role]
      );
      return result.rows[0];
    } catch (err) {
      if (err.code === '23505') {
        throw new Error('User is already a member of this store.');
      }
      throw err;
    }
  }

  static async removeMember(storeId, userId) {
    // Prevent removing the owner
    const roleCheck = await db.query(
      'SELECT role FROM user_roles WHERE store_id = $1 AND user_id = $2',
      [storeId, userId]
    );
    if (roleCheck.rows[0]?.role === 'owner') {
      throw new Error('Cannot remove the store owner.');
    }

    const result = await db.query(
      'DELETE FROM user_roles WHERE store_id = $1 AND user_id = $2 RETURNING id',
      [storeId, userId]
    );
    return result.rows[0] || null;
  }

  static async findByStore(storeId) {
    const result = await db.query(
      `SELECT ur.user_id as id, ur.role, u.name, u.email 
       FROM user_roles ur
       JOIN users u ON ur.user_id = u.id
       WHERE ur.store_id = $1
       ORDER BY ur.created_at ASC`,
      [storeId]
    );
    return result.rows;
  }
}

module.exports = UserRole;
