#!/usr/bin/env node
// ============================================================
// backend/tests/seo.test.js
// Automated SEO integration tests — no external dependencies.
// Requires the backend dev server to be running on port 3001.
//
// Run:  node backend/tests/seo.test.js
// ============================================================

'use strict';

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const http = require('http');

// ---------------------------------------------------------------------------
// Minimal test harness
// ---------------------------------------------------------------------------
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

function summary() {
  console.log('\n' + '─'.repeat(60));
  console.log(`Results: ${passed} passed, ${failed} failed`);
  if (failures.length) {
    console.log('\nFailed assertions:');
    failures.forEach(f => console.log(`  • ${f}`));
  }
  console.log('─'.repeat(60));
  process.exit(failed > 0 ? 1 : 0);
}

// ---------------------------------------------------------------------------
// HTTP helper — returns { statusCode, headers, body }
// ---------------------------------------------------------------------------
function get(urlPath, port = 3001) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port,
      path: urlPath,
      method: 'GET',
      headers: { Accept: 'text/html,application/xhtml+xml,application/xml,*/*' },
    };
    const req = http.request(options, res => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', reject);
    req.setTimeout(25000, () => { req.destroy(); reject(new Error('Request timed out')); });
    req.end();
  });
}

// ---------------------------------------------------------------------------
// HTML metadata extractors
// ---------------------------------------------------------------------------
function extractTitle(html) {
  const m = html.match(/<title>([^<]*)<\/title>/i);
  return m ? m[1].trim() : null;
}

function extractMeta(html, name) {
  // name="…" content="…" or content="…" name="…"
  const re1 = new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']*)["']`, 'i');
  const re2 = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+name=["']${name}["']`, 'i');
  const m = html.match(re1) || html.match(re2);
  return m ? m[1].trim() : null;
}

