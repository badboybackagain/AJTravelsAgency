// ============================================================
// Google Search Console (GSC) Official API Service
// Handles server-side OAuth 2.0 authorization, token management,
// property discovery, Search Analytics performance queries,
// landing-page attribution, and secret redaction.
//
// Zero synthetic data. Strictly least-privilege readonly scope:
// https://www.googleapis.com/auth/webmasters.readonly
// ============================================================

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { SITE_DOMAIN } = require('../config/seoConfig');

// Google OAuth 2.0 Endpoints
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GSC_API_BASE = 'https://searchconsole.googleapis.com/webmasters/v3';
const GSC_SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly';

// Local secure encrypted token file path (avoids unsafe remote database writes)
const STORAGE_DIR = path.join(__dirname, '../../storage');
const TOKEN_FILE_PATH = path.join(STORAGE_DIR, 'gsc_token.enc');

// In-memory runtime state for CSRF nonces and tokens
const oauthStateNonces = new Map(); // nonce -> { createdAt: timestamp }

// State cache for Google Search Console connection
let gscState = {
  isConnected: false,
  status: 'NOT_CONNECTED', // 'CONNECTED' | 'NOT_CONFIGURED' | 'NOT_CONNECTED' | 'ERROR'
  tokens: null, // { access_token, refresh_token, expiry_date, token_type }
  selectedProperty: null,
  availableProperties: [],
  lastSyncTimestamp: null,
  lastError: null,
};

// Test mock adapter hook for isolated automated tests
let testMockAdapter = null;

/**
 * Derives an encryption key from JWT_SECRET or fallback for safe token persistence.
 */
function getEncryptionKey() {
  const secret = process.env.JWT_SECRET || 'aj-travel-gsc-secure-encryption-key-fallback';
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Encrypts arbitrary string data using AES-256-GCM.
 */
function encryptData(text) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag();
  return JSON.stringify({
    iv: iv.toString('hex'),
    encrypted,
    tag: tag.toString('hex'),
  });
}

/**
 * Decrypts AES-256-GCM payload.
 */
