// ============================================================
// SEO Controller
// Admin: manage per-page SEO metadata, sitemap, robots.txt
// ============================================================

const fs = require('fs');
const path = require('path');
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
    seoTitle:        'AJ Travels — Trusted Vehicle Rental Service in Pune | Car Rental & Cabs',
    metaDescription: 'AJ Travels is a trusted vehicle rental service in Pune offering chauffeur-driven car rentals, intercity cabs, airport transfers, and Tempo Travellers across Maharashtra.',
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

const STATIC_CODE_PAGES = [
  {
    pageKey: 'pune-to-mumbai-taxi',
    pageLabel: 'Pune to Mumbai Taxi',
    pageUrl: '/pune-to-mumbai-taxi',
    canonicalUrl: `${SITE_DOMAIN}/pune-to-mumbai-taxi/`,
    seoTitle: 'Pune to Mumbai Taxi Service | Best Intercity Cab Rates - AJ Travels',
    metaDescription: 'Hire direct doorstep taxi service from Pune to Mumbai. Verified professional chauffeurs, Expressway tolls covered, clean AC sedans, SUVs & Innova Crysta.',
    isIndexable: true,
    indexingDirective: 'index, follow',
    sitemapInclusion: 'Included (Priority 0.8)',
    metadataCompleteness: 'Complete (Title, Desc, Canonical, OG)',
    metadataSource: 'STATIC_CODE',
    isDbEditable: false,
  },
  {
    pageKey: 'mumbai-to-pune-taxi',
    pageLabel: 'Mumbai to Pune Taxi',
    pageUrl: '/mumbai-to-pune-taxi',
    canonicalUrl: `${SITE_DOMAIN}/mumbai-to-pune-taxi/`,
    seoTitle: 'Mumbai to Pune Taxi Service | Airport & City Drop Cabs - AJ Travels',
    metaDescription: 'Direct taxi service from Mumbai to Pune. Airport pickup from BOM T1 & T2, BKC, and Western Suburbs. Fixed transparent rates with all tolls included.',
    isIndexable: true,
    indexingDirective: 'index, follow',
    sitemapInclusion: 'Included (Priority 0.8)',
    metadataCompleteness: 'Complete (Title, Desc, Canonical, OG)',
    metadataSource: 'STATIC_CODE',
    isDbEditable: false,
  },
  {
    pageKey: 'privacy-policy',
    pageLabel: 'Privacy Policy',
    pageUrl: '/privacy-policy',
    canonicalUrl: `${SITE_DOMAIN}/privacy-policy/`,
    seoTitle: 'Privacy Policy | AJ Travels Pune Vehicle Rental Agency',
    metaDescription: 'Read the privacy policy of AJ Travels Pune. Information on passenger privacy, OTP phone verification security, and customer data protection standards.',
    isIndexable: true,
    indexingDirective: 'index, follow',
    sitemapInclusion: 'Included (Priority 0.5)',
    metadataCompleteness: 'Complete (Title, Desc, Canonical, OG)',
    metadataSource: 'STATIC_CODE',
    isDbEditable: false,
  },
  {
    pageKey: 'terms',
    pageLabel: 'Terms & Conditions',
    pageUrl: '/terms',
    canonicalUrl: `${SITE_DOMAIN}/terms/`,
    seoTitle: 'Terms & Conditions | Booking Policies - AJ Travels',
    metaDescription: 'Terms of service and booking conditions for AJ Travels Pune. Details on transparent all-inclusive toll pricing, cancellation terms, and chauffeur standards.',
    isIndexable: true,
    indexingDirective: 'index, follow',
    sitemapInclusion: 'Included (Priority 0.5)',
    metadataCompleteness: 'Complete (Title, Desc, Canonical, OG)',
    metadataSource: 'STATIC_CODE',
    isDbEditable: false,
  },
  {
    pageKey: 'about',
    pageLabel: 'About Us',
    pageUrl: '/about',
    canonicalUrl: `${SITE_DOMAIN}/about-us/`,
    seoTitle: 'About AJ Tours & Travels | Pune Mumbai Cab Specialists',
    metaDescription: 'Learn about AJ Tours & Travels, Pune premier intercity travel agency. Verified chauffeurs, sanitized fleet, transparent pricing.',
    isIndexable: true,
    indexingDirective: 'index, follow',
    sitemapInclusion: 'Included (Priority 0.7)',
    metadataCompleteness: 'Complete (Title, Desc, Canonical, OG)',
    metadataSource: 'STATIC_CODE',
    isDbEditable: false,
  },
  {
    pageKey: 'contact',
    pageLabel: 'Contact Us',
    pageUrl: '/contact',
    canonicalUrl: `${SITE_DOMAIN}/contact-us/`,
    seoTitle: 'Contact AJ Tours & Travels | 24/7 Pune Mumbai Cab Booking',
    metaDescription: 'Get in touch with AJ Tours & Travels for Pune to Mumbai cab bookings, corporate travel, or custom itineraries. Call +91-7447443536.',
    isIndexable: true,
    indexingDirective: 'index, follow',
    sitemapInclusion: 'Included (Priority 0.7)',
    metadataCompleteness: 'Complete (Title, Desc, Canonical, OG)',
    metadataSource: 'STATIC_CODE',
    isDbEditable: false,
  },
  {
    pageKey: 'services',
    pageLabel: 'Services Directory',
    pageUrl: '/services',
    canonicalUrl: `${SITE_DOMAIN}/services/`,
    seoTitle: 'Car Rental & Cab Services in Pune & Mumbai | AJ Travels',
    metaDescription: 'Explore comprehensive cab services: Pune to Mumbai express cabs, airport pickup, outstation trips, corporate car rentals & tempo traveller hire.',
    isIndexable: true,
    indexingDirective: 'index, follow',
    sitemapInclusion: 'Included (Priority 0.7)',
    metadataCompleteness: 'Complete (Title, Desc, Canonical, OG)',
    metadataSource: 'STATIC_CODE',
    isDbEditable: false,
  },
  {
    pageKey: 'vehicles',
    pageLabel: 'Fleet & Vehicles',
    pageUrl: '/vehicles',
    canonicalUrl: `${SITE_DOMAIN}/vehicles/`,
    seoTitle: 'Vehicle Fleet & Taxi Options | Sedans, SUVs, Innova Crysta | AJ Travels',
    metaDescription: 'Browse our sanitized, air-conditioned vehicle fleet: Swift Dzire Sedans, Ertiga SUVs, Innova Crysta luxury cabs, and 13-17 seater Tempo Travellers.',
    isIndexable: true,
    indexingDirective: 'index, follow',
    sitemapInclusion: 'Included (Priority 0.7)',
    metadataCompleteness: 'Complete (Title, Desc, Canonical, OG)',
    metadataSource: 'STATIC_CODE',
    isDbEditable: false,
  },
  {
    pageKey: 'blog',
    pageLabel: 'Travel Blog & Guides',
    pageUrl: '/blog',
    canonicalUrl: `${SITE_DOMAIN}/blog/`,
    seoTitle: 'Maharashtra Travel Blog & Expressway Route Guides | AJ Travels',
    metaDescription: 'Expert travel guides, expressway route advice, weekend getaways, and Maharashtra tourism tips from local chauffeurs and travel planners.',
    isIndexable: true,
    indexingDirective: 'index, follow',
    sitemapInclusion: 'Included (Priority 0.7)',
    metadataCompleteness: 'Complete (Title, Desc, Canonical, OG)',
    metadataSource: 'STATIC_CODE',
    isDbEditable: false,
  },
  {
    pageKey: 'sitemap-page',
    pageLabel: 'HTML Sitemap',
    pageUrl: '/sitemap',
    canonicalUrl: `${SITE_DOMAIN}/sitemap`,
    seoTitle: 'Website Sitemap | Index of Pages & Corridors | AJ Travels',
    metaDescription: 'Complete HTML sitemap of AJ Travels Pune: intercity corridors, airport transfers, vehicle rentals, and destination guides.',
    isIndexable: true,
    indexingDirective: 'index, follow',
    sitemapInclusion: 'Included (Priority 0.5)',
    metadataCompleteness: 'Complete (Title, Desc, Canonical)',
    metadataSource: 'STATIC_CODE',
    isDbEditable: false,
  },
  {
    pageKey: 'vehicles-sedan',
    pageLabel: 'Fleet: Executive Sedan',
    pageUrl: '/vehicles/sedan',
    canonicalUrl: `${SITE_DOMAIN}/vehicles/sedan`,
    seoTitle: 'Sedan Cab Rental Pune to Mumbai | Swift Dzire & Etios - AJ Travels',
    metaDescription: 'Book reliable 4-passenger AC sedan cabs for Pune to Mumbai and Mumbai to Pune. Fuel efficient, comfortable, with verified drivers.',
    isIndexable: true,
    indexingDirective: 'index, follow',
    sitemapInclusion: 'Included (Priority 0.7)',
    metadataCompleteness: 'Complete (Title, Desc, Canonical, OG)',
    metadataSource: 'STATIC_CODE',
    isDbEditable: false,
  },
  {
    pageKey: 'vehicles-suv',
    pageLabel: 'Fleet: Ertiga SUV',
    pageUrl: '/vehicles/ertiga-suv',
    canonicalUrl: `${SITE_DOMAIN}/vehicles/ertiga-suv`,
    seoTitle: 'Ertiga SUV Cab Rental Pune to Mumbai | 6 Seater - AJ Travels',
    metaDescription: 'Spacious 6-passenger Ertiga SUV for family travel between Pune and Mumbai. Generous luggage space and smooth highway ride.',
    isIndexable: true,
    indexingDirective: 'index, follow',
    sitemapInclusion: 'Included (Priority 0.7)',
    metadataCompleteness: 'Complete (Title, Desc, Canonical, OG)',
    metadataSource: 'STATIC_CODE',
    isDbEditable: false,
  },
  {
    pageKey: 'vehicles-innova-crysta',
    pageLabel: 'Fleet: Innova Crysta',
    pageUrl: '/vehicles/innova-crysta',
    canonicalUrl: `${SITE_DOMAIN}/vehicles/innova-crysta`,
    seoTitle: 'Innova Crysta Rental Pune to Mumbai | Luxury Travel - AJ Travels',
    metaDescription: 'Premium Toyota Innova Crysta cab rental for executive and VIP intercity travel with reclining captain seats and superior suspension.',
    isIndexable: true,
    indexingDirective: 'index, follow',
    sitemapInclusion: 'Included (Priority 0.7)',
    metadataCompleteness: 'Complete (Title, Desc, Canonical, OG)',
    metadataSource: 'STATIC_CODE',
    isDbEditable: false,
  },
  {
    pageKey: 'vehicles-tempo-traveller',
    pageLabel: 'Fleet: Tempo Traveller',
    pageUrl: '/vehicles/tempo-traveller',
    canonicalUrl: `${SITE_DOMAIN}/vehicles/tempo-traveller`,
    seoTitle: 'Tempo Traveller on Rent in Pune | 13-17 Seater - AJ Travels',
    metaDescription: 'Hire 13 to 17-seater Tempo Travellers in Pune for group tours, corporate outings, and family weddings with pushback seats.',
    isIndexable: true,
    indexingDirective: 'index, follow',
    sitemapInclusion: 'Included (Priority 0.7)',
    metadataCompleteness: 'Complete (Title, Desc, Canonical, OG)',
    metadataSource: 'STATIC_CODE',
    isDbEditable: false,
  },
];