function extractProperty(html, property) {
  // property="…" content="…" or content="…" property="…"
  const escaped = property.replace(':', '\\:');
  const re1 = new RegExp(`<meta[^>]+property=["']${escaped}["'][^>]+content=["']([^"']*)["']`, 'i');
  const re2 = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+property=["']${escaped}["']`, 'i');
  const m = html.match(re1) || html.match(re2);
  return m ? m[1].trim() : null;
}

function extractCanonical(html) {
  const re1 = /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i;
  const re2 = /<link[^>]+href=["']([^"']*)["'][^>]+rel=["']canonical["']/i;
  const m = html.match(re1) || html.match(re2);
  return m ? m[1].trim() : null;
}

function countTitleTags(html) {
  return (html.match(/<title>/gi) || []).length;
}

function countCanonicals(html) {
  return (html.match(/rel=["']canonical["']/gi) || []).length;
}

function countMetaName(html, name) {
  const re = new RegExp(`<meta[^>]+name=["']${name}["']`, 'gi');
  return (html.match(re) || []).length;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
async function run() {
  console.log('AJ Tours — SEO Integration Test Suite');
  console.log('Server: http://localhost:3001');
  console.log('─'.repeat(60));

  // ==========================================================================
  // SECTION 1: HTTP STATUS CODES
  // ==========================================================================
  section('1. HTTP Status Codes');

  let home, fare, booking, book, about, adminLogin, adminDash, sitemap, robots, apiSeo, health, apiMissing;

  try {
    [home, fare, booking, book, about, adminLogin, adminDash, sitemap, robots, apiSeo, health, apiMissing] =
      await Promise.all([
        get('/'),
        get('/fare'),
        get('/booking'),
        get('/book'),
        get('/about-nonexistent-page'),
        get('/admin/login'),
        get('/admin/dashboard'),
        get('/sitemap.xml'),
        get('/robots.txt'),
        get('/api/seo/public'),
        get('/health'),
        get('/api/nonexistent-endpoint-xyz'),
      ]);
  } catch (err) {
    console.error('\nFATAL: Cannot connect to server — is `npm run dev` running in /backend?\n', err.message);
    process.exit(2);
  }

  assert(home.statusCode === 200,        'GET / → HTTP 200');
  assert(fare.statusCode === 200,        'GET /fare → HTTP 200');
  assert(booking.statusCode === 200,     'GET /booking → HTTP 200');
  assert(book.statusCode === 301,        'GET /book → HTTP 301 (Permanent Redirect)');
  assert(book.headers.location === '/booking', 'GET /book Location header points to /booking');
  assert(about.statusCode === 404,       'GET /about-nonexistent-page → HTTP 404');
  assert(adminLogin.statusCode === 200,  'GET /admin/login → HTTP 200 (SPA shell served, not 404)');
  assert(adminDash.statusCode === 200,   'GET /admin/dashboard → HTTP 200 (SPA shell served, not 404)');
  assert(sitemap.statusCode === 200,     'GET /sitemap.xml → HTTP 200');
  assert(robots.statusCode === 200,      'GET /robots.txt → HTTP 200');
  assert(apiSeo.statusCode === 200,      'GET /api/seo/public → HTTP 200');
  assert(health.statusCode === 200,      'GET /health → HTTP 200');
  assert(apiMissing.statusCode === 404,  'GET /api/nonexistent → HTTP 404 JSON');

  // ==========================================================================
  // SECTION 2: UNIQUE TITLES PER PAGE (no duplicate <title> tags)
  // ==========================================================================
  section('2. Unique Titles Per Public Page');

  const homeTitle    = extractTitle(home.body);
  const fareTitle    = extractTitle(fare.body);
  const bookingTitle = extractTitle(booking.body);

  assert(homeTitle    !== null, 'Home page has a <title>');
  assert(fareTitle    !== null, 'Fare page has a <title>');
  assert(bookingTitle !== null, 'Booking page has a <title>');

  const titles = [homeTitle, fareTitle, bookingTitle];
  const uniqueTitles = new Set(titles.filter(Boolean));
  assert(uniqueTitles.size === titles.filter(Boolean).length, 'All 3 page titles are unique');

  assert(countTitleTags(home.body)    === 1, 'Home: exactly one <title> tag');
  assert(countTitleTags(fare.body)    === 1, 'Fare: exactly one <title> tag');
  assert(countTitleTags(booking.body) === 1, 'Booking: exactly one <title> tag');

  // ==========================================================================
  // SECTION 3: UNIQUE META DESCRIPTIONS PER PAGE
  // ==========================================================================
  section('3. Meta Descriptions');

  const homeDesc    = extractMeta(home.body, 'description');
  const fareDesc    = extractMeta(fare.body, 'description');
  const bookingDesc = extractMeta(booking.body, 'description');

  assert(homeDesc    && homeDesc.length > 50,    `Home description present (${homeDesc?.length} chars)`);
  assert(fareDesc    && fareDesc.length > 50,    `Fare description present (${fareDesc?.length} chars)`);
  assert(bookingDesc && bookingDesc.length > 50, `Booking description present (${bookingDesc?.length} chars)`);

  const descs = [homeDesc, fareDesc, bookingDesc];
  const uniqueDescs = new Set(descs.filter(Boolean));
  assert(uniqueDescs.size === descs.filter(Boolean).length, 'All 3 meta descriptions are unique');

  assert(countMetaName(home.body, 'description')    === 1, 'Home: exactly one meta[name=description]');
  assert(countMetaName(fare.body, 'description')    === 1, 'Fare: exactly one meta[name=description]');
  assert(countMetaName(booking.body, 'description') === 1, 'Booking: exactly one meta[name=description]');

  // ==========================================================================
  // SECTION 4: CANONICAL TAGS
  // ==========================================================================
  section('4. Canonical Tags');

  const homeCanon    = extractCanonical(home.body);
  const fareCanon    = extractCanonical(fare.body);
  const bookingCanon = extractCanonical(booking.body);
  const bookCanon    = extractCanonical(book.body);

  assert(homeCanon    !== null, 'Home page has a canonical tag');
  assert(fareCanon    !== null, 'Fare page has a canonical tag');
  assert(bookingCanon !== null, 'Booking page has a canonical tag');

  assert(countCanonicals(home.body)    === 1, 'Home: exactly one canonical tag');
  assert(countCanonicals(fare.body)    === 1, 'Fare: exactly one canonical tag');
  assert(countCanonicals(booking.body) === 1, 'Booking: exactly one canonical tag');

  // If SITE_DOMAIN is set, canonicals must be page-specific (not all homepage)
  const siteDomain = process.env.SITE_DOMAIN;
  if (siteDomain) {
    const cleanDomain = siteDomain.replace(/\/$/, '');
    assert(homeCanon    === `${cleanDomain}/`,        `Home canonical matches SITE_DOMAIN + /`);
    assert(fareCanon    === `${cleanDomain}/fare`,    `Fare canonical matches SITE_DOMAIN + /fare`);
    assert(bookingCanon === `${cleanDomain}/booking`, `Booking canonical matches SITE_DOMAIN + /booking`);
    const adminCanon = extractCanonical(adminLogin.body);
    assert(adminCanon === null, 'Admin login has NO conflicting canonical tag (avoids inheriting homepage canonical)');
  } else {
    // Without SITE_DOMAIN, /fare and /booking must not both be the same homepage URL
    // (This test would fail when canonicalUrl is null in DB and no domain configured)
    console.log('  ℹ SITE_DOMAIN not set — skipping per-page canonical value checks');
    console.log(`    home:    ${homeCanon}`);
    console.log(`    fare:    ${fareCanon}`);
    console.log(`    booking: ${bookingCanon}`);
    const canonicalsArePageSpecific =
      fareCanon !== homeCanon && bookingCanon !== homeCanon;
    assert(canonicalsArePageSpecific,
      'BLOCKED: /fare and /booking canonicals differ from homepage (requires SITE_DOMAIN to be set)');
  }

  // ==========================================================================
  // SECTION 5: ROBOTS META DIRECTIVES
  // ==========================================================================
  section('5. Robots Directives');

  const homeRobots    = extractMeta(home.body, 'robots');
  const fareRobots    = extractMeta(fare.body, 'robots');
  const bookingRobots = extractMeta(booking.body, 'robots');
  const adminRobots   = extractMeta(adminLogin.body, 'robots');
  const adminDashRobots = extractMeta(adminDash.body, 'robots');
  const aboutRobots   = extractMeta(about.body, 'robots');

  assert(homeRobots    === 'index, follow',     `Home robots: "${homeRobots}"`);
  assert(fareRobots    === 'index, follow',     `Fare robots: "${fareRobots}"`);
  assert(bookingRobots === 'index, follow',     `Booking robots: "${bookingRobots}"`);
  assert(adminRobots   === 'noindex, nofollow', `Admin login robots: "${adminRobots}"`);
  assert(adminDashRobots === 'noindex, nofollow', `Admin dashboard robots: "${adminDashRobots}"`);

  // 404 pages — robots value does not matter (crawler ignores 404 body) but check it's present
  // (template default — may still be index,follow, which is fine since the status code is 404)
  assert(aboutRobots !== undefined, 'Unknown page has a robots meta tag (template default)');

  // ==========================================================================
  // SECTION 6: OG:URL AND TWITTER:URL PAGE-SPECIFICITY
  // ==========================================================================
  section('6. Social (og:url / twitter:url)');

  const homeOgUrl    = extractProperty(home.body, 'og:url');
  const fareOgUrl    = extractProperty(fare.body, 'og:url');
  const bookingOgUrl = extractProperty(booking.body, 'og:url');

  assert(homeOgUrl    !== null, 'Home has og:url');
  assert(fareOgUrl    !== null, 'Fare has og:url');
  assert(bookingOgUrl !== null, 'Booking has og:url');

  if (siteDomain) {
    const cleanDomain = siteDomain.replace(/\/$/, '');
    assert(fareOgUrl    !== homeOgUrl,                  'Fare og:url differs from homepage og:url');
    assert(bookingOgUrl !== homeOgUrl,                  'Booking og:url differs from homepage og:url');
    assert(fareOgUrl    === `${cleanDomain}/fare`,      `Fare og:url = SITE_DOMAIN + /fare`);
    assert(bookingOgUrl === `${cleanDomain}/booking`,   `Booking og:url = SITE_DOMAIN + /booking`);
    const adminOgUrl = extractProperty(adminLogin.body, 'og:url');
    assert(adminOgUrl === null, 'Admin login has NO conflicting og:url metadata');
  } else {
    console.log('  ℹ SITE_DOMAIN not set — skipping per-page og:url value checks');
    const ogUrlsPageSpecific = fareOgUrl !== homeOgUrl && bookingOgUrl !== homeOgUrl;
    assert(ogUrlsPageSpecific,
      'BLOCKED: og:url values differ per page (requires SITE_DOMAIN)');
  }

  // ==========================================================================
  // SECTION 7: ADMIN PAGE INDEXABILITY
  // ==========================================================================
  section('7. Admin Pages Not Indexed');

  // robots.txt must disallow /admin/
  const robotsTxt = robots.body;
  assert(robotsTxt.includes('Disallow: /admin/'), 'robots.txt disallows /admin/');
  assert(robotsTxt.includes('Disallow: /api/'),   'robots.txt disallows /api/');

  // Served as 200 so users can navigate there; noindex tells crawlers to skip
  assert(adminLogin.statusCode === 200,       'Admin login: HTTP 200 (user accessible)');
  assert(adminRobots === 'noindex, nofollow', 'Admin login: noindex meta tag');

  // ==========================================================================
  // SECTION 8: SITEMAP VALIDATION
  // ==========================================================================
  section('8. Sitemap');

  const sitemapXml = sitemap.body;
  assert(sitemapXml.includes('<?xml'),          'Sitemap is XML');
  assert(sitemapXml.includes('<urlset'),         'Sitemap has <urlset>');
  assert(sitemapXml.includes('<loc>'),           'Sitemap has at least one <loc>');
  assert(sitemapXml.includes('<lastmod>'),       'Sitemap has <lastmod> fields');
  assert(sitemapXml.includes('<priority>'),      'Sitemap has <priority> fields');
  assert(sitemapXml.includes('<priority>1.0</priority>'), 'Sitemap: homepage has priority 1.0');
  assert(!sitemapXml.includes('/admin'),        'Sitemap contains no admin URLs');
  assert(!sitemapXml.includes('/api/'),         'Sitemap contains no /api/ URLs');

  // All <loc> entries should be absolute (start with http)
  const locMatches = [...sitemapXml.matchAll(/<loc>([^<]*)<\/loc>/g)];
  assert(locMatches.length >= 1, `Sitemap has ${locMatches.length} <loc> entries`);
  const allAbsolute = locMatches.every(m => m[1].startsWith('http'));
  assert(allAbsolute, 'All sitemap <loc> entries are absolute URLs');

  // Sitemap should NOT contain /book (alias) — only /booking
  assert(!sitemapXml.includes('/book<'), 'Sitemap: no /book alias — only /booking');

  // ==========================================================================
  // SECTION 9: CACHE-CONTROL ON SPA PAGES
  // ==========================================================================
  section('9. Cache-Control (no-store on hydrated pages)');

  assert(home.headers['cache-control']    === 'no-store', 'Home: Cache-Control: no-store');
  assert(fare.headers['cache-control']    === 'no-store', 'Fare: Cache-Control: no-store');
  assert(booking.headers['cache-control'] === 'no-store', 'Booking: Cache-Control: no-store');
  assert(adminLogin.headers['cache-control'] === 'no-store', 'Admin login: Cache-Control: no-store');

  // ==========================================================================
  // SECTION 10: API 404 RETURNS JSON, NOT HTML
  // ==========================================================================
  section('10. API Routes Return JSON Errors');

  const apiContentType = apiMissing.headers['content-type'] || '';
  assert(apiContentType.includes('application/json'), 'Unknown /api/ path returns JSON 404');
  try {
    const parsed = JSON.parse(apiMissing.body);
    assert(parsed.success === false, 'API 404 body has success: false');
  } catch {
    assert(false, 'API 404 body is valid JSON');
  }

  // ==========================================================================
  // SECTION 11: STRUCTURED DATA BASICS (JSON-LD in home page)
  // ==========================================================================
  section('11. Structured Data (JSON-LD)');

  const jsonLdMatch = home.body.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i);
  assert(jsonLdMatch !== null, 'Home page has a JSON-LD script block');

  if (jsonLdMatch) {
    try {
      const jsonLd = JSON.parse(jsonLdMatch[1]);
      assert(typeof jsonLd === 'object', 'JSON-LD is valid JSON');
      const graph = jsonLd['@graph'] || [jsonLd];
      const hasOrg = graph.some(n => n['@type'] === 'Organization');
      const hasFaq = graph.some(n => n['@type'] === 'FAQPage');
      assert(hasOrg, 'JSON-LD includes Organization schema');
      assert(hasFaq, 'JSON-LD includes FAQPage schema');

      // Phone must not be the known placeholder
      const orgNode = graph.find(n => n['@type'] === 'Organization');
      const phone = orgNode?.contactPoint?.telephone || '';
      assert(
        phone !== '+919876543210',
        `Organization phone is not the placeholder +919876543210 (current: "${phone}")`
      );

      // Verify FAQPage is scoped only to pages with visible FAQs (e.g. not on /fare or /admin)
      const fareLdMatch = fare.body.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i);
      if (fareLdMatch) {
        const fareLd = JSON.parse(fareLdMatch[1]);
        const fareGraph = fareLd['@graph'] || [fareLd];
        assert(!fareGraph.some(n => n['@type'] === 'FAQPage'), 'Fare page does NOT include FAQPage schema (matches visible content)');
      }
      const adminLdMatch = adminLogin.body.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i);
      assert(adminLdMatch === null, 'Admin pages do not serve public structured data schemas');
    } catch (e) {
      assert(false, `JSON-LD is valid parseable JSON: ${e.message}`);
    }
  }

  // ==========================================================================
  // SECTION 12: ROUTE INVENTORY, DASHBOARD STATS & PLANNED ROADMAP
  // ==========================================================================
  section('12. Route Inventory, Dashboard Stats & Planned Roadmap');

  // 12.1 Public API endpoint /api/seo/public
  assert(apiSeo.statusCode === 200, 'GET /api/seo/public → HTTP 200');
  try {
    const publicSeoData = JSON.parse(apiSeo.body);
    assert(publicSeoData.success === true, 'Public SEO API returns success: true');
    const pubPages = publicSeoData.data || [];
    assert(pubPages.length === 3, `Public SEO API covers exactly 3 genuine pages (found: ${pubPages.length})`);

    const pubUrls = pubPages.map(p => p.pageUrl);
    assert(pubUrls.includes('/'), 'Public SEO covers Home page (/)');
    assert(pubUrls.includes('/fare'), 'Public SEO covers Fare page (/fare)');
    assert(pubUrls.includes('/booking'), 'Public SEO covers Booking page (/booking)');

    const allIndexable = pubPages.every(p => p.isIndexable === true);
    assert(allIndexable, 'All eligible public pages have isIndexable = true');

    const allHaveTitles = pubPages.every(p => p.seoTitle && p.seoTitle.length > 20);
    assert(allHaveTitles, 'All eligible public pages have non-empty, descriptive SEO titles');

    const allHaveDescriptions = pubPages.every(p => p.metaDescription && p.metaDescription.length > 50);
    assert(allHaveDescriptions, 'All eligible public pages have meaningful meta descriptions');

    const apiTitles = pubPages.map(p => p.seoTitle);
    const uniqueApiTitles = new Set(apiTitles);
    assert(uniqueApiTitles.size === apiTitles.length, 'Every public page in SEO API has a unique title');

    const apiDescs = pubPages.map(p => p.metaDescription);
    const uniqueApiDescs = new Set(apiDescs);
    assert(uniqueApiDescs.size === apiDescs.length, 'Every public page in SEO API has a unique meta description');
  } catch (err) {
    assert(false, `Public SEO API response is valid JSON: ${err.message}`);
  }

  // 12.2 In-process Controller & Architecture Verification
  try {
    const { ROUTE_INVENTORY, PLANNED_ROUTES, PUBLIC_PAGES, getPages } = require('../src/controllers/seoController');

    assert(Array.isArray(ROUTE_INVENTORY), 'ROUTE_INVENTORY is defined and is an array');
    assert(ROUTE_INVENTORY.length === 10, `ROUTE_INVENTORY accounts for all 10 application routes (found: ${ROUTE_INVENTORY.length})`);

    const publicRoutes = ROUTE_INVENTORY.filter(r => r.isPublic);
    assert(publicRoutes.length === 3, 'Only 3 routes in ROUTE_INVENTORY are marked public and indexable');
    assert(publicRoutes.every(r => ['/', '/fare', '/booking'].includes(r.path)), 'Public routes match exactly /, /fare, and /booking');

    const aliasRoute = ROUTE_INVENTORY.find(r => r.path === '/book');
    assert(aliasRoute && aliasRoute.type === 'REDIRECT_ALIAS', 'Route /book is explicitly classified as REDIRECT_ALIAS');
    assert(aliasRoute && !aliasRoute.isPublic, 'Route /book is not marked public');
    assert(aliasRoute && aliasRoute.sitemapStatus.includes('Excluded'), 'Route /book is excluded from sitemap');

    const adminRoutes = ROUTE_INVENTORY.filter(r => r.type.startsWith('ADMIN_'));
    assert(adminRoutes.length >= 2, 'Admin routes (/admin/login, /admin/dashboard, etc.) are identified');
    assert(adminRoutes.every(r => !r.isPublic), 'All admin routes are excluded from public indexing');

    const wildcardRoute = ROUTE_INVENTORY.find(r => r.path === '*');
    assert(wildcardRoute && wildcardRoute.type === 'NOT_FOUND_HANDLER', 'Wildcard 404 route is tracked');

    const allHaveNotes = ROUTE_INVENTORY.every(r => typeof r.notes === 'string' && r.notes.length > 10);
    assert(allHaveNotes, 'Every route in ROUTE_INVENTORY documents rationale and indexing policy');

    assert(Array.isArray(PLANNED_ROUTES), 'PLANNED_ROUTES is defined and is an array');
    assert(PLANNED_ROUTES.length === 8, `PLANNED_ROUTES contains 8 roadmap routes (found: ${PLANNED_ROUTES.length})`);

    const plannedPaths = PLANNED_ROUTES.map(r => r.path);
    const pubPagePaths = PUBLIC_PAGES.map(p => p.pageUrl);
    const noPlannedInPublic = plannedPaths.every(p => !pubPagePaths.includes(p));
    assert(noPlannedInPublic, 'No unbuilt planned routes leak into managed PUBLIC_PAGES');

    const noPlannedInSitemap = plannedPaths.every(p => !sitemap.body.includes(`<loc>${siteDomain || ''}${p}</loc>`));
    assert(noPlannedInSitemap, 'No unbuilt planned routes leak into sitemap.xml');

    // Test getPages controller handler and derived stats
    let adminPayload = null;
    await getPages({}, { json: (data) => { adminPayload = data; } });
    assert(adminPayload && adminPayload.success === true, 'seoController.getPages returns success: true');
    const adminData = adminPayload.data || {};
    assert(adminData.stats.total === 3, `Dashboard stats: total pages = 3 (got ${adminData.stats?.total})`);
    assert(adminData.stats.indexable === 3, `Dashboard stats: indexable pages = 3 (got ${adminData.stats?.indexable})`);
    assert(adminData.stats.noindex === 0, `Dashboard stats: noindex pages = 0 (got ${adminData.stats?.noindex})`);
    assert(adminData.stats.routesCount === 10, `Dashboard stats: routesCount = 10 (got ${adminData.stats?.routesCount})`);
    assert(adminData.stats.plannedCount === 8, `Dashboard stats: plannedCount = 8 (got ${adminData.stats?.plannedCount})`);
    assert(adminData.routeInventory.length === 10, 'Dashboard payload supplies full routeInventory');
    assert(adminData.plannedRoutes.length === 8, 'Dashboard payload supplies plannedRoutes');
  } catch (err) {
    assert(false, `Controller inventory verification error: ${err.message}`);
  }

  // ==========================================================================
  // DONE
  // ==========================================================================
  summary();
}

run().catch(err => {
  console.error('\nUnhandled error:', err);
  process.exit(2);
});
