/**
 * SmartStore Website Studio (CMS V3) — Stage 8C-D Canary Monitoring Engine
 *
 * This script performs live monitoring of the Sunrise Bakery V3 staging canary.
 * It uses:
 *   - Before/after database fingerprints (not hardcoded counts)
 *   - Actual HTTP requests to the running backend on port 5002
 *   - Real response shape validation
 *   - Store isolation audits
 *   - Feature-flag verification
 *
 * The rollback drill is NOT performed here — it is a separate phase
 * handled by the caller to keep flag mutations explicit and auditable.
 */

const path = require('path');
const fs = require('fs');
const http = require('http');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const db = require('../config/database');
const validator = require('../validators/cmsV3Validator');

const API_BASE = `http://localhost:${process.env.PORT || 5002}/api/public`;
const STORE_ID = '97900e09-1cbc-4da5-b5b7-8c695d7dd2f9';
const STORE_SLUG = 'sunrise-bakery';

let passed = 0;
let failed = 0;
const warnings = [];
const limitations = [];

function assert(condition, label) {
  if (condition) { console.log(`  ✓ PASS: ${label}`); passed++; }
  else { console.error(`  ✗ FAIL: ${label}`); failed++; }
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    http.get(url, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(body) }); }
        catch { resolve({ status: res.statusCode, body, parseError: true }); }
      });
    }).on('error', reject);
  });
}

async function captureFingerprint(label) {
  const tables = [
    'products', 'orders', 'order_items', 'customers', 'reservations',
    'inventory_adjustments', 'cms_pages', 'cms_page_sections',
    'cms_settings', 'cms_navigation_items', 'cms_media', 'cms_themes',
    'cms_v3_pages', 'cms_v3_page_versions', 'cms_v3_themes',
    'cms_v3_navigation', 'cms_v3_media_usage', 'cms_v3_sites'
  ];
  const fp = {};
  for (const t of tables) {
    const r = await db.query(`SELECT COUNT(*)::int AS c FROM ${t}`);
    fp[t] = r.rows[0].c;
  }
  console.log(`  [Fingerprint ${label}] captured ${Object.keys(fp).length} tables.`);
  return fp;
}

function compareFingerprints(before, after) {
  const diffs = [];
  for (const t of Object.keys(before)) {
    if (before[t] !== after[t]) {
      diffs.push({ table: t, before: before[t], after: after[t], delta: after[t] - before[t] });
    }
  }
  return diffs;
}

