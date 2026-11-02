// ============================================================
// AJ Travels — Seed / Migration Script for Curated Blog Articles
// Idempotent migration from blogData.js to PostgreSQL BlogPost table
// Protects administrator edits from being overwritten on subsequent runs
// ============================================================

require('dotenv').config({ path: __dirname + '/../.env' });
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Load existing curated blog data
const blogDataPath = path.join(__dirname, '../../travel-agency/src/data/blogData.js');
let blogPosts = [];
try {
  // Using esm or dynamic require
  const blogModule = require(blogDataPath);
  blogPosts = blogModule.blogPosts || [];
} catch (e) {
  // If CommonJS require fails on ESM export, load via dynamic import or file parsing
}

// Deterministic calendar date mapping for accurate historical publication timestamps
const DATE_MAP = {
  'March 15, 2026': '2026-03-15T00:00:00.000Z',
  'February 28, 2026': '2026-02-28T00:00:00.000Z',
  'March 02, 2026': '2026-03-02T00:00:00.000Z',
  'February 12, 2026': '2026-02-12T00:00:00.000Z',
  'January 25, 2026': '2026-01-25T00:00:00.000Z',
  'January 10, 2026': '2026-01-10T00:00:00.000Z',
  'December 20, 2025': '2025-12-20T00:00:00.000Z',
  'November 15, 2025': '2025-11-15T00:00:00.000Z',
};

function parsePublishedDate(dateStr) {
  if (!dateStr) return null;
  if (DATE_MAP[dateStr]) {
    return new Date(DATE_MAP[dateStr]);
  }
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? null : parsed;
}

async function seedBlogs() {
  console.log('============================================================');
  console.log('  AJ Travels — Blog Migration to Database');
  console.log('============================================================');

  // If blogPosts wasn't loaded via CJS require (due to ESM export in frontend),
  // load via dynamic import
  if (!blogPosts || blogPosts.length === 0) {
    const fileUrl = 'file:///' + blogDataPath.replace(/\\/g, '/');
    const dynamicModule = await import(fileUrl);
    blogPosts = dynamicModule.blogPosts || [];
  }

  console.log(`Found ${blogPosts.length} curated articles in blogData.js to migrate.`);

  let createdCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < blogPosts.length; i++) {
    const post = blogPosts[i];
    const canonical = `https://ajtravelspune.com/${post.slug}/`;
    const publishedAt = parsePublishedDate(post.publishedDate);

    // Check if article already exists in DB
    const existing = await prisma.blogPost.findUnique({
      where: { slug: post.slug }
    });

    if (existing) {
      // PRESERVE ADMIN EDITS:
      // Do not overwrite existing articles if the seed script is run again.
      console.log(`  [SKIPPED] Blog "${post.slug}" already exists. Preserving database content.`);
      skippedCount++;
      continue;
    }

    // Insert new blog post
    await prisma.blogPost.create({
      data: {
        slug: post.slug,
        title: post.title,
        metaTitle: post.metaTitle || null,
        metaDesc: post.metaDesc || null,
        canonicalUrl: canonical,
        category: post.category,
        categorySlug: post.categorySlug || null,
        author: post.author || 'AJ Travels Editorial Team',
        publishedAt: publishedAt,
        readTime: post.readTime || '5 min read',
        featuredImage: post.featuredImage || '/assets/pune-to-mumbai-premium-travel-banner.webp',
        imageAlt: post.title,
        summary: post.summary,
        pickupDefault: post.pickupDefault || 'pune',
        dropDefault: post.dropDefault || 'mumbai',
        content: post.content, // JSON structured blocks
        faqs: post.faqs || null, // JSON FAQs
        relatedPosts: post.relatedPosts || null, // JSON array of slugs
        isPublished: true, // Initially published
        isFeatured: i === 0, // First article featured
        displayOrder: i + 1,
      }
    });

    console.log(`  [CREATED] Blog "${post.slug}" migrated successfully.`);
    createdCount++;
  }

  console.log('------------------------------------------------------------');
  console.log(`Migration Summary: ${createdCount} created, ${skippedCount} skipped (already exist).`);
  console.log('============================================================\n');

  return { createdCount, skippedCount, total: blogPosts.length };
}

if (require.main === module) {
  seedBlogs()
    .catch((err) => {
      console.error('Fatal blog migration error:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = { seedBlogs };

