import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Car, CheckCircle2 } from 'lucide-react';

export const CategoryTransportBlocks = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('ALL');

  const handleBookCategory = (catTitle, r) => {
    let category = 'SEDAN';
    if (catTitle.includes('SUV')) category = 'SUV';
    else if (catTitle.includes('MINI') || catTitle.includes('BUS')) category = 'TEMPO_TRAVELLER';

    const params = new URLSearchParams({
      tripType: 'ONE_WAY',
      pickupId: r.from,
      dropId: r.to,
      category,
    });
    navigate(`/fare?${params.toString()}`);
  };

  const categories = [
    {
      id: 'cabs',
      title: 'OUTSTATION CABS',
      badge: '4 SEATER SEDAN',
      bgImg: '/assets/sedan.webp',
      routes: [
        { from: 'PUNE', to: 'MUMBAI', type: 'One-Way Express', est: '₹2,490*', note: 'All-Inclusive Toll & Tax' },
        { from: 'MUMBAI', to: 'PUNE', type: 'One-Way Express', est: '₹2,490*', note: 'Doorstep Pickup Included' },
        { from: 'HINJAWADI', to: 'BKC MUMBAI', type: 'Executive Cab', est: '₹2,750*', note: 'Corporate Express Corridor' }
      ]
    },
    {
      id: 'suv',
      title: 'SPACIOUS SUVS',
      badge: '6 SEATER SUV',
      bgImg: '/assets/suv.webp',
      routes: [
        { from: 'PUNE AIRPORT', to: 'MUMBAI (BOM)', type: '6-Seater SUV', est: '₹3,490*', note: 'Flight Tracked Guarantee' },
        { from: 'MUMBAI (BOM)', to: 'PUNE CITY', type: '6-Seater SUV', est: '₹3,490*', note: 'Extra Boot Luggage Space' },
        { from: 'WAKAD / BANER', to: 'ANDHERI / POWAI', type: 'Family SUV', est: '₹3,250*', note: 'Reclining AC Comfort' }
      ]
    },
    {
      id: 'minibus',
      title: 'GROUP MINI BUS',
      badge: '12-20 SEATER TEMPO',
      bgImg: '/assets/pune-mumbai-travel-banner.webp',
      routes: [
        { from: 'PUNE', to: 'MUMBAI', type: '12-Seater Tempo', est: '₹6,490*', note: 'Pushback Luxury Seats' },
        { from: 'MUMBAI', to: 'PUNE', type: '17-Seater Tempo', est: '₹7,990*', note: 'Dedicated Aisle & Music' },
        { from: 'PUNE / MUMBAI', to: 'WEDDING VENUE', type: '20-Seater Coach', est: '₹9,990*', note: 'Intercity State Permit' }
      ]
    }
  ];

  const displayedCategories = activeTab === 'ALL'
    ? categories
    : categories.filter(c => c.id === activeTab);

  return (
    <section className="section-padding category-blocks-section">
      <div className="container">
        {/* Section Header */}
        <div className="category-section-header">
          <span className="eyebrow-chip">EXPRESS TRANSPORT CATEGORIES</span>
          <h2>Pune ↔ Mumbai Fleet Fares</h2>
          <p>
            Choose your preferred vehicle tier for instant fare estimates and direct online booking.
          </p>
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
                <img src={cat.bgImg} alt={cat.title} className="category-banner-img" />
                <div className="category-banner-overlay">
                  <span className="category-badge-chip">{cat.badge}</span>
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
                        <span>BOOK NOW</span>
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
          background: #F8FAFC;
          padding-top: 4rem;
          padding-bottom: 4.5rem;
        }

        .category-section-header {
          text-align: center;
          margin-bottom: 2.25rem;
        }

        .eyebrow-chip {
          display: inline-block;
          font-family: var(--font-heading);
          font-size: 0.76rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: #0284C7;
          background: #E0F2FE;
          padding: 0.3rem 0.85rem;
          border-radius: 9999px;
          margin-bottom: 0.5rem;
        }

        .category-section-header h2 {
          font-size: 2.1rem;
          font-weight: 800;
          color: #0F172A;
          margin-bottom: 0.35rem;
        }

        .category-section-header p {
          font-size: 0.92rem;
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
          border: 1.5px solid #E2E8F0;
          box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
          flex-wrap: wrap;
        }

        .pill-tab-btn {
          background: transparent;
          border: none;
          padding: 0.65rem 1.35rem;
          border-radius: 9999px;
          font-family: var(--font-heading);
          font-size: 0.86rem;
          font-weight: 700;
          color: #64748B;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .pill-tab-btn:hover {
          color: #0F172A;
          background: #F1F5F9;
        }

        .pill-tab-btn.active {
          background: linear-gradient(135deg, #0284C7 0%, #0369A1 100%);
          color: #FFFFFF;
          box-shadow: 0 4px 14px rgba(2, 132, 199, 0.35);
        }

        /* Category Card Block */
        .category-blocks-list {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .category-transport-card {
          background: #FFFFFF;
          border-radius: 24px;
          border: 1.5px solid #E2E8F0;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.05);
          padding: 1.25rem;
          display: grid;
          grid-template-columns: 240px 1fr;
          gap: 1.25rem;
          transition: all 0.3s ease;
        }

        .category-transport-card:hover {
          box-shadow: 0 16px 40px rgba(15, 23, 42, 0.09);
          border-color: #CBD5E1;
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
        }

        .category-banner-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(15, 23, 42, 0.9) 0%, rgba(15, 23, 42, 0.25) 60%, rgba(0,0,0,0) 100%);
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .category-badge-chip {
          align-self: flex-start;
          font-family: var(--font-heading);
          font-size: 0.68rem;
          font-weight: 800;
          letter-spacing: 0.06em;
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(8px);
          color: #FFFFFF;
          padding: 0.25rem 0.65rem;
          border-radius: 9999px;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .category-banner-heading {
          font-family: var(--font-heading);
          font-size: 1.3rem;
          font-weight: 800;
          color: #FFFFFF;
          line-height: 1.2;
          margin: 0;
          text-shadow: 0 2px 8px rgba(0,0,0,0.5);
        }

        /* Right Offers Grid */
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
          border-color: #0284C7;
          box-shadow: 0 8px 24px rgba(2, 132, 199, 0.12);
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
          font-size: 0.82rem;
          font-weight: 800;
          color: #0F172A;
          background: #FFFFFF;
          padding: 0.3rem 0.55rem;
          border-radius: 8px;
          border: 1px solid #E2E8F0;
        }

        .dest-pill {
          color: #0284C7;
          border-color: #BAE6FD;
          background: #F0F9FF;
        }

        .loc-arrow-divider {
          color: #0284C7;
          font-weight: 800;
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

        .price-stack {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }

        .price-start-lbl {
          font-size: 0.64rem;
          font-weight: 800;
          letter-spacing: 0.06em;
          color: #94A3B8;
        }

        .price-val-main {
          font-family: var(--font-heading);
          font-size: 1.45rem;
          font-weight: 800;
          color: #0284C7;
          line-height: 1;
        }

        .price-note-txt {
          font-size: 0.72rem;
          color: #10B981;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          margin-top: 0.2rem;
        }

        .btn-book-tile {
          width: 100%;
          background: linear-gradient(135deg, #0284C7 0%, #0369A1 100%);
          color: #FFFFFF;
          border: none;
          padding: 0.7rem 1rem;
          border-radius: 12px;
          font-family: var(--font-heading);
          font-size: 0.82rem;
          font-weight: 800;
          letter-spacing: 0.03em;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(2, 132, 199, 0.25);
          transition: all 0.2s ease;
        }

        .btn-book-tile:hover {
          background: linear-gradient(135deg, #0369A1 0%, #075985 100%);
          box-shadow: 0 6px 18px rgba(2, 132, 199, 0.4);
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
