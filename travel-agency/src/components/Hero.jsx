import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Phone, ShieldCheck, Clock, MapPin, Sparkles, Calendar } from 'lucide-react';
import { businessConfig } from '../config/business.config';
import { getWhatsAppLink, getPhoneCallLink } from '../utils/whatsapp';

export const Hero = ({ onOpenEnquiry }) => {
  return (
    <section id="home" className="hero-section">
      {/* Visual Campaign Banner Background */}
      <div className="hero-banner-wrapper">
        <img
          src="/assets/hero-luxury-cars.jpg"
          alt="Pune to Mumbai premium private travel with luxury vehicle"
          className="hero-banner-img"
          width="1920"
          height="1080"
          fetchPriority="high"
        />
        <div className="hero-overlay"></div>
      </div>

      <div className="hero-container container">
        <div className="hero-content">
          {/* Eyebrow Badge */}
          <div className="hero-eyebrow">
            <Sparkles size={14} color="#D8AE55" />
            <span>PREMIUM PUNE ↔ MUMBAI TRAVEL SERVICE</span>
          </div>

          {/* HTML H1 Heading */}
          <h1 className="hero-title">
            Pune to Mumbai Taxi – Luxury Cars & Fast Doorstep Pickup
          </h1>

          {/* Supporting Copy */}
          <p className="hero-description">
            Travel between Pune and Mumbai in clean, comfortable vehicles with
            professional drivers and convenient pickup from your preferred location.
            Choose one-way, round-trip, airport, corporate or group travel with
            fast booking by WhatsApp or phone.
          </p>

          {/* Hero Action Buttons */}
          <div className="hero-actions">
            <a
              href={getWhatsAppLink({ tripType: 'Intercity Travel' })}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-whatsapp btn-lg"
            >
              <MessageSquare size={20} />
              <span>BOOK ON WHATSAPP</span>
            </a>
            {businessConfig.phone ? (
              <a href={getPhoneCallLink()} className="btn btn-gold btn-lg">
                <Phone size={20} />
                <span>CALL NOW</span>
              </a>
            ) : (
              <Link to="/booking" className="btn btn-gold btn-lg" style={{ textDecoration: 'none' }}>
                <Calendar size={20} />
                <span>BOOK CAB ONLINE</span>
              </Link>
            )}
            <button onClick={onOpenEnquiry} className="btn btn-outline-gold btn-lg">
              <span>GET A QUOTE</span>
            </button>
          </div>

          {/* Trust Line Features */}
          <div className="hero-trust-line">
            <span className="trust-item">
              <ShieldCheck size={16} color="#D8AE55" /> Luxury Vehicles
            </span>
            <span className="trust-dot">•</span>
            <span className="trust-item">
              <Clock size={16} color="#D8AE55" /> Professional Drivers
            </span>
            <span className="trust-dot">•</span>
            <span className="trust-item">
              <MapPin size={16} color="#D8AE55" /> Doorstep Pickup
            </span>
            <span className="trust-dot">•</span>
            <span className="trust-item">One-Way & Round Trip</span>
          </div>

          {/* Truthful 30-Minute Dispatch Note */}
          <div className="hero-dispatch-note">
            <span className="dispatch-badge">DISPATCH NOTE</span>
            <p className="dispatch-text">{businessConfig.dispatchDisclaimer}</p>
          </div>
        </div>
      </div>

      <style>{`
        .hero-section {
          position: relative;
          min-height: 580px;
          background-color: #07111F;
          color: #FFFFFF;
          display: flex;
          align-items: center;
          padding-top: 4rem;
          padding-bottom: 4.5rem;
          overflow: hidden;
        }

        .hero-banner-wrapper {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1;
        }

        .hero-banner-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
        }

        .hero-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            180deg,
            rgba(7, 17, 31, 0.85) 0%,
            rgba(7, 17, 31, 0.92) 50%,
            rgba(7, 17, 31, 0.96) 100%
          );
        }

        .hero-container {
          position: relative;
          z-index: 2;
        }

        .hero-content {
          max-width: 860px;
          margin: 0 auto;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .hero-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(216, 174, 85, 0.12);
          border: 1px solid var(--border-gold);
          padding: 0.4rem 1rem;
          border-radius: 9999px;
          font-family: var(--font-heading);
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: var(--accent-gold-warm);
          margin-bottom: 1.25rem;
        }

        .hero-title {
          font-size: 3.25rem;
          font-weight: 800;
          line-height: 1.15;
          letter-spacing: -0.02em;
          color: #FFFFFF;
          margin-bottom: 1.25rem;
          text-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        }

        .hero-description {
          font-size: 1.15rem;
          line-height: 1.6;
          color: #D1D5DB;
          margin-bottom: 2rem;
          max-width: 760px;
        }

        .hero-actions {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .hero-trust-line {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          font-size: 0.95rem;
          font-weight: 500;
          color: #E5E7EB;
          margin-bottom: 1.5rem;
          background: rgba(255, 255, 255, 0.05);
          padding: 0.6rem 1.25rem;
          border-radius: var(--radius-md);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .trust-item {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
        }

        .trust-dot {
          color: var(--accent-gold-soft);
        }

        .hero-dispatch-note {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: rgba(0, 0, 0, 0.35);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 0.5rem 1rem;
          border-radius: var(--radius-sm);
          max-width: 760px;
        }

        .dispatch-badge {
          background: var(--accent-gold-soft);
          color: #000000;
          font-weight: 800;
          font-size: 0.65rem;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
          letter-spacing: 0.05em;
          white-space: nowrap;
        }

        .dispatch-text {
          font-size: 0.8rem;
          color: #9CA3AF;
          text-align: left;
        }

        @media (max-width: 768px) {
          .hero-section {
            min-height: auto;
            padding-top: 2.5rem;
            padding-bottom: 3.5rem;
          }
          .hero-title {
            font-size: 2rem;
          }
          .hero-description {
            font-size: 0.98rem;
          }
          .hero-actions {
            flex-direction: column;
            width: 100%;
          }
          .hero-actions .btn {
            width: 100%;
          }
          .hero-dispatch-note {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </section>
  );
};
