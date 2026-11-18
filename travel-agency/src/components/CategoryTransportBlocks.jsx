import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Car, CheckCircle2, Clock, Users, ShieldCheck } from 'lucide-react';
import { buildFareUrl, normalizeCorridorKey } from '../utils/fareNavigation';
import { homepageContent } from '../data/homepageContent';
import { vehicleApi } from '../services/api';
import { resolveMediaUrl } from '../utils/mediaUtils';

// Helper to format route names cleanly in readable Title Case
const formatRoutePlace = (str) => {
  if (!str) return '';
  const acronyms = new Set(['BOM', 'PNQ', 'PCMC', 'AC', 'SUV', 'BKC']);
  return str
    .split(' ')
    .map(word => {
      const bare = word.replace(/[()]/g, '');
      if (acronyms.has(bare)) return word;
      if (word === '/' || word === '&') return word;
      if (word.includes('/')) {
        return word.split('/').map(part => {
          const pBare = part.replace(/[()]/g, '');
          if (acronyms.has(pBare)) return part;
          return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
        }).join(' / ');
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
};

// Subcomponent for each category's offers cards with infinite circular scroll on mobile
const CategoryOffersStrip = ({ cat, onBookCategory }) => {
  const routeCount = cat.routes.length;
  // Render 3 sets of routes for seamless circular looping on mobile viewports
  const loopRoutes = [...cat.routes, ...cat.routes, ...cat.routes];
  const [realIndex, setRealIndex] = useState(routeCount);
  const [isUserSelected, setIsUserSelected] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const wasOutRef = useRef(false);
  const containerRef = useRef(null);
  const isInteractingRef = useRef(false);
  const isResettingRef = useRef(false);
  const resumeTimerRef = useRef(null);

  // Section visibility & re-entry observer:
  // Rule 1: Scroll only when visible on screen; stop when user is on another section/page.
  // Rule 6: Resume auto-scrolling only when user explicitly leaves and re-enters the section.
  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (wasOutRef.current) {
            setIsUserSelected(false);
            isInteractingRef.current = false;
            wasOutRef.current = false;
          }
        } else {
          setIsVisible(false);
          wasOutRef.current = true;
          isInteractingRef.current = false;
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Position at the start of middle set on mount
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (container.scrollWidth > container.clientWidth + 10) {
      const initialCard = container.children[routeCount];
      if (initialCard) {
        const initialLeft = initialCard.offsetLeft - (container.clientWidth - initialCard.clientWidth) / 2;
        container.scrollTo({ left: Math.max(0, initialLeft), behavior: 'auto' });
      }
    }
  }, [routeCount]);

  // Infinite Circular Auto-scroll loop for mobile viewports
  useEffect(() => {
    if (isUserSelected || !isVisible) return;

    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const interval = setInterval(() => {
      if (isInteractingRef.current || isUserSelected || !isVisible) return;
      const container = containerRef.current;
      if (!container) return;

      // Auto-scroll only when horizontal overflow is present (mobile / tablet)
      if (container.scrollWidth <= container.clientWidth + 10) return;

      const nextReal = realIndex + 1;
      const targetCard = container.children[nextReal];
      if (targetCard) {
        const targetLeft = targetCard.offsetLeft - (container.clientWidth - targetCard.clientWidth) / 2;
        container.scrollTo({ left: Math.max(0, targetLeft), behavior: 'smooth' });
        setRealIndex(nextReal);

        // Circular loop: when smoothly advancing into 3rd set, silently snap back to middle set
        if (nextReal >= 2 * routeCount) {
          setTimeout(() => {
            if (!container) return;
            const resetIndex = nextReal - routeCount;
            const resetCard = container.children[resetIndex];
            if (resetCard) {
              const resetLeft = resetCard.offsetLeft - (container.clientWidth - resetCard.clientWidth) / 2;
              isResettingRef.current = true;
              container.style.scrollBehavior = 'auto';
              container.style.scrollSnapType = 'none';
              container.scrollLeft = Math.max(0, resetLeft);
              setRealIndex(resetIndex);
              requestAnimationFrame(() => {
                if (container) {
                  container.style.scrollSnapType = 'x mandatory';
                  container.style.scrollBehavior = '';
                }
                setTimeout(() => {
                  isResettingRef.current = false;
                }, 50);
              });
            }
          }, 450);
        }
      }
    }, 2200);

    return () => clearInterval(interval);
  }, [realIndex, routeCount, isUserSelected, isVisible]);

  const pauseInteraction = (resumeDelay = 2200) => {
    isInteractingRef.current = true;
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      isInteractingRef.current = false;
    }, resumeDelay);
  };

  const handleScroll = () => {
    if (isResettingRef.current) return;
    const container = containerRef.current;
    if (!container) return;
    const centerPoint = container.scrollLeft + container.clientWidth / 2;
    let closestIndex = routeCount;
    let minDistance = Infinity;

    Array.from(container.children).forEach((child, idx) => {
      if (child.classList.contains('route-offer-tile')) {
        const childCenter = child.offsetLeft + child.clientWidth / 2;
        const dist = Math.abs(childCenter - centerPoint);
        if (dist < minDistance) {
          minDistance = dist;
          closestIndex = idx;
        }
      }
    });

    if (closestIndex !== realIndex) {
      setRealIndex(closestIndex);
    }
  };

  const scrollToTile = (dotIdx) => {
    setIsUserSelected(true);
    isInteractingRef.current = false;
    const targetReal = routeCount + dotIdx;
    setRealIndex(targetReal);
    const container = containerRef.current;
    if (!container) return;
    const targetCard = container.children[targetReal];
    if (targetCard) {
      const targetLeft = targetCard.offsetLeft - (container.clientWidth - targetCard.clientWidth) / 2;
      container.scrollTo({ left: Math.max(0, targetLeft), behavior: 'smooth' });
    }
  };

  return (
    <div className="category-offers-wrapper">
      <div
        className="category-offers-grid"
        ref={containerRef}
        onScroll={handleScroll}
        onTouchStart={() => pauseInteraction(2200)}
        onTouchMove={() => pauseInteraction(2200)}
        onTouchEnd={() => pauseInteraction(2500)}
        onMouseEnter={() => { isInteractingRef.current = true; }}
        onMouseLeave={() => pauseInteraction(1500)}
      >
        {loopRoutes.map((r, idx) => {
          const isActive = (idx % routeCount) === (realIndex % routeCount);
          return (
            <div
              key={idx}
              className={`route-offer-tile ${isActive ? 'active-tile' : ''}`}
              onClick={() => scrollToTile(idx % routeCount)}
            >
              {/* Top: Origin -> Destination Flow Pills */}
              <div className="tile-route-head">
                <div className="route-locations-flow">
                  <span className="loc-pill origin-pill">{r.from}</span>
                  <span className="loc-arrow-divider">→</span>
                  <span className="loc-pill dest-pill">{r.to}</span>
                </div>
                <span className="route-type-tag">{r.type}</span>
              </div>

              {/* Short, meaningful route description replacing destination guide link */}
              <p className="route-desc-text">
                {r.desc || (
                  r.to.includes('AIRPORT') ? 'Ideal for airport transfers, arrivals and departures.' :
                  r.to.includes('NASHIK') || r.to.includes('TRIMBAK') ? 'Suitable for outstation trips and pilgrimage travel.' :
                  r.to.includes('LONAVALA') ? 'Perfect for scenic drives and day trips.' :
                  r.to.includes('MAHABALESHWAR') ? 'Scenic hill station tours with sightseeing and viewpoints.' :
                  r.to.includes('SHIRDI') ? 'Dedicated pilgrimage travel with flexible temple waiting.' :
                  r.to.includes('MUMBAI') ? 'Direct expressway travel for business meetings and city drops.' :
                  'Comfortable chauffeur-driven outstation and city travel.'
                )}
              </p>

              {/* Price Stack & Full-Width Book Now Button */}
              <div className="tile-price-bottom">
                <div className="price-stack">
                  <span className="price-start-lbl">STARTING AT</span>
                  <div className="price-val-main">{r.fare || r.est}</div>
                  {(r.pricingNote || r.note) && (
                    <span className="price-note-txt">
                      <CheckCircle2 size={13} color="#059669" /> {r.pricingNote || r.note}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onBookCategory(cat.title, r);
                  }}
                  className="btn-book-tile"
                >
                  <Car size={15} />
                  <span>Book Now</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination indicators on mobile */}
      <div className="offers-pagination-dots" aria-hidden="true">
        {cat.routes.map((_, i) => (
          <button
            key={i}
            type="button"
            className={`offer-dot ${i === (realIndex % routeCount) ? 'active' : ''}`}
            onClick={() => scrollToTile(i)}
            aria-label={`Go to route option ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

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
        ? `${parseInt(sedanVeh.seatingCapacity) || 4}-SEATER SEDAN`
        : '4-SEATER SEDAN';
      return {
        ...cat,
        bgImg: sedanVeh ? resolveMediaUrl(sedanVeh.image, cat.bgImg) : cat.bgImg,
        badge: badgeText,
        isLoading: loading,
      };
    }
    if (cat.id === 'suv') {
      const badgeText = suvVeh
        ? `${parseInt(suvVeh.seatingCapacity) || 6}-SEATER SUV`
        : '6-SEATER SUV';
      return {
        ...cat,
        bgImg: suvVeh ? resolveMediaUrl(suvVeh.image, cat.bgImg) : cat.bgImg,
        badge: badgeText,
        isLoading: loading,
      };
    }
    if (cat.id === 'minibus') {
      const badgeText = minibusVeh
        ? `${minibusVeh.seatingCapacity ? parseInt(minibusVeh.seatingCapacity) + '-SEATER' : '12-20 SEATER'} TEMPO`
        : '12-20 SEATER TEMPO';
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

        {/* Category Pill Navigation Bar - 100% visible on mobile with 2x2 wrapping grid */}
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
              {/* Media Image Banner */}
              <div className="category-banner-side">
                <img
                  src={cat.bgImg}
                  alt={cat.title}
                  className="category-banner-img"
                  loading="lazy"
                  decoding="async"
                />
                <div className="category-banner-overlay">
                  <span className={`category-badge-chip ${cat.isLoading ? "cat-badge-skeleton" : ""}`}>
                    {cat.badge}
                  </span>
                </div>
              </div>

              {/* Route Offer Cards Grid with Mobile Auto-Scroll */}
              <CategoryOffersStrip cat={cat} onBookCategory={handleBookCategory} />
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
          margin-bottom: 2.25rem;
          width: 100%;
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
          box-sizing: border-box;
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
          display: inline-flex;
          align-items: center;
          justify-content: center;
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

        /* Category Card Block */
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
          grid-template-columns: 220px 1fr;
          gap: 1.15rem;
          align-items: stretch;
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
          min-height: 190px;
          background: #0F172A;
        }

        .category-banner-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center;
          transition: transform 0.4s ease;
          display: block;
        }

        .category-transport-card:hover .category-banner-img {
          transform: scale(1.04);
        }

        .category-banner-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            rgba(15, 23, 42, 0.45) 0%,
            transparent 50%
          );
          padding: 0.9rem;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          pointer-events: none;
        }

        .cat-badge-skeleton {
          color: transparent !important;
          background: linear-gradient(90deg, rgba(255, 255, 255, 0.15) 25%, rgba(255, 255, 255, 0.4) 50%, rgba(255, 255, 255, 0.15) 75%) !important;
          background-size: 200% 100% !important;
          animation: catBadgeShimmer 1.5s infinite !important;
          min-width: 110px;
          display: inline-block;
        }

        @keyframes catBadgeShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .category-badge-chip {
          align-self: flex-start;
          font-family: var(--font-heading);
          font-size: 0.70rem;
          font-weight: 700;
          letter-spacing: 0.04em;
          background: rgba(15, 23, 42, 0.92) !important;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          color: #FFFFFF !important;
          padding: 0.28rem 0.75rem;
          border-radius: 9999px;
          border: 1px solid rgba(255, 255, 255, 0.25) !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
          max-width: 85%;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* Right Offers Grid & Carousel Wrapper */
        .category-offers-wrapper {
          display: flex;
          flex-direction: column;
          justify-content: center;
          min-width: 0;
        }

        .category-offers-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.85rem;
        }

        /* Desktop: strictly display only original 3 routes */
        .category-offers-grid > .route-offer-tile:nth-child(n+4) {
          display: none !important;
        }

        /* Structured Route Offer Tile Matching Reference Column */
        .route-offer-tile {
          background: #FFFFFF;
          border-radius: 18px;
          border: 1.5px solid #E2E8F0;
          padding: 1.15rem 0.95rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          transition: all 0.25s ease;
          cursor: pointer;
          box-shadow: 0 2px 10px rgba(15, 23, 42, 0.04);
          min-width: 0;
        }

        .route-offer-tile:hover {
          background: #FFFFFF;
          border-color: #93C5FD;
          box-shadow: 0 8px 24px rgba(29, 78, 216, 0.08);
          transform: translateY(-2px);
        }

        .route-offer-tile.active-tile {
          border-color: #2563EB;
          box-shadow: 0 8px 24px rgba(29, 78, 216, 0.12);
        }

        .tile-route-head {
          margin-bottom: 0.55rem;
        }

        .route-locations-flow {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          flex-wrap: nowrap;
          gap: 0.45rem;
          margin-bottom: 0.35rem;
          width: 100%;
        }

        .loc-pill {
          font-family: var(--font-heading);
          font-size: 0.76rem;
          font-weight: 700;
          color: #0F172A;
          background: #FFFFFF;
          padding: 0.28rem 0.58rem;
          border-radius: 8px;
          border: 1.5px solid #CBD5E1;
          letter-spacing: 0.02em;
          white-space: nowrap;
          text-align: center;
          line-height: 1.25;
          flex: 0 1 auto;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          box-sizing: border-box;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
        }

        .origin-pill {
          color: #0F172A;
          border-color: #CBD5E1;
          background: #FFFFFF;
        }

        .dest-pill {
          color: #1D4ED8;
          border-color: #BFDBFE;
          background: #EFF6FF;
        }

        .loc-arrow-divider {
          color: #2563EB;
          font-weight: 700;
          font-size: 0.92rem;
          user-select: none;
          flex-shrink: 0;
          line-height: 1;
          display: inline-flex;
          align-items: center;
        }

        .route-type-tag {
          display: block;
          font-size: 0.73rem;
          color: #64748B;
          font-weight: 600;
          line-height: 1.25;
        }

        .route-desc-text {
          font-size: 0.77rem;
          color: #475569;
          line-height: 1.45;
          margin-bottom: 0.85rem;
          min-height: 36px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .tile-price-bottom {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-top: auto;
        }

        .price-stack {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }

        .price-start-lbl {
          font-family: var(--font-heading);
          font-size: 0.64rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          color: #64748B;
          text-transform: uppercase;
          line-height: 1;
        }

        .price-val-main {
          font-family: var(--font-heading);
          font-size: 1.45rem;
          font-weight: 750;
          color: #0F172A;
          line-height: 1.15;
        }

        .price-note-txt {
          font-size: 0.73rem;
          color: #059669;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          margin-top: 0.15rem;
          min-height: 18px;
        }

        .btn-book-tile {
          width: 100%;
          background: linear-gradient(135deg, #1D4ED8 0%, #1E40AF 100%);
          color: #FFFFFF;
          border: none;
          padding: 0.72rem 1rem;
          border-radius: 12px;
          font-family: var(--font-heading);
          font-size: 0.84rem;
          font-weight: 700;
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

        .offers-pagination-dots {
          display: none;
        }

        @media (max-width: 992px) {
          .category-transport-card {
            grid-template-columns: 1fr;
          }
          .category-banner-side {
            min-height: 155px;
          }
        }

        @media (max-width: 768px) {
          /* Mobile filter buttons: 2x2 wrapping grid - 100% visible */
          .pill-tab-wrapper {
            margin-bottom: 1.25rem;
            padding: 0 0.25rem;
          }
          .pill-tab-container {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            width: 100%;
            max-width: 480px;
            gap: 0.45rem;
            padding: 0.35rem;
            border-radius: 16px;
            white-space: normal;
          }
          .pill-tab-btn {
            width: 100%;
            min-height: 44px;
            padding: 0.5rem 0.4rem;
            font-size: 0.76rem;
            line-height: 1.25;
            text-align: center;
            border-radius: 10px;
            white-space: normal;
          }
          .pill-tab-btn span {
            display: block;
            text-align: center;
          }

          .category-transport-card {
            padding: 0.85rem;
            border-radius: 20px;
            gap: 0.75rem;
          }

          .category-banner-side {
            min-height: 160px;
            height: 160px;
            border-radius: 15px;
          }

          .category-banner-overlay {
            padding: 0.75rem;
          }

          /* Mobile horizontal auto-scroll offers carousel */
          .category-offers-grid {
            display: flex;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            gap: 0.75rem;
            padding: 0.25rem 0.15rem 0.45rem;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }
          .category-offers-grid::-webkit-scrollbar {
            display: none;
          }

          /* Mobile: display all routes for infinite circular scrolling */
          .category-offers-grid > .route-offer-tile:nth-child(n+4) {
            display: flex !important;
          }

          .route-offer-tile {
            flex: 0 0 86%;
            max-width: 310px;
            scroll-snap-align: center;
            box-sizing: border-box;
            padding: 1.15rem 1.1rem;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }

          .offers-pagination-dots {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 0.4rem;
            margin-top: 0.55rem;
          }

          .offer-dot {
            width: 7px;
            height: 7px;
            border-radius: 9999px;
            background: #CBD5E1;
            border: none;
            padding: 0;
            cursor: pointer;
            transition: all 0.25s ease;
          }

          .offer-dot.active {
            width: 20px;
            background: #2563EB;
          }
        }

        @media (max-width: 480px) {
          .category-transport-card {
            padding: 0.75rem;
            border-radius: 18px;
          }
          .category-banner-side {
            min-height: 150px;
            height: 150px;
          }
          .loc-pill {
            font-size: 0.65rem;
            padding: 0.24rem 0.35rem;
          }
          .route-locations-flow {
            gap: 0.25rem;
          }
          .route-desc-text {
            font-size: 0.74rem;
            margin-bottom: 0.75rem;
            min-height: 34px;
          }
          .price-val-main {
            font-size: 1.35rem;
          }
          .btn-book-tile {
            padding: 0.7rem 1rem;
            font-size: 0.82rem;
          }
        }
      `}</style>
    </section>
  );
};
