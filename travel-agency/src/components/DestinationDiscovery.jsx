import React from 'react';
import { Compass, Landmark, Building2, Plane, MapPin } from 'lucide-react';
import { getWhatsAppLink } from '../utils/whatsapp';

export const DestinationDiscovery = () => {
  const destinations = {
    pune: [
      { name: 'Hinjawadi IT Hub', desc: 'Phase 1, 2 & 3 Rajiv Gandhi Infotech Park', tag: 'Business' },
      { name: 'Shaniwar Wada Sector', desc: 'Central Pune Heritage & Market Area', tag: 'Heritage' },
      { name: 'Aga Khan Palace Area', desc: 'Kalyani Nagar & Viman Nagar Corridor', tag: 'Landmark' },
      { name: 'Sinhagad Fort Base', desc: 'Popular Outstation Destination Gateway', tag: 'Excursion' }
    ],
    mumbai: [
      { name: 'BKC (Bandra Kurla Complex)', desc: 'Mumbai Financial & Corporate Center', tag: 'Corporate' },
      { name: 'Bandra-Worli Sea Link', desc: 'South Mumbai & Coastal Expressway Link', tag: 'Iconic Corridor' },
      { name: 'Marine Drive & Nariman Pt', desc: 'South Mumbai Business & Business District', tag: 'South Mumbai' },
      { name: 'Gateway of India Zone', desc: 'Colaba & Heritage Hotel Destination', tag: 'Tourism' },
      { name: 'Mumbai Airport (BOM T1/T2)', desc: 'International & Domestic Flight Terminals', tag: 'Transit Hub' }
    ]
  };

  return (
    <section id="destinations" className="section-padding bg-white">
      <div className="container">
        <div className="section-header">
          <span className="eyebrow">DESTINATION & LANDMARK REFERENCES</span>
          <h2>Travel Between Pune & Mumbai's Major Destinations</h2>
          <p>
            Popular business, airport, coastal, and city destinations across Pune and Mumbai. (Vehicle pick-ups are provided at your preferred address near supported locations).
          </p>
        </div>

        <div className="destinations-grid">
          {/* Pune Landmarks */}
          <div className="dest-column">
            <div className="dest-col-header">
              <Compass size={20} color="#C89B3C" />
              <h3>Key Locations Across Pune</h3>
            </div>
            <div className="dest-cards-list">
              {destinations.pune.map((item, idx) => (
                <a
                  key={idx}
                  href={getWhatsAppLink({ from: `Near ${item.name}`, to: 'Mumbai' })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="dest-item-card"
                >
                  <div className="dest-item-top">
                    <h4 className="dest-name">{item.name}</h4>
                    <span className="dest-tag">{item.tag}</span>
                  </div>
                  <p className="dest-desc">{item.desc}</p>
                </a>
              ))}
            </div>
          </div>

          {/* Mumbai Landmarks */}
          <div className="dest-column">
            <div className="dest-col-header">
              <Compass size={20} color="#C89B3C" />
              <h3>Key Locations Across Mumbai</h3>
            </div>
            <div className="dest-cards-list">
              {destinations.mumbai.map((item, idx) => (
                <a
                  key={idx}
                  href={getWhatsAppLink({ from: `Near ${item.name}`, to: 'Pune' })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="dest-item-card"
                >
                  <div className="dest-item-top">
                    <h4 className="dest-name">{item.name}</h4>
                    <span className="dest-tag gold-tag">{item.tag}</span>
                  </div>
                  <p className="dest-desc">{item.desc}</p>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .destinations-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2.5rem;
        }

        .dest-column {
          background: #FAFAFA;
          border-radius: var(--radius-xl);
          padding: 2rem;
          border: 1px solid #E5E7EB;
        }

        .dest-col-header {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #E5E7EB;
        }

        .dest-col-header h3 {
          font-size: 1.35rem;
          color: var(--bg-dark-navy);
        }

        .dest-cards-list {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }

        .dest-item-card {
          background: #FFFFFF;
          border-radius: var(--radius-md);
          padding: 1rem 1.25rem;
          border: 1px solid #F3F4F6;
          transition: all 0.2s ease;
          display: block;
        }

        .dest-item-card:hover {
          border-color: var(--accent-gold-soft);
          box-shadow: var(--shadow-md);
          transform: translateX(4px);
        }

        .dest-item-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.25rem;
        }

        .dest-name {
          font-size: 1rem;
          font-weight: 700;
          color: var(--bg-dark-navy);
        }

        .dest-tag {
          font-size: 0.72rem;
          font-weight: 700;
          background: #F3F4F6;
          color: #4B5563;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
        }

        .gold-tag {
          background: rgba(216, 174, 85, 0.15);
          color: #8B6508;
        }

        .dest-desc {
          font-size: 0.82rem;
          color: #6B7280;
        }

        @media (max-width: 768px) {
          .destinations-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  );
};
