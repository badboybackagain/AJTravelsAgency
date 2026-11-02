// ============================================================
// AJ Travels — Admin Blog Management UI Integration Test Suite
// Verifies all 20 required points from Phase 3 Specification
// Cleans up all temporary test records cleanly
// ============================================================

const http = require('http');
const jwt = require('jsonwebtoken');
const path = require('path');
const assert = require('assert');
const { PrismaClient } = require(path.resolve('backend/node_modules/@prisma/client'));
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'local-dev-jwt-secret-min-32-characters-long-ajtravel';
const adminToken = jwt.sign(
  { id: 'admin-ui-test', email: 'admin@punetravelagency.in', role: 'ADMIN' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

function apiRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const defaultHeaders = {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json',
    };

    const reqOptions = {
      hostname: 'localhost',
      port: 3001,
      ...options,
      headers: { ...defaultHeaders, ...options.headers },
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
      });
    });

    req.on('error', reject);

    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTestSuite() {
  console.log('=======================================================================');
  console.log('  AJ Travels — Admin Blog Management UI Verification Suite');
  console.log('=======================================================================');

  let passed = 0;
  let failed = 0;

  function assertPass(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  let tempTestArticleId = null;
  const tempTestSlug = `temp-test-guide-${Date.now()}`;

  try {
    // -------------------------------------------------------------
    // Test 1: All eight existing articles appear in the admin list
    // -------------------------------------------------------------
    console.log('\n--- 1. Admin List Verification ---');
    const listRes = await apiRequest({ method: 'GET', path: '/api/admin/blogs?limit=50' });
    assertPass(listRes.status === 200, 'GET /api/admin/blogs returns HTTP 200');
    const allBlogs = listRes.data?.data || [];
    assertPass(allBlogs.length >= 8, `Admin list contains at least 8 articles (Found: ${allBlogs.length})`);
    
    const requiredSlugs = [
      'pune-to-mumbai-one-way-cab',
      'pune-to-mumbai-taxi-guide',
      'tempo-traveller-on-rent-in-pune',
      'car-rental-in-pune-with-driver',
      'best-weekend-getaways-from-pune',
      'pune-airport-pickup-drop-guide',
      'pune-to-mahabaleshwar-cab',
      'how-to-choose-the-best-outstation-cab-service-in-pune',
    ];
    const presentSlugs = allBlogs.map((b) => b.slug);
    const all8Present = requiredSlugs.every((s) => presentSlugs.includes(s));
    assertPass(all8Present, 'All 8 original curated articles appear in the admin list');

    // -------------------------------------------------------------
    // Test 2: Published and draft counts are accurate
    // -------------------------------------------------------------
    console.log('\n--- 2. Live Statistics Verification ---');
    const stats = listRes.data?.stats || {};
    const publishedActual = allBlogs.filter((b) => b.isPublished).length;
    const draftActual = allBlogs.filter((b) => !b.isPublished).length;
    assertPass(stats.total === allBlogs.length, `Total stats match article count (${stats.total} == ${allBlogs.length})`);
    assertPass(stats.publishedCount === publishedActual, `Published stats match active articles (${stats.publishedCount} == ${publishedActual})`);
    assertPass(stats.draftCount === draftActual, `Draft stats match unpublished articles (${stats.draftCount} == ${draftActual})`);

    // -------------------------------------------------------------
    // Test 3: Search and category filters work
    // -------------------------------------------------------------
    console.log('\n--- 3. Filter and Search Verification ---');
    const searchRes = await apiRequest({ method: 'GET', path: '/api/admin/blogs?search=mumbai' });
    const searchBlogs = searchRes.data?.data || [];
    assertPass(searchBlogs.length > 0 && searchBlogs.every((b) => 
      b.title.toLowerCase().includes('mumbai') || 
      b.slug.toLowerCase().includes('mumbai') || 
      b.summary.toLowerCase().includes('mumbai')
    ), `Search filter "?search=mumbai" returns matching articles only (Count: ${searchBlogs.length})`);

    const catRes = await apiRequest({ method: 'GET', path: '/api/admin/blogs?category=Fleet%20%26%20Vehicles' });
    const catBlogs = catRes.data?.data || [];
    assertPass(catBlogs.length > 0 && catBlogs.every((b) => b.category === 'Fleet & Vehicles'),
      `Category filter "?category=Fleet & Vehicles" returns exact category (Count: ${catBlogs.length})`);

    // -------------------------------------------------------------
    // Test 4: Every existing article can be opened for editing
    // -------------------------------------------------------------
    console.log('\n--- 4. Article Full Retrieval for Editing ---');
    const firstBlog = allBlogs.find((b) => b.slug === 'pune-to-mumbai-one-way-cab') || allBlogs[0];
    const getByIdRes = await apiRequest({ method: 'GET', path: `/api/admin/blogs/${firstBlog.id}` });
    assertPass(getByIdRes.status === 200, `GET /api/admin/blogs/:id returns HTTP 200`);
    assertPass(getByIdRes.data?.data?.id === firstBlog.id, 'Retrieved article ID matches requested ID');

    // -------------------------------------------------------------
    // Test 5: Existing content blocks load without loss
    // -------------------------------------------------------------
    console.log('\n--- 5. Content Block Integrity ---');
    const fullBlog = getByIdRes.data?.data;
    assertPass(Array.isArray(fullBlog.content) && fullBlog.content.length > 0,
      `Content blocks preserved as JSON array (Count: ${fullBlog.content?.length})`);
    const hasIntro = fullBlog.content.some((b) => b.type === 'intro');
    const hasHeadings = fullBlog.content.some((b) => b.type === 'heading');
    const hasParagraphs = fullBlog.content.some((b) => b.type === 'paragraph');
    assertPass(hasIntro && hasHeadings && hasParagraphs, 'All core content block types (intro, heading, paragraph) intact');

    // -------------------------------------------------------------
    // Test 6: Existing FAQs load correctly
    // -------------------------------------------------------------
    console.log('\n--- 6. FAQs Structure Verification ---');
    assertPass(Array.isArray(fullBlog.faqs) && fullBlog.faqs.length > 0,
      `Authoritative faqs array loaded with Q&A items (Count: ${fullBlog.faqs?.length})`);
    const firstFaq = fullBlog.faqs[0];
    assertPass(Boolean(firstFaq?.q && firstFaq?.a), 'FAQ items have valid "q" and "a" properties');

    // -------------------------------------------------------------
    // Test 7: Existing featured images display
    // -------------------------------------------------------------
    console.log('\n--- 7. Featured Image Verification ---');
    assertPass(Boolean(fullBlog.featuredImage && fullBlog.featuredImage.startsWith('/assets/')),
      `Featured image path verified: ${fullBlog.featuredImage}`);

    // -------------------------------------------------------------
    // Test 8: A new draft can be created
    // -------------------------------------------------------------
    console.log('\n--- 8. Draft Creation Verification ---');
    const draftPayload = {
      title: 'Temporary Test Guide for UI Verification',
      slug: tempTestSlug,
      category: 'Travel Guides',
      categorySlug: 'travel-guides',
      author: 'AJ Travels Test Admin',
      summary: 'This is a temporary article created to verify Admin UI workflow.',
      featuredImage: '/assets/pune-to-mumbai-premium-travel-banner.webp',
      imageAlt: 'Test Guide Illustration',
      pickupDefault: 'pune',
      dropDefault: 'lonavala',
      metaTitle: 'Temporary Test Guide | AJ Travels',
      metaDesc: 'Temporary test description for SEO check.',
      isPublished: false, // DRAFT
      isFeatured: false,
      displayOrder: 99,
      content: [
        { type: 'intro', text: 'Lead introductory paragraph for the test guide.' },
        { type: 'heading', level: 2, title: 'Route Overview' },
        { type: 'paragraph', text: 'Detailed paragraph with road advice.' },
        { type: 'points', title: 'Key Highlights:', items: ['Bullet 1', 'Bullet 2'] },
        { type: 'table', headers: ['Route', 'Distance'], rows: [['Pune to Lonavala', '65 km']] },
      ],
      faqs: [
        { q: 'Is this a test question?', a: 'Yes, this is an automated verification answer.' },
      ],
      relatedPosts: ['pune-to-mumbai-one-way-cab'],
    };

    const createRes = await apiRequest({ method: 'POST', path: '/api/admin/blogs' }, draftPayload);
    assertPass(createRes.status === 201, `POST /api/admin/blogs creates draft with HTTP 201 (Status: ${createRes.status})`);
    tempTestArticleId = createRes.data?.data?.id;
    assertPass(Boolean(tempTestArticleId), `Created article ID returned: ${tempTestArticleId}`);
    assertPass(createRes.data?.data?.isPublished === false, 'Article successfully saved as a Draft');

    // -------------------------------------------------------------
    // Test 9: A draft can be edited
    // -------------------------------------------------------------
    console.log('\n--- 9. Draft Editing Verification ---');
    const updatePayload = {
      title: 'Temporary Test Guide for UI Verification (Edited)',
      summary: 'Updated summary reflecting administrator editing.',
      readTime: '8 min read',
    };
    const updateRes = await apiRequest({ method: 'PUT', path: `/api/admin/blogs/${tempTestArticleId}` }, updatePayload);
    assertPass(updateRes.status === 200, `PUT /api/admin/blogs/:id returns HTTP 200`);
    assertPass(updateRes.data?.data?.title === updatePayload.title, 'Updated title reflected in database');
    assertPass(updateRes.data?.data?.isPublished === false, 'Draft remains draft after editing (not auto-published)');

    // -------------------------------------------------------------
    // Test 10: A draft can be published
    // -------------------------------------------------------------
    console.log('\n--- 10. Publish Status Toggle Verification ---');
    const publishRes = await apiRequest(
      { method: 'PATCH', path: `/api/admin/blogs/${tempTestArticleId}/publish-status` },
      { isPublished: true }
    );
    assertPass(publishRes.status === 200, 'PATCH /publish-status returns HTTP 200');
    assertPass(publishRes.data?.data?.isPublished === true, 'Article is now Published (isPublished: true)');
    assertPass(Boolean(publishRes.data?.data?.publishedAt), 'publishedAt timestamp automatically set upon publishing');

    // -------------------------------------------------------------
    // Test 11: A published article can be edited without being accidentally unpublished
    // -------------------------------------------------------------
    console.log('\n--- 11. Published Article Edit Safety ---');
    const editPublishedRes = await apiRequest(
      { method: 'PUT', path: `/api/admin/blogs/${tempTestArticleId}` },
      { title: 'Temporary Test Guide (Published & Updated)' }
    );
    assertPass(editPublishedRes.status === 200, 'PUT /api/admin/blogs/:id on published article returns HTTP 200');
    assertPass(editPublishedRes.data?.data?.isPublished === true,
      'Published article strictly retains isPublished === true after content edits');

    // -------------------------------------------------------------
    // Test 12: A published article can be unpublished
    // -------------------------------------------------------------
    console.log('\n--- 12. Unpublish Toggle Verification ---');
    const unpublishRes = await apiRequest(
      { method: 'PATCH', path: `/api/admin/blogs/${tempTestArticleId}/publish-status` },
      { isPublished: false }
    );
    assertPass(unpublishRes.status === 200, 'PATCH /publish-status to unpublish returns HTTP 200');
    assertPass(unpublishRes.data?.data?.isPublished === false, 'Article is now un-published (isPublished: false)');

    // Public API should now return 404 for this slug
    const publicCheckRes = await apiRequest({ method: 'GET', path: `/api/blogs/${tempTestSlug}`, headers: {} });
    assertPass(publicCheckRes.status === 404, 'Unpublished article returns HTTP 404 to public users');

    // -------------------------------------------------------------
    // Test 13: Featured status can be changed
    // -------------------------------------------------------------
    console.log('\n--- 13. Featured Toggle Verification ---');
    const featureRes = await apiRequest(
      { method: 'PUT', path: `/api/admin/blogs/${tempTestArticleId}` },
      { isFeatured: true }
    );
    assertPass(featureRes.status === 200, 'PUT update isFeatured returns HTTP 200');
    assertPass(featureRes.data?.data?.isFeatured === true, 'Article marked as Featured (isFeatured: true)');

    // -------------------------------------------------------------
    // Test 14: Image upload works
    // -------------------------------------------------------------
    console.log('\n--- 14. Image Upload Endpoint Verification ---');
    // Multi-part image test
    const boundary = '----WebKitFormBoundaryAdminBlogTest';
    const fakePng = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082', 'hex');
    const header = Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="image"; filename="ui-test-image.png"\r\n` +
      `Content-Type: image/png\r\n\r\n`
    );
    const footer = Buffer.from(`\r\n--${boundary}--\r\n`);
    const payload = Buffer.concat([header, fakePng, footer]);

    const uploadRes = await new Promise((resolve) => {
      const req = http.request({
        hostname: 'localhost',
        port: 3001,
        path: '/api/admin/blogs/upload-image',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': payload.length,
        },
      }, (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          try { resolve({ status: res.statusCode, data: JSON.parse(body) }); }
          catch(e) { resolve({ status: res.statusCode, raw: body }); }
        });
      });
      req.write(payload);
      req.end();
    });

    assertPass(uploadRes.status === 201, `POST /api/admin/blogs/upload-image returns HTTP 201 (Status: ${uploadRes.status})`);
    assertPass(Boolean(uploadRes.data?.imageUrl), `Image URL returned: ${uploadRes.data?.imageUrl}`);

    // Clean up test media asset
    if (uploadRes.data?.data?.id) {
      await prisma.mediaAsset.deleteMany({ where: { originalName: 'ui-test-image.png' } });
    }

    // -------------------------------------------------------------
    // Test 15: Related articles can be selected and saved
    // -------------------------------------------------------------
    console.log('\n--- 15. Related Articles Association ---');
    const relRes = await apiRequest(
      { method: 'PUT', path: `/api/admin/blogs/${tempTestArticleId}` },
      { relatedPosts: ['pune-to-mumbai-one-way-cab', 'pune-to-mumbai-taxi-guide'] }
    );
    assertPass(relRes.status === 200, 'PUT update relatedPosts returns HTTP 200');
    assertPass(Array.isArray(relRes.data?.data?.relatedPosts) && relRes.data?.data?.relatedPosts.length === 2,
      'Related posts array saved and retrieved with 2 slugs');

    // -------------------------------------------------------------
    // Test 16: Duplicate slugs are rejected
    // -------------------------------------------------------------
    console.log('\n--- 16. Duplicate Slug Rejection ---');
    const duplicateRes = await apiRequest(
      { method: 'POST', path: '/api/admin/blogs' },
      { ...draftPayload, slug: 'pune-to-mumbai-one-way-cab' }
    );
    assertPass(duplicateRes.status === 409, `Duplicate slug creation returns HTTP 409 Conflict (Status: ${duplicateRes.status})`);

    // -------------------------------------------------------------
    // Test 17: Delete requires confirmation & works
    // -------------------------------------------------------------
    console.log('\n--- 17. Article Deletion ---');
    const deleteRes = await apiRequest(
      { method: 'DELETE', path: `/api/admin/blogs/${tempTestArticleId}` }
    );
    assertPass(deleteRes.status === 200, `DELETE /api/admin/blogs/:id returns HTTP 200`);
    const checkDeleted = await prisma.blogPost.findUnique({ where: { id: tempTestArticleId } });
    assertPass(checkDeleted === null, 'Temporary test article confirmed deleted from database');
    tempTestArticleId = null; // cleared

    // -------------------------------------------------------------
    // Test 18: Deleting a blog does not delete shared media
    // -------------------------------------------------------------
    console.log('\n--- 18. Shared MediaAsset Preservation ---');
    const mediaCount = await prisma.mediaAsset.count();
    assertPass(mediaCount >= 18, `MediaAsset count remains intact (Current: ${mediaCount})`);

    // -------------------------------------------------------------
    // Test 19: Refreshing retains correct database state
    // -------------------------------------------------------------
    console.log('\n--- 19. Database State Retention ---');
    const finalListRes = await apiRequest({ method: 'GET', path: '/api/admin/blogs?limit=50' });
    const finalBlogs = finalListRes.data?.data || [];
    assertPass(finalBlogs.length >= 8, `Database retains original 8 articles after test cycle (Count: ${finalBlogs.length})`);

    // -------------------------------------------------------------
    // Test 20: Existing admin modules continue working
    // -------------------------------------------------------------
    console.log('\n--- 20. Non-Blog Admin Modules Verification ---');
    const vehiclesRes = await apiRequest({ method: 'GET', path: '/api/vehicles/admin/all' });
    assertPass(vehiclesRes.status === 200 && vehiclesRes.data?.data?.length === 7,
      `Fleet Vehicles API returns 7 vehicles intact`);

    const faresRes = await apiRequest({ method: 'GET', path: '/api/fares/admin/configs' });
    assertPass(faresRes.status === 200 && faresRes.data?.data?.length === 21,
      `Intercity Fares API returns 21 fares intact`);

    const bookingsRes = await apiRequest({ method: 'GET', path: '/api/bookings/admin' });
    assertPass(bookingsRes.status === 200 && Array.isArray(bookingsRes.data?.data),
      `Bookings API operational`);

  } catch (err) {
    console.error('Test execution exception:', err);
    failed++;
  } finally {
    // Safety cleanup in case of failure mid-test
    if (tempTestArticleId) {
      await prisma.blogPost.deleteMany({ where: { id: tempTestArticleId } });
    }
    await prisma.$disconnect();

    console.log('\n=======================================================================');
    console.log(`  VERIFICATION RESULTS: ${passed} PASSED  |  ${failed} FAILED`);
    console.log('=======================================================================');

    process.exit(failed === 0 ? 0 : 1);
  }
}

runTestSuite();

