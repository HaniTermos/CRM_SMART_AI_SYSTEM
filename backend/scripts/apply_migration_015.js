const fs = require('fs');
const path = require('path');
const db = require('../config/database');

async function applyMigration() {
  const filePath = path.join(__dirname, '../migrations/015_storefront_cms_v2.sql');
  const sql = fs.readFileSync(filePath, 'utf-8');

  try {
    await db.query(sql);
    console.log('Migration 015 applied successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Migration 015 failed:', err.message);
    process.exit(1);
  }
}

applyMigration();
