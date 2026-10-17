// ============================================================
// seoHydrate.js
// Express middleware: injects page-specific SEO metadata into
// the built dist/index.html BEFORE sending it to the client.
//
// Supported public SPA routes:
//   /          →  pageKey: home    (index, follow)
//   /fare      →  pageKey: fare    (index, follow)
//   /booking   →  pageKey: booking (index, follow)
//   /book      →  alias for booking
//
// Admin SPA routes (served as 200, noindex so crawlers stay out):
//   /admin/login     →  noindex, nofollow
//   /admin/dashboard →  noindex, nofollow
//   /admin           →  noindex, nofollow
//   /admin/fares     →  noindex, nofollow
//   /admin/bookings  →  noindex, nofollow
//
// All other requests fall through to the next handler (404).
// The React SPA continues to work normally after hydration.
//
// Phase 2 — Canonical generation:
//   When SITE_DOMAIN is set in the environment, canonical and
//   social URLs are computed as SITE_DOMAIN + pageUrl for each
//   page, making them page-specific (not always the homepage).
//   When SITE_DOMAIN is unset the template defaults are preserved.
// ============================================================

const fs   = require('fs');
const path = require('path');

const prisma = require('../utils/prisma');
const { SITE_DOMAIN } = require('../config/seoConfig');

// Absolute path to the built SPA HTML template
const DIST_HTML = path.join(__dirname, '../../..', 'travel-agency', 'dist', 'index.html');

// ---------------------------------------------------------------------------
// Route maps
// ---------------------------------------------------------------------------

// Public indexable routes: pageKey drives DB lookup + metadata injection.
const PUBLIC_ROUTE_MAP = {
  '/':        'home',
  '/fare':    'fare',
  '/booking': 'booking',
};

// Admin routes: served as HTTP 200 SPA shell with noindex so:
//   a) direct browser navigation (e.g. sharing a link) works, and
//   b) search engines are told not to index these private pages.
const ADMIN_ROUTES = new Set([
  '/admin/login',
  '/admin/dashboard',
  '/admin',
  '/admin/fares',
  '/admin/bookings',
]);

// Migrated live website routes and content metadata
let migratedPagesMap = {};
try {
  migratedPagesMap = require('../data/migratedPagesSeo.json');
} catch (e) {
  // Non-fatal if map not present
}

// ---------------------------------------------------------------------------
// Template loader — lazy with mtime check so a `npm run build` while the
// server is running always serves fresh HTML rather than stale bytes.
// ---------------------------------------------------------------------------
let htmlTemplate   = null;
let templateMtime  = 0;

function loadTemplate() {
  try {
    const stat = fs.statSync(DIST_HTML);
    const mtime = stat.mtimeMs;
    if (mtime !== templateMtime) {
      htmlTemplate  = fs.readFileSync(DIST_HTML, 'utf8');
      templateMtime = mtime;
    }
  } catch (e) {
    if (!htmlTemplate) {
      console.warn('[seoHydrate] dist/index.html not found — run `npm run build` in travel-agency first.');
    }
  }
  return htmlTemplate;
}

// Warm the cache at startup; non-fatal if dist hasn't been built yet.
loadTemplate();

// ---------------------------------------------------------------------------
// HTML-safe string escaping for attribute values and text content.
// ---------------------------------------------------------------------------
function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#39;');
}

// ---------------------------------------------------------------------------
// Targeted replace helpers — each owns exactly one tag type.
// Two-pass (attribute-order-agnostic) regex pairs.
// ---------------------------------------------------------------------------
function replaceTitle(html, newTitle) {
  return html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(newTitle)}</title>`);
}

function replaceMetaByName(html, nameAttr, newContent) {
  // name="…" before content="…"
  const re = new RegExp(
    `(<meta\\s[^>]*name=["']${nameAttr}["'][^>]*content=)["'][^"']*["']`,
    'i'
  );
  if (re.test(html)) {
    return html.replace(re, `$1"${escapeHtml(newContent)}"`);
  }
  // content="…" before name="…"
  const re2 = new RegExp(
    `(<meta\\s[^>]*content=)["'][^"']*["']([^>]*name=["']${nameAttr}["'])`,
    'i'
  );
  return html.replace(re2, `$1"${escapeHtml(newContent)}"$2`);
}

