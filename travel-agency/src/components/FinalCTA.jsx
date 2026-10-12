import React from 'react';
import { MessageSquare, Phone, Calendar, Clock, ShieldCheck, MapPin } from 'lucide-react';
import { businessConfig } from '../config/business.config';
import { getWhatsAppLink, getPhoneCallLink } from '../utils/whatsapp';

export const FinalCTA = ({ onOpenEnquiry }) => {
  return (
    <section id="contact" className="section-padding bg-dark-navy final-cta-section">
      <div className="container">
        <div className="final-cta-box">
          <span className="eyebrow">START YOUR PRIVATE JOURNEY</span>
          <h2>Ready for Your Pune–Mumbai Journey?</h2>
          <p className="final-cta-text">
            Tell us your pickup location, destination, travel date and preferred vehicle. Contact us for current availability and fare.
          </p>

          <div className="final-cta-buttons">
            <a
              href={getWhatsAppLink({ tripType: 'Intercity Journey' })}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-whatsapp btn-lg"
            >
              <MessageSquare size={20} />
              <span>BOOK ON WHATSAPP</span>
            </a>
            <a href={getPhoneCallLink()} className="btn btn-gold btn-lg">
              <Phone size={20} />
              <span>CALL NOW</span>
            </a>
            <button onClick={onOpenEnquiry} className="btn btn-outline-gold btn-lg">
              <Calendar size={20} />
              <span>GET A QUOTE</span>
            </button>
          </div>

          <div className="final-contact-details">
            <div className="contact-detail-item">
              <Phone size={16} color="#D8AE55" />
              <span>Direct Phone: <strong>{businessConfig.phoneDisplay}</strong></span>
            </div>
            <div className="contact-detail-item">
              <Clock size={16} color="#D8AE55" />
              <span>Operating Hours: <strong>{businessConfig.businessHours}</strong></span>
            </div>
            <div className="contact-detail-item">
              <MapPin size={16} color="#D8AE55" />
              <span>Terminal: <strong>{businessConfig.address}</strong></span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .final-cta-section {
          border-top: 1px solid var(--border-gold);
        }

        .final-cta-box {
          text-align: center;
          max-width: 860px;
          margin: 0 auto;
          background: rgba(255, 255, 255, 0.03);
          border-radius: var(--radius-xl);
          padding: 3.5rem 2rem;
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 20px 50px rgba(0,0,0,0.5);
        }

        .final-cta-box h2 {
          font-size: 2.75rem;
          color: #FFFFFF;
          margin-bottom: 1rem;
        }

        .final-cta-text {
          font-size: 1.15rem;
          color: #D1D5DB;
          line-height: 1.6;
          margin-bottom: 2.25rem;
        }

        .final-cta-buttons {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1.25rem;
          margin-bottom: 2.5rem;
        }

        .final-contact-details {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          gap: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px dashed rgba(255, 255, 255, 0.1);
        }

        .contact-detail-item {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.88rem;
          color: #9CA3AF;
        }

        .contact-detail-item strong {
          color: #FFFFFF;
        }

        @media (max-width: 768px) {
          .final-cta-box {
            padding: 2rem 1.25rem;
          }
          .final-cta-box h2 {
            font-size: 1.85rem;
          }
          .final-cta-buttons {
            flex-direction: column;
            width: 100%;
          }
          .final-cta-buttons .btn {
            width: 100%;
          }
          .final-contact-details {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </section>
  );
};
