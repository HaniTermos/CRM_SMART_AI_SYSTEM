const { Client } = require('pg');
require('dotenv').config();

async function createDatabase() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '123456789',
    database: 'postgres',
  });

  try {
    await client.connect();
    console.log('[DB] Connected to default "postgres" database');
    const res = await client.query("SELECT 1 FROM pg_database WHERE datname = 'smartstore_ai'");
    if (res.rows.length === 0) {
      console.log('[DB] Creating "smartstore_ai" database...');
      await client.query('CREATE DATABASE smartstore_ai');
      console.log('[DB] ✓ Database "smartstore_ai" created successfully.');
    } else {
      console.log('[DB] Database "smartstore_ai" already exists.');
    }
  } catch (err) {
    console.error('[DB] ✗ Error creating database:', err.message);
  } finally {
    await client.end();
  }
}

createDatabase();
