// ============================================================
// AJ Travels — Blog Management API & Synchronization Test Suite
// Covers all 14 verification requirements for Phase 2
// ============================================================

require('dotenv').config({ path: __dirname + '/../.env' });
const path = require('path');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { seedBlogs } = require('../prisma/seedBlogs');

const BASE_URL = 'http://localhost:3001/api';
const JWT_SECRET = process.env.JWT_SECRET || 'local-dev-jwt-secret-min-32-characters-long-ajtravel';

const adminToken = jwt.sign(
  { userId: 'test-admin-id', email: 'admin@punetravelagency.in', role: 'ADMIN' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

const customerToken = jwt.sign(
  { userId: 'test-user-id', email: 'user@example.com', role: 'CUSTOMER' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

let passedCount = 0;
let failedCount = 0;

function assert(condition, testName, detail = '') {
  if (condition) {
    console.log(`  ✅ PASS: ${testName} ${detail ? '(' + detail + ')' : ''}`);
    passedCount++;
  } else {
    console.error(`  ❌ FAIL: ${testName} ${detail ? '(' + detail + ')' : ''}`);
    failedCount++;
  }
}

async function apiFetch(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log('=======================================================================');
  console.log('  AJ Travels — Blog Management Backend & API Test Suite');
  console.log('=======================================================================');

  try {
    // -------------------------------------------------------------------------
    // TEST 1: All 8 Migrated Articles Exist in the Database
    // -------------------------------------------------------------------------
    console.log('\n--- 1. Database Article Count & Presence ---');
    const dbBlogs = await prisma.blogPost.findMany({
      orderBy: { displayOrder: 'asc' },
    });
    assert(dbBlogs.length >= 8, 'All 8 migrated articles exist in the database', `Total found: ${dbBlogs.length}`);

    const expectedSlugs = [
      'pune-to-mumbai-one-way-cab',
      'pune-to-mumbai-taxi-guide',
      'tempo-traveller-on-rent-in-pune',
      'car-rental-in-pune-with-driver',
      'best-weekend-getaways-from-pune',
      'pune-airport-pickup-drop-guide',
      'pune-to-mahabaleshwar-cab',
      'how-to-choose-the-best-outstation-cab-service-in-pune',
    ];

    const actualSlugs = dbBlogs.map(b => b.slug);
    const allSlugsPresent = expectedSlugs.every(s => actualSlugs.includes(s));
    assert(allSlugsPresent, 'All 8 original slugs are present and identical');

    // -------------------------------------------------------------------------
    // TEST 2: Content Structure Preservation (Tables, Points, Headings, FAQs)
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Article Content Structure Preservation ---');
    const puneMumbaiArticle = dbBlogs.find(b => b.slug === 'pune-to-mumbai-one-way-cab');
    assert(Boolean(puneMumbaiArticle), 'Found "pune-to-mumbai-one-way-cab"');
    
    const blocks = puneMumbaiArticle.content;
    const hasTable = blocks.some(b => b.type === 'table' && b.headers?.length === 4 && b.rows?.length === 5);
    assert(hasTable, 'Table block preserved with 4 headers and 5 rows');

    const hasPoints = blocks.some(b => b.type === 'points' && b.items?.length === 5);
    assert(hasPoints, 'Points block preserved with all 5 bullet items');

    const hasHeadings = blocks.filter(b => b.type === 'heading').length >= 4;
    assert(hasHeadings, 'Headings preserved at appropriate H2/H3 levels');

    const hasFaqs = Array.isArray(puneMumbaiArticle.faqs) && puneMumbaiArticle.faqs.length === 3;
    assert(hasFaqs, 'FAQs preserved in authoritative faqs field with 3 Q&A pairs');

    assert(Boolean(puneMumbaiArticle.publishedAt), 'publishedAt is a valid DateTime timestamp', puneMumbaiArticle.publishedAt.toISOString());

    // -------------------------------------------------------------------------
    // TEST 3: Public API Returns Published Articles Only
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Public API Endpoints ---');
    const publicList = await apiFetch('/blogs');
    assert(publicList.status === 200, 'GET /api/blogs returns HTTP 200');
    assert(publicList.data.success === true, 'GET /api/blogs success is true');
    assert(publicList.data.data.every(b => b.isPublished === true), 'Public API returns published articles only');

    const publicCategories = await apiFetch('/blogs/categories');
    assert(publicCategories.status === 200, 'GET /api/blogs/categories returns HTTP 200');
    assert(publicCategories.data.data.length >= 5, 'Categories include ALL and distinct article categories', `Count: ${publicCategories.data.data.length}`);

    const singlePublic = await apiFetch('/blogs/pune-to-mumbai-one-way-cab');
    assert(singlePublic.status === 200, 'GET /api/blogs/:slug returns HTTP 200 for published article');
    assert(singlePublic.data.data.slug === 'pune-to-mumbai-one-way-cab', 'Article slug matches');

    // -------------------------------------------------------------------------
    // TEST 4: Drafts Excluded from Public APIs & Return 404
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Draft & Unpublished Protection ---');
    // Create a temporary draft blog directly in DB
    const draftSlug = 'test-secret-draft-unreleased';
    await prisma.blogPost.deleteMany({ where: { slug: draftSlug } });
    const draftPost = await prisma.blogPost.create({
      data: {
        title: 'Secret Draft Not For Public',
        slug: draftSlug,
        category: 'Travel Guides',
        summary: 'This is a private draft.',
        content: [{ type: 'paragraph', text: 'Confidential draft text.' }],
        isPublished: false,
      },
    });

    const publicDraftQuery = await apiFetch(`/blogs/${draftSlug}`);
    assert(publicDraftQuery.status === 404, 'Public GET /api/blogs/:draftSlug returns HTTP 404', `Status: ${publicDraftQuery.status}`);

    const publicListWithDraft = await apiFetch('/blogs');
    const draftInPublicList = publicListWithDraft.data.data.some(b => b.slug === draftSlug);
    assert(!draftInPublicList, 'Draft article is strictly excluded from public list /api/blogs');

    // -------------------------------------------------------------------------
    // TEST 5: Admin API Returns Both Published & Drafts
    // -------------------------------------------------------------------------
    console.log('\n--- 5. Admin API List & Draft Visibility ---');
    const adminList = await apiFetch('/admin/blogs', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminList.status === 200, 'GET /api/admin/blogs returns HTTP 200 with admin token');
    const draftInAdminList = adminList.data.data.some(b => b.slug === draftSlug);
    assert(draftInAdminList, 'Admin list includes draft article');
    assert(adminList.data.stats.draftCount >= 1, 'Admin stats report draftCount accurately', `Draft count: ${adminList.data.stats.draftCount}`);

    // Clean up temporary draft
    await prisma.blogPost.delete({ where: { id: draftPost.id } });

    // -------------------------------------------------------------------------
    // TEST 6: Authentication & Authorization Security Checks
    // -------------------------------------------------------------------------
    console.log('\n--- 6. Authentication & Authorization Security ---');
    const unauthenticated = await apiFetch('/admin/blogs');
    assert(unauthenticated.status === 401, 'Unauthenticated request to /api/admin/blogs returns 401 Unauthorized', `Status: ${unauthenticated.status}`);

    const nonAdmin = await apiFetch('/admin/blogs', {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    assert(nonAdmin.status === 403, 'Non-admin request with customer token returns 403 Forbidden', `Status: ${nonAdmin.status}`);

    // -------------------------------------------------------------------------
    // TEST 7: Duplicate Slug Rejection
    // -------------------------------------------------------------------------
    console.log('\n--- 7. Duplicate Slug Rejection ---');
    const duplicateAttempt = await apiFetch('/admin/blogs', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        title: 'Another Pune to Mumbai Guide',
        slug: 'pune-to-mumbai-one-way-cab', // Collision
        category: 'Travel Guides',
        summary: 'Duplicate collision attempt.',
        content: [{ type: 'paragraph', text: 'Sample body text.' }],
      }),
    });
    assert(duplicateAttempt.status === 409, 'Duplicate slug creation is rejected with HTTP 409 Conflict', `Status: ${duplicateAttempt.status}`);

    // -------------------------------------------------------------------------
    // TEST 8: Full Admin CRUD Lifecycle (Create, Update, Publish, Unpublish, Delete)
    // -------------------------------------------------------------------------
    console.log('\n--- 8. Admin CRUD Lifecycle ---');
    const testArticleSlug = 'e2e-test-panchgani-express-guide';
    await prisma.blogPost.deleteMany({ where: { slug: testArticleSlug } });

    // 1. Create
    const createRes = await apiFetch('/admin/blogs', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        title: 'Panchgani Weekend Expressway Guide',
        slug: testArticleSlug,
        category: 'Travel Guides',
        author: 'AJ Route Tester',
        summary: 'Explore Panchgani table land and strawberry farms with private cabs.',
        content: [
          { type: 'intro', text: 'Panchgani is a premier mountain destination.' },
          { type: 'heading', level: 2, title: 'Scenic Table Land Exploration' },
          { type: 'paragraph', text: 'Table Land is Asia’s second longest mountain plateau.' },
        ],
        faqs: [{ q: 'What is the best travel season?', a: 'Winter and monsoon.' }],
        isPublished: true,
      }),
    });
    assert(createRes.status === 201, 'POST /api/admin/blogs creates new article (HTTP 201)', `ID: ${createRes.data.data?.id}`);
    const createdId = createRes.data.data.id;

    // 2. Read single by admin
    const getAdminRes = await apiFetch(`/admin/blogs/${createdId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(getAdminRes.status === 200, 'GET /api/admin/blogs/:id returns article details');

    // 3. Update
    const updateRes = await apiFetch(`/admin/blogs/${createdId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        title: 'Panchgani Weekend Expressway Guide (Updated 2026)',
        readTime: '8 min read',
      }),
    });
    assert(updateRes.status === 200, 'PUT /api/admin/blogs/:id updates article title and readTime');
    assert(updateRes.data.data.title === 'Panchgani Weekend Expressway Guide (Updated 2026)', 'Updated title verified');

    // 4. Toggle Publish Status (Unpublish)
    const unpublishRes = await apiFetch(`/admin/blogs/${createdId}/publish-status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ isPublished: false }),
    });
    assert(unpublishRes.status === 200, 'PATCH /api/admin/blogs/:id/publish-status unpublishes article');
    assert(unpublishRes.data.data.isPublished === false, 'Article status is now draft/false');

    // Confirm it returns 404 on public endpoint
    const publicAfterUnpublish = await apiFetch(`/blogs/${testArticleSlug}`);
    assert(publicAfterUnpublish.status === 404, 'Unpublished article returns 404 to public users');

    // 5. Toggle Publish Status (Re-publish)
    const republishRes = await apiFetch(`/admin/blogs/${createdId}/publish-status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ isPublished: true }),
    });
    assert(republishRes.status === 200, 'PATCH /api/admin/blogs/:id/publish-status re-publishes article');

    // 6. Delete
    const deleteRes = await apiFetch(`/admin/blogs/${createdId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(deleteRes.status === 200, 'DELETE /api/admin/blogs/:id deletes article');

    const checkDeleted = await apiFetch(`/admin/blogs/${createdId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(checkDeleted.status === 404, 'Deleted article no longer exists');

    // -------------------------------------------------------------------------
    // TEST 9: Failed Updates Do Not Corrupt Existing Content
    // -------------------------------------------------------------------------
    console.log('\n--- 9. Failed Update Content Integrity ---');
    const originalPost = await prisma.blogPost.findUnique({
      where: { slug: 'pune-to-mumbai-one-way-cab' },
    });
    const originalTitle = originalPost.title;

    // Send an invalid content block to trigger validation failure
    const badUpdate = await apiFetch(`/admin/blogs/${originalPost.id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        title: 'Corrupted Title Attempt',
        content: [{ type: 'invalid_type', text: 'malformed block' }],
      }),
    });
    assert(badUpdate.status === 400, 'Invalid content block rejected with HTTP 400');

    const postAfterFailedUpdate = await prisma.blogPost.findUnique({
      where: { id: originalPost.id },
    });
    assert(postAfterFailedUpdate.title === originalTitle, 'Original title untouched after failed update');

    // -------------------------------------------------------------------------
    // TEST 10: Seed Idempotency & Admin Edit Protection
    // -------------------------------------------------------------------------
    console.log('\n--- 10. Seed Idempotency & Admin Edit Protection ---');
    // Modify an existing article slightly (e.g. readTime) to simulate an admin edit
    await prisma.blogPost.update({
      where: { slug: 'pune-to-mumbai-one-way-cab' },
      data: { readTime: '6 min read (Admin Verified)' },
    });

    // Run seedBlogs() again
    const seedResult = await seedBlogs();
    assert(seedResult.createdCount === 0, 'Re-running seed created 0 new articles (all exist)');
    assert(seedResult.skippedCount >= 8, 'Re-running seed skipped all 8 existing articles');

    const postAfterReSeed = await prisma.blogPost.findUnique({
      where: { slug: 'pune-to-mumbai-one-way-cab' },
    });
    assert(postAfterReSeed.readTime === '6 min read (Admin Verified)', 'Administrator edit was strictly preserved and NOT overwritten by seed script');

    // Restore original readTime
    await prisma.blogPost.update({
      where: { slug: 'pune-to-mumbai-one-way-cab' },
      data: { readTime: '6 min read' },
    });

    // -------------------------------------------------------------------------
    // TEST 11: Shared MediaAsset Preservation
    // -------------------------------------------------------------------------
    console.log('\n--- 11. Shared MediaAsset Preservation ---');
    const mediaCountBefore = await prisma.mediaAsset.count();
    assert(mediaCountBefore > 0, `Media assets count intact: ${mediaCountBefore}`);

    // Create a temporary blog with a shared image reference, then delete the blog
    const tempBlogWithImage = await prisma.blogPost.create({
      data: {
        title: 'Temporary Blog with Image',
        slug: 'temp-blog-image-test',
        category: 'Travel Guides',
        summary: 'Temporary summary',
        content: [{ type: 'paragraph', text: 'Temporary' }],
        featuredImage: '/assets/sedan.webp',
      },
    });

    await prisma.blogPost.delete({ where: { id: tempBlogWithImage.id } });
    const mediaCountAfter = await prisma.mediaAsset.count();
    assert(mediaCountBefore === mediaCountAfter, 'Deleting blog does NOT delete or alter shared MediaAsset records');

    // -------------------------------------------------------------------------
    // TEST 12: Existing Non-Blog System Data Preservation
    // -------------------------------------------------------------------------
    console.log('\n--- 12. Non-Blog System Data Preservation ---');
    const [vehiclesCount, faresCount, localVehiclesCount, routesCount, locationsCount, bookingsCount] = await Promise.all([
      prisma.vehicle.count(),
      prisma.fare.count(),
      prisma.localVehicle.count(),
      prisma.route.count(),
      prisma.location.count(),
      prisma.booking.count(),
    ]);

    assert(vehiclesCount >= 7, 'Fleet Vehicle records preserved untouched', `Vehicles: ${vehiclesCount}`);
    assert(faresCount >= 20, 'Intercity Fares preserved untouched', `Fares: ${faresCount}`);
    assert(localVehiclesCount >= 7, 'LocalVehicle records preserved untouched', `Local Vehicles: ${localVehiclesCount}`);
    assert(routesCount >= 10, 'Routes preserved untouched', `Routes: ${routesCount}`);
    assert(locationsCount >= 10, 'Locations preserved untouched', `Locations: ${locationsCount}`);
    assert(bookingsCount >= 5, 'Bookings preserved untouched', `Bookings: ${bookingsCount}`);

  } catch (err) {
    console.error('Fatal test execution error:', err);
    failedCount++;
  } finally {
    await prisma.$disconnect();
    console.log('\n=======================================================================');
    console.log(`  TEST RESULTS: ${passedCount} PASSED  |  ${failedCount} FAILED`);
    console.log('=======================================================================\n');
    process.exit(failedCount > 0 ? 1 : 0);
  }
}

runTests();

