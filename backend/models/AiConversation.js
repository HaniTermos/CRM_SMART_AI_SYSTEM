const db = require('../config/database');

class AiConversation {
  static async create({ store_id, user_id, title = 'New Conversation', mode = 'general', source = 'floating_icon', context_snapshot = {} }) {
    const res = await db.query(
      `INSERT INTO ai_conversations (store_id, user_id, title, mode, source, context_snapshot)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [store_id, user_id, title, mode, source, context_snapshot]
    );
    return res.rows[0];
  }

  static async findById(id, store_id) {
    const res = await db.query(
      `SELECT * FROM ai_conversations WHERE id = $1 AND store_id = $2`,
      [id, store_id]
    );
    return res.rows[0] || null;
  }

  static async findByStore(store_id, { limit = 20, offset = 0 } = {}) {
    const res = await db.query(
      `SELECT c.*, 
              (SELECT COUNT(*)::int FROM ai_messages m WHERE m.conversation_id = c.id) AS message_count
       FROM ai_conversations c
       WHERE c.store_id = $1 AND c.status = 'active'
       ORDER BY c.last_message_at DESC
       LIMIT $2 OFFSET $3`,
      [store_id, limit, offset]
    );
    return res.rows;
  }

  static async updateTitle(id, store_id, title) {
    const res = await db.query(
      `UPDATE ai_conversations SET title = $3, updated_at = NOW() WHERE id = $1 AND store_id = $2 RETURNING *`,
      [id, store_id, title]
    );
    return res.rows[0] || null;
  }

  static async archive(id, store_id) {
    const res = await db.query(
      `UPDATE ai_conversations SET status = 'archived', updated_at = NOW() WHERE id = $1 AND store_id = $2 RETURNING *`,
      [id, store_id]
    );
    return res.rows[0] || null;
  }

  static async updateLastMessageAt(id) {
    await db.query(
      `UPDATE ai_conversations SET last_message_at = NOW(), updated_at = NOW() WHERE id = $1`,
      [id]
    );
  }
}

module.exports = AiConversation;
