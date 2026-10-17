import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Phone, Calendar, Clock, Sparkles, MapPin } from 'lucide-react';
import { businessConfig } from '../config/business.config';
import { getWhatsAppLink, getPhoneCallLink } from '../utils/whatsapp';
import { homepageContent } from '../data/homepageContent';

export const FinalCTA = ({ onOpenEnquiry }) => {
  const ctaData = homepageContent.finalCta;

  return (
    <section id="contact" className="section-padding final-cta-section">
      <div className="container">
        <div className="final-cta-box">
          <div className="final-cta-badge">
            <Sparkles size={13} color="#38BDF8" />
            <span>{ctaData.badge}</span>
          </div>

          <h2 className="final-cta-title">{ctaData.title}</h2>
          <p className="final-cta-text">
            {ctaData.description}
          </p>

          <div className="final-cta-buttons">
            <a
              href={getWhatsAppLink({ tripType: 'Intercity Journey' })}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-whatsapp btn-lg"
            >
              <MessageSquare size={18} />
              <span>{ctaData.ctaButtons.whatsapp.toUpperCase()}</span>
            </a>

            <a href={`tel:${ctaData.phoneRaw}`} className="btn btn-royal btn-lg">
              <Phone size={18} />
              <span>{ctaData.ctaButtons.call.toUpperCase()}</span>
            </a>

            <Link to="/booking" className="btn btn-royal btn-lg">
              <Calendar size={18} />
              <span>{ctaData.ctaButtons.online.toUpperCase()}</span>
            </Link>

            <button
              type="button"
              onClick={onOpenEnquiry}
              className="btn btn-outline-white btn-lg"
            >
              <Calendar size={18} />
              <span>{ctaData.ctaButtons.quote.toUpperCase()}</span>
            </button>
          </div>

          <div className="final-contact-details">
            <div className="contact-detail-item">
              <Phone size={15} color="#38BDF8" />
              <span>Travel Desk: <strong>{ctaData.phoneDisplay}</strong></span>
            </div>
            <div className="contact-detail-item">
              <Clock size={15} color="#38BDF8" />
              <span>Availability: <strong>24 Hours / 7 Days a Week</strong></span>
            </div>
            <div className="contact-detail-item">
              <MapPin size={15} color="#38BDF8" />
              <span>Operating Hub: <strong>{ctaData.address}</strong></span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .final-cta-section {
          background-color: #F8F7F4;
          border-top: 1px solid #DCE3EB;
          border-bottom: 1px solid #DCE3EB;
          padding: 2.75rem 0 3.25rem;
          position: relative;
          overflow: hidden;
        }

        .final-cta-section::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at center, rgba(37, 99, 235, 0.05), transparent 70%);
          pointer-events: none;
        }

        .final-cta-box {
          text-align: center;
          max-width: 860px;
          margin: 0 auto;
          background: linear-gradient(145deg, #0B192C 0%, #152A4A 100%);
          border-radius: 24px;
          padding: 2.75rem 2.25rem;
          border: 1px solid rgba(147, 197, 253, 0.28);
          box-shadow: 0 20px 50px -8px rgba(11, 25, 44, 0.35);
          position: relative;
          z-index: 2;
        }

        .final-cta-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.35rem 0.95rem;
          border-radius: 9999px;
          background: rgba(37, 99, 235, 0.25);
          border: 1px solid rgba(147, 197, 253, 0.4);
          color: #93C5FD;
          font-family: var(--font-heading, 'Outfit', sans-serif);
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          margin-bottom: 1.15rem;
        }

        .final-cta-title {
          font-family: var(--font-heading, 'Outfit', sans-serif);
          font-size: 2.2rem;
          font-weight: 700;
          color: #FFFFFF;
          margin-bottom: 0.85rem;
          letter-spacing: -0.015em;
          line-height: 1.25;
        }

        .final-cta-text {
          font-size: 1rem;
          color: #E2E8F0;
          max-width: 680px;
          margin: 0 auto 1.75rem;
          line-height: 1.65;
        }

        .final-cta-buttons {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.85rem;
          margin-bottom: 1.85rem;
          flex-wrap: wrap;
        }

        .final-contact-details {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          gap: 1.75rem;
          padding-top: 1.75rem;
          border-top: 1px dashed rgba(255, 255, 255, 0.2);
        }

        .contact-detail-item {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
          color: #CBD5E1;
        }

        .contact-detail-item strong {
          color: #FFFFFF;
          font-weight: 700;
        }

        @media (max-width: 768px) {
          .final-cta-box {
            padding: 2.25rem 1.25rem;
            border-radius: 20px;
          }
          .final-cta-title {
            font-size: 1.85rem;
          }
          .final-cta-text {
            font-size: 0.92rem;
            margin-bottom: 1.75rem;
          }
          .final-cta-buttons {
            flex-direction: column;
            width: 100%;
            gap: 0.75rem;
          }
          .final-cta-buttons .btn {
            width: 100%;
          }
          .final-contact-details {
            flex-direction: column;
            align-items: center;
            gap: 0.65rem;
            text-align: center;
          }
        }
      `}</style>
    </section>
  );
};

