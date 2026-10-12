import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Car, User, LogOut, ChevronDown, UserCheck } from 'lucide-react';
import { CustomerAuthModal } from './CustomerAuthModal';

export const Header = ({ isDark = true }) => {
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
  const userMenuRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('customerToken');
    localStorage.removeItem('customerUser');
    setCurrentUser(null);
    setIsUserMenuOpen(false);
  };

  const openAuthModal = (mode = 'login') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  return (
    <header className={`header ${isDark ? 'header-dark' : 'header-light'}`}>
      <div className="header-container container">
        {/* Brand Logo */}
        <Link to="/" className="header-brand">
          <div className="brand-icon">
            <Car size={22} color="#F3B007" />
          </div>
          <div className="brand-text">
            <span className="brand-title">PUNE ↔ MUMBAI</span>
            <span className="brand-subtitle">PRIVATE TRAVELS</span>
          </div>
        </Link>

        {/* Header Action CTAs — Only Show Login Button */}
        <div className="header-actions">
          {currentUser ? (
            <div className="user-profile-menu" ref={userMenuRef}>
              <button
                className="user-pill-btn"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                aria-expanded={isUserMenuOpen}
              >
                <div className="user-avatar">
                  <UserCheck size={16} />
                </div>
                <span className="user-name">
                  {currentUser.name || currentUser.email?.split('@')[0] || 'Account'}
                </span>
                <ChevronDown size={14} className={`chevron-icon ${isUserMenuOpen ? 'open' : ''}`} />
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
                    <LogOut size={16} />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => openAuthModal('login')}
              className="btn-action btn-login"
            >
              <User size={16} />
              <span>Login</span>
            </button>
          )}
        </div>
      </div>

      {/* Customer Auth Modal (Light / Blue Theme) */}
      <CustomerAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authMode}
        onAuthSuccess={(user) => setCurrentUser(user)}
      />

      <style>{`
        .header {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          background: transparent;
          border: none;
          box-shadow: none;
          height: 80px;
          display: flex;
          align-items: center;
        }

        .header-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
        }

        .header-brand {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          text-decoration: none;
        }

        .brand-icon {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: rgba(243, 176, 7, 0.15);
          border: 1.5px solid rgba(243, 176, 7, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(243, 176, 7, 0.15);
        }

        .brand-text {
          display: flex;
          flex-direction: column;
        }

        .header-dark .brand-title {
          font-family: 'Outfit', sans-serif;
          font-weight: 800;
          font-size: 1.15rem;
          color: #FFFFFF;
          letter-spacing: 0.02em;
          line-height: 1.1;
        }

        .header-light .brand-title {
          font-family: 'Outfit', sans-serif;
          font-weight: 800;
          font-size: 1.15rem;
          color: #0F172A;
          letter-spacing: 0.02em;
          line-height: 1.1;
        }

        .brand-subtitle {
          font-size: 0.68rem;
          font-weight: 800;
          letter-spacing: 0.14em;
          color: #F3B007;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .btn-action {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          font-family: 'Outfit', sans-serif;
          font-weight: 800;
          font-size: 0.88rem;
          padding: 0.55rem 1.35rem;
          border-radius: 9999px;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: pointer;
          text-decoration: none;
          border: none;
        }

        .btn-login {
          background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
          color: #FFFFFF !important;
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
        }

        .btn-login:hover {
          background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(37, 99, 235, 0.45);
        }

        /* User Profile Pill & Dropdown */
        .user-profile-menu {
          position: relative;
        }

        .user-pill-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.45rem 0.95rem 0.45rem 0.5rem;
          background: #FFFFFF;
          border: 1.5px solid #2563EB;
          border-radius: 9999px;
          color: #1E293B;
          font-family: 'Outfit', sans-serif;
          font-weight: 700;
          font-size: 0.88rem;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15);
        }

        .user-pill-btn:hover {
          background: #F8FAFC;
          border-color: #1D4ED8;
          box-shadow: 0 6px 16px rgba(37, 99, 235, 0.25);
        }

        .user-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .chevron-icon {
          color: #64748B;
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
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 14px;
          padding: 1rem;
          box-shadow: 0 15px 35px rgba(15, 23, 42, 0.15);
          z-index: 200;
          animation: dropdownFade 0.2s ease-out;
        }

        @keyframes dropdownFade {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .dropdown-user-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .user-full-name {
          font-family: 'Outfit', sans-serif;
          font-weight: 800;
          font-size: 0.95rem;
          color: #0F172A;
        }

        .user-email-text {
          font-size: 0.78rem;
          color: #64748B;
          word-break: break-all;
        }

        .user-phone-text {
          font-size: 0.78rem;
          color: #2563EB;
          margin-top: 0.2rem;
          font-weight: 600;
        }

        .dropdown-divider {
          height: 1px;
          background: #E2E8F0;
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
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }

        .logout-item {
          color: #DC2626;
        }

        .logout-item:hover {
          background: #FEF2F2;
        }

        @media (max-width: 640px) {
          .header {
            height: 68px;
          }
          .header-brand {
            gap: 0.5rem;
          }
          .brand-icon {
            width: 34px;
            height: 34px;
            border-radius: 9px;
          }
          .header-dark .brand-title,
          .header-light .brand-title {
            font-size: 0.92rem;
          }
          .brand-subtitle {
            font-size: 0.58rem;
            letter-spacing: 0.1em;
          }
          .btn-action {
            font-size: 0.8rem;
            padding: 0.45rem 1rem;
            gap: 0.35rem;
          }
          .user-pill-btn {
            padding: 0.35rem 0.75rem 0.35rem 0.4rem;
            font-size: 0.8rem;
          }
          .user-avatar {
            width: 24px;
            height: 24px;
          }
        }
      `}</style>
    </header>
  );
};