function decryptData(payloadStr) {
  try {
    const payload = JSON.parse(payloadStr);
    const decipher = crypto.createDecipheriv('aes-256-gcm', getEncryptionKey(), Buffer.from(payload.iv, 'hex'));
    decipher.setAuthTag(Buffer.from(payload.tag, 'hex'));
    let decrypted = decipher.update(payload.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    return null;
  }
}

/**
 * Safely loads persisted tokens from local encrypted storage.
 */
function loadPersistedState() {
  try {
    if (fs.existsSync(TOKEN_FILE_PATH)) {
      const encryptedContent = fs.readFileSync(TOKEN_FILE_PATH, 'utf8');
      const decrypted = decryptData(encryptedContent);
      if (decrypted) {
        const parsed = JSON.parse(decrypted);
        if (parsed.tokens) {
          gscState.tokens = parsed.tokens;
          gscState.selectedProperty = parsed.selectedProperty || null;
          gscState.isConnected = true;
          gscState.status = 'CONNECTED';
          gscState.lastSyncTimestamp = parsed.lastSyncTimestamp || null;
        }
      }
    }
  } catch (err) {
    // Non-fatal, state remains in default disconnected mode
  }
}

/**
 * Persists token state securely to local encrypted storage.
 */
function savePersistedState() {
  try {
    if (!fs.existsSync(STORAGE_DIR)) {
      fs.mkdirSync(STORAGE_DIR, { recursive: true });
    }
    if (gscState.tokens) {
      const dataToSave = JSON.stringify({
        tokens: gscState.tokens,
        selectedProperty: gscState.selectedProperty,
        lastSyncTimestamp: gscState.lastSyncTimestamp,
      });
      fs.writeFileSync(TOKEN_FILE_PATH, encryptData(dataToSave), 'utf8');
    } else {
      if (fs.existsSync(TOKEN_FILE_PATH)) {
        fs.unlinkSync(TOKEN_FILE_PATH);
      }
    }
  } catch (err) {
    // Non-fatal logging
    console.error('[GSC Service] Failed to save encrypted token state:', err.message);
  }
}

// Initial bootstrap from storage on service load
loadPersistedState();

/**
 * Checks if OAuth credentials are configured in environment variables.
 */
function isConfigured() {
  const clientId = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
  return Boolean(clientId && clientSecret);
}

/**
 * Redacts tokens, client secrets, and sensitive credentials from objects and errors.
 */
function redactSecrets(data) {
  if (!data) return data;
  if (data instanceof Error) {
    const err = new Error(redactSecrets(data.message));
    err.name = data.name;
    if (data.stack) err.stack = redactSecrets(data.stack);
    return err;
  }
  if (typeof data === 'string') {
    return data
      .replace(/Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi, 'Bearer [REDACTED]')
      .replace(/(client_secret=)[^&]+/gi, '$1[REDACTED]')
      .replace(/(code=)[^&]+/gi, '$1[REDACTED]')
      .replace(/(refresh_token=)[^&]+/gi, '$1[REDACTED]');
  }
  if (typeof data === 'object') {
    const sanitized = Array.isArray(data) ? [] : {};
    for (const [key, value] of Object.entries(data)) {
      const lower = key.toLowerCase();
      if (
        lower.includes('secret') ||
        lower.includes('token') ||
        lower.includes('password') ||
        lower.includes('authorization') ||
        lower.includes('code')
      ) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object') {
        sanitized[key] = redactSecrets(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }
  return data;
}

/**
 * Generates an OAuth 2.0 authorization URL with CSRF state protection.
 */
function generateAuthUrl(redirectUriOverride = null) {
  if (testMockAdapter?.generateAuthUrl) {
    return testMockAdapter.generateAuthUrl();
  }

  const clientId = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return {
      success: false,
      configured: false,
      message: 'Google Search Console OAuth client credentials are not configured in environment.',
      verificationRequirements: [
        'Set GOOGLE_SEARCH_CONSOLE_CLIENT_ID in backend/.env',
        'Set GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET in backend/.env',
        'Set GOOGLE_SEARCH_CONSOLE_REDIRECT_URI in backend/.env (e.g. http://localhost:3001/api/admin/seo/gsc/oauth/callback)',
        'Enable Google Search Console API in Google Cloud Console',
        'Verify domain ownership in Google Search Console',
      ],
    };
  }

  const redirectUri =
    redirectUriOverride ||
    process.env.GOOGLE_SEARCH_CONSOLE_REDIRECT_URI ||
    process.env.GOOGLE_REDIRECT_URI ||
    'http://localhost:3001/api/admin/seo/gsc/oauth/callback';

  // Generate cryptographically secure CSRF state token
  const stateNonce = crypto.randomBytes(24).toString('hex');
  oauthStateNonces.set(stateNonce, { createdAt: Date.now() });

  // Clean expired nonces (older than 15 minutes)
  const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000;
  for (const [key, val] of oauthStateNonces.entries()) {
    if (val.createdAt < fifteenMinutesAgo) oauthStateNonces.delete(key);
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: GSC_SCOPE,
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    state: stateNonce,
  });

  return {
    success: true,
    configured: true,
    authUrl: `${GOOGLE_AUTH_URL}?${params.toString()}`,
    state: stateNonce,
    redirectUri,
  };
}

/**
 * Validates CSRF state and exchanges OAuth authorization code for tokens.
 */
async function handleOAuthCallback(code, state, redirectUriOverride = null) {
  if (testMockAdapter?.handleOAuthCallback) {
    return testMockAdapter.handleOAuthCallback(code, state);
  }

  if (!state || !oauthStateNonces.has(state)) {
    throw new Error('Invalid or expired OAuth state parameter. Possible Cross-Site Request Forgery (CSRF).');
  }
  oauthStateNonces.delete(state);

  if (!code || typeof code !== 'string') {
    throw new Error('Missing or invalid authorization code from Google OAuth.');
  }

  const clientId = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri =
    redirectUriOverride ||
    process.env.GOOGLE_SEARCH_CONSOLE_REDIRECT_URI ||
    process.env.GOOGLE_REDIRECT_URI ||
    'http://localhost:3001/api/admin/seo/gsc/oauth/callback';

  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth client credentials are not configured.');
  }

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  const tokenData = await response.json();

  if (!response.ok || tokenData.error) {
    const errorMsg = tokenData.error_description || tokenData.error || 'Failed to exchange authorization code for tokens.';
    throw new Error(`Google OAuth Token Exchange Error: ${redactSecrets(errorMsg)}`);
  }

  const expiryDate = tokenData.expires_in ? Date.now() + tokenData.expires_in * 1000 : null;

  gscState.tokens = {
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token || gscState.tokens?.refresh_token || null,
    expiry_date: expiryDate,
    token_type: tokenData.token_type || 'Bearer',
  };

  gscState.isConnected = true;
  gscState.status = 'CONNECTED';
  gscState.lastSyncTimestamp = new Date().toISOString();
  gscState.lastError = null;

  savePersistedState();

  // Automatically discover available properties
  try {
    await fetchProperties();
  } catch (propErr) {
    // Non-fatal, admin can refresh properties later
  }

  return {
    success: true,
    status: 'CONNECTED',
    selectedProperty: gscState.selectedProperty,
    availableProperties: gscState.availableProperties,
  };
}

