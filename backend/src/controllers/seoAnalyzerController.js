// ============================================================
// SEO Analyzer Controller
// Exposes protected administrative APIs for real page audits,
// transparent scoring, SERP simulation, and external integrations.
// ============================================================

const seoAnalyzerService = require('../services/seoAnalyzerService');
const { PUBLIC_PAGES, ROUTE_INVENTORY, getAllPublicPagesCatalog } = require('./seoController');

/**
 * GET /api/admin/seo/analyzer/overview
 * Returns high-level overview of SEO audit and all public pages.
 */
const getAnalyzerOverview = async (req, res) => {
  try {
    const overview = await seoAnalyzerService.getCachedOverview();
    res.json({
      success: true,
      data: overview,
    });
  } catch (err) {
    console.error('[SEO Analyzer Controller] getAnalyzerOverview error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve SEO analysis overview.',
      details: err.message,
    });
  }
};

/**
 * POST /api/admin/seo/analyzer/analyze-all
 * Triggers a real-time full-site SEO analysis across all eligible public pages.
 */
const analyzeAllPages = async (req, res) => {
  try {
    const result = await seoAnalyzerService.analyzeAllPages();
    res.json({
      success: true,
      data: {
        overview: result.overview,
        pages: result.detailedPages,
      },
    });
  } catch (err) {
    console.error('[SEO Analyzer Controller] analyzeAllPages error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to execute site SEO analysis.',
      details: err.message,
    });
  }
};

/**
 * POST /api/admin/seo/analyzer/analyze-page
 * Analyzes a single page on-demand.
 * Path/pageKey must strictly match a known public route (SSRF protection).
 */
const analyzeSinglePage = async (req, res) => {
  try {
    const { pageKey, path } = req.body;

    const allCatalog = typeof getAllPublicPagesCatalog === 'function' ? getAllPublicPagesCatalog() : PUBLIC_PAGES;

    let targetKey = pageKey;
    if (!targetKey && path) {
      const matched = allCatalog.find(p => p.pageUrl === path);
      if (matched) targetKey = matched.pageKey;
    }

    if (!targetKey || !allCatalog.some(p => p.pageKey === targetKey)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pageKey. Analysis is strictly restricted to eligible public pages.',
        allowedPages: allCatalog.map(p => ({ pageKey: p.pageKey, path: p.pageUrl })),
      });
    }

    const pageAnalysis = await seoAnalyzerService.analyzePage(targetKey);
    res.json({
      success: true,
      data: pageAnalysis,
    });
  } catch (err) {
    console.error('[SEO Analyzer Controller] analyzeSinglePage error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze page.',
      details: err.message,
    });
  }
};

/**
 * GET /api/admin/seo/analyzer/page/:pageKey
 * Returns detailed inspection findings for a specific page.
 */
const getPageAnalysis = async (req, res) => {
  try {
    const { pageKey } = req.params;
    const allCatalog = typeof getAllPublicPagesCatalog === 'function' ? getAllPublicPagesCatalog() : PUBLIC_PAGES;

    if (!allCatalog.some(p => p.pageKey === pageKey)) {
      return res.status(404).json({
        success: false,
        message: `Page "${pageKey}" not found or is not an eligible public page.`,
      });
    }

    const pageAnalysis = await seoAnalyzerService.getPageAnalysis(pageKey);
    res.json({
      success: true,
      data: pageAnalysis,
    });
  } catch (err) {
    console.error('[SEO Analyzer Controller] getPageAnalysis error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch page analysis.',
      details: err.message,
    });
  }
};

/**
 * GET /api/admin/seo/analyzer/integrations
 * Returns verified status of external search engine integrations.
 */
const getIntegrationsStatus = (req, res) => {
  try {
    const integrations = seoAnalyzerService.getIntegrationsStatus();
    res.json({
      success: true,
      data: integrations,
    });
  } catch (err) {
    console.error('[SEO Analyzer Controller] getIntegrationsStatus error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch integrations status.',
      details: err.message,
    });
  }
};

module.exports = {
  getAnalyzerOverview,
  analyzeAllPages,
  analyzeSinglePage,
  getPageAnalysis,
  getIntegrationsStatus,
};
