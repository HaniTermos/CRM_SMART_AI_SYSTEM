const db = require('../config/database');

class CmsV3GlobalSymbol {
  static async findByStoreId(storeId) {
    const result = await db.query(
      `SELECT * FROM cms_v3_global_symbols WHERE store_id = $1 ORDER BY updated_at DESC`,
      [storeId]
    );
    return result.rows;
  }

  static async findById(id, storeId) {
    const result = await db.query(
      `SELECT * FROM cms_v3_global_symbols WHERE id = $1 AND store_id = $2`,
      [id, storeId]
    );
    return result.rows[0] || null;
  }

  static async create(data) {
    const { store_id, name, symbol_type = 'section', node_data } = data;
    const result = await db.query(
      `INSERT INTO cms_v3_global_symbols (store_id, name, symbol_type, node_data)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [store_id, name, symbol_type, JSON.stringify(node_data)]
    );
    return result.rows[0];
  }

  static async update(id, storeId, data) {
    const { name, node_data } = data;
    const result = await db.query(
      `UPDATE cms_v3_global_symbols
       SET name = COALESCE($1, name),
           node_data = COALESCE($2, node_data),
           version = version + 1,
           updated_at = NOW()
       WHERE id = $3 AND store_id = $4
       RETURNING *`,
      [name, node_data ? JSON.stringify(node_data) : null, id, storeId]
    );
    return result.rows[0] || null;
  }
}

module.exports = CmsV3GlobalSymbol;
