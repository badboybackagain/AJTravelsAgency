// SEO Routes
// Admin (auth-protected): manage per-page SEO metadata
// Public: sitemap.xml, robots.txt (served via app.js directly)

const express = require('express');
const router = express.Router();
const { getPages, getPage, updatePage } = require('../controllers/seoController');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');

// All SEO admin routes require admin authentication
router.get('/pages', auth, adminOnly, getPages);
router.get('/pages/:pageKey', auth, adminOnly, getPage);
router.put('/pages/:pageKey', auth, adminOnly, updatePage);

module.exports = router;
