const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const db = require('../config/database');

async function preExecutionCheck() {
  console.log('--- PRE-EXECUTION AUDIT ---');
  
  // 1. Target Database
  console.log(`Target Database: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'smartstore_ai'}`);

  // 2. Backup File Check
  const backupsDir = path.join(__dirname, '../backups');
  if (!fs.existsSync(backupsDir)) {
    console.error('BACKUP NOT VERIFIED — backups directory missing');
    process.exit(1);
  }
  const files = fs.readdirSync(backupsDir).filter(f => f.endsWith('.sql'));
  if (files.length === 0) {
    console.error('BACKUP NOT VERIFIED — no backup SQL file found');
    process.exit(1);
  }
  
  const latestBackup = path.join(backupsDir, files.sort().pop());
  const stats = fs.statSync(latestBackup);
  if (stats.size === 0) {
    console.error('BACKUP NOT VERIFIED — backup file is empty');
    process.exit(1);
  }

  const fileBuffer = fs.readFileSync(latestBackup);
  const hashSum = crypto.createHash('sha256').update(fileBuffer).digest('hex');

  console.log(`Backup File: ${latestBackup}`);
  console.log(`Backup Size: ${(stats.size / 1024).toFixed(2)} KB`);
  console.log(`Backup SHA256 Checksum: ${hashSum}`);

  // 3. Migration Ledger Check
  const appliedRes = await db.query(`SELECT filename FROM _migrations ORDER BY filename`);
  const appliedList = appliedRes.rows.map(r => r.filename);
  console.log(`\nCurrent _migrations count: ${appliedList.length}`);
  console.log(`Latest applied: ${appliedList[appliedList.length - 1]}`);

  const targetMigrations = ['022_stores_business_type_check.sql', '023_ai_copilot_system.sql', '024_cms_themes_and_editor.sql'];
  for (const m of targetMigrations) {
    const isApplied = appliedList.includes(m);
    console.log(`Migration ${m}: ${isApplied ? 'ALREADY APPLIED' : 'UNAPPLIED (Ready)'}`);
  }

  // 4. Baseline Row Counts Before Migration
  const tablesToTrack = [
    'stores', 'users', 'products', 'orders', 'customers',
    'inventory_adjustments', 'cms_pages', 'cms_page_sections',
    'cms_page_versions', 'cms_navigation_items', 'cms_settings', 'cms_themes'
  ];

  console.log('\n--- BASELINE DATA ROW COUNTS ---');
  const baselineCounts = {};
  for (const t of tablesToTrack) {
    const res = await db.query(`SELECT COUNT(*)::int AS count FROM "${t}"`);
    baselineCounts[t] = res.rows[0].count;
    console.log(`  Table '${t}': ${baselineCounts[t]} rows`);
  }

  fs.writeFileSync(path.join(__dirname, '../backups/baseline_counts.json'), JSON.stringify(baselineCounts, null, 2));
  console.log('--- PRE-EXECUTION AUDIT PASSED ---\n');
  process.exit(0);
}

preExecutionCheck();
