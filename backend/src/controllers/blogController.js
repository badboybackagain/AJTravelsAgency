// ============================================================
// AJ Travels — Blog Management Controller
// Public & Protected Admin CRUD for Articles & Travel Guides
// ============================================================

const prisma = require('../utils/prisma');
const { AppError } = require('../middleware/errorHandler');

/**
 * Generate a clean, URL-safe slug from a string
 */
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}

/**
 * Validate structured content blocks
 */
function calculateReadTime(content, summary = '') {
  let wordCount = 0;
  if (Array.isArray(content)) {
    content.forEach((b) => {
      if (b.text) wordCount += b.text.split(/\s+/).filter(Boolean).length;
      if (b.title) wordCount += b.title.split(/\s+/).filter(Boolean).length;
      if (Array.isArray(b.items)) wordCount += b.items.join(' ').split(/\s+/).filter(Boolean).length;
      if (Array.isArray(b.rows)) wordCount += b.rows.map(r => Array.isArray(r) ? r.join(' ') : '').join(' ').split(/\s+/).filter(Boolean).length;
    });
  }
  if (summary) wordCount += summary.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(wordCount / 200));
  return `${minutes} min read`;
}

function validateContentBlocks(blocks) {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    throw new AppError('Article content must be a non-empty array of structured blocks.', 400);
  }

  const validTypes = ['intro', 'heading', 'paragraph', 'points', 'table', 'image'];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    if (!block || typeof block !== 'object') {
      throw new AppError(`Content block #${i + 1} is invalid.`, 400);
    }
    if (!validTypes.includes(block.type)) {
      throw new AppError(`Block #${i + 1} has unsupported type "${block.type}". Allowed: ${validTypes.join(', ')}.`, 400);
    }

    if (block.type === 'intro' || block.type === 'paragraph') {
      if (!block.text || typeof block.text !== 'string' || !block.text.trim()) {
        throw new AppError(`Block #${i + 1} (${block.type}) requires non-empty "text".`, 400);
      }
    } else if (block.type === 'heading') {
      if (!block.title || typeof block.title !== 'string' || !block.title.trim()) {
        throw new AppError(`Block #${i + 1} (heading) requires a non-empty "title".`, 400);
      }
      if (block.level && ![2, 3].includes(Number(block.level))) {
        throw new AppError(`Block #${i + 1} heading level must be 2 (H2) or 3 (H3).`, 400);
      }
    } else if (block.type === 'points') {
      if (!Array.isArray(block.items) || block.items.length === 0) {
        throw new AppError(`Block #${i + 1} (points) requires a non-empty "items" array.`, 400);
      }
    } else if (block.type === 'table') {
      if (!Array.isArray(block.headers) || !Array.isArray(block.rows)) {
        throw new AppError(`Block #${i + 1} (table) requires "headers" and "rows" arrays.`, 400);
      }
    } else if (block.type === 'image') {
      if (!block.url || typeof block.url !== 'string') {
        throw new AppError(`Block #${i + 1} (image) requires a valid "url".`, 400);
      }
    }
  }
}

// ============================================================
// PUBLIC BLOG CONTROLLERS
// ============================================================

/**
 * GET /api/blogs — List published blog articles
 * Supports filtering by ?category, ?search, ?limit, ?page
 */
// In-memory caching for public blogs & categories
let publicBlogsCache = null;
let publicBlogsCacheTime = 0;
let blogCategoriesCache = null;
let blogCategoriesCacheTime = 0;
const BLOGS_CACHE_TTL = 60000; // 60 seconds

const invalidateBlogCache = () => {
  publicBlogsCache = null;
  publicBlogsCacheTime = 0;
  blogCategoriesCache = null;
  blogCategoriesCacheTime = 0;
};

