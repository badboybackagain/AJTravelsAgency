// ============================================================
// SEO Controller
// Admin: manage per-page SEO metadata, sitemap, robots.txt
// ============================================================

const prisma = require('../utils/prisma');
const { SITE_DOMAIN } = require('../config/seoConfig');

// Migrated live website routes and content metadata
let migratedPagesMap = {};
try {
  migratedPagesMap = require('../data/migratedPagesSeo.json');
} catch (e) {
  // Non-fatal if map not present
}

// Raw sitemap data with reliable historical lastmod timestamps
let rawSitemapData = null;
try {
  rawSitemapData = require('../../../travel-agency/src/data/sitemapRawData.json');
} catch (e) {
  // Non-fatal if raw sitemap data not present
}

const reliableLastmodMap = new Map();
if (rawSitemapData) {
  const entries = [
    ...(rawSitemapData.pageEntries || []),
    ...(rawSitemapData.postEntries || []),
  ];
  for (const entry of entries) {
    if (entry.url && entry.lastmod) {
      try {
        const u = new URL(entry.url);
        const normPath = u.pathname.replace(/\/$/, '') || '/';
        const dateStr = entry.lastmod.split('T')[0];
        reliableLastmodMap.set(normPath, dateStr);
      } catch (_) {}
    }
  }
}

// ---------------------------------------------------------------------------
// Public pages tracked by the SEO module
// These are the canonical indexable pages (no admin, no API, no query strings)
// ---------------------------------------------------------------------------
const PUBLIC_PAGES = [
  {
    pageKey:         'home',
    pageLabel:       'Home Page',
    pageUrl:         '/',
    seoTitle:        'AJ Tours - Pune to Mumbai Cab | Best Intercity Cab Service',
    metaDescription: 'Book reliable Pune to Mumbai cab service at affordable rates. AJ Tours & Travels offers sedan, SUV & luxury cabs with verified drivers and WhatsApp support.',
    isIndexable:     true,
  },
  {
    pageKey:         'fare',
    pageLabel:       'Fare Calculator',
    pageUrl:         '/fare',
    seoTitle:        'Pune Mumbai Cab Fare Calculator | AJ Tours & Travels',
    metaDescription: 'Check Pune to Mumbai and Mumbai to Pune cab fares instantly. Transparent pricing with tolls included. One-way and round-trip options available.',
    isIndexable:     true,
  },
  {
    pageKey:         'booking',
    pageLabel:       'Cab Booking',
    pageUrl:         '/booking',
    seoTitle:        'Book Pune to Mumbai Cab Online | AJ Tours & Travels',
    metaDescription: 'Book your Pune to Mumbai or Mumbai to Pune cab online in minutes. Fixed fare, no hidden charges. Pay to driver. WhatsApp OTP verified booking.',
    isIndexable:     true,
  },
];