let cachedDbBlogs = null;
let cachedDbPages = null;

function getAllPublicPagesCatalog(dbPages = null, dbBlogs = null) {
  const pagesToUse = dbPages !== null ? dbPages : (cachedDbPages || []);
  const blogsToUse = dbBlogs !== null ? dbBlogs : (cachedDbBlogs || []);

  const dbMap = new Map();
  for (const p of pagesToUse) {
    dbMap.set(p.pageKey, p);
  }

  const seenCanonicals = new Set();
  const seenPageKeys = new Set();

  // 1. Core pages (3)
  const coreList = PUBLIC_PAGES.map(p => {
    const override = dbMap.get(p.pageKey);
    const canonical = override?.canonicalUrl || (p.pageUrl === '/' ? `${SITE_DOMAIN}/` : `${SITE_DOMAIN}${p.pageUrl}`);
    seenCanonicals.add(canonical);
    seenPageKeys.add(p.pageKey);
    const isIndex = override ? (override.isIndexable ?? true) : true;
    return {
      pageKey: p.pageKey,
      pageLabel: p.pageLabel,
      pageUrl: p.pageUrl,
      canonicalUrl: canonical,
      seoTitle: override?.seoTitle || p.seoTitle,
      metaDescription: override?.metaDescription || p.metaDescription,
      isIndexable: isIndex,
      indexingDirective: isIndex ? 'index, follow' : 'noindex, nofollow',
      sitemapInclusion: p.pageUrl === '/' ? 'Included (Priority 1.0)' : 'Included (Priority 0.8)',
      metadataCompleteness: 'Complete (Title, Desc, Canonical, OG)',
      metadataSource: override ? 'DATABASE_OVERRIDE' : 'CORE_SPA',
      isDbEditable: true,
      category: 'Core',
    };
  });

  // 2. Static Code Pages (14)
  const staticList = STATIC_CODE_PAGES.map(p => {
    const override = dbMap.get(p.pageKey);
    const canonical = override?.canonicalUrl || p.canonicalUrl;
    seenCanonicals.add(canonical);
    seenPageKeys.add(p.pageKey);
    const isIndex = override ? (override.isIndexable ?? true) : p.isIndexable;
    let cat = 'Static / Legal';
    if (p.pageUrl.includes('/vehicles')) cat = 'Fleet';
    else if (p.pageUrl.includes('taxi') || p.pageUrl.includes('cab')) cat = 'Routes';
    else if (p.pageUrl === '/blog') cat = 'Blog';

    return {
      ...p,
      seoTitle: override?.seoTitle || p.seoTitle,
      metaDescription: override?.metaDescription || p.metaDescription,
      canonicalUrl: canonical,
      isIndexable: isIndex,
      indexingDirective: isIndex ? 'index, follow' : 'noindex, nofollow',
      metadataSource: override ? 'DATABASE_OVERRIDE' : 'STATIC_CODE',
      isDbEditable: true,
      category: cat,
    };
  });

  // 3. Database Blog Articles (Dynamic from PostgreSQL)
  const blogList = [];
  for (const b of blogsToUse) {
    const canonical = b.canonicalUrl || `${SITE_DOMAIN}/${b.slug}/`;
    if (seenCanonicals.has(canonical) || seenPageKeys.has(b.slug)) continue;
    seenCanonicals.add(canonical);
    seenPageKeys.add(b.slug);

    const override = dbMap.get(b.slug);
    const title = override?.seoTitle || b.metaTitle || b.title;
    const desc = override?.metaDescription || b.metaDesc || b.excerpt || '';
    const isIndex = override ? (override.isIndexable ?? true) : b.isPublished;

    blogList.push({
      pageKey: b.slug,
      pageLabel: b.title ? (b.title.length > 50 ? b.title.slice(0, 50) + '...' : b.title) : b.slug,
      pageUrl: `/${b.slug}/`,
      canonicalUrl: override?.canonicalUrl || canonical,
      seoTitle: title,
      metaDescription: desc,
      isIndexable: isIndex,
      indexingDirective: isIndex ? 'index, follow' : 'noindex, nofollow',
      sitemapInclusion: 'Included (Priority 0.7)',
      metadataCompleteness: (title && desc) ? 'Complete (Title, Desc, Canonical)' : (!desc ? 'Missing Description' : 'Missing Title'),
      metadataSource: override ? 'DATABASE_OVERRIDE' : 'DATABASE_BLOG',
      isDbEditable: true,
      category: 'Blog',
    });
  }

  // 4. Migrated Landing Pages & Corridors (120 remaining)
  const contentStoreList = [];
  for (const [slug, entry] of Object.entries(migratedPagesMap)) {
    if (!entry || !entry.canonical) continue;
    if (seenCanonicals.has(entry.canonical) || seenPageKeys.has(slug)) continue;
    seenCanonicals.add(entry.canonical);
    seenPageKeys.add(slug);

    let cleanLabel = entry.title ? entry.title.split('|')[0].split('-')[0].trim() : slug;
    if (cleanLabel.length > 50) cleanLabel = cleanLabel.slice(0, 50) + '...';

    const override = dbMap.get(slug);
    const title = override?.seoTitle || entry.title || `${cleanLabel} | AJ Travels`;
    const desc = override?.metaDescription || entry.description || 'Reliable chauffeured intercity and rental service across Maharashtra.';
    const isIndex = override ? (override.isIndexable ?? true) : true;

    let cat = 'Corridors / Routes';
    if (slug.includes('airport')) cat = 'Airport Transfer';
    else if (slug.includes('pune') || slug.includes('mumbai')) cat = 'Corridors / Routes';
    else cat = 'Local Area';

    contentStoreList.push({
      pageKey: slug,
      pageLabel: cleanLabel,
      pageUrl: `/${slug}/`,
      canonicalUrl: override?.canonicalUrl || entry.canonical,
      seoTitle: title,
      metaDescription: desc,
      isIndexable: isIndex,
      indexingDirective: isIndex ? 'index, follow' : 'noindex, nofollow',
      sitemapInclusion: 'Included (Priority 0.7)',
      metadataCompleteness: (title && desc) ? 'Complete (Title, Desc, Canonical)' : 'Missing Details',
      metadataSource: override ? 'DATABASE_OVERRIDE' : 'GENERATED_CONTENT_STORE',
      isDbEditable: true,
      category: cat,
    });
  }

  return [...coreList, ...staticList, ...blogList, ...contentStoreList];
}

