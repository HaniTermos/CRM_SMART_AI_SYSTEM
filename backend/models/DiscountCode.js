const db = require('../config/database');

class DiscountCode {
  static async create({ store_id, code, type, value, min_subtotal, max_uses, active = true, expires_at }) {
    const result = await db.query(
      `INSERT INTO discount_codes (store_id, code, type, value, min_subtotal, max_uses, active, expires_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`,
      [store_id, code.toUpperCase(), type, value, min_subtotal, max_uses, active, expires_at]
    );
    return result.rows[0];
  }

  static async findByStore(storeId) {
    const result = await db.query(
      'SELECT * FROM discount_codes WHERE store_id = $1 ORDER BY created_at DESC',
      [storeId]
    );
    return result.rows;
  }

  static async findByCode(storeId, code) {
    const result = await db.query(
      'SELECT * FROM discount_codes WHERE store_id = $1 AND code = $2',
      [storeId, code.toUpperCase()]
    );
    return result.rows[0] || null;
  }

  static async update(id, updates) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && !['id', 'store_id', 'created_at', 'updated_at', 'used_count'].includes(key)) {
        if (key === 'code' && typeof value === 'string') {
          value = value.toUpperCase();
        }
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (fields.length === 0) return null;

    values.push(id);
    const result = await db.query(
      `UPDATE discount_codes SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  static async incrementUsage(id, client = db) {
    const result = await client.query(
      'UPDATE discount_codes SET used_count = used_count + 1 WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0] || null;
  }

  static async delete(id) {
    const result = await db.query(
      'DELETE FROM discount_codes WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows[0] || null;
  }
}

module.exports = DiscountCode;
