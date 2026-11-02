import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Car, CheckCircle2 } from 'lucide-react';
import { buildFareUrl, normalizeCorridorKey } from '../utils/fareNavigation';
import { homepageContent } from '../data/homepageContent';
import { vehicleApi } from '../services/api';
import { resolveMediaUrl } from '../utils/mediaUtils';

export const CategoryTransportBlocks = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('ALL');
  const [dbVehicles, setDbVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    vehicleApi.getAll()
      .then(res => {
        if (res.data?.data) {
          setDbVehicles(res.data.data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.warn('CategoryTransportBlocks: Failed to load dynamic fleet:', err?.message);
        setLoading(false);
      });
  }, []);

  const catData = homepageContent.categoriesSection;
  const rawCategories = catData.categories || [];

  // Match live DB vehicles for dynamic images and badges
  const sedanVeh = dbVehicles.find(v => v.category === 'SEDAN');
  const suvVeh = dbVehicles.find(v => v.category === 'SUV');
  const minibusVeh = dbVehicles.find(v => v.category === 'MINIBUS' || v.category === 'TEMPO_TRAVELLER');

  const categories = rawCategories.map(cat => {
    if (cat.id === 'cabs') {
      const badgeText = sedanVeh
        ? `${sedanVeh.seatingCapacity}-SEATER ${sedanVeh.name.toUpperCase()}`
        : 'EXECUTIVE SEDAN CAB';
      return {
        ...cat,
        bgImg: sedanVeh ? resolveMediaUrl(sedanVeh.image, cat.bgImg) : cat.bgImg,
        badge: badgeText,
        isLoading: loading,
      };
    }
    if (cat.id === 'suv') {
      const badgeText = suvVeh
        ? `${suvVeh.seatingCapacity}-SEATER ${suvVeh.name.toUpperCase()}`
        : 'SPACIOUS 6-SEATER SUV';
      return {
        ...cat,
        bgImg: suvVeh ? resolveMediaUrl(suvVeh.image, cat.bgImg) : cat.bgImg,
        badge: badgeText,
        isLoading: loading,
      };
    }
    if (cat.id === 'minibus') {
      const badgeText = minibusVeh
        ? `${minibusVeh.seatingCapacity}-SEATER ${minibusVeh.name.toUpperCase()}`
        : 'GROUP TEMPO TRAVELLER';
      return {
        ...cat,
        bgImg: minibusVeh ? resolveMediaUrl(minibusVeh.image, cat.bgImg) : cat.bgImg,
        badge: badgeText,
        isLoading: loading,
      };
    }
    return { ...cat, isLoading: loading };
  });

  const handleBookCategory = (catTitle, r) => {
    let category = 'SEDAN';
    let assignedVehicleId = '';
    let assignedVehicleName = '';

    if (catTitle.includes('SUV')) {
      category = 'SUV';
      if (suvVeh) { assignedVehicleId = suvVeh.id; assignedVehicleName = suvVeh.name; }
    } else if (catTitle.includes('MINI') || catTitle.includes('TEMPO') || catTitle.includes('BUS')) {
      category = 'TEMPO_TRAVELLER';
      if (minibusVeh) { assignedVehicleId = minibusVeh.id; assignedVehicleName = minibusVeh.name; }
    } else {
      if (sedanVeh) { assignedVehicleId = sedanVeh.id; assignedVehicleName = sedanVeh.name; }
    }

    const pKey = normalizeCorridorKey(r.from);
    const dKey = normalizeCorridorKey(r.to);
    const isCorridor = (pKey === 'pune' && dKey === 'mumbai') || (pKey === 'mumbai' && dKey === 'pune');

    const fareUrl = buildFareUrl({
      tripType: 'ONE_WAY',
      pickupId: pKey,
      dropId: dKey,
      pickupName: r.from,
      dropName: r.to,
      category,
      vehicleId: assignedVehicleId,
      vehicleName: assignedVehicleName,
      isCustomRoute: !isCorridor,
    });

    navigate(fareUrl);
  };

  const displayedCategories = activeTab === 'ALL'
    ? categories
    : categories.filter(c => c.id === activeTab);

  return (
    <section className="section-padding category-blocks-section">
      <div className="container">
        {/* Section Header */}
        <div className="category-section-header">
          <span className="eyebrow-chip">{catData.badge}</span>
          <h2>{catData.title}</h2>
          <p>{catData.subtitle}</p>
        </div>

        {/* Category Pill Navigation Bar */}
        <div className="pill-tab-wrapper">
          <div className="pill-tab-container">
            <button
              type="button"
              className={`pill-tab-btn ${activeTab === 'ALL' ? 'active' : ''}`}
              onClick={() => setActiveTab('ALL')}
            >
              <span>All Transport Fleet</span>
            </button>

            <button
              type="button"
              className={`pill-tab-btn ${activeTab === 'cabs' ? 'active' : ''}`}
              onClick={() => setActiveTab('cabs')}
            >
              <span>Executive Sedans (4-Seater)</span>
            </button>

            <button
              type="button"
              className={`pill-tab-btn ${activeTab === 'suv' ? 'active' : ''}`}
              onClick={() => setActiveTab('suv')}
            >
              <span>Spacious SUVs (6-Seater)</span>
            </button>

            <button
              type="button"
              className={`pill-tab-btn ${activeTab === 'minibus' ? 'active' : ''}`}
              onClick={() => setActiveTab('minibus')}
            >
              <span>Group Tempo Travellers</span>
            </button>
          </div>
        </div>

        {/* Grouped Category Blocks */}
        <div className="category-blocks-list">
          {displayedCategories.map((cat) => (
            <div key={cat.id} className="category-transport-card">
              {/* Left Media Image Banner */}
              <div className="category-banner-side">
                <img src={cat.bgImg} alt={cat.title} className="category-banner-img" loading="lazy" decoding="async" />
                <div className="category-banner-overlay">
                  <span className={`category-badge-chip ${cat.isLoading ? "cat-badge-skeleton" : ""}`}>{cat.badge}</span>
                  <h3 className="category-banner-heading">{cat.title}</h3>
                </div>
              </div>

              {/* Right Route Offer Cards Grid */}
              <div className="category-offers-grid">
                {cat.routes.map((r, idx) => (
                  <div key={idx} className="route-offer-tile">
                    <div className="tile-route-head">
                      <div className="route-locations-flow">
                        <span className="loc-pill origin-pill">{r.from}</span>
                        <div className="loc-arrow-divider">➔</div>
                        <span className="loc-pill dest-pill">{r.to}</span>
                      </div>
                      <span className="route-type-tag">{r.type}</span>
                    </div>

                    {r.link && (
                      <Link to={r.link} className="route-guide-link">
                        View Destination Guide & Rates →
                      </Link>
                    )}

                    <div className="tile-price-bottom">
                      <div className="price-stack">
                        <span className="price-start-lbl">STARTING AT</span>
                        <div className="price-val-row">
                          <span className="price-val-main">{r.est}</span>
                        </div>
                        <span className="price-note-txt">
                          <CheckCircle2 size={12} color="#10B981" /> {r.note}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleBookCategory(cat.title, r)}
                        className="btn-book-tile"
                      >
                        <Car size={15} />
                        <span>Book Now</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .category-blocks-section {
          background: #F1F5F9;
          padding-top: 4.5rem;
          padding-bottom: 5rem;
          border-top: 1px solid #E2E8F0;
        }

        .category-section-header {
          text-align: center;
          margin-bottom: 2.25rem;
        }

        .eyebrow-chip {
          display: inline-block;
          font-family: var(--font-heading);
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          color: #0284C7;
          background: #E0F2FE;
          padding: 0.35rem 0.9rem;
          border-radius: 9999px;
          border: 1px solid #BAE6FD;
          margin-bottom: 0.6rem;
        }

        .category-section-header h2 {
          font-size: clamp(1.4rem, 2.5vw, 2.1rem);
          font-weight: 650;
          color: #0F172A;
          margin-bottom: 0.4rem;
          letter-spacing: -0.015em;
        }

        .category-section-header p {
          font-size: 0.95rem;
          color: #64748B;
          max-width: 580px;
          margin: 0 auto;
        }

        /* Pill Tab Navigation Bar */
        .pill-tab-wrapper {
          display: flex;
          justify-content: center;
          margin-bottom: 2.5rem;
        }

        .pill-tab-container {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: #FFFFFF;
          padding: 0.4rem;
          border-radius: 9999px;
          border: 1.5px solid #CBD5E1;
          box-shadow: 0 4px 16px rgba(15, 23, 42, 0.05);
          flex-wrap: wrap;
        }

        .pill-tab-btn {
          background: transparent;
          border: none;
          padding: 0.65rem 1.35rem;
          border-radius: 9999px;
          font-family: var(--font-heading);
          font-size: 0.86rem;
          font-weight: 550;
          color: #64748B;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .pill-tab-btn:hover {
          color: #0F172A;
          background: #F1F5F9;
        }

        .pill-tab-btn.active {
          background: linear-gradient(135deg, #1D4ED8 0%, #1E40AF 100%);
          color: #FFFFFF;
          box-shadow: 0 4px 14px rgba(29, 78, 216, 0.35);
        }

        /* Category Card Block — Balanced Enterprise Surface */
        .category-blocks-list {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .category-transport-card {
          background: #FFFFFF;
          border-radius: 24px;
          border: 1px solid #CBD5E1;
          box-shadow: 0 4px 20px rgba(15, 23, 42, 0.06);
          padding: 1.25rem;
          display: grid;
          grid-template-columns: 240px 1fr;
          gap: 1.25rem;
          transition: all 0.3s ease;
        }

        .category-transport-card:hover {
          box-shadow: 0 12px 32px rgba(15, 23, 42, 0.12);
          border-color: #93C5FD;
        }

        /* Left Banner Side */
        .category-banner-side {
          position: relative;
          border-radius: 18px;
          overflow: hidden;
          min-height: 200px;
        }

        .category-banner-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s ease;
        }

        .category-transport-card:hover .category-banner-img {
          transform: scale(1.04);
        }

        .category-banner-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.35) 60%, rgba(0,0,0,0) 100%);
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        
        .cat-badge-skeleton {
          color: transparent !important;
          background: linear-gradient(90deg, rgba(255, 255, 255, 0.15) 25%, rgba(255, 255, 255, 0.4) 50%, rgba(255, 255, 255, 0.15) 75%) !important;
          background-size: 200% 100% !important;
          animation: catBadgeShimmer 1.5s infinite !important;
          min-width: 130px;
          display: inline-block;
        }

        @keyframes catBadgeShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .category-badge-chip {
          align-self: flex-start;
          font-family: var(--font-heading);
          font-size: 0.68rem;
          font-weight: 600;
          letter-spacing: 0.05em;
          background: rgba(29, 78, 216, 0.85);
          backdrop-filter: blur(8px);
          color: #FFFFFF;
          padding: 0.25rem 0.65rem;
          border-radius: 9999px;
          border: 1px solid rgba(147, 197, 253, 0.4);
        }

        .category-banner-heading {
          font-family: var(--font-heading);
          font-size: 1.25rem;
          font-weight: 650;
          color: #FFFFFF;
          line-height: 1.2;
          margin: 0;
          text-shadow: 0 2px 8px rgba(0,0,0,0.5);
        }

        /* Right Offers Grid — Balanced Surface & Contrast */
        .category-offers-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.1rem;
        }

        .route-offer-tile {
          background: #F8FAFC;
          border-radius: 16px;
          border: 1.5px solid #E2E8F0;
          padding: 1.2rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          transition: all 0.25s ease;
        }

        .route-offer-tile:hover {
          background: #FFFFFF;
          border-color: #93C5FD;
          box-shadow: 0 8px 24px rgba(29, 78, 216, 0.08);
          transform: translateY(-3px);
        }

        .tile-route-head {
          margin-bottom: 1.1rem;
        }

        .route-locations-flow {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.4rem;
          margin-bottom: 0.4rem;
        }

        .loc-pill {
          font-family: var(--font-heading);
          font-size: 0.8rem;
          font-weight: 600;
          color: #0F172A;
          background: #FFFFFF;
          padding: 0.3rem 0.55rem;
          border-radius: 8px;
          border: 1px solid #CBD5E1;
        }

        .dest-pill {
          color: #1D4ED8;
          border-color: #BFDBFE;
          background: #EFF6FF;
        }

        .loc-arrow-divider {
          color: #1D4ED8;
          font-weight: 600;
          font-size: 0.8rem;
        }

        .route-type-tag {
          display: block;
          font-size: 0.74rem;
          color: #64748B;
          font-weight: 600;
        }

        .tile-price-bottom {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }

        .route-guide-link {
          display: inline-block;
          font-size: 0.76rem;
          font-weight: 700;
          color: #2563EB;
          text-decoration: none;
          margin-top: 0.35rem;
          transition: color 0.2s ease;
        }

        .route-guide-link:hover {
          color: #1D4ED8;
          text-decoration: underline;
        }

        .price-stack {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }

        .price-start-lbl {
          font-size: 0.64rem;
          font-weight: 550;
          letter-spacing: 0.05em;
          color: #64748B;
        }

        .price-val-main {
          font-family: var(--font-heading);
          font-size: 1.45rem;
          font-weight: 700;
          color: #0F172A;
          line-height: 1;
        }

        .price-note-txt {
          font-size: 0.72rem;
          color: #059669;
          font-weight: 500;
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          margin-top: 0.2rem;
        }

        .btn-book-tile {
          width: 100%;
          background: linear-gradient(135deg, #1D4ED8 0%, #1E40AF 100%);
          color: #FFFFFF;
          border: none;
          padding: 0.7rem 1rem;
          border-radius: 12px;
          font-family: var(--font-heading);
          font-size: 0.82rem;
          font-weight: 600;
          letter-spacing: 0.02em;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(29, 78, 216, 0.35);
          transition: all 0.2s ease;
        }

        .btn-book-tile:hover {
          background: linear-gradient(135deg, #1E40AF 0%, #172554 100%);
          box-shadow: 0 6px 18px rgba(29, 78, 216, 0.5);
          transform: translateY(-1px);
        }

        @media (max-width: 992px) {
          .category-transport-card {
            grid-template-columns: 1fr;
          }
          .category-banner-side {
            min-height: 140px;
          }
        }

        @media (max-width: 768px) {
          .category-offers-grid {
            display: flex;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            gap: 0.85rem;
            padding: 0.25rem 0.1rem 0.5rem;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }
          .category-offers-grid::-webkit-scrollbar {
            display: none;
          }
          .route-offer-tile {
            flex: 0 0 82%;
            max-width: 270px;
            scroll-snap-align: start;
          }
        }

        @media (max-width: 640px) {
          .pill-tab-wrapper {
            justify-content: flex-start;
            overflow-x: auto;
            padding-bottom: 0.5rem;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }
          .pill-tab-wrapper::-webkit-scrollbar {
            display: none;
          }
          .pill-tab-container {
            flex-wrap: nowrap;
            white-space: nowrap;
          }
          .pill-tab-btn {
            font-size: 0.8rem;
            padding: 0.55rem 1rem;
          }
          .category-transport-card {
            padding: 0.85rem;
            border-radius: 18px;
          }
        }
      `}</style>
    </section>
  );
};
