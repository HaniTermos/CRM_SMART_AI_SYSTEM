const db = require('../config/database');

class ProductReview {
  static async create({ store_id, product_id, customer_phone, author_name, rating, comment }) {
    let verified = false;
    if (customer_phone) {
      const result = await db.query(
        `SELECT EXISTS (
          SELECT 1 FROM orders o
          JOIN order_items oi ON o.id = oi.order_id
          JOIN customers c ON o.customer_id = c.id
          WHERE c.phone LIKE '%' || $1
          AND o.store_id = $2
          AND oi.product_id = $3
        ) as verified`,
        [customer_phone.slice(-4), store_id, product_id]
      );
      verified = result.rows[0]?.verified || false;
    }

    const result = await db.query(
      `INSERT INTO product_reviews (store_id, product_id, customer_phone, author_name, rating, comment, verified_purchase) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [store_id, product_id, customer_phone, author_name, rating, comment, verified]
    );
    return result.rows[0];
  }

  static async findByStore(storeId, status) {
    let query = `SELECT pr.*, p.name as product_name 
                 FROM product_reviews pr
                 JOIN products p ON pr.product_id = p.id
                 WHERE pr.store_id = $1`;
    const params = [storeId];

    if (status && status !== 'all') {
      query += ` AND pr.status = $2`;
      params.push(status);
    }

    query += ` ORDER BY pr.created_at DESC`;

    const result = await db.query(query, params);
    return result.rows;
  }

  static async findByProduct(productId, status = 'approved') {
    const result = await db.query(
      `SELECT * FROM product_reviews 
       WHERE product_id = $1 AND status = $2 
       ORDER BY created_at DESC`,
      [productId, status]
    );
    return result.rows;
  }

  static async updateStatus(id, storeId, status) {
    const result = await db.query(
      'UPDATE product_reviews SET status = $1, updated_at = NOW() WHERE id = $2 AND store_id = $3 RETURNING *',
      [status, id, storeId]
    );
    return result.rows[0] || null;
  }

  static async delete(id, storeId) {
    const result = await db.query(
      'DELETE FROM product_reviews WHERE id = $1 AND store_id = $2 RETURNING *',
      [id, storeId]
    );
    return result.rows[0] || null;
  }
}

module.exports = ProductReview;