/**
 * Ensures a valid access token is available, refreshing if expired.
 */
async function getValidAccessToken() {
  if (testMockAdapter?.getValidAccessToken) {
    return testMockAdapter.getValidAccessToken();
  }

  if (!gscState.tokens || !gscState.tokens.access_token) {
    throw new Error('Google Search Console is not connected. Authorization required.');
  }

  const isExpired = gscState.tokens.expiry_date && Date.now() > gscState.tokens.expiry_date - 60000;

  if (!isExpired) {
    return gscState.tokens.access_token;
  }

  // Refresh token
  const refreshToken = gscState.tokens.refresh_token;
  if (!refreshToken) {
    gscState.status = 'ERROR';
    gscState.lastError = 'Access token expired and no refresh token is available. Please re-authorize Google Search Console.';
    throw new Error(gscState.lastError);
  }

  const clientId = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET;

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
    }),
  });

  const refreshedData = await response.json();

  if (!response.ok || refreshedData.error) {
    gscState.status = 'ERROR';
    gscState.lastError = `Token Refresh Failed: ${redactSecrets(refreshedData.error_description || refreshedData.error)}`;
    savePersistedState();
    throw new Error(gscState.lastError);
  }

  gscState.tokens.access_token = refreshedData.access_token;
  if (refreshedData.expires_in) {
    gscState.tokens.expiry_date = Date.now() + refreshedData.expires_in * 1000;
  }
  gscState.status = 'CONNECTED';
  savePersistedState();

  return gscState.tokens.access_token;
}

/**
 * Fetches verified sites/properties from Google Search Console API.
 */
