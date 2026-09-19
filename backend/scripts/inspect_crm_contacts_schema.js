/**
 * Database Schema Audit: crm_contacts
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const db = require('../config/database');

async function inspectCrmContactsSchema() {
  console.log('[SCHEMA AUDIT] Inspecting crm_contacts table structure...');
  try {
    const res = await db.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'crm_contacts'
      ORDER BY ordinal_position;
    `);

    console.log('Columns in crm_contacts:');
    console.table(res.rows);

    const tableCheck = await db.query(`
      SELECT table_name FROM information_schema.tables WHERE table_name = 'cms_v3_newsletter_subscriptions';
    `);
    console.log('cms_v3_newsletter_subscriptions table exists:', tableCheck.rows.length > 0);

    process.exit(0);
  } catch (err) {
    console.error('[SCHEMA AUDIT ERROR]', err);
    process.exit(1);
  }
}

inspectCrmContactsSchema();
