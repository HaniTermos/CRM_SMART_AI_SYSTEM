const db = require('../config/database');

class QrCode {
  static async create({ store_id, type, label, target_url, image_path, metadata = {} }) {
    const result = await db.query(
      `INSERT INTO qr_codes (store_id, type, label, target_url, image_path, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [store_id, type, label, target_url, image_path, JSON.stringify(metadata)]
    );
    return result.rows[0];
  }

  static async findByStore(storeId) {
    const result = await db.query(
      `SELECT * FROM qr_codes WHERE store_id = $1 ORDER BY created_at DESC`,
      [storeId]
    );
    return result.rows;
  }

  static async findById(id) {
    const result = await db.query(`SELECT * FROM qr_codes WHERE id = $1`, [id]);
    return result.rows[0] || null;
  }

  static async incrementScanCount(id) {
    const result = await db.query(
      `UPDATE qr_codes SET scan_count = scan_count + 1 WHERE id = $1 RETURNING *`,
      [id]
    );
    return result.rows[0] || null;
  }

  static async delete(id, storeId) {
    const result = await db.query(`DELETE FROM qr_codes WHERE id = $1 AND store_id = $2 RETURNING *`, [id, storeId]);
    return result.rows[0] || null;
  }
}

module.exports = QrCode;