function replaceMetaByProperty(html, propertyAttr, newContent) {
  // property="…" before content="…"
  const re = new RegExp(
    `(<meta\\s[^>]*property=["']${propertyAttr.replace(':', '\\:')}["'][^>]*content=)["'][^"']*["']`,
    'i'
  );
  if (re.test(html)) {
    return html.replace(re, `$1"${escapeHtml(newContent)}"`);
  }
  // content="…" before property="…"
  const re2 = new RegExp(
    `(<meta\\s[^>]*content=)["'][^"']*["']([^>]*property=["']${propertyAttr.replace(':', '\\:')}["'])`,
    'i'
  );
  return html.replace(re2, `$1"${escapeHtml(newContent)}"$2`);
}

function replaceCanonical(html, newHref) {
  // rel="canonical" before href="…"
  const re = /(<link\s[^>]*rel=["']canonical["'][^>]*href=)["'][^"']*["']/i;
  if (re.test(html)) {
    return html.replace(re, `$1"${escapeHtml(newHref)}"`);
  }
  // href="…" before rel="canonical"
  const re2 = /(<link\s[^>]*href=)["'][^"']*["']([^>]*rel=["']canonical["'])/i;
  return html.replace(re2, `$1"${escapeHtml(newHref)}"$2`);
}

function stripCanonical(html) {
  return html
    .replace(/<link\s+[^>]*rel=["']canonical["'][^>]*\/?>\s*/gi, '')
    .replace(/<link\s+[^>]*href=[^>]*rel=["']canonical["'][^>]*\/?>\s*/gi, '');
}

function stripMetaByProperty(html, propertyAttr) {
  const escaped = propertyAttr.replace(':', '\\:');
  const re = new RegExp(`<meta\\s+[^>]*property=["']${escaped}["'][^>]*\\/?>\\s*`, 'gi');
  return html.replace(re, '');
}

function stripJsonLd(html) {
  return html.replace(/<script\s+type=["']application\/ld\+json["']>[\s\S]*?<\/script>\s*/gi, '');
}

function removeFaqFromJsonLd(html) {
  const match = html.match(/<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/i);
  if (!match) return html;
  try {
    const json = JSON.parse(match[1]);
    if (json && Array.isArray(json['@graph'])) {
      json['@graph'] = json['@graph'].filter(node => node['@type'] !== 'FAQPage');
      return html.replace(match[0], `<script type="application/ld+json">\n${JSON.stringify(json, null, 2)}\n    </script>`);
    }
  } catch (e) {
    // leave as-is on parse error
  }
  return html;
}

// ---------------------------------------------------------------------------
// Derive the effective canonical URL for a page.
//
// Priority order:
//   1. Explicit canonicalUrl stored in the DB for this page.
//   2. SITE_DOMAIN env var + pageUrl path (e.g. "https://example.com/fare").
//   3. null — leave template default unchanged.
//
// This ensures canonical is ALWAYS page-specific when SITE_DOMAIN is set,
// even if the admin has not yet entered canonicalUrls into the DB.
// ---------------------------------------------------------------------------
function deriveCanonical(meta, pageUrl) {
  if (meta && meta.canonicalUrl) return meta.canonicalUrl;
  if (SITE_DOMAIN) return `${SITE_DOMAIN}${pageUrl}`;
  return null;
}

// ---------------------------------------------------------------------------
// Main middleware factory.
// Usage in app.js:  app.use(seoHydrate());
// ---------------------------------------------------------------------------
function seoHydrate() {
  return async function seoHydrateMiddleware(req, res, next) {
    // Only handle GET requests
    if (req.method !== 'GET') return next();

    // -----------------------------------------------------------------------
    // LEGACY /book REDIRECT: Permanent single-hop 301 redirect to /booking
    // Preserves query strings (e.g. /book?tripType=ONE_WAY -> /booking?tripType=ONE_WAY)
    // -----------------------------------------------------------------------
    if (req.path === '/book') {
      const qs = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
      res.set({
        'Cache-Control': 'no-store',
      });
      return res.redirect(301, `/booking${qs}`);
    }

    const isAdminRoute  = ADMIN_ROUTES.has(req.path);
    const publicPageKey = PUBLIC_ROUTE_MAP[req.path];
    const cleanSlug     = req.path.replace(/^\/|\/$/g, '');
    const migratedMeta  = (!publicPageKey && cleanSlug) ? migratedPagesMap[cleanSlug] : null;

    // Unknown routes fall through to the 404 handler
    if (!isAdminRoute && !publicPageKey && !migratedMeta) return next();

    // Re-read template if dist has been rebuilt since last load
    const html0 = loadTemplate();
    if (!html0) return next(); // build not available yet

    // Start with a fresh per-request copy — no cross-request contamination
    let html = html0;

    // -----------------------------------------------------------------------
    // ADMIN ROUTES: serve the SPA shell with noindex and HTTP 200.
    // Explicitly strips canonical tags and homepage metadata so admin pages
    // never inherit the homepage canonical or publish confusing signals.
    // -----------------------------------------------------------------------
    if (isAdminRoute) {
      html = replaceMetaByName(html, 'robots', 'noindex, nofollow');
      html = stripCanonical(html);
      html = stripMetaByProperty(html, 'og:url');
      html = stripMetaByProperty(html, 'twitter:url');
      html = stripJsonLd(html);
      res.set({
        'Content-Type':  'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      });
      return res.status(200).send(html);
    }

    // -----------------------------------------------------------------------
    // MIGRATED LIVE ROUTES: serve the SPA shell with hydrated title,
    // meta description, and canonical URL. Ensures direct navigation and
    // browser page refreshes return HTTP 200 without a 404.
    // -----------------------------------------------------------------------
    if (migratedMeta) {
      if (migratedMeta.title) {
        html = replaceTitle(html, migratedMeta.title);
      }
      if (migratedMeta.description) {
        html = replaceMetaByName(html, 'description', migratedMeta.description);
      }
      html = replaceMetaByName(html, 'robots', 'index, follow');

      const ogTitle = migratedMeta.title;
      const ogDesc  = migratedMeta.description;
      if (ogTitle) {
        html = replaceMetaByProperty(html, 'og:title', ogTitle);
        html = replaceMetaByProperty(html, 'twitter:title', ogTitle);
      }
      if (ogDesc) {
        html = replaceMetaByProperty(html, 'og:description', ogDesc);
        html = replaceMetaByProperty(html, 'twitter:description', ogDesc);
      }

      const canonicalUrl = migratedMeta.canonical || (SITE_DOMAIN ? `${SITE_DOMAIN}/${cleanSlug}/` : null);
      if (canonicalUrl) {
        html = replaceCanonical(html, canonicalUrl);
        html = replaceMetaByProperty(html, 'og:url', canonicalUrl);
        html = replaceMetaByProperty(html, 'twitter:url', canonicalUrl);
      }

      html = removeFaqFromJsonLd(html);

      res.set({
        'Content-Type':  'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      });
      return res.status(200).send(html);
    }

    // -----------------------------------------------------------------------
    // PUBLIC ROUTES: look up DB metadata and inject into HTML.
    // -----------------------------------------------------------------------
    const pageKey = publicPageKey;
    let canonicalUrl = null;

    try {
      const meta = await prisma.seoMeta.findUnique({ where: { pageKey } });

      // Derive a page-specific canonical even when the DB field is null.
      canonicalUrl = deriveCanonical(meta, req.path);

      if (meta) {
        // ---- Title ----
        if (meta.seoTitle) {
          html = replaceTitle(html, meta.seoTitle);
        }

        // ---- Meta description ----
        if (meta.metaDescription) {
          html = replaceMetaByName(html, 'description', meta.metaDescription);
        }

        // ---- Robots directive ----
        const robotsDirective = meta.isIndexable !== false ? 'index, follow' : 'noindex, nofollow';
        html = replaceMetaByName(html, 'robots', robotsDirective);

        // ---- Open Graph title + description ----
        const ogTitle = meta.ogTitle || meta.seoTitle;
        if (ogTitle) html = replaceMetaByProperty(html, 'og:title', ogTitle);

        const ogDesc = meta.ogDescription || meta.metaDescription;
        if (ogDesc) html = replaceMetaByProperty(html, 'og:description', ogDesc);

        // ---- Twitter / X card ----
        const twTitle = meta.ogTitle || meta.seoTitle;
        if (twTitle) html = replaceMetaByProperty(html, 'twitter:title', twTitle);

        const twDesc = meta.ogDescription || meta.metaDescription;
        if (twDesc) html = replaceMetaByProperty(html, 'twitter:description', twDesc);
      }

      // ---- Canonical + social URLs (always page-specific when domain known) ----
      if (canonicalUrl) {
        html = replaceCanonical(html, canonicalUrl);
        html = replaceMetaByProperty(html, 'og:url', canonicalUrl);
        html = replaceMetaByProperty(html, 'twitter:url', canonicalUrl);
      }

      // ---- Structured Data validation: FAQPage only on homepage where FAQs are visible ----
      if (pageKey !== 'home') {
        html = removeFaqFromJsonLd(html);
      }

    } catch (err) {
      // DB error — serve unmodified template; do not expose error details
      console.error('[seoHydrate] DB error for', pageKey, ':', err.message);
    }

    // no-store: prevents CDN / proxy / browser from caching page-specific HTML
    // and serving the wrong page's metadata on a different URL.
    res.set({
      'Content-Type':  'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    });
    res.send(html);
  };
}

module.exports = seoHydrate;
