import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, MessageSquare, MapPin, ShieldCheck, ArrowRight } from 'lucide-react';
import { getWhatsAppLink } from '../utils/whatsapp';
import { homepageContent } from '../data/homepageContent';

export const MumbaiToPuneSection = () => {
  const data = homepageContent.corridors.outstationHolidays;
  const benefits = data.features || [];

  return (
    <section id="mumbai-to-pune" className="section-padding bg-blue-gray" style={{ paddingTop: '4.5rem', paddingBottom: '4.5rem' }}>
      <div className="container">
        <div className="card-white" style={{ padding: '3.25rem', borderRadius: '28px', border: '1.5px solid #DCE3EB', boxShadow: '0 16px 40px rgba(15, 23, 42, 0.06)' }}>
          <div className="split-grid split-reverse">
            {/* Left Column: Copy & Benefits */}
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
                Why Rent Outstation Cabs with AJ Travels?
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
                    <span>OUTSTATION GUIDE</span>
                    <ArrowRight size={16} />
                  </Link>
                )}
              </div>
            </div>

            {/* Right Column: Visual Media */}
            <div className="split-media">
              <img
                src={data.image}
                alt={data.imageAlt}
                className="split-img rounded-img"
                loading="lazy"
              />
              <div className="media-overlay-badge">
                <ShieldCheck size={18} color="#60A5FA" />
                <span>Maharashtra Outstation Tours</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .split-reverse {
          grid-template-columns: 1.15fr 0.85fr;
        }

        .split-media {
          position: relative;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 12px 36px rgba(15, 23, 42, 0.12);
          border: 1.5px solid #DCE3EB;
        }

        .split-img {
          width: 100%;
          height: 460px;
          object-fit: cover;
          transition: transform 0.4s ease;
        }

        .split-media:hover .split-img {
          transform: scale(1.02);
        }

        .media-overlay-badge {
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

        .lead-paragraph {
          font-size: 0.98rem;
          line-height: 1.65;
          margin-bottom: 1.5rem;
        }

        .benefits-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.15rem;
          margin-bottom: 2rem;
        }

        .benefit-item {
          display: flex;
          align-items: flex-start;
          gap: 0.65rem;
        }

        .benefit-icon {
          flex-shrink: 0;
          margin-top: 0.15rem;
        }

        .benefit-title {
          font-size: 0.88rem;
          font-weight: 700;
          margin-bottom: 0.15rem;
        }

        .benefit-desc {
          font-size: 0.78rem;
          line-height: 1.4;
        }

        .action-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        @media (max-width: 992px) {
          .card-white {
            padding: 1.5rem !important;
          }
          .split-reverse {
            grid-template-columns: 1fr;
            gap: 2rem;
          }
          .split-reverse .split-media {
            order: -1;
          }
          .split-reverse .split-img {
            height: 220px;
          }
          .split-reverse .benefits-grid {
            grid-template-columns: 1fr;
            gap: 0.85rem;
          }
        }
      `}</style>
    </section>
  );
};
