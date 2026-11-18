import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, RefreshCw, Check, Sparkles } from 'lucide-react';
import { homepageContent } from '../data/homepageContent';

export const OneWayRoundTripSection = () => {
  const tripData = homepageContent.tripOptions;
  const oneWay = tripData.oneWay;
  const roundTrip = tripData.roundTrip;

  const [activeIndex, setActiveIndex] = useState(0);
  const [isUserSelected, setIsUserSelected] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const containerRef = useRef(null);
  const isInteractingRef = useRef(false);
  const resumeTimerRef = useRef(null);
  const autoScrollTimerRef = useRef(null);
  const isInitialVisibilityKickRef = useRef(true);
  const wasOutRef = useRef(false);

  const handleSelectType = (type) => {
    setIsUserSelected(true);
    if (autoScrollTimerRef.current) {
      clearTimeout(autoScrollTimerRef.current);
      autoScrollTimerRef.current = null;
    }
    window.dispatchEvent(new CustomEvent('selectTripType', { detail: type }));
    const el = document.getElementById('home');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToIndex = (index) => {
    const container = containerRef.current;
    if (!container) return;
    const targetCard = container.children[index];
    if (targetCard) {
      const targetLeft = targetCard.offsetLeft - (container.clientWidth - targetCard.clientWidth) / 2;
      container.scrollTo({ left: Math.max(0, targetLeft), behavior: 'smooth' });
      setActiveIndex(index);
    }
  };

  // IntersectionObserver: start auto-scroll immediately upon entering screen
  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (wasOutRef.current) {
            isInitialVisibilityKickRef.current = true;
            wasOutRef.current = false;
          }
        } else {
          setIsVisible(false);
          wasOutRef.current = true;
          isInitialVisibilityKickRef.current = true;
          isInteractingRef.current = false;
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Auto-scroll loop between One-Way (0) and Round-Trip (1)
  useEffect(() => {
    if (isUserSelected || !isVisible) {
      if (autoScrollTimerRef.current) {
        clearTimeout(autoScrollTimerRef.current);
        autoScrollTimerRef.current = null;
      }
      return;
    }

    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    if (autoScrollTimerRef.current) {
      clearTimeout(autoScrollTimerRef.current);
      autoScrollTimerRef.current = null;
    }

    const startDelay = isInitialVisibilityKickRef.current ? 400 : 2800;
    isInitialVisibilityKickRef.current = false;

    autoScrollTimerRef.current = setTimeout(() => {
      if (isInteractingRef.current || isUserSelected || !isVisible) return;
      const container = containerRef.current;
      if (!container) return;

      // Only auto-scroll when horizontal overflow is present (mobile / tablet)
      if (container.scrollWidth <= container.clientWidth + 10) return;

      const nextIndex = activeIndex === 0 ? 1 : 0;
      scrollToIndex(nextIndex);
    }, startDelay);

    return () => {
      if (autoScrollTimerRef.current) {
        clearTimeout(autoScrollTimerRef.current);
        autoScrollTimerRef.current = null;
      }
    };
  }, [activeIndex, isUserSelected, isVisible]);

  const pauseInteraction = (resumeDelay = 3000) => {
    isInteractingRef.current = true;
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      isInteractingRef.current = false;
    }, resumeDelay);
  };

  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;
    const centerPoint = container.scrollLeft + container.clientWidth / 2;
    let closestIndex = 0;
    let minDistance = Infinity;

    Array.from(container.children).forEach((child, idx) => {
      if (child.classList.contains('trip-card')) {
        const cardCenter = child.offsetLeft + child.clientWidth / 2;
        const dist = Math.abs(centerPoint - cardCenter);
        if (dist < minDistance) {
          minDistance = dist;
          closestIndex = idx;
        }
      }
    });
    setActiveIndex(closestIndex);
  };

  return (
    <section className="section-padding bg-ivory" style={{ paddingTop: '4.5rem', paddingBottom: '5rem', position: 'relative' }}>
      <div className="container">
        {/* Lovable Modern Section Header */}
        <div className="lovable-section-header">
          <div className="lovable-badge">
            <Sparkles size={13} />
            <span>{tripData.badge}</span>
          </div>
          <h2 className="lovable-title">
            {tripData.title}
          </h2>
          <p className="lovable-subtitle">
            {tripData.subtitle}
          </p>
          <div className="lovable-divider">
            <div className="lovable-divider-line"></div>
            <div className="lovable-divider-dot"></div>
            <div className="lovable-divider-line right"></div>
          </div>
        </div>

        <div 
          ref={containerRef}
          className="trip-types-grid"
          onScroll={handleScroll}
          onTouchStart={() => pauseInteraction(4000)}
          onMouseDown={() => pauseInteraction(4000)}
        >
          {/* One Way Card - Crisp White Enterprise Card */}
          <div id="pune-mumbai-one-way" className="trip-card trip-card-light reveal stagger-1">
            <div className="trip-card-badge">{oneWay.badge}</div>
            <h2>{oneWay.title}</h2>
            <p className="trip-desc">
              {oneWay.desc}
            </p>
            <ul className="trip-feature-list">
              {oneWay.features.map((feat, i) => (
                <li key={i}><Check size={16} color="#2563EB" /> {feat}</li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => handleSelectType(oneWay.tripType)}
              className="trip-card-btn trip-card-btn-oneway"
            >
              <ArrowRight size={18} />
              <span>{oneWay.buttonText}</span>
            </button>
          </div>

          {/* Round Trip Card - Premium Deep Navy Contrast Card */}
          <div id="pune-mumbai-round-trip" className="trip-card trip-card-featured reveal stagger-2">
            <div className="trip-card-badge roundtrip-badge">{roundTrip.badge}</div>
            <h2>{roundTrip.title}</h2>
            <p className="trip-desc">
              {roundTrip.desc}
            </p>
            <ul className="trip-feature-list">
              {roundTrip.features.map((feat, i) => (
                <li key={i}><Check size={16} color="#38BDF8" /> {feat}</li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => handleSelectType(roundTrip.tripType)}
              className="trip-card-btn trip-card-btn-roundtrip"
            >
              <RefreshCw size={18} />
              <span>{roundTrip.buttonText}</span>
            </button>
          </div>
        </div>

        {/* Mobile Indicator Dots */}
        <div className="trip-mobile-indicators">
          <button
            type="button"
            className={`trip-dot ${activeIndex === 0 ? 'active' : ''}`}
            onClick={() => {
              pauseInteraction(5000);
              scrollToIndex(0);
            }}
            aria-label="One-Way Cabs"
          />
          <button
            type="button"
            className={`trip-dot ${activeIndex === 1 ? 'active' : ''}`}
            onClick={() => {
              pauseInteraction(5000);
              scrollToIndex(1);
            }}
            aria-label="Round-Trip Rentals"
          />
        </div>
      </div>

      <style>{`
        .trip-types-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }

        .trip-card {
          border-radius: var(--radius-xl);
          padding: 2.75rem;
          display: flex;
          flex-direction: column;
          position: relative;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .trip-card-light {
          background: #FFFFFF;
          border: 1.5px solid #DCE3EB;
          box-shadow: 0 4px 20px rgba(15, 23, 42, 0.05);
          color: #1E293B;
        }

        .trip-card-light:hover {
          border-color: #93C5FD;
          box-shadow: 0 16px 36px rgba(15, 23, 42, 0.09);
          transform: translateY(-4px);
        }

        .trip-card-light .trip-card-badge {
          background: #EFF6FF;
          color: #2563EB;
          border: 1px solid #BFDBFE;
        }

        .trip-card-light h2 {
          color: #17324D;
        }

        .trip-card-light .trip-desc {
          color: #475569;
        }

        .trip-card-light .trip-feature-list li {
          color: #1E293B;
        }

        .trip-card-featured {
          background: linear-gradient(145deg, #0F172A 0%, #090D16 100%);
          border: 1.5px solid rgba(56, 189, 248, 0.35);
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35);
          color: #FFFFFF;
        }

        .trip-card-featured:hover {
          border-color: #38BDF8;
          box-shadow: 0 20px 50px rgba(2, 132, 199, 0.35);
          transform: translateY(-4px);
        }

        .trip-card-featured h2 {
          color: #FFFFFF;
        }

        .trip-card-featured .trip-desc {
          color: #CBD5E1;
        }

        .trip-card-featured .trip-feature-list li {
          color: #F1F5F9;
        }

        .trip-card-badge {
          display: inline-block;
          align-self: flex-start;
          font-family: var(--font-heading);
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          padding: 0.4rem 0.95rem;
          border-radius: 9999px;
          margin-bottom: 1.25rem;
        }

        .roundtrip-badge {
          background: linear-gradient(135deg, #0284C7 0%, #2563EB 100%);
          color: #FFFFFF;
          border: 1px solid rgba(147, 197, 253, 0.45);
          box-shadow: 0 0 16px rgba(2, 132, 199, 0.45);
        }

        .trip-card h2 {
          font-size: 1.75rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          margin-bottom: 1rem;
        }

        .trip-desc {
          font-size: 0.95rem;
          margin-bottom: 1.5rem;
          line-height: 1.65;
        }

        .trip-feature-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
          margin-bottom: 2.25rem;
          flex-grow: 1;
        }

        .trip-feature-list li {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          font-size: 0.92rem;
          font-weight: 500;
        }

        .trip-card-btn {
          width: 100%;
          height: 52px;
          min-height: 52px;
          border-radius: 14px;
          font-family: var(--font-heading);
          font-size: 0.95rem;
          font-weight: 800;
          letter-spacing: 0.02em;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.65rem;
          cursor: pointer;
          border: none;
          margin-top: auto;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .trip-card-btn-oneway {
          background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
          color: #FFFFFF;
          box-shadow: 0 6px 18px rgba(37, 99, 235, 0.3);
        }

        .trip-card-btn-oneway:hover {
          background: linear-gradient(135deg, #1D4ED8 0%, #1E40AF 100%);
          box-shadow: 0 8px 26px rgba(37, 99, 235, 0.45);
          transform: translateY(-2px);
        }

        .trip-card-btn-roundtrip {
          background: linear-gradient(135deg, #0284C7 0%, #2563EB 100%);
          color: #FFFFFF;
          box-shadow: 0 6px 20px rgba(2, 132, 199, 0.35);
        }

        .trip-card-btn-roundtrip:hover {
          background: linear-gradient(135deg, #0369A1 0%, #1D4ED8 100%);
          box-shadow: 0 8px 26px rgba(2, 132, 199, 0.5);
          transform: translateY(-2px);
        }

        .trip-mobile-indicators {
          display: none;
          justify-content: center;
          align-items: center;
          gap: 0.5rem;
          margin-top: 1.25rem;
        }

        @media (max-width: 768px) {
          .trip-types-grid {
            display: flex;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            gap: 1rem;
            padding: 0.5rem 0.25rem 1rem;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }
          .trip-types-grid::-webkit-scrollbar {
            display: none;
          }
          .trip-card {
            flex: 0 0 85%;
            max-width: 310px;
            scroll-snap-align: center;
            padding: 1.35rem;
            border-radius: 18px;
          }
          .trip-mobile-indicators {
            display: flex;
          }
          .trip-dot {
            width: 8px;
            height: 8px;
            border-radius: 9999px;
            background: #CBD5E1;
            border: none;
            padding: 0;
            cursor: pointer;
            transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          }
          .trip-dot.active {
            width: 26px;
            background: #2563EB;
            box-shadow: 0 2px 8px rgba(37, 99, 235, 0.35);
          }
          .trip-card h2 {
            font-size: 1.35rem;
          }
          .trip-desc {
            font-size: 0.84rem;
            margin-bottom: 1rem;
          }
          .trip-feature-list {
            margin-bottom: 1.25rem;
            gap: 0.5rem;
          }
          /* In mobile view strictly show only the first two features */
          .trip-feature-list li:nth-child(n+3) {
            display: none !important;
          }
          .trip-feature-list li {
            font-size: 0.8rem;
          }
        }
      `}</style>
    </section>
  );
};
