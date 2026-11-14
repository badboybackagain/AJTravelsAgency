import React, { useState, useEffect, useLayoutEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Header } from './components/Header';
import { HeroBooking } from './components/HeroBooking';
import { TrustBar } from './components/TrustBar';
import { DestinationSpotlight } from './components/DestinationSpotlight';
import { CategoryTransportBlocks } from './components/CategoryTransportBlocks';
import { PuneToMumbaiSection } from './components/PuneToMumbaiSection';
import { MumbaiToPuneSection } from './components/MumbaiToPuneSection';
import { OneWayRoundTripSection } from './components/OneWayRoundTripSection';
import { VehicleDiscovery } from './components/VehicleDiscovery';
import { BlogSection } from './components/BlogSection';
import { FAQSection } from './components/FAQSection';
import { Footer } from './components/Footer';
import { FinalCTA } from './components/FinalCTA';
import { MobileStickyBar } from './components/MobileStickyBar';
import { EnquiryModal } from './components/EnquiryModal';
import { WhatsAppBubble } from './components/WhatsAppBubble';
import { NotFoundPage } from './pages/NotFoundPage';
import { usePageSeo } from './hooks/usePageSeo';
import { useScrollReveal } from './hooks/useScrollReveal';
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
const CustomerQuotePage = lazy(() => import('./pages/CustomerQuotePage').then(m => ({ default: m.CustomerQuotePage })));
const SitemapPage    = lazy(() => import('./pages/SitemapPage').then(m => ({ default: m.SitemapPage })));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage').then(m => ({ default: m.PrivacyPolicyPage })));
const TermsPage      = lazy(() => import('./pages/TermsPage').then(m => ({ default: m.TermsPage })));
const RootSlugResolver = lazy(() => import('./components/RootSlugResolver').then(m => ({ default: m.RootSlugResolver })));

// Minimal loading placeholder — fully transparent to avoid flash
const PageLoader = () => (
  <div style={{
    minHeight: '100vh',
    background: '#F8F7F4',
  }} />
);


function MainWebsite() {
  usePageSeo('home', homepageContent.seo.pageTitle, homepageContent.seo.metaDescription, 'https://www.ajtravelspune.com/');
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
          '@id': 'https://www.ajtravelspune.com/#agency',
          'name': 'AJ Travels',
          'alternateName': 'AJ Tours & Travels Pune',
          'url': 'https://www.ajtravelspune.com/',
          'telephone': '+917447443536',
          'email': 'ajtravelpune@gmail.com',
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
          '@id': 'https://www.ajtravelspune.com/#faq',
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

      {/* 11. Curated Travel Guides & Route Advice */}
      <div className="reveal">
        <BlogSection />
      </div>

      {/* 12. Frequently Asked Questions */}
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

  // Enforce manual scroll restoration so the browser does not carry over old scroll offsets
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  // Pre-paint scroll reset for route changes, with anchor support
  useLayoutEffect(() => {
    if (hash) {
      const targetId = hash.replace('#', '');
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
      // Retry in case target element is rendered inside a lazy-loaded component
      const timer = setTimeout(() => {
        const lateEl = document.getElementById(targetId);
        if (lateEl) {
          lateEl.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
      return () => clearTimeout(timer);
    }

    // Immediately reset window and body scroll before browser paint
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;

    // Safety check after Suspense lazy chunks or layouts resolve
    const rAF = requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    });
    return () => cancelAnimationFrame(rAF);
  }, [pathname, hash]);

  return null;
}



function GlobalAnimationObserver() {
  const { pathname } = useLocation();
  useScrollReveal([pathname]);
  return null;
}

// Automatically track SPA route changes in Google Analytics 4
function AnalyticsTracker() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    if (typeof window.gtag === 'function') {
      window.gtag('config', 'G-8NMEZNKH7V', {
        page_path: pathname + search,
        page_location: window.location.href,
        page_title: document.title,
      });
    }
  }, [pathname, search]);

  return null;
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AnalyticsTracker />
      <GlobalAnimationObserver />
      {/* Floating WhatsApp bubble — shown on all public pages, hidden on /admin/* */}
      <WhatsAppBubble />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Core Booking & Calculator SPA routes */}
          <Route path="/" element={<MainWebsite />} />
          <Route path="/fare" element={<FarePage />} />
          <Route path="/booking" element={<BookingPage />} />

          {/* Customer-Friendly HTML Sitemap */}
          <Route path="/sitemap" element={<SitemapPage />} />
          <Route path="/sitemap/" element={<SitemapPage />} />

          {/* /book → /booking canonical redirect preserving query string and state */}
          <Route path="/book" element={<BookRedirect />} />

          {/* Customer Quotation Review & Acceptance */}
          <Route path="/quote/:token" element={<CustomerQuotePage />} />

          {/* About Us & Contact Pages with Live Sitemap Aliases */}
          <Route path="/about" element={<AboutPage />} />
          <Route path="/about-us" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/contact-us" element={<ContactPage />} />

          {/* Blog & Travel Guides Architecture */}
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />

          {/* Legal Compliance & Passenger Policy Pages */}
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/terms-and-conditions" element={<TermsPage />} />

          {/* High-Intent Pune <-> Mumbai Taxi Landing Pages */}
          <Route path="/pune-to-mumbai-taxi" element={<ServiceDetailPage />} />
          <Route path="/mumbai-to-pune-taxi" element={<ServiceDetailPage />} />

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
          <Route path="/admin/fares"    element={<Navigate to="/admin/dashboard?tab=fares" replace />} />
          <Route path="/admin/bookings" element={<Navigate to="/admin/dashboard?tab=bookings" replace />} />
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

