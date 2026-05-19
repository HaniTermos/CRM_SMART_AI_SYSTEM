const db = require('../config/database');
const Product = require('./Product');

class InventoryAdjustment {
  /**
   * Logs an adjustment and updates the product stock transactionally.
   */
  static async create({ store_id, product_id, delta, reason, note, created_by }) {
    return db.transaction(async (client) => {
      // 1. Create the adjustment log
      const adjResult = await client.query(
        `INSERT INTO inventory_adjustments (store_id, product_id, delta, reason, note, created_by) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING *`,
        [store_id, product_id, delta, reason, note, created_by]
      );
      
      const adjustment = adjResult.rows[0];

      // 2. Update the product stock
      await client.query(
        `UPDATE products SET stock = stock + $1 WHERE id = $2`,
        [delta, product_id]
      );

      return adjustment;
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
