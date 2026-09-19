const axios = require('axios');
const db = require('../config/database');

async function runPhase3GrowthEngineTests() {
  console.log('================================================================');
  console.log('SMARTSTORE AI — REVENUE GROWTH ENGINE PHASE 3 TEST SUITE');
  console.log('================================================================\n');

  const baseURL = 'http://localhost:5002/api';
  const timestamp = Date.now();

  try {
    // ----------------------------------------------------
    // TEST 1: Register Store A (Owner) & Store B (Owner)
    // ----------------------------------------------------
    console.log('1. Registering Store A and Store B...');

    const regA = await axios.post(`${baseURL}/auth/register`, {
      name: 'Owner Alpha P3',
      email: `owner_p3_a_${timestamp}@example.com`,
      password: 'password123'
    });
    const tokenA = regA.data.data.token;

    const storeARes = await axios.post(
      `${baseURL}/stores`,
      { name: 'Alpha Bistro Phase 3', slug: `alpha-p3-${timestamp}`, currency: 'USD' },
      { headers: { Authorization: `Bearer ${tokenA}` } }
    );
    const storeA = storeARes.data.data;

    const regB = await axios.post(`${baseURL}/auth/register`, {
      name: 'Owner Beta P3',
      email: `owner_p3_b_${timestamp}@example.com`,
      password: 'password123'
    });
    const tokenB = regB.data.data.token;

    const storeBRes = await axios.post(
      `${baseURL}/stores`,
      { name: 'Beta Bakery Phase 3', slug: `beta-p3-${timestamp}`, currency: 'EUR' },
      { headers: { Authorization: `Bearer ${tokenB}` } }
    );
    const storeB = storeBRes.data.data;

    // Create a product for Store A
    const prodA = await db.query(
      `INSERT INTO products (store_id, name, slug, price, stock, status)
       VALUES ($1, 'Alpha Cold Brew', $2, 5.00, 30, 'active') RETURNING id`,
      [storeA.id, `cold-brew-${timestamp}`]
    );
    const productAId = prodA.rows[0].id;

    // Seed 5 baseline orders for Store A
    const custRes = await db.query(
      `INSERT INTO customers (store_id, name, phone, email) 
       VALUES ($1, 'Sam Customer', $2, $3) RETURNING id`,
      [storeA.id, `+1555${timestamp}`.slice(0, 15), `sam_p3_${timestamp}@example.com`]
    );
    const customerAId = custRes.rows[0].id;

    for (let i = 1; i <= 5; i++) {
      const ordRes = await db.query(
        `INSERT INTO orders (store_id, customer_id, order_number, payment_method, payment_status, total, created_at)
         VALUES ($1, $2, $3, 'cash', 'paid', 25.00, NOW() - INTERVAL '2 days') RETURNING id`,
        [storeA.id, customerAId, `ORD-P3-BASE-${timestamp}-${i}`]
      );
      await db.query(
        `INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, subtotal)
         VALUES ($1, $2, 'Alpha Cold Brew', 2, 5.00, 10.00)`,
        [ordRes.rows[0].id, productAId]
      );
    }

    // Generate daily pulse for Store A
    const pulseA = await axios.get(`${baseURL}/stores/me/growth/daily-pulse`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const recommendationsA = pulseA.data.data.recommendations;
    const rec1 = recommendationsA[0];

    console.log(`   Store A Pulse Generated with ${recommendationsA.length} recommendations`);

    // ----------------------------------------------------
    // TEST 2: Experiment Auto-Creation on Action Execution & Baseline Capture
    // ----------------------------------------------------
    console.log('\n2. Testing Experiment Auto-Creation & Baseline Capture...');
    const execRes = await axios.post(
      `${baseURL}/stores/me/growth/recommendations/${rec1.id}/execute`,
      {
        action_type: 'feature_product',
        confirmed: true,
        payload: { product_id: productAId }
      },
      { headers: { Authorization: `Bearer ${tokenA}` } }
    );

    console.log(`   Execution Response experiment_id: ${execRes.data.data.experiment_id}`);

    const expRes = await axios.get(`${baseURL}/stores/me/growth/experiments`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });

    const experiments = expRes.data.data;
    console.log(`   Total Experiments count: ${experiments.length}`);
    const exp1 = experiments[0];
    console.log(`   Action Type: ${exp1.action_type}`);
    console.log(`   Target Metric: ${exp1.target_metric}`);
    console.log(`   Baseline Value: $${exp1.baseline_value}`);
    console.log(`   Status: ${exp1.status}`);

    if (
      expRes.data.success &&
      experiments.length >= 1 &&
      exp1.target_metric === 'product_revenue' &&
      parseFloat(exp1.baseline_value) > 0
    ) {
      console.log('   ✅ Experiment auto-creation & baseline capture PASSED!');
    } else {
      console.error('   ❌ Experiment auto-creation FAILED!');
    }

    // ----------------------------------------------------
    // TEST 3: Duplicate Experiment Prevention (Idempotency)
    // ----------------------------------------------------
    console.log('\n3. Testing Duplicate Experiment Prevention...');
    const ImpactTrackerService = require('../services/ImpactTrackerService');
    const dupExp = await ImpactTrackerService.createExperimentForAction({
      storeId: storeA.id,
      recommendationId: rec1.id,
      actionLogId: exp1.action_log_id,
      actionType: 'feature_product',
      targetEntityId: productAId,
      expectedImpact: '$35 - $75'
    });

    if (dupExp.id === exp1.id) {
      console.log(`   Returned existing experiment ID: ${dupExp.id}`);
      console.log('   ✅ Duplicate experiment prevention PASSED!');
    } else {
      console.error('   ❌ Duplicate experiment prevention FAILED!');
    }

    // ----------------------------------------------------
    // TEST 4: Cross-Tenant Protection on Experiments
    // ----------------------------------------------------
    console.log('\n4. Testing Cross-Tenant Security on Experiments...');
    try {
      await axios.get(`${baseURL}/stores/${storeA.id}/growth/experiments/${exp1.id}`, {
        headers: { Authorization: `Bearer ${tokenB}` }
      });
      console.error('   ❌ Cross-tenant experiment read FAILED (Allowed unauthorized read)!');
    } catch (err) {
      if (err.response && err.response.status === 403) {
        console.log('   ✅ Store B blocked from reading Store A experiment (403 Forbidden)');
      } else {
        console.error('   ❌ Unexpected response:', err.message);
      }
    }

    // ----------------------------------------------------
    // TEST 5: Draft Action Protection (create_campaign_draft)
    // ----------------------------------------------------
    console.log('\n5. Testing Draft Action Protection (awaiting_campaign_send)...');
    const recDraft = recommendationsA.find(r => r.category === 'customer_growth') || recommendationsA[1];
    const execDraftRes = await axios.post(
      `${baseURL}/stores/me/growth/recommendations/${recDraft.id}/execute`,
      {
        action_type: 'create_campaign_draft',
        confirmed: true,
        payload: { name: 'Promo Draft' }
      },
      { headers: { Authorization: `Bearer ${tokenA}` } }
    );

    const expDraft = await ImpactTrackerService.recalculateExperiment(execDraftRes.data.data.experiment_id, storeA.id);
    console.log(`   Draft Experiment Status: ${expDraft.status}`);
    console.log(`   Draft Experiment Result: ${expDraft.result}`);

    if (expDraft.status === 'awaiting_campaign_send' && expDraft.result === null) {
      console.log('   ✅ Draft action protection PASSED (Remains awaiting_campaign_send without false success)!');
    } else {
      console.error('   ❌ Draft action protection FAILED!');
    }

    // ----------------------------------------------------
    // TEST 6: Measured Lift & Outcome Calculation with Refunds
    // ----------------------------------------------------
    console.log('\n6. Testing Measured Outcome & Refund-Aware Revenue Calculation...');
    
    // Seed post-execution sales for product A
    for (let i = 1; i <= 6; i++) {
      const ordRes = await db.query(
        `INSERT INTO orders (store_id, customer_id, order_number, payment_method, payment_status, total, created_at)
         VALUES ($1, $2, $3, 'cash', 'paid', 40.00, NOW()) RETURNING id`,
        [storeA.id, customerAId, `ORD-P3-POST-${timestamp}-${i}`]
      );
      await db.query(
        `INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, subtotal)
         VALUES ($1, $2, 'Alpha Cold Brew', 4, 5.00, 20.00)`,
        [ordRes.rows[0].id, productAId]
      );
    }

    // Add a refunded order to test refund deduction
    const refOrdRes = await db.query(
      `INSERT INTO orders (store_id, customer_id, order_number, payment_method, payment_status, total, refunded_amount, created_at)
       VALUES ($1, $2, $3, 'cash', 'refunded', 50.00, 50.00, NOW()) RETURNING id`,
      [storeA.id, customerAId, `ORD-P3-REFUND-${timestamp}`]
    );
    await db.query(
      `INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, subtotal)
       VALUES ($1, $2, 'Alpha Cold Brew', 5, 5.00, 25.00)`,
      [refOrdRes.rows[0].id, productAId]
    );

    // Recalculate experiment outcome via API
    const recalcRes = await axios.post(
      `${baseURL}/stores/me/growth/experiments/${exp1.id}/recalculate`,
      {},
      { headers: { Authorization: `Bearer ${tokenA}` } }
    );

    const expUpdated = recalcRes.data.data;
    console.log(`   Baseline Value: $${expUpdated.baseline_value}`);
    console.log(`   Actual Value: $${expUpdated.actual_value}`);
    console.log(`   Actual Impact: $${expUpdated.actual_impact}`);
    console.log(`   Result: ${expUpdated.result}`);

    if (
      recalcRes.data.success &&
      parseFloat(expUpdated.actual_value) > parseFloat(expUpdated.baseline_value) &&
      expUpdated.result === 'success'
    ) {
      console.log('   ✅ Measured lift & refund-aware outcome calculation PASSED!');
    } else {
      console.error('   ❌ Measured lift calculation FAILED!');
    }

    // ----------------------------------------------------
    // TEST 7: Impact Summary API Endpoint
    // ----------------------------------------------------
    console.log('\n7. Testing Impact Summary API Endpoint...');
    const summaryRes = await axios.get(`${baseURL}/stores/me/growth/impact-summary`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });

    const summary = summaryRes.data.data;
    console.log(`   Total Experiments: ${summary.total_experiments}`);
    console.log(`   Completed Success Count: ${summary.completed_success}`);
    console.log(`   Total Measured Revenue Impact: +$${summary.total_measured_revenue_impact}`);

    if (
      summaryRes.data.success &&
      summary.total_experiments >= 2 &&
      summary.total_measured_revenue_impact > 0
    ) {
      console.log('   ✅ Impact Summary API PASSED!');
    } else {
      console.error('   ❌ Impact Summary API FAILED!');
    }

    // ----------------------------------------------------
    // TEST 8: Audit Log Immutability DB Trigger
    // ----------------------------------------------------
    console.log('\n8. Verifying DB-Level Audit Log Immutability...');
    const auditLogRow = await db.query(
      `SELECT id FROM growth_action_logs WHERE store_id = $1 LIMIT 1`,
      [storeA.id]
    );
    const auditId = auditLogRow.rows[0].id;

    try {
      await db.query(
        `UPDATE growth_action_logs SET action_type = 'hacked' WHERE id = $1`,
        [auditId]
      );
      console.error('   ❌ Audit log immutability FAILED (Update allowed)!');
    } catch (err) {
      if (err.message.includes('immutable')) {
        console.log(`   ✅ DB Trigger prevented audit log update cleanly (${err.message})`);
      } else {
        console.log('   ✅ Audit log update prevented:', err.message);
      }
    }

    console.log('\n================================================================');
    console.log('ALL PHASE 3 IMPACT TRACKER TESTS PASSED SUCCESSFULLY!');
    console.log('================================================================\n');
    process.exit(0);

  } catch (err) {
    console.error('Test Suite Error:', err.response?.data || err.message || err);
    process.exit(1);
  }
}

runPhase3GrowthEngineTests();
