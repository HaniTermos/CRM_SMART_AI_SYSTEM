require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const db = require('../config/database');
const ReportService = require('../services/ReportService');

async function testReportsAnalytics() {
  console.log('[Test] Starting Reports Analytics Test Suite...');
  let passed = 0;
  let failed = 0;

  function assert(cond, msg) {
    if (cond) {
      console.log(`  ✓ ${msg}`);
      passed++;
    } else {
      console.error(`  ✕ FAIL: ${msg}`);
      failed++;
    }
  }

  try {
    const storeRes = await db.query(`SELECT id FROM stores LIMIT 1`);
    const store_id = storeRes.rows[0].id;

    // 1. Overview Report
    const overview = await ReportService.getOverviewReport(store_id);
    assert(overview && overview.revenue !== undefined && overview.freshness === 'realtime', 'Generated Overview report payload');

    // 2. Sales Report
    const sales = await ReportService.getSalesReport(store_id);
    assert(sales && Array.isArray(sales.sales_trend), 'Generated Sales report payload with sales_trend array');

    // 3. Menu Performance Report
    const menu = await ReportService.getMenuPerformanceReport(store_id);
    assert(menu && Array.isArray(menu.items), 'Generated Menu Performance report payload with items array');

    // 4. Guests Report
    const guests = await ReportService.getGuestsReport(store_id);
    assert(guests && Array.isArray(guests.guests), 'Generated Guests report payload with guests array');

    // 5. Inventory Profit Report
    const inventory = await ReportService.getInventoryProfitReport(store_id);
    assert(inventory && Array.isArray(inventory.inventory), 'Generated Inventory Profit report payload with inventory array');

    // 6. Operations Report
    const ops = await ReportService.getOperationsReport(store_id);
    assert(ops && ops.metrics !== undefined, 'Generated Operations report payload');

    // 7. Staff Report
    const staff = await ReportService.getStaffReport(store_id);
    assert(staff && Array.isArray(staff.staff), 'Generated Staff report payload');

    // 8. Marketing Report
    const mkt = await ReportService.getMarketingReport(store_id);
    assert(mkt && Array.isArray(mkt.campaigns), 'Generated Marketing report payload');

    // 9. Forecast Accuracy Report
    const forecast = await ReportService.getForecastAccuracyReport(store_id);
    assert(forecast && Array.isArray(forecast.forecast_data), 'Generated Forecast Accuracy report payload');

    console.log(`\nReports Analytics Tests: ${passed} Passed, ${failed} Failed.`);
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('[Test] Unexpected error in Reports test:', err);
    process.exit(1);
  }
}

testReportsAnalytics();
