require('dotenv').config();
const db = require('../config/database');
async function check() {
  const r = await db.query(`SELECT conname, pg_get_constraintdef(oid) as def FROM pg_constraint WHERE conname = 'orders_payment_method_check'`);
  console.log(JSON.stringify(r.rows, null, 2));
  process.exit(0);
}
check();
