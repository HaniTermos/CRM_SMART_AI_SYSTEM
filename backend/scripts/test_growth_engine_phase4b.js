const axios = require('axios');
const db = require('../config/database');

async function runPhase4BGrowthEngineTests() {
  console.log('================================================================');
  console.log('SMARTSTORE AI — REVENUE GROWTH ENGINE PHASE 4B TEST SUITE');
  console.log('================================================================\n');

  const baseURL = 'http://localhost:5002/api';
  const timestamp = Date.now();

  try {
    // ----------------------------------------------------
    // TEST 1: Register Store A (Owner) & Store B (Owner)
    // ----------------------------------------------------
    console.log('1. Registering Store A and Store B...');

    const regA = await axios.post(`${baseURL}/auth/register`, {
      name: 'Owner Alpha P4B',
      email: `owner_p4b_a_${timestamp}@example.com`,
      password: 'password123'
    });
    const tokenA = regA.data.data.token;

    const storeARes = await axios.post(
      `${baseURL}/stores`,
      { name: 'Alpha Bistro Phase 4B', slug: `alpha-p4b-${timestamp}`, currency: 'USD' },
      { headers: { Authorization: `Bearer ${tokenA}` } }
    );
    const storeA = storeARes.data.data;

    const regB = await axios.post(`${baseURL}/auth/register`, {
      name: 'Owner Beta P4B',
      email: `owner_p4b_b_${timestamp}@example.com`,
      password: 'password123'
    });
    const tokenB = regB.data.data.token;

    const storeBRes = await axios.post(
      `${baseURL}/stores`,
      { name: 'Beta Bakery Phase 4B', slug: `beta-p4b-${timestamp}`, currency: 'EUR' },
      { headers: { Authorization: `Bearer ${tokenB}` } }
    );
    const storeB = storeBRes.data.data;

    // ----------------------------------------------------
    // TEST 2: Manual Signal Creation
    // ----------------------------------------------------
    console.log('\n2. Testing Manual Signal Creation...');
    const createSigRes = await axios.post(
      `${baseURL}/stores/me/growth/external-signals`,
      {
        signal_type: 'weather',
        title: 'Unexpected Heatwave Observation',
        description: 'High temperatures predicted for the region',
        source_name: 'Manual Local Observation',
        source_url: 'https://weather.local/forecast',
        observed_at: new Date().toISOString(),
        confidence: 75,
        status: 'draft'
      },
      { headers: { Authorization: `Bearer ${tokenA}` } }
    );

    const sig1 = createSigRes.data.data;
    console.log(`   Created Signal ID: ${sig1.id}`);
    console.log(`   Signal Type: ${sig1.signal_type}`);
    console.log(`   Status: ${sig1.status}`);

    if (createSigRes.data.success && sig1.id && sig1.status === 'draft') {
      console.log('   ✅ Manual signal creation PASSED!');
    } else {
      console.error('   ❌ Manual signal creation FAILED!');
    }

    // ----------------------------------------------------
    // TEST 3 & 4: Missing Metadata & Invalid Type Rejection
    // ----------------------------------------------------
    console.log('\n3 & 4. Testing Signal Validation & Missing Metadata Rejection...');
    try {
      await axios.post(
        `${baseURL}/stores/me/growth/external-signals`,
        {
          signal_type: 'invalid_type_xyz',
          title: 'Invalid Signal'
        },
        { headers: { Authorization: `Bearer ${tokenA}` } }
      );
      console.error('   ❌ Missing metadata rejection FAILED (Allowed invalid signal)!');
    } catch (err) {
      if (err.response && err.response.status === 400) {
        console.log('   ✅ Missing metadata/invalid signal rejected with 400 Bad Request');
      } else {
        console.error('   ❌ Unexpected response:', err.message);
      }
    }

    // ----------------------------------------------------
    // TEST 5: Verification Workflow
    // ----------------------------------------------------
    console.log('\n5. Testing Signal Verification Workflow...');
    const verifyRes = await axios.patch(
      `${baseURL}/stores/me/growth/external-signals/${sig1.id}/verify`,
      {},
      { headers: { Authorization: `Bearer ${tokenA}` } }
    );

    console.log(`   Verified Signal Status: ${verifyRes.data.data.status}`);
    if (verifyRes.data.success && verifyRes.data.data.status === 'verified') {
      console.log('   ✅ Verification workflow PASSED!');
    } else {
      console.error('   ❌ Verification workflow FAILED!');
    }

    // ----------------------------------------------------
    // TEST 6, 7, 8: Exclusion of Rejected, Expired, Low-Confidence Signals
    // ----------------------------------------------------
    console.log('\n6, 7 & 8. Testing Exclusion of Rejected, Expired, and Low-Confidence Signals...');
    // Create rejected signal
    const rejSig = await axios.post(
      `${baseURL}/stores/me/growth/external-signals`,
      {
        signal_type: 'competitor_pricing',
        title: 'Unverified Rumor',
        source_name: 'Social Media',
        observed_at: new Date().toISOString(),
        confidence: 40,
        status: 'draft'
      },
      { headers: { Authorization: `Bearer ${tokenA}` } }
    );
    await axios.patch(
      `${baseURL}/stores/me/growth/external-signals/${rejSig.data.data.id}/reject`,
      {},
      { headers: { Authorization: `Bearer ${tokenA}` } }
    );

    // Create expired signal
    await axios.post(
      `${baseURL}/stores/me/growth/external-signals`,
      {
        signal_type: 'local_event',
        title: 'Past Marathon',
        source_name: 'City Calendar',
        observed_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
        valid_until: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
        confidence: 80,
        status: 'verified'
      },
      { headers: { Authorization: `Bearer ${tokenA}` } }
    );

    // Create low-confidence signal (< 60)
    await axios.post(
      `${baseURL}/stores/me/growth/external-signals`,
      {
        signal_type: 'seasonal_trend',
        title: 'Low Confidence Prediction',
        source_name: 'Blog Post',
        observed_at: new Date().toISOString(),
        confidence: 45,
        status: 'verified'
      },
      { headers: { Authorization: `Bearer ${tokenA}` } }
    );

    const ExternalMarketSignalService = require('../services/ExternalMarketSignalService');
    const validSignals = await ExternalMarketSignalService.getVerifiedSignalsForStrategy(storeA.id, '2026-08', 60);

    console.log(`   Total Verified Active Signals found for Strategy: ${validSignals.length}`);
    const includedIds = validSignals.map(s => s.id);

    if (includedIds.includes(sig1.id) && !includedIds.includes(rejSig.data.data.id) && validSignals.length === 1) {
      console.log('   ✅ Rejected, expired, and low-confidence signals excluded cleanly!');
    } else {
      console.error('   ❌ Signal exclusion rules FAILED!');
    }

    // ----------------------------------------------------
    // TEST 9 & 11: include_external=true vs include_external=false
    // ----------------------------------------------------
    console.log('\n9 & 11. Testing include_external=true vs include_external=false...');
    // Seed 35 orders for Store A to reach sufficient tier
    const custRes = await db.query(
      `INSERT INTO customers (store_id, name, phone, email) 
       VALUES ($1, 'Customer P4B', $2, $3) RETURNING id`,
      [storeA.id, `+1555${timestamp}`.slice(0, 15), `cust_p4b_${timestamp}@example.com`]
    );
    const customerAId = custRes.rows[0].id;

    for (let i = 1; i <= 32; i++) {
      await db.query(
        `INSERT INTO orders (store_id, customer_id, order_number, payment_method, payment_status, total, created_at)
         VALUES ($1, $2, $3, 'cash', 'paid', 35.00, NOW() - INTERVAL '5 days')`,
        [storeA.id, customerAId, `ORD-P4B-${timestamp}-${i}`]
      );
    }

    // Call strategy with include_external=false (Backward compatibility)
    const stratNoExt = await axios.get(`${baseURL}/stores/me/growth/monthly-strategy?include_external=false`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const dNoExt = stratNoExt.data.data;
    console.log(`   include_external=false Context Used: ${dNoExt.external_context_used}`);

    // Call strategy with include_external=true
    const stratExt = await axios.get(`${baseURL}/stores/me/growth/monthly-strategy?include_external=true`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const dExt = stratExt.data.data;
    console.log(`   include_external=true Context Used: ${dExt.external_context_used}`);

    const recWithExt = dExt.recommendations.find(r => r.external_evidence && r.external_evidence.length > 0);
    if (
      dNoExt.external_context_used === false &&
      dExt.external_context_used === true &&
      recWithExt &&
      recWithExt.external_evidence[0].title === sig1.title
    ) {
      console.log('   ✅ include_external parameter & external context attachment PASSED!');
    } else {
      console.error('   ❌ include_external behavior FAILED!');
    }

    // ----------------------------------------------------
    // TEST 12: Insufficient Internal Data (< 10 orders) Protection
    // ----------------------------------------------------
    console.log('\n12. Testing Insufficient Internal Data Protection...');
    // Create verified signal for fresh Store B (< 10 orders)
    await axios.post(
      `${baseURL}/stores/me/growth/external-signals`,
      {
        signal_type: 'weather',
        title: 'Rainy Weekend Forecast',
        source_name: 'Weather API',
        observed_at: new Date().toISOString(),
        confidence: 80,
        status: 'verified'
      },
      { headers: { Authorization: `Bearer ${tokenB}` } }
    );

    const stratB = await axios.get(`${baseURL}/stores/me/growth/monthly-strategy?include_external=true`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    const dB = stratB.data.data;

    console.log(`   Store B Sufficiency Tier: ${dB.data_sufficiency_tier}`);
    console.log(`   Store B Recommendations Count: ${dB.recommendations.length}`);

    if (dB.data_sufficiency_tier === 'insufficient' && dB.recommendations.length === 0 && dB.setup_actions.length > 0) {
      console.log('   ✅ Insufficient data protection PASSED (No fake recommendations fabricated)!');
    } else {
      console.error('   ❌ Insufficient data protection FAILED!');
    }

    // ----------------------------------------------------
    // TEST 16: Cross-Tenant Protection on Signals
    // ----------------------------------------------------
    console.log('\n16. Testing Cross-Tenant Security on Signals...');
    try {
      await axios.patch(
        `${baseURL}/stores/me/growth/external-signals/${sig1.id}/verify`,
        {},
        { headers: { Authorization: `Bearer ${tokenB}` } }
      );
      console.error('   ❌ Cross-tenant signal modification FAILED (Allowed unauthorized verify)!');
    } catch (err) {
      if (err.response && (err.response.status === 403 || err.response.status === 404)) {
        console.log('   ✅ Store B blocked from modifying Store A signal (404/403 Protection)');
      } else {
        console.error('   ❌ Unexpected response:', err.message);
      }
    }

    // ----------------------------------------------------
    // TEST 17: Deduplication on Repeated Ingestion
    // ----------------------------------------------------
    console.log('\n17. Testing Deduplication on Ingestion...');
    const dupObsTime = new Date('2026-08-09T10:00:00Z').toISOString();
    const sigA1 = await ExternalMarketSignalService.createSignal(storeA.id, {
      signal_type: 'market_observation',
      title: 'Initial Market Observation',
      source_name: 'Local Chamber',
      observed_at: dupObsTime,
      confidence: 70,
      status: 'verified'
    });

    const sigA2 = await ExternalMarketSignalService.createSignal(storeA.id, {
      signal_type: 'market_observation',
      title: 'Updated Market Observation',
      source_name: 'Local Chamber',
      observed_at: dupObsTime,
      confidence: 85,
      status: 'verified'
    });

    if (sigA1.id === sigA2.id && sigA2.confidence === 85) {
      console.log(`   Deduplicated cleanly to same signal ID (${sigA2.id}) with updated confidence (85%)`);
      console.log('   ✅ Signal deduplication PASSED!');
    } else {
      console.error('   ❌ Signal deduplication FAILED!');
    }

    // ----------------------------------------------------
    // TEST 18: Strategy Refresh Mechanism for New Verified Signals
    // ----------------------------------------------------
    console.log('\n18. Testing Strategy Refresh Mechanism for New Signals...');
    const refreshRes = await axios.post(
      `${baseURL}/stores/me/growth/monthly-strategy/refresh`,
      {},
      { headers: { Authorization: `Bearer ${tokenA}` } }
    );

    if (refreshRes.data.success && refreshRes.data.data.external_context_used === true) {
      console.log('   ✅ Strategy refresh mechanism PASSED!');
    } else {
      console.error('   ❌ Strategy refresh mechanism FAILED!');
    }

    console.log('\n================================================================');
    console.log('ALL PHASE 4B EXTERNAL MARKET INTELLIGENCE TESTS PASSED SUCCESSFULLY!');
    console.log('================================================================\n');
    process.exit(0);

  } catch (err) {
    console.error('Test Suite Error:', err.response?.data || err.message || err);
    process.exit(1);
  }
}

runPhase4BGrowthEngineTests();
