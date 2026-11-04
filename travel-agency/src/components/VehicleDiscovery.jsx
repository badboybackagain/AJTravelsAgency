import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Users, Briefcase, CheckCircle2, Car, ArrowRight, AlertCircle, RotateCcw } from 'lucide-react';
import { buildFareUrl } from '../utils/fareNavigation';
import { homepageContent } from '../data/homepageContent';
import { vehicleApi } from '../services/api';
import { resolveMediaUrl, findMatchingDbVehicle, getCanonicalTemplateForDbVehicle } from '../utils/mediaUtils';
import { vehiclesData } from '../data/vehiclesData';

export const VehicleDiscovery = () => {
  const navigate = useNavigate();
  const fleetData = homepageContent.fleet;
  const [dbVehicles, setDbVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchFleet = (forceRefresh = false) => {
    setLoading(true);
    setError('');
    vehicleApi.getAll({ forceRefresh })
      .then(res => {
        if (res.data?.data) {
          setDbVehicles(res.data.data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.warn('VehicleDiscovery: Failed to load dynamic fleet:', err?.message);
        setError('Unable to load fleet vehicles at this time.');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchFleet();
  }, []);

  const handleBookVehicle = (v) => {
    const fareUrl = buildFareUrl({
      tripType: 'ONE_WAY',
      category: v.category,
      vehicleId: v.id || '',
      vehicleName: v.name,
      passengers: String(v.seatingCapacity || (v.category === 'SUV' ? 6 : v.category === 'MINIBUS' ? 12 : 4)),
    });

    navigate(fareUrl);
  };

  // Authoritative fleet list: live active DB vehicles only (no stale hardcoded fallback)
  const displayedVehicles = dbVehicles.map(db => {
    const canonical = getCanonicalTemplateForDbVehicle(db, vehiclesData);
    const staticMatch = canonical ? findMatchingDbVehicle(canonical, fleetData.vehicles || []) : null;

    const slug = canonical?.slug
      ? `/vehicles/${canonical.slug}`
      : staticMatch?.url
      ? staticMatch.url
      : `/vehicles/${db.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || db.id}`;

    const categoryFallback = (
      db.category === 'SUV' ? '/assets/suv.webp' :
      db.category === 'LUXURY' ? '/assets/luxury.jpg' :
      db.category === 'MINIBUS' ? '/assets/minibus.jpg' :
      db.category === 'HATCHBACK' ? '/assets/hatchback.jpg' :
      '/assets/sedan.webp'
    );

    const activeImg = resolveMediaUrl(db.image, canonical?.image || staticMatch?.image || categoryFallback);

    return {
      id: db.id,
      name: db.name, // DB source of truth
      category: db.category, // DB source of truth
      seatingCapacity: db.seatingCapacity, // DB source of truth
      passengers: `${db.seatingCapacity} Passengers`,
      luggage: canonical?.luggage || staticMatch?.luggage || (db.seatingCapacity <= 4 ? '2 Medium Bags' : '4 Large Bags'),
      features: canonical?.features || staticMatch?.features || ['Dual Air-Conditioning', 'Generous Legroom', 'USB Phone Charging', 'Experienced Highway Driver'],
      idealFor: db.description || canonical?.idealFor || staticMatch?.idealFor || `Comfortable ${db.name} rental in Pune with verified chauffeur.`,
      image: activeImg,
      tag: canonical?.tag || (db.category === 'LUXURY' ? 'Executive Class' : 'Fleet Addition'),
      url: slug,
      rawDb: db,
    };
  });

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

        {/* Vehicles Cards Grid / Skeleton / Error States */}
        {loading ? (
          <div className="vehicles-grid" aria-busy="true" aria-label="Loading verified vehicles">
            {[1, 2, 3, 4, 5, 6].map(n => (
              <div key={n} className="vehicle-card vehicle-card-skeleton">
                <div className="vehicle-img-wrapper veh-skeleton-box veh-skeleton-img"></div>
                <div className="vehicle-body">
                  <div className="veh-skeleton-box veh-skeleton-cat"></div>
                  <div className="veh-skeleton-box veh-skeleton-title"></div>
                  <div className="vehicle-specs-row" style={{ marginTop: '0.85rem' }}>
                    <div className="veh-skeleton-box veh-skeleton-pill"></div>
                    <div className="veh-skeleton-box veh-skeleton-pill"></div>
                  </div>
                  <div className="vehicle-features-list" style={{ marginTop: '0.85rem' }}>
                    <div className="veh-skeleton-box veh-skeleton-chip"></div>
                    <div className="veh-skeleton-box veh-skeleton-chip"></div>
                  </div>
                  <div className="veh-skeleton-box veh-skeleton-text" style={{ marginTop: '1.1rem', width: '90%' }}></div>
                  <div className="veh-skeleton-box veh-skeleton-text" style={{ marginTop: '0.35rem', width: '70%' }}></div>
                  <div className="veh-skeleton-box veh-skeleton-btn" style={{ marginTop: '1.25rem' }}></div>
                </div>
              </div>
            ))}
          </div>
        ) : error && dbVehicles.length === 0 ? (
          <div className="vehicle-discovery-error-box">
            <AlertCircle size={40} color="#DC2626" style={{ margin: '0 auto 0.75rem' }} />
            <h3 style={{ color: '#991B1B', fontWeight: 800, fontSize: '1.25rem', marginBottom: '0.35rem' }}>
              Fleet Catalogue Temporarily Unavailable
            </h3>
            <p style={{ color: '#64748B', fontSize: '0.92rem', maxWidth: '440px', margin: '0 auto 1.25rem', lineHeight: 1.5 }}>
              We were unable to load live vehicle details. Please retry to refresh the fleet data.
            </p>
            <button
              type="button"
              onClick={() => fetchFleet(true)}
              className="vehicle-discovery-retry-btn"
            >
              <RotateCcw size={16} />
              <span>Retry Fleet Loading</span>
            </button>
          </div>
        ) : (
          <div className="vehicles-grid">
            {displayedVehicles.map((v, idx) => {
              return (
              <div key={v.id || idx} className={`vehicle-card reveal stagger-${(idx % 3) + 1}`}>
                {/* Vehicle Image Container */}
                <div className="vehicle-img-wrapper">
                  <img
                    src={v.image}
                    alt={`${v.name} cab rental with chauffeur by AJ Travels`}
                    className="vehicle-img"
                    loading="lazy"
                    onError={(e) => {
                      e.target.src = '/assets/sedan.webp';
                    }}
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
                    {(v.features || []).map((feat, i) => (
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
                      <span>Check Fare & Book</span>
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
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        /* Fleet Loading Skeletons & Shimmer Animation */
        .veh-skeleton-box {
          background: linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%);
          background-size: 200% 100%;
          animation: vehShimmer 1.5s infinite;
          border-radius: 6px;
        }

        @keyframes vehShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .veh-skeleton-img {
          width: 100%;
          height: 210px;
          border-radius: 0;
        }

        .veh-skeleton-cat {
          width: 70px;
          height: 13px;
        }

        .veh-skeleton-title {
          width: 70%;
          height: 22px;
          margin-top: 0.5rem;
        }

        .veh-skeleton-pill {
          width: 85px;
          height: 28px;
          border-radius: 20px;
        }

        .veh-skeleton-chip {
          width: 130px;
          height: 22px;
          border-radius: 12px;
        }

        .veh-skeleton-text {
          height: 12px;
        }

        .veh-skeleton-btn {
          width: 100%;
          height: 44px;
          border-radius: 8px;
        }

        .vehicle-discovery-error-box {
          text-align: center;
          padding: 3.5rem 1.5rem;
          background: #FEF2F2;
          border: 1px solid #FECACA;
          border-radius: 16px;
          max-width: 580px;
          margin: 2rem auto;
        }

        .vehicle-discovery-retry-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: #2563EB;
          color: #FFFFFF;
          border: none;
          padding: 0.7rem 1.4rem;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.88rem;
          cursor: pointer;
          transition: background 0.2s;
        }

        .vehicle-discovery-retry-btn:hover {
          background: #1D4ED8;
        }

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
          font-weight: 600;
          padding: 0.35rem 0.85rem;
          border-radius: 9999px;
          letter-spacing: 0.03em;
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
          font-weight: 550;
          color: #2563EB;
          letter-spacing: 0.05em;
          margin-bottom: 0.25rem;
          text-transform: uppercase;
        }

        .vehicle-title {
          font-size: 1.3rem;
          font-weight: 650;
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
          font-weight: 550;
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
          font-weight: 450;
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
          font-weight: 600;
        }

        .vehicle-btn {
          font-family: var(--font-heading);
          font-size: 0.85rem;
          font-weight: 600;
          letter-spacing: 0.02em;
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
            gap: 0.85rem;
            padding: 0.5rem 0.25rem 0.85rem;
            margin-top: 0.75rem;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }
          .vehicles-grid::-webkit-scrollbar {
            display: none;
          }
          .vehicle-card {
            flex: 0 0 85%;
            max-width: 310px;
            scroll-snap-align: start;
            border-radius: 16px;
          }
          .vehicle-img-wrapper {
            height: 130px;
          }
          .vehicle-body {
            padding: 0.75rem 0.85rem 0.85rem;
          }
          .vehicle-title {
            font-size: 1.15rem;
            margin-bottom: 0.35rem;
          }
          .vehicle-specs-row {
            gap: 0.35rem;
            margin-bottom: 0.55rem;
          }
          .spec-badge-pill {
            padding: 0.22rem 0.55rem;
            font-size: 0.72rem;
          }
          /* Solution 1: Compact 2-column clean checklist without box-inside-box */
          .vehicle-features-list {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.35rem 0.5rem;
            margin-bottom: 0.65rem;
          }
          .feat-chip {
            display: inline-flex;
            align-items: flex-start;
            gap: 0.3rem;
            font-size: 0.71rem;
            line-height: 1.25;
            color: #334155;
            background: transparent;
            border: none;
            padding: 0;
            border-radius: 0;
          }
          .feat-chip svg {
            flex-shrink: 0;
            margin-top: 1px;
          }
          .vehicle-ideal-text {
            font-size: 0.73rem;
            line-height: 1.35;
            margin-bottom: 0.65rem;
            color: #64748B;
          }
          .vehicle-btn {
            padding: 0.6rem 0.85rem;
            font-size: 0.8rem;
          }
          .vehicle-detail-link {
            padding: 0 0.85rem;
            font-size: 0.78rem;
          }
        }
      `}</style>
    </section>
  );
};
