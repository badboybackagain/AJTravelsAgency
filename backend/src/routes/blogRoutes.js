// ============================================================
// AJ Travels — Public Blog Routes (/api/blogs)
// Only published articles are exposed publicly
// ============================================================

const express = require('express');
const router = express.Router();
const {
  getAllBlogs,
  getBlogCategories,
  getBlogBySlug,
} = require('../controllers/blogController');

// GET /api/blogs/categories — List distinct categories
router.get('/categories', getBlogCategories);

// GET /api/blogs — List published blog posts
router.get('/', getAllBlogs);

// GET /api/blogs/:slug — Get published article by slug
router.get('/:slug', getBlogBySlug);

module.exports = router;

