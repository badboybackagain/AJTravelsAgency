// ============================================================
// Google Search Console (GSC) Controller
// Provides authenticated administrative endpoints for Google
// Search Console connection, OAuth 2.0 flow, property selection,
// and organic search analytics reports.
// ============================================================

const gscService = require('../services/googleSearchConsoleService');

/**
 * GET /api/admin/seo/gsc/status
 * Returns current connection status, selected property, and capabilities.
 */
const getGscStatus = (req, res) => {
  try {
    const status = gscService.getStatus();
    res.json({
      success: true,
      data: status.googleSearchConsole,
    });
  } catch (err) {
    console.error('[GSC Controller] getGscStatus error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve Search Console status.',
    });
  }
};

/**
 * GET /api/admin/seo/gsc/auth-url
 * Generates an OAuth 2.0 authorization URL with CSRF protection.
 */
const getGscAuthUrl = (req, res) => {
  try {
    const result = gscService.generateAuthUrl();
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (err) {
    console.error('[GSC Controller] getGscAuthUrl error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to generate Search Console authorization URL.',
    });
  }
};

/**
 * GET /api/admin/seo/gsc/oauth/callback
 * Handles OAuth callback from Google.
 * Validates CSRF nonce, exchanges code for tokens, and redirects back to admin panel.
 */
const handleGscOAuthCallback = async (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
  const targetDashboardUrl = `${frontendUrl}/admin/dashboard?tab=integrations`;

  const { code, state, error, error_description } = req.query;

  // Handle user cancellation or denial
  if (error) {
    console.warn('[GSC Controller] Google OAuth denied or error:', error);
    return res.redirect(`${targetDashboardUrl}&gsc_error=${encodeURIComponent(error_description || error)}`);
  }

  if (!code || !state) {
    return res.redirect(`${targetDashboardUrl}&gsc_error=${encodeURIComponent('Missing authorization code or state nonce.')}`);
  }

  try {
    await gscService.handleOAuthCallback(code, state);
    res.redirect(`${targetDashboardUrl}&gsc_connected=true`);
  } catch (err) {
    console.error('[GSC Controller] OAuth callback error:', err.message);
    res.redirect(`${targetDashboardUrl}&gsc_error=${encodeURIComponent(err.message)}`);
  }
};

/**
 * POST /api/admin/seo/gsc/disconnect
 * Disconnects Search Console, clearing cached tokens and state.
 */
const disconnectGsc = (req, res) => {
  try {
    const result = gscService.disconnect();
    res.json(result);
  } catch (err) {
    console.error('[GSC Controller] disconnectGsc error:', err.message);
    res.status(500).json({
      success: false,
      message: 'Failed to disconnect Google Search Console.',
    });
  }
};

/**
 * GET /api/admin/seo/gsc/properties
 * Returns verified Search Console properties for the authorized account.
 */
const getGscProperties = async (req, res) => {
  try {
    const properties = await gscService.fetchProperties();
    res.json({
      success: true,
      data: properties,
    });
  } catch (err) {
    console.error('[GSC Controller] getGscProperties error:', err.message);
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to fetch verified Search Console properties.',
    });
  }
};

/**
 * POST /api/admin/seo/gsc/select-property
 * Updates the active property URL.
 */
const selectGscProperty = (req, res) => {
  try {
    const { siteUrl } = req.body;
    const result = gscService.selectProperty(siteUrl);
    res.json(result);
  } catch (err) {
    console.error('[GSC Controller] selectGscProperty error:', err.message);
    res.status(400).json({
      success: false,
      message: err.message || 'Failed to select Search Console property.',
    });
  }
};

/**
 * GET /api/admin/seo/gsc/performance
 * Returns Search Console performance metrics (summary, timeSeries, topQueries, topPages, etc.)
 */
const getGscPerformance = async (req, res) => {
  try {
    const { range, customStart, customEnd, property } = req.query;

    const result = await gscService.queryPerformance({
      range: range || '28d',
      customStart,
      customEnd,
      property,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error('[GSC Controller] getGscPerformance error:', err.message);
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to fetch Google Search Console performance data.',
    });
  }
};

/**
 * POST /api/admin/seo/gsc/refresh
 * Triggers an immediate refresh of performance metrics.
 */
const refreshGscData = async (req, res) => {
  try {
    const { range } = req.body;
    const result = await gscService.queryPerformance({ range: range || '28d' });
    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error('[GSC Controller] refreshGscData error:', err.message);
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to refresh Search Console data.',
    });
  }
};

module.exports = {
  getGscStatus,
  getGscAuthUrl,
  handleGscOAuthCallback,
  disconnectGsc,
  getGscProperties,
  selectGscProperty,
  getGscPerformance,
  refreshGscData,
};
