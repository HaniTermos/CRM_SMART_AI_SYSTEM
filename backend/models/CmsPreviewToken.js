const db = require('../config/database');
const crypto = require('crypto');

class CmsPreviewToken {
  static async generateToken(storeId, userId, pageId = null) {
    const rawToken = crypto.randomBytes(32).toString('hex');
    // Token expires in 30 minutes
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    const result = await db.query(
      `INSERT INTO cms_preview_tokens (store_id, user_id, page_id, token, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [storeId, userId, pageId, rawToken, expiresAt]
    );

    return result.rows[0];
  }

  static async validateToken(token, storeId) {
    if (!token) return false;

    const result = await db.query(
      `SELECT * FROM cms_preview_tokens 
       WHERE token = $1 AND store_id = $2 AND expires_at > NOW()`,
      [token, storeId]
    );

    return result.rows.length > 0;
  }
}

module.exports = CmsPreviewToken;
