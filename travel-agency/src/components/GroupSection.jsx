import React from 'react';
import { Users, Bus, MessageSquare, CheckCircle2 } from 'lucide-react';
import { getWhatsAppLink } from '../utils/whatsapp';

export const GroupSection = () => {
  return (
    <section id="group" className="section-padding bg-white">
      <div className="container">
        <div className="section-header">
          <span className="eyebrow">LARGE GROUP TRANSPORTATION</span>
          <h2>Travelling With a Group?</h2>
          <p>
            Keep your group together with larger transportation options for family trips, corporate outings, weddings, events and intercity group journeys.
          </p>
        </div>

        <div className="group-cards-grid">
          {/* Mini Bus Card */}
          <div className="group-card card-hover-effect">
            <div className="group-icon-box">
              <Bus size={28} color="#D8AE55" />
            </div>
            <div className="group-badge">12 - 17 PASSENGERS</div>
            <h3>Luxury Mini Bus (Tempo Traveller)</h3>
            <p className="group-card-desc">
              Spacious high-roof mini buses equipped with plush pushback seats, individual AC vents, dedicated luggage bay, and audio system. Ideal for medium groups, pre-wedding travel, and corporate teams.
            </p>
            <a
              href={getWhatsAppLink({ vehicle: 'Mini Bus (Tempo Traveller)', tripType: 'Group Travel' })}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-whatsapp btn-full"
            >
              <MessageSquare size={16} />
              <span>BOOK MINI BUS</span>
            </a>
          </div>

          {/* 20-Seater Card */}
          <div className="group-card card-hover-effect">
            <div className="group-icon-box">
              <Bus size={28} color="#D8AE55" />
            </div>
            <div className="group-badge gold-badge">18 - 20 PASSENGERS</div>
            <h3>20-Seater Executive Coach</h3>
            <p className="group-card-desc">
              Air-conditioned 20-seater mini coach featuring air suspension for a smooth expressway ride, spacious aisle, and outstation special permits. Perfect for large family functions, wedding guests, and tours.
            </p>
            <a
              href={getWhatsAppLink({ vehicle: '20-Seater Coach', tripType: 'Group Travel' })}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-gold btn-full"
            >
              <MessageSquare size={16} />
              <span>BOOK 20-SEATER COACH</span>
            </a>
          </div>
        </div>
      </div>

      <style>{`
        .group-cards-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }

        .group-card {
          background: #FAFAFA;
          border-radius: var(--radius-xl);
          padding: 2.5rem;
          border: 1px solid #E5E7EB;
          display: flex;
          flex-direction: column;
          box-shadow: var(--shadow-sm);
        }

        .group-icon-box {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          background: rgba(216, 174, 85, 0.12);
          border: 1px solid var(--border-gold);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.25rem;
        }

        .group-badge {
          display: inline-block;
          align-self: flex-start;
          font-family: var(--font-heading);
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          background: var(--bg-dark-navy);
          color: #FFFFFF;
          padding: 0.25rem 0.65rem;
          border-radius: 4px;
          margin-bottom: 0.85rem;
        }

        .group-badge.gold-badge {
          background: var(--accent-gold-soft);
          color: #000000;
        }

        .group-card h3 {
          font-size: 1.5rem;
          color: var(--bg-dark-navy);
          margin-bottom: 0.75rem;
        }

        .group-card-desc {
          font-size: 0.92rem;
          color: var(--text-muted);
          line-height: 1.6;
          margin-bottom: 2rem;
          flex-grow: 1;
        }

        @media (max-width: 768px) {
          .group-cards-grid {
            display: flex;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            gap: 1rem;
            padding: 0.5rem 0.25rem 1rem;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }
          .group-cards-grid::-webkit-scrollbar {
            display: none;
          }
          .group-card {
            flex: 0 0 85%;
            max-width: 310px;
            scroll-snap-align: start;
            padding: 1.25rem;
            border-radius: 18px;
          }
          .group-card h3 {
            font-size: 1.25rem;
          }
          .group-card-desc {
            font-size: 0.84rem;
            margin-bottom: 1.25rem;
          }
        }
      `}</style>
    </section>
  );
};
