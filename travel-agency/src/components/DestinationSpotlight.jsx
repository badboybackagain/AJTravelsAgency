import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, Compass, Plane, MapPin, Navigation, Clock, Sparkles, Landmark, ChevronLeft, ChevronRight } from 'lucide-react';
import { buildFareUrl } from '../utils/fareNavigation';
import { homepageContent } from '../data/homepageContent';

const ICON_MAP = {
  'pune-mumbai': Building2,
  'mahabaleshwar': Compass,
  'shirdi': Landmark,
  'lonavala': Navigation,
  'nashik': MapPin,
  'alibaug-goa': Plane,
};

export const DestinationSpotlight = () => {
  const navigate = useNavigate();
  const spotlightData = homepageContent.destinationsSpotlight;
  const destinations = spotlightData.destinations || [];

  const destCount = destinations.length;
  // Render 3 sets of destinations for seamless circular looping on mobile viewports
  const loopDestinations = [...destinations, ...destinations, ...destinations];
  const [realIndex, setRealIndex] = useState(destCount);
  const [isUserSelected, setIsUserSelected] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const wasOutRef = useRef(false);
  const activeIndex = realIndex % destCount;
  const selectedDest = destinations[activeIndex] || destinations[0] || {};

  const sectionRef = useRef(null);
  const stripRef = useRef(null);
  const isInteractingRef = useRef(false);
  const isResettingRef = useRef(false);
  const isProgrammaticScrollRef = useRef(false);
  const programmaticTimerRef = useRef(null);
  const resumeTimerRef = useRef(null);
  const scrollDebounceTimerRef = useRef(null);

  // Preload all destination images on mount to eliminate image decode delay
  useEffect(() => {
    destinations.forEach(d => {
      if (d.image) {
        const img = new Image();
        img.src = d.image;
      }
    });
  }, [destinations]);

  // Position at the start of middle set on mount
  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    if (strip.scrollWidth > strip.clientWidth + 10) {
      const initialCard = strip.children[destCount];
      if (initialCard) {
        const initialLeft = initialCard.offsetLeft - (strip.clientWidth - initialCard.clientWidth) / 2;
        strip.scrollTo({ left: Math.max(0, initialLeft), behavior: 'auto' });
      }
    }
  }, [destCount]);

  // Dedicated helper to smoothly scroll to a target index without triggering onScroll fight
  const scrollToTargetIndex = (targetReal, smooth = true) => {
    const strip = stripRef.current;
    if (!strip) return;

    isProgrammaticScrollRef.current = true;
    if (programmaticTimerRef.current) clearTimeout(programmaticTimerRef.current);

    setRealIndex(targetReal);

    if (strip.scrollWidth > strip.clientWidth + 10) {
      const targetCard = strip.children[targetReal];
      if (targetCard) {
        const targetLeft = targetCard.offsetLeft - (strip.clientWidth - targetCard.clientWidth) / 2;
        if (smooth) {
          strip.scrollTo({ left: Math.max(0, targetLeft), behavior: 'smooth' });
          programmaticTimerRef.current = setTimeout(() => {
            isProgrammaticScrollRef.current = false;
          }, 600);
        } else {
          strip.style.scrollBehavior = 'auto';
          strip.scrollLeft = Math.max(0, targetLeft);
          strip.style.scrollBehavior = '';
          programmaticTimerRef.current = setTimeout(() => {
            isProgrammaticScrollRef.current = false;
          }, 60);
        }
      }
    } else {
      isProgrammaticScrollRef.current = false;
    }
  };

  // Infinite Circular Auto-scroll loop for destinations
  useEffect(() => {
    // Rule 1: Scroll only when the relevant section is visible on screen
    // Rule 3 & 5: When user clicks or manually selects an option, immediately stop auto-scrolling
    if (destCount <= 1 || isUserSelected || !isVisible) return;

    const prefersReduced = typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) return;

    const interval = setInterval(() => {
      if (isInteractingRef.current || isUserSelected || !isVisible) return;
      const strip = stripRef.current;
      if (!strip) return;

      const nextReal = realIndex + 1;
      scrollToTargetIndex(nextReal, true);

      // Circular loop: when smoothly advancing into 3rd set, silently snap back to middle set
      if (nextReal >= 2 * destCount) {
        setTimeout(() => {
          const s = stripRef.current;
          if (!s) return;
          const resetIndex = nextReal - destCount;
          const resetCard = s.children[resetIndex];
          if (resetCard && s.scrollWidth > s.clientWidth + 10) {
            const resetLeft = resetCard.offsetLeft - (s.clientWidth - resetCard.clientWidth) / 2;
            isResettingRef.current = true;
            isProgrammaticScrollRef.current = true;
            s.style.scrollBehavior = 'auto';
            s.style.scrollSnapType = 'none';
            s.scrollLeft = Math.max(0, resetLeft);
            setRealIndex(resetIndex);
            requestAnimationFrame(() => {
              if (s) {
                s.style.scrollSnapType = 'x mandatory';
                s.style.scrollBehavior = '';
              }
              setTimeout(() => {
                isResettingRef.current = false;
                isProgrammaticScrollRef.current = false;
              }, 60);
            });
          }
        }, 600); // Wait for smooth scroll to complete before instant silent position reset
      }
    }, 2200);

    return () => clearInterval(interval);
  }, [realIndex, destCount, isUserSelected, isVisible]);

  // Section visibility & re-entry observer:
  // Rule 1: Scroll only when visible on screen; stop when user is on another section/page.
  // Rule 6: Resume auto-scrolling only when user explicitly leaves and re-enters the section.
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // If the user previously scrolled away, re-entering resets user lock and resumes auto-scroll
          if (wasOutRef.current) {
            setIsUserSelected(false);
            isInteractingRef.current = false;
            wasOutRef.current = false;
          }
        } else {
          setIsVisible(false);
          // Mark that the user has left the section so re-entering resumes
          wasOutRef.current = true;
          isInteractingRef.current = false;
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(section);

    return () => {
      observer.disconnect();
    };
  }, []);

  const pauseInteraction = (resumeDelay = 2200) => {
    isInteractingRef.current = true;
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      isInteractingRef.current = false;
    }, resumeDelay);
  };

  const handleMouseEnter = () => {
    isInteractingRef.current = true;
  };

  const handleMouseLeave = () => {
    pauseInteraction(1500);
  };

  const handleScroll = () => {
    // If programmatic scrolling or silent loop reset is underway, never fight it
    if (isProgrammaticScrollRef.current || isResettingRef.current) return;
    const strip = stripRef.current;
    if (!strip || strip.scrollWidth <= strip.clientWidth + 10) return;

    // Debounce touch drag updates so manual finger movements don't rapidly thrash state
    if (scrollDebounceTimerRef.current) clearTimeout(scrollDebounceTimerRef.current);
    scrollDebounceTimerRef.current = setTimeout(() => {
      if (isProgrammaticScrollRef.current || isResettingRef.current) return;
      const centerPoint = strip.scrollLeft + strip.clientWidth / 2;
      let closestIndex = destCount;
      let minDistance = Infinity;

      Array.from(strip.children).forEach((child, idx) => {
        if (child.classList.contains('dest-icon-card')) {
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
    }, 70);
  };

  const scrollToDestination = (dotIdx) => {
    setIsUserSelected(true);
    isInteractingRef.current = false;
    const targetReal = destCount + dotIdx;
    scrollToTargetIndex(targetReal, true);
  };

  const scrollNext = () => {
    setIsUserSelected(true);
    isInteractingRef.current = false;
    const nextReal = realIndex + 1;
    scrollToTargetIndex(nextReal, true);
    if (nextReal >= 2 * destCount) {
      setTimeout(() => {
        const strip = stripRef.current;
        if (!strip) return;
        const resetIndex = nextReal - destCount;
        const resetCard = strip.children[resetIndex];
        if (resetCard && strip.scrollWidth > strip.clientWidth + 10) {
          const resetLeft = resetCard.offsetLeft - (strip.clientWidth - resetCard.clientWidth) / 2;
          isResettingRef.current = true;
          isProgrammaticScrollRef.current = true;
          strip.style.scrollBehavior = 'auto';
          strip.style.scrollSnapType = 'none';
          strip.scrollLeft = Math.max(0, resetLeft);
          setRealIndex(resetIndex);
          requestAnimationFrame(() => {
            if (strip) {
              strip.style.scrollSnapType = 'x mandatory';
              strip.style.scrollBehavior = '';
            }
            setTimeout(() => {
              isResettingRef.current = false;
              isProgrammaticScrollRef.current = false;
            }, 60);
          });
        }
      }, 600);
    }
  };

  const scrollPrev = () => {
    setIsUserSelected(true);
    isInteractingRef.current = false;
    const prevReal = realIndex - 1;
    scrollToTargetIndex(prevReal, true);
    if (prevReal < destCount) {
      setTimeout(() => {
        const strip = stripRef.current;
        if (!strip) return;
        const resetIndex = prevReal + destCount;
        const resetCard = strip.children[resetIndex];
        if (resetCard && strip.scrollWidth > strip.clientWidth + 10) {
          const resetLeft = resetCard.offsetLeft - (strip.clientWidth - resetCard.clientWidth) / 2;
          isResettingRef.current = true;
          isProgrammaticScrollRef.current = true;
          strip.style.scrollBehavior = 'auto';
          strip.style.scrollSnapType = 'none';
          strip.scrollLeft = Math.max(0, resetLeft);
          setRealIndex(resetIndex);
          requestAnimationFrame(() => {
            if (strip) {
              strip.style.scrollSnapType = 'x mandatory';
              strip.style.scrollBehavior = '';
            }
            setTimeout(() => {
              isResettingRef.current = false;
              isProgrammaticScrollRef.current = false;
            }, 60);
          });
        }
      }, 600);
    }
  };

  const handleBookDestination = (dest) => {
    const isCorridor = dest.dropKey === 'mumbai';
    const fareUrl = buildFareUrl({
      tripType: 'ONE_WAY',
      pickupId: 'pune',
      dropId: dest.dropKey,
      pickupName: 'Pune (All Areas)',
      dropName: dest.name,
      isCustomRoute: !isCorridor,
    });

    // Notify homepage booking form if present
    window.dispatchEvent(
      new CustomEvent('preFillBooking', {
        detail: {
          tripType: 'ONE_WAY',
          pickupId: 'pune',
          dropId: dest.dropKey,
        },
      })
    );

    navigate(fareUrl);
  };

  return (
    <section
      ref={sectionRef}
      id="destinations"
      className="section-padding bg-white"
      style={{ paddingTop: '4.5rem', paddingBottom: '5rem', position: 'relative' }}
    >
      <div className="container">
        {/* Lovable Modern Section Header */}
        <div className="lovable-section-header">
          <div className="lovable-badge">
            <Sparkles size={13} />
            <span>{spotlightData.badge}</span>
          </div>
          <h2 className="lovable-title">
            {spotlightData.title}
          </h2>
          <p className="lovable-subtitle">
            {spotlightData.subtitle}
          </p>
          <div className="lovable-divider">
            <div className="lovable-divider-line"></div>
            <div className="lovable-divider-dot"></div>
            <div className="lovable-divider-line right"></div>
          </div>
        </div>

        {/* Icon Selector Cards Bar */}
        <div className="dest-strip-wrapper">
          <div
            ref={stripRef}
            className="dest-icon-strip"
            role="tablist"
            aria-label="Trending Outstation Corridors"
            onScroll={handleScroll}
            onMouseEnter={() => { isInteractingRef.current = true; }}
            onMouseLeave={() => pauseInteraction(1500)}
            onTouchStart={() => pauseInteraction(2200)}
            onTouchMove={() => pauseInteraction(2200)}
            onTouchEnd={() => pauseInteraction(2500)}
          >
            {loopDestinations.map((d, idx) => {
              const Icon = ICON_MAP[d.id] || MapPin;
              const isSelected = (idx % destCount) === (realIndex % destCount);
              return (
                <button
                  key={`${d.id}-${idx}`}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  className={`dest-icon-card ${isSelected ? 'active' : ''}`}
                  onClick={() => scrollToDestination(idx % destCount)}
                >
                  <div className="dest-icon-box">
                    <Icon size={22} color={isSelected ? '#FFFFFF' : '#2563EB'} />
                  </div>
                  <span className="dest-icon-name">{d.name}</span>
                  <span className="dest-icon-city">{d.city}</span>
                </button>
              );
            })}
          </div>

          {/* Mobile Navigation Controls: Arrows and Dots */}
          <div className="dest-mobile-controls" aria-label="Destination navigation">
            <button
              type="button"
              className="dest-nav-arrow dest-nav-prev"
              onClick={scrollPrev}
              aria-label="Previous destination"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="dest-pagination-dots" aria-hidden="true">
              {destinations.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className={`dest-dot ${i === (realIndex % destCount) ? 'active' : ''}`}
                  onClick={() => scrollToDestination(i)}
                  aria-label={`Go to destination ${i + 1}`}
                />
              ))}
            </div>

            <button
              type="button"
              className="dest-nav-arrow dest-nav-next"
              onClick={scrollNext}
              aria-label="Next destination"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Perfectly Balanced 2-Column Spotlight Box */}
        <div
          className="spotlight-card-wrapper"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="spotlight-2col-grid">
            {/* Left Content Column */}
            <div className="spotlight-left-col">
              <span className="spotlight-eyebrow">DESTINATION FOCUS</span>
              <h3 className="spotlight-title">{selectedDest.title}</h3>
              <p className="spotlight-tagline">{selectedDest.tagline}</p>
              <p className="spotlight-desc">{selectedDest.desc}</p>

              {/* Sleek Unified Corridor Route & Travel Time Details */}
              <div className="spotlight-corridor-card">
                <div className="corridor-row">
                  <div className="corridor-icon-wrap">
                    <Navigation size={15} color="#38BDF8" />
                  </div>
                  <div className="corridor-info">
                    <span className="corridor-tag">POPULAR HIGHWAY ROUTE</span>
                    <span className="corridor-text">{selectedDest.popularRoute}</span>
                  </div>
                </div>

                <div className="corridor-sep" />

                <div className="corridor-row">
                  <div className="corridor-icon-wrap">
                    <Clock size={15} color="#FBBF24" />
                  </div>
                  <div className="corridor-info">
                    <span className="corridor-tag">EST. TRAVEL DURATION</span>
                    <span className="corridor-text">{selectedDest.estTime}</span>
                  </div>
                </div>
              </div>

              {/* Action Button Row */}
              <div className="spotlight-action-row">
                <button
                  type="button"
                  onClick={() => handleBookDestination(selectedDest)}
                  className="btn-emerald-glowing"
                >
                  Book Cab to {selectedDest.name}
                </button>
              </div>
            </div>

            {/* Right Media Image Card Column */}
            <div className="spotlight-right-col">
              <div className="spotlight-media-card">
                <img
                  src={selectedDest.image}
                  alt={selectedDest.title}
                  className="spotlight-media-img"
                  loading="eager"
                  decoding="sync"
                />
                <div className="spotlight-media-overlay">
                  <span className="media-chip">
                    <Compass size={14} color="#D8AE55" />
                    <span>{selectedDest.city} Sector Express</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spotlightFadeIn {
          0% {
            opacity: 0.65;
            transform: translateY(6px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .btn-emerald-glowing {
          background: linear-gradient(135deg, #1D4ED8 0%, #1E40AF 100%);
          color: #FFFFFF;
          font-family: var(--font-heading);
          font-size: 0.9rem;
          font-weight: 700;
          letter-spacing: 0.02em;
          padding: 0.82rem 1.6rem;
          border-radius: 12px;
          border: none;
          display: inline-flex;
          align-items: center;
          gap: 0.55rem;
          box-shadow: 0 4px 14px rgba(29, 78, 216, 0.35);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: pointer;
        }

        .btn-emerald-glowing:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(29, 78, 216, 0.45);
          background: linear-gradient(135deg, #1E40AF 0%, #172554 100%);
        }

        .btn-emerald-glowing:active {
          transform: translateY(0);
        }

        .dest-strip-wrapper {
          position: relative;
          width: 100%;
          margin-bottom: 2.25rem;
        }

        .dest-mobile-controls {
          display: none;
        }

        .dest-icon-strip {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 0.85rem;
          margin-bottom: 0;
          width: 100%;
          position: relative;
        }

        /* Desktop: strictly display only original 6 destination cards */
        .dest-icon-strip > .dest-icon-card:nth-child(n+7) {
          display: none !important;
        }

        .dest-icon-card {
          background: #FFFFFF;
          border-radius: 16px;
          padding: 1rem 0.65rem;
          min-width: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          border: 1.5px solid #DCE3EB;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: pointer;
        }

        .dest-icon-card:hover {
          border-color: #93C5FD;
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(37, 99, 235, 0.1);
        }

        .dest-icon-card.active {
          background: #EFF6FF;
          border-color: #2563EB;
          box-shadow: 0 8px 24px rgba(37, 99, 235, 0.16);
          transform: translateY(-2px);
        }

        .dest-icon-box {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: #EFF6FF;
          border: 1px solid #BFDBFE;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 0.5rem;
          transition: all 0.2s ease;
        }

        .dest-icon-card.active .dest-icon-box {
          background: #2563EB;
          border-color: #2563EB;
        }

        .dest-icon-name {
          font-family: var(--font-heading);
          font-size: 0.86rem;
          font-weight: 600;
          color: #17324D;
          line-height: 1.25;
        }

        .dest-icon-card.active .dest-icon-name {
          color: #1D4ED8;
        }

        .dest-icon-city {
          font-size: 0.72rem;
          color: #64748B;
          margin-top: 0.25rem;
          font-weight: 450;
          letter-spacing: 0.01em;
        }

        .spotlight-card-wrapper {
          background: linear-gradient(145deg, #0B111E 0%, #0F172A 100%);
          border-radius: 24px;
          padding: 2.75rem;
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.25), 0 0 30px rgba(37, 99, 235, 0.08);
          color: #F8FAFC;
        }

        .spotlight-2col-grid {
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: 2.5rem;
          align-items: center;
          animation: spotlightFadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .spotlight-left-col {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          text-align: left;
        }

        .spotlight-eyebrow {
          font-family: var(--font-heading);
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          color: #60A5FA;
          margin-bottom: 0.6rem;
          background: rgba(37, 99, 235, 0.2);
          padding: 0.3rem 0.85rem;
          border-radius: 9999px;
          border: 1px solid rgba(96, 165, 250, 0.4);
        }

        .spotlight-title {
          font-size: clamp(1.4rem, 2.5vw, 1.95rem);
          font-weight: 650;
          line-height: 1.2;
          margin-bottom: 0.45rem;
          color: #FFFFFF;
          letter-spacing: -0.015em;
        }

        .spotlight-tagline {
          font-size: 0.95rem;
          color: #38BDF8;
          font-weight: 500;
          margin-bottom: 0.85rem;
        }

        .spotlight-desc {
          font-size: 0.92rem;
          color: #CBD5E1;
          line-height: 1.65;
          margin-bottom: 1.45rem;
        }

        /* Sleek Unified Corridor Details Card */
        .spotlight-corridor-card {
          width: 100%;
          background: rgba(15, 23, 42, 0.65);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 14px;
          padding: 0.9rem 1.15rem;
          margin-bottom: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
        }

        .corridor-row {
          display: flex;
          align-items: flex-start;
          gap: 0.85rem;
        }

        .corridor-icon-wrap {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 0.15rem;
        }

        .corridor-info {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
          min-width: 0;
        }

        .corridor-tag {
          font-size: 0.70rem;
          font-weight: 600;
          letter-spacing: 0.05em;
          color: #94A3B8;
          text-transform: uppercase;
        }

        .corridor-text {
          font-family: var(--font-heading);
          font-size: 0.92rem;
          font-weight: 600;
          color: #FFFFFF;
          line-height: 1.35;
        }

        .corridor-sep {
          height: 1px;
          background: rgba(255, 255, 255, 0.08);
          width: 100%;
        }

        .spotlight-action-row {
          width: 100%;
        }

        .spotlight-right-col {
          width: 100%;
        }

        .spotlight-media-card {
          position: relative;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.12);
          height: 330px;
        }

        .spotlight-media-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s ease;
        }

        .spotlight-media-card:hover .spotlight-media-img {
          transform: scale(1.03);
        }

        .spotlight-media-overlay {
          position: absolute;
          top: 1rem;
          left: 1rem;
          z-index: 2;
        }

        .media-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: rgba(15, 23, 42, 0.85);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 0.35rem 0.8rem;
          border-radius: 9999px;
          font-family: var(--font-heading);
          font-size: 0.8rem;
          font-weight: 600;
          color: #FFFFFF;
        }

        @media (max-width: 1024px) {
          .dest-icon-strip {
            grid-template-columns: repeat(3, 1fr);
            gap: 0.75rem;
          }
          .spotlight-card-wrapper {
            padding: 1.75rem;
          }
          .spotlight-2col-grid {
            grid-template-columns: 1fr;
            gap: 2rem;
          }
          .spotlight-media-card {
            height: 260px;
          }
        }

        @media (max-width: 768px) {
          .dest-strip-wrapper {
            margin-bottom: 0.75rem !important;
          }

          .dest-icon-strip {
            display: flex !important;
            flex-wrap: nowrap !important;
            justify-content: flex-start !important;
            overflow-x: auto !important;
            scroll-snap-type: x mandatory;
            gap: 0.65rem !important;
            padding: 0.25rem 0.25rem 0.75rem !important;
            margin-bottom: 0.4rem !important;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            position: relative;
          }
          .dest-icon-strip::-webkit-scrollbar {
            display: none;
          }

          /* Mobile: display all cards for infinite circular loop */
          .dest-icon-strip > .dest-icon-card:nth-child(n+7) {
            display: flex !important;
          }

          .dest-mobile-controls {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.85rem;
            margin-top: 0.45rem;
            margin-bottom: 1.15rem;
          }

          .dest-nav-arrow {
            width: 32px;
            height: 32px;
            border-radius: 9999px;
            background: #FFFFFF;
            border: 1.5px solid #CBD5E1;
            color: #1E293B;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 2px 6px rgba(15, 23, 42, 0.08);
            transition: all 0.2s ease;
          }

          .dest-nav-arrow:hover,
          .dest-nav-arrow:active {
            background: #2563EB;
            color: #FFFFFF;
            border-color: #2563EB;
          }

          .dest-pagination-dots {
            display: flex;
            align-items: center;
            gap: 0.4rem;
          }

          .dest-dot {
            width: 7px;
            height: 7px;
            border-radius: 9999px;
            background: #CBD5E1;
            border: none;
            padding: 0;
            cursor: pointer;
            transition: all 0.25s ease;
          }

          .dest-dot.active {
            width: 22px;
            background: #2563EB;
          }
          .dest-icon-card {
            flex: 0 0 auto !important;
            min-width: 104px !important;
            max-width: 120px !important;
            scroll-snap-align: center;
            padding: 0.65rem 0.45rem !important;
            border-radius: 12px !important;
          }
          .dest-icon-card.active {
            border-color: #2563EB !important;
            border-width: 2px !important;
            box-shadow: 0 4px 16px rgba(37, 99, 235, 0.22) !important;
          }
          .dest-icon-box {
            width: 36px !important;
            height: 36px !important;
            margin-bottom: 0.35rem !important;
            border-radius: 10px !important;
          }
          .dest-icon-box svg {
            width: 18px !important;
            height: 18px !important;
          }
          .dest-icon-name {
            font-size: 0.76rem !important;
          }
          .dest-icon-city {
            font-size: 0.66rem !important;
          }

          .spotlight-card-wrapper {
            padding: 1.25rem 1.15rem !important;
            border-radius: 20px !important;
          }
          .spotlight-2col-grid {
            display: flex !important;
            flex-direction: column !important;
            gap: 1.15rem !important;
          }
          .spotlight-left-col {
            width: 100% !important;
          }
          .spotlight-right-col {
            width: 100% !important;
            order: -1 !important;
          }
          .spotlight-media-card {
            height: 170px !important;
            border-radius: 14px !important;
          }
          .spotlight-media-overlay {
            top: 0.75rem !important;
            left: 0.75rem !important;
            bottom: auto !important;
          }
          .spotlight-eyebrow {
            font-size: 0.68rem !important;
            padding: 0.25rem 0.75rem !important;
            margin-bottom: 0.45rem !important;
          }
          .spotlight-title {
            font-size: 1.25rem !important;
            line-height: 1.25 !important;
            margin-bottom: 0.35rem !important;
          }
          .spotlight-tagline {
            font-size: 0.82rem !important;
            line-height: 1.4 !important;
            margin-bottom: 0.85rem !important;
          }
          /* Hide verbose description paragraph on mobile to keep card clean and uncluttered */
          .spotlight-desc {
            display: none !important;
          }
          .spotlight-corridor-card {
            padding: 0.75rem 0.85rem !important;
            border-radius: 12px !important;
            margin-bottom: 1.15rem !important;
            gap: 0.6rem !important;
          }
          .corridor-row {
            gap: 0.65rem !important;
          }
          .corridor-icon-wrap {
            width: 26px !important;
            height: 26px !important;
          }
          .corridor-tag {
            font-size: 0.66rem !important;
          }
          .corridor-text {
            font-size: 0.82rem !important;
            line-height: 1.3 !important;
          }
          .spotlight-action-row {
            width: 100% !important;
          }
          .btn-emerald-glowing {
            width: 100% !important;
            justify-content: center !important;
            padding: 0.85rem 1rem !important;
            font-size: 0.88rem !important;
            border-radius: 12px !important;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .spotlight-2col-grid {
            animation: none !important;
          }
          .dest-icon-strip {
            scroll-behavior: auto !important;
          }
          .dest-icon-card {
            transition: none !important;
          }
        }
      `}</style>
    </section>
  );
};
