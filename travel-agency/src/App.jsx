import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import { getPostBySlug } from './data/blogData';
import { getServiceBySlug } from './data/servicesData';
import { getVehicleBySlug } from './data/vehiclesData';
import { Header } from './components/Header';
import { HeroBooking } from './components/HeroBooking';
import { TrustBar } from './components/TrustBar';
import { DestinationSpotlight } from './components/DestinationSpotlight';
import { CategoryTransportBlocks } from './components/CategoryTransportBlocks';
import { PuneToMumbaiSection } from './components/PuneToMumbaiSection';
import { MumbaiToPuneSection } from './components/MumbaiToPuneSection';
import { OneWayRoundTripSection } from './components/OneWayRoundTripSection';
import { VehicleDiscovery } from './components/VehicleDiscovery';
import { FAQSection } from './components/FAQSection';
import { Footer } from './components/Footer';
import { FinalCTA } from './components/FinalCTA';
import { MobileStickyBar } from './components/MobileStickyBar';
import { EnquiryModal } from './components/EnquiryModal';
import { NotFoundPage } from './pages/NotFoundPage';
import { usePageSeo } from './hooks/usePageSeo';
import { useScrollReveal } from './hooks/useScrollReveal';
import { getLivePage } from './data/livePagesContent';
import { homepageContent } from './data/homepageContent';

// Lazy-load heavy pages — keeps initial JS bundle small
const AdminLogin     = lazy(() => import('./components/admin/AdminLogin').then(m => ({ default: m.AdminLogin })));
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const FarePage       = lazy(() => import('./pages/FarePage').then(m => ({ default: m.FarePage })));
const BookingPage    = lazy(() => import('./pages/BookingPage').then(m => ({ default: m.BookingPage })));
const AboutPage      = lazy(() => import('./pages/AboutPage').then(m => ({ default: m.AboutPage })));
const ContactPage    = lazy(() => import('./pages/ContactPage').then(m => ({ default: m.ContactPage })));
const BlogPage       = lazy(() => import('./pages/BlogPage').then(m => ({ default: m.BlogPage })));
const BlogPostPage   = lazy(() => import('./pages/BlogPostPage').then(m => ({ default: m.BlogPostPage })));
const ServicesPage   = lazy(() => import('./pages/ServicesPage').then(m => ({ default: m.ServicesPage })));
const ServiceDetailPage = lazy(() => import('./pages/ServiceDetailPage').then(m => ({ default: m.ServiceDetailPage })));
const VehiclesPage   = lazy(() => import('./pages/VehiclesPage').then(m => ({ default: m.VehiclesPage })));
const VehicleDetailPage = lazy(() => import('./pages/VehicleDetailPage').then(m => ({ default: m.VehicleDetailPage })));
const LiveMigratedPage = lazy(() => import('./pages/LiveMigratedPage').then(m => ({ default: m.LiveMigratedPage })));

// Minimal loading placeholder — fully transparent to avoid flash
const PageLoader = () => (
  <div style={{
    minHeight: '100vh',
    background: '#F8F7F4',
  }} />
);


