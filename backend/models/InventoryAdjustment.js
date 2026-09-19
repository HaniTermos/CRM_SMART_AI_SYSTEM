const db = require('../config/database');
const Product = require('./Product');

class InventoryAdjustment {
  static async create({ store_id, product_id, delta, reason, note, created_by }) {
    return db.transaction(async (client) => {
      const productResult = await client.query(
        `UPDATE products SET stock = stock + $1 WHERE id = $2 AND store_id = $3 RETURNING *`,
        [delta, product_id, store_id]
      );

      if (!productResult.rows[0]) {
        throw new Error('Product not found');
      }

      const adjResult = await client.query(
        `INSERT INTO inventory_adjustments (store_id, product_id, delta, reason, note, created_by) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING *`,
        [store_id, product_id, delta, reason, note, created_by]
      );
      
      return { ...adjResult.rows[0], stock: productResult.rows[0].stock };
    });
  }

  static async findByStore(storeId) {
    const result = await db.query(
      `SELECT ia.*, p.name as product_name, u.name as user_name
       FROM inventory_adjustments ia
       JOIN products p ON ia.product_id = p.id
       LEFT JOIN users u ON ia.created_by = u.id
       WHERE ia.store_id = $1 
       ORDER BY ia.created_at DESC`,
      [storeId]
    );
    return result.rows;
  }
}

module.exports = InventoryAdjustment;
