import React from 'react';
import { ArrowRight, RefreshCw, MessageSquare, Check } from 'lucide-react';
import { getWhatsAppLink } from '../utils/whatsapp';

export const OneWayRoundTripSection = () => {
  const handleSelectType = (type) => {
    window.dispatchEvent(new CustomEvent('selectTripType', { detail: type }));
    const el = document.getElementById('home');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="section-padding bg-white">
      <div className="container">
        <div className="trip-types-grid">
          {/* One Way Card */}
          <div id="pune-mumbai-one-way" className="trip-card card-hover-effect">
            <div className="trip-card-badge">ONE WAY TRAVEL</div>
            <h2>Pune Mumbai One-Way Taxi</h2>
            <p className="trip-desc">
              One-way private taxi travel is a convenient option when you only need transportation in one direction. Request pickup in Pune for Mumbai travel or pickup in Mumbai for Pune travel with dedicated vehicle privacy.
            </p>
            <ul className="trip-feature-list">
              <li><Check size={16} color="#C89B3C" /> No shared passengers or route deviations</li>
              <li><Check size={16} color="#C89B3C" /> Dedicated private vehicle & driver</li>
              <li><Check size={16} color="#C89B3C" /> Doorstep pickup & destination drop-off</li>
              <li><Check size={16} color="#C89B3C" /> Comfort & luggage space for business or family</li>
              <li><Check size={16} color="#C89B3C" /> Transparent fare structure before departure</li>
            </ul>
            <button
              type="button"
              onClick={() => handleSelectType('ONE_WAY')}
              className="btn btn-whatsapp btn-full"
              style={{ cursor: 'pointer', border: 'none' }}
            >
              <ArrowRight size={18} />
              <span>BOOK ONE-WAY TAXI</span>
            </button>
          </div>

          {/* Round Trip Card */}
          <div id="pune-mumbai-round-trip" className="trip-card card-hover-effect">
            <div className="trip-card-badge gold-badge">ROUND TRIP TRAVEL</div>
            <h2>Pune Mumbai Round-Trip Taxi</h2>
            <p className="trip-desc">
              Planning to return to your starting city? Choose a round-trip private vehicle for business visits, family trips, events and short stays with seamless return arrangements.
            </p>
            <ul className="trip-feature-list">
              <li><Check size={16} color="#C89B3C" /> Complete pickup and outbound expressway journey</li>
              <li><Check size={16} color="#C89B3C" /> Driver waiting arrangements subject to booking terms</li>
              <li><Check size={16} color="#C89B3C" /> Return journey back to your origin pickup city</li>
              <li><Check size={16} color="#C89B3C" /> Ideal for same-day business meetings & family visits</li>
              <li><Check size={16} color="#C89B3C" /> Same driver and vehicle for outbound & return</li>
            </ul>
            <button
              type="button"
              onClick={() => handleSelectType('ROUND_TRIP')}
              className="btn btn-gold btn-full"
              style={{ cursor: 'pointer', border: 'none' }}
            >
              <RefreshCw size={18} />
              <span>BOOK ROUND TRIP</span>
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .trip-types-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }

        .trip-card {
          background: #FAFAFA;
          border-radius: var(--radius-xl);
          padding: 2.5rem;
          border: 1px solid #E5E7EB;
          display: flex;
          flex-direction: column;
          position: relative;
        }

        .trip-card-badge {
          display: inline-block;
          align-self: flex-start;
          font-family: var(--font-heading);
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          background: var(--bg-dark-navy);
          color: #FFFFFF;
          padding: 0.35rem 0.85rem;
          border-radius: 9999px;
          margin-bottom: 1.25rem;
        }

        .gold-badge {
          background: var(--accent-gold-soft);
          color: #000000;
        }

        .trip-card h2 {
          font-size: 1.75rem;
          color: var(--bg-dark-navy);
          margin-bottom: 1rem;
        }

        .trip-desc {
          font-size: 0.95rem;
          color: var(--text-muted);
          margin-bottom: 1.5rem;
          line-height: 1.6;
        }

        .trip-feature-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-bottom: 2rem;
          flex-grow: 1;
        }

        .trip-feature-list li {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          font-size: 0.9rem;
          font-weight: 500;
          color: #374151;
        }

        @media (max-width: 768px) {
          .trip-types-grid {
            display: flex;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            gap: 1rem;
            padding: 0.5rem 0.25rem 1rem;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }
          .trip-types-grid::-webkit-scrollbar {
            display: none;
          }
          .trip-card {
            flex: 0 0 85%;
            max-width: 310px;
            scroll-snap-align: start;
            padding: 1.25rem;
            border-radius: 18px;
          }
          .trip-card h2 {
            font-size: 1.35rem;
          }
          .trip-desc {
            font-size: 0.84rem;
            margin-bottom: 1rem;
          }
          .trip-feature-list {
            margin-bottom: 1.25rem;
            gap: 0.5rem;
          }
          .trip-feature-list li {
            font-size: 0.8rem;
          }
        }
      `}</style>
    </section>
  );
};
