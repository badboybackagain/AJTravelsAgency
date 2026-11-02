// ============================================================
// Express App Configuration
// Pune ↔ Mumbai Private Travel Backend
// ============================================================

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { errorHandler } = require('./middleware/errorHandler');

const path = require('path');
const fs   = require('fs');

// Route imports
const authRoutes = require('./routes/authRoutes');
const locationRoutes = require('./routes/locationRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');
const routeRoutes = require('./routes/routeRoutes');
const fareRoutes = require('./routes/fareRoutes');
const miscRoutes = require('./routes/miscRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const adminLocalVehicleRoutes = require('./routes/adminLocalVehicleRoutes');
const localVehicleRoutes = require('./routes/localVehicleRoutes');
const whatsappRoutes = require('./routes/whatsappRoutes');
const enquiryRoutes = require('./routes/enquiryRoutes');
const quoteRoutes = require('./routes/quoteRoutes');
const otpRoutes = require('./routes/otpRoutes');
const seoRoutes = require('./routes/seoRoutes');
const mediaRoutes = require('./routes/mediaRoutes');
const { getSitemap, getRobots, getPublicPages } = require('./controllers/seoController');
const seoHydrate = require('./middleware/seoHydrate');

const app = express();

// ============================================================
// STATIC FILES (Uploads)
// ============================================================
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));


// ============================================================
// SECURITY MIDDLEWARE
// ============================================================

// Helmet — sets secure HTTP headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS — allow frontend origins
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, server-to-server) or any localhost port
    if (!origin || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      callback(null, true);
    } else {
      callback(null, true); // Dev-permissive
    }
  },
  credentials: true,
}));

// Global rate limiter — prevent DDoS
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  message: { success: false, message: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// ============================================================
// REQUEST PARSING
// ============================================================
app.use(express.json({ limit: '10kb' })); // Limit payload size
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ============================================================
// HEALTH CHECK
// ============================================================

const { getDbStatus } = require('./utils/dbState');

app.get('/health', (req, res) => {
  const dbStatus = getDbStatus();
  const isHealthy = dbStatus.connected;

  res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    status: isHealthy ? 'healthy' : 'degraded',
    service: 'Pune Mumbai Travel API',
    database: {
      connected: dbStatus.connected,
      ...(dbStatus.error && { error: dbStatus.error }),
    },
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ============================================================
// API ROUTES (Database Dependent)
// ============================================================
const requireDatabase = (req, res, next) => {
  const dbStatus = getDbStatus();
  if (!dbStatus.connected) {
    return res.status(503).json({
      success: false,
      code: 'DATABASE_UNAVAILABLE',
      message: 'Database is unavailable. Database operations are suspended.',
      details: dbStatus.error || 'DATABASE_URL is not configured.',
    });
  }
  next();
};

app.use('/api', requireDatabase);

app.use('/api/auth', authRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/fares', fareRoutes);
app.use('/api/fare', fareRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin/local-vehicles', adminLocalVehicleRoutes);
app.use('/api/local-vehicles', localVehicleRoutes);
app.use('/api/admin/whatsapp', whatsappRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/admin/seo', seoRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/admin/media', mediaRoutes);
app.use('/api', miscRoutes);

// ============================================================
// PUBLIC SEO ENDPOINTS (no auth, outside requireDatabase guard)
// ============================================================
app.get('/sitemap.xml', getSitemap);
app.get('/robots.txt', getRobots);
app.get('/api/seo/public', getPublicPages);

// ============================================================
// FRONTEND SPA — static assets + SSR-style SEO hydration
// Served from the backend so crawlers get per-page metadata
// in the initial HTML response before JavaScript executes.
// ============================================================

// 1. Serve compiled JS/CSS/images from dist/assets
//    index:false prevents static from serving index.html for GET /,
//    which would bypass seoHydrate.  The hydrate middleware handles / explicitly.
app.use(express.static(path.join(__dirname, '../../travel-agency/dist'), { index: false }));

// Load and prepare dist/index.html for the 404 SPA fallback.
// Ensures unknown routes returning HTTP 404 do not inherit the homepage canonical,
// social URLs, or index directives, while still serving the SPA for client-side routing.
const DIST_HTML_PATH = path.join(__dirname, '../../travel-agency/dist/index.html');
let html404Cache  = null;
let html404Mtime  = 0;

function get404Html() {
  try {
    const stat = fs.statSync(DIST_HTML_PATH);
    if (stat.mtimeMs !== html404Mtime || !html404Cache) {
      let html = fs.readFileSync(DIST_HTML_PATH, 'utf8');

      // 1. Set clear 404 page title (avoids homepage title)
      html = html.replace(/<title>[^<]*<\/title>/i, '<title>Page Not Found | AJ Travels</title>');
      html = html.replace(
        /(<meta\s[^>]*name=["']title["'][^>]*content=)["'][^"']*["']/i,
        '$1"Page Not Found | AJ Travels"'
      );

      // 2. Set robots directive to noindex, follow without duplicating tags
      const robotsRe = /(<meta\s[^>]*name=["']robots["'][^>]*content=)["'][^"']*["']/i;
      const robotsRe2 = /(<meta\s[^>]*content=)["'][^"']*["']([^>]*name=["']robots["'])/i;
      if (robotsRe.test(html)) {
        html = html.replace(robotsRe, '$1"noindex, follow"');
      } else if (robotsRe2.test(html)) {
        html = html.replace(robotsRe2, '$1"noindex, follow"$2');
      } else {
        html = html.replace('</head>', '  <meta name="robots" content="noindex, follow" />\n  </head>');
      }

      // 3. Remove homepage canonical link tag completely
      html = html
        .replace(/<link\s+[^>]*rel=["']canonical["'][^>]*\/?>\s*/gi, '')
        .replace(/<link\s+[^>]*href=[^>]*rel=["']canonical["'][^>]*\/?>\s*/gi, '');

      // 4. Remove social og:url and twitter:url pointing to homepage
      html = html.replace(/<meta\s+[^>]*property=["']og:url["'][^>]*\/?>\s*/gi, '');
      html = html.replace(/<meta\s+[^>]*property=["']twitter:url["'][^>]*\/?>\s*/gi, '');

      html404Cache = html;
      html404Mtime = stat.mtimeMs;
    }
    return html404Cache;
  } catch (_e) {
    return null;
  }
}

// 2. For the 3 known public SPA routes, inject DB-sourced SEO metadata
//    into dist/index.html and return the hydrated HTML.
app.use(seoHydrate());

// ============================================================
// 404 HANDLER
// ============================================================
app.use((req, res) => {
  // API routes that don't match → JSON 404
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      message: `Endpoint not found: ${req.method} ${req.originalUrl}`,
    });
  }

  // Non-API browser paths (e.g. /pune-to-mumbai-taxi, /about) → serve SPA
  // with HTTP 404 so crawlers correctly see "not found" while React Router
  // renders the NotFoundPage component client-side.
  if (req.method === 'GET') {
    const html404 = get404Html();
    if (html404) {
      return res.status(404)
        .set({ 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' })
        .send(html404);
    }
  }

  // Anything else (POST/PUT/DELETE to unknown paths)
  res.status(404).json({
    success: false,
    message: `Not found: ${req.method} ${req.originalUrl}`,
  });
});


// ============================================================
// CENTRALIZED ERROR HANDLER (must be last)
// ============================================================
app.use(errorHandler);

module.exports = app;
