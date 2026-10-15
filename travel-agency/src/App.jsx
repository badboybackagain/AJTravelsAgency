import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import { EnquiryModal } from './components/EnquiryModal';
import { NotFoundPage } from './pages/NotFoundPage';
import { usePageSeo } from './hooks/usePageSeo';

// Lazy-load heavy pages — keeps initial JS bundle small
const AdminLogin     = lazy(() => import('./components/admin/AdminLogin').then(m => ({ default: m.AdminLogin })));
const AdminDashboard = lazy(() => import('./components/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const FarePage       = lazy(() => import('./pages/FarePage').then(m => ({ default: m.FarePage })));
const BookingPage    = lazy(() => import('./pages/BookingPage').then(m => ({ default: m.BookingPage })));

// Minimal loading spinner — shown during lazy chunk download
const PageLoader = () => (
  <div style={{
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0f1623',
    color: '#D8AE55',
    fontSize: '1.1rem',
    fontFamily: "'Inter', sans-serif",
  }}>
    Loading…
  </div>
);


function MainWebsite() {
  usePageSeo('home', 'AJ Tours & Travels – Pune to Mumbai Cab | Best Intercity Cab Service');
  const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);

  return (
    <div className="app-container">
      {/* 1. Header (Clean Logo + Action CTAs) */}
      <Header onOpenEnquiry={() => setIsEnquiryOpen(true)} isDark={false} />

      {/* 2. Unified Hero Banner + SEO H1 + Booking Engine Card */}
      <HeroBooking onOpenEnquiry={() => setIsEnquiryOpen(true)} />

      {/* 3. Single-Row Horizontal Scrolling Trust Strip */}
      <TrustBar />

      {/* 4. Top Pune ↔ Mumbai Destinations & Interactive Spotlight Banner */}
      <DestinationSpotlight />

      {/* 6. Express Transport Categories */}
      <CategoryTransportBlocks />

      {/* 7. Pune -> Mumbai Route Section */}
      <PuneToMumbaiSection />

      {/* 8. Mumbai -> Pune Route Section */}
      <MumbaiToPuneSection />

      {/* 9. One-Way & Round Trip */}
      <OneWayRoundTripSection />

      {/* 10. Fleet Vehicle Discovery */}
      <VehicleDiscovery />

      {/* 11. Frequently Asked Questions */}
      <FAQSection />

      {/* 12. Footer */}
      <Footer />

      {/* 13. Enquiry Modal */}
      <EnquiryModal isOpen={isEnquiryOpen} onClose={() => setIsEnquiryOpen(false)} />
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

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public SPA routes */}
          <Route path="/" element={<MainWebsite />} />
          <Route path="/fare" element={<FarePage />} />
          <Route path="/booking" element={<BookingPage />} />

          {/* /book → /booking canonical redirect */}
          <Route path="/book" element={<Navigate to="/booking" replace />} />

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

