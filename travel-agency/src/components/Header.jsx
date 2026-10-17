import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Car, User, LogOut, ChevronDown, UserCheck, Menu, X, Phone } from 'lucide-react';
import { CustomerAuthModal } from './CustomerAuthModal';

export const Header = ({ isDark = false, onOpenEnquiry }) => {
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('customerUser');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const userMenuRef = useRef(null);

  // Dynamic scroll elevation listener
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close user dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('customerToken');
    localStorage.removeItem('customerUser');
    setCurrentUser(null);
    setIsUserMenuOpen(false);
  };

  const openAuthModal = (mode = 'login') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
    setIsMobileMenuOpen(false);
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    if (path === '/about') return location.pathname === '/about' || location.pathname === '/about-us';
    if (path === '/booking') return location.pathname === '/booking' || location.pathname === '/book';
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <header className={`header ${isScrolled ? 'scrolled' : ''}`}>
      {/* Single Cohesive, Horizontally Aligned Navbar Capsule */}
      <div className="header-capsule">
        {/* Section 1: Logo & Brand */}
        <Link
          to="/"
          className="header-brand"
          aria-label="AJ Travels Home"
          onClick={(e) => {
            if (location.pathname === '/') {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
        >
          <img
            src="/assets/aj-travels-logo.png"
            alt="AJ Travels - Pune's Trusted Vehicle Rental Agency"
            className="brand-logo-img"
          />
        </Link>

        {/* Section 2: Desktop Navigation Links */}
        <nav className="header-nav" aria-label="Main Navigation">
          <Link
            to="/"
            className={`header-nav-link ${isActive('/') ? 'active' : ''}`}
            onClick={(e) => {
              if (location.pathname === '/') {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
          >
            Home
          </Link>
          <Link
            to="/about"
            className={`header-nav-link ${isActive('/about') ? 'active' : ''}`}
          >
            About Us
          </Link>
          <Link
            to="/services"
            className={`header-nav-link ${isActive('/services') ? 'active' : ''}`}
          >
            Services
          </Link>
          <Link
            to="/vehicles"
            className={`header-nav-link ${isActive('/vehicles') ? 'active' : ''}`}
          >
            Fleet
          </Link>
          <Link
            to="/blog"
            className={`header-nav-link ${isActive('/blog') ? 'active' : ''}`}
          >
            Blog
          </Link>
          <Link
            to="/contact"
            className={`header-nav-link ${isActive('/contact') ? 'active' : ''}`}
          >
            Contact
          </Link>
          <Link
            to="/fare"
            className={`header-nav-link ${isActive('/fare') ? 'active' : ''}`}
          >
            Fare Calculator
          </Link>
          <Link
            to="/booking"
            className={`header-nav-link ${isActive('/booking') ? 'active' : ''}`}
          >
            Book Cab
          </Link>
        </nav>

        {/* Section 3: Action Controls (Phone & Login) */}
        <div className="header-actions">
          <a
            href="tel:+919156183915"
            className="header-phone-chip"
            title="Call AJ Travels 24/7 Support Desk"
          >
            <Phone size={13} className="phone-icon" />
            <span className="phone-text">+91 7447443536</span>
          </a>

          {currentUser ? (
            <div className="user-profile-menu" ref={userMenuRef}>
              <button
                className="user-pill-btn"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                aria-expanded={isUserMenuOpen}
                aria-label="User Account Menu"
              >
                <div className="user-avatar">
                  <UserCheck size={14} />
                </div>
                <span className="user-name">
                  {currentUser.name || currentUser.email?.split('@')[0] || 'Account'}
                </span>
                <ChevronDown size={13} className={`chevron-icon ${isUserMenuOpen ? 'open' : ''}`} />
              </button>

              {/* User Dropdown */}
              {isUserMenuOpen && (
                <div className="user-dropdown-card">
                  <div className="dropdown-user-info">
                    <div className="user-full-name">{currentUser.name || 'Valued Customer'}</div>
                    <div className="user-email-text">{currentUser.email}</div>
                    {currentUser.phone && (
                      <div className="user-phone-text">📱 {currentUser.phone}</div>
                    )}
                  </div>
                  <div className="dropdown-divider" />
                  <button className="dropdown-item logout-item" onClick={handleLogout}>
                    <LogOut size={15} />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => openAuthModal('login')}
              className="btn-action btn-login"
              aria-label="Customer Login"
            >
              <User size={15} />
              <span>Login</span>
            </button>
          )}

          {/* Mobile Menu Hamburger Toggle */}
          <button
            className="mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? "Close Navigation Menu" : "Open Navigation Menu"}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Nav Drawer */}
      {isMobileMenuOpen && (
        <div className="mobile-nav-drawer" role="navigation" aria-label="Mobile Navigation">
          <div className="mobile-nav-links">
            <Link
              to="/"
              className={`mobile-nav-link ${isActive('/') ? 'active' : ''}`}
              onClick={(e) => {
                setIsMobileMenuOpen(false);
                if (location.pathname === '/') {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
            >
              Home
            </Link>
            <Link
              to="/about"
              className={`mobile-nav-link ${isActive('/about') ? 'active' : ''}`}
            >
              About Us
            </Link>
            <Link
              to="/services"
              className={`mobile-nav-link ${isActive('/services') ? 'active' : ''}`}
            >
              Our Services
            </Link>
            <Link
              to="/vehicles"
              className={`mobile-nav-link ${isActive('/vehicles') ? 'active' : ''}`}
            >
              Fleet & Vehicles
            </Link>
            <Link
              to="/blog"
              className={`mobile-nav-link ${isActive('/blog') ? 'active' : ''}`}
            >
              Blog & Travel Guides
            </Link>
            <Link
              to="/contact"
              className={`mobile-nav-link ${isActive('/contact') ? 'active' : ''}`}
            >
              Contact Support
            </Link>
            <Link
              to="/fare"
              className={`mobile-nav-link ${isActive('/fare') ? 'active' : ''}`}
            >
              Fare Calculator
            </Link>
            <Link
              to="/booking"
              className={`mobile-nav-link ${isActive('/booking') ? 'active' : ''}`}
            >
              Book Cab Online
            </Link>
            <a
              href="tel:+919156183915"
              className="mobile-nav-link phone-link"
            >
              <Phone size={15} />
              <span>Call: +91 91561 83915</span>
            </a>
          </div>
        </div>
      )}

      {/* Customer Auth Modal */}
      <CustomerAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authMode}
        onAuthSuccess={(user) => setCurrentUser(user)}
      />

      <style>{`
        /* ==========================================================================
           TRANSPARENT FLOATING GLASS CAPSULE NAVBAR (CakeStory Style Reference)
           Translucent Dark Glassmorphic Pill Floating Over Scenic Background
           ========================================================================== */

        @keyframes navSlideDown {
          0% {
            opacity: 0;
            transform: translateY(-12px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .header {
          position: sticky;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          padding: 0.85rem 1.25rem 0.5rem;
          background: transparent;
          border: none;
          box-shadow: none;
          margin-bottom: -82px;
          pointer-events: none;
          animation: navSlideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          transition: padding 0.25s ease, margin 0.25s ease;
        }

        .header.scrolled {
          padding: 0.55rem 1.25rem;
        }

        /* ── Floating Translucent Dark Glass Capsule (CakeStory Style) ── */
        .header-capsule {
          pointer-events: auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          max-width: 1380px;
          margin: 0 auto;
          background: rgba(15, 23, 42, 0.76);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: 9999px;
          padding: 0.35rem 0.65rem 0.35rem 0.85rem;
          height: 60px;
          gap: 0.5rem;
          box-shadow: 0 16px 36px -4px rgba(0, 0, 0, 0.45), 0 4px 12px rgba(0, 0, 0, 0.25);
          transition: all 0.25s ease;
        }

        .header-capsule:hover {
          border-color: rgba(255, 255, 255, 0.25);
          box-shadow: 0 20px 42px -4px rgba(0, 0, 0, 0.55), 0 6px 16px rgba(0, 0, 0, 0.3);
        }

        .header.scrolled .header-capsule {
          background: rgba(15, 23, 42, 0.88);
          border-color: rgba(255, 255, 255, 0.22);
          box-shadow: 0 20px 40px -4px rgba(0, 0, 0, 0.5), 0 6px 16px rgba(0, 0, 0, 0.25);
        }

        /* ── Section 1: Logo & Brand Badge ── */
        .header-brand {
          display: flex;
          align-items: center;
          text-decoration: none;
          flex-shrink: 0;
        }

        .brand-logo-badge {
          background: #FFFFFF;
          padding: 0.32rem 0.85rem;
          border-radius: 9999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
          height: 40px;
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease;
        }

        .brand-logo-badge:hover {
          transform: scale(1.02);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
        }

        .brand-logo-img {
          height: 26px;
          width: auto;
          max-width: 160px;
          object-fit: contain;
          display: block;
        }

        /* ── Section 2: Desktop Navigation Links ── */
        .header-nav {
          display: flex;
          align-items: center;
          gap: 0.15rem;
          background: transparent;
          padding: 0;
          border: none;
          box-shadow: none;
        }

        .header-nav-link {
          font-family: var(--font-body, 'Inter', sans-serif);
          font-weight: 550;
          font-size: 0.82rem;
          text-decoration: none;
          color: rgba(255, 255, 255, 0.82);
          padding: 0.42rem 0.75rem;
          border-radius: 9999px;
          white-space: nowrap;
          border: 1px solid transparent;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .header-nav-link:hover {
          color: #FFFFFF;
          background: rgba(255, 255, 255, 0.10);
          transform: translateY(-1px);
        }

        .header-nav-link.active {
          color: #FFFFFF;
          background: rgba(255, 255, 255, 0.16);
          border: 1px solid rgba(255, 255, 255, 0.25);
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.25);
          font-weight: 700;
          transform: translateY(-1px);
        }

        /* ── Section 3: Action Controls (Phone & Login) ── */
        .header-actions {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          flex-shrink: 0;
        }

        .header-phone-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          font-family: var(--font-body, 'Inter', sans-serif);
          font-size: 0.78rem;
          font-weight: 700;
          color: #FFFFFF;
          text-decoration: none;
          padding: 0 0.95rem;
          height: 38px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 9999px;
          border: 1px solid rgba(255, 255, 255, 0.18);
          white-space: nowrap;
          transition: all 0.2s ease;
        }

        .header-phone-chip:hover {
          background: rgba(255, 255, 255, 0.16);
          border-color: rgba(255, 255, 255, 0.35);
          color: #FFFFFF;
          transform: translateY(-1px);
        }

        .phone-icon {
          color: #38BDF8;
        }

        .btn-action {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-family: var(--font-heading, 'Outfit', sans-serif);
          font-weight: 700;
          font-size: 0.82rem;
          padding: 0 1.25rem;
          height: 38px;
          border-radius: 9999px;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: pointer;
          text-decoration: none;
          border: none;
          white-space: nowrap;
        }

        .btn-login {
          background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
          color: #FFFFFF !important;
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);
        }

        .btn-login:hover {
          background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(37, 99, 235, 0.55);
        }

        /* User Profile Pill & Dropdown */
        .user-profile-menu {
          position: relative;
        }

        .user-pill-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0 0.85rem 0 0.35rem;
          height: 38px;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.22);
          border-radius: 9999px;
          color: #FFFFFF;
          font-family: var(--font-heading, 'Outfit', sans-serif);
          font-weight: 700;
          font-size: 0.82rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .user-pill-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: #38BDF8;
        }

        .user-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #0284C7;
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .chevron-icon {
          color: rgba(255, 255, 255, 0.7);
          transition: transform 0.2s ease;
        }

        .chevron-icon.open {
          transform: rotate(180deg);
        }

        .user-dropdown-card {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 230px;
          background: #0F172A;
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 14px;
          padding: 1rem;
          box-shadow: 0 15px 35px -5px rgba(0, 0, 0, 0.6);
          z-index: 200;
          animation: dropdownFade 0.2s ease-out;
        }

        @keyframes dropdownFade {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .dropdown-user-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .user-full-name {
          font-family: var(--font-heading, 'Outfit', sans-serif);
          font-weight: 700;
          font-size: 0.9375rem;
          color: #FFFFFF;
        }

        .user-email-text {
          font-size: 0.775rem;
          color: #94A3B8;
          word-break: break-all;
        }

        .user-phone-text {
          font-size: 0.775rem;
          color: #38BDF8;
          margin-top: 0.2rem;
          font-weight: 600;
        }

        .dropdown-divider {
          height: 1px;
          background: rgba(255, 255, 255, 0.1);
          margin: 0.75rem 0;
        }

        .dropdown-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.5rem 0.6rem;
          border: none;
          background: transparent;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }

        .logout-item {
          color: #F87171;
        }

        .logout-item:hover {
          background: rgba(239, 68, 68, 0.15);
        }

        /* ── Mobile Hamburger Toggle ── */
        .mobile-menu-toggle {
          display: none;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #FFFFFF;
          cursor: pointer;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .mobile-menu-toggle:hover {
          background: rgba(255, 255, 255, 0.18);
          border-color: rgba(255, 255, 255, 0.35);
        }

        /* ── Mobile Drawer ── */
        .mobile-nav-drawer {
          pointer-events: auto;
          display: none;
          background: rgba(15, 23, 42, 0.95);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 20px;
          padding: 0.85rem;
          margin-top: 0.5rem;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
          animation: dropdownFade 0.2s ease-out;
          max-width: 1380px;
          margin-left: auto;
          margin-right: auto;
        }

        .mobile-nav-links {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .mobile-nav-link {
          font-family: var(--font-body, 'Inter', sans-serif);
          font-size: 0.9rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.85);
          text-decoration: none;
          padding: 0.65rem 0.85rem;
          border-radius: 10px;
          transition: all 0.18s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .mobile-nav-link:hover {
          color: #FFFFFF;
          background: rgba(255, 255, 255, 0.10);
        }

        .mobile-nav-link.active {
          color: #FFFFFF;
          background: rgba(255, 255, 255, 0.16);
          border: 1px solid rgba(255, 255, 255, 0.22);
          font-weight: 700;
        }

        .mobile-nav-link.phone-link {
          color: #38BDF8;
          background: rgba(255, 255, 255, 0.05);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          margin-top: 0.25rem;
          padding-top: 0.75rem;
          font-weight: 700;
        }

        /* ── Responsive Adaptations ── */
        @media (max-width: 1320px) {
          .header-nav-link {
            padding: 0.4rem 0.55rem;
            font-size: 0.80rem;
          }
        }

        @media (max-width: 1180px) {
          .header-nav-link {
            padding: 0.38rem 0.44rem;
            font-size: 0.77rem;
          }
          .phone-text {
            font-size: 0.75rem;
          }
        }

        @media (max-width: 1040px) {
          .header-nav {
            display: none;
          }
          .header-phone-chip .phone-text {
            display: none;
          }
          .header-phone-chip {
            padding: 0;
            width: 38px;
            height: 38px;
            justify-content: center;
          }
          .mobile-menu-toggle {
            display: flex;
          }
          .mobile-nav-drawer {
            display: block;
          }
        }

        @media (max-width: 640px) {
          .header {
            padding: 0.45rem 0.75rem;
            margin-bottom: -72px;
          }
          .header-capsule {
            height: 52px;
            padding: 0.25rem 0.35rem 0.25rem 0.65rem;
          }
          .brand-logo-badge {
            height: 34px;
            padding: 0.25rem 0.65rem;
          }
          .brand-logo-img {
            height: 20px;
          }
          .btn-login {
            height: 34px;
            padding: 0 0.85rem;
            font-size: 0.76rem;
          }
          .header-phone-chip {
            width: 34px;
            height: 34px;
          }
          .mobile-menu-toggle {
            width: 34px;
            height: 34px;
          }
        }
      `}</style>
    </header>
  );
};
