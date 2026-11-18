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

// Helper: Normalize vehicle feature points into concise single points
const formatFeaturePoint = (feat) => {
  if (!feat) return '';
  const lower = feat.toLowerCase();
  if (lower.includes('dual air-conditioning') || lower.includes('dual ac') || lower.includes('chilled air')) return 'Dual AC';
  if (lower.includes('roof-mounted') || lower.includes('rear ac')) return 'Rear AC Vents';
  if (lower.includes('378l') || lower.includes('boot space') || lower.includes('luggage room') || lower.includes('luggage deck')) {
    if (lower.includes('378l')) return '378L+ Boot';
    return 'Large Boot';
  }
  if (lower.includes('plush') || lower.includes('leatherette') || lower.includes('captain') || lower.includes('seating') || lower.includes('legroom')) return 'Plush Seating';
  if (lower.includes('charging') || lower.includes('usb')) return 'USB Charging';
  if (lower.includes('toll')) return 'Tolls Included';
  if (lower.includes('suspension')) return 'Ghat Suspension';
  if (lower.includes('folding 3rd-row') || lower.includes('flexible') || lower.includes('folding 3rd row')) return 'Folding 3rd Row';
  if (lower.includes('door-to-door') || lower.includes('doorstep')) return 'Doorstep Pickup';
  if (lower.includes('driver') || lower.includes('chauffeur')) return 'Verified Driver';
  if (lower.includes('whisper-quiet') || lower.includes('acoustic') || lower.includes('quiet cabin')) return 'Quiet Cabin';
  if (lower.includes('climate control')) return 'Climate AC';
  if (lower.includes('stability')) return 'Ride Stability';
  if (lower.includes('pushback')) return 'Pushback Seats';
  if (lower.includes('permit')) return 'Tourist Permit';
  if (lower.includes('tv') || lower.includes('music')) return 'Music System';
  if (lower.includes('compact') || lower.includes('fuel-efficient')) return 'Fuel Efficient';

  if (feat.length <= 18) return feat;
  const firstPhrase = feat.split(/ with | for | keeping | optimizing | accustomed /i)[0];
  return firstPhrase.length <= 18 ? firstPhrase : firstPhrase.slice(0, 16).trim();
};

const cleanIdealFor = (text) => {
  if (!text) return '';
  if (text.includes('|')) {
    const parts = text.split('|').map(s => s.trim()).filter(Boolean);
    const bestPart = parts.find(p => p.toLowerCase().startsWith('best for') || p.toLowerCase().startsWith('ideal for')) || parts[parts.length - 1];
    return bestPart;
  }
  if (text.toLowerCase().includes('in pune for')) {
    const after = text.split(/in pune for/i)[1].trim();
    return after.charAt(0).toUpperCase() + after.slice(1);
  }
  return text;
};

