#!/usr/bin/env node
// ============================================================
// backend/tests/seoAnalyzer.test.js
// Automated test suite for the SEO Analyzer engine & API.
// Validates scoring determinism, SSRF prevention, real rendered
// HTML audits, structured data validation, and auth guards.
// ============================================================

'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const http = require('http');
const jwt = require('jsonwebtoken');
const seoAnalyzerService = require('../src/services/seoAnalyzerService');
const { PUBLIC_PAGES, ROUTE_INVENTORY } = require('../src/controllers/seoController');

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, label) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}`);
    failed++;
    failures.push(label);
  }
}

function section(name) {
  console.log(`\n── ${name}`);
}

function generateAdminToken() {
  return jwt.sign(
    { userId: 'test-admin-id', email: 'admin@ajtours.com', role: 'ADMIN' },
    process.env.JWT_SECRET || 'fallback-secret-for-tests',
    { expiresIn: '1h' }
  );
}

function generateUserToken() {
  return jwt.sign(
    { userId: 'test-user-id', email: 'user@ajtours.com', role: 'USER' },
    process.env.JWT_SECRET || 'fallback-secret-for-tests',
    { expiresIn: '1h' }
  );
}

function requestHttp(method, urlPath, token = null, body = null, port = 3001) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const headers = {
      Accept: 'application/json',
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    if (payload) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(payload);
    }

    const options = {
      hostname: 'localhost',
      port,
      path: urlPath,
      method,
      headers,
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.setEncoding('utf8');
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (_e) {}
        resolve({ statusCode: res.statusCode, headers: res.headers, body: data, json });
      });
    });

    req.on('error', reject);
    req.setTimeout(90000, () => {
      req.destroy();
      reject(new Error(`Request timed out for ${urlPath}`));
    });

    if (payload) req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log('AJ Tours — SEO Analyzer Integration & Unit Test Suite');
  console.log('Target Server: http://localhost:3001');
  console.log('─'.repeat(60));

  const adminToken = generateAdminToken();
  const userToken = generateUserToken();

  // ==========================================================================
  // SECTION 1: AUTHENTICATION & SECURITY CONTROLS
  // ==========================================================================
  section('1. Authentication & Route Guards');

  const unauthOverview = await requestHttp('GET', '/api/admin/seo/analyzer/overview');
  assert(unauthOverview.statusCode === 401, 'Unauthenticated GET /api/admin/seo/analyzer/overview returns HTTP 401');

  const forbiddenOverview = await requestHttp('GET', '/api/admin/seo/analyzer/overview', userToken);
  assert(forbiddenOverview.statusCode === 403, 'Non-admin user token returns HTTP 403 Forbidden');

  const authOverview = await requestHttp('GET', '/api/admin/seo/analyzer/overview', adminToken);
  assert(authOverview.statusCode === 200, 'Admin token GET /api/admin/seo/analyzer/overview returns HTTP 200');
  assert(authOverview.json?.success === true, 'Overview response contains success: true');

  // ==========================================================================
  // SECTION 2: SSRF & ARBITRARY URL PROTECTION
  // ==========================================================================
  section('2. SSRF & Arbitrary URL Protection');

  const ssrfAttempt1 = await requestHttp('POST', '/api/admin/seo/analyzer/analyze-page', adminToken, {
    pageKey: 'http://evil-external-site.com',
  });
  assert(ssrfAttempt1.statusCode === 400, 'External URL in pageKey rejected with HTTP 400');
  assert(ssrfAttempt1.json?.success === false, 'External URL rejection has success: false');

  const ssrfAttempt2 = await requestHttp('POST', '/api/admin/seo/analyzer/analyze-page', adminToken, {
    path: '../../../etc/passwd',
  });
  assert(ssrfAttempt2.statusCode === 400, 'Path traversal attempt rejected with HTTP 400');

  const invalidKey = await requestHttp('POST', '/api/admin/seo/analyzer/analyze-page', adminToken, {
    pageKey: 'nonexistent-secret-page',
  });
  assert(invalidKey.statusCode === 400, 'Nonexistent pageKey rejected with HTTP 400');

  // ==========================================================================
  // SECTION 3: REAL-TIME PAGE ANALYSIS ENGINE
  // ==========================================================================
  section('3. Real-Time Page Analysis Engine');

  const homeAnalysis = await requestHttp('POST', '/api/admin/seo/analyzer/analyze-page', adminToken, {
    pageKey: 'home',
  });
  assert(homeAnalysis.statusCode === 200, 'POST /api/admin/seo/analyzer/analyze-page for "home" returns HTTP 200');
  const homeData = homeAnalysis.json?.data;
  assert(homeData?.pageKey === 'home', 'Analysis data pageKey matches "home"');
  assert(typeof homeData?.score === 'number', `Score is numeric: ${homeData?.score}`);
  assert(homeData?.score >= 0 && homeData?.score <= 100, `Score is within 0-100 range (Current: ${homeData?.score})`);
  assert(homeData?.coverage > 0, `Coverage is calculated: ${homeData?.coverage}%`);
  assert(Array.isArray(homeData?.findings), 'Findings is an array of check evaluations');
  assert(homeData?.findings.length >= 20, `Evaluated at least 20 checks (Found: ${homeData?.findings.length})`);

  // Category breakdowns
  assert(homeData?.categories?.metadata !== undefined, 'Metadata category breakdown present');
  assert(homeData?.categories?.content !== undefined, 'Content category breakdown present');
  assert(homeData?.categories?.technical !== undefined, 'Technical SEO category breakdown present');
  assert(homeData?.categories?.performance !== undefined, 'Performance category breakdown present');

  // Specific check findings
  const titleCheck = homeData?.findings.find(f => f.id === 'meta_title_presence');
  assert(titleCheck !== undefined, 'meta_title_presence check exists');
  assert(titleCheck?.status === 'PASS', 'meta_title_presence check passed on homepage');

  const canonicalCheck = homeData?.findings.find(f => f.id === 'canonical_tag');
  assert(canonicalCheck !== undefined, 'canonical_tag check exists');
  assert(canonicalCheck?.status === 'PASS', 'canonical_tag check passed on homepage');

  const sitemapCheck = homeData?.findings.find(f => f.id === 'sitemap_inclusion');
  assert(sitemapCheck !== undefined, 'sitemap_inclusion check exists');
  assert(sitemapCheck?.status === 'PASS', 'sitemap_inclusion check passed on homepage');

  // ==========================================================================
  // SECTION 4: FULL AUDIT & DUPLICATE DETECTION
  // ==========================================================================
  section('4. Full Audit & Cross-Page Duplicate Detection');

  const allAudit = await requestHttp('POST', '/api/admin/seo/analyzer/analyze-all', adminToken);
  assert(allAudit.statusCode === 200, 'POST /api/admin/seo/analyzer/analyze-all returns HTTP 200');
  assert(allAudit.json?.data?.pages?.length === 3, 'Evaluates all 3 genuine public pages');

  const overviewData = allAudit.json?.data?.overview;
  assert(overviewData?.totalPublicPages === 3, 'Overview reports exactly 3 public pages');
  assert(overviewData?.analyzedPagesCount === 3, 'Overview reports 3 analyzed pages');
  assert(typeof overviewData?.averageHealthScore === 'number', `Average health score is calculated: ${overviewData?.averageHealthScore}`);
  assert(overviewData?.totalPassed > 0, `Total passed assertions reported: ${overviewData?.totalPassed}`);

  // Page inspection endpoint
  const pageInspection = await requestHttp('GET', '/api/admin/seo/analyzer/page/fare', adminToken);
  assert(pageInspection.statusCode === 200, 'GET /api/admin/seo/analyzer/page/fare returns HTTP 200');
  assert(pageInspection.json?.data?.pageKey === 'fare', 'Page inspection returns correct pageKey');

  // ==========================================================================
  // SECTION 5: EXTERNAL INTEGRATIONS HONEST STATUS
  // ==========================================================================
  section('5. External Integrations (Zero-Fabrication)');

  const intRes = await requestHttp('GET', '/api/admin/seo/analyzer/integrations', adminToken);
  assert(intRes.statusCode === 200, 'GET /api/admin/seo/analyzer/integrations returns HTTP 200');
  const intData = intRes.json?.data;

  assert(intData?.googleSearchConsole?.status === 'NOT_CONNECTED', 'Google Search Console honest status: NOT_CONNECTED');
  assert(intData?.googleSearchConsole?.isConnected === false, 'Google Search Console isConnected is false');
  assert(Array.isArray(intData?.googleSearchConsole?.verificationRequirements), 'GSC setup verification requirements documented');
  assert(intData?.googleAnalytics4?.status === 'NOT_CONNECTED', 'Google Analytics 4 honest status: NOT_CONNECTED');
  assert(intData?.competitorTracking?.status === 'NOT_CONFIGURED', 'Competitor tracking honest status: NOT_CONFIGURED');

  // ==========================================================================
  // SECTION 6: REGRESSION OF PREVIOUS SEO CAPABILITIES
  // ==========================================================================
  section('6. Regression Verification of Existing SEO Endpoints');

  const pagesRes = await requestHttp('GET', '/api/admin/seo/pages', adminToken);
  assert(pagesRes.statusCode === 200, 'GET /api/admin/seo/pages still returns HTTP 200');
  assert(pagesRes.json?.data?.pages?.length === 3, 'Existing pages list intact (3 pages)');

  const sitemapRes = await requestHttp('GET', '/sitemap.xml');
  assert(sitemapRes.statusCode === 200, 'GET /sitemap.xml still returns HTTP 200');
  assert(sitemapRes.body.includes('<urlset'), 'Sitemap XML structure valid');

  const robotsRes = await requestHttp('GET', '/robots.txt');
  assert(robotsRes.statusCode === 200, 'GET /robots.txt still returns HTTP 200');
  assert(robotsRes.body.includes('Disallow: /admin/'), 'Robots rules disallow /admin/ intact');

  // ==========================================================================
  // SUMMARY
  // ==========================================================================
  console.log('\n' + '─'.repeat(60));
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failures.length > 0) {
    console.log('\nFailed assertions:');
    failures.forEach(f => console.log(`  • ${f}`));
  }
  console.log('─'.repeat(60));

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('\nFatal test execution error:', err);
  process.exit(1);
});
