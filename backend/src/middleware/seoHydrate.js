// ============================================================
// seoHydrate.js
// Express middleware: injects page-specific SEO metadata into
// the built dist/index.html BEFORE sending it to the client.
//
// Supported public SPA routes:
//   /         →  pageKey: home
//   /fare     →  pageKey: fare
//   /booking  →  pageKey: booking
//   /book     →  alias for booking (redirect handled by React Router,
//                but hydrate handles direct browser GET just in case)
//
// All other requests fall through to the next handler.
// The React SPA continues to work normally after hydration.
// ============================================================

const fs   = require('fs');
const path = require('path');

const prisma = require('../utils/prisma');

// Absolute path to the built SPA HTML template
const DIST_HTML = path.join(__dirname, '../../..', 'travel-agency', 'dist', 'index.html');

// Map URL path → seoMeta pageKey.  Only known public routes are listed.
// /book is an alias for booking — React Router 301-redirects it, but if a
// crawler or browser hits /book directly the correct SEO is still served.
const ROUTE_TO_PAGE_KEY = {
  '/':         'home',
  '/fare':     'fare',
  '/booking':  'booking',
  '/book':     'booking',
};

// Read template once at startup; warn but do not crash if missing.
let htmlTemplate;
try {
  htmlTemplate = fs.readFileSync(DIST_HTML, 'utf8');
} catch (e) {
  console.warn('[seoHydrate] dist/index.html not found — run `npm run build` in travel-agency first.');
  console.warn('[seoHydrate] SEO hydration middleware will be skipped until the file exists.');
  htmlTemplate = null;
}

// ---------------------------------------------------------------------------
// Escape a plain string so it is safe to place inside an HTML attribute value
// (inside double-quotes) or a <title> element.
// Only the five HTML-special characters need escaping here.
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
// Replace helpers — each targets only the specific tag it owns.
// All use two-pass regex: attribute-order-agnostic.
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

// ---------------------------------------------------------------------------
// Main middleware factory.
// Usage in app.js:  app.use(seoHydrate());
// ---------------------------------------------------------------------------
function seoHydrate() {
  return async function seoHydrateMiddleware(req, res, next) {
    // Only handle GET requests for known public SPA routes
    if (req.method !== 'GET') return next();

    const pageKey = ROUTE_TO_PAGE_KEY[req.path];
    if (!pageKey) return next(); // unknown route — let 404 handler deal with it

    // If the build hasn't been run yet, re-try once then fall through
    if (!htmlTemplate) {
      try {
        htmlTemplate = fs.readFileSync(DIST_HTML, 'utf8');
      } catch (e) {
        return next();
      }
    }

    // Start with a fresh copy of the template for every request —
    // this guarantees no cross-request or cross-page contamination.
    let html = htmlTemplate;

    // Canonical URL for this route — derived from the stored canonicalUrl in the
    // DB or the base canonical in the template.  We use this for og:url and
    // twitter:url as well, which previously remained hardcoded to the home URL.
    let pageCanonicalUrl = null;

    try {
      const meta = await prisma.seoMeta.findUnique({ where: { pageKey } });

      if (meta) {
        // ---- Title ----
        if (meta.seoTitle) {
          html = replaceTitle(html, meta.seoTitle);
        }

        // ---- Meta description ----
        if (meta.metaDescription) {
          html = replaceMetaByName(html, 'description', meta.metaDescription);
        }

        // ---- Canonical URL ----
        if (meta.canonicalUrl) {
          pageCanonicalUrl = meta.canonicalUrl;
          html = replaceCanonical(html, meta.canonicalUrl);
        }

        // ---- Robots directive ----
        const robotsDirective = meta.isIndexable !== false ? 'index, follow' : 'noindex, nofollow';
        html = replaceMetaByName(html, 'robots', robotsDirective);

        // ---- Open Graph ----
        const ogTitle = meta.ogTitle || meta.seoTitle;
        if (ogTitle) {
          html = replaceMetaByProperty(html, 'og:title', ogTitle);
        }
        const ogDesc = meta.ogDescription || meta.metaDescription;
        if (ogDesc) {
          html = replaceMetaByProperty(html, 'og:description', ogDesc);
        }
        // og:url and twitter:url — replace with the page-specific canonical URL
        // so crawlers and social cards point to the correct page, not always the homepage.
        if (pageCanonicalUrl) {
          html = replaceMetaByProperty(html, 'og:url', pageCanonicalUrl);
          html = replaceMetaByProperty(html, 'twitter:url', pageCanonicalUrl);
        }

        // ---- Twitter / X card ----
        const twTitle = meta.ogTitle || meta.seoTitle;
        if (twTitle) {
          html = replaceMetaByProperty(html, 'twitter:title', twTitle);
        }
        const twDesc = meta.ogDescription || meta.metaDescription;
        if (twDesc) {
          html = replaceMetaByProperty(html, 'twitter:description', twDesc);
        }
      }
      // If no DB record exists for this route, serve template as-is (safe fallback)
    } catch (err) {
      // DB error — serve unmodified template; do not expose error details
      console.error('[seoHydrate] DB error for', pageKey, ':', err.message);
    }

    // Cache-Control: no-store prevents CDNs, proxies, and browsers from caching
    // page-specific HTML.  Without this, a cached /fare response could be served
    // for / (or vice-versa) and crawlers would see wrong metadata.
    res.set({
      'Content-Type':  'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    });
    res.send(html);
  };
}

module.exports = seoHydrate;
