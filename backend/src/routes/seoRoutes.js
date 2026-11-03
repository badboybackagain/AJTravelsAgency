// SEO Routes
// Admin (auth-protected): manage per-page SEO metadata
// Public: sitemap.xml, robots.txt (served via app.js directly)

const express = require('express');
const router = express.Router();
const { getPages, getPage, updatePage, batchAutoFixPages } = require('../controllers/seoController');
const {
  getAnalyzerOverview,
  analyzeAllPages,
  analyzeSinglePage,
  getPageAnalysis,
  getIntegrationsStatus,
} = require('../controllers/seoAnalyzerController');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');

const {
  getGscStatus,
  getGscAuthUrl,
  handleGscOAuthCallback,
  disconnectGsc,
  getGscProperties,
  selectGscProperty,
  getGscPerformance,
  refreshGscData,
} = require('../controllers/googleSearchConsoleController');

// SEO Settings Management (Auth + Admin required)
router.get('/pages', auth, adminOnly, getPages);
router.post('/pages/batch-auto-fix', auth, adminOnly, batchAutoFixPages);
router.get('/pages/:pageKey', auth, adminOnly, getPage);
router.put('/pages/:pageKey', auth, adminOnly, updatePage);

// SEO Real-Time Analyzer Endpoints (Auth + Admin required)
router.get('/analyzer/overview', auth, adminOnly, getAnalyzerOverview);
router.post('/analyzer/analyze-all', auth, adminOnly, analyzeAllPages);
router.post('/analyzer/analyze-page', auth, adminOnly, analyzeSinglePage);
router.get('/analyzer/page/:pageKey', auth, adminOnly, getPageAnalysis);
router.get('/analyzer/integrations', auth, adminOnly, getIntegrationsStatus);

// Google Search Console (GSC) Endpoints (Auth + Admin required, callback validates CSRF state)
router.get('/gsc/status', auth, adminOnly, getGscStatus);
router.get('/gsc/auth-url', auth, adminOnly, getGscAuthUrl);
router.get('/gsc/oauth/callback', handleGscOAuthCallback);
router.post('/gsc/disconnect', auth, adminOnly, disconnectGsc);
router.get('/gsc/properties', auth, adminOnly, getGscProperties);
router.post('/gsc/select-property', auth, adminOnly, selectGscProperty);
router.get('/gsc/performance', auth, adminOnly, getGscPerformance);
router.post('/gsc/refresh', auth, adminOnly, refreshGscData);

module.exports = router;
