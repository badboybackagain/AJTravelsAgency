import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { EnquiryModal } from '../components/EnquiryModal';
import { MobileStickyBar } from '../components/MobileStickyBar';
import { usePageSeo } from '../hooks/usePageSeo';
import { vehiclesData } from '../data/vehiclesData';
import { vehicleApi } from '../services/api';
import { resolveMediaUrl } from '../utils/mediaUtils';
import { 
  Car, 
  Users, 
  Briefcase, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles,
  ShieldCheck,
  Zap
} from 'lucide-react';

export function VehiclesPage() {
  usePageSeo(
    'vehicles',
    'Rental Cars & Tempo Travellers in Pune | Fleet Options - AJ Travels',
    'Hire rental cars with driver in Pune: Swift Dzire, 6-seater Ertiga, Toyota Innova Crysta, and luxury 13 to 20-seater Force Tempo Travellers for outstation & airport trips.'
  );

  const navigate = useNavigate();
  const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);
  const [dbVehicles, setDbVehicles] = useState([]);

  useEffect(() => {
    let isMounted = true;
    vehicleApi.getAll()
      .then(res => {
        if (isMounted && res.data?.data) {
          setDbVehicles(res.data.data);
        }
      })
      .catch(err => {
        console.warn('VehiclesPage: Failed to load dynamic fleet images:', err?.message);
      });
    return () => { isMounted = false; };
  }, []);

  const handleBookVehicle = (v) => {
    const params = new URLSearchParams({
      tripType: 'ONE_WAY',
      category: v.category,
      vehicleName: v.name
    });
    navigate(`/fare?${params.toString()}`);
  };

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
          <div className="fleet-cards-grid">
            {vehiclesData.map(v => {
              const dbMatch = dbVehicles.find(db => 
                db.category === v.category ||
                (v.id && db.name?.toLowerCase().includes(v.id.toLowerCase()))
              );
              const cardImage = dbMatch?.image ? resolveMediaUrl(dbMatch.image, v.image) : v.image;

              return (
              <div key={v.slug} className="fleet-card">
                <div className="fleet-img-wrapper">
                  <img
                    src={cardImage}
                    alt={v.name}
                    className="fleet-car-img"
                    loading="lazy"
                    onError={(e) => {
                      e.target.src = v.image || '/assets/sedan.webp';
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
                    {v.features.slice(0, 3).map((f, i) => (
                      <div key={i} className="feat-line">
                        <CheckCircle2 size={14} color="#10B981" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>

                  <div className="fleet-footer-row">
                    <div className="fleet-price-box">
                      <span className="rate-lbl">STARTING FROM</span>
                      <strong className="rate-val">{v.fareStarting}*</strong>
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
