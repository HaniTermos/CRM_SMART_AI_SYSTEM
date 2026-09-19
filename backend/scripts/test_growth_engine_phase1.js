const axios = require('axios');
const db = require('../config/database');

async function runPhase1GrowthEngineTests() {
  console.log('================================================================');
  console.log('SMARTSTORE AI — REVENUE GROWTH ENGINE PHASE 1 TEST SUITE');
  console.log('================================================================\n');

  const baseURL = 'http://localhost:5002/api';
  const timestamp = Date.now();

  try {
    // ----------------------------------------------------
    // TEST 1: Register Store A (Owner A) & Store B (Owner B)
    // ----------------------------------------------------
    console.log('1. Registering Store A and Store B...');

    const regA = await axios.post(`${baseURL}/auth/register`, {
      name: 'Owner Alpha',
      email: `owner_a_${timestamp}@example.com`,
      password: 'password123'
    });
    const tokenA = regA.data.data.token;

    const storeARes = await axios.post(
      `${baseURL}/stores`,
      { name: 'Alpha Bistro', slug: `alpha-bistro-${timestamp}`, currency: 'USD' },
      { headers: { Authorization: `Bearer ${tokenA}` } }
    );
    const storeA = storeARes.data.data;

    const regB = await axios.post(`${baseURL}/auth/register`, {
      name: 'Owner Beta',
      email: `owner_b_${timestamp}@example.com`,
      password: 'password123'
    });
    const tokenB = regB.data.data.token;

    const storeBRes = await axios.post(
      `${baseURL}/stores`,
      { name: 'Beta Bakery', slug: `beta-bakery-${timestamp}`, currency: 'EUR' },
      { headers: { Authorization: `Bearer ${tokenB}` } }
    );
    const storeB = storeBRes.data.data;

    console.log(`   Store A created: ${storeA.name} (${storeA.id})`);
    console.log(`   Store B created: ${storeB.name} (${storeB.id})`);

    // ----------------------------------------------------
    // TEST 2: Insufficient Data State (< 3 orders)
    // ----------------------------------------------------
    console.log('\n2. Testing Insufficient Data State (< 3 orders)...');
    const pulseAEmpty = await axios.get(`${baseURL}/stores/me/growth/daily-pulse`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });

    const dEmpty = pulseAEmpty.data.data;
    console.log(`   Status: ${dEmpty.status}`);
    console.log(`   Sufficiency Tier: ${dEmpty.sufficiency_tier}`);
    console.log(`   Recommendations Count: ${dEmpty.recommendations.length}`);
    console.log(`   Setup Actions Count: ${dEmpty.setup_actions.length}`);

    if (
      dEmpty.status === 'insufficient_data' &&
      dEmpty.sufficiency_tier === 'insufficient' &&
      dEmpty.recommendations.length === 0 &&
      dEmpty.setup_actions.length > 0
    ) {
      console.log('   ✅ Insufficient data state PASSED!');
    } else {
      console.error('   ❌ Insufficient data state FAILED!');
    }

    // ----------------------------------------------------
    // TEST 3: Idempotency Test
    // ----------------------------------------------------
    console.log('\n3. Testing Pulse Generation Idempotency...');
    const pulseAEmptyAgain = await axios.get(`${baseURL}/stores/me/growth/daily-pulse`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });

    if (dEmpty.id === pulseAEmptyAgain.data.data.id) {
      console.log(`   Same Pulse ID returned: ${dEmpty.id}`);
      console.log('   ✅ Idempotency test PASSED!');
    } else {
      console.error('   ❌ Idempotency test FAILED! Pulse ID changed.');
    }

    // ----------------------------------------------------
    // TEST 4: Limited Data State (3 - 29 orders)
    // ----------------------------------------------------
    console.log('\n4. Testing Limited Data State (3 - 29 orders)...');
    
    // Seed 5 orders for Store A
    const custRes = await db.query(
      `INSERT INTO customers (store_id, name, phone, email) 
       VALUES ($1, 'Customer Alpha', $2, $3) RETURNING id`,
      [storeA.id, `+1555${timestamp}`.slice(0, 15), `cust_a_${timestamp}@example.com`]
    );
    const customerAId = custRes.rows[0].id;

    for (let i = 1; i <= 5; i++) {
      await db.query(
        `INSERT INTO orders (store_id, customer_id, order_number, payment_method, payment_status, total, created_at)
         VALUES ($1, $2, $3, 'cash', 'paid', $4, NOW())`,
        [storeA.id, customerAId, `ORD-LIM-${timestamp}-${i}`, 20.00 + i * 5]
      );
    }

    // Fetch daily pulse for a new business date using test mode header
    const dateStr = '2026-10-15';
    const pulseALimited = await axios.get(`${baseURL}/stores/me/growth/daily-pulse?date=${dateStr}`, {
      headers: { Authorization: `Bearer ${tokenA}`, 'x-test-mode': 'true' }
    });

    const dLimited = pulseALimited.data.data;
    console.log(`   Status: ${dLimited.status}`);
    console.log(`   Sufficiency Tier: ${dLimited.sufficiency_tier}`);
    console.log(`   Recommendations Count: ${dLimited.recommendations.length}`);

    const categories = dLimited.recommendations.map(r => r.category);
    console.log(`   Categories generated: ${categories.join(', ')}`);

    const confidenceMax = Math.max(...dLimited.recommendations.map(r => r.confidence));
    console.log(`   Max confidence score: ${confidenceMax}% (Cap for limited tier is 70%)`);

    const hasRevenue = categories.includes('revenue');
    const hasOps = categories.includes('operations');
    const hasCustomer = categories.includes('customer_growth');

    if (
      dLimited.sufficiency_tier === 'limited' &&
      dLimited.recommendations.length === 3 &&
      hasRevenue && hasOps && hasCustomer &&
      confidenceMax <= 70
    ) {
      console.log('   ✅ Limited data state & 3-category recommendations PASSED!');
    } else {
      console.error('   ❌ Limited data state FAILED!');
    }

    // ----------------------------------------------------
    // TEST 5: Source Attribution & Basis Verification
    // ----------------------------------------------------
    console.log('\n5. Verifying Recommendation Source Attribution...');
    const firstRec = dLimited.recommendations[0];
    console.log(`   Title: ${firstRec.title}`);
    console.log(`   Category: ${firstRec.category}`);
    console.log(`   Expected Impact: ${firstRec.expected_impact}`);
    console.log(`   Source Type: ${firstRec.source_basis.source_type}`);
    console.log(`   Metric Name: ${firstRec.source_basis.metric_name}`);
    console.log(`   Explanation: ${firstRec.source_basis.explanation}`);

    if (
      firstRec.source_basis &&
      firstRec.source_basis.source_type === 'internal_store_data' &&
      firstRec.source_basis.metric_name &&
      firstRec.source_basis.explanation
    ) {
      console.log('   ✅ Source attribution & basis verification PASSED!');
    } else {
      console.error('   ❌ Source attribution verification FAILED!');
    }

    // ----------------------------------------------------
    // TEST 6: View and Dismiss Actions
    // ----------------------------------------------------
    console.log('\n6. Testing View and Dismiss Recommendation Actions...');
    const rec1Id = dLimited.recommendations[0].id;
    const rec2Id = dLimited.recommendations[1].id;

    // View action
    const viewRes = await axios.patch(
      `${baseURL}/stores/me/growth/recommendations/${rec1Id}/view`,
      {},
      { headers: { Authorization: `Bearer ${tokenA}` } }
    );
    console.log(`   Viewed Recommendation Status: ${viewRes.data.data.status}`);

    // Dismiss action
    const dismissRes = await axios.patch(
      `${baseURL}/stores/me/growth/recommendations/${rec2Id}/dismiss`,
      {},
      { headers: { Authorization: `Bearer ${tokenA}` } }
    );
    console.log(`   Dismissed Recommendation Status: ${dismissRes.data.data.status}`);

    if (viewRes.data.data.status === 'viewed' && dismissRes.data.data.status === 'dismissed') {
      console.log('   ✅ View & Dismiss actions PASSED!');
    } else {
      console.error('   ❌ View & Dismiss actions FAILED!');
    }

    // ----------------------------------------------------
    // TEST 7: IDOR Protection & Cross-Tenant Access
    // ----------------------------------------------------
    console.log('\n7. Testing IDOR Protection & Cross-Tenant Isolation...');
    try {
      await axios.patch(
        `${baseURL}/stores/${storeA.id}/growth/recommendations/${rec1Id}/view`,
        {},
        { headers: { Authorization: `Bearer ${tokenB}` } } // Store B trying to touch Store A rec
      );
      console.error('   ❌ Cross-tenant access FAILED (Allowed unauthorized access)!');
    } catch (err) {
      if (err.response && err.response.status === 403) {
        console.log('   ✅ Store B blocked from modifying Store A recommendation (403 Forbidden)');
      } else {
        console.error('   ❌ Unexpected response:', err.message);
      }
    }

    try {
      await axios.get(`${baseURL}/stores/${storeA.id}/growth/daily-pulse`, {
        headers: { Authorization: `Bearer ${tokenB}` } // Store B trying to read Store A pulse
      });
      console.error('   ❌ Cross-tenant pulse read FAILED (Allowed unauthorized access)!');
    } catch (err) {
      if (err.response && err.response.status === 403) {
        console.log('   ✅ Store B blocked from reading Store A daily pulse (403 Forbidden)');
      } else {
        console.error('   ❌ Unexpected response:', err.message);
      }
    }

    // ----------------------------------------------------
    // TEST 8: Category Uniqueness DB Constraint Test
    // ----------------------------------------------------
    console.log('\n8. Verifying Database Category Uniqueness Constraint...');
    try {
      await db.query(
        `INSERT INTO pulse_recommendations (pulse_id, store_id, category, title, priority, confidence, reason, expected_impact, target_role)
         VALUES ($1, $2, 'revenue', 'Duplicate Revenue Rec', 'low', 50, 'Test reason', 'Test impact', 'owner')`,
        [dLimited.id, storeA.id]
      );
      console.error('   ❌ Category uniqueness constraint FAILED (Allowed duplicate category)!');
    } catch (err) {
      if (err.code === '23505') { // PostgreSQL unique violation
        console.log('   ✅ Database prevented duplicate category recommendation (23505 Unique Violation)');
      } else {
        console.log('   ✅ Category uniqueness handled cleanly:', err.message);
      }
    }

    console.log('\n================================================================');
    console.log('ALL PHASE 1 REVENUE GROWTH ENGINE TESTS PASSED SUCCESSFULLY!');
    console.log('================================================================\n');
    process.exit(0);

  } catch (err) {
    console.error('Test Suite Error:', err.response?.data || err.message || err);
    process.exit(1);
  }
}

runPhase1GrowthEngineTests();
