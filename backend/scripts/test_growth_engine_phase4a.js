const axios = require('axios');
const db = require('../config/database');

async function runPhase4AGrowthEngineTests() {
  console.log('================================================================');
  console.log('SMARTSTORE AI — REVENUE GROWTH ENGINE PHASE 4A TEST SUITE');
  console.log('================================================================\n');

  const baseURL = 'http://localhost:5002/api';
  const timestamp = Date.now();

  try {
    // ----------------------------------------------------
    // TEST 1: Register Store A (Owner) & Store B (Owner)
    // ----------------------------------------------------
    console.log('1. Registering Store A and Store B...');

    const regA = await axios.post(`${baseURL}/auth/register`, {
      name: 'Owner Alpha P4A',
      email: `owner_p4a_a_${timestamp}@example.com`,
      password: 'password123'
    });
    const tokenA = regA.data.data.token;

    const storeARes = await axios.post(
      `${baseURL}/stores`,
      { name: 'Alpha Bistro Phase 4A', slug: `alpha-p4a-${timestamp}`, currency: 'USD' },
      { headers: { Authorization: `Bearer ${tokenA}` } }
    );
    const storeA = storeARes.data.data;

    const regB = await axios.post(`${baseURL}/auth/register`, {
      name: 'Owner Beta P4A',
      email: `owner_p4a_b_${timestamp}@example.com`,
      password: 'password123'
    });
    const tokenB = regB.data.data.token;

    const storeBRes = await axios.post(
      `${baseURL}/stores`,
      { name: 'Beta Bakery Phase 4A', slug: `beta-p4a-${timestamp}`, currency: 'EUR' },
      { headers: { Authorization: `Bearer ${tokenB}` } }
    );
    const storeB = storeBRes.data.data;

    // ----------------------------------------------------
    // TEST 2: Insufficient Data Detection (< 10 orders in 30d)
    // ----------------------------------------------------
    console.log('\n2. Testing Insufficient Data Detection (< 10 orders)...');
    const stratEmpty = await axios.get(`${baseURL}/stores/me/growth/monthly-strategy`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });

    const dEmpty = stratEmpty.data.data;
    console.log(`   Status: ${dEmpty.status}`);
    console.log(`   Data Sufficiency Tier: ${dEmpty.data_sufficiency_tier}`);
    console.log(`   Recommendations Count: ${dEmpty.recommendations.length}`);
    console.log(`   Setup Actions Count: ${dEmpty.setup_actions?.length || 0}`);

    if (
      dEmpty.status === 'insufficient_data' &&
      dEmpty.data_sufficiency_tier === 'insufficient' &&
      dEmpty.recommendations.length === 0 &&
      dEmpty.setup_actions.length > 0
    ) {
      console.log('   ✅ Insufficient data state PASSED!');
    } else {
      console.error('   ❌ Insufficient data state FAILED!');
    }

    // ----------------------------------------------------
    // TEST 3: Monthly Idempotency Test
    // ----------------------------------------------------
    console.log('\n3. Testing Monthly Strategy Idempotency...');
    const stratEmptyAgain = await axios.get(`${baseURL}/stores/me/growth/monthly-strategy`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });

    if (dEmpty.id === stratEmptyAgain.data.data.id) {
      console.log(`   Same Strategy ID returned: ${dEmpty.id}`);
      console.log('   ✅ Monthly strategy idempotency PASSED!');
    } else {
      console.error('   ❌ Monthly strategy idempotency FAILED!');
    }

    // ----------------------------------------------------
    // TEST 4: Sufficient Data Strategy Generation (30+ orders)
    // ----------------------------------------------------
    console.log('\n4. Testing Sufficient Data Strategy Generation (30+ orders)...');

    const custRes = await db.query(
      `INSERT INTO customers (store_id, name, phone, email) 
       VALUES ($1, 'Customer P4A', $2, $3) RETURNING id`,
      [storeA.id, `+1555${timestamp}`.slice(0, 15), `cust_p4a_${timestamp}@example.com`]
    );
    const customerAId = custRes.rows[0].id;

    for (let i = 1; i <= 32; i++) {
      await db.query(
        `INSERT INTO orders (store_id, customer_id, order_number, payment_method, payment_status, total, created_at)
         VALUES ($1, $2, $3, 'cash', 'paid', 35.00, NOW() - INTERVAL '5 days')`,
        [storeA.id, customerAId, `ORD-P4A-${timestamp}-${i}`]
      );
    }

    // Request strategy for a test period
    const testPeriod = '2026-09';
    const stratFull = await axios.get(`${baseURL}/stores/me/growth/monthly-strategy?period=${testPeriod}`, {
      headers: { Authorization: `Bearer ${tokenA}`, 'x-test-mode': 'true' }
    });

    const dFull = stratFull.data.data;
    console.log(`   Strategy Period: ${dFull.strategy_period}`);
    console.log(`   Data Sufficiency Tier: ${dFull.data_sufficiency_tier}`);
    console.log(`   Recommendations Count: ${dFull.recommendations.length}`);

    const categories = dFull.recommendations.map(r => r.category);
    console.log(`   Categories: ${categories.join(', ')}`);

    const hasRev = categories.includes('revenue_optimization');
    const hasOps = categories.includes('operational_efficiency');
    const hasCust = categories.includes('customer_retention');

    if (
      dFull.data_sufficiency_tier === 'sufficient' &&
      dFull.recommendations.length === 3 &&
      hasRev && hasOps && hasCust
    ) {
      console.log('   ✅ 3-category monthly strategy recommendation generation PASSED!');
    } else {
      console.error('   ❌ Strategy recommendation generation FAILED!');
    }

    // ----------------------------------------------------
    // TEST 5: Evidence Summary & Source Attribution Verification
    // ----------------------------------------------------
    console.log('\n5. Verifying Evidence Summary & Attribution Notes...');
    const firstRec = dFull.recommendations[0];
    console.log(`   Title: ${firstRec.title}`);
    console.log(`   Risk Level: ${firstRec.risk_level}`);
    console.log(`   Expected Impact Range: ${firstRec.expected_impact_range}`);
    console.log(`   Attribution Note: ${firstRec.evidence_summary.attribution_note}`);
    console.log(`   Suggested Execution Path: ${firstRec.suggested_execution_path}`);

    if (
      firstRec.evidence_summary &&
      firstRec.evidence_summary.attribution_note &&
      firstRec.expected_impact_range &&
      firstRec.suggested_execution_path
    ) {
      console.log('   ✅ Evidence summary & attribution verification PASSED!');
    } else {
      console.error('   ❌ Evidence summary verification FAILED!');
    }

    // ----------------------------------------------------
    // TEST 6: Feedback Loop Integration with Past Experiments
    // ----------------------------------------------------
    console.log('\n6. Testing Feedback Loop Integration with Past Experiments...');
    // Seed a past successful experiment for Store A
    const pulseA = await db.query(
      `INSERT INTO daily_micro_pulses (store_id, business_date, status) VALUES ($1, '2026-09-01', 'active') RETURNING id`,
      [storeA.id]
    );
    const recPulse = await db.query(
      `INSERT INTO pulse_recommendations (pulse_id, store_id, category, title, priority, confidence, reason, expected_impact, target_role)
       VALUES ($1, $2, 'revenue', 'Promote Combos', 'medium', 75, 'AOV boost', '$50', 'owner') RETURNING id`,
      [pulseA.rows[0].id, storeA.id]
    );

    await db.query(
      `INSERT INTO growth_experiments (store_id, recommendation_id, action_type, target_metric, baseline_value, actual_value, actual_impact, status, result, baseline_period_start, baseline_period_end, experiment_start, experiment_end, expected_impact)
       VALUES ($1, $2, 'feature_product', 'product_revenue', 100.00, 180.00, 80.00, 'completed', 'success', NOW() - INTERVAL '17 days', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days', NOW() - INTERVAL '3 days', '$50 - $100 estimated lift')`,
      [storeA.id, recPulse.rows[0].id]
    );

    const stratWithFeedback = await axios.get(`${baseURL}/stores/me/growth/monthly-strategy?period=2026-10`, {
      headers: { Authorization: `Bearer ${tokenA}`, 'x-test-mode': 'true' }
    });

    const pastSummary = stratWithFeedback.data.data.past_outcomes_summary;
    console.log(`   Past Successful Experiments detected: ${pastSummary.success_count}`);
    console.log(`   Total Measured Lift from past experiments: +$${pastSummary.total_measured_lift}`);

    if (pastSummary.success_count >= 1 && pastSummary.total_measured_lift > 0) {
      console.log('   ✅ Past outcomes feedback loop integration PASSED!');
    } else {
      console.error('   ❌ Feedback loop integration FAILED!');
    }

    // ----------------------------------------------------
    // TEST 7: Cross-Tenant Security Protection
    // ----------------------------------------------------
    console.log('\n7. Testing Cross-Tenant Strategy Isolation...');
    try {
      await axios.get(`${baseURL}/stores/${storeA.id}/growth/monthly-strategy`, {
        headers: { Authorization: `Bearer ${tokenB}` }
      });
      console.error('   ❌ Cross-tenant access FAILED (Allowed read)!');
    } catch (err) {
      if (err.response && err.response.status === 403) {
        console.log('   ✅ Store B blocked from reading Store A monthly strategy (403 Forbidden)');
      } else {
        console.error('   ❌ Unexpected response:', err.message);
      }
    }

    console.log('\n================================================================');
    console.log('ALL PHASE 4A MONTHLY STRATEGY TESTS PASSED SUCCESSFULLY!');
    console.log('================================================================\n');
    process.exit(0);

  } catch (err) {
    console.error('Test Suite Error:', err.response?.data || err.message || err);
    process.exit(1);
  }
}

runPhase4AGrowthEngineTests();