// ---------------------------------------------------------------------------
// Route Inventory Definition (Single Source of Truth)
// ---------------------------------------------------------------------------
const ROUTE_INVENTORY = [
  {
    path: '/',
    label: 'Home Page',
    type: 'PUBLIC_PAGE',
    isPublic: true,
    hasContent: true,
    indexingStatus: 'index, follow',
    sitemapStatus: 'Included (Priority 1.0)',
    managedPageKey: 'home',
    notes: 'Primary landing page with fleet discovery, route showcase, FAQs, and instant booking engine.',
  },
  {
    path: '/fare',
    label: 'Fare Calculator',
    type: 'PUBLIC_PAGE',
    isPublic: true,
    hasContent: true,
    indexingStatus: 'index, follow',
    sitemapStatus: 'Included (Priority 0.8)',
    managedPageKey: 'fare',
    notes: 'Interactive pricing calculator with one-way/round-trip vehicle rates, tolls, and duration estimates.',
  },
  {
    path: '/booking',
    label: 'Cab Booking',
    type: 'PUBLIC_PAGE',
    isPublic: true,
    hasContent: true,
    indexingStatus: 'index, follow',
    sitemapStatus: 'Included (Priority 0.8)',
    managedPageKey: 'booking',
    notes: 'Online booking flow with passenger details, vehicle selection, and OTP verification.',
  },
  {
    path: '/book',
    label: 'Legacy Booking Alias',
    type: 'REDIRECT_ALIAS',
    isPublic: false,
    hasContent: false,
    indexingStatus: '301 Permanent Redirect → /booking',
    sitemapStatus: 'Excluded (Alias)',
    managedPageKey: null,
    notes: 'Single-hop permanent redirect to /booking; preserves incoming search parameters and state.',
  },
  {
    path: '/admin/login',
    label: 'Admin Login',
    type: 'ADMIN_ROUTE',
    isPublic: false,
    hasContent: false,
    indexingStatus: 'noindex, nofollow (No canonical)',
    sitemapStatus: 'Excluded (Disallow: /admin/)',
    managedPageKey: null,
    notes: 'Authentication interface for site administration; protected by noindex and robots.txt disallow.',
  },
  {
    path: '/admin/dashboard',
    label: 'Admin Dashboard',
    type: 'ADMIN_ROUTE',
    isPublic: false,
    hasContent: false,
    indexingStatus: 'noindex, nofollow (No canonical)',
    sitemapStatus: 'Excluded (Disallow: /admin/)',
    managedPageKey: null,
    notes: 'Authenticated administrative workspace for fares, local vehicles, bookings, WhatsApp, and SEO.',
  },
  {
    path: '/admin/fares',
    label: 'Admin Fares Alias',
    type: 'ADMIN_REDIRECT',
    isPublic: false,
    hasContent: false,
    indexingStatus: 'noindex, nofollow (Redirect → /admin/dashboard)',
    sitemapStatus: 'Excluded',
    managedPageKey: null,
    notes: 'Internal administrative redirect to dashboard tab.',
  },
  {
    path: '/admin/bookings',
    label: 'Admin Bookings Alias',
    type: 'ADMIN_REDIRECT',
    isPublic: false,
    hasContent: false,
    indexingStatus: 'noindex, nofollow (Redirect → /admin/dashboard)',
    sitemapStatus: 'Excluded',
    managedPageKey: null,
    notes: 'Internal administrative redirect to dashboard tab.',
  },
  {
    path: '/admin',
    label: 'Admin Root Alias',
    type: 'ADMIN_REDIRECT',
    isPublic: false,
    hasContent: false,
    indexingStatus: 'noindex, nofollow (Redirect → /admin/dashboard)',
    sitemapStatus: 'Excluded',
    managedPageKey: null,
    notes: 'Internal administrative redirect to dashboard.',
  },
  {
    path: '*',
    label: 'Not Found Page (404)',
    type: 'NOT_FOUND_HANDLER',
    isPublic: false,
    hasContent: false,
    indexingStatus: 'HTTP 404 (Excluded from indexing)',
    sitemapStatus: 'Excluded',
    managedPageKey: null,
    notes: 'Wildcard error page returned with HTTP 404 status for unrecognised paths; guides users back home.',
  },
];

const PLANNED_ROUTES = [
  { path: '/about', label: 'About Us', priority: 'High', description: 'Company history, mission, verified fleet details, operating credentials.' },
  { path: '/contact', label: 'Contact Us', priority: 'High', description: 'Verified phone numbers, branch addresses, emergency helpline, operating hours.' },
  { path: '/airport-transfers', label: 'Airport Transfers', priority: 'Medium', description: 'Dedicated landing page for Pune (PNQ) and Mumbai (BOM/CSIA) airport transfers.' },
  { path: '/vehicles', label: 'Fleet & Vehicles', priority: 'Medium', description: 'Detailed fleet showcase for Sedan, SUV, Innova Crysta, and Tempo Traveller options.' },
  { path: '/pune-to-mumbai-taxi', label: 'Pune to Mumbai Taxi', priority: 'High', description: 'High-intent route landing page targeting Pune→Mumbai intercity taxi queries.' },
  { path: '/mumbai-to-pune-taxi', label: 'Mumbai to Pune Taxi', priority: 'High', description: 'High-intent route landing page targeting Mumbai→Pune intercity taxi queries.' },
  { path: '/privacy-policy', label: 'Privacy Policy', priority: 'Medium', description: 'Mandatory legal compliance and data protection disclosure.' },
  { path: '/terms', label: 'Terms & Conditions', priority: 'Medium', description: 'Booking conditions, cancellation/refund policies, toll and tax disclaimers.' },
];

// ---------------------------------------------------------------------------
// Ensure all known pages exist in DB (idempotent seed on first access)
// ---------------------------------------------------------------------------
async function seedPages() {
  try {
    for (const page of PUBLIC_PAGES) {
      await prisma.seoMeta.upsert({
        where: { pageKey: page.pageKey },
        update: {}, // Never overwrite admin-saved data on subsequent seeds
        create: {
          pageKey:         page.pageKey,
          pageLabel:       page.pageLabel,
          pageUrl:         page.pageUrl,
          seoTitle:        page.seoTitle        || null,
          metaDescription: page.metaDescription || null,
          isIndexable:     page.isIndexable     ?? true,
        },
      });
    }
  } catch (err) {
    console.warn('[SEO] seedPages non-fatal warning:', err.message);
  }
}

