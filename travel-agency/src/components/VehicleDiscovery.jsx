import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Briefcase, CheckCircle2, Car, ArrowRight } from 'lucide-react';
import { businessConfig } from '../config/business.config';

export const VehicleDiscovery = () => {
  const navigate = useNavigate();

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
    <section id="vehicles" className="section-padding bg-cream">
      <div className="container">
        {/* Campaign Style Centered Title */}
        <div className="campaign-title-block">
          <span className="eyebrow-text">PREMIUM VEHICLE FLEET</span>
          <h2>Choose Your Perfect Ride</h2>
          <p className="campaign-title-desc">
            From comfortable private sedans to spacious SUVs and larger group transportation. All vehicles are sanitized, well-maintained, and operated by professional drivers.
          </p>
          <div className="title-divider" style={{ marginTop: '0.75rem' }}>
            <div className="divider-line"></div>
            <div className="divider-diamond"></div>
            <div className="divider-line"></div>
          </div>
        </div>

        {/* Vehicles Cards Grid */}
        <div className="vehicles-grid">
          {businessConfig.vehicles.map((v) => (
            <div key={v.id} className="vehicle-card card-hover-effect">
              {/* Vehicle Image Container */}
              <div className="vehicle-img-wrapper">
                <img
                  src={v.image}
                  alt={`Pune to Mumbai ${v.name} private taxi car`}
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
                    <Users size={14} color="#C89B3C" />
                    <span>{v.passengers}</span>
                  </div>
                  <div className="spec-badge-pill">
                    <Briefcase size={14} color="#C89B3C" />
                    <span>{v.luggage}</span>
                  </div>
                </div>

                {/* Features List */}
                <div className="vehicle-features-list">
                  {v.features.map((feat, idx) => (
                    <span key={idx} className="feat-chip">
                      <CheckCircle2 size={12} color="#C89B3C" /> {feat}
                    </span>
                  ))}
                </div>

                <p className="vehicle-ideal-text">
                  <strong>Ideal for:</strong> {v.idealFor}
                </p>

                {/* Full-width Action Button navigating to /fare */}
                <button
                  type="button"
                  onClick={() => handleBookVehicle(v)}
                  className="btn btn-whatsapp btn-full vehicle-btn"
                  style={{ cursor: 'pointer', border: 'none' }}
                >
                  <Car size={16} />
                  <span>BOOK {v.name.toUpperCase()}</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .campaign-title-desc {
          font-size: 1.05rem;
          color: var(--text-muted);
          max-width: 680px;
          margin: 0.4rem auto 0 auto;
        }

        .vehicles-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.75rem;
          margin-top: 1.5rem;
        }

        .vehicle-card {
          background: #FFFFFF;
          border-radius: 20px;
          overflow: hidden;
          border: 1px solid var(--border-beige);
          display: flex;
          flex-direction: column;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .vehicle-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(7, 17, 31, 0.12);
          border-color: var(--accent-gold-soft);
        }

        .vehicle-img-wrapper {
          position: relative;
          height: 220px;
          overflow: hidden;
          background: var(--bg-dark-navy);
        }

        .vehicle-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }

        .vehicle-card:hover .vehicle-img {
          transform: scale(1.06);
        }

        .vehicle-img-overlay {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(180deg, transparent 40%, rgba(7, 17, 31, 0.75) 100%);
        }

        .vehicle-gold-tag {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: linear-gradient(135deg, #F3D079 0%, #C89B3C 100%);
          color: #07111F;
          font-family: var(--font-heading);
          font-size: 0.75rem;
          font-weight: 800;
          padding: 0.4rem 0.9rem;
          border-radius: 9999px;
          letter-spacing: 0.03em;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
          z-index: 2;
        }

        .vehicle-body {
          padding: 1.5rem 1.6rem 1.6rem 1.6rem;
          display: flex;
          flex-direction: column;
          flex-grow: 1;
        }

        .vehicle-category-label {
          font-size: 0.78rem;
          font-weight: 700;
          color: #9C721D;
          letter-spacing: 0.04em;
          margin-bottom: 0.25rem;
          text-transform: uppercase;
        }

        .vehicle-title {
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--bg-dark-navy);
          margin-bottom: 0.85rem;
          letter-spacing: -0.01em;
        }

        .vehicle-specs-row {
          display: flex;
          gap: 0.6rem;
          margin-bottom: 1rem;
          flex-wrap: wrap;
        }

        .spec-badge-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: #F3F4F6;
          padding: 0.4rem 0.85rem;
          border-radius: 9999px;
          font-size: 0.8rem;
          font-weight: 700;
          color: #374151;
        }

        .vehicle-features-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.45rem;
          margin-bottom: 1.1rem;
        }

        .feat-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          font-size: 0.78rem;
          font-weight: 600;
          color: #4B5563;
          background: #F9FAFB;
          padding: 0.3rem 0.65rem;
          border-radius: 8px;
          border: 1px solid #E5E7EB;
        }

        .vehicle-ideal-text {
          font-size: 0.83rem;
          color: #6B7280;
          margin-bottom: 1.5rem;
          line-height: 1.5;
          flex-grow: 1;
        }

        .vehicle-btn {
          font-family: var(--font-heading);
          font-size: 0.9rem;
          font-weight: 800;
          letter-spacing: 0.03em;
          padding: 0.85rem 1.25rem;
          background: #25D366;
          color: #FFFFFF !important;
          border-radius: 12px;
          border: none;
          box-shadow: 0 4px 16px rgba(37, 211, 102, 0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          text-decoration: none;
          transition: all 0.25s ease;
          margin-top: auto;
        }

        .vehicle-btn:hover {
          background: #1EBE57;
          box-shadow: 0 8px 22px rgba(37, 211, 102, 0.45);
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
