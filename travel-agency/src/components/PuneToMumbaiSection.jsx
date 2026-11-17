import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, MessageSquare, ShieldCheck, MapPin, Users, ArrowRight } from 'lucide-react';
import { getWhatsAppLink } from '../utils/whatsapp';
import { homepageContent } from '../data/homepageContent';

export const PuneToMumbaiSection = () => {
  const data = homepageContent.corridors.intercity;
  const benefits = data.features || [];

  return (
    <section id="pune-to-mumbai" className="section-padding bg-ivory" style={{ paddingTop: '4.5rem', paddingBottom: '4.5rem' }}>
      <div className="container">
        <div className="card-white" style={{ padding: '3.25rem', borderRadius: '28px', border: '1.5px solid #DCE3EB', boxShadow: '0 16px 40px rgba(15, 23, 42, 0.06)' }}>
          <div className="split-grid">
            {/* Left Column: Visual Media */}
            <div className="split-media">
              <img
                src={data.image}
                alt={data.imageAlt}
                className="split-img rounded-img"
                loading="lazy"
              />
              <div className="media-overlay-badge">
                <ShieldCheck size={18} color="#60A5FA" />
                <span>Pune ↔ Mumbai Express Corridor</span>
              </div>
            </div>

            {/* Right Column: Copy & Benefits */}
            <div className="split-content">
              <div className="lovable-badge" style={{ marginBottom: '0.75rem' }}>
                <ShieldCheck size={13} />
                <span>{data.badge}</span>
              </div>
              <h2 className="lovable-title" style={{ textAlign: 'left', fontSize: '2.2rem', marginBottom: '0.85rem' }}>
                {data.title}
              </h2>
              <p className="lead-paragraph" style={{ color: '#475569' }}>
                {data.subtitle}
              </p>

              <h3 className="subheading" style={{ color: '#17324D', fontSize: '1.2rem', fontWeight: 800, marginBottom: '1rem' }}>
                Why Book AJ Travels for Expressway Transit?
              </h3>

              <div className="benefits-grid">
                {benefits.map((b, idx) => (
                  <div key={idx} className="benefit-item">
                    <CheckCircle2 size={18} color="#2563EB" className="benefit-icon" />
                    <div>
                      <h4 className="benefit-title" style={{ color: '#17324D' }}>{b.title}</h4>
                      <p className="benefit-desc" style={{ color: '#64748B' }}>{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="action-row" style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <Link
                  to={data.ctaUrl}
                  className="btn btn-primary btn-lg"
                >
                  <span>{data.ctaText}</span>
                </Link>
                {data.articleUrl && (
                  <Link
                    to={data.articleUrl}
                    className="btn btn-outline-primary btn-lg"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      padding: '0.85rem 1.4rem',
                      borderRadius: '12px',
                      fontWeight: 700,
                      textDecoration: 'none',
                      border: '1.5px solid #2563EB',
                      color: '#2563EB',
                      background: '#FFFFFF'
                    }}
                  >
                    <span>EXPRESSWAY GUIDE</span>
                    <ArrowRight size={16} />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        #pune-to-mumbai .split-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3.5rem;
          align-items: center;
        }

        #pune-to-mumbai .split-media {
          position: relative;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 12px 36px rgba(15, 23, 42, 0.12);
          border: 1.5px solid #DCE3EB;
        }

        #pune-to-mumbai .split-img {
          width: 100%;
          height: 460px;
          object-fit: cover;
          transition: transform 0.4s ease;
        }

        #pune-to-mumbai .split-media:hover .split-img {
          transform: scale(1.02);
        }

        #pune-to-mumbai .media-overlay-badge {
          position: absolute;
          bottom: 1.5rem;
          left: 1.5rem;
          background: rgba(23, 50, 77, 0.92);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 0.6rem 1.25rem;
          border-radius: 9999px;
          color: #FFFFFF;
          font-family: var(--font-heading);
          font-size: 0.85rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        #pune-to-mumbai .lead-paragraph {
          font-size: 0.98rem;
          line-height: 1.65;
          margin-bottom: 1.5rem;
        }

        #pune-to-mumbai .benefits-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.15rem;
          margin-bottom: 2rem;
        }

        #pune-to-mumbai .benefit-item {
          display: flex;
          align-items: center;
          gap: 0.65rem;
        }

        #pune-to-mumbai .benefit-icon {
          flex-shrink: 0;
          color: #2563EB;
        }

        #pune-to-mumbai .benefit-title {
          font-size: 0.92rem;
          font-weight: 700;
          color: #17324D;
          margin-bottom: 0;
          line-height: 1.35;
        }

        /* Hide verbose descriptive subtitle lines — keep clean single main points */
        #pune-to-mumbai .benefit-desc {
          display: none !important;
        }

        #pune-to-mumbai .action-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        @media (max-width: 992px) {
          #pune-to-mumbai .card-white {
            padding: 1.75rem !important;
          }
          #pune-to-mumbai .split-grid {
            grid-template-columns: 1fr;
            gap: 2rem;
          }
          #pune-to-mumbai .split-img {
            height: 240px;
          }
          #pune-to-mumbai .benefits-grid {
            grid-template-columns: 1fr;
            gap: 0.95rem;
          }
        }

        @media (max-width: 768px) {
          #pune-to-mumbai {
            padding-top: 3rem !important;
            padding-bottom: 3rem !important;
          }
          #pune-to-mumbai .card-white {
            padding: 1.5rem 1.25rem !important;
            border-radius: 20px !important;
          }
          #pune-to-mumbai .split-grid {
            gap: 1.5rem;
          }
          #pune-to-mumbai .split-img {
            height: 200px;
            border-radius: 16px;
          }
          #pune-to-mumbai .media-overlay-badge {
            bottom: 0.85rem;
            left: 0.85rem;
            padding: 0.45rem 0.85rem;
            font-size: 0.75rem;
          }
          #pune-to-mumbai .lovable-title {
            font-size: 1.6rem !important;
            line-height: 1.25;
            margin-bottom: 0.65rem !important;
          }
          #pune-to-mumbai .lead-paragraph {
            font-size: 0.90rem;
            line-height: 1.55;
            margin-bottom: 1.25rem;
          }
          #pune-to-mumbai .subheading {
            font-size: 1.05rem !important;
            margin-bottom: 0.85rem !important;
          }

          /* Show only the first two descriptive points on mobile:
             1. Direct Doorstep Pickup
             2. 100% Toll-Inclusive Pricing
             Hide the other four descriptive points using responsive CSS only */
          #pune-to-mumbai .benefit-item:nth-child(n+3) {
            display: none !important;
          }

          #pune-to-mumbai .benefits-grid {
            grid-template-columns: 1fr !important;
            gap: 1rem;
            margin-bottom: 1.5rem;
          }
          #pune-to-mumbai .benefit-item {
            display: flex;
            align-items: center;
            gap: 0.65rem;
          }
          #pune-to-mumbai .benefit-title {
            font-size: 0.92rem;
            margin-bottom: 0;
            line-height: 1.35;
          }

          #pune-to-mumbai .action-row {
            display: flex;
            flex-direction: column;
            width: 100%;
            gap: 0.75rem;
          }
          #pune-to-mumbai .action-row a,
          #pune-to-mumbai .action-row .btn {
            width: 100%;
            justify-content: center;
            text-align: center;
            box-sizing: border-box;
          }
        }
      `}</style>
    </section>
  );
};