async function fetchProperties() {
  if (testMockAdapter?.fetchProperties) {
    return testMockAdapter.fetchProperties();
  }

  const accessToken = await getValidAccessToken();

  const response = await fetch(`${GSC_API_BASE}/sites`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  const result = await response.json();

  if (!response.ok || result.error) {
    const errorMsg = result.error?.message || 'Failed to retrieve Search Console properties.';
    gscState.lastError = errorMsg;
    throw new Error(`Google Search Console Sites API Error: ${redactSecrets(errorMsg)}`);
  }

  const siteEntries = result.siteEntry || [];
  gscState.availableProperties = siteEntries.map(s => ({
    siteUrl: s.siteUrl,
    permissionLevel: s.permissionLevel,
  }));

  // Auto-select property matching SITE_DOMAIN if not already selected
  if (!gscState.selectedProperty && gscState.availableProperties.length > 0) {
    const targetDomain = SITE_DOMAIN.replace(/\/$/, '');
    const matched = gscState.availableProperties.find(
      p => p.siteUrl === targetDomain || p.siteUrl === `${targetDomain}/` || p.siteUrl === `sc-domain:${targetDomain.replace(/^https?:\/\//, '')}`
    );
    if (matched) {
      gscState.selectedProperty = matched.siteUrl;
    } else {
      gscState.selectedProperty = gscState.availableProperties[0].siteUrl;
    }
    savePersistedState();
  }

  return gscState.availableProperties;
}

/**
 * Selects an active Search Console property after validation.
 */
function selectProperty(siteUrl) {
  if (!siteUrl || typeof siteUrl !== 'string') {
    throw new Error('Invalid siteUrl. Property URL is required.');
  }

  const exists = gscState.availableProperties.some(p => p.siteUrl === siteUrl);
  if (!exists && gscState.availableProperties.length > 0) {
    throw new Error(`Property "${siteUrl}" was not found among verified Search Console properties for this account.`);
  }

  gscState.selectedProperty = siteUrl;
  savePersistedState();

  return {
    success: true,
    selectedProperty: gscState.selectedProperty,
  };
}

/**
 * Disconnects integration, clears stored credentials and nonces.
 */
function disconnect() {
  gscState = {
    isConnected: false,
    status: isConfigured() ? 'NOT_CONNECTED' : 'NOT_CONFIGURED',
    tokens: null,
    selectedProperty: null,
    availableProperties: [],
    lastSyncTimestamp: null,
    lastError: null,
  };
  savePersistedState();
  return { success: true, message: 'Google Search Console disconnected successfully.' };
}

/**
 * Calculates start and end dates based on standard date range keywords.
 * Respects Search Console's typical 2-day processing lag.
 */
function computeDateRange(range = '28d', customStart = null, customEnd = null) {
  const today = new Date();
  const lagDays = 2; // GSC standard 24-48h reporting lag
  const endDateObj = new Date(today.getTime() - lagDays * 24 * 60 * 60 * 1000);

  if (range === 'custom' && customStart && customEnd) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(customStart) || !/^\d{4}-\d{2}-\d{2}$/.test(customEnd)) {
      throw new Error('Custom dates must be in YYYY-MM-DD format.');
    }
    if (new Date(customStart) > new Date(customEnd)) {
      throw new Error('startDate must be before or equal to endDate.');
    }
    return { startDate: customStart, endDate: customEnd };
  }

  let daysBack = 28;
  if (range === '7d') daysBack = 7;
  else if (range === '28d') daysBack = 28;
  else if (range === '3m' || range === '90d') daysBack = 90;
  else if (range === '6m') daysBack = 180;

  const startDateObj = new Date(endDateObj.getTime() - daysBack * 24 * 60 * 60 * 1000);

  const fmt = (d) => d.toISOString().split('T')[0];
  return {
    startDate: fmt(startDateObj),
    endDate: fmt(endDateObj),
  };
}

/**
 * Queries Search Console performance data via Search Analytics endpoint.
 */
