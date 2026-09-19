const db = require('../config/database');

class KitchenTicket {
  static async create({ store_id, order_id, status = 'pending', station = 'All', priority = 0 }) {
    const result = await db.query(
      `INSERT INTO kitchen_tickets (store_id, order_id, status, station, priority) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [store_id, order_id, status, station, priority]
    );
    return result.rows[0];
  }

  static async findByStore(storeId, { status } = {}) {
    let query = `SELECT kt.*, o.order_number, o.customer_id, o.notes as order_notes, 
                        o.table_label, o.floor_id, o.created_at as order_created_at, 
                        c.name as customer_name
                 FROM kitchen_tickets kt
                 JOIN orders o ON kt.order_id = o.id
                 LEFT JOIN customers c ON o.customer_id = c.id
                 WHERE kt.store_id = $1`;
    const params = [storeId];

    if (status && status !== 'all') {
      query += ` AND kt.status = $${params.length + 1}`;
      params.push(status);
    }

    query += ` ORDER BY kt.priority DESC, kt.created_at ASC`;
    const result = await db.query(query, params);
    
    // Fetch items for each ticket
    const tickets = await Promise.all(
      result.rows.map(async (ticket) => {
        const itemsRes = await db.query(
          `SELECT oi.*, p.name as product_name 
           FROM order_items oi
           LEFT JOIN products p ON oi.product_id = p.id
           WHERE oi.order_id = $1`,
          [ticket.order_id]
        );
        return {
          ...ticket,
          items: itemsRes.rows
        };
      })
    );

    return tickets;
  }

  static async findById(id) {
    const result = await db.query(
      `SELECT kt.*, o.order_number, o.notes as order_notes, o.table_label, o.floor_id, o.created_at as order_created_at 
       FROM kitchen_tickets kt
       JOIN orders o ON kt.order_id = o.id
       WHERE kt.id = $1`,
      [id]
    );
    if (!result.rows[0]) return null;

    const ticket = result.rows[0];
    const itemsRes = await db.query(
      `SELECT oi.*, p.name as product_name 
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = $1`,
      [ticket.order_id]
    );

    return {
      ...ticket,
      items: itemsRes.rows
    };
  }

  static async updateStatus(id, storeId, status) {
    const updates = { status };
    if (status === 'preparing' || status === 'in_prep') updates.started_at = new Date().toISOString();
    if (status === 'ready' || status === 'completed') updates.ready_at = new Date().toISOString();

    const fields = [];
    const values = [];
    let paramIndex = 1;

    Object.entries(updates).forEach(([key, value]) => {
      fields.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    });

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id, storeId);

    const result = await db.query(
      `UPDATE kitchen_tickets SET ${fields.join(', ')} WHERE id = $${paramIndex} AND store_id = $${paramIndex + 1} RETURNING *`,
      values
    );

    // Also update order status if ticket becomes ready or in_prep
    if (result.rows[0]) {
      const ticket = result.rows[0];
      if (status === 'in_prep' || status === 'preparing') {
        await db.query(`UPDATE orders SET status = 'confirmed' WHERE id = $1 AND store_id = $2`, [ticket.order_id, storeId]);
      }
    }

    return result.rows[0] || null;
  }

  static async delete(id, storeId) {
    const result = await db.query(`DELETE FROM kitchen_tickets WHERE id = $1 AND store_id = $2 RETURNING *`, [id, storeId]);
    return result.rows[0] || null;
  }
}

module.exports = KitchenTicket;