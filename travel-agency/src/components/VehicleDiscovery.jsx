import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Users, Briefcase, CheckCircle2, Car, ArrowRight } from 'lucide-react';
import { homepageContent } from '../data/homepageContent';

export const VehicleDiscovery = () => {
  const navigate = useNavigate();
  const fleetData = homepageContent.fleet;
  const vehicles = fleetData.vehicles || [];

  const handleBookVehicle = (v) => {
    let cat = 'SEDAN';
    if (v.id === 'suv' || v.name.toLowerCase().includes('suv')) cat = 'SUV';
    else if (v.id === 'premium' || v.name.toLowerCase().includes('luxury') || v.name.toLowerCase().includes('crysta')) cat = 'INNOVA_CRYSTA';
    else if (v.id === 'minibus' || v.name.toLowerCase().includes('mini bus') || v.name.toLowerCase().includes('tempo')) cat = 'TEMPO_TRAVELLER';
    else if (v.id === 'sedan' || v.name.toLowerCase().includes('sedan')) cat = 'SEDAN';

    const params = new URLSearchParams({
      tripType: 'ONE_WAY',
      category: cat,
      vehicleName: v.name,
      passengers: v.id === 'suv' ? '6' : v.id === 'minibus' ? '12' : '4',
    });

    navigate(`/fare?${params.toString()}`);
  };

  return (
    <section id="vehicles" className="section-padding bg-cool-gray" style={{ position: 'relative' }}>
      <div className="container">
        {/* Lovable Header */}
        <div className="lovable-section-header reveal">
          <div className="lovable-badge">
            <Car size={14} />
            <span>{fleetData.badge}</span>
          </div>
          <h2 className="lovable-title">
            {fleetData.title}
          </h2>
          <p className="lovable-subtitle">
            {fleetData.subtitle}
          </p>
          <div className="lovable-divider">
            <div className="lovable-divider-line"></div>
            <div className="lovable-divider-dot"></div>
            <div className="lovable-divider-line right"></div>
          </div>
        </div>

        {/* Vehicles Cards Grid */}
        <div className="vehicles-grid">
          {vehicles.map((v, idx) => (
            <div key={v.id} className={`vehicle-card reveal stagger-${(idx % 3) + 1}`}>
              {/* Vehicle Image Container */}
              <div className="vehicle-img-wrapper">
                <img
                  src={v.image}
                  alt={`${v.name} cab rental with chauffeur by AJ Travels`}
                  className="vehicle-img"
                  loading="lazy"
                />
                <div className="vehicle-img-overlay"></div>
                {v.tag && <span className="vehicle-gold-tag">{v.tag}</span>}
              </div>

              {/* Vehicle Content Body */}
              <div className="vehicle-body">
                <span className="vehicle-category-label">{v.category}</span>
                <h3 className="vehicle-title">{v.name}</h3>

                {/* Specs Row */}
                <div className="vehicle-specs-row">
                  <div className="spec-badge-pill">
                    <Users size={14} color="#2563EB" />
                    <span>{v.passengers}</span>
                  </div>
                  <div className="spec-badge-pill">
                    <Briefcase size={14} color="#2563EB" />
                    <span>{v.luggage}</span>
                  </div>
                </div>

                {/* Features List */}
                <div className="vehicle-features-list">
                  {v.features.map((feat, i) => (
                    <span key={i} className="feat-chip">
                      <CheckCircle2 size={12} color="#2563EB" /> {feat}
                    </span>
                  ))}
                </div>

                <p className="vehicle-ideal-text">
                  <strong>Ideal for:</strong> {v.idealFor}
                </p>

                {/* Action Buttons Row */}
                <div style={{ display: 'flex', gap: '0.65rem', marginTop: '1.25rem' }}>
                  <button
                    type="button"
                    onClick={() => handleBookVehicle(v)}
                    className="vehicle-btn"
                    style={{ cursor: 'pointer', border: 'none', flex: 1 }}
                  >
                    <Car size={16} />
                    <span>CHECK FARE & BOOK</span>
                    <ArrowRight size={15} />
                  </button>
                  {v.url && (
                    <Link
                      to={v.url}
                      className="vehicle-detail-link"
                      title={`View specifications for ${v.name}`}
                    >
                      <span>Specs</span>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .campaign-title-desc {
          font-size: 1.05rem;
          color: #64748B;
          max-width: 680px;
          margin: 0.4rem auto 0 auto;
        }

        .vehicles-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.75rem;
          margin-top: 2rem;
        }

        .vehicle-card {
          background: #FFFFFF;
          border-radius: 20px;
          overflow: hidden;
          border: 1.5px solid #DCE3EB;
          display: flex;
          flex-direction: column;
          box-shadow: 0 4px 16px rgba(15, 23, 42, 0.05);
          transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .vehicle-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 16px 36px rgba(15, 23, 42, 0.1);
          border-color: #93C5FD;
        }

        .vehicle-img-wrapper {
          position: relative;
          height: 210px;
          overflow: hidden;
          background: #F8FAFC;
        }

        .vehicle-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }

        .vehicle-card:hover .vehicle-img {
          transform: scale(1.05);
        }

        .vehicle-img-overlay {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(180deg, transparent 65%, rgba(15, 23, 42, 0.35) 100%);
        }

        .vehicle-gold-tag {
          position: absolute;
          top: 0.85rem;
          right: 0.85rem;
          background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
          color: #FFFFFF;
          font-family: var(--font-heading);
          font-size: 0.72rem;
          font-weight: 800;
          padding: 0.35rem 0.85rem;
          border-radius: 9999px;
          letter-spacing: 0.04em;
          border: 1px solid rgba(147, 197, 253, 0.3);
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
          z-index: 2;
        }

        .vehicle-body {
          padding: 1.4rem;
          display: flex;
          flex-direction: column;
          flex-grow: 1;
        }

        .vehicle-category-label {
          font-size: 0.75rem;
          font-weight: 700;
          color: #2563EB;
          letter-spacing: 0.06em;
          margin-bottom: 0.25rem;
          text-transform: uppercase;
        }

        .vehicle-title {
          font-size: 1.35rem;
          font-weight: 800;
          color: #17324D;
          margin-bottom: 0.85rem;
          letter-spacing: -0.01em;
        }

        .vehicle-specs-row {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 0.95rem;
          flex-wrap: wrap;
        }

        .spec-badge-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          background: #EFF6FF;
          border: 1px solid #BFDBFE;
          padding: 0.35rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.78rem;
          font-weight: 700;
          color: #1D4ED8;
        }

        .vehicle-features-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.45rem;
          margin-bottom: 0.95rem;
        }

        .feat-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.75rem;
          font-weight: 600;
          color: #475569;
          background: #F8FAFC;
          padding: 0.3rem 0.6rem;
          border-radius: 6px;
          border: 1px solid #E2E8F0;
        }

        .vehicle-ideal-text {
          font-size: 0.82rem;
          color: #64748B;
          margin-bottom: 1.35rem;
          line-height: 1.5;
          flex-grow: 1;
        }

        .vehicle-ideal-text strong {
          color: #17324D;
        }

        .vehicle-btn {
          font-family: var(--font-heading);
          font-size: 0.88rem;
          font-weight: 800;
          letter-spacing: 0.03em;
          padding: 0.85rem 1.25rem;
          background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
          color: #FFFFFF !important;
          border-radius: 12px;
          border: 1px solid rgba(147, 197, 253, 0.25);
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.55rem;
          text-decoration: none;
          transition: all 0.25s ease;
          margin-top: auto;
        }

        .vehicle-btn:hover {
          background: linear-gradient(135deg, #1D4ED8 0%, #172554 100%);
          box-shadow: 0 8px 24px rgba(37, 99, 235, 0.45);
          transform: translateY(-2px);
        }

        .vehicle-detail-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0 1rem;
          background: #EFF6FF;
          border: 1.5px solid #BFDBFE;
          color: #1D4ED8;
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.82rem;
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .vehicle-detail-link:hover {
          background: #DBEAFE;
          color: #1E40AF;
          transform: translateY(-2px);
        }


        @media (max-width: 1024px) {
          .vehicles-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .vehicles-grid {
            display: flex;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            gap: 1rem;
            padding: 0.5rem 0.25rem 1rem;
            margin-top: 1rem;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }
          .vehicles-grid::-webkit-scrollbar {
            display: none;
          }
          .vehicle-card {
            flex: 0 0 84%;
            max-width: 310px;
            scroll-snap-align: start;
            border-radius: 16px;
          }
          .vehicle-img-wrapper {
            height: 140px;
          }
          .vehicle-body {
            padding: 1rem 1.1rem;
          }
          .vehicle-title {
            font-size: 1.25rem;
            margin-bottom: 0.5rem;
          }
          .vehicle-ideal-text {
            font-size: 0.78rem;
            margin-bottom: 0.85rem;
          }
          .vehicle-btn {
            padding: 0.65rem 1rem;
            font-size: 0.82rem;
          }
        }
      `}</style>
    </section>
  );
};
