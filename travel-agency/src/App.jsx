import React, { useState, useEffect } from 'react';
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
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { FarePage } from './pages/FarePage';
import { BookingPage } from './pages/BookingPage';

function MainWebsite() {
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
      <Routes>
        <Route path="/" element={<MainWebsite />} />
        <Route path="/fare" element={<FarePage />} />
        <Route path="/book" element={<BookingPage />} />
        <Route path="/booking" element={<BookingPage />} />
        <Route path="/admin/login" element={<AdminLogin onLoginSuccess={() => window.location.href = '/admin/dashboard'} />} />
        <Route path="/admin/dashboard" element={<AdminRouteWrapper />} />
        <Route path="/admin/fares" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/bookings" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

