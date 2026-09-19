const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const axios = require('axios');
const db = require('../config/database');

let baseURL = process.env.API_BASE_URL || 'http://localhost:5002/api';
let api = axios.create({ baseURL, validateStatus: () => true });

async function ensureServerRunning() {
  try {
    const ping = await api.get('/health');
    if (ping.status < 500) return;
  } catch (e) {
    // Server not running on 5002, start in-process server on dynamic port
    const app = require('../server');
    return new Promise((resolve) => {
      const server = app.listen(0, () => {
        const port = server.address().port;
        baseURL = `http://localhost:${port}/api`;
        api = axios.create({ baseURL, validateStatus: () => true });
        console.log(`[TEST] Dynamic test server listening on http://localhost:${port}/api`);
        resolve();
      });
    });
  }
}


const results = { passed: 0, failed: 0, errors: [] };

function pass(msg) {
  results.passed++;
  console.log(`   ✅ ${msg}`);
}

function fail(msg, detail) {
  results.failed++;
  const errorText = `${msg}: ${detail || ''}`;
  results.errors.push(errorText);
  console.error(`   ❌ ${msg}${detail ? ` — ${detail}` : ''}`);
}

function expectStatus(res, expected, label) {
  if (res.status === expected) {
    pass(label);
    return true;
  }
  fail(label, `expected ${expected}, got ${res.status}; body=${JSON.stringify(res.data)}`);
  return false;
}

function expectNotInList(list, id, label) {
  const found = Array.isArray(list) && list.some((item) => item.id === id);
  if (!found) {
    pass(label);
    return true;
  }
  fail(label, `resource ${id} leaked into other store list`);
  return false;
}

async function registerUser(email, name) {
  const res = await api.post('/auth/register', { name, email, password: 'Password123!' });
  if (res.status !== 201 || !res.data?.data?.token) {
    throw new Error(`Register failed for ${email}: ${JSON.stringify(res.data)}`);
  }
  return { token: res.data.data.token, user: res.data.data.user };
}

async function createStore(token, name, slug, currency = 'USD') {
  const res = await api.post('/stores', { name, slug, currency }, { headers: { Authorization: `Bearer ${token}` } });
  if (res.status !== 201 || !res.data?.data?.id) {
    throw new Error(`Create store failed for ${name}: ${JSON.stringify(res.data)}`);
  }
  return res.data.data;
}

function auth(token) {
  return { headers: { Authorization: `Bearer ${token}` } };
}

