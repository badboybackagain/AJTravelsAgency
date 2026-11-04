import React, { lazy } from 'react';
import { useParams } from 'react-router-dom';
import { getPostBySlug } from '../data/blogData';
import { getServiceBySlug } from '../data/servicesData';
import { getVehicleBySlug } from '../data/vehiclesData';
import { getLivePage } from '../data/livePagesContent';
import { NotFoundPage } from '../pages/NotFoundPage';

// Lazy-load child resolution targets
const SitemapPage = lazy(() => import('../pages/SitemapPage').then(m => ({ default: m.SitemapPage })));
const ServiceDetailPage = lazy(() => import('../pages/ServiceDetailPage').then(m => ({ default: m.ServiceDetailPage })));
const VehicleDetailPage = lazy(() => import('../pages/VehicleDetailPage').then(m => ({ default: m.VehicleDetailPage })));
const LiveMigratedPage = lazy(() => import('../pages/LiveMigratedPage').then(m => ({ default: m.LiveMigratedPage })));
const BlogPostPage = lazy(() => import('../pages/BlogPostPage').then(m => ({ default: m.BlogPostPage })));

export function RootSlugResolver() {
  const { slug } = useParams();
  const cleanSlug = slug ? slug.replace(/^\/|\/$/g, '') : '';

  if (cleanSlug === 'sitemap') return <SitemapPage />;

  // 1. Explicit Commercial Service Landing Pages
  const service = getServiceBySlug(cleanSlug);
  if (service) return <ServiceDetailPage />;

  // 2. Explicit Vehicle Fleet Landing Pages
  const vehicle = getVehicleBySlug(cleanSlug);
  if (vehicle) return <VehicleDetailPage />;

  // 3. Commercial Migrated Locality Rentals, Fleet & Corridors (prevents blog post shadowing)
  const livePage = getLivePage(cleanSlug);
  if (livePage && livePage.category !== 'Travel Guide') {
    return <LiveMigratedPage />;
  }

  // 4. Curated Blog Articles & Travel Guides
  const post = getPostBySlug(cleanSlug);
  if (post) return <BlogPostPage isRootFallback={true} />;

  // 5. Migrated Travel Guides & Blog Articles
  if (livePage) return <LiveMigratedPage />;

  return <NotFoundPage />;
}

export default RootSlugResolver;

