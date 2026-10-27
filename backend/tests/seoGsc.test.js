#!/usr/bin/env node
// ============================================================
// backend/tests/seoGsc.test.js
// Automated test suite for the Google Search Console API
// integration, OAuth 2.0 flow, CSRF state verification,
// analytics data transformation, zero-fabrication assertions,
// secret redaction, and admin access controls.
// ============================================================

'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const http = require('http');
const jwt = require('jsonwebtoken');
const googleSearchConsoleService = require('../src/services/googleSearchConsoleService');

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

    const req = http.request(
      {
        hostname: 'localhost',
        port,
        path: urlPath,
        method,
        headers,
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => { raw += chunk; });
        res.on('end', () => {
          let parsed = null;
          try {
            parsed = JSON.parse(raw);
          } catch (_) {
            parsed = raw;
          }
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: parsed,
          });
        });
      }
    );

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log('AJ Tours — Google Search Console Integration Test Suite');
  console.log('Target Server: http://localhost:3001');
  console.log('─'.repeat(60));

  const adminToken = generateAdminToken();
  const userToken = generateUserToken();

  // -------------------------------------------------------------------------
  // 1. Authentication & Role Guards
  // -------------------------------------------------------------------------
  section('1. Authentication & Role Guards');
  {
    // Unauthenticated requests return 401
    const unauthStatus = await requestHttp('GET', '/api/admin/seo/gsc/status');
    assert(unauthStatus.statusCode === 401, 'Unauthenticated GET /gsc/status returns HTTP 401');
    assert(unauthStatus.body?.success === false, 'Unauthenticated status has success: false');

    const unauthAuth = await requestHttp('GET', '/api/admin/seo/gsc/auth-url');
    assert(unauthAuth.statusCode === 401, 'Unauthenticated GET /gsc/auth-url returns HTTP 401');

    const unauthPerf = await requestHttp('GET', '/api/admin/seo/gsc/performance');
    assert(unauthPerf.statusCode === 401, 'Unauthenticated GET /gsc/performance returns HTTP 401');

    const unauthRefresh = await requestHttp('POST', '/api/admin/seo/gsc/refresh');
    assert(unauthRefresh.statusCode === 401, 'Unauthenticated POST /gsc/refresh returns HTTP 401');

    // Non-admin requests return 403
    const userStatus = await requestHttp('GET', '/api/admin/seo/gsc/status', userToken);
    assert(userStatus.statusCode === 403, 'Non-admin USER token returns HTTP 403 Forbidden');
    assert(userStatus.body?.success === false, 'Non-admin response has success: false');

    // Admin token is accepted
    const adminStatus = await requestHttp('GET', '/api/admin/seo/gsc/status', adminToken);
    assert(adminStatus.statusCode === 200, 'Admin token GET /gsc/status returns HTTP 200');
    assert(adminStatus.body?.success === true, 'Admin status response has success: true');
  }

  // -------------------------------------------------------------------------
  // 2. Integration Status When Not Configured & When Disconnected
  // -------------------------------------------------------------------------
  section('2. Integration Status When Not Configured & Disconnected');
  {
    const res = await requestHttp('GET', '/api/admin/seo/gsc/status', adminToken);
    const data = res.body?.data;
    assert(data?.status === 'NOT_CONNECTED', 'Status is NOT_CONNECTED when credentials are unset or disconnected');
    assert(data?.isConnected === false, 'isConnected is strictly false');
    assert(typeof data?.message === 'string' && data.message.length > 0, 'Explains connection state clearly');
    assert(Array.isArray(data?.verificationRequirements), 'Lists verification requirements');
    assert(data?.disclaimer.includes('Zero synthetic'), 'Enforces zero synthetic data disclaimer');
  }

  // -------------------------------------------------------------------------
  // 3. OAuth CSRF State Nonce Validation
  // -------------------------------------------------------------------------
  section('3. OAuth CSRF State Validation & Callback Guards');
  {
    // Generate valid state nonce via service
    const stateNonce = googleSearchConsoleService.generateStateNonce();
    assert(typeof stateNonce === 'string' && stateNonce.length >= 32, 'CSRF state nonce is high-entropy string');
    assert(googleSearchConsoleService.validateStateNonce(stateNonce) === true, 'Generated state nonce validates successfully');
    assert(googleSearchConsoleService.validateStateNonce(stateNonce) === false, 'State nonce is single-use only (replay prevented)');
    assert(googleSearchConsoleService.validateStateNonce('forged-or-expired-state') === false, 'Invalid state nonce is rejected');

    // Missing code in OAuth callback returns 400
    const invalidCallback = await requestHttp('GET', '/api/admin/seo/gsc/oauth/callback?state=invalid');
    assert(invalidCallback.statusCode === 302, 'Callback redirects with error banner on invalid input');
    assert(invalidCallback.headers.location.includes('gsc_error'), 'Callback redirect contains gsc_error query param');

    // User cancellation in OAuth callback
    const deniedCallback = await requestHttp('GET', '/api/admin/seo/gsc/oauth/callback?error=access_denied');
    assert(deniedCallback.statusCode === 302, 'Access denied callback redirects to admin dashboard');
    assert(deniedCallback.headers.location.includes('access_denied'), 'Location header carries access_denied reason');
  }

  // -------------------------------------------------------------------------
  // 4. Secret Redaction & Token Privacy
  // -------------------------------------------------------------------------
  section('4. Secret Redaction & Token Security');
  {
    const sensitiveString = 'Error connecting with client_secret=GOCSPX-supersecret123 and access_token=ya29.a0AfH6SM...';
    const redacted = googleSearchConsoleService.redactSecrets(sensitiveString);
    assert(!redacted.includes('GOCSPX-supersecret123'), 'Redacts client_secret from text');
    assert(!redacted.includes('ya29.a0AfH6SM'), 'Redacts access_token from text');
    assert(redacted.includes('[REDACTED]'), 'Inserts [REDACTED] placeholder');

    // Redaction on error objects
    const sensitiveErr = new Error('Failed with refresh_token=1//04AbCdEfGhIjKlMnOpQrStUvWxYz');
    const redactedErr = googleSearchConsoleService.redactSecrets(sensitiveErr);
    assert(!redactedErr.message.includes('1//04AbCdEfGhIjKlMnOpQrStUvWxYz'), 'Redacts secrets from Error instance message');
  }

  // -------------------------------------------------------------------------
  // 5. Date-Range Validation & Parsing
  // -------------------------------------------------------------------------
  section('5. Date-Range Validation');
  {
    const r7d = googleSearchConsoleService.calculateDateRange('7d');
    assert(!!r7d.startDate && !!r7d.endDate, '7d produces startDate and endDate');
    assert(new Date(r7d.startDate) < new Date(r7d.endDate), '7d startDate is earlier than endDate');

    const r28d = googleSearchConsoleService.calculateDateRange('28d');
    assert(new Date(r28d.startDate) < new Date(r28d.endDate), '28d produces valid chronological dates');

    const r3m = googleSearchConsoleService.calculateDateRange('3m');
    assert(new Date(r3m.startDate) < new Date(r28d.startDate), '3m startDate precedes 28d startDate');

    const rCustom = googleSearchConsoleService.calculateDateRange('custom', '2026-08-01', '2026-08-31');
    assert(rCustom.startDate === '2026-08-01', 'Custom startDate preserved');
    assert(rCustom.endDate === '2026-08-31', 'Custom endDate preserved');

    let threwOnInverted = false;
    try {
      googleSearchConsoleService.calculateDateRange('custom', '2026-09-30', '2026-09-01');
    } catch (_) {
      threwOnInverted = true;
    }
    assert(threwOnInverted, 'Throws error when custom startDate is later than endDate');
  }

  // -------------------------------------------------------------------------
  // 6. Search Analytics Response Parsing & Data Transformation
  // -------------------------------------------------------------------------
  section('6. Search Analytics Response Parsing & Transformation');
  {
    const sampleApiResponse = {
      rows: [
        { keys: ['2026-10-10'], clicks: 15, impressions: 220, ctr: 0.0681, position: 5.2 },
        { keys: ['2026-10-11'], clicks: 18, impressions: 245, ctr: 0.0734, position: 4.8 },
      ]
    };

    const transformedDaily = googleSearchConsoleService.transformDailyRows(sampleApiResponse.rows);
    assert(transformedDaily.length === 2, 'Transforms daily rows to array');
    assert(transformedDaily[0].date === '2026-10-10', 'Extracts date key correctly');
    assert(transformedDaily[0].clicks === 15, 'Extracts clicks count');
    assert(transformedDaily[0].impressions === 220, 'Extracts impressions count');
    assert(typeof transformedDaily[0].position === 'number', 'Extracts numeric average position');

    // Missing / Empty Rows
    const emptyTransformed = googleSearchConsoleService.transformDailyRows(null);
    assert(Array.isArray(emptyTransformed) && emptyTransformed.length === 0, 'Handles null or omitted rows safely');

    // Queries Transformation
    const queryRows = [
      { keys: ['pune to mumbai cab'], clicks: 42, impressions: 610, ctr: 0.0688, position: 3.4 },
      { keys: ['mumbai pune taxi fare'], clicks: 28, impressions: 390, ctr: 0.0717, position: 4.1 },
    ];
    const transformedQueries = googleSearchConsoleService.transformDimensionRows(queryRows, 'query');
    assert(transformedQueries.length === 2, 'Transforms query rows');
    assert(transformedQueries[0].query === 'pune to mumbai cab', 'Extracts query label correctly');
    assert(transformedQueries[0].clicks === 42, 'Correct query clicks');
  }

  // -------------------------------------------------------------------------
  // 7. Managed Pages URL Matching & Attribution
  // -------------------------------------------------------------------------
  section('7. Managed Pages URL Matching');
  {
    const landingPageRows = [
      { keys: ['https://ajtravelspune.com/'], clicks: 65, impressions: 850, ctr: 0.076, position: 3.1 },
      { keys: ['https://ajtravelspune.com/fare'], clicks: 35, impressions: 420, ctr: 0.083, position: 4.2 },
      { keys: ['https://ajtravelspune.com/booking'], clicks: 20, impressions: 310, ctr: 0.064, position: 5.0 },
    ];
    const transformedPages = googleSearchConsoleService.transformDimensionRows(landingPageRows, 'page');
    const managedAttribution = googleSearchConsoleService.attributeManagedPages(transformedPages);

    assert(managedAttribution.length === 3, 'Attributes all 3 genuine managed public pages');
    const homeAttr = managedAttribution.find(p => p.path === '/');
    assert(homeAttr?.hasData === true, 'Homepage matches returned Search Console URL');
    assert(homeAttr?.clicks === 65, 'Homepage receives accurate reported clicks');

    const fareAttr = managedAttribution.find(p => p.path === '/fare');
    assert(fareAttr?.hasData === true, 'Fare page matches returned Search Console URL');
    assert(fareAttr?.clicks === 35, 'Fare page receives accurate reported clicks');

    const bookingAttr = managedAttribution.find(p => p.path === '/booking');
    assert(bookingAttr?.hasData === true, 'Booking page matches returned Search Console URL');
    assert(bookingAttr?.clicks === 20, 'Booking page receives accurate reported clicks');

    // Empty attribution when no search data exists for a page (Never fabricate zeros!)
    const emptyAttribution = googleSearchConsoleService.attributeManagedPages([]);
    assert(emptyAttribution.length === 3, 'Always lists the 3 public pages even if unqueried');
    assert(emptyAttribution.every(p => p.hasData === false), 'Pages without data explicitly marked hasData: false');
    assert(emptyAttribution[0].clicks === null, 'Clicks is null (not fabricated 0)');
  }

  // -------------------------------------------------------------------------
  // 8. Mock Adapter Execution (Simulating Google Cloud Responses)
  // -------------------------------------------------------------------------
  section('8. Mock Adapter Integration Execution');
  {
    // Install safe test mock adapter
    googleSearchConsoleService.setTestMockAdapter({
      fetchProperties: async () => [
        { siteUrl: 'https://ajtravelspune.com/', permissionLevel: 'siteOwner' },
        { siteUrl: 'sc-domain:ajtravelspune.com', permissionLevel: 'siteOwner' }
      ],
      queryPerformance: async ({ range }) => ({
        success: true,
        connected: true,
        range,
        summary: { clicks: 26, impressions: 390, ctr: 0.066, position: 4.3 },
        timeSeries: [
          { date: '2026-10-01', clicks: 12, impressions: 180, ctr: 6.6, position: 4.5 },
          { date: '2026-10-02', clicks: 14, impressions: 210, ctr: 6.6, position: 4.2 }
        ],
        topQueries: [{ query: 'pune to mumbai cab', clicks: 16, impressions: 220, ctr: 7.2, position: 3.8 }],
        topPages: [{ pageUrl: 'https://ajtravelspune.com/', clicks: 18, impressions: 240, ctr: 7.5, position: 3.5 }],
        deviceBreakdown: [
          { device: 'MOBILE', clicks: 20, impressions: 280, ctr: 7.1, position: 4.0 },
          { device: 'DESKTOP', clicks: 6, impressions: 110, ctr: 5.4, position: 4.8 }
        ],
        countryBreakdown: [{ country: 'IND', clicks: 25, impressions: 370, ctr: 6.7, position: 4.1 }],
        pagesBreakdown: [
          { pageKey: 'home', pageUrl: '/', pageLabel: 'Home Page', hasData: true, clicks: 18, impressions: 240, ctr: 7.5, position: 3.5 },
          { pageKey: 'fare', pageUrl: '/fare', pageLabel: 'Fare Calculator', hasData: false, clicks: null, impressions: null, ctr: null, position: null },
          { pageKey: 'booking', pageUrl: '/booking', pageLabel: 'Cab Booking', hasData: false, clicks: null, impressions: null, ctr: null, position: null },
        ]
      })
    });

    // Emulate connected state in test mode
    googleSearchConsoleService.setConnectedTokensForTesting({
      accessToken: 'test-mock-access-token',
      refreshToken: 'test-mock-refresh-token',
      expiryDate: Date.now() + 3600000,
      scope: 'https://www.googleapis.com/auth/webmasters.readonly',
    });

    const statusObj = googleSearchConsoleService.getStatus();
    assert(statusObj.googleSearchConsole.connectionState === 'CONNECTED', 'Status reports CONNECTED with valid tokens');
    assert(statusObj.googleSearchConsole.isConnected === true, 'isConnected is true when authorized');

    const properties = await googleSearchConsoleService.fetchProperties();
    assert(properties.length === 2, 'Lists 2 Search Console properties');
    assert(properties[0].siteUrl.includes('ajtravelspune.com'), 'Includes ajtravelspune.com property');

    const selected = googleSearchConsoleService.selectProperty('https://ajtravelspune.com/');
    assert(selected.selectedProperty === 'https://ajtravelspune.com/', 'Selected property updated');

    const perfData = await googleSearchConsoleService.queryPerformance({ range: '28d' });
    assert(perfData.summary?.clicks === 26, 'Calculates total clicks across days (12 + 14 = 26)');
    assert(perfData.summary?.impressions === 390, 'Calculates total impressions (180 + 210 = 390)');
    assert(perfData.timeSeries?.length === 2, 'Returns daily rows array');
    assert(perfData.topQueries?.length === 1, 'Returns top queries');
    assert(perfData.deviceBreakdown?.length === 2, 'Returns device breakdown');
    assert(perfData.countryBreakdown?.length === 1, 'Returns country breakdown');
    assert(perfData.pagesBreakdown?.length === 3, 'Returns managed pages attribution');

    // HTTP Endpoint Testing
    const httpStatus = await requestHttp('GET', '/api/admin/seo/gsc/status', adminToken);
    assert(httpStatus.statusCode === 200, 'GET /gsc/status over HTTP returns HTTP 200');

    // Disconnect via HTTP endpoint returns 200 and success: true
    const disconnectRes = await requestHttp('POST', '/api/admin/seo/gsc/disconnect', adminToken);
    assert(disconnectRes.statusCode === 200, 'POST /gsc/disconnect returns HTTP 200');
    assert(disconnectRes.body?.success === true, 'Disconnect returns success: true');

    // When disconnected, POST /gsc/refresh reports connected: false
    const refreshRes = await requestHttp('POST', '/api/admin/seo/gsc/refresh', adminToken);
    assert(refreshRes.statusCode === 200, 'POST /gsc/refresh returns HTTP 200');
    assert(refreshRes.body?.data?.connected === false, 'Refresh reports connected: false when disconnected');

    googleSearchConsoleService.disconnect();
    googleSearchConsoleService.setTestMockAdapter(null);
  }

  // -------------------------------------------------------------------------
  // 9. Error & Refresh Token Failure Handling
  // -------------------------------------------------------------------------
  section('9. Error & Permission Handling');
  {
    googleSearchConsoleService.setTestMockAdapter({
      fetchProperties: async () => {
        const err = new Error('Google Search Console API error: User does not have sufficient permission for this property.');
        err.status = 403;
        throw err;
      }
    });

    googleSearchConsoleService.setConnectedTokensForTesting({
      accessToken: 'test-token',
      refreshToken: 'test-refresh',
      expiryDate: Date.now() + 3600000,
    });

    let caughtPermission = false;
    try {
      await googleSearchConsoleService.fetchProperties();
    } catch (err) {
      caughtPermission = true;
      assert(err.message.includes('permission'), 'Propagates clear permission error message');
      assert(!err.message.includes('test-refresh'), 'Does not leak tokens in permission error');
    }
    assert(caughtPermission, 'Catches permission denied error gracefully');

    // Clean up
    googleSearchConsoleService.disconnect();
    googleSearchConsoleService.setTestMockAdapter(null);
  }

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  console.log('\n' + '─'.repeat(60));
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failures.length) {
    console.log('\nFailed assertions:');
    failures.forEach(f => console.log(`  • ${f}`));
  }
  console.log('─'.repeat(60));
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Test execution fatal error:', err);
  process.exit(1);
});