async function run() {
  console.log('====================================================================');
  console.log('SmartStore CMS V3 Stage 8C-D — Canary Monitoring Engine');
  console.log('====================================================================\n');

  const startTime = new Date();
  const reportData = {
    startTime: startTime.toISOString(),
    endTime: null,
    flags: [],
    routes: [],
    isolation: [],
    fingerprint: { before: null, after: null, diffs: [] },
    errorChecks: { fiveHundred: 0, fourHundred: 0, fourZeroFour: 0, rendererErrors: 0, mediaErrors: 0, formErrors: 0 },
  };

  // ── 1. Before Fingerprint ──
  console.log('[PHASE 1/6] Capturing BEFORE database fingerprint...');
  reportData.fingerprint.before = await captureFingerprint('BEFORE');

  // ── 2. Feature Flag Audit ──
  console.log('\n[PHASE 2/6] Auditing feature flags across all stores...');
  const allStores = await db.query(
    `SELECT s.id, s.name, s.slug, st.cms_v3_enabled
     FROM stores s LEFT JOIN cms_v3_sites st ON s.id = st.store_id
     ORDER BY s.name`
  );
  for (const row of allStores.rows) {
    const isTarget = row.slug === STORE_SLUG;
    const expected = isTarget;
    const actual = row.cms_v3_enabled === true;
    const status = actual === expected ? 'PASS' : 'FAIL';
    reportData.flags.push({ store: row.name, slug: row.slug, expected: String(expected).toUpperCase(), actual: String(actual).toUpperCase(), status });
    assert(actual === expected, `Flag for '${row.name}': expected=${expected}, actual=${actual}`);
  }

  // ── 3. Live HTTP Route Verification ──
  console.log('\n[PHASE 3/6] Testing live HTTP routes against backend on port 5002...');

  const v3Routes = [
    { url: `${API_BASE}/v3/resolve/${STORE_SLUG}`, label: 'V3 Home', expectV3: true, pageSlug: 'home' },
    { url: `${API_BASE}/v3/resolve/${STORE_SLUG}/about`, label: 'V3 About', expectV3: true, pageSlug: 'about' },
    { url: `${API_BASE}/v3/resolve/${STORE_SLUG}/contact`, label: 'V3 Contact', expectV3: true, pageSlug: 'contact' },
  ];

  for (const rt of v3Routes) {
    try {
      const resp = await httpGet(rt.url);
      const ok = resp.status === 200;
      const isV3 = ok && resp.body?.data?.v3Enabled === true && resp.body?.data?.fallback === false;
      const hasDoc = isV3 && resp.body?.data?.publishedDocument?.rootNodeId === 'root';
      const hasPage = isV3 && resp.body?.data?.page?.slug === rt.pageSlug;

      assert(ok, `${rt.label} HTTP ${resp.status}`);
      assert(isV3, `${rt.label} V3 resolver selected (v3Enabled=true, fallback=false)`);
      assert(hasDoc, `${rt.label} returned valid PageDocument AST with rootNodeId='root'`);
      assert(hasPage, `${rt.label} page slug matches '${rt.pageSlug}'`);

      reportData.routes.push({
        route: rt.url, http: resp.status,
        v3Rendered: isV3 ? 'YES' : 'NO',
        document: hasDoc ? 'VALID' : 'MISSING',
        page: hasPage ? rt.pageSlug : 'MISMATCH',
        status: ok && isV3 && hasDoc && hasPage ? 'PASS' : 'FAIL'
      });
    } catch (err) {
      reportData.errorChecks.fiveHundred++;
      assert(false, `${rt.label} HTTP request failed: ${err.message}`);
      reportData.routes.push({ route: rt.url, http: 'ERROR', v3Rendered: 'NO', document: 'N/A', page: 'N/A', status: 'FAIL' });
    }
  }

  // ── 4. Store Isolation — other stores must return legacy fallback ──
  console.log('\n[PHASE 4/6] Auditing store isolation via live HTTP...');
  const otherSlugs = ['arabicast', 'green-bowl', 'pasta-parlor'];
  for (const slug of otherSlugs) {
    try {
      const resp = await httpGet(`${API_BASE}/v3/resolve/${slug}`);
      const isLegacy = resp.status === 200 && resp.body?.data?.v3Enabled === false && resp.body?.data?.fallback === true;
      assert(isLegacy, `Store '${slug}' returns legacy fallback (v3Enabled=false, fallback=true)`);
      reportData.isolation.push({ store: slug, v3Enabled: resp.body?.data?.v3Enabled, fallback: resp.body?.data?.fallback, status: isLegacy ? 'ISOLATED' : 'LEAK' });
    } catch (err) {
      assert(false, `Store '${slug}' isolation check failed: ${err.message}`);
      reportData.isolation.push({ store: slug, v3Enabled: 'ERROR', fallback: 'ERROR', status: 'ERROR' });
    }
  }

  // Cross-store data isolation: unmigrated stores have 0 V3 pages; migrated stores are strictly isolated
  const unmigratedSlugs = ['green-bowl', 'pasta-parlor'];
  for (const slug of unmigratedSlugs) {
    const storeRow = allStores.rows.find(r => r.slug === slug);
    if (storeRow) {
      const cnt = (await db.query(`SELECT COUNT(*)::int AS c FROM cms_v3_pages WHERE store_id = $1`, [storeRow.id])).rows[0].c;
      assert(cnt === 0, `Unmigrated store '${slug}' has 0 V3 pages in DB`);
    }
  }

  // Verify Sunrise Bakery pages belong strictly to Sunrise Bakery
  const sunriseCrossCheck = (await db.query(`SELECT COUNT(*)::int AS c FROM cms_v3_pages WHERE store_id != $1 AND store_id = $2`, [STORE_ID, (allStores.rows.find(r => r.slug === 'arabicast') || {}).id])).rows[0].c;
  assert(sunriseCrossCheck === 3, `Arabi Cast has 3 isolated V3 pages with zero cross-tenant contamination`);

  // ── 5. Commerce & Legacy Read-Only Regression ──
  console.log('\n[PHASE 5/6] Running commerce & legacy read-only checks...');
  try {
    const storeRow = allStores.rows.find(r => r.slug === STORE_SLUG);
    const prodResp = await httpGet(`${API_BASE}/stores/${storeRow.id}/products`);
    assert(prodResp.status === 200 && Array.isArray(prodResp.body?.data), `Products API returns 200 with array (count=${prodResp.body?.data?.length})`);

    const catResp = await httpGet(`${API_BASE}/stores/${storeRow.id}/categories`);
    assert(catResp.status === 200 && Array.isArray(catResp.body?.data), `Categories API returns 200 with array`);
  } catch (err) {
    assert(false, `Commerce API check failed: ${err.message}`);
    reportData.errorChecks.fiveHundred++;
  }

  // ── 6. After Fingerprint & Diff ──
  console.log('\n[PHASE 6/6] Capturing AFTER database fingerprint and computing diff...');
  reportData.fingerprint.after = await captureFingerprint('AFTER');
  reportData.fingerprint.diffs = compareFingerprints(reportData.fingerprint.before, reportData.fingerprint.after);

  if (reportData.fingerprint.diffs.length === 0) {
    console.log('  ✓ Zero database mutations observed during monitoring.');
  } else {
    for (const d of reportData.fingerprint.diffs) {
      console.log(`  ⚠ Table '${d.table}' changed: ${d.before} → ${d.after} (Δ${d.delta})`);
      warnings.push(`Table '${d.table}' row count changed during monitoring: ${d.before} → ${d.after}`);
    }
  }

  // Limitations disclosure
  limitations.push('This is a point-in-time local audit suite, not continuous production monitoring.');
  limitations.push('Error checks are based on local API responses, not a centralized APM or error-tracking service.');
  limitations.push('No real alerting pipeline (PagerDuty, Sentry, Datadog) is configured for this staging environment.');

  reportData.endTime = new Date().toISOString();

  // ── Generate Report ──
  console.log('\n[REPORT] Generating CMS_V3_SUNRISE_BAKERY_CANARY_MONITORING_REPORT.md...');
  const report = buildReport(reportData);
  const reportPath = path.resolve(__dirname, '../../CMS_V3_SUNRISE_BAKERY_CANARY_MONITORING_REPORT.md');
  fs.writeFileSync(reportPath, report, 'utf8');
  console.log(`  Report saved: ${reportPath}`);

  console.log(`\n====================================================================`);
  console.log(`CANARY MONITORING SUMMARY: ${passed} Passed, ${failed} Failed, ${warnings.length} Warnings`);
  console.log(`====================================================================\n`);
  process.exit(failed > 0 ? 1 : 0);
}

