const db = require('../config/database');

const VALID_SIGNAL_TYPES = [
  'competitor_pricing',
  'competitor_availability',
  'weather',
  'local_event',
  'public_holiday',
  'seasonal_trend',
  'market_observation'
];

const VALID_STATUSES = ['draft', 'verified', 'expired', 'rejected'];

class ExternalMarketSignal {
  static get VALID_SIGNAL_TYPES() { return VALID_SIGNAL_TYPES; }
  static get VALID_STATUSES() { return VALID_STATUSES; }

  static async findByStore(storeId, filters = {}) {
    let query = `SELECT * FROM external_market_signals WHERE store_id = $1`;
    const params = [storeId];

    if (filters.signal_type) {
      params.push(filters.signal_type);
      query += ` AND signal_type = $${params.length}`;
    }

    if (filters.status) {
      params.push(filters.status);
      query += ` AND status = $${params.length}`;
    }

    if (filters.active_only) {
      query += ` AND status = 'verified' AND (valid_until IS NULL OR valid_until > NOW())`;
    }

    if (filters.min_confidence) {
      params.push(parseInt(filters.min_confidence));
      query += ` AND confidence >= $${params.length}`;
    }

    if (filters.from) {
      params.push(filters.from);
      query += ` AND observed_at >= $${params.length}`;
    }

    if (filters.to) {
      params.push(filters.to);
      query += ` AND observed_at <= $${params.length}`;
    }

    query += ` ORDER BY observed_at DESC, created_at DESC`;
    const result = await db.query(query, params);
    return result.rows;
  }

  static async findById(id, storeId = null) {
    let query = `SELECT * FROM external_market_signals WHERE id = $1`;
    const params = [id];

    if (storeId) {
      params.push(storeId);
      query += ` AND store_id = $2`;
    }

    const result = await db.query(query, params);
    return result.rows[0] || null;
  }

  static async create(data, client = db) {
    const {
      store_id,
      signal_type,
      title,
      description = '',
      value = {},
      source_name,
      source_url = null,
      observed_at,
      retrieved_at = new Date().toISOString(),
      valid_until = null,
      confidence = 60,
      status = 'draft',
      created_by = null
    } = data;

    if (!store_id || !signal_type || !title || !source_name || !observed_at) {
      const err = new Error('Missing required signal fields: store_id, signal_type, title, source_name, and observed_at are mandatory');
      err.status = 400;
      throw err;
    }

    if (!VALID_SIGNAL_TYPES.includes(signal_type)) {
      const err = new Error(`Invalid signal_type: ${signal_type}`);
      err.status = 400;
      throw err;
    }

    if (!VALID_STATUSES.includes(status)) {
      const err = new Error(`Invalid status: ${status}`);
      err.status = 400;
      throw err;
    }

    // Provenance validation before verification
    if (status === 'verified') {
      this.validateProvenance({ source_name, observed_at, retrieved_at, confidence, signal_type, store_id });
    }

    const result = await client.query(
      `INSERT INTO external_market_signals (
         store_id, signal_type, title, description, value, source_name, source_url,
         observed_at, retrieved_at, valid_until, confidence, status, created_by
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       ON CONFLICT (store_id, source_name, signal_type, observed_at) DO UPDATE
       SET title = EXCLUDED.title,
           description = EXCLUDED.description,
           value = EXCLUDED.value,
           source_url = EXCLUDED.source_url,
           confidence = EXCLUDED.confidence,
           status = EXCLUDED.status,
           valid_until = EXCLUDED.valid_until,
           updated_at = NOW()
       RETURNING *`,
      [
        store_id,
        signal_type,
        title,
        description,
        value,
        source_name,
        source_url,
        observed_at,
        retrieved_at,
        valid_until,
        confidence,
        status,
        created_by
      ]
    );

    return result.rows[0];
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
      const result = await db.query('SELECT * FROM external_market_signals WHERE id = $1 AND store_id = $2', [id, storeId]);
      return result.rows[0] || null;
    }

    values.push(id, storeId);

    const result = await db.query(
      `UPDATE external_market_signals 
       SET ${fields.join(', ')}, updated_at = NOW()
       WHERE id = $${paramIndex} AND store_id = $${paramIndex + 1}
       RETURNING *`,
      values
    );

    return result.rows[0] || null;
  }

  static async setStatus(id, storeId, status) {
    if (!VALID_STATUSES.includes(status)) {
      const err = new Error(`Invalid status: ${status}`);
      err.status = 400;
      throw err;
    }

    return await db.transaction(async (client) => {
      const result = await client.query(
        `UPDATE external_market_signals
         SET status = $1, updated_at = NOW()
         WHERE id = $2 AND store_id = $3
         RETURNING *`,
        [status, id, storeId]
      );

      if (!result.rows[0]) {
        const err = new Error('Signal not found');
        err.status = 404;
        throw err;
      }

      if (status === 'verified') {
        this.validateProvenance(result.rows[0]);
      }

      return result.rows[0];
    });
  }

  static async delete(id, storeId) {
    const result = await db.query(
      `DELETE FROM external_market_signals WHERE id = $1 AND store_id = $2 RETURNING *`,
      [id, storeId]
    );
    return result.rows[0] || null;
  }

  static validateProvenance(signal) {
    if (!signal.source_name || !signal.observed_at || !signal.retrieved_at || signal.confidence === undefined || !signal.signal_type || !signal.store_id) {
      const err = new Error('Cannot verify signal: missing required provenance metadata (source_name, observed_at, retrieved_at, confidence, signal_type, store_id)');
      err.status = 400;
      throw err;
    }
  }
}

module.exports = ExternalMarketSignal;
