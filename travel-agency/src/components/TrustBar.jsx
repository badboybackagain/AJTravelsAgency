import React from 'react';
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

  return (
    <div id="about" className="trust-connected-bar">
      <div className="container">
        <div className="trust-scroll-container">
          {trustItems.map((item, index) => {
            const Icon = ICON_MAP[item.icon] || ShieldCheck;
            return (
              <div key={item.id || index} className={`trust-scroll-card reveal stagger-${(index % 4) + 1}`}>
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
      </div>

      <style>{`
        .trust-connected-bar {
          background: #F8F7F4;
          border-top: 1px solid #DCE3EB;
          border-bottom: 1px solid #DCE3EB;
          padding: 1.15rem 0;
          position: relative;
          z-index: 10;
        }

        .trust-scroll-container {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
          -ms-overflow-style: none;
          padding: 0.2rem 0;
        }

        .trust-scroll-container::-webkit-scrollbar {
          display: none;
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
          scroll-snap-align: start;
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
      `}</style>
    </div>
  );
};
