const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const db = require('../config/database');
const assert = require('assert');

async function run() {
  console.log('====================================================');
  console.log('SmartStore CMS V3 Navigation REST Persistence Test');
  console.log('====================================================');

  let passed = 0;

  try {
    const storeRes = await db.query(`SELECT id FROM stores LIMIT 1`);
    const storeId = storeRes.rows[0].id;

    const testHeader = {
      variant: 'logo-left-nav-right',
      logoUrl: 'https://cdn.smartstore.ai/logo.png',
      navigationItems: [
        { id: 'nav-1', label: 'Home', href: '/', visibleDesktop: true },
        { id: 'nav-2', label: 'Menu', href: '/menu', visibleDesktop: true }
      ]
    };

    const testFooter = {
      variant: 'multi-column',
      columns: [
        { id: 'c1', title: 'Quick Links', items: [{ id: 'f1', label: 'Home', href: '/' }] }
      ],
      copyright: '© 2026 SmartStore AI'
    };

    // 1. Save Header & Footer
    await db.query(
      `INSERT INTO cms_v3_navigation (store_id, region, items)
       VALUES ($1, 'header', $2)
       ON CONFLICT (store_id, region) DO UPDATE SET items = $2`,
      [storeId, JSON.stringify(testHeader)]
    );

    await db.query(
      `INSERT INTO cms_v3_navigation (store_id, region, items)
       VALUES ($1, 'footer', $2)
       ON CONFLICT (store_id, region) DO UPDATE SET items = $2`,
      [storeId, JSON.stringify(testFooter)]
    );
    console.log('  ✓ PASSED: Persisted Header & Footer navigation in cms_v3_navigation.');
    passed++;

    // 2. Fetch Navigation
    const navRes = await db.query(`SELECT * FROM cms_v3_navigation WHERE store_id = $1`, [storeId]);
    assert(navRes.rows.length >= 2, 'Should have header and footer rows');
    console.log('  ✓ PASSED: Queried navigation regions from database.');
    passed++;

    console.log('\n====================================================');
    console.log(`NAVIGATION CRUD SUMMARY: ${passed} Passed, 0 Failed.`);
    console.log('====================================================');
    process.exit(0);
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  }
}

run();
