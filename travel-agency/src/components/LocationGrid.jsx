import React from 'react';
import { MapPin, Navigation, MessageSquare } from 'lucide-react';
import { businessConfig } from '../config/business.config';
import { getWhatsAppLink } from '../utils/whatsapp';

export const LocationGrid = () => {
  return (
    <section className="section-padding bg-light">
      <div className="container">
        <div className="section-header">
          <span className="eyebrow">LOCAL SERVICE COVERAGE</span>
          <h2>Pickup & Drop Across Pune and Mumbai</h2>
          <p>
            Request doorstep pickup or drop-off from your home, office, tech park, or airport terminal across supported sectors in Pune and Mumbai.
          </p>
        </div>

        <div className="locations-two-col">
          {/* Pune Column */}
          <div className="location-card">
            <div className="location-card-header">
              <div className="city-badge pune-badge">PUNE REGION</div>
              <h3>Pickup Locations Across Pune</h3>
              <p className="location-subtext">
                Request pickup from your preferred Pune location, subject to service availability.
              </p>
            </div>
            <div className="chips-wrapper">
              {businessConfig.serviceAreas.pune.map((area, idx) => (
                <a
                  key={idx}
                  href={getWhatsAppLink({ from: area, to: 'Mumbai' })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="location-chip"
                  title={`Book taxi from ${area} to Mumbai`}
                >
                  <MapPin size={12} color="#C89B3C" />
                  <span>{area}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Mumbai Column */}
          <div className="location-card">
            <div className="location-card-header">
              <div className="city-badge mumbai-badge">MUMBAI REGION</div>
              <h3>Pickup & Drop Locations Across Mumbai</h3>
              <p className="location-subtext">
                Request pickup or drop-off from your preferred Mumbai location, subject to service availability.
              </p>
            </div>
            <div className="chips-wrapper">
              {businessConfig.serviceAreas.mumbai.map((area, idx) => (
                <a
                  key={idx}
                  href={getWhatsAppLink({ from: area, to: 'Pune' })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="location-chip"
                  title={`Book taxi from ${area} to Pune`}
                >
                  <MapPin size={12} color="#C89B3C" />
                  <span>{area}</span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .locations-two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }

        .location-card {
          background: #FFFFFF;
          border-radius: var(--radius-xl);
          padding: 2rem;
          border: 1px solid #E5E7EB;
          box-shadow: var(--shadow-sm);
        }

        .city-badge {
          display: inline-block;
          font-family: var(--font-heading);
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          padding: 0.25rem 0.65rem;
          border-radius: 4px;
          margin-bottom: 0.75rem;
        }

        .pune-badge {
          background: rgba(216, 174, 85, 0.15);
          color: #8B6508;
        }

        .mumbai-badge {
          background: rgba(16, 24, 39, 0.1);
          color: var(--bg-dark-navy);
        }

        .location-card h3 {
          font-size: 1.5rem;
          color: var(--bg-dark-navy);
          margin-bottom: 0.5rem;
        }

        .location-subtext {
          font-size: 0.88rem;
          color: #6B7280;
          margin-bottom: 1.5rem;
        }

        .chips-wrapper {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .location-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          background: #F3F4F6;
          border: 1px solid #E5E7EB;
          padding: 0.45rem 0.85rem;
          border-radius: var(--radius-sm);
          font-size: 0.85rem;
          font-weight: 600;
          color: #374151;
          transition: all 0.2s ease;
        }

        .location-chip:hover {
          background: var(--bg-dark-navy);
          color: #FFFFFF;
          border-color: var(--bg-dark-navy);
        }

        @media (max-width: 768px) {
          .locations-two-col {
            display: flex;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            gap: 1rem;
            padding: 0.5rem 0.25rem 1rem;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }
          .locations-two-col::-webkit-scrollbar {
            display: none;
          }
          .location-card {
            flex: 0 0 85%;
            max-width: 310px;
            scroll-snap-align: start;
            padding: 1.25rem;
            border-radius: 18px;
          }
          .location-card h3 {
            font-size: 1.25rem;
          }
          .location-subtext {
            font-size: 0.8rem;
            margin-bottom: 1rem;
          }
          .location-chip {
            padding: 0.35rem 0.65rem;
            font-size: 0.78rem;
          }
        }
      `}</style>
    </section>
  );
};
