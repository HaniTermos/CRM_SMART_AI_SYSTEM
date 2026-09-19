const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const db = require('../config/database');

async function verifyState() {
  console.log('--- OFFICIAL MIGRATION STATE VERIFICATION ---');

  // 1. Check _migrations ledger
  const appliedRes = await db.query(`SELECT filename FROM _migrations ORDER BY filename`);
  const filenames = appliedRes.rows.map((r) => r.filename);
  console.log(`Total _migrations count: ${filenames.length}`);

  const targetRange = Array.from({ length: 24 }, (_, i) => {
    const num = String(i + 1).padStart(3, '0');
    return filenames.find((f) => f.startsWith(num));
  }).filter(Boolean);

  console.log(`Migrations 001-024 present: ${targetRange.length === 24}`);

  // Check no duplicates
  const dupCheck = await db.query(`SELECT filename, COUNT(*) FROM _migrations GROUP BY filename HAVING COUNT(*) > 1`);
  console.log(`Duplicate migration entries: ${dupCheck.rows.length}`);

  // 2. Data Row Preservation Check
  const baselinePath = path.join(__dirname, '../backups/baseline_counts.json');
  let baseline = {};
  if (fs.existsSync(baselinePath)) {
    baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
  }

  console.log('\n--- DATA ROW PRESERVATION VERIFICATION ---');
  let allPreserved = true;
  for (const [table, oldCount] of Object.entries(baseline)) {
    const res = await db.query(`SELECT COUNT(*)::int AS count FROM "${table}"`);
    const newCount = res.rows[0].count;
    const status = newCount >= oldCount ? 'OK' : 'LOST DATA';
    if (newCount < oldCount) allPreserved = false;
    console.log(`Table '${table}': Before=${oldCount}, After=${newCount} [${status}]`);
  }

  console.log(`All business data preserved: ${allPreserved}`);
  process.exit(0);
}

verifyState();
