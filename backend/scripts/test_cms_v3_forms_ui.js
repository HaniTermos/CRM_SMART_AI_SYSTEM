const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const db = require('../config/database');
const assert = require('assert');

async function run() {
  console.log('====================================================');
  console.log('SmartStore CMS V3 Forms & Submissions Test Suite');
  console.log('====================================================');

  let passed = 0;

  try {
    const storeRes = await db.query(`SELECT id FROM stores LIMIT 1`);
    const storeId = storeRes.rows[0].id;

    // 1. Create Form
    const formRes = await db.query(
      `INSERT INTO cms_v3_forms (store_id, name, form_type, fields)
       VALUES ($1, 'Catering Form', 'catering', '[{"name":"email","type":"email"}]'::jsonb)
       RETURNING *`,
      [storeId]
    );
    const form = formRes.rows[0];
    assert(form.id, 'Form should be created');
    console.log('  ✓ PASSED: Created form in cms_v3_forms.');
    passed++;

    // 2. Submit Inquiry
    const subRes = await db.query(
      `INSERT INTO cms_v3_form_submissions (form_id, store_id, payload)
       VALUES ($1, $2, '{"name":"Alice","email":"alice@example.com","message":"Hello"}'::jsonb)
       RETURNING *`,
      [form.id, storeId]
    );
    assert(subRes.rows[0].id, 'Submission should be saved');
    console.log('  ✓ PASSED: Created submission in cms_v3_form_submissions.');
    passed++;

    // 3. Query Submissions
    const queryRes = await db.query(
      `SELECT * FROM cms_v3_form_submissions WHERE form_id = $1 AND store_id = $2`,
      [form.id, storeId]
    );
    assert(queryRes.rows.length >= 1, 'Should return submissions');
    console.log('  ✓ PASSED: Queried submissions inbox.');
    passed++;

    // Cleanup
    await db.query(`DELETE FROM cms_v3_forms WHERE id = $1`, [form.id]);
    console.log('  ✓ PASSED: Cleaned up test form.');
    passed++;

    console.log('\n====================================================');
    console.log(`FORMS SUMMARY: ${passed} Passed, 0 Failed.`);
    console.log('====================================================');
    process.exit(0);
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  }
}

run();