async function runSuite() {
  await ensureServerRunning();
  console.log('\n================================================================');
  console.log('SMARTSTORE AI — CROSS-STORE AUTHORIZATION TEST SUITE');
  console.log('================================================================\n');

  const ts = Date.now();
  let tokenA, tokenB, tokenC;
  let userA, userB, userC;
  let storeA, storeB;

  try {
    console.log('SETUP: Registering test users and stores...');
    const regA = await registerUser(`cross_a_${ts}@example.com`, 'Cross Auth Owner A');
    tokenA = regA.token;
    userA = regA.user;
    storeA = await createStore(tokenA, 'Cross Alpha', `cross-alpha-${ts}`);

    const regB = await registerUser(`cross_b_${ts}@example.com`, 'Cross Auth Owner B');
    tokenB = regB.token;
    userB = regB.user;
    storeB = await createStore(tokenB, 'Cross Beta', `cross-beta-${ts}`);

    const regC = await registerUser(`cross_c_${ts}@example.com`, 'Cross Auth Member C');
    tokenC = regC.token;
    userC = regC.user;

    console.log(`   Store A: ${storeA.id} (${storeA.slug})`);
    console.log(`   Store B: ${storeB.id} (${storeB.slug})\n`);
  } catch (err) {
    console.error('SETUP FAILED:', err.message);
    process.exit(1);
  }

  const headersA = auth(tokenA).headers;
  const headersB = auth(tokenB).headers;

  // ============================================================
  // 1. PRODUCTS
  // ============================================================
  let productA;
  try {
    console.log('1. Products');
    const createRes = await api.post(`/products/${storeA.id}`, {
      name: 'Cross Auth Product',
      slug: `cross-prod-${ts}`,
      price: 19.99,
      stock: 100,
      status: 'active'
    }, { headers: headersA });
    if (createRes.status !== 201 || !createRes.data?.data?.id) throw new Error(JSON.stringify(createRes.data));
    productA = createRes.data.data;

    const getCross = await api.get(`/products/${storeB.id}/${productA.id}`, { headers: headersB });
    expectStatus(getCross, 404, 'Product GET from Store B blocked (404)');

    const putCross = await api.put(`/products/${storeB.id}/${productA.id}`, { name: 'Hacked Product' }, { headers: headersB });
    expectStatus(putCross, 404, 'Product PUT from Store B blocked (404)');

    const delCross = await api.delete(`/products/${storeB.id}/${productA.id}`, { headers: headersB });
    expectStatus(delCross, 404, 'Product DELETE from Store B blocked (404)');

    const getOwner = await api.get(`/products/${storeA.id}/${productA.id}`, { headers: headersA });
    expectStatus(getOwner, 200, 'Product GET by owner in Store A succeeds');

    const putOwner = await api.put(`/products/${storeA.id}/${productA.id}`, { name: 'Updated Product' }, { headers: headersA });
    expectStatus(putOwner, 200, 'Product PUT by owner in Store A succeeds');

    const delOwner = await api.delete(`/products/${storeA.id}/${productA.id}`, { headers: headersA });
    expectStatus(delOwner, 200, 'Product DELETE by owner in Store A succeeds');
    productA = null;
  } catch (err) { fail('Products block', err.message); }

  // Recreate product for dependent tests
  if (!productA) {
    try {
      const recreate = await api.post(`/products/${storeA.id}`, {
        name: 'Cross Auth Product',
        slug: `cross-prod-${ts}`,
        price: 19.99,
        stock: 100,
        status: 'active'
      }, { headers: headersA });
      if (recreate.status === 201) productA = recreate.data.data;
    } catch (err) { /* ignore */ }
  }

  // ============================================================
  // 2. CATEGORIES
  // ============================================================
  let categoryA;
  try {
    console.log('2. Categories');
    const createRes = await api.post(`/categories/${storeA.id}`, {
      name: 'Cross Auth Category',
      slug: `cross-cat-${ts}`
    }, { headers: headersA });
    if (createRes.status !== 201 || !createRes.data?.data?.id) throw new Error(JSON.stringify(createRes.data));
    categoryA = createRes.data.data;

    const listCross = await api.get(`/categories/${storeB.id}`, { headers: headersB });
    expectStatus(listCross, 200, 'Category list from Store B returns 200');
    expectNotInList(listCross.data?.data, categoryA.id, 'Store A category absent from Store B list');

    const delCross = await api.delete(`/categories/${storeB.id}/${categoryA.id}`, { headers: headersB });
    expectStatus(delCross, 404, 'Category DELETE from Store B blocked (404)');

    const listOwner = await api.get(`/categories/${storeA.id}`, { headers: headersA });
    expectStatus(listOwner, 200, 'Category list by owner in Store A succeeds');

    const delOwner = await api.delete(`/categories/${storeA.id}/${categoryA.id}`, { headers: headersA });
    expectStatus(delOwner, 200, 'Category DELETE by owner in Store A succeeds');
    categoryA = null;
  } catch (err) { fail('Categories block', err.message); }

  // ============================================================
  // 3. INVENTORY ADJUSTMENTS
  // ============================================================
  let inventoryA;
  try {
    console.log('3. Inventory adjustments');
    const createRes = await api.post(`/inventory/${storeA.id}/adjust`, {
      product_id: productA.id,
      delta: 5,
      reason: 'test adjustment',
      note: 'cross-auth'
    }, { headers: headersA });
    if (createRes.status !== 201 || !createRes.data?.data?.id) throw new Error(JSON.stringify(createRes.data));
    inventoryA = createRes.data.data;

    const listCross = await api.get(`/inventory/${storeB.id}`, { headers: headersB });
    expectStatus(listCross, 200, 'Inventory list from Store B returns 200');
    expectNotInList(listCross.data?.data, inventoryA.id, 'Store A adjustment absent from Store B list');

    const listOwner = await api.get(`/inventory/${storeA.id}`, { headers: headersA });
    expectStatus(listOwner, 200, 'Inventory list by owner in Store A succeeds');
  } catch (err) { fail('Inventory block', err.message); }

  // ============================================================
  // 4. CUSTOMERS (created via order checkout)
  // ============================================================
  let customerA, orderA;
  try {
    console.log('4. Customers');
    const checkoutRes = await api.post(`/orders/${storeA.id}/checkout`, {
      customer: { name: 'Cross Customer', phone: `+1555${ts}`.slice(0, 15), email: `cross_cust_${ts}@example.com` },
      shipping_address: { line1: '123 Main St', city: 'Anytown', country: 'US' },
      items: [{ product_id: productA.id, quantity: 1 }],
      payment_method: 'cash',
      payment_status: 'paid'
    });
    if (checkoutRes.status !== 201 || !checkoutRes.data?.data?.id) throw new Error(JSON.stringify(checkoutRes.data));
    orderA = checkoutRes.data.data;

    const orderDetails = await api.get(`/orders/${storeA.id}/${orderA.id}`, { headers: headersA });
    if (orderDetails.status !== 200 || !orderDetails.data?.data?.customer_id) throw new Error('Could not fetch customer id');
    customerA = { id: orderDetails.data.data.customer_id };

    const getCross = await api.get(`/customers/${storeB.id}/${customerA.id}`, { headers: headersB });
    expectStatus(getCross, 404, 'Customer GET from Store B blocked (404)');

    const putCross = await api.put(`/customers/${storeB.id}/${customerA.id}`, { notes: 'hacked' }, { headers: headersB });
    expectStatus(putCross, 404, 'Customer PUT from Store B blocked (404)');

    const getOwner = await api.get(`/customers/${storeA.id}/${customerA.id}`, { headers: headersA });
    expectStatus(getOwner, 200, 'Customer GET by owner in Store A succeeds');

    const putOwner = await api.put(`/customers/${storeA.id}/${customerA.id}`, { notes: 'valid update' }, { headers: headersA });
    expectStatus(putOwner, 200, 'Customer PUT by owner in Store A succeeds');
  } catch (err) { fail('Customers block', err.message); }

  // ============================================================
  // 5. ORDERS
  // ============================================================
  try {
    console.log('5. Orders');
    const getCross = await api.get(`/orders/${storeB.id}/${orderA.id}`, { headers: headersB });
    expectStatus(getCross, 404, 'Order GET from Store B blocked (404)');

    const statusCross = await api.patch(`/orders/${storeB.id}/${orderA.id}/status`, { status: 'delivered' }, { headers: headersB });
    expectStatus(statusCross, 404, 'Order status PATCH from Store B blocked (404)');

    const paymentCross = await api.patch(`/orders/${storeB.id}/${orderA.id}/payment-status`, { payment_status: 'paid' }, { headers: headersB });
    expectStatus(paymentCross, 404, 'Order payment-status PATCH from Store B blocked (404)');

    const getOwner = await api.get(`/orders/${storeA.id}/${orderA.id}`, { headers: headersA });
    expectStatus(getOwner, 200, 'Order GET by owner in Store A succeeds');

    const statusOwner = await api.patch(`/orders/${storeA.id}/${orderA.id}/status`, { status: 'confirmed' }, { headers: headersA });
    expectStatus(statusOwner, 200, 'Order status PATCH by owner in Store A succeeds');

    const paymentOwner = await api.patch(`/orders/${storeA.id}/${orderA.id}/payment-status`, { payment_status: 'paid' }, { headers: headersA });
    expectStatus(paymentOwner, 200, 'Order payment-status PATCH by owner in Store A succeeds');
  } catch (err) { fail('Orders block', err.message); }

  // ============================================================
  // 6. REVIEWS
  // ============================================================
  let reviewA;
  try {
    console.log('6. Reviews');
    const createRes = await api.post(`/reviews/${storeA.slug}/submit`, {
      product_id: productA.id,
      author_name: 'Cross Reviewer',
      rating: 5,
      comment: 'Great product'
    });
    if (createRes.status !== 201 || !createRes.data?.data?.id) throw new Error(JSON.stringify(createRes.data));
    reviewA = createRes.data.data;

    const listCross = await api.get(`/reviews/${storeB.id}`, { headers: headersB });
    expectStatus(listCross, 200, 'Review list from Store B returns 200');
    expectNotInList(listCross.data?.data, reviewA.id, 'Store A review absent from Store B list');

    const patchCross = await api.patch(`/reviews/${storeB.id}/${reviewA.id}/status`, { status: 'approved' }, { headers: headersB });
    expectStatus(patchCross, 404, 'Review status PATCH from Store B blocked (404)');

    const delCross = await api.delete(`/reviews/${storeB.id}/${reviewA.id}`, { headers: headersB });
    expectStatus(delCross, 404, 'Review DELETE from Store B blocked (404)');

    const listOwner = await api.get(`/reviews/${storeA.id}`, { headers: headersA });
    expectStatus(listOwner, 200, 'Review list by owner in Store A succeeds');

    const patchOwner = await api.patch(`/reviews/${storeA.id}/${reviewA.id}/status`, { status: 'approved' }, { headers: headersA });
    expectStatus(patchOwner, 200, 'Review status PATCH by owner in Store A succeeds');

    const delOwner = await api.delete(`/reviews/${storeA.id}/${reviewA.id}`, { headers: headersA });
    expectStatus(delOwner, 200, 'Review DELETE by owner in Store A succeeds');
    reviewA = null;
  } catch (err) { fail('Reviews block', err.message); }

  // ============================================================
  // 7. RESERVATIONS
  // ============================================================
  let reservationA;
  try {
    console.log('7. Reservations');
    const createRes = await api.post(`/reservations/${storeA.id}`, {
      customer_name: 'Cross Reserver',
      customer_phone: `+1666${ts}`.slice(0, 15),
      guests: 2,
      date: '2026-12-31',
      time: '19:00',
      notes: 'cross-auth reservation'
    }, { headers: headersA });
    if (createRes.status !== 201 || !createRes.data?.data?.id) throw new Error(JSON.stringify(createRes.data));
    reservationA = createRes.data.data;

    const getCross = await api.get(`/reservations/${storeB.id}/${reservationA.id}`, { headers: headersB });
    expectStatus(getCross, 404, 'Reservation GET from Store B blocked (404)');

    const putCross = await api.put(`/reservations/${storeB.id}/${reservationA.id}`, { guests: 4 }, { headers: headersB });
    expectStatus(putCross, 404, 'Reservation PUT from Store B blocked (404)');

    const delCross = await api.delete(`/reservations/${storeB.id}/${reservationA.id}`, { headers: headersB });
    expectStatus(delCross, 404, 'Reservation DELETE from Store B blocked (404)');

    const getOwner = await api.get(`/reservations/${storeA.id}/${reservationA.id}`, { headers: headersA });
    expectStatus(getOwner, 200, 'Reservation GET by owner in Store A succeeds');

    const putOwner = await api.put(`/reservations/${storeA.id}/${reservationA.id}`, { guests: 3 }, { headers: headersA });
    expectStatus(putOwner, 200, 'Reservation PUT by owner in Store A succeeds');

    const delOwner = await api.delete(`/reservations/${storeA.id}/${reservationA.id}`, { headers: headersA });
    expectStatus(delOwner, 200, 'Reservation DELETE by owner in Store A succeeds');
    reservationA = null;
  } catch (err) { fail('Reservations block', err.message); }

  // ============================================================
  // 8. FLOORS
  // ============================================================
  let floorA;
  try {
    console.log('8. Floors');
    const createRes = await api.post(`/floors/${storeA.id}`, { name: 'Cross Floor', order_index: 1 }, { headers: headersA });
    if (createRes.status !== 201 || !createRes.data?.data?.id) throw new Error(JSON.stringify(createRes.data));
    floorA = createRes.data.data;

    const getCross = await api.get(`/floors/${storeB.id}/${floorA.id}`, { headers: headersB });
    expectStatus(getCross, 404, 'Floor GET from Store B blocked (404)');

    const putCross = await api.put(`/floors/${storeB.id}/${floorA.id}`, { name: 'Hacked Floor' }, { headers: headersB });
    expectStatus(putCross, 404, 'Floor PUT from Store B blocked (404)');

    const delCross = await api.delete(`/floors/${storeB.id}/${floorA.id}`, { headers: headersB });
    expectStatus(delCross, 404, 'Floor DELETE from Store B blocked (404)');

    const getOwner = await api.get(`/floors/${storeA.id}/${floorA.id}`, { headers: headersA });
    expectStatus(getOwner, 200, 'Floor GET by owner in Store A succeeds');

    const putOwner = await api.put(`/floors/${storeA.id}/${floorA.id}`, { name: 'Updated Floor' }, { headers: headersA });
    expectStatus(putOwner, 200, 'Floor PUT by owner in Store A succeeds');

    const delOwner = await api.delete(`/floors/${storeA.id}/${floorA.id}`, { headers: headersA });
    expectStatus(delOwner, 200, 'Floor DELETE by owner in Store A succeeds');
    floorA = null;
  } catch (err) { fail('Floors block', err.message); }

  // ============================================================
  // 9. KITCHEN TICKETS
  // ============================================================
  let kitchenA;
  try {
    console.log('9. Kitchen tickets');
    const createRes = await api.post(`/kitchen/${storeA.id}`, {
      order_id: orderA.id,
      status: 'pending',
      station: 'Grill',
      priority: 1
    }, { headers: headersA });
    if (createRes.status !== 201 || !createRes.data?.data?.id) throw new Error(JSON.stringify(createRes.data));
    kitchenA = createRes.data.data;

    const listCross = await api.get(`/kitchen/${storeB.id}`, { headers: headersB });
    expectStatus(listCross, 200, 'Kitchen ticket list from Store B returns 200');
    expectNotInList(listCross.data?.data, kitchenA.id, 'Store A kitchen ticket absent from Store B list');

    const statusCross = await api.put(`/kitchen/${storeB.id}/${kitchenA.id}/status`, { status: 'preparing' }, { headers: headersB });
    expectStatus(statusCross, 404, 'Kitchen ticket status PUT from Store B blocked (404)');

    const delCross = await api.delete(`/kitchen/${storeB.id}/${kitchenA.id}`, { headers: headersB });
    expectStatus(delCross, 404, 'Kitchen ticket DELETE from Store B blocked (404)');

    const listOwner = await api.get(`/kitchen/${storeA.id}`, { headers: headersA });
    expectStatus(listOwner, 200, 'Kitchen ticket list by owner in Store A succeeds');

    const statusOwner = await api.put(`/kitchen/${storeA.id}/${kitchenA.id}/status`, { status: 'preparing' }, { headers: headersA });
    expectStatus(statusOwner, 200, 'Kitchen ticket status PUT by owner in Store A succeeds');

    const delOwner = await api.delete(`/kitchen/${storeA.id}/${kitchenA.id}`, { headers: headersA });
    expectStatus(delOwner, 200, 'Kitchen ticket DELETE by owner in Store A succeeds');
    kitchenA = null;
  } catch (err) { fail('Kitchen tickets block', err.message); }

  // ============================================================
  // 10. QR CODES
  // ============================================================
  let qrA;
  try {
    console.log('10. QR codes');
    const createRes = await api.post(`/qr/${storeA.id}/generate`, {
      type: 'product',
      label: 'Cross QR',
      target_url: `https://example.com/product-${ts}`,
      metadata: { test: true }
    }, { headers: headersA });
    if (createRes.status !== 201 || !createRes.data?.data?.id) throw new Error(JSON.stringify(createRes.data));
    qrA = createRes.data.data;

    const listCross = await api.get(`/qr/${storeB.id}`, { headers: headersB });
    expectStatus(listCross, 200, 'QR code list from Store B returns 200');
    expectNotInList(listCross.data?.data, qrA.id, 'Store A QR code absent from Store B list');

    const delCross = await api.delete(`/qr/${storeB.id}/${qrA.id}`, { headers: headersB });
    expectStatus(delCross, 404, 'QR code DELETE from Store B blocked (404)');

    const listOwner = await api.get(`/qr/${storeA.id}`, { headers: headersA });
    expectStatus(listOwner, 200, 'QR code list by owner in Store A succeeds');

    const delOwner = await api.delete(`/qr/${storeA.id}/${qrA.id}`, { headers: headersA });
    expectStatus(delOwner, 200, 'QR code DELETE by owner in Store A succeeds');
    qrA = null;
  } catch (err) { fail('QR codes block', err.message); }

  // ============================================================
  // 11. DISCOUNT CODES
  // ============================================================
  let discountA;
  try {
    console.log('11. Discount codes');
    const createRes = await api.post(`/discounts/${storeA.id}`, {
      code: `CROSS${ts}`.toUpperCase(),
      type: 'percent',
      value: 10,
      min_subtotal: 5,
      max_uses: 100
    }, { headers: headersA });
    if (createRes.status !== 201 || !createRes.data?.data?.id) throw new Error(JSON.stringify(createRes.data));
    discountA = createRes.data.data;

    const listCross = await api.get(`/discounts/${storeB.id}`, { headers: headersB });
    expectStatus(listCross, 200, 'Discount code list from Store B returns 200');
    expectNotInList(listCross.data?.data, discountA.id, 'Store A discount code absent from Store B list');

    const toggleCross = await api.patch(`/discounts/${storeB.id}/${discountA.id}/toggle`, { active: false }, { headers: headersB });
    expectStatus(toggleCross, 404, 'Discount code toggle from Store B blocked (404)');

    const delCross = await api.delete(`/discounts/${storeB.id}/${discountA.id}`, { headers: headersB });
    expectStatus(delCross, 404, 'Discount code DELETE from Store B blocked (404)');

    const listOwner = await api.get(`/discounts/${storeA.id}`, { headers: headersA });
    expectStatus(listOwner, 200, 'Discount code list by owner in Store A succeeds');

    const toggleOwner = await api.patch(`/discounts/${storeA.id}/${discountA.id}/toggle`, { active: false }, { headers: headersA });
    expectStatus(toggleOwner, 200, 'Discount code toggle by owner in Store A succeeds');

    const delOwner = await api.delete(`/discounts/${storeA.id}/${discountA.id}`, { headers: headersA });
    expectStatus(delOwner, 200, 'Discount code DELETE by owner in Store A succeeds');
    discountA = null;
  } catch (err) { fail('Discount codes block', err.message); }

  // ============================================================
  // 12. TEAM MEMBERSHIP
  // ============================================================
  let teamMemberA;
  try {
    console.log('12. Team membership');
    const createRes = await api.post(`/team/${storeA.id}`, {
      email: userC.email,
      role: 'staff'
    }, { headers: headersA });
    if (createRes.status !== 201 || !createRes.data?.data?.user_id) throw new Error(JSON.stringify(createRes.data));
    teamMemberA = createRes.data.data;

    const listCross = await api.get(`/team/${storeB.id}`, { headers: headersB });
    expectStatus(listCross, 200, 'Team member list from Store B returns 200');
    expectNotInList(listCross.data?.data, teamMemberA.user_id, 'Store A team member absent from Store B list');

    const delCross = await api.delete(`/team/${storeB.id}/${teamMemberA.user_id}`, { headers: headersB });
    expectStatus(delCross, 404, 'Team member DELETE from Store B blocked (404)');

    const listOwner = await api.get(`/team/${storeA.id}`, { headers: headersA });
    expectStatus(listOwner, 200, 'Team member list by owner in Store A succeeds');

    const delOwner = await api.delete(`/team/${storeA.id}/${teamMemberA.user_id}`, { headers: headersA });
    expectStatus(delOwner, 200, 'Team member DELETE by owner in Store A succeeds');
    teamMemberA = null;
  } catch (err) { fail('Team membership block', err.message); }

  // ============================================================
  // 13. GROWTH PULSES / RECOMMENDATIONS
  // ============================================================
  let growthRecA;
  try {
    console.log('13. Growth pulses');
    // Seed enough orders to move into limited data state
    for (let i = 0; i < 4; i++) {
      await api.post(`/orders/${storeA.id}/checkout`, {
        customer: { name: 'Seed Customer', phone: `+1777${ts}${i}`.slice(0, 15), email: `seed_${ts}_${i}@example.com` },
        shipping_address: { line1: '1 Seed St', city: 'Seed City', country: 'US' },
        items: [{ product_id: productA.id, quantity: 1 }],
        payment_method: 'cash',
        payment_status: 'paid'
      });
    }

    const pulseRes = await api.get(`/stores/${storeA.id}/growth/daily-pulse?date=2026-10-15`, {
      headers: { ...headersA, 'x-test-mode': 'true' }
    });
    if (pulseRes.status !== 200) throw new Error(JSON.stringify(pulseRes.data));
    const recommendations = pulseRes.data?.data?.recommendations || [];
    if (recommendations.length === 0) throw new Error('No growth recommendations generated');
    growthRecA = recommendations[0];

    const pulseCross = await api.get(`/stores/${storeB.id}/growth/daily-pulse`, { headers: headersB });
    expectStatus(pulseCross, 200, 'Growth pulse for Store B returns own data');

    const viewCross = await api.patch(`/stores/${storeB.id}/growth/recommendations/${growthRecA.id}/view`, {}, { headers: headersB });
    expectStatus(viewCross, 404, 'Growth recommendation view from Store B blocked (404)');

    const dismissCross = await api.patch(`/stores/${storeB.id}/growth/recommendations/${growthRecA.id}/dismiss`, {}, { headers: headersB });
    expectStatus(dismissCross, 404, 'Growth recommendation dismiss from Store B blocked (404)');

    const executeCross = await api.post(`/stores/${storeB.id}/growth/recommendations/${growthRecA.id}/execute`, {}, { headers: headersB });
    expectStatus(executeCross, 404, 'Growth recommendation execute from Store B blocked (404)');

    const viewOwner = await api.patch(`/stores/${storeA.id}/growth/recommendations/${growthRecA.id}/view`, {}, { headers: headersA });
    expectStatus(viewOwner, 200, 'Growth recommendation view by owner in Store A succeeds');
  } catch (err) { fail('Growth pulses block', err.message); }

  // ============================================================
  // 14. CRM DEALS
  // ============================================================
  let pipelineA, stageA, dealA;
  try {
    console.log('14. CRM deals');
    const pipelineRes = await api.post(`/crm/${storeA.id}/pipelines`, {
      name: 'Cross Pipeline',
      description: 'cross-auth pipeline'
    }, { headers: headersA });
    if (pipelineRes.status !== 201 || !pipelineRes.data?.data?.id) throw new Error(JSON.stringify(pipelineRes.data));
    pipelineA = pipelineRes.data.data;

    const stageRes = await api.post(`/crm/${storeA.id}/pipelines/${pipelineA.id}/stages`, {
      name: 'Cross Stage',
      position: 0
    }, { headers: headersA });
    if (stageRes.status !== 201 || !stageRes.data?.data?.id) throw new Error(JSON.stringify(stageRes.data));
    stageA = stageRes.data.data;

    const dealRes = await api.post(`/crm/${storeA.id}/deals`, {
      pipeline_id: pipelineA.id,
      stage_id: stageA.id,
      customer_id: customerA.id,
      title: 'Cross Deal',
      value: 500,
      status: 'open',
      expected_close_date: '2026-12-31'
    }, { headers: headersA });
    if (dealRes.status !== 201 || !dealRes.data?.data?.id) throw new Error(JSON.stringify(dealRes.data));
    dealA = dealRes.data.data;

    const getCross = await api.get(`/crm/${storeB.id}/deals/${dealA.id}`, { headers: headersB });
    expectStatus(getCross, 404, 'CRM deal GET from Store B blocked (404)');

    const patchCross = await api.patch(`/crm/${storeB.id}/deals/${dealA.id}`, { title: 'Hacked Deal' }, { headers: headersB });
    expectStatus(patchCross, 404, 'CRM deal PATCH from Store B blocked (404)');

    const getOwner = await api.get(`/crm/${storeA.id}/deals/${dealA.id}`, { headers: headersA });
    expectStatus(getOwner, 200, 'CRM deal GET by owner in Store A succeeds');

    const patchOwner = await api.patch(`/crm/${storeA.id}/deals/${dealA.id}`, { title: 'Updated Deal' }, { headers: headersA });
    expectStatus(patchOwner, 200, 'CRM deal PATCH by owner in Store A succeeds');
  } catch (err) { fail('CRM deals block', err.message); }

  // ============================================================
  // 15. AI INSIGHTS
  // ============================================================
  let aiInsightA;
  try {
    console.log('15. AI insights');
    const generateRes = await api.post(`/ai/${storeA.id}/customer/${customerA.id}/generate`, {}, { headers: headersA });
    if (generateRes.status !== 201 || !generateRes.data?.data?.id) throw new Error(JSON.stringify(generateRes.data));
    aiInsightA = generateRes.data.data;

    const getCross = await api.get(`/ai/${storeB.id}/customer/${customerA.id}`, { headers: headersB });
    expectStatus(getCross, 404, 'AI insight GET from Store B blocked (404)');

    const getOwner = await api.get(`/ai/${storeA.id}/customer/${customerA.id}`, { headers: headersA });
    expectStatus(getOwner, 200, 'AI insight GET by owner in Store A succeeds');
  } catch (err) { fail('AI insights block', err.message); }

  // ============================================================
  // CLEANUP
  // ============================================================
  console.log('\nCLEANUP: Removing test data...');
  try {
    // Growth / AI / CRM
    await db.query('DELETE FROM pulse_recommendations WHERE store_id IN ($1, $2)', [storeA.id, storeB.id]);
    await db.query('DELETE FROM daily_micro_pulses WHERE store_id IN ($1, $2)', [storeA.id, storeB.id]);
    await db.query('DELETE FROM monthly_strategy_recommendations WHERE store_id IN ($1, $2)', [storeA.id, storeB.id]);
    await db.query('DELETE FROM growth_action_logs WHERE store_id IN ($1, $2)', [storeA.id, storeB.id]);
    await db.query('DELETE FROM growth_experiments WHERE store_id IN ($1, $2)', [storeA.id, storeB.id]);
    await db.query('DELETE FROM monthly_growth_strategies WHERE store_id IN ($1, $2)', [storeA.id, storeB.id]);
    await db.query('DELETE FROM external_market_signals WHERE store_id IN ($1, $2)', [storeA.id, storeB.id]);
    await db.query('DELETE FROM ai_insights WHERE store_id IN ($1, $2)', [storeA.id, storeB.id]);
    await db.query('DELETE FROM crm_deal_notes WHERE deal_id IN (SELECT id FROM crm_deals WHERE store_id IN ($1, $2))', [storeA.id, storeB.id]);
    await db.query('DELETE FROM crm_deals WHERE store_id IN ($1, $2)', [storeA.id, storeB.id]);
    await db.query('DELETE FROM crm_stages WHERE pipeline_id IN (SELECT id FROM crm_pipelines WHERE store_id IN ($1, $2))', [storeA.id, storeB.id]);
    await db.query('DELETE FROM crm_pipelines WHERE store_id IN ($1, $2)', [storeA.id, storeB.id]);

    // QR / Discounts / Reviews / Team / Floor layouts
    await db.query('DELETE FROM qr_codes WHERE store_id IN ($1, $2)', [storeA.id, storeB.id]);
    await db.query('DELETE FROM discount_codes WHERE store_id IN ($1, $2)', [storeA.id, storeB.id]);
    await db.query('DELETE FROM product_reviews WHERE store_id IN ($1, $2)', [storeA.id, storeB.id]);
    await db.query('DELETE FROM user_roles WHERE store_id IN ($1, $2)', [storeA.id, storeB.id]);
    await db.query('DELETE FROM layout_elements WHERE layout_id IN (SELECT id FROM floor_layouts WHERE floor_id IN (SELECT id FROM floors WHERE store_id IN ($1, $2)))', [storeA.id, storeB.id]);
    await db.query('DELETE FROM floor_layouts WHERE floor_id IN (SELECT id FROM floors WHERE store_id IN ($1, $2))', [storeA.id, storeB.id]);
    await db.query('DELETE FROM floors WHERE store_id IN ($1, $2)', [storeA.id, storeB.id]);

    // Kitchen / Inventory / Orders / Customers / Products / Categories
    await db.query('DELETE FROM kitchen_tickets WHERE store_id IN ($1, $2)', [storeA.id, storeB.id]);
    await db.query('DELETE FROM inventory_adjustments WHERE store_id IN ($1, $2)', [storeA.id, storeB.id]);
    await db.query('DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE store_id IN ($1, $2))', [storeA.id, storeB.id]);
    await db.query('DELETE FROM orders WHERE store_id IN ($1, $2)', [storeA.id, storeB.id]);
    await db.query('DELETE FROM customers WHERE store_id IN ($1, $2)', [storeA.id, storeB.id]);
    await db.query('DELETE FROM products WHERE store_id IN ($1, $2)', [storeA.id, storeB.id]);
    await db.query('DELETE FROM categories WHERE store_id IN ($1, $2)', [storeA.id, storeB.id]);

    // Stores and users
    await db.query('DELETE FROM stores WHERE id IN ($1, $2)', [storeA.id, storeB.id]);
    await db.query('DELETE FROM users WHERE id IN ($1, $2, $3)', [userA.id, userB.id, userC.id]);
    pass('Test data cleaned up');
  } catch (err) { fail('Cleanup', err.message); }

  // ============================================================
  // SUMMARY
  // ============================================================
  const total = results.passed + results.failed;
  console.log('\n================================================================');
  console.log(`RESULTS: ${results.passed}/${total} scenarios passed, ${results.failed} failed`);
  console.log('================================================================\n');
  if (results.failed > 0) {
    results.errors.forEach((e) => console.error('  -', e));
    process.exit(1);
  }
  process.exit(0);
}

runSuite().catch((err) => {
  console.error('FATAL SUITE ERROR:', err);
  process.exit(1);
});
