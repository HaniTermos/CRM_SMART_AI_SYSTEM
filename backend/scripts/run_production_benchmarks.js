/**
 * SmartStore Website Studio (CMS V3) — Production Performance & Security Benchmark Suite
 */

const path = require('path');
const http = require('http');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const db = require('../config/database');
const validator = require('../validators/cmsV3Validator');

const API_BASE = `http://localhost:${process.env.PORT || 5002}/api/public`;

function httpGetWithTiming(url) {
  const start = performance.now();
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        const duration = performance.now() - start;
        try { resolve({ status: res.statusCode, duration, body: JSON.parse(body) }); }
        catch { resolve({ status: res.statusCode, duration, body, parseError: true }); }
      });
    }).on('error', reject);
  });
}

async function runBenchmarks() {
  console.log('====================================================================');
  console.log('SmartStore CMS V3 — Stage 11 Production Readiness Benchmarks');
  console.log('====================================================================\n');

  // 1. Latency Benchmarks
  console.log('[PERFORMANCE 1/3] Measuring public route latencies (5 iterations each)...');
  const routes = [
    { slug: 'sunrise-bakery', name: 'Sunrise Bakery (V3 Active)' },
    { slug: 'arabicast', name: 'Arabi Cast (Legacy Fallback)' },
    { slug: 'green-bowl', name: 'Green Bowl (Legacy Fallback)' },
    { slug: 'pasta-parlor', name: 'Pasta Parlor (Legacy Fallback)' }
  ];

  const latencyResults = [];

  for (const r of routes) {
    const samples = [];
    for (let i = 0; i < 5; i++) {
      const res = await httpGetWithTiming(`${API_BASE}/v3/resolve/${r.slug}`);
      if (res.status === 200) samples.push(res.duration);
    }
    const avg = (samples.reduce((a, b) => a + b, 0) / samples.length).toFixed(2);
    const min = Math.min(...samples).toFixed(2);
    const max = Math.max(...samples).toFixed(2);
    console.log(`  - ${r.name}: avg=${avg}ms (min=${min}ms, max=${max}ms)`);
    latencyResults.push({ store: r.name, avg, min, max });
  }

  // 2. AST Validation Cost Benchmark
  console.log('\n[PERFORMANCE 2/3] Benchmarking canonical AST validator throughput...');
  const sampleDoc = (await db.query(`SELECT component_tree FROM cms_v3_page_versions LIMIT 1`)).rows[0]?.component_tree;
  const astStart = performance.now();
  const iterations = 1000;
  for (let i = 0; i < iterations; i++) {
    validator.validatePageDocument(sampleDoc);
  }
  const astTotal = performance.now() - astStart;
  const perDoc = (astTotal / iterations).toFixed(4);
  console.log(`  - Validated ${iterations} AST documents in ${astTotal.toFixed(2)}ms (${perDoc}ms per document).`);

  // 3. Database Query Count and Indexes Audit
  console.log('\n[PERFORMANCE 3/3] Auditing database schema indices & table sizes...');
  const indexRes = await db.query(
    `SELECT tablename, indexname FROM pg_indexes 
     WHERE schemaname = 'public' AND tablename LIKE 'cms_v3%'
     ORDER BY tablename, indexname`
  );
  console.log(`  - Detected ${indexRes.rows.length} specialized indexes on CMS V3 tables.`);

  console.log('\n====================================================================');
  console.log('BENCHMARK COMPLETE');
  console.log('====================================================================\n');
  process.exit(0);
}

runBenchmarks();
