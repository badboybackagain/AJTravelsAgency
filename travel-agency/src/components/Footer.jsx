import React from 'react';
import { Link } from 'react-router-dom';
import { Car, Phone, MessageSquare, Mail, MapPin, Shield, Calendar } from 'lucide-react';
import { businessConfig } from '../config/business.config';

export const Footer = () => {
  return (
    <footer className="footer-wrapper">
      <div className="container">
        <div className="footer-top-grid">
          {/* Brand Info */}
          <div className="footer-brand-col">
            <Link to="/" className="footer-brand" aria-label="AJ Travels Home">
              <img
                src="/assets/aj-travels-logo.png"
                alt="AJ Travels - Pune's Trusted Vehicle Rental Agency"
                className="footer-brand-logo-img"
              />
            </Link>
            <p className="footer-tagline">
              Maharashtra's premier executive intercity cab network. Clean private sedans, family SUVs, and luxury tempo travellers connecting Pune, Mumbai, and International Airports with 100% all-inclusive fares.
            </p>
            <div className="footer-dispatch-note">
              <Shield size={14} color="#38BDF8" />
              <span>{businessConfig.dispatchDisclaimer}</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-links-col">
            <h4 className="footer-col-title">Quick Links</h4>
            <ul className="footer-links-list">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/services">Our Services</Link></li>
              <li><Link to="/vehicles">Fleet & Vehicles</Link></li>
              <li><Link to="/blog">Blog & Travel Guides</Link></li>
              <li><Link to="/contact">Contact Support</Link></li>
              <li><Link to="/fare">Fare Calculator & Tolls</Link></li>
              <li><Link to="/booking">Book Cab Online</Link></li>
            </ul>
          </div>

          {/* Our Services & Corridors */}
          <div className="footer-links-col">
            <h4 className="footer-col-title">Our Corridors</h4>
            <ul className="footer-links-list">
              <li><Link to="/services/pune-to-mumbai-cab">Pune to Mumbai Cab</Link></li>
              <li><Link to="/services/mumbai-to-pune-cab">Mumbai to Pune Cab</Link></li>
              <li><Link to="/services/airport-transfers">Airport Transfers (BOM / PNQ)</Link></li>
              <li><Link to="/services/outstation-cabs">Outstation Travel</Link></li>
              <li><Link to="/services/corporate-car-rental">Corporate Car Rental</Link></li>
              <li><Link to="/vehicles/tempo-traveller">Group Tempo Travellers</Link></li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="footer-contact-col">
            <h4 className="footer-col-title">Contact Information</h4>
            <div className="footer-contact-info">
              {businessConfig.phone ? (
                <p>
                  <Phone size={14} color="#38BDF8" /> <span>Phone: <a href={`tel:${businessConfig.phone}`}>{businessConfig.phoneDisplay}</a></span>
                </p>
              ) : (
                <p>
                  <Calendar size={14} color="#38BDF8" /> <span>Online Desk: <Link to="/booking" style={{ color: '#38BDF8' }}>Instant Booking</Link></span>
                </p>
              )}
              <p>
                <MessageSquare size={14} color="#25D366" /> <span>WhatsApp: <a href={`https://wa.me/${businessConfig.whatsapp}`} target="_blank" rel="noreferrer">24/7 Operations Desk</a></span>
              </p>
              <p>
                <Mail size={14} color="#38BDF8" /> <span>Email: <a href={`mailto:${businessConfig.email}`}>{businessConfig.email}</a></span>
              </p>
              <p>
                <MapPin size={14} color="#38BDF8" /> <span>Hub: {businessConfig.address}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} {businessConfig.businessName}. All rights reserved.</p>
          <div className="legal-links">
            <Link to="/">Home</Link>
            <span>•</span>
            <Link to="/about">About Us</Link>
            <span>•</span>
            <Link to="/services">Services</Link>
            <span>•</span>
            <Link to="/vehicles">Fleet</Link>
            <span>•</span>
            <Link to="/blog">Blog</Link>
            <span>•</span>
            <Link to="/contact">Contact</Link>
            <span>•</span>
            <Link to="/fare">Fare Calculator</Link>
            <span>•</span>
            <Link to="/booking">Online Booking</Link>
          </div>
        </div>
      </div>

      <style>{`
        .footer-wrapper {
          position: relative;
          background: linear-gradient(180deg, rgba(8, 14, 28, 0.86) 0%, rgba(11, 22, 45, 0.82) 50%, rgba(6, 10, 20, 0.92) 100%),
                      url('/assets/hero-luxury-cars.jpg') center/cover no-repeat;
          border-top: 1px solid rgba(255, 255, 255, 0.12);
          padding-top: 4.5rem;
          padding-bottom: 2.5rem;
          color: #E2E8F0;
          overflow: hidden;
        }

        .footer-wrapper::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at top center, rgba(56, 189, 248, 0.08), transparent 70%);
          pointer-events: none;
        }

        .footer-top-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1.5fr;
          gap: 2.75rem;
          margin-bottom: 3.5rem;
          position: relative;
          z-index: 2;
        }

        .footer-brand {
          display: inline-block;
          margin-bottom: 1.25rem;
          text-decoration: none;
        }

        .footer-brand-logo-img {
          height: 48px;
          width: auto;
          max-width: 220px;
          object-fit: contain;
          display: block;
          filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.5));
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .footer-brand:hover .footer-brand-logo-img {
          transform: scale(1.03);
        }

        .footer-tagline {
          font-size: 0.9rem;
          line-height: 1.65;
          color: #F1F5F9;
          text-shadow: 0 1px 4px rgba(0, 0, 0, 0.85);
          margin-bottom: 1.35rem;
          max-width: 380px;
          font-weight: 450;
        }

        .footer-dispatch-note {
          display: flex;
          align-items: flex-start;
          gap: 0.55rem;
          font-size: 0.78rem;
          color: #E2E8F0;
          background: rgba(15, 23, 42, 0.7);
          padding: 0.65rem 0.95rem;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(8px);
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
        }

        .footer-col-title {
          font-family: var(--font-heading, 'Outfit', sans-serif);
          font-size: 1.05rem;
          font-weight: 700;
          color: #FFFFFF;
          text-shadow: 0 2px 6px rgba(0, 0, 0, 0.9);
          margin-bottom: 1.25rem;
          letter-spacing: 0.01em;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .footer-links-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
        }

        .footer-links-list a {
          font-size: 0.88rem;
          color: #E2E8F0;
          text-shadow: 0 1px 4px rgba(0, 0, 0, 0.85);
          font-weight: 500;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          display: inline-block;
          text-decoration: none;
        }

        .footer-links-list a:hover {
          color: #38BDF8;
          text-shadow: 0 2px 8px rgba(56, 189, 248, 0.6);
          transform: translateX(4px);
        }

        .footer-contact-info p {
          font-size: 0.88rem;
          display: flex;
          align-items: center;
          gap: 0.6rem;
          margin-bottom: 0.85rem;
          color: #F8FAFC;
          text-shadow: 0 1px 4px rgba(0, 0, 0, 0.85);
        }

        .footer-contact-info a {
          color: #FFFFFF;
          text-decoration: none;
          transition: color 0.2s ease;
          font-weight: 600;
        }

        .footer-contact-info a:hover {
          color: #38BDF8;
        }

        .footer-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 2rem;
          border-top: 1px solid rgba(255, 255, 255, 0.12);
          font-size: 0.82rem;
          color: #CBD5E1;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
          position: relative;
          z-index: 2;
        }

        .legal-links {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .legal-links a {
          color: #CBD5E1;
          transition: color 0.2s ease;
          text-decoration: none;
        }

        .legal-links a:hover {
          color: #38BDF8;
        }

        @media (max-width: 1024px) {
          .footer-top-grid {
            grid-template-columns: 1fr 1fr;
            gap: 2rem;
          }
        }

        @media (max-width: 640px) {
          .footer-top-grid {
            grid-template-columns: 1fr;
            gap: 1.75rem;
          }
          .footer-bottom {
            flex-direction: column;
            gap: 1rem;
            text-align: center;
          }
        }
      `}</style>
    </footer>
  );
};