async function queryPerformance({ range = '28d', customStart = null, customEnd = null, property = null } = {}) {
  if (testMockAdapter?.queryPerformance) {
    return testMockAdapter.queryPerformance({ range, customStart, customEnd, property });
  }

  if (!gscState.isConnected || !gscState.tokens) {
    return {
      success: true,
      connected: false,
      status: gscState.status,
      message: 'Google Search Console is not connected.',
      summary: null,
      timeSeries: [],
      topQueries: [],
      topPages: [],
      pagesBreakdown: [],
      deviceBreakdown: [],
      countryBreakdown: [],
    };
  }

  const siteUrl = property || gscState.selectedProperty;
  if (!siteUrl) {
    return {
      success: true,
      connected: true,
      status: 'NO_PROPERTY_SELECTED',
      message: 'No verified Search Console property selected.',
      availableProperties: gscState.availableProperties,
      summary: null,
    };
  }

  const { startDate, endDate } = computeDateRange(range, customStart, customEnd);
  const accessToken = await getValidAccessToken();

  const encodedSiteUrl = encodeURIComponent(siteUrl);
  const endpoint = `${GSC_API_BASE}/sites/${encodedSiteUrl}/searchAnalytics/query`;

  // 1. Overall Totals & Daily Time Series (Dimensions: date)
  const timeSeriesReq = fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      startDate,
      endDate,
      dimensions: ['date'],
      rowLimit: 100,
      aggregationType: 'auto',
    }),
  });

  // 2. Top Queries (Dimensions: query)
  const queriesReq = fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      startDate,
      endDate,
      dimensions: ['query'],
      rowLimit: 50,
      aggregationType: 'auto',
    }),
  });

  // 3. Top Pages (Dimensions: page)
  const pagesReq = fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      startDate,
      endDate,
      dimensions: ['page'],
      rowLimit: 50,
      aggregationType: 'auto',
    }),
  });

  // 4. Device Breakdown (Dimensions: device)
  const devicesReq = fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      startDate,
      endDate,
      dimensions: ['device'],
      rowLimit: 10,
      aggregationType: 'auto',
    }),
  });

  // 5. Country Breakdown (Dimensions: country)
  const countriesReq = fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      startDate,
      endDate,
      dimensions: ['country'],
      rowLimit: 10,
      aggregationType: 'auto',
    }),
  });

  const [tsRes, qRes, pRes, dRes, cRes] = await Promise.all([
    timeSeriesReq,
    queriesReq,
    pagesReq,
    devicesReq,
    countriesReq,
  ]);

  const [tsData, qData, pData, dData, cData] = await Promise.all([
    tsRes.json(),
    qRes.json(),
    pRes.json(),
    dRes.json(),
    cRes.json(),
  ]);

  // Check for Google API errors
  if (!tsRes.ok && tsData.error) {
    throw new Error(`Google Search Analytics Error: ${redactSecrets(tsData.error.message || tsData.error)}`);
  }

  // Parse time series & compute aggregate summary
  const rows = tsData.rows || [];
  let totalClicks = 0;
  let totalImpressions = 0;
  let weightedPositionSum = 0;

  const timeSeries = rows.map(r => {
    const clicks = Number(r.clicks) || 0;
    const impressions = Number(r.impressions) || 0;
    const ctr = Number(r.ctr) || 0;
    const position = Number(r.position) || 0;

    totalClicks += clicks;
    totalImpressions += impressions;
    weightedPositionSum += position * impressions;

    return {
      date: r.keys?.[0] || 'Unknown',
      clicks,
      impressions,
      ctr: Math.round(ctr * 10000) / 100, // percentage e.g. 4.25%
      position: Math.round(position * 10) / 10,
    };
  });

  const averageCtr = totalImpressions > 0 ? Math.round((totalClicks / totalImpressions) * 10000) / 100 : 0;
  const averagePosition = totalImpressions > 0 ? Math.round((weightedPositionSum / totalImpressions) * 10) / 10 : 0;

  // Parse top queries
  const topQueries = (qData.rows || []).map(r => ({
    query: r.keys?.[0] || '(omitted query)',
    clicks: Number(r.clicks) || 0,
    impressions: Number(r.impressions) || 0,
    ctr: Math.round((Number(r.ctr) || 0) * 10000) / 100,
    position: Math.round((Number(r.position) || 0) * 10) / 10,
  }));

  // Parse top landing pages
  const rawPages = pData.rows || [];
  const topPages = rawPages.map(r => ({
    pageUrl: r.keys?.[0] || 'Unknown',
    clicks: Number(r.clicks) || 0,
    impressions: Number(r.impressions) || 0,
    ctr: Math.round((Number(r.ctr) || 0) * 10000) / 100,
    position: Math.round((Number(r.position) || 0) * 10) / 10,
  }));

  // Parse devices
  const deviceBreakdown = (dData.rows || []).map(r => ({
    device: (r.keys?.[0] || 'OTHER').toUpperCase(),
    clicks: Number(r.clicks) || 0,
    impressions: Number(r.impressions) || 0,
    ctr: Math.round((Number(r.ctr) || 0) * 10000) / 100,
    position: Math.round((Number(r.position) || 0) * 10) / 10,
  }));

  // Parse countries
  const countryBreakdown = (cData.rows || []).map(r => ({
    country: (r.keys?.[0] || 'UNKNOWN').toUpperCase(),
    clicks: Number(r.clicks) || 0,
    impressions: Number(r.impressions) || 0,
    ctr: Math.round((Number(r.ctr) || 0) * 10000) / 100,
    position: Math.round((Number(r.position) || 0) * 10) / 10,
  }));

  // Match against our 3 managed public pages
  const managedRoutes = [
    { pageKey: 'home', pageUrl: '/', pageLabel: 'Home Page' },
    { pageKey: 'fare', pageUrl: '/fare', pageLabel: 'Fare Calculator' },
    { pageKey: 'booking', pageUrl: '/booking', pageLabel: 'Cab Booking' },
  ];

  const pagesBreakdown = managedRoutes.map(m => {
    // Find landing page whose pathname matches managed route
    const matchedRow = topPages.find(p => {
      try {
        const parsed = new URL(p.pageUrl);
        const normPath = parsed.pathname.replace(/\/$/, '') || '/';
        return normPath === m.pageUrl;
      } catch (e) {
        return p.pageUrl.endsWith(m.pageUrl);
      }
    });

    if (matchedRow) {
      return {
        pageKey: m.pageKey,
        pageUrl: m.pageUrl,
        pageLabel: m.pageLabel,
        hasData: true,
        clicks: matchedRow.clicks,
        impressions: matchedRow.impressions,
        ctr: matchedRow.ctr,
        position: matchedRow.position,
      };
    }

    return {
      pageKey: m.pageKey,
      pageUrl: m.pageUrl,
      pageLabel: m.pageLabel,
      hasData: false,
      clicks: null,
      impressions: null,
      ctr: null,
      position: null,
      note: 'No organic Google Search impressions recorded for this URL within selected timeframe.',
    };
  });

  gscState.lastSyncTimestamp = new Date().toISOString();
  savePersistedState();

  return {
    success: true,
    connected: true,
    property: siteUrl,
    dateRange: {
      preset: range,
      startDate,
      endDate,
    },
    reportingDelayNotice: 'Google Search Console data reflects a 24–48 hour reporting delay and does not represent real-time live ranking.',
    queryCompletenessNotice: 'Query-level rows may not sum to the totals due to Google Search privacy and anonymization thresholds.',
    lastSyncTimestamp: gscState.lastSyncTimestamp,
    summary: {
      totalClicks,
      totalImpressions,
      averageCtr,
      averagePosition,
    },
    timeSeries,
    topQueries,
    topPages,
    pagesBreakdown,
    deviceBreakdown,
    countryBreakdown,
  };
}