export function VehiclesPage() {
  usePageSeo(
    'vehicles',
    'Rental Cars & Tempo Travellers in Pune | Fleet Options - AJ Travels',
    'Hire rental cars with driver in Pune: Swift Dzire, 6-seater Ertiga, Toyota Innova Crysta, and luxury 13 to 20-seater Force Tempo Travellers for outstation & airport trips.',
    'https://ajtravelsagency.vercel.app/vehicles/'
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
        if (res.data?.data && res.data.data.length > 0) {
          setDbVehicles(res.data.data);
        } else {
          setDbVehicles(vehiclesData);
        }
        setLoading(false);
      })
      .catch(err => {
        console.warn('VehiclesPage: Using verified fleet template fallback:', err?.message);
        setDbVehicles(vehiclesData);
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

  // Authoritative fleet list with reliable fallback
  const effectiveFleet = (dbVehicles && dbVehicles.length > 0) ? dbVehicles : vehiclesData;

  const displayedVehicles = effectiveFleet.map(item => {
    const isDb = Boolean(item.createdAt || item.updatedAt || (item.seatingCapacity !== undefined && !item.slug));
    const db = isDb ? item : null;
    const staticItem = isDb ? null : item;
    const canonical = db ? getCanonicalTemplateForDbVehicle(db, vehiclesData) : staticItem;

    const slug = canonical?.slug || (db ? db.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : item.id) || item.id;

    const categoryFallback = (
      item.category === 'SUV' ? '/assets/suv.webp' :
      item.category === 'LUXURY' ? '/assets/luxury.jpg' :
      item.category === 'MINIBUS' ? '/assets/minibus.jpg' :
      item.category === 'HATCHBACK' ? '/assets/hatchback.jpg' :
      '/assets/sedan.webp'
    );

    const cardImage = resolveMediaUrl(item.image, canonical?.image || categoryFallback);

    const displayStartingFare = item.startingBaseFare
      ? `₹${item.startingBaseFare.toLocaleString()}`
      : (canonical?.fareStarting || item.fareStarting || 'On Request');

    const models = canonical?.models || item.models || `${item.name} Fleet`;
    const idealFor = item.idealFor || canonical?.idealFor || (db?.description ? db.description : canonical?.overview) || `Commercial AC ${item.name} with certified highway chauffeur.`;

    const rawFeatures = canonical?.features || item.features || [
      'Dual Air-Conditioning',
      'Plush Seating',
      'Large Boot Space',
      'USB Mobile Charging'
    ];

    return {
      id: item.id || slug,
      slug,
      name: item.name,
      category: item.category,
      seatingCapacity: item.seatingCapacity || 4,
      passengers: item.passengers || `${item.seatingCapacity || 4} Passengers`,
      image: cardImage,
      tag: canonical?.tag || (item.category === 'LUXURY' ? 'SUPREME COMFORT' : 'FLEET ADDITION'),
      models,
      luggage: canonical?.luggage || item.luggage || (item.seatingCapacity <= 4 ? '2-3 Medium Bags' : '4 Large Bags'),
      idealFor,
      features: rawFeatures,
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
                  </div>

                  <div className="fleet-card-body">
                    <div className="fleet-cat-eyebrow">
                      {v.category?.toUpperCase().includes('CATEGORY') ? v.category : `${v.category} CATEGORY`}
                    </div>
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

                    {/* Features List — Clean single points: 4 on desktop, 2 on mobile */}
                    <div className="fleet-features-grid">
                      {(v.features || []).slice(0, 4).map((f, i) => (
                        <div key={i} className={`feat-pill-item ${i >= 2 ? 'hide-on-mobile' : ''}`}>
                          <CheckCircle2 size={13} color="#2563EB" />
                          <span>{formatFeaturePoint(f)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Single Ideal For Line — Never duplicated */}
                    <p className="fleet-ideal-line">
                      <strong>Ideal for:</strong> {cleanIdealFor(v.idealFor)}
                    </p>

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
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
          margin-bottom: 3rem;
        }

        .fleet-card {
          background: #FFFFFF;
          border-radius: 18px;
          border: 1px solid #E2E8F0;
          overflow: hidden;
          box-shadow: 0 4px 18px rgba(15, 23, 42, 0.05);
          display: flex;
          flex-direction: column;
          transition: all 0.25s ease;
        }

        .fleet-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 28px rgba(15, 23, 42, 0.08);
          border-color: #BFDBFE;
        }

        .fleet-img-wrapper {
          position: relative;
          height: 185px;
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
          transform: scale(1.04);
        }

        .fleet-tag-chip {
          position: absolute;
          top: 0.75rem;
          left: 0.75rem;
          background: rgba(15, 23, 42, 0.82);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          color: #FFFFFF;
          font-size: 0.68rem;
          font-weight: 800;
          letter-spacing: 0.06em;
          padding: 0.3rem 0.7rem;
          border-radius: 9999px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        .fleet-card-body {
          padding: 1.25rem 1.2rem 1.35rem;
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
          margin-bottom: 0.25rem;
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
          margin-bottom: 0.85rem;
          line-height: 1.35;
        }

        .fleet-capacities-row {
          display: flex;
          gap: 0.45rem;
          margin-bottom: 0.75rem;
          flex-wrap: wrap;
        }

        .cap-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          background: #F1F5F9;
          color: #334155;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          font-size: 0.78rem;
          font-weight: 600;
          padding: 0.35rem 0.7rem;
        }

        .fleet-features-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.4rem;
          padding: 0.55rem 0.75rem;
          margin-bottom: 0.75rem;
          background: #F8FAFC;
          border-radius: 10px;
          border: 1px solid #E2E8F0;
        }

        .feat-pill-item {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.8rem;
          font-weight: 600;
          color: #334155;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .fleet-ideal-line {
          font-size: 0.86rem;
          line-height: 1.5;
          color: #475569;
          margin-bottom: 1rem;
          flex: 1;
        }

        .fleet-ideal-line strong {
          color: #0F172A;
          font-weight: 700;
        }

        .fleet-footer-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-top: 1px solid #F1F5F9;
          padding-top: 0.85rem;
          gap: 0.5rem;
          margin-top: auto;
        }

        .fleet-price-box {
          display: flex;
          flex-direction: column;
          flex-shrink: 0;
        }

        .rate-lbl {
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 0.06em;
          color: #64748B;
          margin-bottom: 0.1rem;
        }

        .rate-val {
          font-size: 1.35rem;
          font-weight: 800;
          color: #0F172A;
          line-height: 1.1;
        }

        .fleet-btns-group {
          display: flex;
          gap: 0.45rem;
          align-items: center;
        }

        .btn-book-fleet {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.35rem;
          background: linear-gradient(135deg, #1D4ED8 0%, #1E40AF 100%);
          color: #FFFFFF;
          font-size: 0.85rem;
          font-weight: 700;
          padding: 0.6rem 0.85rem;
          border-radius: 9px;
          border: none;
          cursor: pointer;
          box-shadow: 0 3px 10px rgba(29, 78, 216, 0.28);
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .btn-book-fleet:hover {
          background: linear-gradient(135deg, #1E40AF 0%, #172554 100%);
          box-shadow: 0 4px 14px rgba(29, 78, 216, 0.4);
          transform: translateY(-1px);
        }

        .btn-details-fleet {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.3rem;
          background: #EFF6FF;
          color: #1D4ED8;
          font-size: 0.85rem;
          font-weight: 700;
          padding: 0.6rem 0.75rem;
          border-radius: 9px;
          text-decoration: none;
          border: 1px solid #BFDBFE;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .btn-details-fleet:hover {
          background: #DBEAFE;
          border-color: #93C5FD;
        }

        .fleet-standards-box {
          background: #FFFFFF;
          border-radius: 20px;
          border: 1px solid #CBD5E1;
          padding: 2.25rem;
          display: flex;
          align-items: center;
          gap: 2rem;
          box-shadow: 0 6px 20px rgba(15, 23, 42, 0.04);
        }

        .standards-icon-box {
          width: 68px;
          height: 68px;
          border-radius: 16px;
          background: #EFF6FF;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .standards-text h3 {
          font-size: 1.3rem;
          font-weight: 800;
          color: #0F172A;
          margin-bottom: 0.35rem;
        }

        .standards-text p {
          font-size: 0.90rem;
          line-height: 1.6;
          color: #475569;
          margin: 0;
        }

        @media (max-width: 1023px) and (min-width: 769px) {
          .fleet-cards-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 1.25rem;
            margin-bottom: 2.5rem;
          }
          .fleet-img-wrapper {
            height: 180px;
          }
          .fleet-card-body {
            padding: 1.15rem 1.1rem 1.25rem;
          }
        }

        @media (max-width: 768px) {
          .internal-hero-section {
            padding: 1.25rem 0 1rem;
          }
          .breadcrumbs-nav {
            margin-bottom: 0.5rem;
            font-size: 0.78rem;
          }
          .hero-badge-pill {
            font-size: 0.68rem;
            padding: 0.28rem 0.65rem;
            margin-bottom: 0.5rem;
          }
          .internal-hero-title {
            font-size: 1.45rem;
            line-height: 1.25;
            margin-bottom: 0.45rem;
          }
          .internal-hero-subtitle {
            font-size: 0.82rem;
            line-height: 1.5;
          }
          .vehicles-main-section {
            padding: 1.25rem 0 2.5rem;
          }
          .fleet-cards-grid {
            grid-template-columns: 1fr !important;
            gap: 1.25rem;
            margin-bottom: 2rem;
          }
          .fleet-card {
            border-radius: 20px;
            border: 1px solid #E2E8F0;
            box-shadow: 0 4px 18px rgba(15, 23, 42, 0.05);
            background: #FFFFFF;
            overflow: hidden;
          }
          .fleet-img-wrapper {
            height: 170px;
            position: relative;
          }
          .fleet-tag-chip {
            top: 0.75rem;
            left: 0.75rem;
            font-size: 0.68rem;
            font-weight: 800;
            letter-spacing: 0.04em;
            padding: 0.28rem 0.65rem;
            border-radius: 9999px;
            background: rgba(15, 23, 42, 0.82);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          }
          .fleet-card-body {
            padding: 1.1rem 1rem 1.15rem;
          }
          .fleet-cat-eyebrow {
            font-size: 0.7rem;
            font-weight: 800;
            letter-spacing: 0.07em;
            color: #2563EB;
            margin-bottom: 0.2rem;
          }
          .fleet-car-title {
            font-size: 1.3rem;
            line-height: 1.25;
            margin-bottom: 0.25rem;
          }
          .fleet-models-txt {
            font-size: 0.80rem;
            font-weight: 500;
            color: #64748B;
            margin-bottom: 0.75rem;
            line-height: 1.35;
          }
          .fleet-capacities-row {
            display: flex;
            gap: 0.45rem;
            margin-bottom: 0.65rem;
            flex-wrap: wrap;
          }
          .cap-pill {
            display: inline-flex;
            align-items: center;
            gap: 0.35rem;
            background: #F1F5F9;
            color: #334155;
            border: 1px solid #E2E8F0;
            border-radius: 8px;
            font-size: 0.75rem;
            font-weight: 600;
            padding: 0.32rem 0.6rem;
          }
          .hide-on-mobile {
            display: none !important;
          }
          .fleet-features-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.4rem;
            padding: 0.55rem 0.75rem;
            margin-bottom: 0.65rem;
            background: #F8FAFC;
            border-radius: 10px;
            border: 1px solid #E2E8F0;
          }
          .feat-pill-item {
            display: inline-flex;
            align-items: center;
            gap: 0.35rem;
            font-size: 0.75rem;
            font-weight: 600;
            color: #1E293B;
          }
          .fleet-ideal-line {
            font-size: 0.78rem;
            line-height: 1.45;
            color: #475569;
            margin-bottom: 0.85rem;
          }
          .fleet-ideal-line strong {
            color: #0F172A;
            font-weight: 700;
          }
          .fleet-footer-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-top: 1px solid #F1F5F9;
            padding-top: 0.85rem;
            gap: 0.5rem;
          }
          .fleet-price-box {
            display: flex;
            flex-direction: column;
            flex-shrink: 0;
          }
          .rate-lbl {
            font-size: 0.65rem;
            font-weight: 800;
            letter-spacing: 0.06em;
            color: #64748B;
            margin-bottom: 0.1rem;
          }
          .rate-val {
            font-size: 1.25rem;
            font-weight: 800;
            color: #0F172A;
            line-height: 1.1;
          }
          .fleet-btns-group {
            display: flex;
            gap: 0.45rem;
            align-items: center;
            justify-content: flex-end;
          }
          .btn-book-fleet {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.35rem;
            background: linear-gradient(135deg, #1D4ED8 0%, #1E40AF 100%);
            color: #FFFFFF;
            font-size: 0.85rem;
            font-weight: 700;
            padding: 0.6rem 0.85rem;
            border-radius: 10px;
            border: none;
            box-shadow: 0 3px 10px rgba(29, 78, 216, 0.28);
            white-space: nowrap;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          .btn-details-fleet {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.3rem;
            background: #EFF6FF;
            color: #1D4ED8;
            font-size: 0.85rem;
            font-weight: 700;
            padding: 0.6rem 0.75rem;
            border-radius: 10px;
            border: 1px solid #BFDBFE;
            text-decoration: none;
            white-space: nowrap;
            transition: all 0.2s ease;
          }
          .fleet-standards-box {
            flex-direction: column;
            align-items: flex-start;
            padding: 1.25rem;
            border-radius: 16px;
            gap: 1rem;
          }
          .standards-icon-box {
            width: 52px;
            height: 52px;
            border-radius: 14px;
          }
          .standards-icon-box svg {
            width: 28px;
            height: 28px;
          }
          .standards-text h3 {
            font-size: 1.15rem;
            margin-bottom: 0.35rem;
          }
          .standards-text p {
            font-size: 0.82rem;
            line-height: 1.5;
          }
        }

        @media (max-width: 420px) {
          .fleet-img-wrapper {
            height: 155px;
          }
          .fleet-card-body {
            padding: 0.95rem 0.85rem 1.05rem;
          }
          .fleet-car-title {
            font-size: 1.15rem;
          }
          .rate-val {
            font-size: 1.15rem;
          }
          .btn-book-fleet,
          .btn-details-fleet {
            padding: 0.55rem 0.65rem;
            font-size: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
}
