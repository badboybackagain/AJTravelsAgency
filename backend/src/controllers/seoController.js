// ============================================================
// SEO Controller
// Admin: manage per-page SEO metadata, sitemap, robots.txt
// ============================================================

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Public pages tracked by the SEO module
// These are the canonical indexable pages (no admin, no API, no query strings)
// ---------------------------------------------------------------------------
const PUBLIC_PAGES = [
  {
    pageKey:         'home',
    pageLabel:       'Home Page',
    pageUrl:         '/',
    seoTitle:        'AJ Tours & Travels – Pune to Mumbai Cab | Best Intercity Cab Service',
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
// Ensure all known pages exist in DB (idempotent seed on first access)
// ---------------------------------------------------------------------------
async function seedPages() {
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
}

// ---------------------------------------------------------------------------
// GET /api/admin/seo/pages  — list all pages with SEO status
// ---------------------------------------------------------------------------
const getPages = async (req, res) => {
  try {
    await seedPages();
    const pages = await prisma.seoMeta.findMany({ orderBy: { pageKey: 'asc' } });

    const missingTitle = pages.filter(p => !p.seoTitle).length;
    const missingDesc  = pages.filter(p => !p.metaDescription).length;

    res.json({
      success: true,
      data: {
        pages,
        stats: {
          total:        pages.length,
          indexable:    pages.filter(p => p.isIndexable).length,
          missingTitle,
          missingDesc,
        },
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
// GET /api/sitemap.xml  — generate XML sitemap (public, no auth)
// ---------------------------------------------------------------------------
const getSitemap = async (req, res) => {
  try {
    const domain = process.env.SITE_DOMAIN || 'https://ajtoursandtravels.in';
    const pages  = await prisma.seoMeta.findMany({ where: { isIndexable: true } });

    const urlEntries = pages.map(p => {
      const loc = p.canonicalUrl
        ? (p.canonicalUrl.startsWith('http') ? p.canonicalUrl : `${domain}${p.canonicalUrl}`)
        : `${domain}${p.pageUrl}`;
      return `  <url>\n    <loc>${loc}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>`;
    }).join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;

    res.set('Content-Type', 'application/xml');
    res.send(xml);
  } catch (err) {
    console.error('[SEO] getSitemap error:', err);
    res.status(500).send('<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
  }
};

// ---------------------------------------------------------------------------
const getRobots = (req, res) => {
  const domain = process.env.SITE_DOMAIN || 'https://ajtoursandtravels.in';
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
    const pages = await prisma.seoMeta.findMany({
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
    res.json({ success: true, data: pages });
  } catch (err) {
    console.error('[SEO] getPublicPages error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch public SEO metadata.' });
  }
};

module.exports = { getPages, getPage, updatePage, getSitemap, getRobots, getPublicPages };