/**
 * Returns overall integration status formatted for admin overview.
 * Preserves 100% contract compatibility with existing seoAnalyzerService.
 */
function getStatus() {
  if (testMockAdapter?.getStatus) {
    return testMockAdapter.getStatus();
  }

  if (!gscState.isConnected) {
    loadPersistedState();
  }

  const configured = isConfigured();

  return {
    googleSearchConsole: {
      status: gscState.isConnected ? 'CONNECTED' : 'NOT_CONNECTED',
      connectionState: gscState.isConnected ? 'CONNECTED' : (configured ? 'DISCONNECTED' : 'NOT_CONFIGURED'),
      isConnected: gscState.isConnected,
      isConfigured: configured,
      selectedProperty: gscState.selectedProperty,
      availableProperties: gscState.availableProperties,
      lastSyncTimestamp: gscState.lastSyncTimestamp,
      lastError: gscState.lastError,
      message: gscState.isConnected
        ? `Connected to Search Console property: ${gscState.selectedProperty || 'None selected'}`
        : (configured
          ? 'Google Search Console OAuth credentials configured. Administrator authorization required to fetch verified performance data.'
          : 'Google Search Console OAuth client is not configured in backend environment.'),
      verificationRequirements: [
        'Domain ownership verified in Google Search Console (DNS TXT record or HTML meta tag)',
        'Google Cloud project with Search Console API enabled',
        'OAuth 2.0 Client credentials with "https://www.googleapis.com/auth/webmasters.readonly" scope',
      ],
      disclaimer: 'Zero synthetic or estimated clicks, impressions, or ranking positions are shown. Local analysis operates independently.',
    },
    googleAnalytics4: {
      status: 'NOT_CONNECTED',
      isConnected: false,
      message: 'Google Analytics 4 Measurement ID is not configured.',
      disclaimer: 'Live traffic analytics require Google Analytics integration.',
    },
    competitorTracking: {
      status: 'NOT_CONFIGURED',
      isConnected: false,
      message: 'Competitor URL fetching is restricted locally to protect against Server-Side Request Forgery (SSRF) and ensure environment isolation.',
      disclaimer: 'No simulated competitor scores or fabricated benchmarks are generated.',
    },
  };
}

