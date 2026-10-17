import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, Compass, Plane, MapPin, Navigation, MessageSquare, Clock, ArrowRight, Car, Sparkles, Landmark } from 'lucide-react';
import { getWhatsAppLink } from '../utils/whatsapp';
import { homepageContent } from '../data/homepageContent';

const ICON_MAP = {
  'pune-mumbai': Building2,
  'mahabaleshwar': Compass,
  'shirdi': Landmark,
  'lonavala': Navigation,
  'nashik': MapPin,
  'alibaug-goa': Plane,
};

export const DestinationSpotlight = () => {
  const navigate = useNavigate();
  const spotlightData = homepageContent.destinationsSpotlight;
  const destinations = spotlightData.destinations || [];

  const [selectedDest, setSelectedDest] = useState(destinations[0] || {});

  const handleBookDestination = (dest) => {
    // Notify homepage booking form if present
    window.dispatchEvent(
      new CustomEvent('preFillBooking', {
        detail: {
          tripType: 'ONE_WAY',
          pickupId: dest.pickupKey,
          dropId: dest.dropKey,
        },
      })
    );

    // Redirect user to Fare Calculator with pre-configured destination parameters
    const params = new URLSearchParams({
      tripType: 'ONE_WAY',
      pickupId: dest.pickupKey,
      dropId: dest.dropKey,
      destination: dest.name,
    });
    navigate(`/fare?${params.toString()}`);
  };

  return (
    <section className="section-padding bg-white" style={{ paddingTop: '4.5rem', paddingBottom: '5rem', position: 'relative' }}>
      <div className="container">
        {/* Lovable Modern Section Header */}
        <div className="lovable-section-header">
          <div className="lovable-badge">
            <Sparkles size={13} />
            <span>{spotlightData.badge}</span>
          </div>
          <h2 className="lovable-title">
            {spotlightData.title}
          </h2>
          <p className="lovable-subtitle">
            {spotlightData.subtitle}
          </p>
          <div className="lovable-divider">
            <div className="lovable-divider-line"></div>
            <div className="lovable-divider-dot"></div>
            <div className="lovable-divider-line right"></div>
          </div>
        </div>

        {/* Icon Selector Cards Bar */}
        <div className="dest-icon-strip">
          {destinations.map((d, idx) => {
            const Icon = ICON_MAP[d.id] || MapPin;
            const isSelected = selectedDest.id === d.id;
            return (
              <button
                key={d.id}
                type="button"
                className={`dest-icon-card ${isSelected ? 'active' : ''} stagger-${(idx % 5) + 1}`}
                onClick={() => setSelectedDest(d)}
              >
                <div className="dest-icon-box">
                  <Icon size={22} color={isSelected ? '#FFFFFF' : '#2563EB'} />
                </div>
                <span className="dest-icon-name">{d.name}</span>
                <span className="dest-icon-city">{d.city}</span>
              </button>
            );
          })}
        </div>

        {/* Perfectly Balanced 2-Column Spotlight Box */}
        <div className="spotlight-card-wrapper">
          <div className="spotlight-2col-grid">
            {/* Left Content Column */}
            <div className="spotlight-left-col">
              <span className="spotlight-eyebrow">DESTINATION FOCUS</span>
              <h3 className="spotlight-title">{selectedDest.title}</h3>
              <p className="spotlight-tagline">{selectedDest.tagline}</p>
              <p className="spotlight-desc">{selectedDest.desc}</p>

              {/* Info Badges Row */}
              <div className="spotlight-info-grid">
                <div className="info-badge-box">
                  <span className="info-badge-label">POPULAR ROUTE</span>
                  <p className="info-badge-val">{selectedDest.popularRoute}</p>
                </div>
                <div className="info-badge-box">
                  <span className="info-badge-label">EST. EXPRESS TIME</span>
                  <p className="info-badge-val">{selectedDest.estTime}</p>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="spotlight-action-row" style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => handleBookDestination(selectedDest)}
                  className="btn-emerald-glowing"
                >
                  <Car size={18} />
                  <span>BOOK CAB TO {selectedDest.name.toUpperCase()}</span>
                  <ArrowRight size={16} />
                </button>

                {selectedDest.url && (
                  <Link
                    to={selectedDest.url}
                    className="btn-spotlight-guide"
                  >
                    <span>Read Travel Guide</span>
                    <ArrowRight size={15} />
                  </Link>
                )}

                <a
                  href={getWhatsAppLink({
                    from: 'Pune',
                    to: selectedDest.name,
                    tripType: 'Outstation Cab'
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-whatsapp-outline"
                >
                  <MessageSquare size={16} color="#25D366" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Right Media Image Card Column */}
            <div className="spotlight-right-col">
              <div className="spotlight-media-card">
                <img
                  src={selectedDest.image}
                  alt={selectedDest.title}
                  className="spotlight-media-img"
                  loading="lazy"
                  decoding="async"
                />
                <div className="spotlight-media-overlay">
                  <span className="media-chip">
                    <Compass size={14} color="#D8AE55" />
                    <span>{selectedDest.city} Sector Express</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .btn-emerald-glowing {
          background: linear-gradient(135deg, #1D4ED8 0%, #1E40AF 100%);
          color: #FFFFFF;
          font-family: var(--font-heading);
          font-size: 0.9rem;
          font-weight: 700;
          letter-spacing: 0.02em;
          padding: 0.75rem 1.45rem;
          border-radius: 12px;
          border: none;
          display: inline-flex;
          align-items: center;
          gap: 0.55rem;
          box-shadow: 0 4px 14px rgba(29, 78, 216, 0.35);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: pointer;
        }

        .btn-emerald-glowing:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(29, 78, 216, 0.45);
          background: linear-gradient(135deg, #1E40AF 0%, #172554 100%);
        }

        .btn-emerald-glowing:active {
          transform: translateY(0);
        }

        .btn-whatsapp-outline {
          background: rgba(37, 211, 102, 0.12);
          border: 1.5px solid rgba(37, 211, 102, 0.4);
          color: #4ADE80;
          font-family: var(--font-heading);
          font-size: 0.875rem;
          font-weight: 700;
          padding: 0.75rem 1.25rem;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .btn-whatsapp-outline:hover {
          background: rgba(37, 211, 102, 0.22);
          border-color: #22C55E;
          color: #86EFAC;
          transform: translateY(-1px);
        }

        .dest-icon-strip {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          margin-bottom: 2.5rem;
          flex-wrap: wrap;
        }

        .dest-icon-card {
          background: #FFFFFF;
          border-radius: 16px;
          padding: 1.1rem 1.35rem;
          min-width: 145px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          border: 1.5px solid #DCE3EB;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: pointer;
        }

        .dest-icon-card:hover {
          border-color: #93C5FD;
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(37, 99, 235, 0.1);
        }

        .dest-icon-card.active {
          background: #EFF6FF;
          border-color: #2563EB;
          box-shadow: 0 8px 24px rgba(37, 99, 235, 0.16);
          transform: translateY(-2px);
        }

        .dest-icon-box {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: #EFF6FF;
          border: 1px solid #BFDBFE;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 0.5rem;
          transition: all 0.2s ease;
        }

        .dest-icon-card.active .dest-icon-box {
          background: #2563EB;
          border-color: #2563EB;
        }

        .dest-icon-name {
          font-family: var(--font-heading);
          font-size: 0.92rem;
          font-weight: 800;
          color: #17324D;
          line-height: 1.2;
        }

        .dest-icon-card.active .dest-icon-name {
          color: #1D4ED8;
        }

        .dest-icon-city {
          font-size: 0.72rem;
          color: #64748B;
          margin-top: 0.2rem;
          font-weight: 700;
          letter-spacing: 0.02em;
        }

        .spotlight-card-wrapper {
          background: linear-gradient(145deg, #0B111E 0%, #0F172A 100%);
          border-radius: 24px;
          padding: 2.75rem;
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25), 0 0 30px rgba(37, 99, 235, 0.08);
          color: #F8FAFC;
        }

        .spotlight-2col-grid {
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: 2.5rem;
          align-items: center;
        }

        .spotlight-left-col {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          text-align: left;
        }

        .spotlight-eyebrow {
          font-family: var(--font-heading);
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: #60A5FA;
          margin-bottom: 0.6rem;
          background: rgba(37, 99, 235, 0.2);
          padding: 0.3rem 0.85rem;
          border-radius: 9999px;
          border: 1px solid rgba(96, 165, 250, 0.4);
        }

        .spotlight-title {
          font-size: 2.1rem;
          font-weight: 900;
          line-height: 1.15;
          margin-bottom: 0.4rem;
          color: #FFFFFF;
          letter-spacing: -0.02em;
        }

        .spotlight-tagline {
          font-size: 0.98rem;
          color: #38BDF8;
          font-weight: 700;
          margin-bottom: 0.85rem;
        }

        .spotlight-desc {
          font-size: 0.92rem;
          color: #CBD5E1;
          line-height: 1.65;
          margin-bottom: 1.65rem;
        }

        .spotlight-info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          width: 100%;
          margin-bottom: 1.85rem;
          padding-top: 1.25rem;
          border-top: 1px solid rgba(255, 255, 255, 0.12);
        }

        .info-badge-box {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          background: rgba(30, 41, 59, 0.7);
          border: 1.5px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 0.75rem 1rem;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .info-badge-label {
          font-size: 0.68rem;
          font-weight: 800;
          color: #94A3B8;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .info-badge-val {
          font-family: var(--font-heading);
          font-size: 0.95rem;
          font-weight: 800;
          color: #FFFFFF;
        }

        .spotlight-action-row {
          width: 100%;
        }

        .spotlight-right-col {
          width: 100%;
        }

        .spotlight-media-card {
          position: relative;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.12);
          height: 330px;
        }

        .spotlight-media-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s ease;
        }

        .spotlight-media-card:hover .spotlight-media-img {
          transform: scale(1.03);
        }

        .spotlight-media-overlay {
          position: absolute;
          bottom: 1rem;
          left: 1rem;
          z-index: 2;
        }

        .media-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: rgba(15, 23, 42, 0.85);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 0.35rem 0.8rem;
          border-radius: 9999px;
          font-family: var(--font-heading);
          font-size: 0.8rem;
          font-weight: 600;
          color: #FFFFFF;
        }

        @media (max-width: 992px) {
          .spotlight-card-wrapper {
            padding: 1.75rem;
          }
          .spotlight-2col-grid {
            grid-template-columns: 1fr;
            gap: 2rem;
          }
          .spotlight-media-card {
            height: 260px;
          }
        }

        @media (max-width: 640px) {
          .dest-icon-strip {
            flex-wrap: nowrap;
            justify-content: flex-start;
            overflow-x: auto;
            padding-bottom: 0.5rem;
            margin-bottom: 1.25rem;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }
          .dest-icon-strip::-webkit-scrollbar {
            display: none;
          }
          .dest-icon-card {
            min-width: 110px;
            padding: 0.65rem 0.75rem;
            flex-shrink: 0;
            border-radius: 12px;
          }
          .spotlight-card-wrapper {
            padding: 1rem;
            border-radius: 18px;
          }
          .spotlight-2col-grid {
            gap: 1.25rem;
          }
          .spotlight-title {
            font-size: 1.35rem;
            margin-bottom: 0.35rem;
          }
          .spotlight-tagline {
            font-size: 0.85rem;
            margin-bottom: 0.5rem;
          }
          .spotlight-desc {
            font-size: 0.8rem;
            margin-bottom: 1rem;
            line-height: 1.45;
          }
          .spotlight-info-grid {
            grid-template-columns: 1fr 1fr;
            gap: 0.6rem;
            margin-bottom: 1.15rem;
            padding-top: 0.85rem;
          }
          .info-badge-val {
            font-size: 0.8rem;
          }
          .spotlight-media-card {
            height: 140px;
            border-radius: 14px;
          }
          .btn-spotlight-guide {
            display: inline-flex;
            align-items: center;
            gap: 0.45rem;
            background: #EFF6FF;
            border: 1px solid #BFDBFE;
            color: #1D4ED8;
            padding: 0.75rem 1.25rem;
            border-radius: 12px;
            font-weight: 700;
            font-size: 0.88rem;
            text-decoration: none;
            transition: all 0.2s ease;
          }
          .btn-spotlight-guide:hover {
            background: #DBEAFE;
            color: #1E40AF;
            transform: translateY(-2px);
          }
          .btn-emerald-glowing,
          .btn-spotlight-guide,
          .btn-whatsapp-outline {
            width: 100%;
            justify-content: center;
            padding: 0.65rem 1rem;
            font-size: 0.82rem;
          }
        }
      `}</style>
    </section>
  );
};
