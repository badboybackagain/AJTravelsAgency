import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { EnquiryModal } from '../components/EnquiryModal';
import { MobileStickyBar } from '../components/MobileStickyBar';
import { usePageSeo } from '../hooks/usePageSeo';
import { vehiclesData } from '../data/vehiclesData';
import { vehicleApi } from '../services/api';
import { resolveMediaUrl, findMatchingDbVehicle, getCanonicalTemplateForDbVehicle } from '../utils/mediaUtils';
import { 
  Car, 
  Users, 
  Briefcase, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles,
  ShieldCheck,
  Zap,
  AlertCircle,
  RotateCcw
} from 'lucide-react';

export function VehiclesPage() {
  usePageSeo(
    'vehicles',
    'Rental Cars & Tempo Travellers in Pune | Fleet Options - AJ Travels',
    'Hire rental cars with driver in Pune: Swift Dzire, 6-seater Ertiga, Toyota Innova Crysta, and luxury 13 to 20-seater Force Tempo Travellers for outstation & airport trips.',
    'https://ajtravelspune.com/vehicles/'
  );

  const navigate = useNavigate();
  const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);
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
        console.warn('VehiclesPage: Failed to load dynamic fleet:', err?.message);
        setError('Unable to load fleet vehicles at this time.');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchFleet();
  }, []);

  const handleBookVehicle = (v) => {
    const params = new URLSearchParams({
      tripType: 'ONE_WAY',
      category: v.category,
      vehicleId: v.id || '',
      vehicleName: v.name
    });
    navigate(`/fare?${params.toString()}`);
  };

  // Authoritative fleet list: live active DB vehicles only (no stale fallback)
  const displayedVehicles = dbVehicles.map(db => {
    const canonical = getCanonicalTemplateForDbVehicle(db, vehiclesData);
    const slug = canonical?.slug || db.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || db.id;

    const categoryFallback = (
      db.category === 'SUV' ? '/assets/suv.webp' :
      db.category === 'LUXURY' ? '/assets/luxury.jpg' :
      db.category === 'MINIBUS' ? '/assets/minibus.jpg' :
      db.category === 'HATCHBACK' ? '/assets/hatchback.jpg' :
      '/assets/sedan.webp'
    );

    const cardImage = resolveMediaUrl(db.image, canonical?.image || categoryFallback);

    // Price logic:
    // 1. If active route fares exist in DB for this vehicle, display lowest base fare
    // 2. If canonical template has known teaser fare, use it
    // 3. For any custom vehicle with no DB fares yet, display "On Request"
    const displayStartingFare = db.startingBaseFare
      ? `₹${db.startingBaseFare.toLocaleString()}`
      : (canonical?.fareStarting || 'On Request');

    return {
      id: db.id,
      slug,
      name: db.name, // DB source of truth
      category: db.category, // DB source of truth
      seatingCapacity: db.seatingCapacity, // DB source of truth
      passengers: `${db.seatingCapacity} Passengers`,
      image: cardImage,
      tag: canonical?.tag || (db.category === 'LUXURY' ? 'SUPREME COMFORT' : 'FLEET ADDITION'),
      models: db.description || canonical?.models || `${db.name} Fleet`,
      luggage: canonical?.luggage || (db.seatingCapacity <= 4 ? '2-3 Medium Bags' : db.seatingCapacity <= 7 ? '4-5 Large Bags' : '10+ Big Bags'),
      overview: db.description || canonical?.overview || `Commercial AC ${db.name} with certified highway chauffeur.`,
      features: canonical?.features || [
        'Dual Air-Conditioning with rapid cooling',
        'Plush ergonomic seating with ample legroom',
        'Experienced, background-verified highway chauffeur',
        'All-inclusive toll package available'
      ],
      displayStartingFare,
    };
  });

  return (
    <div className="vehicles-page-wrapper">
      <Header onOpenEnquiry={() => setIsEnquiryOpen(true)} isDark={false} />

      {/* Internal Hero Banner */}
      <section className="internal-hero-section">
        <div className="container">
          <div className="breadcrumbs-nav">
            <Link to="/">Home</Link>
            <span className="bc-sep">/</span>
            <span className="bc-current">Fleet & Vehicles</span>
          </div>

          <div className="internal-hero-content">
            <div className="hero-badge-pill">
              <Sparkles size={14} />
              <span>COMMERCIAL LICENSED CHAUFFEURED FLEET</span>
            </div>
            <h1 className="internal-hero-title">
              Chauffeur-Driven Cars & <span className="text-gradient">Tempo Travellers in Pune</span>
            </h1>
            <p className="internal-hero-subtitle">
              Every vehicle in our fleet is fully licensed, sanitized prior to each departure, and driven by a courteous, background-verified highway chauffeur.
            </p>
          </div>
        </div>
      </section>

      {/* Fleet Catalogue Grid */}
      <section className="vehicles-main-section">
        <div className="container">
          {/* Fleet Catalogue Grid / Skeletons / Error States */}
          {loading ? (
            <div className="fleet-cards-grid" aria-busy="true" aria-label="Loading fleet catalogue">
              {[1, 2, 3, 4, 5, 6].map(n => (
                <div key={n} className="fleet-card fleet-card-skeleton">
                  <div className="fleet-img-wrapper fleet-skeleton-box fleet-skeleton-img"></div>
                  <div className="fleet-card-body">
                    <div className="fleet-skeleton-box fleet-skeleton-cat"></div>
                    <div className="fleet-skeleton-box fleet-skeleton-title"></div>
                    <div className="fleet-skeleton-box fleet-skeleton-subtitle"></div>
                    <div className="fleet-capacities-row" style={{ marginTop: '0.85rem' }}>
                      <div className="fleet-skeleton-box fleet-skeleton-pill"></div>
                      <div className="fleet-skeleton-box fleet-skeleton-pill"></div>
                    </div>
                    <div className="fleet-skeleton-box fleet-skeleton-text" style={{ marginTop: '1.1rem', width: '92%' }}></div>
                    <div className="fleet-skeleton-box fleet-skeleton-text" style={{ marginTop: '0.4rem', width: '75%' }}></div>
                    <div className="fleet-features-preview" style={{ marginTop: '1.1rem' }}>
                      <div className="fleet-skeleton-box fleet-skeleton-feat"></div>
                      <div className="fleet-skeleton-box fleet-skeleton-feat"></div>
                    </div>
                    <div className="fleet-footer-row" style={{ marginTop: '1.5rem', paddingTop: '1rem' }}>
                      <div className="fleet-skeleton-box fleet-skeleton-price"></div>
                      <div className="fleet-skeleton-box fleet-skeleton-btn"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : error && dbVehicles.length === 0 ? (
            <div className="fleet-error-container">
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
                className="fleet-retry-btn"
              >
                <RotateCcw size={16} />
                <span>Retry Fleet Catalogue</span>
              </button>
            </div>
          ) : (
            <div className="fleet-cards-grid">
              {displayedVehicles.map(v => {
                return (
                <div key={v.id || v.slug} className="fleet-card">
                  <div className="fleet-img-wrapper">
                    <img
                      src={v.image}
                      alt={v.name}
                      className="fleet-car-img"
                      loading="lazy"
                      onError={(e) => {
                        e.target.src = '/assets/sedan.webp';
                      }}
                    />
                    <span className="fleet-tag-chip">{v.tag}</span>
                  </div>

                  <div className="fleet-card-body">
                    <div className="fleet-cat-eyebrow">{v.category}</div>
                    <h2 className="fleet-car-title">
                      <Link to={`/vehicles/${v.slug}`}>{v.name}</Link>
                    </h2>
                    <p className="fleet-models-txt">{v.models}</p>

                    <div className="fleet-capacities-row">
                      <div className="cap-pill">
                        <Users size={14} color="#2563EB" />
                        <span>{v.passengers}</span>
                      </div>
                      <div className="cap-pill">
                        <Briefcase size={14} color="#2563EB" />
                        <span>{v.luggage}</span>
                      </div>
                    </div>

                    <p className="fleet-overview-blurb">{v.overview}</p>

                    <div className="fleet-features-preview">
                      {(v.features || []).slice(0, 3).map((f, i) => (
                        <div key={i} className="feat-line">
                          <CheckCircle2 size={14} color="#10B981" />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>

                    <div className="fleet-footer-row">
                      <div className="fleet-price-box">
                        <span className="rate-lbl">STARTING FROM</span>
                        <strong className="rate-val">{v.displayStartingFare}*</strong>
                      </div>

                      <div className="fleet-btns-group">
                        <button 
                          type="button" 
                          onClick={() => handleBookVehicle(v)}
                          className="btn-book-fleet"
                        >
                          <Car size={15} />
                          <span>Book Now</span>
                        </button>
                        <Link to={`/vehicles/${v.slug}`} className="btn-details-fleet">
                          <span>Details</span>
                          <ArrowRight size={13} />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          )}

          {/* Fleet Standards Guarantee Box */}
          <div className="fleet-standards-box">
            <div className="standards-icon-box">
              <ShieldCheck size={36} color="#1D4ED8" />
            </div>
            <div className="standards-text">
              <h3>Our Fleet Standards & Safety Protocol</h3>
              <p>
                All vehicles feature functioning speed governors, factory-fitted seatbelts for all passengers, dual air-conditioning, clean interiors, and real-time GPS tracking. We never outsource your trip to unverified third-party aggregators.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <MobileStickyBar onOpenEnquiry={() => setIsEnquiryOpen(true)} />
      <EnquiryModal isOpen={isEnquiryOpen} onClose={() => setIsEnquiryOpen(false)} />

      <style>{`
        .vehicles-page-wrapper {
          min-height: 100vh;
          background: #FFFFFF;
          color: #0F172A;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .internal-hero-section {
          background: linear-gradient(180deg, #F8FAFC 0%, #EFF6FF 100%);
          padding: 2.25rem 0 1.5rem;
          border-bottom: 1px solid #E2E8F0;
        }

        .breadcrumbs-nav {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          color: #64748B;
          margin-bottom: 0.85rem;
        }

        .breadcrumbs-nav a { color: #2563EB; text-decoration: none; font-weight: 500; }
        .bc-sep { color: #94A3B8; }
        .bc-current { color: #0F172A; font-weight: 600; }

        .hero-badge-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          background: rgba(37, 99, 235, 0.1);
          color: #2563EB;
          padding: 0.35rem 0.85rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          margin-bottom: 0.75rem;
        }

        .internal-hero-title {
          font-size: 2.2rem;
          font-weight: 800;
          line-height: 1.2;
          color: #0F172A;
          max-width: 820px;
          margin-bottom: 0.75rem;
        }

        .text-gradient {
          background: linear-gradient(135deg, #1D4ED8 0%, #0284C7 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .internal-hero-subtitle {
          font-size: 1rem;
          line-height: 1.6;
          color: #475569;
          max-width: 760px;
        }

        .vehicles-main-section {
          padding: 2rem 0 4rem;
          background: #F8FAFC;
        }

        
        /* Fleet Loading Skeletons & Shimmer Animation */
        .fleet-skeleton-box {
          background: linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%);
          background-size: 200% 100%;
          animation: fleetShimmer 1.5s infinite;
          border-radius: 6px;
        }

        @keyframes fleetShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .fleet-skeleton-img {
          width: 100%;
          height: 240px;
          border-radius: 0;
        }

        .fleet-skeleton-cat {
          width: 80px;
          height: 12px;
          margin-bottom: 0.5rem;
        }

        .fleet-skeleton-title {
          width: 70%;
          height: 26px;
          margin-bottom: 0.5rem;
        }

        .fleet-skeleton-subtitle {
          width: 45%;
          height: 14px;
        }

        .fleet-skeleton-pill {
          width: 90px;
          height: 28px;
          border-radius: 20px;
        }

        .fleet-skeleton-text {
          height: 13px;
        }

        .fleet-skeleton-feat {
          width: 85%;
          height: 16px;
          margin-bottom: 0.4rem;
        }

        .fleet-skeleton-price {
          width: 100px;
          height: 36px;
          border-radius: 8px;
        }

        .fleet-skeleton-btn {
          width: 120px;
          height: 40px;
          border-radius: 10px;
        }

        .fleet-error-container {
          text-align: center;
          padding: 4rem 1.5rem;
          background: #FEF2F2;
          border: 1px solid #FECACA;
          border-radius: 20px;
          max-width: 600px;
          margin: 2rem auto;
        }

        .fleet-retry-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: #2563EB;
          color: #FFFFFF;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
          transition: background 0.2s;
        }

        .fleet-retry-btn:hover {
          background: #1D4ED8;
        }

        .fleet-cards-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 2.5rem;
          margin-bottom: 4rem;
        }

        .fleet-card {
          background: #FFFFFF;
          border-radius: 20px;
          border: 1px solid #CBD5E1;
          overflow: hidden;
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.05);
          display: flex;
          flex-direction: column;
          transition: all 0.25s ease;
        }

        .fleet-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 36px rgba(15, 23, 42, 0.1);
          border-color: #93C5FD;
        }

        .fleet-img-wrapper {
          position: relative;
          height: 240px;
          overflow: hidden;
          background: #F1F5F9;
        }

        .fleet-car-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.35s ease;
        }

        .fleet-card:hover .fleet-car-img {
          transform: scale(1.05);
        }

        .fleet-tag-chip {
          position: absolute;
          top: 1rem;
          left: 1rem;
          background: rgba(15, 23, 42, 0.85);
          backdrop-filter: blur(6px);
          color: #FFFFFF;
          font-size: 0.68rem;
          font-weight: 800;
          letter-spacing: 0.06em;
          padding: 0.3rem 0.7rem;
          border-radius: 6px;
        }

        .fleet-card-body {
          padding: 2rem;
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .fleet-cat-eyebrow {
          font-size: 0.7rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: #2563EB;
          text-transform: uppercase;
          margin-bottom: 0.3rem;
        }

        .fleet-car-title {
          font-size: 1.45rem;
          font-weight: 800;
          line-height: 1.3;
          margin-bottom: 0.35rem;
        }

        .fleet-car-title a {
          color: #0F172A;
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .fleet-car-title a:hover {
          color: #2563EB;
        }

        .fleet-models-txt {
          font-size: 0.85rem;
          font-weight: 600;
          color: #64748B;
          margin-bottom: 1.1rem;
        }

        .fleet-capacities-row {
          display: flex;
          gap: 0.85rem;
          margin-bottom: 1.25rem;
        }

        .cap-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: #EFF6FF;
          color: #1D4ED8;
          font-size: 0.78rem;
          font-weight: 600;
          padding: 0.35rem 0.75rem;
          border-radius: 6px;
        }

        .fleet-overview-blurb {
          font-size: 0.9rem;
          line-height: 1.6;
          color: #475569;
          margin-bottom: 1.25rem;
          flex: 1;
        }

        .fleet-features-preview {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
          border-top: 1px solid #F1F5F9;
          padding-top: 1rem;
        }

        .feat-line {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.82rem;
          color: #334155;
        }

        .fleet-footer-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-top: 1px solid #E2E8F0;
          padding-top: 1.25rem;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .fleet-price-box {
          display: flex;
          flex-direction: column;
        }

        .rate-lbl {
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 0.06em;
          color: #64748B;
        }

        .rate-val {
          font-size: 1.35rem;
          font-weight: 800;
          color: #0F172A;
          line-height: 1.1;
        }

        .fleet-btns-group {
          display: flex;
          gap: 0.5rem;
        }

        .btn-book-fleet {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          background: #1D4ED8;
          color: #FFFFFF;
          font-size: 0.85rem;
          font-weight: 700;
          padding: 0.65rem 1.15rem;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-book-fleet:hover {
          background: #1E40AF;
        }

        .btn-details-fleet {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          background: #EFF6FF;
          color: #1D4ED8;
          font-size: 0.85rem;
          font-weight: 700;
          padding: 0.65rem 1rem;
          border-radius: 8px;
          text-decoration: none;
          border: 1px solid #BFDBFE;
          transition: all 0.2s ease;
        }

        .btn-details-fleet:hover {
          background: #DBEAFE;
        }

        .fleet-standards-box {
          background: #FFFFFF;
          border-radius: 20px;
          border: 1px solid #CBD5E1;
          padding: 2.5rem;
          display: flex;
          align-items: center;
          gap: 2rem;
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.04);
        }

        .standards-icon-box {
          width: 72px;
          height: 72px;
          border-radius: 18px;
          background: #EFF6FF;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .standards-text h3 {
          font-size: 1.35rem;
          font-weight: 800;
          color: #0F172A;
          margin-bottom: 0.4rem;
        }

        .standards-text p {
          font-size: 0.92rem;
          line-height: 1.6;
          color: #475569;
          margin: 0;
        }

        @media (max-width: 991px) {
          .fleet-cards-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .internal-hero-title {
            font-size: 1.85rem;
          }
          .fleet-standards-box {
            flex-direction: column;
            align-items: flex-start;
            padding: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}
