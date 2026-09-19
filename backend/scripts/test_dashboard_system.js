require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const db = require('../config/database');
const DashboardService = require('../services/DashboardService');

async function testDashboardSystem() {
  console.log('[Test] Starting Dashboard System Test Suite...');
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
    const userRes = await db.query(`SELECT id FROM users LIMIT 1`);
    const store_id = storeRes.rows[0].id;
    const user_id = userRes.rows[0].id;

    // 1. Today Mode Metrics
    const todayData = await DashboardService.getDashboardMetrics(store_id, 'today', user_id);
    assert(todayData && todayData.metrics && todayData.metrics.today_sales !== undefined, 'Generated Today mode dashboard metrics');

    // 2. Growth Mode Metrics
    const growthData = await DashboardService.getDashboardMetrics(store_id, 'growth', user_id);
    assert(growthData && growthData.metrics && growthData.metrics.sales_7d !== undefined, 'Generated Growth mode dashboard metrics');

    // 3. User Layout Persistence
    const mockLayout = [{ widget: 'sales_card', x: 0, y: 0, w: 4, h: 2 }];
    const saved = await DashboardService.saveUserLayout(user_id, store_id, 'custom', mockLayout);
    assert(saved && saved.id, 'Saved custom user dashboard layout');

    const fetchedCustom = await DashboardService.getDashboardMetrics(store_id, 'custom', user_id);
    assert(fetchedCustom.saved_layout && fetchedCustom.saved_layout.length === 1, 'Retrieved saved custom user dashboard layout');

    // Cleanup
    await db.query(`DELETE FROM user_dashboard_layouts WHERE id = $1`, [saved.id]);

    console.log(`\nDashboard System Tests: ${passed} Passed, ${failed} Failed.`);
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('[Test] Unexpected error in Dashboard test:', err);
    process.exit(1);
  }
}

testDashboardSystem();
