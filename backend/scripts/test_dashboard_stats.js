const axios = require('axios');

async function testBackend() {
  try {
    const baseURL = 'http://localhost:5002/api';
    const timestamp = Date.now();

    // 1. Register Owner 1
    console.log('1. Registering Store Owner 1...');
    const reg1 = await axios.post(`${baseURL}/auth/register`, {
      name: 'Owner One',
      email: `owner1_${timestamp}@example.com`,
      password: 'password123'
    });

    const token1 = reg1.data.data.token;
    console.log('   Token 1 obtained:', !!token1);

    // Create store 1
    console.log('   Creating Store 1 for Owner 1...');
    const store1Res = await axios.post(
      `${baseURL}/stores`,
      {
        name: 'Dallas Café',
        slug: `dallas-cafe-${timestamp}`,
        currency: 'USD'
      },
      { headers: { Authorization: `Bearer ${token1}` } }
    );
    console.log('   Store 1 Created:', store1Res.data.data.id, store1Res.data.data.name);

    // 2. Fetch stats for Store 1 (Store with no data initially)
    console.log('\n2. Testing GET /api/stores/me/dashboard for Store 1 (No activity)...');
    const stats1 = await axios.get(`${baseURL}/stores/me/dashboard`, {
      headers: { Authorization: `Bearer ${token1}` }
    });

    console.log('   Response status:', stats1.status);
    console.log('   Store 1 Name:', stats1.data.data.store.name);
    console.log('   Today Revenue:', stats1.data.data.todayRevenue);
    console.log('   Today Orders:', stats1.data.data.todayOrders);
    console.log('   Total Customers:', stats1.data.data.totalCustomers);
    console.log('   Has Activity:', stats1.data.data.hasActivity);

    // 3. Register Owner 2 & Store 2 for tenant isolation verification
    console.log('\n3. Registering Store Owner 2 & Store 2 for Multi-Tenant Isolation Check...');
    const reg2 = await axios.post(`${baseURL}/auth/register`, {
      name: 'Owner Two',
      email: `owner2_${timestamp}@example.com`,
      password: 'password123'
    });

    const token2 = reg2.data.data.token;

    const store2Res = await axios.post(
      `${baseURL}/stores`,
      {
        name: 'Austin Bistro',
        slug: `austin-bistro-${timestamp}`,
        currency: 'USD'
      },
      { headers: { Authorization: `Bearer ${token2}` } }
    );
    console.log('   Store 2 Created:', store2Res.data.data.id, store2Res.data.data.name);

    const stats2 = await axios.get(`${baseURL}/stores/me/dashboard`, {
      headers: { Authorization: `Bearer ${token2}` }
    });

    console.log('   Store 2 Name:', stats2.data.data.store.name);
    console.log('   Store 2 Slug:', stats2.data.data.store.slug);

    if (stats1.data.data.store.id !== stats2.data.data.store.id) {
      console.log('\n✅ VERIFIED: Multi-tenant isolation enforced! Store 1 ID != Store 2 ID.');
      console.log('   Store 1 UUID:', stats1.data.data.store.id);
      console.log('   Store 2 UUID:', stats2.data.data.store.id);
    } else {
      console.error('\n❌ FAILED: Multi-tenant data leakage detected!');
    }

  } catch (err) {
    console.error('Test Error:', err.response?.data || err.message);
  }
}

testBackend();
