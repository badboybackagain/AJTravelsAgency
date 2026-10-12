import React from 'react';
import { Car, Sparkles, UserCheck, MapPin, Zap, MessageSquare } from 'lucide-react';

export const TrustBar = () => {
  const trustItems = [
    { icon: Car, title: 'LUXURY FLEET', desc: 'Premium sedans, Ertiga & Innova' },
    { icon: Sparkles, title: 'SANITIZED CABS', desc: 'Clean interiors & dual AC' },
    { icon: UserCheck, title: 'VERIFIED CHAUFFEURS', desc: 'Professional highway drivers' },
    { icon: MapPin, title: 'DOORSTEP PICKUP', desc: 'Direct home, office or airport' },
    { icon: Zap, title: 'FAST 30-MIN DISPATCH', desc: 'Prompt citywide availability' },
    { icon: MessageSquare, title: 'INSTANT BOOKING', desc: 'Zero hidden toll charges' }
  ];

  return (
    <div className="trust-connected-bar">
      <div className="container">
        <div className="trust-scroll-container">
          {trustItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={index} className="trust-scroll-card">
                <div className="trust-scroll-icon">
                  <Icon size={16} color="#0284C7" />
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
          background: #FFFFFF;
          border-top: 1px solid #E2E8F0;
          border-bottom: 1px solid #F1F5F9;
          padding: 0.75rem 0;
          position: relative;
          z-index: 10;
          box-shadow: 0 2px 10px rgba(15, 23, 42, 0.02);
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
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          padding: 0.45rem 0.95rem;
          height: 46px;
          display: inline-flex;
          align-items: center;
          gap: 0.65rem;
          flex-shrink: 0;
          white-space: nowrap;
          scroll-snap-align: start;
          transition: all 0.2s ease;
        }

        .trust-scroll-card:hover {
          background: #F0F9FF;
          border-color: #BAE6FD;
          transform: translateY(-1.5px);
          box-shadow: 0 4px 12px rgba(2, 132, 199, 0.08);
        }

        .trust-scroll-icon {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          background: #E0F2FE;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .trust-scroll-text {
          display: flex;
          flex-direction: column;
          line-height: 1.15;
        }

        .trust-scroll-title {
          font-family: var(--font-heading);
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 0.03em;
          color: #0F172A;
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