// ---------------------------------------------------------------------------
// Ensure all known pages exist in DB (idempotent seed on first access)
// ---------------------------------------------------------------------------
let isSeeded = false;
let pagesCache = null;
let pagesCacheTime = 0;
const PAGES_CACHE_TTL = 60000; // 60s TTL

async function seedPages() {
  if (isSeeded) return;
  try {
    const existing = await prisma.seoMeta.findMany({ select: { pageKey: true } });
    const existingKeys = new Set(existing.map(p => p.pageKey));
    const missingPages = PUBLIC_PAGES.filter(p => !existingKeys.has(p.pageKey));
    if (missingPages.length === 0) {
      isSeeded = true;
      return;
    }
    for (const page of missingPages) {
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
    isSeeded = true;
  } catch (err) {
    console.warn('[SEO] seedPages non-fatal warning:', err.message);
  }
}

// ---------------------------------------------------------------------------
// GET /api/admin/seo/pages  — list all pages with SEO status
// ---------------------------------------------------------------------------
const getPages = async (req, res) => {
  try {
    if (pagesCache && (Date.now() - pagesCacheTime < PAGES_CACHE_TTL)) {
      return res.json({
        success: true,
        data: pagesCache,
      });
    }

    await seedPages();
    let dbPages = [];
    try {
      dbPages = await prisma.seoMeta.findMany({ orderBy: { pageKey: 'asc' } });
      cachedDbPages = dbPages;
    } catch (dbErr) {
      console.warn('[SEO] DB query fallback:', dbErr.message);
    }

    let dbBlogs = [];
    try {
      dbBlogs = await prisma.blogPost.findMany({ where: { isPublished: true }, orderBy: { createdAt: 'desc' } });
      cachedDbBlogs = dbBlogs;
    } catch (bErr) {
      console.warn('[SEO] Failed to fetch dbBlogs:', bErr.message);
    }

    const unifiedCatalog = getAllPublicPagesCatalog(dbPages, dbBlogs);

    const missingTitle = unifiedCatalog.filter(p => !p.seoTitle).length;
    const missingDesc  = unifiedCatalog.filter(p => !p.metaDescription).length;
    const indexableCount = unifiedCatalog.filter(p => p.isIndexable).length;

    const routeInventory = unifiedCatalog.map(p => ({
      path: p.pageUrl,
      label: p.pageLabel,
      type: p.category || (p.pageUrl === '/' ? 'CORE_PAGE' : 'PUBLIC_PAGE'),
      isPublic: true,
      hasContent: true,
      indexingStatus: p.isIndexable ? 'index, follow' : 'noindex, nofollow',
      sitemapStatus: p.sitemapInclusion || 'Included',
      managedPageKey: p.pageKey,
      canonicalUrl: p.canonicalUrl,
      notes: p.seoTitle || p.metaDescription || '',
    }));

    const payloadData = {
      siteDomain: SITE_DOMAIN,
      pages: unifiedCatalog,
      allPublicPages: unifiedCatalog,
      stats: {
        total:        unifiedCatalog.length,
        indexable:    indexableCount,
        noindex:      unifiedCatalog.length - indexableCount,
        missingTitle,
        missingDesc,
        routesCount:  unifiedCatalog.length,
        plannedCount: PLANNED_ROUTES.length,
      },
      routeInventory,
      plannedRoutes:  PLANNED_ROUTES,
    };

    pagesCache = payloadData;
    pagesCacheTime = Date.now();

    res.json({
      success: true,
      data: payloadData,
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

    const warnings = [];
    if (seoTitle && seoTitle.length > 60) warnings.push('SEO title exceeds recommended 60 characters.');
    if (metaDescription && metaDescription.length > 160) warnings.push('Meta description exceeds recommended 160 characters.');

    const allCatalog = getAllPublicPagesCatalog(cachedDbPages, cachedDbBlogs);
    const existingEntry = allCatalog.find(p => p.pageKey === pageKey);
    const pageLabel = existingEntry?.pageLabel || pageKey;
    const pageUrl = existingEntry?.pageUrl || `/${pageKey}/`;

    const page = await prisma.seoMeta.upsert({
      where: { pageKey },
      update: {
        seoTitle:        seoTitle        ?? undefined,
        metaDescription: metaDescription ?? undefined,
        canonicalUrl:    canonicalUrl    ?? undefined,
        isIndexable:     typeof isIndexable === 'boolean' ? isIndexable : undefined,
        ogTitle:         ogTitle         ?? undefined,
        ogDescription:   ogDescription   ?? undefined,
        ogImage:         ogImage         ?? undefined,
        slug:            slug            ?? undefined,
      },
      create: {
        pageKey,
        pageLabel,
        pageUrl,
        seoTitle:        seoTitle        || null,
        metaDescription: metaDescription || null,
        canonicalUrl:    canonicalUrl    || null,
        isIndexable:     typeof isIndexable === 'boolean' ? isIndexable : true,
        ogTitle:         ogTitle         || null,
        ogDescription:   ogDescription   || null,
        ogImage:         ogImage         || null,
        slug:            slug            || null,
      },
    });

    // If this is a blog post, also update prisma.blogPost
    try {
      const blog = await prisma.blogPost.findUnique({ where: { slug: pageKey } });
      if (blog) {
        await prisma.blogPost.update({
          where: { slug: pageKey },
          data: {
            metaTitle: seoTitle !== undefined ? seoTitle : undefined,
            metaDesc: metaDescription !== undefined ? metaDescription : undefined,
            canonicalUrl: canonicalUrl !== undefined ? canonicalUrl : undefined,
          },
        });
        cachedDbBlogs = await prisma.blogPost.findMany({ where: { isPublished: true } });
      }
    } catch (bErr) {
      console.warn('[SEO] Failed to sync blog post metadata:', bErr.message);
    }

    // Also persist to migratedPagesSeo.json if this is a migrated landing page
    if (migratedPagesMap && migratedPagesMap[pageKey]) {
      if (seoTitle) migratedPagesMap[pageKey].title = seoTitle;
      if (metaDescription) migratedPagesMap[pageKey].description = metaDescription;
      try {
        const dataPath = path.join(__dirname, '../data/migratedPagesSeo.json');
        fs.writeFileSync(dataPath, JSON.stringify(migratedPagesMap, null, 2), 'utf-8');
      } catch (fErr) {
        console.warn('[SEO] Failed to update migratedPagesSeo.json file:', fErr.message);
      }
    }

    // Invalidate in-memory caches
    pagesCache = null;
    try {
      cachedDbPages = await prisma.seoMeta.findMany({ orderBy: { pageKey: 'asc' } });
    } catch (_e) {}

    try {
      const seoAnalyzerService = require('../services/seoAnalyzerService');
      if (typeof seoAnalyzerService.clearAnalysisCache === 'function') {
        seoAnalyzerService.clearAnalysisCache(pageKey);
      }
    } catch (_e) {}

    res.json({ success: true, data: page, warnings });
  } catch (err) {
    console.error('[SEO] updatePage error:', err);
    res.status(500).json({ success: false, message: 'Failed to update SEO page.' });
  }
};

const calculateOptimalMetadata = (pageKey, pageUrl, pageLabel, rawTitle, rawDesc) => {
  let optTitle;
  if (pageUrl === '/' || pageKey === 'home') {
    optTitle = 'AJ Travels — Car Rental & Cab Service in Pune';
  } else {
    let base = rawTitle || pageLabel || pageKey;
    base = base.replace(/\s*\|\s*(Best Intercity Cab Rates|Airport & City Drop Cabs|Best Cab Service & Fares|Luxury AC Mini Bus|Affordable Rates|B2B Fleet Solutions|Taxi Fares|Tempo Traveller Hire|SUV & Crysta Hire|BOM Airport & City Taxi|Tempo Traveller|Sedan Car Rental|6-Seater SUV|Luxury SUV Cab|13, 17, 20 Seater Luxury AC|Executive Fleet|BOM & PNQ Transfers)[\s\S]*/i, '');
    base = base.replace(/\s*-\s*AJ Travels[\s\S]*/i, '');
    base = base.replace(/\s*\|\s*AJ Travels[\s\S]*/i, '');
    base = base.replace(/\s*\|\s*AJ Travels Pune[\s\S]*/i, '');
    base = base.replace(/[\s,:|-]+$/, '').trim();

    if (base.length + 13 < 40) {
      if (base.length + 18 >= 40 && base.length + 18 <= 60) {
        optTitle = `${base} | AJ Travels Pune`;
      } else {
        const withCab = `${base} — Cab Service | AJ Travels`;
        if (withCab.length >= 40 && withCab.length <= 60) {
          optTitle = withCab;
        } else {
          optTitle = `${base} — Car Rental & Cabs | AJ Travels`;
        }
      }
    } else {
      const maxBaseLen = 45;
      if (base.length > maxBaseLen) {
        const trimmed = base.substring(0, maxBaseLen);
        const lastSpace = trimmed.lastIndexOf(' ');
        base = lastSpace > 22 ? trimmed.substring(0, lastSpace) : trimmed;
      }
      base = base.replace(/[\s,:|-]+$/, '').trim();
      optTitle = `${base} | AJ Travels`;
    }
  }

  let optDesc = rawDesc || '';
  if (pageUrl === '/' || pageKey === 'home') {
    optDesc = 'AJ Travels offers reliable car rentals, Pune to Mumbai cabs, and airport transfers with verified chauffeurs. Zero advance deposit required.';
  } else {
    if (optDesc.includes('all-inclusive pricing with expressway tolls covered, and 24/7 doorstep pickup.')) {
      optDesc = optDesc.replace('all-inclusive pricing with expressway tolls covered, and 24/7 doorstep pickup.', 'transparent fares, verified drivers, and 24/7 doorstep pickup.');
    }
    if (optDesc.includes('with AJ Travels Pune.')) {
      optDesc = optDesc.replace('with AJ Travels Pune.', 'with AJ Travels.');
    }
    if (optDesc.length > 160) {
      let trimmed = optDesc.substring(0, 155);
      const lastPeriod = trimmed.lastIndexOf('.');
      if (lastPeriod > 100) {
        optDesc = trimmed.substring(0, lastPeriod + 1);
      } else {
        const lastSpace = trimmed.lastIndexOf(' ');
        optDesc = (lastSpace > 100 ? trimmed.substring(0, lastSpace) : trimmed) + '...';
      }
    }
    if (!optDesc || optDesc.length < 90) {
      optDesc = `Book ${pageLabel || 'car rental'} with AJ Travels Pune. Clean AC cabs, verified professional drivers, and 24/7 doorstep pickup across Maharashtra.`;
    }
  }

  return { optTitle, optDesc };
};

const batchAutoFixPages = async (req, res) => {
  try {
    const allCatalog = getAllPublicPagesCatalog(cachedDbPages, cachedDbBlogs);
    let updatedCount = 0;
    const dataPath = path.join(__dirname, '../data/migratedPagesSeo.json');

    for (const page of allCatalog) {
      const { pageKey, pageUrl, pageLabel, seoTitle, metaDescription } = page;
      const tLen = seoTitle ? seoTitle.length : 0;
      const dLen = metaDescription ? metaDescription.length : 0;

      const needsTitleFix = tLen < 40 || tLen > 65;
      const needsDescFix = dLen < 90 || dLen > 160;

      if (needsTitleFix || needsDescFix) {
        const { optTitle, optDesc } = calculateOptimalMetadata(pageKey, pageUrl, pageLabel, seoTitle, metaDescription);

        await prisma.seoMeta.upsert({
          where: { pageKey },
          update: {
            seoTitle: optTitle,
            metaDescription: optDesc,
          },
          create: {
            pageKey,
            pageLabel: pageLabel || pageKey,
            pageUrl: pageUrl || `/${pageKey}/`,
            seoTitle: optTitle,
            metaDescription: optDesc,
            isIndexable: true,
          },
        });

        if (migratedPagesMap && migratedPagesMap[pageKey]) {
          migratedPagesMap[pageKey].title = optTitle;
          migratedPagesMap[pageKey].description = optDesc;
        }

        updatedCount++;
      }
    }

    try {
      fs.writeFileSync(dataPath, JSON.stringify(migratedPagesMap, null, 2), 'utf-8');
    } catch (_fErr) {}

    pagesCache = null;
    try {
      cachedDbPages = await prisma.seoMeta.findMany({ orderBy: { pageKey: 'asc' } });
    } catch (_e) {}

    try {
      const seoAnalyzerService = require('../services/seoAnalyzerService');
      if (typeof seoAnalyzerService.clearAnalysisCache === 'function') {
        seoAnalyzerService.clearAnalysisCache();
      }
    } catch (_e) {}

    res.json({ success: true, updatedCount });
  } catch (err) {
    console.error('[SEO] batchAutoFixPages error:', err);
    res.status(500).json({ success: false, message: 'Failed to batch auto-fix pages.' });
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
      let loc;
      if (p.canonicalUrl) {
        if (p.canonicalUrl.startsWith('http')) {
          try {
            const cu = new URL(p.canonicalUrl);
            loc = cu.hostname.replace(/^www\./, '') === 'ajtravelspune.com'
              ? `${domain}${cu.pathname}`
              : p.canonicalUrl;
          } catch (_) {
            loc = p.canonicalUrl;
          }
        } else {
          loc = `${domain}${p.canonicalUrl}`;
        }
      } else {
        loc = pathPart === '/' ? `${domain}/` : `${domain}${pathPart}`;
      }

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
  batchAutoFixPages,
  calculateOptimalMetadata,
  getSitemap,
  getRobots,
  getPublicPages,
  getAllPublicPagesCatalog,
  PUBLIC_PAGES,
  STATIC_CODE_PAGES,
  ROUTE_INVENTORY,
  PLANNED_ROUTES,
};
