import React, { useState } from 'react';
import {
  ChevronDown,
  MessageSquare,
  Sparkles,
  HelpCircle,
  PhoneCall,
  Car,
  CreditCard,
  MapPin,
  Plane,
} from 'lucide-react';
import { getWhatsAppLink, getPhoneCallLink } from '../utils/whatsapp';
import { businessConfig } from '../config/business.config';
import { homepageContent } from '../data/homepageContent';

const FAQ_DATA = homepageContent.faqs || [];

export const FAQSection = () => {
  const [openIds, setOpenIds] = useState([1]); // default open first item
  const [showAll, setShowAll] = useState(false);

  const toggleItem = (id) => {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Small relevant selection (top 6) or all 14 questions
  const displayedFAQs = showAll ? FAQ_DATA : FAQ_DATA.slice(0, 6);
  const col1FAQs = displayedFAQs.filter((_, idx) => idx % 2 === 0);
  const col2FAQs = displayedFAQs.filter((_, idx) => idx % 2 === 1);

  const renderFAQCard = (faq) => {
    const isOpen = openIds.includes(faq.id);
    return (
      <div
        key={faq.id}
        className={`faq-card-modern ${isOpen ? 'open' : ''}`}
      >
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            toggleItem(faq.id);
          }}
          className="faq-card-header"
          aria-expanded={isOpen}
        >
          <div className="faq-card-title-group">
            <span className="faq-card-category-tag">
              {faq.categoryLabel}
            </span>
            <h3 className="faq-card-question">{faq.q}</h3>
          </div>
          <div className={`faq-card-chevron-box ${isOpen ? 'rotate' : ''}`}>
            <ChevronDown size={18} />
          </div>
        </button>

        <div className={`faq-card-content-wrapper ${isOpen ? 'expanded' : ''}`}>
          <div className="faq-card-content-inner">
            <p className="faq-card-answer">{faq.a}</p>
            <div className="faq-card-footer">
              <a
                href={getWhatsAppLink({
                  tripType: `FAQ: ${faq.q}`,
                })}
                target="_blank"
                rel="noopener noreferrer"
                className="faq-wa-action-btn"
              >
                <MessageSquare size={13} />
                <span>Ask on WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <section id="faq" className="section-padding bg-blue-gray faq-enterprise-section">
      <div className="container">
        {/* Lovable Header */}
        <div className="lovable-section-header reveal">
          <div className="lovable-badge">
            <HelpCircle size={14} />
            <span>EXECUTIVE KNOWLEDGE BASE</span>
          </div>
          <h2 className="lovable-title">
            Frequently Asked <span className="text-gradient">Questions</span>
          </h2>
          <p className="lovable-subtitle">
            Clear, transparent answers regarding intercity bookings, premium vehicles, expressway tolls, and luggage allowances.
          </p>
          <div className="lovable-divider">
            <div className="lovable-divider-line"></div>
            <div className="lovable-divider-dot"></div>
            <div className="lovable-divider-line right"></div>
          </div>
        </div>

        {/* 2-Column Balanced Compact Accordion Grid */}
        <div className="faq-grid-2col reveal">
          <div className="faq-col">
            {col1FAQs.map(renderFAQCard)}
          </div>
          <div className="faq-col">
            {col2FAQs.map(renderFAQCard)}
          </div>
        </div>

        {/* Show More / Show Less Toggle Button */}
        <div className="faq-toggle-container">
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className="faq-expand-btn"
          >
            {showAll ? (
              <span>Show Less Questions</span>
            ) : (
              <span>View All 14 Frequently Asked Questions →</span>
            )}
          </button>
        </div>

        {/* Quick Assistance Banner */}
        <div className="faq-contact-banner">
          <div className="faq-contact-info">
            <h4>Still have questions or need a custom quote?</h4>
            <p>
              Our round-the-clock Pune & Mumbai operations team is ready to assist you right now.
            </p>
          </div>
          <div className="faq-contact-actions">
            <a
              href={getWhatsAppLink({ tripType: 'General Enquiry' })}
              target="_blank"
              rel="noopener noreferrer"
              className="faq-contact-btn wa"
            >
              <MessageSquare size={16} />
              <span>WhatsApp Us</span>
            </a>
            <a
              href={getPhoneCallLink()}
              className="faq-contact-btn call"
            >
              <PhoneCall size={16} />
              <span>Call {businessConfig.phoneDisplay}</span>
            </a>
          </div>
        </div>
      </div>

      <style>{`
        .faq-enterprise-section {
          background: #EAF0F7;
          border-top: 1px solid #DCE3EB;
          border-bottom: 1px solid #DCE3EB;
        }

        .faq-header-wrapper {
          text-align: center;
          max-width: 680px;
          margin: 0 auto 2.25rem;
        }

        .faq-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.35rem 0.9rem;
          background: #EFF6FF;
          border: 1px solid #BFDBFE;
          border-radius: 9999px;
          color: #2563EB;
          font-family: var(--font-heading);
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          margin-bottom: 0.6rem;
        }

        .faq-main-title {
          font-family: var(--font-heading);
          font-size: 2.25rem;
          font-weight: 900;
          color: #17324D;
          margin-bottom: 0.4rem;
          letter-spacing: -0.02em;
        }

        .faq-subtitle {
          font-size: 0.95rem;
          color: #64748B;
          line-height: 1.5;
        }

        /* 2-COLUMN BALANCED COMPACT ACCORDION GRID */
        .faq-grid-2col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
          align-items: start;
        }

        .faq-col {
          display: flex;
          flex-direction: column;
          gap: 1.15rem;
        }

        .faq-card-modern {
          background: #FFFFFF;
          border-radius: 16px;
          border: 1.5px solid #DCE3EB;
          overflow: hidden;
          transition: border-color 0.22s ease, box-shadow 0.22s ease;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
        }

        .faq-card-modern:hover {
          border-color: #93C5FD;
          box-shadow: 0 6px 18px rgba(37, 99, 235, 0.08);
        }

        .faq-card-modern.open {
          border-color: #2563EB;
          box-shadow: 0 8px 24px rgba(37, 99, 235, 0.12);
        }

        .faq-card-header {
          width: 100%;
          padding: 1.15rem 1.25rem;
          text-align: left;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 0.85rem;
          background: transparent;
          border: none;
          outline: none;
          cursor: pointer;
          font-family: inherit;
        }

        .faq-card-title-group {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
          flex: 1;
        }

        .faq-card-category-tag {
          font-size: 0.68rem;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #2563EB;
        }

        .faq-card-question {
          font-family: var(--font-heading, 'Outfit', sans-serif);
          font-size: 0.98rem;
          font-weight: 700;
          color: #17324D;
          line-height: 1.35;
          margin: 0;
          transition: color 0.2s ease;
        }

        .faq-card-modern.open .faq-card-question {
          color: #1D4ED8;
        }

        .faq-card-chevron-box {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #EFF6FF;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #2563EB;
          flex-shrink: 0;
          transition: transform 0.25s ease, background 0.2s ease;
        }

        .faq-card-chevron-box.rotate {
          transform: rotate(180deg);
          background: #DBEAFE;
          color: #1D4ED8;
        }

        .faq-card-content-wrapper {
          display: grid;
          grid-template-rows: 0fr;
          transition: grid-template-rows 0.28s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease;
          opacity: 0;
        }

        .faq-card-content-wrapper.expanded {
          grid-template-rows: 1fr;
          opacity: 1;
        }

        .faq-card-content-inner {
          overflow: hidden;
          padding: 0 1.25rem 1.2rem;
          border-top: 1px solid #F1F5F9;
        }

        .faq-card-answer {
          font-size: 0.9rem;
          color: #475569;
          line-height: 1.65;
          margin: 0.85rem 0 0.75rem;
        }

        .faq-card-footer {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .faq-wa-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.78rem;
          font-weight: 700;
          color: #15803D;
          background: #DCFCE7;
          border: 1px solid #86EFAC;
          padding: 0.35rem 0.75rem;
          border-radius: 6px;
          transition: all 0.2s ease;
        }

        .faq-wa-action-btn:hover {
          background: #BBF7D0;
          color: #166534;
        }

        .faq-toggle-container {
          text-align: center;
          margin-top: 1.75rem;
        }

        .faq-expand-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.65rem 1.4rem;
          background: #FFFFFF;
          color: #1D4ED8;
          font-family: var(--font-heading);
          font-size: 0.86rem;
          font-weight: 700;
          border-radius: 9999px;
          border: 1.5px solid #CBD5E1;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 6px rgba(15, 23, 42, 0.04);
        }

        .faq-expand-btn:hover {
          background: #EFF6FF;
          border-color: #1D4ED8;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(29, 78, 216, 0.15);
        }

        /* Bottom Contact Banner */
        .faq-contact-banner {
          margin-top: 2.5rem;
          background: linear-gradient(135deg, #0B1629 0%, #162036 100%);
          border-radius: 16px;
          padding: 1.5rem 2rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1.5rem;
          color: #FFFFFF;
          box-shadow: 0 12px 30px rgba(11,22,41,0.18);
        }

        .faq-contact-info h4 {
          font-family: var(--font-heading);
          font-size: 1.15rem;
          font-weight: 800;
          color: #FFFFFF;
          margin-bottom: 0.25rem;
        }

        .faq-contact-info p {
          font-size: 0.85rem;
          color: #94A3B8;
          margin: 0;
        }

        .faq-contact-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-shrink: 0;
        }

        .faq-contact-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.65rem 1.1rem;
          border-radius: 10px;
          font-family: var(--font-heading);
          font-size: 0.84rem;
          font-weight: 700;
          transition: all 0.2s ease;
          text-decoration: none;
        }

        .faq-contact-btn.wa {
          background: #25D366;
          color: #FFFFFF;
        }

        .faq-contact-btn.wa:hover {
          background: #1EBE5D;
          transform: translateY(-2px);
        }

        .faq-contact-btn.call {
          background: rgba(255, 255, 255, 0.1);
          color: #FFFFFF;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .faq-contact-btn.call:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-2px);
        }

        @media (max-width: 900px) {
          .faq-grid-2col {
            grid-template-columns: 1fr;
          }
          .faq-contact-banner {
            flex-direction: column;
            text-align: center;
            padding: 1.5rem;
          }
          .faq-contact-actions {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </section>
  );
};
