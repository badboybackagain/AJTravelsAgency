import React from 'react';
import { Building2, Briefcase, Award, CheckCircle2, Calendar } from 'lucide-react';
import { getWhatsAppLink } from '../utils/whatsapp';

export const CorporateSection = ({ onOpenEnquiry }) => {
  const corporateBenefits = [
    'Executive vehicle comfort (Crysta, Camry, Mercedes)',
    'Doorstep pickup from Hinjawadi, Magarpatta, BKC, & Nariman Point',
    'Trained professional chauffeurs in formal attire',
    'Transparent invoicing for business expense claims',
    'One-way, same-day round trip & multi-day corporate mobility',
    'Flight-synchronized airport connection transfers'
  ];

  return (
    <section id="corporate" className="section-padding bg-dark-navy">
      <div className="container">
        <div className="corporate-wrapper">
          <div className="corporate-content">
            <span className="eyebrow">EXECUTIVE MOBILITY & B2B TRAVEL</span>
            <h2>Business Travel Between Pune & Mumbai</h2>
            <p className="corporate-desc">
              Travel between two major commercial hubs with private transportation designed around your exact business schedule. Ideal for executive meetings, IT park transfers, corporate delegations, and airport connections.
            </p>

            <div className="corporate-features-grid">
              {corporateBenefits.map((feat, idx) => (
                <div key={idx} className="corp-feat-item">
                  <CheckCircle2 size={16} color="#D8AE55" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            <div className="corporate-actions">
              <button onClick={onOpenEnquiry} className="btn btn-gold btn-lg">
                <Calendar size={18} />
                <span>ENQUIRE FOR CORPORATE TRAVEL</span>
              </button>
              <a
                href={getWhatsAppLink({ tripType: 'Corporate Travel' })}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline-gold btn-lg"
              >
                <span>WHATSAPP CORPORATE DESK</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .corporate-wrapper {
          background: linear-gradient(135deg, rgba(16, 24, 39, 0.9) 0%, rgba(7, 17, 31, 0.98) 100%);
          border-radius: var(--radius-xl);
          padding: 3.5rem;
          border: 1px solid var(--border-gold);
          box-shadow: 0 20px 40px rgba(0,0,0,0.4);
        }

        .corporate-content {
          max-width: 860px;
          margin: 0 auto;
          text-align: center;
        }

        .corporate-content h2 {
          font-size: 2.5rem;
          color: #FFFFFF;
          margin-bottom: 1.25rem;
        }

        .corporate-desc {
          font-size: 1.1rem;
          color: #D1D5DB;
          line-height: 1.6;
          margin-bottom: 2.25rem;
        }

        .corporate-features-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          text-align: left;
          margin-bottom: 2.5rem;
          background: rgba(255, 255, 255, 0.03);
          padding: 1.5rem;
          border-radius: var(--radius-lg);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .corp-feat-item {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          font-size: 0.92rem;
          color: #E5E7EB;
          font-weight: 500;
        }

        .corporate-actions {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
        }

        @media (max-width: 768px) {
          .corporate-wrapper {
            padding: 1.75rem;
          }
          .corporate-content h2 {
            font-size: 1.85rem;
          }
          .corporate-features-grid {
            grid-template-columns: 1fr;
          }
          .corporate-actions {
            flex-direction: column;
            width: 100%;
          }
          .corporate-actions .btn {
            width: 100%;
          }
        }
      `}</style>
    </section>
  );
};