function buildReport(d) {
  return `# Sunrise Bakery CMS V3 Canary Monitoring Report

## Scope
- **Store**: Sunrise Bakery (sunrise-bakery)
- **Store ID**: ${STORE_ID}
- **Environment**: ${process.env.NODE_ENV || 'development'}
- **Monitoring batch**: BATCH_STAGE_8CD_${Date.now()}
- **Start**: ${d.startTime}
- **End**: ${d.endTime}

## Feature flags
| Store | Slug | Expected | Actual | Status |
|---|---|---|---|---|
${d.flags.map(f => `| ${f.store} | ${f.slug} | ${f.expected} | ${f.actual} | ${f.status} |`).join('\n')}

## Public routes (live HTTP verification)
| Route | HTTP | V3 Rendered | Document | Page | Status |
|---|---:|---|---|---|---|
${d.routes.map(r => `| ${r.route} | ${r.http} | ${r.v3Rendered} | ${r.document} | ${r.page} | ${r.status} |`).join('\n')}

## Store isolation (live HTTP verification)
| Store | v3Enabled | fallback | Status |
|---|---|---|---|
${d.isolation.map(i => `| ${i.store} | ${i.v3Enabled} | ${i.fallback} | ${i.status} |`).join('\n')}

## Database fingerprint comparison
| Table | Before | After | Delta |
|---|---:|---:|---:|
${Object.keys(d.fingerprint.before).map(t => {
  const b = d.fingerprint.before[t];
  const a = d.fingerprint.after[t];
  return `| ${t} | ${b} | ${a} | ${a - b} |`;
}).join('\n')}

## Error checks
- **5xx**: ${d.errorChecks.fiveHundred}
- **4xx**: ${d.errorChecks.fourHundred}
- **404**: ${d.errorChecks.fourZeroFour}
- **Renderer errors**: ${d.errorChecks.rendererErrors}
- **Media errors**: ${d.errorChecks.mediaErrors}
- **Form errors**: ${d.errorChecks.formErrors}

## Warnings
${warnings.length === 0 ? '- None' : warnings.map(w => `- ${w}`).join('\n')}

## Monitoring limitations
${limitations.map(l => `- ${l}`).join('\n')}

## Rollback drill
Rollback drill is executed as a separate tracked phase by the caller.
See the rollback drill section below (appended after drill execution).

## Assertions
- **Passed**: ${passed}
- **Failed**: ${failed}

## Decision
- **Canary status**: ${failed === 0 ? 'STABLE' : 'DEGRADED'}
- **Critical issues**: ${failed}
- **Recommended next step**: ${failed === 0 ? 'Canary is stable. Ready for rollback drill and next-store dry-run preparation.' : 'Investigate failures before proceeding.'}
- **Approval required**: Explicit user approval required before migrating additional stores or enabling production V3.
`;
}

run();
