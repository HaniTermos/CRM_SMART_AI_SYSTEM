const db = require('../config/database');

class Reservation {
  static async create({
    store_id,
    customer_name,
    customer_phone,
    guests,
    date,
    time,
    floor_id,
    table_label,
    status = 'pending',
    notes
  }) {
    const result = await db.query(
      `INSERT INTO reservations (store_id, customer_name, customer_phone, guests, date, time, floor_id, table_label, status, notes) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [store_id, customer_name, customer_phone, guests, date, time, floor_id || null, table_label || null, status, notes || null]
    );
    return result.rows[0];
  }

  static async findByStore(storeId, { date, dateFrom, dateTo, status } = {}) {
    let query = `SELECT * FROM reservations WHERE store_id = $1`;
    const params = [storeId];

    if (date) {
      query += ` AND date = $${params.length + 1}`;
      params.push(date);
    } else if (dateFrom || dateTo) {
      if (dateFrom) {
        query += ` AND date >= $${params.length + 1}`;
        params.push(dateFrom);
      }
      if (dateTo) {
        query += ` AND date <= $${params.length + 1}`;
        params.push(dateTo);
      }
    }
    if (status && status !== 'all') {
      query += ` AND status = $${params.length + 1}`;
      params.push(status);
    }

    query += ` ORDER BY date ASC, time ASC`;
    const result = await db.query(query, params);
    return result.rows;
  }

  static async findById(id, storeId) {
    let query = `SELECT * FROM reservations WHERE id = $1`;
    const params = [id];
    if (storeId) {
      query += ` AND store_id = $2`;
      params.push(storeId);
    }
    const result = await db.query(query, params);
    return result.rows[0] || null;
  }

  static async update(id, storeId, updates) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && !['id', 'created_at', 'store_id'].includes(key)) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      const result = await db.query('SELECT * FROM reservations WHERE id = $1 AND store_id = $2', [id, storeId]);
      return result.rows[0] || null;
    }

    values.push(id, storeId);

    const result = await db.query(
      `UPDATE reservations SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramIndex} AND store_id = $${paramIndex + 1} RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  static async delete(id, storeId) {
    const result = await db.query(`DELETE FROM reservations WHERE id = $1 AND store_id = $2 RETURNING *`, [id, storeId]);
    return result.rows[0] || null;
  }
}

module.exports = Reservation;