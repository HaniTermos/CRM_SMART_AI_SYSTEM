const db = require('../config/database');

class Customer {
  static async create({ store_id, name, phone, email, segment = 'new', notes }) {
    const result = await db.query(
      `INSERT INTO customers (store_id, name, phone, email, segment, notes) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [store_id, name, phone, email, segment, notes]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await db.query('SELECT * FROM customers WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async findByPhone(storeId, phone) {
    const result = await db.query(
      'SELECT * FROM customers WHERE store_id = $1 AND phone = $2', 
      [storeId, phone]
    );
    return result.rows[0] || null;
  }

  static async findByStore(storeId) {
    const result = await db.query(
      `SELECT * FROM customers WHERE store_id = $1 ORDER BY created_at DESC`, 
      [storeId]
    );
    return result.rows;
  }

  static async update(id, storeId, updates, client = db) {
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

    if (fields.length === 0) {
      const result = await client.query('SELECT * FROM customers WHERE id = $1 AND store_id = $2', [id, storeId]);
      return result.rows[0] || null;
    }

    values.push(id, storeId);
    const result = await client.query(
      `UPDATE customers SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex} AND store_id = $${paramIndex + 1} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  static async logActivity({ store_id, customer_id, type, payload }, client = db) {
    const result = await client.query(
      `INSERT INTO customer_activities (store_id, customer_id, type, payload) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [store_id, customer_id, type, payload]
    );
    return result.rows[0];
  }

  static async getActivities(customerId) {
    const result = await db.query(
      'SELECT * FROM customer_activities WHERE customer_id = $1 ORDER BY created_at DESC',
      [customerId]
    );
    return result.rows;
  }
}

module.exports = Customer;
