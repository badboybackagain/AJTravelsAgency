import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { EnquiryModal } from '../components/EnquiryModal';
import { MobileStickyBar } from '../components/MobileStickyBar';
import { usePageSeo } from '../hooks/usePageSeo';
import { getVehicleBySlug, vehiclesData } from '../data/vehiclesData';
import { vehicleApi } from '../services/api';
import { resolveMediaUrl, findMatchingDbVehicle, getCanonicalTemplateForDbVehicle } from '../utils/mediaUtils';
import { 
  Users, 
  Briefcase, 
  Car, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  Info,
  AlertCircle,
  RotateCcw
} from 'lucide-react';

export function VehicleDetailPage() {
  const { slug } = useParams();
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
        console.warn('VehicleDetailPage: Failed to load dynamic fleet:', err?.message);
        setError('Unable to load vehicle details at this time.');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchFleet();
  }, []);

  const staticVehicle = getVehicleBySlug(slug);

  // Authoritative match:
  // 1. Direct DB ID match (e.g. /vehicles/cmvywfi8300014eem9lsd00zh)
  let dbMatch = dbVehicles.find(db => db.id === slug);

  // 2. Exact slugified name match (e.g. /vehicles/test matches name "test", /vehicles/sedan matches name "Sedan")
  if (!dbMatch) {
    dbMatch = dbVehicles.find(db =>
      db.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') === slug
    );
  }

  // 3. If canonical static profile exists (e.g. /vehicles/ertiga-suv, /vehicles/tempo-traveller), match by canonical mapping
  if (!dbMatch && staticVehicle) {
    dbMatch = findMatchingDbVehicle(staticVehicle, dbVehicles);
  }

  // Canonical template fallback if this vehicle represents a core fleet profile
  const canonicalTemplate = staticVehicle || (dbMatch ? getCanonicalTemplateForDbVehicle(dbMatch, vehiclesData) : null);

  const categoryFallback = (
    (dbMatch?.category || staticVehicle?.category) === 'SUV' ? '/assets/suv.webp' :
    (dbMatch?.category || staticVehicle?.category) === 'LUXURY' ? '/assets/luxury.jpg' :
    (dbMatch?.category || staticVehicle?.category) === 'MINIBUS' ? '/assets/minibus.jpg' :
    (dbMatch?.category || staticVehicle?.category) === 'HATCHBACK' ? '/assets/hatchback.jpg' :
    '/assets/sedan.webp'
  );

  // Unified vehicle object: live DB fields take absolute precedence over static copy
  const vehicle = dbMatch ? {
    id: dbMatch.id,
    slug: canonicalTemplate?.slug || dbMatch.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || dbMatch.id,
    name: dbMatch.name, // DATABASE IS SOURCE OF TRUTH
    category: dbMatch.category, // DATABASE IS SOURCE OF TRUTH
    models: dbMatch.description || canonicalTemplate?.models || `${dbMatch.name} Fleet`,
    tag: canonicalTemplate?.tag || (dbMatch.category === 'LUXURY' ? 'SUPREME COMFORT & LUXURY' : 'POPULAR FLEET CHOICE'),
    metaTitle: canonicalTemplate?.metaTitle || `${dbMatch.name} on Rent in Pune with Driver - AJ Travels`,
    metaDesc: canonicalTemplate?.metaDesc || `Hire ${dbMatch.name} on rent in Pune with chauffeur. Transparent rates for Pune to Mumbai, airport pickup/drop, and outstation trips.`,
    image: resolveMediaUrl(dbMatch.image, canonicalTemplate?.image || categoryFallback),
    passengers: `${dbMatch.seatingCapacity} Passengers`, // DATABASE IS SOURCE OF TRUTH
    luggage: canonicalTemplate?.luggage || (dbMatch.seatingCapacity <= 4 ? '2-3 Medium Bags' : dbMatch.seatingCapacity <= 7 ? '4-5 Large Bags' : '10+ Big Bags'),
    fareStarting: dbMatch.startingBaseFare ? `₹${dbMatch.startingBaseFare.toLocaleString()}` : (canonicalTemplate?.fareStarting || 'On Request'),
    overview: dbMatch.description || canonicalTemplate?.overview || `Our ${dbMatch.name} fleet features well-maintained commercial vehicles with experienced highway chauffeurs.`,
    features: canonicalTemplate?.features || [
      'Dual Air-Conditioning with rapid cooling',
      'Plush fabric or leatherette seating with ample legroom',
      'Commercial licensed highway chauffeur',
      'All-inclusive toll package available'
    ],
    idealFor: canonicalTemplate?.idealFor || `${dbMatch.name} rental in Pune for family tours, corporate transfers, and airport drops.`,
    specs: canonicalTemplate?.specs || {
      engine: 'Highway Commercial Engine',
      seatingCapacity: `${dbMatch.seatingCapacity} + 1 Driver`,
      bootCapacity: 'Generous Luggage Space',
      ac: 'Yes, High-Performance Climate Control'
    }
  } : null;

  const activeImage = vehicle?.image || canonicalTemplate?.image || categoryFallback;
  const activeStartingFare = vehicle?.fareStarting || 'On Request';

  usePageSeo(
    vehicle ? `vehicle_${vehicle.slug}` : 'vehicle_not_found',
    vehicle ? vehicle.metaTitle : 'Vehicle Not Found | AJ Travels Fleet',
    vehicle ? vehicle.metaDesc : 'Executive fleet vehicle specifications and rental details from AJ Travels.',
    vehicle ? `https://ajtravelspune.com/vehicles/${vehicle.slug}` : undefined
  );

  if (loading) {
    return (
      <div className="veh-detail-wrapper" aria-busy="true" aria-label="Loading vehicle profile">
        <Header onOpenEnquiry={() => setIsEnquiryOpen(true)} isDark={false} />

        <section className="veh-breadcrumbs-strip">
          <div className="container">
            <div className="breadcrumbs-nav">
              <Link to="/">Home</Link>
              <span className="bc-sep">/</span>
              <Link to="/vehicles">Fleet</Link>
              <span className="bc-sep">/</span>
              <span className="detail-skeleton-box" style={{ width: '110px', height: '14px', display: 'inline-block' }}></span>
            </div>
          </div>
        </section>

        <section className="veh-hero-section">
          <div className="container">
            <div className="veh-hero-grid">
              <div className="veh-hero-image-box detail-skeleton-box detail-skeleton-hero-img"></div>
              <div className="veh-hero-details">
                <div className="detail-skeleton-box" style={{ width: '130px', height: '14px', marginBottom: '0.65rem' }}></div>
                <div className="detail-skeleton-box" style={{ width: '80%', height: '34px', marginBottom: '0.65rem' }}></div>
                <div className="detail-skeleton-box" style={{ width: '60%', height: '16px', marginBottom: '1.5rem' }}></div>
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div className="detail-skeleton-box" style={{ width: '140px', height: '54px', borderRadius: '12px' }}></div>
                  <div className="detail-skeleton-box" style={{ width: '140px', height: '54px', borderRadius: '12px' }}></div>
                </div>
                <div className="detail-skeleton-box" style={{ width: '100%', height: '70px', borderRadius: '14px' }}></div>
              </div>
            </div>
          </div>
        </section>

        <section className="veh-content-section">
          <div className="container">
            <div className="veh-content-grid">
              <div className="veh-main-col">
                <div className="detail-skeleton-box" style={{ width: '220px', height: '24px', marginBottom: '1rem' }}></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '2rem' }}>
                  {[1, 2, 3, 4].map(n => (
                    <div key={n} className="detail-skeleton-box" style={{ height: '42px', borderRadius: '10px' }}></div>
                  ))}
                </div>
                <div className="detail-skeleton-box" style={{ width: '220px', height: '24px', marginBottom: '1rem' }}></div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                  {[1, 2, 3, 4].map(n => (
                    <div key={n} className="detail-skeleton-box" style={{ height: '80px', borderRadius: '12px' }}></div>
                  ))}
                </div>
              </div>
              <div className="veh-sidebar-col">
                <div className="detail-skeleton-box" style={{ width: '100%', height: '240px', borderRadius: '20px', marginBottom: '2rem' }}></div>
                <div className="detail-skeleton-box" style={{ width: '100%', height: '220px', borderRadius: '20px' }}></div>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    );
  }

  if (error && dbVehicles.length === 0) {
    return (
      <div className="veh-detail-wrapper">
        <Header onOpenEnquiry={() => setIsEnquiryOpen(true)} isDark={false} />
        <div className="container" style={{ padding: '6rem 1rem', textAlign: 'center' }}>
          <AlertCircle size={44} color="#DC2626" style={{ margin: '0 auto 0.75rem' }} />
          <h2 style={{ color: '#991B1B', fontWeight: 800, fontSize: '1.5rem', marginBottom: '0.5rem' }}>
            Vehicle Details Temporarily Unavailable
          </h2>
          <p style={{ color: '#64748B', maxWidth: '440px', margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
            We encountered a connection issue while fetching our fleet database. Please retry to load this vehicle.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={() => fetchFleet(true)}
              className="fleet-retry-btn"
            >
              <RotateCcw size={16} />
              <span>Retry Loading</span>
            </button>
            <Link to="/vehicles" className="btn-back-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.75rem 1.25rem', background: '#EFF6FF', color: '#1D4ED8', borderRadius: '8px', textDecoration: 'none', fontWeight: 600 }}>
              <ArrowLeft size={16} />
              <span>Return to Fleet Catalogue</span>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="veh-detail-wrapper">
        <Header onOpenEnquiry={() => setIsEnquiryOpen(true)} isDark={false} />
        <div className="container" style={{ padding: '6rem 1rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.5rem' }}>Vehicle Profile Not Found</h2>
          <p style={{ color: '#64748B', margin: '0.5rem 0 2rem' }}>The requested fleet vehicle could not be located in our active fleet catalogue.</p>
          <Link to="/vehicles" className="btn-back-link">
            <ArrowLeft size={16} />
            <span>Return to Fleet Catalogue</span>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const handleBookVehicle = () => {
    const params = new URLSearchParams({
      tripType: 'ONE_WAY',
      category: vehicle.category,
      vehicleId: vehicle.id || '',
      vehicleName: vehicle.name
    });
    navigate(`/fare?${params.toString()}`);
  };

  return (
    <div className="veh-detail-wrapper">
      <Header onOpenEnquiry={() => setIsEnquiryOpen(true)} isDark={false} />

      {/* Breadcrumbs Strip */}
      <section className="veh-breadcrumbs-strip">
        <div className="container">
          <div className="breadcrumbs-nav">
            <Link to="/">Home</Link>
            <span className="bc-sep">/</span>
            <Link to="/vehicles">Fleet</Link>
            <span className="bc-sep">/</span>
            <span className="bc-current">{vehicle.name}</span>
          </div>
        </div>
      </section>

      {/* Vehicle Hero Section */}
      <section className="veh-hero-section">
        <div className="container">
          <div className="veh-hero-grid">
            <div className="veh-hero-image-box">
              <img
                src={activeImage}
                alt={vehicle.name}
                className="veh-hero-photo"
                onError={(e) => {
                  if (!e.target.dataset.fallbackTried) {
                    e.target.dataset.fallbackTried = 'true';
                    e.target.src = canonicalTemplate?.image || categoryFallback;
                  }
                }}
              />
              <span className="veh-floating-tag">{vehicle.tag}</span>
            </div>

            <div className="veh-hero-details">
              <span className="veh-cat-label">{vehicle.category} CATEGORY</span>
              <h1 className="veh-main-title">{vehicle.name}</h1>
              <p className="veh-models-subtitle">Available Models: {vehicle.models}</p>

              <div className="veh-spec-chips">
                <div className="spec-chip">
                  <Users size={16} color="#2563EB" />
                  <div>
                    <span className="spec-lbl">CAPACITY</span>
                    <strong>{vehicle.passengers}</strong>
                  </div>
                </div>
                <div className="spec-chip">
                  <Briefcase size={16} color="#2563EB" />
                  <div>
                    <span className="spec-lbl">LUGGAGE</span>
                    <strong>{vehicle.luggage}</strong>
                  </div>
                </div>
              </div>

              <p className="veh-blurb-text">{vehicle.overview}</p>

              <div className="veh-fare-box">
                <div>
                  <span className="rate-lbl">ALL-INCLUSIVE ONE-WAY FARE FROM</span>
                  <div className="rate-amount-row">
                    <span className="rate-amount">{activeStartingFare}*</span>
                    <span className="rate-note">Tolls & Taxes Included</span>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={handleBookVehicle}
                  className="btn-book-this-veh"
                >
                  <Car size={18} />
                  <span>Book This Vehicle</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Specifications & In-Depth Details */}
      <section className="veh-details-content-section">
        <div className="container">
          <div className="veh-content-2col-layout">
            <div className="veh-info-col">
              <div className="content-card">
                <span className="section-eyebrow">EQUIPMENT & AMENITIES</span>
                <h2 className="content-card-title">Vehicle Highlights & Features</h2>
                <div className="features-checklist">
                  {vehicle.features.map((feat, idx) => (
                    <div key={idx} className="feat-check-row">
                      <CheckCircle2 size={18} color="#10B981" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                <div className="ideal-use-banner">
                  <Info size={20} color="#1D4ED8" />
                  <div>
                    <strong>Best Suited For:</strong>
                    <p>{vehicle.idealFor}</p>
                  </div>
                </div>
              </div>

              {/* Technical Specs Table */}
              {vehicle.specs && (
                <div className="content-card" style={{ marginTop: '2rem' }}>
                  <h3 className="content-card-title" style={{ fontSize: '1.4rem' }}>Technical Specifications</h3>
                  <div className="specs-table-wrapper">
                    <table className="specs-table">
                      <tbody>
                        <tr>
                          <th>Powertrain</th>
                          <td>{vehicle.specs.engine}</td>
                        </tr>
                        <tr>
                          <th>Seating Arrangement</th>
                          <td>{vehicle.specs.seatingCapacity}</td>
                        </tr>
                        <tr>
                          <th>Luggage Space</th>
                          <td>{vehicle.specs.bootCapacity}</td>
                        </tr>
                        <tr>
                          <th>Air Conditioning</th>
                          <td>{vehicle.specs.ac}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Right Booking Sidebar */}
            <div className="veh-sidebar-col">
              <div className="sidebar-action-card">
                <h3>Calculate Exact Fare</h3>
                <p>Check transparent point-to-point pricing for this {vehicle.name} across Pune, Mumbai, and Outstation sectors.</p>
                <button 
                  type="button" 
                  onClick={handleBookVehicle}
                  className="btn-full-calc"
                >
                  <span>Launch Fare Calculator</span>
                  <ArrowRight size={16} />
                </button>
              </div>

              <div className="other-vehicles-box">
                <h4>Other Vehicle Options</h4>
                <div className="other-veh-list">
                  {dbVehicles
                    .filter(db => db.id !== vehicle.id)
                    .map(db => {
                      const canonical = getCanonicalTemplateForDbVehicle(db, vehiclesData);
                      const otherSlug = canonical?.slug || db.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || db.id;
                      const otherFare = db.startingBaseFare
                        ? `₹${db.startingBaseFare.toLocaleString()}`
                        : (canonical?.fareStarting || 'On Request');

                      return (
                        <Link key={db.id} to={`/vehicles/${otherSlug}`} className="other-veh-row">
                          <div>
                            <strong>{db.name}</strong>
                            <span>{db.seatingCapacity} Passengers • From {otherFare}*</span>
                          </div>
                          <ArrowRight size={14} />
                        </Link>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <MobileStickyBar onOpenEnquiry={() => setIsEnquiryOpen(true)} />
      <EnquiryModal isOpen={isEnquiryOpen} onClose={() => setIsEnquiryOpen(false)} />

      <style>{`
        .veh-detail-wrapper {
          min-height: 100vh;
          background: #FFFFFF;
          color: #0F172A;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        
        /* Detail Page Skeleton & Shimmer */
        .detail-skeleton-box {
          background: linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%);
          background-size: 200% 100%;
          animation: detailShimmer 1.5s infinite;
          border-radius: 6px;
        }

        @keyframes detailShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .detail-skeleton-hero-img {
          width: 100%;
          height: 340px;
          border-radius: 20px;
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

        .veh-breadcrumbs-strip {
          background: #F8FAFC;
          border-bottom: 1px solid #E2E8F0;
          padding: 1.1rem 0;
        }

        .breadcrumbs-nav {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          color: #64748B;
        }

        .breadcrumbs-nav a { color: #2563EB; text-decoration: none; font-weight: 500; }
        .bc-sep { color: #94A3B8; }
        .bc-current { color: #0F172A; font-weight: 600; }

        .veh-hero-section {
          background: linear-gradient(180deg, #F8FAFC 0%, #EFF6FF 100%);
          padding: 2.25rem 0 2rem;
          border-bottom: 1px solid #E2E8F0;
        }

        .veh-hero-grid {
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: 2.5rem;
          align-items: center;
        }

        .veh-hero-image-box {
          position: relative;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 12px 32px rgba(15, 23, 42, 0.1);
          border: 1px solid #CBD5E1;
        }

        .veh-hero-photo {
          width: 100%;
          height: 340px;
          object-fit: cover;
          display: block;
        }

        .veh-floating-tag {
          position: absolute;
          top: 1.25rem;
          left: 1.25rem;
          background: rgba(15, 23, 42, 0.85);
          backdrop-filter: blur(8px);
          color: #FFFFFF;
          font-size: 0.7rem;
          font-weight: 800;
          letter-spacing: 0.06em;
          padding: 0.35rem 0.8rem;
          border-radius: 6px;
        }

        .veh-cat-label {
          display: inline-block;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: #2563EB;
          margin-bottom: 0.4rem;
        }

        .veh-main-title {
          font-size: 2.3rem;
          font-weight: 800;
          line-height: 1.25;
          color: #0F172A;
          margin-bottom: 0.35rem;
        }

        .veh-models-subtitle {
          font-size: 0.95rem;
          font-weight: 600;
          color: #64748B;
          margin-bottom: 1.5rem;
        }

        .veh-spec-chips {
          display: flex;
          gap: 1.25rem;
          margin-bottom: 1.5rem;
        }

        .spec-chip {
          background: #FFFFFF;
          border: 1px solid #CBD5E1;
          border-radius: 12px;
          padding: 0.75rem 1rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
        }

        .spec-lbl {
          display: block;
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 0.06em;
          color: #94A3B8;
        }

        .spec-chip strong {
          display: block;
          font-size: 0.9rem;
          color: #0F172A;
        }

        .veh-blurb-text {
          font-size: 0.95rem;
          line-height: 1.65;
          color: #475569;
          margin-bottom: 1.75rem;
        }

        .veh-fare-box {
          background: #FFFFFF;
          border: 1.5px solid #BFDBFE;
          border-radius: 16px;
          padding: 1.25rem 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1.5rem;
          box-shadow: 0 4px 16px rgba(37, 99, 235, 0.06);
        }

        .rate-lbl {
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 0.06em;
          color: #64748B;
          display: block;
          margin-bottom: 0.2rem;
        }

        .rate-amount-row {
          display: flex;
          align-items: baseline;
          gap: 0.5rem;
        }

        .rate-amount {
          font-size: 1.6rem;
          font-weight: 800;
          color: #0F172A;
        }

        .rate-note {
          font-size: 0.78rem;
          font-weight: 600;
          color: #10B981;
        }

        .btn-book-this-veh {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: linear-gradient(135deg, #1D4ED8 0%, #1E40AF 100%);
          color: #FFFFFF;
          font-weight: 700;
          font-size: 0.92rem;
          padding: 0.85rem 1.45rem;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(29, 78, 216, 0.3);
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .btn-book-this-veh:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(29, 78, 216, 0.4);
        }

        /* Detail Content */
        .veh-details-content-section {
          padding: 2.25rem 0 4rem;
          background: #F8FAFC;
        }

        .veh-content-2col-layout {
          display: grid;
          grid-template-columns: 1.35fr 1fr;
          gap: 2.25rem;
          align-items: flex-start;
        }

        .content-card {
          background: #FFFFFF;
          border-radius: 20px;
          padding: 2.5rem;
          border: 1px solid #E2E8F0;
          box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
        }

        .section-eyebrow {
          display: block;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: #2563EB;
          margin-bottom: 0.5rem;
        }

        .content-card-title {
          font-size: 1.65rem;
          font-weight: 800;
          color: #0F172A;
          margin-bottom: 1.5rem;
        }

        .features-checklist {
          display: flex;
          flex-direction: column;
          gap: 0.95rem;
          margin-bottom: 2rem;
        }

        .feat-check-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.95rem;
          color: #1E293B;
          font-weight: 500;
        }

        .ideal-use-banner {
          background: #EFF6FF;
          border: 1px solid #BFDBFE;
          border-radius: 12px;
          padding: 1.25rem 1.5rem;
          display: flex;
          align-items: flex-start;
          gap: 0.85rem;
        }

        .ideal-use-banner strong {
          display: block;
          font-size: 0.9rem;
          color: #1E3A8A;
          margin-bottom: 0.2rem;
        }

        .ideal-use-banner p {
          font-size: 0.88rem;
          color: #334155;
          margin: 0;
          line-height: 1.55;
        }

        /* Specs Table */
        .specs-table-wrapper {
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid #E2E8F0;
        }

        .specs-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.9rem;
        }

        .specs-table th {
          background: #F8FAFC;
          color: #475569;
          font-weight: 600;
          text-align: left;
          padding: 0.85rem 1.1rem;
          width: 38%;
          border-bottom: 1px solid #E2E8F0;
        }

        .specs-table td {
          padding: 0.85rem 1.1rem;
          color: #0F172A;
          font-weight: 500;
          border-bottom: 1px solid #E2E8F0;
        }

        .specs-table tr:last-child th,
        .specs-table tr:last-child td {
          border-bottom: none;
        }

        /* Sidebar */
        .sidebar-action-card {
          background: #FFFFFF;
          border-radius: 20px;
          padding: 2.25rem;
          border: 1.5px solid #CBD5E1;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
          margin-bottom: 2rem;
        }

        .sidebar-action-card h3 {
          font-size: 1.35rem;
          font-weight: 800;
          color: #0F172A;
          margin-bottom: 0.5rem;
        }

        .sidebar-action-card p {
          font-size: 0.88rem;
          color: #64748B;
          margin-bottom: 1.5rem;
          line-height: 1.55;
        }

        .btn-full-calc {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          background: linear-gradient(135deg, #1D4ED8 0%, #1E40AF 100%);
          color: #FFFFFF;
          font-weight: 700;
          font-size: 0.92rem;
          padding: 0.85rem;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(29, 78, 216, 0.25);
          transition: all 0.2s ease;
        }

        .btn-full-calc:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(29, 78, 216, 0.35);
        }

        .other-vehicles-box {
          background: #FFFFFF;
          border-radius: 18px;
          padding: 1.75rem;
          border: 1px solid #E2E8F0;
        }

        .other-vehicles-box h4 {
          font-size: 1.05rem;
          font-weight: 700;
          color: #0F172A;
          margin-bottom: 1rem;
        }

        .other-veh-list {
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
        }

        .other-veh-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem;
          border-radius: 10px;
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          color: #0F172A;
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .other-veh-row:hover {
          border-color: #BFDBFE;
          background: #EFF6FF;
          color: #2563EB;
        }

        .other-veh-row strong {
          display: block;
          font-size: 0.85rem;
        }

        .other-veh-row span {
          display: block;
          font-size: 0.75rem;
          color: #64748B;
        }

        .btn-back-link {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          color: #2563EB;
          font-weight: 600;
          text-decoration: none;
        }

        @media (max-width: 991px) {
          .veh-hero-grid,
          .veh-content-2col-layout {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .veh-main-title {
            font-size: 1.85rem;
          }
          .veh-fare-box {
            flex-direction: column;
            align-items: flex-start;
          }
          .btn-book-this-veh {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
