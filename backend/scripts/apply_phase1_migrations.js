require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('../config/database');

async function applyPhase1Migrations() {
  console.log('[Migration] Starting Phase 1 migration runner...');
  const migrationsDir = path.join(__dirname, '../migrations');

  const files = ['023_ai_copilot_system.sql', '024_cms_themes_and_editor.sql'];

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    if (!fs.existsSync(filePath)) {
      console.error(`[Migration] File not found: ${filePath}`);
      process.exit(1);
    }
    const sql = fs.readFileSync(filePath, 'utf8');
    console.log(`[Migration] Executing ${file}...`);
    const start = Date.now();
    try {
      await db.query(sql);
      console.log(`[Migration] Successfully applied ${file} in ${Date.now() - start}ms`);
    } catch (err) {
      console.error(`[Migration] Failed applying ${file}:`, err.message);
      process.exit(1);
    }
  }

  console.log('[Migration] All Phase 1 migrations applied successfully.');
  process.exit(0);
}

applyPhase1Migrations();
