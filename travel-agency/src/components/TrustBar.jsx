import React, { useState, useRef, useEffect } from 'react';
import { Car, Sparkles, UserCheck, MapPin, Zap, MessageSquare, ShieldCheck, Clock } from 'lucide-react';
import { homepageContent } from '../data/homepageContent';

const ICON_MAP = {
  Car,
  Sparkles,
  UserCheck,
  MapPin,
  ShieldCheck,
  Clock,
  Zap,
  MessageSquare,
};

export const TrustBar = () => {
  const trustItems = homepageContent.trustBar || [];
  const [isTouchPaused, setIsTouchPaused] = useState(false);
  const touchTimerRef = useRef(null);

  // Clean up touch timer on unmount
  useEffect(() => {
    return () => {
      if (touchTimerRef.current) {
        clearTimeout(touchTimerRef.current);
      }
    };
  }, []);

  const handleTouchStart = () => {
    setIsTouchPaused(true);
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
    }
  };

  const handleTouchEnd = () => {
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
    }
    // Resume continuous circular scrolling after 2 seconds of touch release
    touchTimerRef.current = setTimeout(() => {
      setIsTouchPaused(false);
    }, 2000);
  };

  // 4 identical groups ensure continuous circular looping without waiting on any screen size
  const groups = [0, 1, 2, 3];

  return (
    <div id="about" className="trust-connected-bar">
      <div
        className="trust-marquee-viewport"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        aria-label="Verified Fleet and Service Features"
      >
        <div className="trust-marquee-track">
          {groups.map((groupIndex) => (
            <div
              key={groupIndex}
              className="trust-marquee-group"
              style={{ animationPlayState: isTouchPaused ? 'paused' : undefined }}
              aria-hidden={groupIndex > 0 ? 'true' : undefined}
            >
              {trustItems.map((item, index) => {
                const Icon = ICON_MAP[item.icon] || ShieldCheck;
                return (
                  <div key={`${item.id || index}-${groupIndex}`} className="trust-scroll-card">
                    <div className="trust-scroll-icon">
                      <Icon size={16} color="#1D4ED8" />
                    </div>
                    <div className="trust-scroll-text">
                      <span className="trust-scroll-title">{item.title}</span>
                      <span className="trust-scroll-desc">{item.desc}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .trust-connected-bar {
          background: #F8F7F4;
          border-top: 1px solid #DCE3EB;
          border-bottom: 1px solid #DCE3EB;
          padding: 1.15rem 0;
          position: relative;
          z-index: 10;
          overflow: hidden;
        }

        .trust-marquee-viewport {
          width: 100%;
          overflow: hidden;
          position: relative;
          mask-image: linear-gradient(to right, transparent 0%, black 2.5%, black 97.5%, transparent 100%);
          -webkit-mask-image: linear-gradient(to right, transparent 0%, black 2.5%, black 97.5%, transparent 100%);
        }

        .trust-marquee-track {
          display: flex;
          width: max-content;
          user-select: none;
        }

        .trust-marquee-group {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          padding-right: 0.85rem;
          flex-shrink: 0;
          animation: trustCircularMarquee 28s linear infinite;
          will-change: transform;
        }

        @keyframes trustCircularMarquee {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-100%, 0, 0);
          }
        }

        /* Pause circular scrolling on hover for easy reading */
        .trust-marquee-viewport:hover .trust-marquee-group {
          animation-play-state: paused;
        }

        .trust-scroll-card {
          background: #FFFFFF;
          border: 1.5px solid #DCE3EB;
          border-radius: 14px;
          padding: 0.55rem 1.15rem;
          height: 52px;
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          flex-shrink: 0;
          white-space: nowrap;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 2px 6px rgba(15, 23, 42, 0.04);
        }

        .trust-scroll-card:hover {
          background: #FFFFFF;
          border-color: #93C5FD;
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(37, 99, 235, 0.12);
        }

        .trust-scroll-icon {
          width: 32px;
          height: 32px;
          border-radius: 9px;
          background: #EFF6FF;
          border: 1px solid #BFDBFE;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: #2563EB;
        }

        .trust-scroll-text {
          display: flex;
          flex-direction: column;
          line-height: 1.15;
        }

        .trust-scroll-title {
          font-family: var(--font-heading, 'Outfit', sans-serif);
          font-size: 0.76rem;
          font-weight: 800;
          letter-spacing: 0.04em;
          color: #17324D;
        }

        .trust-scroll-desc {
          font-size: 0.68rem;
          color: #64748B;
          margin-top: 0.1rem;
        }

        @media (prefers-reduced-motion: reduce) {
          .trust-marquee-group {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
};
