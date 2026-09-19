const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const http = require('http');
const axios = require('axios');
const app = require('../server');

const PORT = 5999;
const BASE = `http://localhost:${PORT}/api`;

let server;
let ownerToken = '';
let storeId = '';
let categoryId = '';
let productId = '';
let duplicateId = '';

async function startServer() {
  return new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(PORT, resolve);
  });
}

async function stopServer() {
  return new Promise((resolve) => server.close(resolve));
}

async function request(method, url, data = null, token = null) {
  const config = {
    method,
    url: `${BASE}${url}`,
    headers: { 'Content-Type': 'application/json' },
  };
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (data) config.data = data;
  try {
    return (await axios(config)).data;
  } catch (err) {
    const status = err.response?.status;
    const msg = err.response?.data?.error || err.message;
    throw new Error(`${method} ${url} => ${status}: ${msg}`);
  }
}

async function run() {
  await startServer();
  const email = `menu_test_${Date.now()}@example.com`;

  // Register and create store
  const register = await request('POST', '/auth/register', {
    email,
    password: 'TestPass123!',
    name: 'Menu Tester',
  });
  ownerToken = register.data.token;
  const store = await request('POST', '/stores', {
    name: `Menu Test Store ${Date.now()}`,
    slug: `menu-test-${Date.now()}`,
    currency: 'USD',
  }, ownerToken);
  storeId = store.data.id;

  // Create category
  const cat = await request('POST', `/categories/${storeId}`, { name: 'Mains', slug: `mains-${Date.now()}` }, ownerToken);
  categoryId = cat.data.id;
  console.log('✅ Category created');

  // Create product
  const prod = await request('POST', `/products/${storeId}`, {
    name: 'Test Burger',
    slug: `test-burger-${Date.now()}`,
    description: 'A tasty test burger',
    price: 12.99,
    stock: 50,
    category_id: categoryId,
    status: 'active',
    prep_time: 15,
    is_available: true,
    is_featured: true,
    dietary_tags: ['halal'],
    allergens: ['gluten'],
  }, ownerToken);
  productId = prod.data.id;
  console.log('✅ Product created with tags:', prod.data.dietary_tags);

  // List products
  const list = await request('GET', `/products/${storeId}`, null, ownerToken);
  if (list.data.length !== 1) throw new Error('Expected 1 product');
  console.log('✅ Product list correct');

  // Update product
  await request('PUT', `/products/${storeId}/${productId}`, { price: 14.99, is_featured: false }, ownerToken);
  console.log('✅ Product updated');

  // Duplicate product
  const dup = await request('PATCH', `/products/${storeId}/${productId}/duplicate`, null, ownerToken);
  duplicateId = dup.data.id;
  if (!dup.data.name.includes('Copy')) throw new Error('Duplicate name wrong');
  console.log('✅ Product duplicated');

  // Bulk update
  const bulk = await request('PATCH', `/products/${storeId}/bulk`, { ids: [productId, duplicateId], updates: { is_available: false } }, ownerToken);
  if (bulk.data.length !== 2) throw new Error('Bulk update wrong');
  console.log('✅ Bulk update correct');

  // Update category
  await request('PATCH', `/categories/${storeId}/${categoryId}`, { name: 'Updated Mains' }, ownerToken);
  console.log('✅ Category updated');

  // Reorder category
  await request('PATCH', `/categories/${storeId}/reorder`, { orderedIds: [categoryId] }, ownerToken);
  console.log('✅ Category reorder endpoint works');

  // Cleanup
  await request('DELETE', `/products/${storeId}/${duplicateId}`, null, ownerToken);
  await request('DELETE', `/products/${storeId}/${productId}`, null, ownerToken);
  await request('DELETE', `/categories/${storeId}/${categoryId}`, null, ownerToken);

  // Use raw DB to remove test store/user since no API endpoint exists
  const db = require('../config/database');
  await db.query('DELETE FROM stores WHERE id = $1', [storeId]);
  await db.query('DELETE FROM users WHERE email = $1', [email]);
  await db.query('DELETE FROM user_preferences WHERE user_id NOT IN (SELECT id FROM users)');
  console.log('✅ Cleanup done');

  console.log('\n✅ All menu manager endpoints passed');
}

run()
  .then(() => stopServer().then(() => process.exit(0)))
  .catch((err) => {
    console.error('\n❌ Menu manager test failed:', err.message);
    if (server) {
      stopServer().then(() => process.exit(1));
    } else {
      process.exit(1);
    }
  });
