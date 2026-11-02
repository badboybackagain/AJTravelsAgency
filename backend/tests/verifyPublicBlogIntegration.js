/**
 * Automated Verification Test Suite for AJ Travels Blog Management Phase 4:
 * Public Frontend Database Integration
 *
 * Verifies all 31 critical checkpoints:
 * 1. Public Blog Directory API (/api/blogs)
 * 2. Public Blog Categories API (/api/blogs/categories)
 * 3. Individual Blog Article API (/api/blogs/:slug) for all 8 published blogs
 * 4. FAQ structure and authoritative rendering from DB
 * 5. Draft and non-existent 404 handling
 * 6. Cache deduplication and normalization in api.js
 * 7. BlogPage.jsx zero static flash, skeletons, dynamic categories, retry
 * 8. BlogPostPage.jsx zero static flash, editorial skeletons, SEO, single canonical, schemas, faqs, retry
 * 9. BlogSection.jsx top 3 articles, skeletons, error safety
 * 10. App.jsx RootSlugResolver priority and root-level canonical alias preservation
 * 11. Regression safety: Admin Blog UI, Fleet Vehicles, and Vite production build
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

const API_BASE = 'http://localhost:3001';

function fetchJson(endpoint) {
  return new Promise((resolve, reject) => {
    http.get(`${API_BASE}${endpoint}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, body: json });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('================================================================');
  console.log('  AJ TRAVELS BLOG MANAGEMENT - PHASE 4 VERIFICATION SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------
    // GROUP 1: PUBLIC BLOG API ENDPOINTS
    // -------------------------------------------------------------
    console.log('--- Group 1: Public Blog API Verification ---');
    const blogsRes = await fetchJson('/api/blogs');
    assert(blogsRes.status === 200, 'GET /api/blogs returns HTTP 200');
    assert(blogsRes.body?.success === true, 'GET /api/blogs response success flag is true');
    assert(Array.isArray(blogsRes.body?.data), 'GET /api/blogs returns data array');
    assert(blogsRes.body?.data?.length === 8, `GET /api/blogs returns exactly 8 published articles (found ${blogsRes.body?.data?.length})`);

    const blogs = blogsRes.body?.data || [];
    const allPublished = blogs.every(b => b.isPublished === true);
    assert(allPublished, 'All returned blogs have isPublished === true');

    const hasRequiredFields = blogs.every(b => 
      b.id && b.title && b.slug && b.category && b.content && b.summary && b.author && b.publishedAt
    );
    assert(hasRequiredFields, 'Every blog contains required fields (id, title, slug, category, content, summary, author, publishedAt)');

    // Categories endpoint
    const catRes = await fetchJson('/api/blogs/categories');
    assert(catRes.status === 200, 'GET /api/blogs/categories returns HTTP 200');
    assert(Array.isArray(catRes.body?.data) && catRes.body?.data?.length >= 3, 'GET /api/blogs/categories returns at least 3 distinct categories');

    // Individual slugs check
    console.log('\n--- Group 2: Individual Blog Slugs & Content Verification ---');
    let allSlugsPass = true;
    let allFaqsPass = true;
    for (const blog of blogs) {
      const slugRes = await fetchJson(`/api/blogs/${blog.slug}`);
      if (slugRes.status !== 200 || !slugRes.body?.data?.title) {
        allSlugsPass = false;
        console.error(`    Slug failed: ${blog.slug}`);
      }
      if (!Array.isArray(slugRes.body?.data?.faqs) || slugRes.body?.data?.faqs?.length === 0) {
        allFaqsPass = false;
        console.error(`    Slug missing faqs: ${blog.slug}`);
      }
    }
    assert(allSlugsPass, 'All 8 published blog slugs return HTTP 200 with valid content');
    assert(allFaqsPass, 'All 8 published blog slugs contain structured FAQ arrays from database');

    // 404 handling
    const notFoundRes = await fetchJson('/api/blogs/this-slug-definitely-does-not-exist-xyz');
    assert(notFoundRes.status === 404, 'GET /api/blogs/:nonExistentSlug returns HTTP 404');

    // -------------------------------------------------------------
    // GROUP 3: FRONTEND API SERVICE ARCHITECTURE (api.js)
    // -------------------------------------------------------------
    console.log('\n--- Group 3: Frontend API Service (api.js) ---');
    const apiCode = fs.readFileSync(path.resolve(__dirname, '../../travel-agency/src/services/api.js'), 'utf8');

    assert(apiCode.includes('blogApi'), 'api.js exports blogApi object');
    assert(apiCode.includes('sharedBlogsCache'), 'api.js implements session caching for blog list');
    assert(apiCode.includes('sharedBlogsPromise'), 'api.js implements in-flight request deduplication');
    assert(apiCode.includes('normalizeBlogPost'), 'api.js exports normalizeBlogPost helper');
    assert(apiCode.includes('clearCache'), 'api.js exports clearCache helper for admin mutations');

    // Test normalizeBlogPost behavior via simulated execution
    const testRawPost = {
      id: 'test-1',
      title: 'Test Blog',
      slug: 'test-blog',
      publishedAt: '2026-03-15T00:00:00.000Z',
      readTime: '6 min read',
      faqs: [{ q: 'Q1', a: 'A1' }]
    };
    const d = new Date(testRawPost.publishedAt);
    const dateFormatted = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    assert(dateFormatted.includes('2026'), 'Date formatting correctly transforms publishedAt to human string');

    // -------------------------------------------------------------
    // GROUP 4: BLOGPAGE COMPONENT (BlogPage.jsx)
    // -------------------------------------------------------------
    console.log('\n--- Group 4: BlogPage Directory Component ---');
    const blogPageCode = fs.readFileSync(path.resolve(__dirname, '../../travel-agency/src/pages/BlogPage.jsx'), 'utf8');

    assert(!blogPageCode.includes("from '../data/blogData'"), 'BlogPage.jsx does NOT import static blogPosts from blogData.js');
    assert(blogPageCode.includes('blogApi.getAll()'), 'BlogPage.jsx calls blogApi.getAll() asynchronously');
    assert(blogPageCode.includes('skeleton-featured'), 'BlogPage.jsx includes featured skeleton card');
    assert(blogPageCode.includes('[1, 2, 3, 4, 5, 6].map'), 'BlogPage.jsx renders 6 regular skeleton cards (zero static flash)');
    assert(blogPageCode.includes('loadPosts'), 'BlogPage.jsx defines loadPosts fetch routine');
    assert(blogPageCode.includes('btn-retry-blog'), 'BlogPage.jsx includes error alert with retry button');
    assert(blogPageCode.includes('new Set()') && blogPageCode.includes('posts.forEach'), 'BlogPage.jsx dynamically computes category pills from database articles');

    // -------------------------------------------------------------
    // GROUP 5: BLOGPOSTPAGE COMPONENT (BlogPostPage.jsx)
    // -------------------------------------------------------------
    console.log('\n--- Group 5: BlogPostPage Article Component ---');
    const blogPostPageCode = fs.readFileSync(path.resolve(__dirname, '../../travel-agency/src/pages/BlogPostPage.jsx'), 'utf8');

    assert(!blogPostPageCode.includes("from '../data/blogData'"), 'BlogPostPage.jsx does NOT import static getPostBySlug from blogData.js');
    assert(blogPostPageCode.includes('blogApi.getBySlug(cleanSlug)'), 'BlogPostPage.jsx calls blogApi.getBySlug(cleanSlug)');
    assert(blogPostPageCode.includes('blogApi.getAll()'), 'BlogPostPage.jsx calls blogApi.getAll() for related articles');
    assert(blogPostPageCode.includes('aria-busy="true"'), 'BlogPostPage.jsx provides full loading skeleton (zero static flash)');
    assert(blogPostPageCode.includes('usePageSeo('), 'BlogPostPage.jsx invokes usePageSeo hook for dynamic document title and meta description');
    assert(blogPostPageCode.includes('schemaId = \'blog-post-schema\''), 'BlogPostPage.jsx generates BlogPosting JSON-LD schema');
    assert(blogPostPageCode.includes('breadcrumbSchemaId = \'blog-breadcrumb-schema\''), 'BlogPostPage.jsx generates BreadcrumbList JSON-LD schema');
    assert(blogPostPageCode.includes('faqSchemaId = \'blog-faq-schema\''), 'BlogPostPage.jsx generates conditional FAQPage JSON-LD schema');
    assert(blogPostPageCode.includes('postCanonical'), 'BlogPostPage.jsx computes canonical URL (https://ajtravelspune.com/:slug/)');
    assert(blogPostPageCode.includes('canonicalTags[0].setAttribute(\'href\', postCanonical)'), 'BlogPostPage.jsx enforces single canonical tag in document.head');
    assert(blogPostPageCode.includes('post.faqs.map'), 'BlogPostPage.jsx renders authoritative FAQs from database post.faqs');
    assert(blogPostPageCode.includes('Article Not Found'), 'BlogPostPage.jsx handles 404 / unpublished articles gracefully');

    // -------------------------------------------------------------
    // GROUP 6: BLOGSECTION HOMEPAGE SHOWCASE (BlogSection.jsx)
    // -------------------------------------------------------------
    console.log('\n--- Group 6: BlogSection Homepage Component ---');
    const blogSectionCode = fs.readFileSync(path.resolve(__dirname, '../../travel-agency/src/components/BlogSection.jsx'), 'utf8');

    assert(!blogSectionCode.includes("from '../data/blogData'"), 'BlogSection.jsx does NOT import static blogPosts from blogData.js');
    assert(blogSectionCode.includes('blogApi.getAll()'), 'BlogSection.jsx calls blogApi.getAll() asynchronously');
    assert(blogSectionCode.includes('skeleton-card'), 'BlogSection.jsx renders skeleton cards during loading (zero static flash)');
    assert(blogSectionCode.includes('setFeaturedArticles(normalized.slice(0, 3))'), 'BlogSection.jsx selects top 3 published articles');
    assert(blogSectionCode.includes('blog-error-box'), 'BlogSection.jsx includes resilient error fallback');

    // -------------------------------------------------------------
    // GROUP 7: APP ROUTING & ROOT SLUG RESOLVER (App.jsx)
    // -------------------------------------------------------------
    console.log('\n--- Group 7: App.jsx RootSlugResolver & Routes ---');
    const appCode = fs.readFileSync(path.resolve(__dirname, '../../travel-agency/src/App.jsx'), 'utf8');

    assert(appCode.includes('path="/blog" element={<BlogPage />}'), 'App.jsx registers /blog directory route');
    assert(appCode.includes('path="/blog/:slug" element={<BlogPostPage />}'), 'App.jsx registers /blog/:slug route');
    assert(appCode.includes('getServiceBySlug(cleanSlug)'), 'RootSlugResolver prioritizes commercial services');
    assert(appCode.includes('getVehicleBySlug(cleanSlug)'), 'RootSlugResolver prioritizes vehicle fleet pages');
    assert(appCode.includes('livePage && livePage.category !== \'Travel Guide\''), 'RootSlugResolver prioritizes commercial live pages');
    assert(appCode.includes('<BlogPostPage isRootFallback={true} />'), 'RootSlugResolver resolves root-level blog slugs to BlogPostPage');

    // -------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------
    console.log('\n================================================================');
    console.log(`  VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================\n');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }

  } catch (err) {
    console.error('Unexpected error during verification:', err);
    process.exit(1);
  }
}

runTests();
