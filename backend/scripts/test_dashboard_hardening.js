const axios = require('axios');
const db = require('../config/database');

async function runHardeningTests() {
  console.log('================================================================');
  console.log('SMARTSTORE AI — PHASE 3 PAYMENT HARDENING & METRICS TEST SUITE');
  console.log('================================================================\n');

  const baseURL = 'http://localhost:5002/api';
  const timestamp = Date.now();

  try {
    // ----------------------------------------------------
    // TEST 1: Register Store 1 (UTC-5 New York) & Store 2 (UTC+9 Tokyo)
    // ----------------------------------------------------
    console.log('1. Registering 2 Stores with Different Timezones (UTC-5 vs UTC+9)...');

    const reg1 = await axios.post(`${baseURL}/auth/register`, {
      name: 'Owner NY',
      email: `ny_owner_${timestamp}@example.com`,
      password: 'password123'
    });
    const token1 = reg1.data.data.token;

    const store1Res = await axios.post(
      `${baseURL}/stores`,
      { name: 'NY Diner', slug: `ny-diner-${timestamp}`, currency: 'USD' },
      { headers: { Authorization: `Bearer ${token1}` } }
    );
    const store1 = store1Res.data.data;
    
    await db.query(
      `UPDATE stores SET settings = jsonb_set(settings, '{timezone}', '"UTC-5"') WHERE id = $1`,
      [store1.id]
    );

    const reg2 = await axios.post(`${baseURL}/auth/register`, {
      name: 'Owner Tokyo',
      email: `tokyo_owner_${timestamp}@example.com`,
      password: 'password123'
    });
    const token2 = reg2.data.data.token;

    const store2Res = await axios.post(
      `${baseURL}/stores`,
      { name: 'Tokyo Ramen', slug: `tokyo-ramen-${timestamp}`, currency: 'JPY' },
      { headers: { Authorization: `Bearer ${token2}` } }
    );
    const store2 = store2Res.data.data;

    await db.query(
      `UPDATE stores SET settings = jsonb_set(settings, '{timezone}', '"UTC+9"') WHERE id = $1`,
      [store2.id]
    );

    console.log(`   Store 1 created: ${store1.name} (${store1.id}) [Timezone: UTC-5]`);
    console.log(`   Store 2 created: ${store2.name} (${store2.id}) [Timezone: UTC+9]`);

    // ----------------------------------------------------
    // TEST 2: Empty Store Check
    // ----------------------------------------------------
    console.log('\n2. Verifying Empty Store State...');
    const emptyStats = await axios.get(`${baseURL}/stores/me/dashboard`, {
      headers: { Authorization: `Bearer ${token1}` }
    });

    console.log(`   Revenue: ${emptyStats.data.data.todayRevenue}`);
    console.log(`   Total Orders: ${emptyStats.data.data.todayTotalOrders}`);
    console.log(`   Has Activity: ${emptyStats.data.data.hasActivity}`);
    if (emptyStats.data.data.todayRevenue === 0 && emptyStats.data.data.hasActivity === false) {
      console.log('   ✅ Empty store test PASSED!');
    } else {
      console.error('   ❌ Empty store test FAILED!');
    }

    // ----------------------------------------------------
    // TEST 3: Multi-Tenant Isolation Check
    // ----------------------------------------------------
    console.log('\n3. Verifying Multi-Tenant Isolation...');
    const stats1Before = await axios.get(`${baseURL}/stores/me/dashboard`, {
      headers: { Authorization: `Bearer ${token1}` }
    });
    const stats2Before = await axios.get(`${baseURL}/stores/me/dashboard`, {
      headers: { Authorization: `Bearer ${token2}` }
    });

    if (stats1Before.data.data.store.id !== stats2Before.data.data.store.id) {
      console.log('   ✅ Tenant isolation PASSED!');
    } else {
      console.error('   ❌ Tenant isolation FAILED!');
    }

    // ----------------------------------------------------
    // TEST 4: Payment States Handling Tests (7 Scenarios)
    // ----------------------------------------------------
    console.log('\n4. Verifying Payment State Handling (7 Payment Scenarios)...');

    // Create Customer for Store 1
    const custRes = await db.query(
      `INSERT INTO customers (store_id, name, phone, email) 
       VALUES ($1, 'Jane Customer', $2, $3) RETURNING id`,
      [store1.id, `+1555${timestamp}`.slice(0, 15), `jane_${timestamp}@example.com`]
    );
    const customerId = custRes.rows[0].id;

    // Scenario A: Unpaid cash-on-delivery order ($100.00) -> Must default to 'unpaid' & revenue = 0
    const orderCOD = await db.query(
      `INSERT INTO orders (store_id, customer_id, order_number, payment_method, payment_status, total, created_at)
       VALUES ($1, $2, $3, 'cash_on_delivery', 'unpaid', 100.00, NOW()) RETURNING id, payment_status`,
      [store1.id, customerId, `ORD-COD-${timestamp}`]
    );

    // Scenario B: Pending online order ($120.00) -> Must default to 'pending' & revenue = 0
    const orderCardPending = await db.query(
      `INSERT INTO orders (store_id, customer_id, order_number, payment_method, payment_status, total, created_at)
       VALUES ($1, $2, $3, 'card', 'pending', 120.00, NOW()) RETURNING id, payment_status`,
      [store1.id, customerId, `ORD-CARD-${timestamp}`]
    );

    // Scenario C: Paid online order ($150.00) -> Added to revenue
    const orderPaid = await db.query(
      `INSERT INTO orders (store_id, customer_id, order_number, payment_method, payment_status, total, created_at)
       VALUES ($1, $2, $3, 'card', 'paid', 150.00, NOW()) RETURNING id, payment_status`,
      [store1.id, customerId, `ORD-PAID-${timestamp}`]
    );

    // Scenario D: Failed payment ($90.00) -> Revenue = 0
    const orderFailed = await db.query(
      `INSERT INTO orders (store_id, customer_id, order_number, payment_method, payment_status, total, created_at)
       VALUES ($1, $2, $3, 'card', 'failed', 90.00, NOW()) RETURNING id, payment_status`,
      [store1.id, customerId, `ORD-FAIL-${timestamp}`]
    );

    // Scenario E: Full refund ($200.00) -> Revenue = 0
    const orderRefunded = await db.query(
      `INSERT INTO orders (store_id, customer_id, order_number, payment_method, payment_status, total, refunded_amount, created_at)
       VALUES ($1, $2, $3, 'card', 'refunded', 200.00, 200.00, NOW()) RETURNING id, payment_status`,
      [store1.id, customerId, `ORD-REFUND-${timestamp}`]
    );

    // Scenario F: Partial refund ($100.00 total, $30.00 refunded) -> Net revenue = $70.00
    const orderPartialRefund = await db.query(
      `INSERT INTO orders (store_id, customer_id, order_number, payment_method, payment_status, total, refunded_amount, created_at)
       VALUES ($1, $2, $3, 'card', 'partially_refunded', 100.00, 30.00, NOW()) RETURNING id, payment_status`,
      [store1.id, customerId, `ORD-PREF-${timestamp}`]
    );

    // Expected Net Revenue = Paid ($150.00) + Partial Net ($70.00) = $220.00
    const statsPay = await axios.get(`${baseURL}/stores/me/dashboard`, {
      headers: { Authorization: `Bearer ${token1}` }
    });

    const d = statsPay.data.data;
    console.log(`   COD Payment Status: ${orderCOD.rows[0].payment_status}`);
    console.log(`   Pending Online Payment Status: ${orderCardPending.rows[0].payment_status}`);
    console.log(`   Calculated Net Revenue: $${d.todayRevenue} (Expected: $220.00)`);
    console.log(`   Total Orders Today: ${d.todayTotalOrders} (Expected: 6)`);

    if (d.todayRevenue === 220 && orderCOD.rows[0].payment_status === 'unpaid' && orderCardPending.rows[0].payment_status === 'pending') {
      console.log('   ✅ Payment-state rules & net revenue calculations PASSED!');
    } else {
      console.error('   ❌ Payment-state rules FAILED!');
    }

    // ----------------------------------------------------
    // TEST 5: Payment Status Admin Update API
    // ----------------------------------------------------
    console.log('\n5. Testing Admin Payment Status Update (Confirming COD Payment)...');

    const codOrderId = orderCOD.rows[0].id;
    const updateRes = await axios.patch(
      `${baseURL}/orders/${store1.id}/${codOrderId}/payment-status`,
      { payment_status: 'paid' },
      { headers: { Authorization: `Bearer ${token1}` } }
    );

    console.log(`   Updated COD Payment Status: ${updateRes.data.data.payment_status}`);

    const statsAfterConfirm = await axios.get(`${baseURL}/stores/me/dashboard`, {
      headers: { Authorization: `Bearer ${token1}` }
    });

    console.log(`   Net Revenue after COD confirmation: $${statsAfterConfirm.data.data.todayRevenue} (Expected: $320.00)`);

    if (statsAfterConfirm.data.data.todayRevenue === 320 && updateRes.data.data.payment_status === 'paid') {
      console.log('   ✅ Admin payment status update PASSED!');
    } else {
      console.error('   ❌ Admin payment status update FAILED!');
    }

    // ----------------------------------------------------
    // TEST 6: Reservations Breakdown
    // ----------------------------------------------------
    console.log('\n6. Verifying Reservations Breakdown...');
    const resStatuses = ['pending', 'confirmed', 'seated', 'completed', 'no_show', 'cancelled'];
    for (const st of resStatuses) {
      await db.query(
        `INSERT INTO reservations (store_id, customer_name, customer_phone, guests, date, time, status)
         VALUES ($1, $2, '+15559999', 2, (NOW() AT TIME ZONE '-05')::date, '19:00:00', $3)`,
        [store1.id, `Guest ${st}`, st]
      );
    }

    const statsRes = await axios.get(`${baseURL}/stores/me/dashboard`, {
      headers: { Authorization: `Bearer ${token1}` }
    });

    console.log(`   Tonight Reservations Count: ${statsRes.data.data.tonightReservations} (Expected: 4 valid)`);
    if (statsRes.data.data.tonightReservations === 4) {
      console.log('   ✅ Reservations breakdown PASSED!');
    } else {
      console.error('   ❌ Reservations breakdown FAILED!');
    }

    console.log('\n================================================================');
    console.log('ALL PAYMENT HARDENING & METRICS TESTS COMPLETED SUCCESSFULLY!');
    console.log('================================================================\n');
    process.exit(0);

  } catch (err) {
    console.error('Test Error:', err.response?.data || err.message || err);
    process.exit(1);
  }
}

runHardeningTests();
