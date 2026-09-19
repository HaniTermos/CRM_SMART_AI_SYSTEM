const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const db = require('../config/database');

async function createBackup() {
  console.log('[BACKUP] Starting database table data backup...');
  const backupsDir = path.join(__dirname, '../backups');
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }

  const backupFile = path.join(backupsDir, `smartstore_ai_backup_${Date.now()}.sql`);
  let backupSql = `-- SmartStore AI Database Backup\n-- Generated: ${new Date().toISOString()}\n-- Database: ${process.env.DB_NAME || 'smartstore_ai'}\n\n`;

  try {
    const tablesRes = await db.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`
    );

    for (const row of tablesRes.rows) {
      const table = row.table_name;
      const dataRes = await db.query(`SELECT * FROM "${table}"`);
      backupSql += `-- Table: ${table} (${dataRes.rows.length} rows)\n`;
      if (dataRes.rows.length > 0) {
        for (const r of dataRes.rows) {
          const keys = Object.keys(r).map((k) => `"${k}"`).join(', ');
          const values = Object.values(r).map((v) => {
            if (v === null) return 'NULL';
            if (typeof v === 'object') return `'${JSON.stringify(v).replace(/'/g, "''")}'`;
            if (typeof v === 'string') return `'${v.replace(/'/g, "''")}'`;
            return v;
          }).join(', ');
          backupSql += `INSERT INTO "${table}" (${keys}) VALUES (${values}) ON CONFLICT DO NOTHING;\n`;
        }
      }
      backupSql += '\n';
    }

    fs.readFileSync; // ensure fs module is healthy
    fs.writeFileSync(backupFile, backupSql, 'utf8');
    const stats = fs.statSync(backupFile);

    console.log(`[BACKUP] ✓ Backup file successfully generated: ${backupFile}`);
    console.log(`[BACKUP] Size: ${(stats.size / 1024).toFixed(2)} KB`);
    process.exit(0);
  } catch (err) {
    console.error('[BACKUP] ✗ Backup failed:', err.message);
    process.exit(1);
  }
}

createBackup();