const getAllBlogs = async (req, res, next) => {
  try {
    const { category, search, page = 1, limit = 50 } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const take = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * take;

    const isDefaultRequest = (!category || category === 'ALL') && (!search || !search.trim()) && pageNum === 1;
    const now = Date.now();
    if (isDefaultRequest && publicBlogsCache && (now - publicBlogsCacheTime < BLOGS_CACHE_TTL)) {
      return res.json(publicBlogsCache);
    }

    const where = {
      isPublished: true,
    };

    if (category && category !== 'ALL') {
      where.category = category;
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { summary: { contains: q, mode: 'insensitive' } },
        { category: { contains: q, mode: 'insensitive' } },
        { author: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, blogs] = await Promise.all([
      prisma.blogPost.count({ where }),
      prisma.blogPost.findMany({
        where,
        orderBy: [
          { isFeatured: 'desc' },
          { displayOrder: 'asc' },
          { publishedAt: 'desc' },
        ],
        skip,
        take,
      }),
    ]);

        const responsePayload = {
      success: true,
      count: blogs.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / take),
      data: blogs,
    };

    if (isDefaultRequest) {
      publicBlogsCache = responsePayload;
      publicBlogsCacheTime = Date.now();
    }

    res.json(responsePayload);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/blogs/categories — Distinct published blog categories with counts
 */
const getBlogCategories = async (req, res, next) => {
  try {
    const publishedBlogs = await prisma.blogPost.findMany({
      where: { isPublished: true },
      select: { category: true, categorySlug: true },
    });

    const categoryMap = new Map();
    categoryMap.set('ALL', { id: 'ALL', label: 'All Articles', count: publishedBlogs.length });

    publishedBlogs.forEach((b) => {
      if (!b.category) return;
      const current = categoryMap.get(b.category) || {
        id: b.category,
        label: b.category,
        slug: b.categorySlug,
        count: 0,
      };
      current.count += 1;
      categoryMap.set(b.category, current);
    });

    res.json({
      success: true,
      data: Array.from(categoryMap.values()),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/blogs/:slug — Single published blog by slug
 */
const getBlogBySlug = async (req, res, next) => {
  try {
    const slug = req.params.slug ? req.params.slug.trim().toLowerCase().replace(/^\/|\/$/g, '') : '';

    if (!slug) {
      return next(new AppError('Blog slug parameter is required.', 400));
    }

    const blog = await prisma.blogPost.findFirst({
      where: {
        slug,
        isPublished: true, // Public API returns published articles ONLY
      },
    });

    if (!blog) {
      return next(new AppError('The requested article was not found or is currently unavailable.', 404));
    }

    res.json({
      success: true,
      data: blog,
    });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// ADMIN BLOG CONTROLLERS (Protected by auth + adminOnly)
// ============================================================

/**
 * GET /api/admin/blogs — All blogs including drafts and unpublished
 */
const adminGetAllBlogs = async (req, res, next) => {
  try {
    const { status, category, search, page = 1, limit = 100 } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const take = Math.min(200, Math.max(1, parseInt(limit, 10) || 100));
    const skip = (pageNum - 1) * take;

    const where = {};

    if (status === 'PUBLISHED') {
      where.isPublished = true;
    } else if (status === 'DRAFT') {
      where.isPublished = false;
    }

    if (category && category !== 'ALL') {
      where.category = category;
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { slug: { contains: q, mode: 'insensitive' } },
        { summary: { contains: q, mode: 'insensitive' } },
        { author: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, publishedCount, draftCount, blogs] = await Promise.all([
      prisma.blogPost.count({ where }),
      prisma.blogPost.count({ where: { isPublished: true } }),
      prisma.blogPost.count({ where: { isPublished: false } }),
      prisma.blogPost.findMany({
        where,
        orderBy: [
          { isFeatured: 'desc' },
          { displayOrder: 'asc' },
          { publishedAt: 'desc' },
          { createdAt: 'desc' },
        ],
        skip,
        take,
      }),
    ]);

    res.json({
      success: true,
      count: blogs.length,
      total,
      stats: {
        total: publishedCount + draftCount,
        publishedCount,
        draftCount,
      },
      page: pageNum,
      totalPages: Math.ceil(total / take),
      data: blogs,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/blogs/:id — Get blog by id for editing
 */
const adminGetBlogById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const blog = await prisma.blogPost.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
    });

    if (!blog) {
      return next(new AppError('Blog article not found.', 404));
    }

    res.json({
      success: true,
      data: blog,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/blogs — Create a new blog post
 */
const createBlog = async (req, res, next) => {
  try {
    const {
      title,
      slug: customSlug,
      category,
      categorySlug,
      author,
      publishedAt,
      readTime,
      featuredImage,
      imageAlt,
      summary,
      pickupDefault,
      dropDefault,
      content,
      faqs,
      relatedPosts,
      isPublished,
      isFeatured,
      displayOrder,
      metaTitle,
      metaDesc,
      canonicalUrl,
    } = req.body;

    if (!title || !title.trim()) {
      return next(new AppError('Blog title is required.', 400));
    }
    if (!category || !category.trim()) {
      return next(new AppError('Category is required.', 400));
    }
    if (!summary || !summary.trim()) {
      return next(new AppError('Article summary / excerpt is required.', 400));
    }

    // Validate structured content
    validateContentBlocks(content);

    // Resolve slug
    const resolvedSlug = (customSlug && customSlug.trim())
      ? slugify(customSlug)
      : slugify(title);

    if (!resolvedSlug) {
      return next(new AppError('Failed to generate a valid URL slug. Please provide a slug.', 400));
    }

    // Check slug uniqueness
    const existing = await prisma.blogPost.findUnique({
      where: { slug: resolvedSlug },
    });
    if (existing) {
      return next(new AppError(`An article with slug "${resolvedSlug}" already exists. Please choose a unique slug.`, 409));
    }

    // Published date resolution
    let resolvedPublishedAt = null;
    const shouldPublish = isPublished !== undefined ? Boolean(isPublished) : true;
    if (publishedAt) {
      const parsed = new Date(publishedAt);
      resolvedPublishedAt = isNaN(parsed.getTime()) ? new Date() : parsed;
    } else if (shouldPublish) {
      resolvedPublishedAt = new Date();
    }

    const blog = await prisma.blogPost.create({
      data: {
        title: title.trim(),
        slug: resolvedSlug,
        metaTitle: metaTitle?.trim() || null,
        metaDesc: metaDesc?.trim() || null,
        canonicalUrl: canonicalUrl?.trim() || `${require('../config/seoConfig').SITE_DOMAIN}/${resolvedSlug}/`,
        category: category.trim(),
        categorySlug: categorySlug?.trim() || slugify(category),
        author: author?.trim() || 'AJ Travels Editorial Team',
        publishedAt: resolvedPublishedAt,
        readTime: (readTime && readTime.trim()) ? readTime.trim() : calculateReadTime(content, summary),
        featuredImage: featuredImage?.trim() || '/assets/pune-to-mumbai-premium-travel-banner.webp',
        imageAlt: imageAlt?.trim() || title.trim(),
        summary: summary.trim(),
        pickupDefault: pickupDefault?.trim() || 'pune',
        dropDefault: dropDefault?.trim() || 'mumbai',
        content,
        faqs: Array.isArray(faqs) && faqs.length > 0 ? faqs : null,
        relatedPosts: Array.isArray(relatedPosts) ? relatedPosts : null,
        isPublished: shouldPublish,
        isFeatured: Boolean(isFeatured),
        displayOrder: displayOrder !== undefined ? parseInt(displayOrder, 10) || 0 : 0,
      },
    });

    invalidateBlogCache();
    res.status(201).json({
      success: true,
      message: 'Blog post created successfully.',
      data: blog,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/admin/blogs/:id — Update an existing blog post
 */
const updateBlog = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.blogPost.findUnique({
      where: { id },
    });
    if (!existing) {
      return next(new AppError('Blog article not found.', 404));
    }

    const {
      title,
      slug: newSlug,
      category,
      categorySlug,
      author,
      publishedAt,
      readTime,
      featuredImage,
      imageAlt,
      summary,
      pickupDefault,
      dropDefault,
      content,
      faqs,
      relatedPosts,
      isPublished,
      isFeatured,
      displayOrder,
      metaTitle,
      metaDesc,
      canonicalUrl,
    } = req.body;

    // If content is being updated, validate block structure
    if (content !== undefined) {
      validateContentBlocks(content);
    }

    // Slug check if changed
    let resolvedSlug = existing.slug;
    if (newSlug && newSlug.trim() && slugify(newSlug) !== existing.slug) {
      resolvedSlug = slugify(newSlug);
      const slugConflict = await prisma.blogPost.findFirst({
        where: {
          slug: resolvedSlug,
          NOT: { id },
        },
      });
      if (slugConflict) {
        return next(new AppError(`An article with slug "${resolvedSlug}" already exists.`, 409));
      }
    }

    let resolvedPublishedAt = existing.publishedAt;
    if (publishedAt !== undefined) {
      if (publishedAt === null) {
        resolvedPublishedAt = null;
      } else {
        const parsed = new Date(publishedAt);
        resolvedPublishedAt = isNaN(parsed.getTime()) ? existing.publishedAt : parsed;
      }
    } else if (isPublished === true && !existing.publishedAt) {
      resolvedPublishedAt = new Date();
    }

    const updated = await prisma.blogPost.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        slug: resolvedSlug,
        ...(metaTitle !== undefined && { metaTitle: metaTitle ? metaTitle.trim() : null }),
        ...(metaDesc !== undefined && { metaDesc: metaDesc ? metaDesc.trim() : null }),
        ...(canonicalUrl !== undefined && { canonicalUrl: canonicalUrl ? canonicalUrl.trim() : null }),
        ...(category !== undefined && { category: category.trim() }),
        ...(categorySlug !== undefined && { categorySlug: categorySlug ? categorySlug.trim() : slugify(category || existing.category) }),
        ...(author !== undefined && { author: author.trim() }),
        publishedAt: resolvedPublishedAt,
        ...(readTime !== undefined ? { readTime: readTime ? readTime.trim() : calculateReadTime(content !== undefined ? content : existing.content, summary !== undefined ? summary : existing.summary) } : {}),
        ...(featuredImage !== undefined && { featuredImage: featuredImage.trim() }),
        ...(imageAlt !== undefined && { imageAlt: imageAlt ? imageAlt.trim() : null }),
        ...(summary !== undefined && { summary: summary.trim() }),
        ...(pickupDefault !== undefined && { pickupDefault: pickupDefault ? pickupDefault.trim() : null }),
        ...(dropDefault !== undefined && { dropDefault: dropDefault ? dropDefault.trim() : null }),
        ...(content !== undefined && { content }),
        ...(faqs !== undefined && { faqs: Array.isArray(faqs) ? faqs : null }),
        ...(relatedPosts !== undefined && { relatedPosts: Array.isArray(relatedPosts) ? relatedPosts : null }),
        ...(isPublished !== undefined && { isPublished: Boolean(isPublished) }),
        ...(isFeatured !== undefined && { isFeatured: Boolean(isFeatured) }),
        ...(displayOrder !== undefined && { displayOrder: parseInt(displayOrder, 10) || 0 }),
      },
    });

    res.json({
      success: true,
      message: 'Blog post updated successfully.',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/admin/blogs/:id/publish-status — Toggle publish/draft
 */
const togglePublishStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isPublished } = req.body;

    if (typeof isPublished !== 'boolean') {
      return next(new AppError('isPublished boolean flag is required.', 400));
    }

    const existing = await prisma.blogPost.findUnique({ where: { id } });
    if (!existing) {
      return next(new AppError('Blog article not found.', 404));
    }

    const data = { isPublished };
    if (isPublished && !existing.publishedAt) {
      data.publishedAt = new Date();
    }

    const updated = await prisma.blogPost.update({
      where: { id },
      data,
    });

    res.json({
      success: true,
      message: `Article ${isPublished ? 'published' : 'unpublished'} successfully.`,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/admin/blogs/:id — Delete blog post
 * Preserves shared MediaAsset records and files
 */
const deleteBlog = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.blogPost.findUnique({ where: { id } });
    if (!existing) {
      return next(new AppError('Blog article not found.', 404));
    }

    // Delete record from blog_posts table. Shared MediaAssets are preserved.
    await prisma.blogPost.delete({ where: { id } });

    res.json({
      success: true,
      message: `Blog article "${existing.title}" deleted successfully.`,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/blogs/upload-image — Upload featured/inline blog image
 */
const uploadBlogImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return next(new AppError('No image file was uploaded.', 400));
    }

    const file = req.file;
    const imageUrl = file.publicUrl || `/uploads/blogs/${file.filename}`;

    // Register with central MediaAsset library
    let asset = null;
    try {
      asset = await prisma.mediaAsset.create({
        data: {
          filename: file.filename,
          originalName: file.originalname,
          url: imageUrl,
          mimeType: file.mimetype,
          fileSize: file.size,
          category: 'blogs',
          altText: req.body.altText || `Blog Image - ${file.originalname}`,
          title: req.body.title || file.originalname.replace(/\.[^/.]+$/, ''),
        },
      });
    } catch (dbErr) {
      console.warn('[BlogImageUpload] Non-fatal MediaAsset sync warning:', dbErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Blog image uploaded successfully.',
      imageUrl,
      data: asset,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  invalidateBlogCache,
  getAllBlogs,
  getBlogCategories,
  getBlogBySlug,
  adminGetAllBlogs,
  adminGetBlogById,
  createBlog,
  updateBlog,
  togglePublishStatus,
  deleteBlog,
  uploadBlogImage,
  slugify,
  validateContentBlocks,
};