// ---------------------------------------------------------------------------
// GET /api/admin/seo/pages  — list all pages with SEO status
// ---------------------------------------------------------------------------
const getPages = async (req, res) => {
  try {
    await seedPages();
    let pages = [];
    try {
      pages = await prisma.seoMeta.findMany({ orderBy: { pageKey: 'asc' } });
    } catch (dbErr) {
      console.warn('[SEO] DB query fallback:', dbErr.message);
    }

    if (!pages || pages.length === 0) {
      pages = PUBLIC_PAGES.map(p => ({
        ...p,
        canonicalUrl: null,
        ogTitle: null,
        ogDescription: null,
        ogImage: null,
        slug: null,
        updatedAt: new Date().toISOString(),
      }));
    }

    const missingTitle = pages.filter(p => !p.seoTitle).length;
    const missingDesc  = pages.filter(p => !p.metaDescription).length;

    res.json({
      success: true,
      data: {
        siteDomain: SITE_DOMAIN,
        pages,
        stats: {
          total:        pages.length,
          indexable:    pages.filter(p => p.isIndexable).length,
          noindex:      pages.filter(p => !p.isIndexable).length,
          missingTitle,
          missingDesc,
          routesCount:  ROUTE_INVENTORY.length,
          plannedCount: PLANNED_ROUTES.length,
        },
        routeInventory: ROUTE_INVENTORY,
        plannedRoutes:  PLANNED_ROUTES,
      },
    });
  } catch (err) {
    console.error('[SEO] getPages error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch SEO pages.' });
  }
};

// ---------------------------------------------------------------------------
// GET /api/admin/seo/pages/:pageKey  — single page
// ---------------------------------------------------------------------------
const getPage = async (req, res) => {
  try {
    await seedPages();
    const page = await prisma.seoMeta.findUnique({ where: { pageKey: req.params.pageKey } });
    if (!page) return res.status(404).json({ success: false, message: 'Page not found.' });
    res.json({ success: true, data: page });
  } catch (err) {
    console.error('[SEO] getPage error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch SEO page.' });
  }
};

// ---------------------------------------------------------------------------
// PUT /api/admin/seo/pages/:pageKey  — save SEO settings for a page
// ---------------------------------------------------------------------------
const updatePage = async (req, res) => {
  try {
    const { pageKey } = req.params;
    const {
      seoTitle, metaDescription, canonicalUrl,
      isIndexable, ogTitle, ogDescription, ogImage, slug,
    } = req.body;

    // Validate lengths (guidance only — we persist regardless)
    const warnings = [];
    if (seoTitle && seoTitle.length > 60)       warnings.push('SEO title exceeds recommended 60 characters.');
    if (metaDescription && metaDescription.length > 160) warnings.push('Meta description exceeds recommended 160 characters.');

    const page = await prisma.seoMeta.update({
      where: { pageKey },
      data: {
        seoTitle:        seoTitle        ?? undefined,
        metaDescription: metaDescription ?? undefined,
        canonicalUrl:    canonicalUrl    ?? undefined,
        isIndexable:     typeof isIndexable === 'boolean' ? isIndexable : undefined,
        ogTitle:         ogTitle         ?? undefined,
        ogDescription:   ogDescription   ?? undefined,
        ogImage:         ogImage         ?? undefined,
        slug:            slug            ?? undefined,
      },
    });

    res.json({ success: true, data: page, warnings });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ success: false, message: 'Page not found.' });
    }
    console.error('[SEO] updatePage error:', err);
    res.status(500).json({ success: false, message: 'Failed to update SEO page.' });
  }
};


