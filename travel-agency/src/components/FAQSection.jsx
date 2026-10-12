import React, { useState } from 'react';
import { ChevronDown, MessageSquare } from 'lucide-react';
import { getWhatsAppLink } from '../utils/whatsapp';

export const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      q: 'What is the best way to travel from Pune to Mumbai?',
      a: 'The best option depends on your schedule, budget and preference. A private taxi provides doorstep pickup and a dedicated vehicle, while trains and buses can be useful for passengers who prefer scheduled public transportation.'
    },
    {
      q: 'How can I book a Pune to Mumbai taxi?',
      a: 'Enter your pickup, destination, travel date, passengers and preferred vehicle, then request a quote through the booking form, WhatsApp or phone.'
    },
    {
      q: 'How much does a Pune to Mumbai taxi cost?',
      a: 'The fare depends on the vehicle, pickup and drop locations, travel date, trip type, tolls, parking and applicable charges. Contact us for the current fare.'
    },
    {
      q: 'How long does Pune to Mumbai travel take?',
      a: 'Travel time varies depending on the exact pickup and destination, traffic, weather and road conditions. Typically, intercity travel via the Expressway takes around 3 to 4 hours under standard conditions.'
    },
    {
      q: 'Can I book a Pune to Mumbai one-way taxi?',
      a: 'Yes, one-way private travel can be requested subject to vehicle availability.'
    }
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? -1 : index);
  };

  return (
    <section id="faq" className="section-padding bg-light">
      <div className="container container-narrow">
        <div className="section-header" style={{ marginBottom: '2rem' }}>
          <h2>FAQ</h2>
        </div>

        <div className="faq-accordion-list">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={idx} className={`faq-item ${isOpen ? 'open' : ''}`}>
                <button
                  className="faq-question"
                  onClick={() => toggleFAQ(idx)}
                  aria-expanded={isOpen}
                >
                  <span className="faq-q-text">{faq.q}</span>
                  <ChevronDown
                    size={20}
                    color="#C89B3C"
                    className={`faq-icon ${isOpen ? 'rotate' : ''}`}
                  />
                </button>
                {isOpen && (
                  <div className="faq-answer">
                    <p>{faq.a}</p>
                    <div className="faq-action-row">
                      <a
                        href={getWhatsAppLink({ tripType: 'FAQ Inquiry' })}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="faq-wa-link"
                      >
                        <MessageSquare size={14} /> Ask on WhatsApp
                      </a>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        .faq-accordion-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .faq-item {
          background: #FFFFFF;
          border-radius: var(--radius-lg);
          border: 1px solid #E5E7EB;
          overflow: hidden;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .faq-item.open {
          border-color: var(--accent-gold-soft);
          box-shadow: var(--shadow-md);
        }

        .faq-question {
          width: 100%;
          padding: 1.25rem 1.5rem;
          text-align: left;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          background: transparent;
        }

        .faq-q-text {
          font-family: var(--font-heading);
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--bg-dark-navy);
        }

        .faq-icon {
          transition: transform 0.3s ease;
          flex-shrink: 0;
        }

        .faq-icon.rotate {
          transform: rotate(180deg);
        }

        .faq-answer {
          padding: 0 1.5rem 1.25rem 1.5rem;
          font-size: 0.95rem;
          color: #4B5563;
          line-height: 1.6;
          border-top: 1px solid #F3F4F6;
          padding-top: 1rem;
        }

        .faq-action-row {
          margin-top: 0.85rem;
        }

        .faq-wa-link {
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--brand-whatsapp);
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
        }

        .faq-wa-link:hover {
          color: var(--brand-whatsapp-hover);
        }
      `}</style>
    </section>
  );
};
