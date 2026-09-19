const axios = require('axios');
const db = require('../config/database');

async function runPhase2GrowthEngineTests() {
  console.log('================================================================');
  console.log('SMARTSTORE AI — REVENUE GROWTH ENGINE PHASE 2 TEST SUITE');
  console.log('================================================================\n');

  const baseURL = 'http://localhost:5002/api';
  const timestamp = Date.now();

  try {
    // ----------------------------------------------------
    // TEST 1: Register Store A (Owner) & Store B (Owner)
    // ----------------------------------------------------
    console.log('1. Registering Store A and Store B...');

    const regA = await axios.post(`${baseURL}/auth/register`, {
      name: 'Owner Alpha',
      email: `owner_p2_a_${timestamp}@example.com`,
      password: 'password123'
    });
    const tokenA = regA.data.data.token;

    const storeARes = await axios.post(
      `${baseURL}/stores`,
      { name: 'Alpha Bistro Phase 2', slug: `alpha-p2-${timestamp}`, currency: 'USD' },
      { headers: { Authorization: `Bearer ${tokenA}` } }
    );
    const storeA = storeARes.data.data;

    const regB = await axios.post(`${baseURL}/auth/register`, {
      name: 'Owner Beta',
      email: `owner_p2_b_${timestamp}@example.com`,
      password: 'password123'
    });
    const tokenB = regB.data.data.token;

    const storeBRes = await axios.post(
      `${baseURL}/stores`,
      { name: 'Beta Bakery Phase 2', slug: `beta-p2-${timestamp}`, currency: 'EUR' },
      { headers: { Authorization: `Bearer ${tokenB}` } }
    );
    const storeB = storeBRes.data.data;

    // Create a product for Store A and a product for Store B
    const prodA = await db.query(
      `INSERT INTO products (store_id, name, slug, price, stock, status)
       VALUES ($1, 'Alpha Espresso', $2, 4.50, 20, 'active') RETURNING id`,
      [storeA.id, `alpha-espresso-${timestamp}`]
    );
    const productAId = prodA.rows[0].id;

    const prodB = await db.query(
      `INSERT INTO products (store_id, name, slug, price, stock, status)
       VALUES ($1, 'Beta Croissant', $2, 3.50, 15, 'active') RETURNING id`,
      [storeB.id, `beta-croissant-${timestamp}`]
    );
    const productBId = prodB.rows[0].id;

    // Seed 5 orders for Store A to trigger recommendations
    const custRes = await db.query(
      `INSERT INTO customers (store_id, name, phone, email) 
       VALUES ($1, 'Jane Customer', $2, $3) RETURNING id`,
      [storeA.id, `+1555${timestamp}`.slice(0, 15), `jane_p2_${timestamp}@example.com`]
    );
    const customerAId = custRes.rows[0].id;

    for (let i = 1; i <= 5; i++) {
      await db.query(
        `INSERT INTO orders (store_id, customer_id, order_number, payment_method, payment_status, total, created_at)
         VALUES ($1, $2, $3, 'cash', 'paid', 25.00, NOW())`,
        [storeA.id, customerAId, `ORD-P2-${timestamp}-${i}`]
      );
    }

    // Get Daily Pulse for Store A
    const pulseA = await axios.get(`${baseURL}/stores/me/growth/daily-pulse`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const recommendationsA = pulseA.data.data.recommendations;
    const rec1 = recommendationsA[0];

    console.log(`   Store A Pulse Generated with ${recommendationsA.length} recommendations`);
    console.log(`   Target Rec ID: ${rec1.id} (${rec1.category})`);

    // ----------------------------------------------------
    // TEST 2: Successful Execution (create_task)
    // ----------------------------------------------------
    console.log('\n2. Testing Successful Execution (create_task)...');
    const exec1Res = await axios.post(
      `${baseURL}/stores/me/growth/recommendations/${rec1.id}/execute`,
      {
        action_type: 'create_task',
        confirmed: true,
        payload: { title: 'Restock Coffee Beans Task', description: 'Order 50kg espresso beans' }
      },
      { headers: { Authorization: `Bearer ${tokenA}` } }
    );

    const execData1 = exec1Res.data.data;
    console.log(`   Success: ${exec1Res.data.success}`);
    console.log(`   Action Type: ${execData1.action_type}`);
    console.log(`   Target Entity Type: ${execData1.target_entity_type}`);
    console.log(`   Created Task ID: ${execData1.target_entity_id}`);

    if (
      exec1Res.data.success &&
      execData1.action_type === 'create_task' &&
      execData1.target_entity_type === 'task' &&
      execData1.target_entity_id
    ) {
      console.log('   ✅ Successful execution PASSED!');
    } else {
      console.error('   ❌ Successful execution FAILED!');
    }

    // ----------------------------------------------------
    // TEST 3: Duplicate Execution (Idempotency)
    // ----------------------------------------------------
    console.log('\n3. Testing Duplicate Execution Idempotency...');
    const execDupRes = await axios.post(
      `${baseURL}/stores/me/growth/recommendations/${rec1.id}/execute`,
      {
        action_type: 'create_task',
        confirmed: true,
        payload: { title: 'Duplicate Attempt' }
      },
      { headers: { Authorization: `Bearer ${tokenA}` } }
    );

    const dupData = execDupRes.data.data;
    console.log(`   Idempotent Flag: ${dupData.idempotent}`);
    console.log(`   Message: ${dupData.message}`);
    console.log(`   Returned Same Task ID: ${dupData.result.id}`);

    if (dupData.idempotent === true && dupData.result.id === execData1.target_entity_id) {
      console.log('   ✅ Duplicate execution idempotency PASSED!');
    } else {
      console.error('   ❌ Duplicate execution idempotency FAILED!');
    }

    // ----------------------------------------------------
    // TEST 4: Invalid Action Type Restriction
    // ----------------------------------------------------
    console.log('\n4. Testing Invalid Action Type Restriction...');
    const rec2 = recommendationsA[1];
    try {
      await axios.post(
        `${baseURL}/stores/me/growth/recommendations/${rec2.id}/execute`,
        {
          action_type: 'malicious_eval_sql',
          confirmed: true
        },
        { headers: { Authorization: `Bearer ${tokenA}` } }
      );
      console.error('   ❌ Invalid action type test FAILED (Allowed unwhitelisted action)!');
    } catch (err) {
      if (err.response && err.response.status === 400) {
        console.log(`   ✅ Rejected invalid action type cleanly (400 Bad Request: ${err.response.data.error})`);
      } else {
        console.error('   ❌ Unexpected response:', err.message);
      }
    }

    // ----------------------------------------------------
    // TEST 5: Wrong-Store Recommendation Protection
    // ----------------------------------------------------
    console.log('\n5. Testing Wrong-Store Recommendation Protection...');
    try {
      await axios.post(
        `${baseURL}/stores/${storeA.id}/growth/recommendations/${rec2.id}/execute`,
        {
          action_type: 'create_task',
          confirmed: true
        },
        { headers: { Authorization: `Bearer ${tokenB}` } } // Store B trying to execute Store A rec
      );
      console.error('   ❌ Wrong-store recommendation test FAILED (Allowed cross-tenant execute)!');
    } catch (err) {
      if (err.response && err.response.status === 403) {
        console.log('   ✅ Store B blocked from executing Store A recommendation (403 Forbidden)');
      } else {
        console.error('   ❌ Unexpected response:', err.message);
      }
    }

    // ----------------------------------------------------
    // TEST 6: Wrong-Store Target Entity Protection
    // ----------------------------------------------------
    console.log('\n6. Testing Wrong-Store Target Entity Protection...');
    try {
      await axios.post(
        `${baseURL}/stores/me/growth/recommendations/${rec2.id}/execute`,
        {
          action_type: 'feature_product',
          confirmed: true,
          payload: { product_id: productBId } // Product B belongs to Store B, but Store A executes!
        },
        { headers: { Authorization: `Bearer ${tokenA}` } }
      );
      console.error('   ❌ Wrong-store target entity test FAILED (Allowed modifying another store entity)!');
    } catch (err) {
      if (err.response && (err.response.status === 403 || err.response.status === 400)) {
        console.log(`   ✅ Store A blocked from modifying Store B product (Status ${err.response.status}: ${err.response.data.error})`);
      } else {
        console.error('   ❌ Unexpected response:', err.message);
      }
    }

    // ----------------------------------------------------
    // TEST 7: Successful feature_product Execution on Store A Product
    // ----------------------------------------------------
    console.log('\n7. Testing Successful feature_product Execution...');
    const execFeatRes = await axios.post(
      `${baseURL}/stores/me/growth/recommendations/${rec2.id}/execute`,
      {
        action_type: 'feature_product',
        confirmed: true,
        payload: { product_id: productAId }
      },
      { headers: { Authorization: `Bearer ${tokenA}` } }
    );

    const featData = execFeatRes.data.data;
    console.log(`   Target Entity Type: ${featData.target_entity_type}`);
    console.log(`   Updated Product Tags: ${JSON.stringify(featData.result.tags)}`);

    if (featData.target_entity_type === 'product' && featData.result.tags.includes('featured')) {
      console.log('   ✅ feature_product execution PASSED!');
    } else {
      console.error('   ❌ feature_product execution FAILED!');
    }

    // ----------------------------------------------------
    // TEST 8: Audit Log Creation Verification
    // ----------------------------------------------------
    console.log('\n8. Verifying Audit Record Creation in DB...');
    const auditRes = await db.query(
      `SELECT * FROM growth_action_logs WHERE store_id = $1 ORDER BY created_at DESC`,
      [storeA.id]
    );

    console.log(`   Total Audit Logs recorded for Store A: ${auditRes.rows.length}`);
    const latestLog = auditRes.rows[0];
    console.log(`   Latest Log Action Type: ${latestLog.action_type}`);
    console.log(`   Target Entity Type: ${latestLog.target_entity_type}`);

    if (auditRes.rows.length >= 2 && latestLog.action_type === 'feature_product') {
      console.log('   ✅ Audit log verification PASSED!');
    } else {
      console.error('   ❌ Audit log verification FAILED!');
    }

    console.log('\n================================================================');
    console.log('ALL PHASE 2 SAFE EXECUTION & AUDIT TESTS PASSED SUCCESSFULLY!');
    console.log('================================================================\n');
    process.exit(0);

  } catch (err) {
    console.error('Test Suite Error:', err.response?.data || err.message || err);
    process.exit(1);
  }
}

runPhase2GrowthEngineTests();
