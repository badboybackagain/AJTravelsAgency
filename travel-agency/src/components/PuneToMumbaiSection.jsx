import React from 'react';
import { CheckCircle2, MessageSquare, ShieldCheck, MapPin, Users } from 'lucide-react';
import { getWhatsAppLink } from '../utils/whatsapp';

export const PuneToMumbaiSection = () => {
  const benefits = [
    { title: 'Private Doorstep Pickup', desc: 'Direct pickup from your home, office, hotel, or Pune Airport (PNQ).' },
    { title: 'Flexible Departure Schedules', desc: 'Depart on your time schedule without waiting for fixed timetables.' },
    { title: 'Dedicated Luggage & Cabin Space', desc: 'Clean, spacious vehicles with dedicated boot space for all bags.' },
    { title: 'Family & Corporate Comfort', desc: 'Sanitized cars with dual AC and experienced, courteous chauffeurs.' },
    { title: 'Direct Airport & City Transfers', desc: 'Seamless drop-offs at Mumbai Airport (BOM), BKC, Andheri, or Bandra.' },
    { title: 'Group Transportation Options', desc: 'Mini buses and 20-seater vehicles for larger group journeys.' }
  ];

  return (
    <section id="pune-to-mumbai" className="section-padding bg-white">
      <div className="container">
        <div className="split-grid">
          {/* Left Column: Visual Media */}
          <div className="split-media">
            <img
              src="/assets/sedan.webp"
              alt="Pune to Mumbai Taxi Service luxury sedan vehicle"
              className="split-img rounded-img"
              loading="lazy"
            />
            <div className="media-overlay-badge">
              <ShieldCheck size={18} color="#D8AE55" />
              <span>Pune → Mumbai Express Route</span>
            </div>
          </div>

          {/* Right Column: Copy & Benefits */}
          <div className="split-content">
            <span className="eyebrow-text">PUNE → MUMBAI PRIVATE TAXI</span>
            <h2>Pune to Mumbai Taxi Service</h2>
            <p className="lead-paragraph">
              Looking for a comfortable private taxi from Pune to Mumbai? Travel from your preferred pickup location with a vehicle suited to your passengers, luggage and journey requirements. Choose one-way or round-trip travel and contact us for current vehicle availability and fare.
            </p>

            <h3 className="subheading">Why Book a Private Pune to Mumbai Taxi?</h3>

            <div className="benefits-grid">
              {benefits.map((b, idx) => (
                <div key={idx} className="benefit-item">
                  <CheckCircle2 size={18} color="#C89B3C" className="benefit-icon" />
                  <div>
                    <h4 className="benefit-title">{b.title}</h4>
                    <p className="benefit-desc">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="action-row">
              <a
                href={getWhatsAppLink({ from: 'Pune', to: 'Mumbai', tripType: 'One Way' })}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-whatsapp btn-lg"
              >
                <MessageSquare size={18} />
                <span>BOOK PUNE → MUMBAI</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .split-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3.5rem;
          align-items: center;
        }

        .split-media {
          position: relative;
          border-radius: var(--radius-xl);
          overflow: hidden;
          box-shadow: var(--shadow-xl);
        }

        .split-img {
          width: 100%;
          height: 480px;
          object-fit: cover;
        }

        .media-overlay-badge {
          position: absolute;
          bottom: 1.5rem;
          left: 1.5rem;
          background: rgba(7, 17, 31, 0.85);
          backdrop-filter: blur(10px);
          border: 1px solid var(--border-gold);
          padding: 0.6rem 1.25rem;
          border-radius: 9999px;
          color: #FFFFFF;
          font-family: var(--font-heading);
          font-size: 0.85rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .eyebrow-text {
          font-family: var(--font-heading);
          font-size: 0.85rem;
          font-weight: 800;
          letter-spacing: 0.1em;
          color: var(--accent-gold-soft);
          display: block;
          margin-bottom: 0.5rem;
        }

        .lead-paragraph {
          font-size: 1.05rem;
          color: var(--text-muted);
          margin-bottom: 1.5rem;
          line-height: 1.6;
        }

        .subheading {
          font-size: 1.35rem;
          color: var(--bg-dark-navy);
          margin-bottom: 1.25rem;
        }

        .benefits-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .benefit-item {
          display: flex;
          align-items: flex-start;
          gap: 0.6rem;
        }

        .benefit-icon {
          flex-shrink: 0;
          margin-top: 0.15rem;
        }

        .benefit-title {
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--bg-dark-navy);
        }

        .benefit-desc {
          font-size: 0.78rem;
          color: #6B7280;
          line-height: 1.3;
        }

        .action-row {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        @media (max-width: 992px) {
          .split-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
          .split-img {
            height: 180px;
          }
          .benefits-grid {
            grid-template-columns: 1fr 1fr;
            gap: 0.75rem;
          }
          .benefit-title {
            font-size: 0.85rem;
          }
          .benefit-desc {
            font-size: 0.75rem;
          }
        }
      `}</style>
    </section>
  );
};
