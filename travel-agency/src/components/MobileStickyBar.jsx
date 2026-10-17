import React from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Phone, Calendar, Send } from 'lucide-react';
import { getWhatsAppLink, getPhoneCallLink } from '../utils/whatsapp';
import { businessConfig } from '../config/business.config';

export const MobileStickyBar = ({ onOpenEnquiry }) => {
  return (
    <>
      {/* ── Mobile-Only Fixed Sticky Dock (< 768px) ── */}
      <div className="mobile-sticky-bar" role="navigation" aria-label="Quick Actions">
        <a
          href={getWhatsAppLink({ tripType: 'Intercity Travel' })}
          target="_blank"
          rel="noopener noreferrer"
          className="mobile-bar-btn mobile-whatsapp"
        >
          <MessageSquare size={16} />
          <span>WhatsApp</span>
        </a>

        {businessConfig.phone ? (
          <a href={getPhoneCallLink()} className="mobile-bar-btn mobile-call">
            <Phone size={16} />
            <span>Call 24/7</span>
          </a>
        ) : (
          <Link to="/booking" className="mobile-bar-btn mobile-call">
            <Calendar size={16} />
            <span>Book Cab</span>
          </Link>
        )}

        <button
          type="button"
          onClick={onOpenEnquiry}
          className="mobile-bar-btn mobile-enquire"
        >
          <span className="mobile-enquire-pulse"></span>
          <Send size={15} />
          <span>Enquire</span>
        </button>
      </div>

      {/* ── Desktop Floating Concierge (> 768px) ── */}
      <aside className="desktop-floating-concierge" aria-label="Desktop Concierge">
        <a
          href={getWhatsAppLink({ tripType: 'General Enquiry' })}
          target="_blank"
          rel="noopener noreferrer"
          className="concierge-wa-btn"
          title="Chat directly on WhatsApp"
        >
          <MessageSquare size={20} color="#FFFFFF" />
          <span className="concierge-tooltip">Chat on WhatsApp</span>
        </a>

        <button
          type="button"
          onClick={onOpenEnquiry}
          className="concierge-enquiry-btn"
          title="Instant Cab Booking & Enquiry"
        >
          <span className="concierge-pulse-ring"></span>
          <Send size={16} />
          <span className="concierge-btn-text">Quick Enquiry</span>
        </button>
      </aside>

      <style>{`
        /* Desktop Floating Concierge */
        .desktop-floating-concierge {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          z-index: 9999;
          animation: floatIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes floatIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .concierge-wa-btn {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, #25D366 0%, #1EBE5D 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #FFFFFF;
          text-decoration: none;
          box-shadow: 0 8px 24px rgba(37, 211, 102, 0.4);
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
        }

        .concierge-wa-btn:hover {
          transform: translateY(-3px) scale(1.08);
          box-shadow: 0 12px 28px rgba(37, 211, 102, 0.55);
        }

        .concierge-tooltip {
          position: absolute;
          bottom: calc(100% + 10px);
          right: 0;
          background: #0F172A;
          color: #FFFFFF;
          font-family: var(--font-body, 'Inter', sans-serif);
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.35rem 0.75rem;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          white-space: nowrap;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s ease, transform 0.2s ease;
          transform: translateY(4px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
        }

        .concierge-wa-btn:hover .concierge-tooltip {
          opacity: 1;
          transform: translateY(0);
        }

        .concierge-enquiry-btn {
          position: relative;
          background: linear-gradient(135deg, #1D4ED8 0%, #0284C7 100%);
          color: #FFFFFF;
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 9999px;
          padding: 0.85rem 1.6rem;
          display: flex;
          align-items: center;
          gap: 0.65rem;
          font-family: var(--font-heading, 'Outfit', sans-serif);
          font-size: 0.92rem;
          font-weight: 800;
          letter-spacing: 0.03em;
          box-shadow: 0 10px 30px rgba(2, 132, 199, 0.45);
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .concierge-enquiry-btn:hover {
          transform: translateY(-2px) scale(1.03);
          box-shadow: 0 14px 36px rgba(2, 132, 199, 0.6);
          background: linear-gradient(135deg, #2563EB 0%, #0369A1 100%);
        }

        .concierge-pulse-ring {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #38BDF8;
          box-shadow: 0 0 0 0 rgba(56, 189, 248, 0.7);
          animation: pulseRing 2s infinite;
        }

        @keyframes pulseRing {
          0% { box-shadow: 0 0 0 0 rgba(56, 189, 248, 0.7); }
          70% { box-shadow: 0 0 0 8px rgba(56, 189, 248, 0); }
          100% { box-shadow: 0 0 0 0 rgba(56, 189, 248, 0); }
        }

        /* Mobile Sticky Bar: Hidden on Desktop */
        .mobile-sticky-bar {
          display: none;
        }

        /* Mobile Viewport (< 768px) */
        @media (max-width: 768px) {
          .desktop-floating-concierge {
            display: none !important;
          }

          .mobile-sticky-bar {
            display: flex;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            z-index: 9999;
            background: rgba(10, 15, 29, 0.95);
            backdrop-filter: blur(18px);
            -webkit-backdrop-filter: blur(18px);
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            padding: 0.65rem 0.85rem;
            gap: 0.6rem;
            box-shadow: 0 -8px 30px rgba(0, 0, 0, 0.5);
          }

          .mobile-bar-btn {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.45rem;
            height: 44px;
            border-radius: 12px;
            font-family: var(--font-heading, 'Outfit', sans-serif);
            font-size: 0.82rem;
            font-weight: 800;
            letter-spacing: 0.02em;
            text-decoration: none;
            border: none;
            cursor: pointer;
            transition: all 0.15s ease;
          }

          .mobile-bar-btn.mobile-whatsapp {
            background: linear-gradient(135deg, #25D366 0%, #16A34A 100%);
            color: #FFFFFF;
            box-shadow: 0 4px 14px rgba(37, 211, 102, 0.35);
          }

          .mobile-bar-btn.mobile-call {
            background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%);
            color: #F8FAFC;
            border: 1px solid rgba(255, 255, 255, 0.12);
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3);
          }

          .mobile-bar-btn.mobile-enquire {
            background: linear-gradient(135deg, #1D4ED8 0%, #0284C7 100%);
            color: #FFFFFF;
            border: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 4px 16px rgba(2, 132, 199, 0.45);
            position: relative;
          }

          .mobile-enquire-pulse {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: #38BDF8;
            box-shadow: 0 0 8px #38BDF8;
          }
        }
      `}</style>
    </>
  );
};
