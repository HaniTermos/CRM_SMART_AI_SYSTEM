require('dotenv').config();
const db = require('../config/database');
async function check() {
  // Shifts check constraints
  const res = await db.query(`SELECT conname, pg_get_constraintdef(oid) as def FROM pg_constraint WHERE conrelid = 'public.shifts'::regclass AND contype = 'c'`);
  if (res.rows.length === 0) {
    console.log('No check constraints on shifts.status — any string value including "draft" is allowed');
  } else {
    res.rows.forEach(c => console.log(c.conname + ': ' + c.def));
  }

  // Tasks check constraints
  const res2 = await db.query(`SELECT conname, pg_get_constraintdef(oid) as def FROM pg_constraint WHERE conrelid = 'public.tasks'::regclass AND contype = 'c'`);
  if (res2.rows.length === 0) {
    console.log('No check constraints on tasks.status — any string value is allowed');
  } else {
    res2.rows.forEach(c => console.log(c.conname + ': ' + c.def));
  }

  // Tasks source column values test
  const res3 = await db.query(`SELECT conname, pg_get_constraintdef(oid) as def FROM pg_constraint WHERE conrelid = 'public.tasks'::regclass`);
  console.log('\nAll tasks constraints:');
  res3.rows.forEach(c => console.log('  ' + c.conname + ': ' + c.def));

  // Products tags column type
  const res4 = await db.query("SELECT column_name, udt_name, data_type FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'tags'");
  console.log('\nProducts.tags column type:', res4.rows[0]?.udt_name, res4.rows[0]?.data_type);

  process.exit(0);
}
check();