// ---------------------------------------------------------------------------
// GET /sitemap.xml  — generate XML sitemap (public, no auth)
// Includes all eligible canonical public pages (core SPA pages + migrated pages)
// ---------------------------------------------------------------------------
const getSitemap = async (req, res) => {
  try {
    const domain = SITE_DOMAIN;
    let dbPages = [];
    try {
      dbPages = await prisma.seoMeta.findMany({
        where:   { isIndexable: true },
        orderBy: { pageUrl: 'asc' },
      });
    } catch (dbErr) {
      console.warn('[SEO] getSitemap DB query warning:', dbErr.message);
    }

    const urlMap = new Map();

    // 1. Core pages (from DB or fallback PUBLIC_PAGES)
    const coreList = dbPages.length > 0 ? dbPages : PUBLIC_PAGES;
    for (const p of coreList) {
      if (p.isIndexable === false) continue;
      const pathPart = p.pageUrl || '/';
      const loc = p.canonicalUrl
        ? (p.canonicalUrl.startsWith('http') ? p.canonicalUrl : `${domain}${p.canonicalUrl}`)
        : (pathPart === '/' ? `${domain}/` : `${domain}${pathPart}`);

      const priority = pathPart === '/' ? '1.0' : '0.8';
      const changefreq = 'weekly';
      const reliableDate = p.updatedAt
        ? new Date(p.updatedAt).toISOString().split('T')[0]
        : (reliableLastmodMap.get(pathPart) || null);

      urlMap.set(loc, {
        loc,
        lastmod: reliableDate,
        changefreq,
        priority,
      });
    }

    // 2. Migrated content pages (articles, corridors, locality rentals, vehicles, corporate)
    for (const [slug, meta] of Object.entries(migratedPagesMap)) {
      if (!meta || !meta.canonical) continue;

      try {
        const u = new URL(meta.canonical);
        const cleanPath = u.pathname;
        const normPath = cleanPath.replace(/\/$/, '') || '/';
        const loc = `${domain}${cleanPath}`;

        // Avoid duplicate canonical entries (e.g. 'about' and 'about-us' both point to /about-us/)
        if (!urlMap.has(loc)) {
          const lm = reliableLastmodMap.get(normPath) || null;
          urlMap.set(loc, {
            loc,
            lastmod: lm,
            changefreq: 'monthly',
            priority: '0.7',
          });
        }
      } catch (_) {}
    }

    // Deterministic sorting: / (home) first, then /booking, /fare, then alphabetical
    const entries = Array.from(urlMap.values()).sort((a, b) => {
      if (a.loc === `${domain}/`) return -1;
      if (b.loc === `${domain}/`) return 1;
      if (a.loc === `${domain}/booking` && b.loc === `${domain}/fare`) return -1;
      if (a.loc === `${domain}/fare` && b.loc === `${domain}/booking`) return 1;
      return a.loc.localeCompare(b.loc);
    });

    const urlEntries = entries.map(entry => {
      const lines = [
        '  <url>',
        `    <loc>${entry.loc}</loc>`,
      ];
      if (entry.lastmod) {
        lines.push(`    <lastmod>${entry.lastmod}</lastmod>`);
      }
      if (entry.changefreq) {
        lines.push(`    <changefreq>${entry.changefreq}</changefreq>`);
      }
      if (entry.priority) {
        lines.push(`    <priority>${entry.priority}</priority>`);
      }
      lines.push('  </url>');
      return lines.join('\n');
    }).join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;

    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.send(xml);
  } catch (err) {
    console.error('[SEO] getSitemap error:', err);
    res.status(500).send('<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
  }
};


// ---------------------------------------------------------------------------
const getRobots = (req, res) => {
  const domain = SITE_DOMAIN;
  // /admin/, /api/, and /auth/ are blocked from crawlers.
  // /auth/ matches the live production robots.txt which also disallows /auth.
  const content = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin/',
    'Disallow: /api/',
    'Disallow: /auth/',
    `Sitemap: ${domain}/sitemap.xml`,
    '',
  ].join('\n');
  res.set('Content-Type', 'text/plain; charset=utf-8');
  res.send(content);
};


// ---------------------------------------------------------------------------
// GET /api/seo/public  — public list of SEO tags for client-side hydration
// ---------------------------------------------------------------------------
const getPublicPages = async (req, res) => {
  try {
    let pages = [];
    try {
      pages = await prisma.seoMeta.findMany({
        select: {
          pageKey: true,
          pageUrl: true,
          seoTitle: true,
          metaDescription: true,
          canonicalUrl: true,
          isIndexable: true,
          ogTitle: true,
          ogDescription: true,
          ogImage: true,
        },
      });
    } catch (dbErr) {
      console.warn('[SEO] getPublicPages DB query fallback:', dbErr.message);
    }

    if (!pages || pages.length === 0) {
      pages = PUBLIC_PAGES.map(p => ({
        pageKey: p.pageKey,
        pageUrl: p.pageUrl,
        seoTitle: p.seoTitle,
        metaDescription: p.metaDescription,
        canonicalUrl: null,
        isIndexable: p.isIndexable,
        ogTitle: null,
        ogDescription: null,
        ogImage: null,
      }));
    }

    res.json({ success: true, data: pages });
  } catch (err) {
    console.error('[SEO] getPublicPages error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch public SEO metadata.' });
  }
};

module.exports = {
  getPages,
  getPage,
  updatePage,
  getSitemap,
  getRobots,
  getPublicPages,
  PUBLIC_PAGES,
  ROUTE_INVENTORY,
  PLANNED_ROUTES,
};
