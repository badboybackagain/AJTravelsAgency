import React from 'react';
import { Car, Phone, MessageSquare, Mail, MapPin, Shield } from 'lucide-react';
import { businessConfig } from '../config/business.config';

export const Footer = () => {
  return (
    <footer className="footer-wrapper bg-dark-navy">
      <div className="container">
        <div className="footer-top-grid">
          {/* Brand Info */}
          <div className="footer-brand-col">
            <a href="#home" className="footer-brand">
              <Car size={26} color="#D8AE55" />
              <div className="brand-text">
                <span className="brand-title">PUNE ↔ MUMBAI</span>
                <span className="brand-subtitle">PRIVATE TRAVELS</span>
              </div>
            </a>
            <p className="footer-tagline">
              Premium intercity chauffeured travel between Pune and Mumbai. Clean vehicles, professional drivers, and fast doorstep pickup.
            </p>
            <div className="footer-dispatch-note">
              <Shield size={14} color="#D8AE55" />
              <span>{businessConfig.dispatchDisclaimer}</span>
            </div>
          </div>

          {/* Quick Routes */}
          <div className="footer-links-col">
            <h4 className="footer-col-title">Popular Routes</h4>
            <ul className="footer-links-list">
              <li><a href="#pune-to-mumbai">Pune to Mumbai Taxi</a></li>
              <li><a href="#mumbai-to-pune">Mumbai to Pune Taxi</a></li>
              <li><a href="#pune-mumbai-one-way">One-Way Taxi Service</a></li>
              <li><a href="#pune-mumbai-round-trip">Round-Trip Taxi Service</a></li>
              <li><a href="#airport">Pune ↔ Mumbai Airport Transfer</a></li>
              <li><a href="#routes">Hinjawadi to BKC Taxi</a></li>
            </ul>
          </div>

          {/* Fleet & Services */}
          <div className="footer-links-col">
            <h4 className="footer-col-title">Services & Fleet</h4>
            <ul className="footer-links-list">
              <li><a href="#vehicles">Executive Sedan Taxi</a></li>
              <li><a href="#vehicles">Spacious SUV Taxi</a></li>
              <li><a href="#vehicles">Luxury Class Travel</a></li>
              <li><a href="#corporate">Corporate Intercity Mobility</a></li>
              <li><a href="#group">Mini Bus (Tempo Traveller)</a></li>
              <li><a href="#group">20-Seater Group Bus</a></li>
              <li><a href="#faq">Frequently Asked Questions</a></li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="footer-contact-col">
            <h4 className="footer-col-title">Contact & Booking</h4>
            <div className="footer-contact-info">
              <p>
                <Phone size={14} color="#D8AE55" /> Phone: <a href={`tel:${businessConfig.phone}`}>{businessConfig.phoneDisplay}</a>
              </p>
              <p>
                <MessageSquare size={14} color="#25D366" /> WhatsApp: <a href={`https://wa.me/${businessConfig.whatsapp}`} target="_blank" rel="noreferrer">Instant Booking Desk</a>
              </p>
              <p>
                <Mail size={14} color="#D8AE55" /> Email: <a href={`mailto:${businessConfig.email}`}>{businessConfig.email}</a>
              </p>
              <p>
                <MapPin size={14} color="#D8AE55" /> Terminal: {businessConfig.address}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} {businessConfig.businessName}. All rights reserved.</p>
          <div className="legal-links">
            <a href="#home">Privacy Policy</a>
            <span>•</span>
            <a href="#home">Terms & Conditions</a>
            <span>•</span>
            <a href="#home">Sitemap</a>
          </div>
        </div>
      </div>

      <style>{`
        .footer-wrapper {
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          padding-top: 4rem;
          padding-bottom: 2rem;
          color: #9CA3AF;
        }

        .footer-top-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1.5fr;
          gap: 2.5rem;
          margin-bottom: 3.5rem;
        }

        .footer-brand {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1.25rem;
        }

        .footer-tagline {
          font-size: 0.88rem;
          line-height: 1.6;
          color: #D1D5DB;
          margin-bottom: 1.25rem;
        }

        .footer-dispatch-note {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          font-size: 0.75rem;
          color: #9CA3AF;
          background: rgba(255, 255, 255, 0.03);
          padding: 0.6rem 0.85rem;
          border-radius: var(--radius-sm);
          border: 1px solid rgba(255, 255, 255, 0.06);
        }

        .footer-col-title {
          font-family: var(--font-heading);
          font-size: 1rem;
          font-weight: 700;
          color: #FFFFFF;
          margin-bottom: 1.25rem;
          letter-spacing: 0.02em;
        }

        .footer-links-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }

        .footer-links-list a {
          font-size: 0.85rem;
          color: #9CA3AF;
          transition: color 0.2s ease;
        }

        .footer-links-list a:hover {
          color: var(--accent-gold-warm);
        }

        .footer-contact-info p {
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
          color: #D1D5DB;
        }

        .footer-contact-info a {
          color: #FFFFFF;
          text-decoration: underline;
        }

        .footer-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 2rem;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          font-size: 0.8rem;
        }

        .legal-links {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .legal-links a:hover {
          color: #FFFFFF;
        }

        @media (max-width: 1024px) {
          .footer-top-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 640px) {
          .footer-top-grid {
            grid-template-columns: 1fr;
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