function MainWebsite() {
  usePageSeo('home', homepageContent.seo.pageTitle, homepageContent.seo.metaDescription);
  const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);

  useEffect(() => {
    const schemaId = 'home-page-schema';
    let scriptTag = document.getElementById(schemaId);
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = schemaId;
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }

    const schemaData = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'TravelAgency',
          '@id': 'https://ajtravelspune.com/#agency',
          'name': 'AJ Travels',
          'alternateName': 'AJ Tours & Travels Pune',
          'url': 'https://ajtravelspune.com/',
          'telephone': '+919156183915',
          'email': 'contact@ajtravelagency.in',
          'priceRange': '₹₹',
          'address': {
            '@type': 'PostalAddress',
            'streetAddress': 'Kasarwadi Hub, Old Mumbai-Pune Highway',
            'addressLocality': 'Pune',
            'addressRegion': 'Maharashtra',
            'postalCode': '411064',
            'addressCountry': 'IN'
          },
          'areaServed': [
            'Pune',
            'Mumbai',
            'Mahabaleshwar',
            'Shirdi',
            'Nashik',
            'Lonavala',
            'Goa'
          ]
        },
        {
          '@type': 'FAQPage',
          '@id': 'https://ajtravelspune.com/#faq',
          'mainEntity': homepageContent.faqs.map(faq => ({
            '@type': 'Question',
            'name': faq.q,
            'acceptedAnswer': {
              '@type': 'Answer',
              'text': faq.a
            }
          }))
        }
      ]
    };

    scriptTag.text = JSON.stringify(schemaData);

    return () => {
      const tag = document.getElementById(schemaId);
      if (tag) tag.remove();
    };
  }, []);

  return (
    <div className="app-container page-enter">
      {/* 1. Header (Clean Logo + Action CTAs) */}
      <Header onOpenEnquiry={() => setIsEnquiryOpen(true)} isDark={false} />

      {/* 2. Unified Hero Banner + SEO H1 + Booking Engine Card */}
      <HeroBooking onOpenEnquiry={() => setIsEnquiryOpen(true)} />

      {/* 3. Single-Row Horizontal Scrolling Trust Strip */}
      <div className="reveal">
        <TrustBar />
      </div>

      {/* 4. Top Pune ↔ Mumbai Destinations & Interactive Spotlight Banner */}
      <div className="reveal">
        <DestinationSpotlight />
      </div>

      {/* 6. Express Transport Categories */}
      <div className="reveal">
        <CategoryTransportBlocks />
      </div>

      {/* 7. Pune -> Mumbai Route Section */}
      <div className="reveal">
        <PuneToMumbaiSection />
      </div>

      {/* 8. Mumbai -> Pune Route Section */}
      <div className="reveal">
        <MumbaiToPuneSection />
      </div>

      {/* 9. One-Way & Round Trip */}
      <div className="reveal">
        <OneWayRoundTripSection />
      </div>

      {/* 10. Fleet Vehicle Discovery */}
      <div className="reveal">
        <VehicleDiscovery />
      </div>

      {/* 11. Frequently Asked Questions */}
      <div className="reveal">
        <FAQSection />
      </div>

      {/* 12. Final CTA — Dark Premium Section */}
      <div className="reveal">
        <FinalCTA onOpenEnquiry={() => setIsEnquiryOpen(true)} />
      </div>

      {/* 13. Footer */}
      <Footer />

      {/* 14. Enquiry Modal */}
      <EnquiryModal isOpen={isEnquiryOpen} onClose={() => setIsEnquiryOpen(false)} />

      {/* 15. Mobile Sticky Bottom Bar + Desktop Floating Concierge */}
      <MobileStickyBar onOpenEnquiry={() => setIsEnquiryOpen(true)} />
    </div>
  );
}

function AdminRouteWrapper() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('adminToken');
  });

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return <AdminDashboard onLogout={() => setIsAuthenticated(false)} />;
}

function BookRedirect() {
  const location = useLocation();
  return (
    <Navigate
      to={{ pathname: '/booking', search: location.search }}
      state={location.state}
      replace
    />
  );
}

function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const targetId = hash.replace('#', '');
      const timer = setTimeout(() => {
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 60);
      return () => clearTimeout(timer);
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, [pathname, hash]);

  return null;
}

function RootSlugResolver() {
  const { slug } = useParams();
  const cleanSlug = slug ? slug.replace(/^\/|\/$/g, '') : '';

  const livePage = getLivePage(cleanSlug);
  if (livePage) return <LiveMigratedPage />;

  const post = getPostBySlug(cleanSlug);
  const service = getServiceBySlug(cleanSlug);
  const vehicle = getVehicleBySlug(cleanSlug);

  if (post) return <BlogPostPage />;
  if (service) return <ServiceDetailPage />;
  if (vehicle) return <VehicleDetailPage />;
  return <NotFoundPage />;
}

function GlobalAnimationObserver() {
  const { pathname } = useLocation();
  useScrollReveal([pathname]);
  return null;
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <GlobalAnimationObserver />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Core Booking & Calculator SPA routes */}
          <Route path="/" element={<MainWebsite />} />
          <Route path="/fare" element={<FarePage />} />
          <Route path="/booking" element={<BookingPage />} />

          {/* /book → /booking canonical redirect preserving query string and state */}
          <Route path="/book" element={<BookRedirect />} />

          {/* About Us & Contact Pages with Live Sitemap Aliases */}
          <Route path="/about" element={<AboutPage />} />
          <Route path="/about-us" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/contact-us" element={<ContactPage />} />

          {/* Blog & Travel Guides Architecture */}
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />

          {/* Specialized Services & Corridors Architecture */}
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/services/:slug" element={<ServiceDetailPage />} />

          {/* Fleet & Vehicles Architecture */}
          <Route path="/vehicles" element={<VehiclesPage />} />
          <Route path="/vehicles/:slug" element={<VehicleDetailPage />} />

          {/* Admin routes — all lazy-loaded */}
          <Route
            path="/admin/login"
            element={
              <AdminLogin
                onLoginSuccess={() => window.location.href = '/admin/dashboard'}
              />
            }
          />
          <Route path="/admin/dashboard" element={<AdminRouteWrapper />} />
          <Route path="/admin/fares"    element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/bookings" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin"          element={<Navigate to="/admin/dashboard" replace />} />

          {/*
            Live WordPress Root Slug Fallback (e.g. /pune-to-mumbai-one-way-cab)
            Resolves existing live articles, corridors, and vehicles directly.
          */}
          <Route path="/:slug" element={<RootSlugResolver />} />

          {/*
            Unknown routes → NotFoundPage (NOT a homepage redirect).
            The backend already returns HTTP 404 for unrecognised paths;
            this component handles the user-facing 404 rendering client-side.
          */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;

