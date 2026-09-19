const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  database: process.env.DB_NAME || 'smartstore_ai',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

pool.on('connect', () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('[DB] New connection established');
  }
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected pool error:', err);
  process.exit(-1);
});

/**
 * Execute a parameterized SQL query.
 * Logs timing in development mode.
 */
const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development') {
      console.log('[DB] Query:', {
        sql: text.substring(0, 120),
        duration: `${duration}ms`,
        rows: result.rowCount,
      });
    }
    return result;
  } catch (error) {
    console.error('[DB] Query error:', {
      sql: text,
      params,
      error: error.message,
    });
    throw error;
  }
};

/**
 * Run multiple queries inside a single transaction.
 * Automatically handles BEGIN / COMMIT / ROLLBACK.
 *
 * Usage:
 *   const result = await db.transaction(async (client) => {
 *     await client.query('INSERT ...', [...]);
 *     await client.query('UPDATE ...', [...]);
 *     return someValue;
 *   });
 */
const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  pool,
  query,
  transaction,
};