/**
 * Helper to inject a test mock adapter for automated integration tests.
 */
function setTestMockAdapter(adapter) {
  testMockAdapter = adapter;
}

/**
 * Exposes CSRF state nonce generation for testing and validation.
 */
function generateStateNonce() {
  const nonce = crypto.randomBytes(24).toString('hex');
  oauthStateNonces.set(nonce, { createdAt: Date.now() });
  return nonce;
}

/**
 * Validates and consumes CSRF state nonce.
 */
function validateStateNonce(nonce) {
  if (!nonce || !oauthStateNonces.has(nonce)) return false;
  oauthStateNonces.delete(nonce);
  return true;
}

/**
 * Sets mock connected tokens for testing.
 */
function setConnectedTokensForTesting(tokens) {
  if (!tokens) {
    gscState.tokens = null;
    gscState.isConnected = false;
    gscState.status = isConfigured() ? 'NOT_CONNECTED' : 'NOT_CONFIGURED';
  } else {
    gscState.tokens = tokens;
    gscState.isConnected = true;
    gscState.status = 'CONNECTED';
    gscState.selectedProperty = gscState.selectedProperty || (SITE_DOMAIN ? `${SITE_DOMAIN}/` : 'https://ajtravelspune.com/');
  }
  savePersistedState();
}

/**
 * Transforms raw daily rows into structured time series.
 */
function transformDailyRows(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map(r => ({
    date: r.keys?.[0] || 'Unknown',
    clicks: Number(r.clicks) || 0,
    impressions: Number(r.impressions) || 0,
    ctr: Number(r.ctr) || 0,
    position: Number(r.position) || 0,
  }));
}

/**
 * Transforms raw dimension rows into structured items.
 */
function transformDimensionRows(rows, dimension) {
  if (!Array.isArray(rows)) return [];
  return rows.map(r => ({
    [dimension]: r.keys?.[0] || 'Unknown',
    clicks: Number(r.clicks) || 0,
    impressions: Number(r.impressions) || 0,
    ctr: Number(r.ctr) || 0,
    position: Number(r.position) || 0,
  }));
}

/**
 * Maps returned landing pages to managed public pages.
 */
function attributeManagedPages(pageItems = []) {
  const managedRoutes = [
    { path: '/', label: 'Homepage', pageKey: 'home' },
    { path: '/fare', label: 'Fare Calculator', pageKey: 'fare' },
    { path: '/booking', label: 'Booking Flow', pageKey: 'booking' },
  ];

  return managedRoutes.map(m => {
    const match = pageItems.find(p => {
      const urlStr = p.page || p.pageUrl || '';
      try {
        const u = new URL(urlStr);
        const norm = u.pathname.replace(/\/$/, '') || '/';
        return norm === m.path;
      } catch (_) {
        return urlStr.endsWith(m.path);
      }
    });

    if (match) {
      return {
        ...m,
        hasData: true,
        clicks: match.clicks,
        impressions: match.impressions,
        ctr: match.ctr,
        position: match.position,
      };
    }

    return {
      ...m,
      hasData: false,
      clicks: null,
      impressions: null,
      ctr: null,
      position: null,
    };
  });
}

module.exports = {
  isConfigured,
  generateAuthUrl,
  handleOAuthCallback,
  fetchProperties,
  getVerifiedProperties: fetchProperties,
  selectProperty,
  disconnect,
  queryPerformance,
  computeDateRange,
  calculateDateRange: computeDateRange,
  getStatus,
  setTestMockAdapter,
  redactSecrets,
  generateStateNonce,
  validateStateNonce,
  setConnectedTokensForTesting,
  transformDailyRows,
  transformDimensionRows,
  attributeManagedPages,
};
