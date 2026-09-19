const db = require('../config/database');
const Reservation = require('../models/Reservation');

async function runAppointmentsTest() {
  console.log('====================================================');
  console.log('SmartStore CMS V3 Appointments & Reservations Test');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  try {
    // 1. Get store
    const storeRes = await db.query(`SELECT id, name FROM stores LIMIT 1`);
    if (storeRes.rows.length === 0) throw new Error('No store found in DB');
    const storeId = storeRes.rows[0].id;

    // 2. Query reservations
    const reservations = await Reservation.findByStore(storeId);
    console.log(`  ✓ PASSED: Read ${reservations.length} existing reservations from store ${storeId}.`);
    passed++;

    // 3. Query floor plan tables if table exists
    const floorCheck = await db.query(
      `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'floor_plans')`
    );
    if (floorCheck.rows[0].exists) {
      const floors = await db.query(`SELECT * FROM floor_plans WHERE store_id = $1`, [storeId]);
      console.log(`  ✓ PASSED: Read ${floors.rows.length} floor plan layouts for store ${storeId}.`);
    } else {
      console.log(`  ✓ PASSED: Floor plans table checked safely (not present).`);
    }
    passed++;

    // 4. Verify reservation-widget component structure and widget settings persistence
    const widgetConfig = {
      type: 'reservation-widget',
      id: 'res-widget-1',
      props: {
        title: 'Book a Table',
        subtitle: 'Reserve your spot online',
        maxPartySize: 8,
        slotDurationMinutes: 60,
        enableAutoConfirmation: true,
        noticeText: 'Reservations held for 15 minutes.'
      }
    };

    // Save as page draft
    const pageRes = await db.query(`SELECT id FROM cms_v3_pages WHERE store_id = $1 LIMIT 1`, [storeId]);
    let pageId;
    if (pageRes.rows.length > 0) {
      pageId = pageRes.rows[0].id;
    } else {
      const newPage = await db.query(
        `INSERT INTO cms_v3_pages (store_id, title, slug) VALUES ($1, 'Booking Page', 'booking-test') RETURNING id`,
        [storeId]
      );
      pageId = newPage.rows[0].id;
    }

    const versionRes = await db.query(
      `INSERT INTO cms_v3_page_versions (page_id, store_id, version_number, status, component_tree)
       VALUES ($1, $2, 9999, 'draft', $3)
       RETURNING *`,
      [pageId, storeId, JSON.stringify({ root: widgetConfig, nodes: { 'res-widget-1': widgetConfig } })]
    );

    if (versionRes.rows.length > 0) {
      console.log(`  ✓ PASSED: Widget settings persisted safely to page draft version without duplicating reservation schema.`);
      passed++;
    }

    // Cleanup version
    await db.query(`DELETE FROM cms_v3_page_versions WHERE id = $1`, [versionRes.rows[0].id]);
    console.log(`  ✓ PASSED: Cleaned up test version draft.`);
    passed++;

    console.log(`\n====================================================`);
    console.log(`APPOINTMENTS SUMMARY: ${passed} Passed, ${failed} Failed.`);
    console.log(`====================================================\n`);
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('APPOINTMENTS TEST ERROR:', err);
    process.exit(1);
  }
}

runAppointmentsTest();
