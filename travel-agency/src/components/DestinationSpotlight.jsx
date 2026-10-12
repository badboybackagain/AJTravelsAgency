import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Compass, Plane, MapPin, Navigation, MessageSquare, Clock, ArrowRight, Car } from 'lucide-react';
import { getWhatsAppLink } from '../utils/whatsapp';

export const DestinationSpotlight = () => {
  const navigate = useNavigate();

  const destinations = [
    {
      id: 'hinjawadi',
      name: 'Hinjawadi',
      city: 'Pune',
      title: 'HINJAWADI IT HUB',
      tagline: 'India\'s Premier Rajiv Gandhi Infotech Park Phase 1, 2 & 3.',
      image: '/assets/sedan.webp',
      icon: Building2,
      desc: 'Connect seamlessly from Hinjawadi Phase 1, Phase 2, Phase 3, and Maan tech hubs directly to Mumbai, BKC, and Mumbai International Airport.',
      popularRoute: 'Hinjawadi → Mumbai (BKC / Andheri)',
      estTime: '3 Hours 15 Mins',
      pickupKey: 'hinjawadi',
      dropKey: 'mumbai',
    },
    {
      id: 'bkc',
      name: 'BKC Mumbai',
      city: 'Mumbai',
      title: 'BKC FINANCIAL HUB',
      tagline: 'Bandra Kurla Complex - Mumbai\'s Executive Business District.',
      image: '/assets/suv.webp',
      icon: Building2,
      desc: 'Executive chauffeured cars for corporate delegates travelling between Pune and major financial headquarters in Bandra Kurla Complex.',
      popularRoute: 'BKC → Pune (Hinjawadi / Wakad / Kothrud)',
      estTime: '3 Hours 30 Mins',
      pickupKey: 'bkc',
      dropKey: 'pune',
    },
    {
      id: 'bom_airport',
      name: 'Mumbai Airport',
      city: 'Mumbai',
      title: 'MUMBAI AIRPORT (BOM)',
      tagline: 'Chhatrapati Shivaji Maharaj International Airport T1 & T2.',
      image: '/assets/pune-to-mumbai-premium-travel-banner.webp',
      icon: Plane,
      desc: 'Punctual flight-tracked private airport transfers connecting all Pune localities with Mumbai International & Domestic departure terminals.',
      popularRoute: 'Pune City → Mumbai Airport (BOM T2)',
      estTime: '3.5 Hours Express',
      pickupKey: 'pune',
      dropKey: 'mumbai airport',
    },
    {
      id: 'pnq_airport',
      name: 'Pune Airport',
      city: 'Pune',
      title: 'PUNE AIRPORT (PNQ)',
      tagline: 'Lohegaon Pune Airport Express Pickup & Drop Corridor.',
      image: '/assets/sedan.webp',
      icon: Plane,
      desc: 'Direct airport taxi pickup from Pune Airport arrival gates straight to Mumbai residential, corporate, or hotel destinations.',
      popularRoute: 'Pune Airport (PNQ) → Mumbai City',
      estTime: '3.5 Hours Express',
      pickupKey: 'pune airport',
      dropKey: 'mumbai',
    },
    {
      id: 'south_mumbai',
      name: 'South Mumbai',
      city: 'Mumbai',
      title: 'MARINE DRIVE & SOUTH MUMBAI',
      tagline: 'Coastal Road, Bandra-Worli Sea Link, and Colaba Heritage Corridor.',
      image: '/assets/suv.webp',
      icon: Navigation,
      desc: 'Travel in luxury via the Bandra-Worli Sea Link to Marine Drive, Nariman Point, and Gateway of India with doorstep pickup.',
      popularRoute: 'Pune → Marine Drive / Colaba',
      estTime: '3 Hours 45 Mins',
      pickupKey: 'pune',
      dropKey: 'mumbai',
    }
  ];

  const [selectedDest, setSelectedDest] = useState(destinations[0]);

  const handleBookDestination = (dest) => {
    // Notify homepage booking form if present
    window.dispatchEvent(
      new CustomEvent('preFillBooking', {
        detail: {
          tripType: 'ONE_WAY',
          pickupId: dest.pickupKey,
          dropId: dest.dropKey,
        },
      })
    );

    // Redirect user to Fare Calculator with pre-configured destination parameters
    const params = new URLSearchParams({
      tripType: 'ONE_WAY',
      pickupId: dest.pickupKey,
      dropId: dest.dropKey,
      destination: dest.name,
    });
    navigate(`/fare?${params.toString()}`);
  };

  return (
    <section className="section-padding bg-cream" style={{ paddingTop: '3.5rem', paddingBottom: '4rem' }}>
      <div className="container">
        {/* Section Header */}
        <div className="campaign-title-block" style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#0F172A', margin: '0 0 0.4rem 0' }}>
            Top Pune ↔ Mumbai Destinations
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#64748B', maxWidth: '560px', margin: '0 auto' }}>
            Direct doorstep cab service across prime tech corridors, international airports & executive business hubs.
          </p>
        </div>

        {/* Icon Selector Cards Bar */}
        <div className="dest-icon-strip">
          {destinations.map((d) => {
            const Icon = d.icon;
            const isSelected = selectedDest.id === d.id;
            return (
              <button
                key={d.id}
                type="button"
                className={`dest-icon-card ${isSelected ? 'active' : ''}`}
                onClick={() => setSelectedDest(d)}
              >
                <div className="dest-icon-box">
                  <Icon size={24} color={isSelected ? '#0284C7' : '#64748B'} />
                </div>
                <span className="dest-icon-name">{d.name}</span>
                <span className="dest-icon-city">{d.city}</span>
              </button>
            );
          })}
        </div>

        {/* Perfectly Balanced 2-Column Spotlight Box */}
        <div className="spotlight-card-wrapper">
          <div className="spotlight-2col-grid">
            {/* Left Content Column */}
            <div className="spotlight-left-col">
              <span className="spotlight-eyebrow">DESTINATION FOCUS</span>
              <h3 className="spotlight-title">{selectedDest.title}</h3>
              <p className="spotlight-tagline">{selectedDest.tagline}</p>
              <p className="spotlight-desc">{selectedDest.desc}</p>

              {/* Info Badges Row */}
              <div className="spotlight-info-grid">
                <div className="info-badge-box">
                  <span className="info-badge-label">POPULAR ROUTE</span>
                  <p className="info-badge-val">{selectedDest.popularRoute}</p>
                </div>
                <div className="info-badge-box">
                  <span className="info-badge-label">EST. EXPRESS TIME</span>
                  <p className="info-badge-val">{selectedDest.estTime}</p>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="spotlight-action-row" style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => handleBookDestination(selectedDest)}
                  className="btn-emerald-glowing"
                >
                  <Car size={18} />
                  <span>BOOK TAXI TO {selectedDest.name.toUpperCase()}</span>
                  <ArrowRight size={16} />
                </button>

                <a
                  href={getWhatsAppLink({
                    from: selectedDest.name,
                    to: selectedDest.city === 'Pune' ? 'Mumbai' : 'Pune',
                    tripType: 'Destination Focus'
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-whatsapp-outline"
                >
                  <MessageSquare size={16} color="#25D366" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Right Media Image Card Column */}
            <div className="spotlight-right-col">
              <div className="spotlight-media-card">
                <img
                  src={selectedDest.image}
                  alt={selectedDest.title}
                  className="spotlight-media-img"
                />
                <div className="spotlight-media-overlay">
                  <span className="media-chip">
                    <Compass size={14} color="#D8AE55" />
                    <span>{selectedDest.city} Sector Express</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .btn-emerald-glowing {
          background: linear-gradient(135deg, #10B981 0%, #059669 100%);
          color: #FFFFFF;
          font-family: var(--font-heading);
          font-size: 0.95rem;
          font-weight: 800;
          letter-spacing: 0.03em;
          padding: 0.85rem 1.6rem;
          border-radius: 14px;
          border: none;
          display: inline-flex;
          align-items: center;
          gap: 0.65rem;
          box-shadow: 0 6px 22px rgba(16, 185, 129, 0.45);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
        }

        .btn-emerald-glowing:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 28px rgba(16, 185, 129, 0.6);
          background: linear-gradient(135deg, #34D399 0%, #10B981 100%);
        }

        .btn-emerald-glowing:active {
          transform: translateY(0);
        }

        .btn-whatsapp-outline {
          background: rgba(255, 255, 255, 0.06);
          border: 1.5px solid rgba(255, 255, 255, 0.2);
          color: #FFFFFF;
          font-family: var(--font-heading);
          font-size: 0.9rem;
          font-weight: 700;
          padding: 0.85rem 1.35rem;
          border-radius: 14px;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .btn-whatsapp-outline:hover {
          background: rgba(37, 211, 102, 0.15);
          border-color: #25D366;
          color: #FFFFFF;
          transform: translateY(-2px);
        }

        .dest-icon-strip {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          margin-bottom: 2.25rem;
          flex-wrap: wrap;
        }

        .dest-icon-card {
          background: #FFFFFF;
          border-radius: 16px;
          padding: 1.1rem 1.35rem;
          min-width: 145px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          border: 1.5px solid #E2E8F0;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.03);
          transition: all 0.25s ease;
          cursor: pointer;
        }

        .dest-icon-card:hover {
          border-color: #BAE6FD;
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(2, 132, 199, 0.08);
        }

        .dest-icon-card.active {
          background: #F0F9FF;
          border-color: #0284C7;
          box-shadow: 0 8px 24px rgba(2, 132, 199, 0.15);
          transform: translateY(-3px);
        }

        .dest-icon-box {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: #F8FAFC;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 0.4rem;
        }

        .dest-icon-card.active .dest-icon-box {
          background: #E0F2FE;
        }

        .dest-icon-name {
          font-family: var(--font-heading);
          font-size: 0.92rem;
          font-weight: 800;
          color: #0F172A;
          line-height: 1.2;
        }

        .dest-icon-city {
          font-size: 0.72rem;
          color: #64748B;
          margin-top: 0.15rem;
          font-weight: 600;
        }

        .spotlight-card-wrapper {
          background: var(--bg-dark-navy);
          border-radius: 28px;
          padding: 3rem;
          border: 1px solid var(--border-gold);
          box-shadow: 0 20px 40px rgba(7, 17, 31, 0.3);
          color: #FFFFFF;
        }

        .spotlight-2col-grid {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 3rem;
          align-items: center;
        }

        .spotlight-left-col {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          text-align: left;
        }

        .spotlight-eyebrow {
          font-family: var(--font-heading);
          font-size: 0.78rem;
          font-weight: 800;
          letter-spacing: 0.1em;
          color: var(--accent-gold-warm);
          margin-bottom: 0.6rem;
          background: rgba(216, 174, 85, 0.12);
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          border: 1px solid var(--border-gold);
        }

        .spotlight-title {
          font-size: 2.2rem;
          font-weight: 800;
          line-height: 1.15;
          margin-bottom: 0.6rem;
          color: #FFFFFF;
        }

        .spotlight-tagline {
          font-size: 1.05rem;
          color: #D1D5DB;
          font-weight: 600;
          margin-bottom: 1rem;
        }

        .spotlight-desc {
          font-size: 0.92rem;
          color: #9CA3AF;
          line-height: 1.6;
          margin-bottom: 1.75rem;
        }

        .spotlight-info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          width: 100%;
          margin-bottom: 2rem;
          padding-top: 1.25rem;
          border-top: 1px dashed rgba(255, 255, 255, 0.15);
        }

        .info-badge-box {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }

        .info-badge-label {
          font-size: 0.7rem;
          font-weight: 800;
          color: var(--accent-gold-soft);
          letter-spacing: 0.05em;
        }

        .info-badge-val {
          font-family: var(--font-heading);
          font-size: 0.95rem;
          font-weight: 700;
          color: #FFFFFF;
        }

        .spotlight-action-row {
          width: 100%;
        }

        .spotlight-right-col {
          width: 100%;
        }

        .spotlight-media-card {
          position: relative;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 15px 30px rgba(0,0,0,0.4);
          border: 1px solid rgba(255, 255, 255, 0.1);
          height: 340px;
        }

        .spotlight-media-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s ease;
        }

        .spotlight-media-card:hover .spotlight-media-img {
          transform: scale(1.04);
        }

        .spotlight-media-overlay {
          position: absolute;
          bottom: 1.25rem;
          left: 1.25rem;
          z-index: 2;
        }

        .media-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: rgba(7, 17, 31, 0.85);
          backdrop-filter: blur(8px);
          border: 1px solid var(--border-gold);
          padding: 0.45rem 0.9rem;
          border-radius: 9999px;
          font-family: var(--font-heading);
          font-size: 0.82rem;
          font-weight: 700;
          color: #FFFFFF;
        }

        @media (max-width: 992px) {
          .spotlight-card-wrapper {
            padding: 1.75rem;
          }
          .spotlight-2col-grid {
            grid-template-columns: 1fr;
            gap: 2rem;
          }
          .spotlight-media-card {
            height: 260px;
          }
        }

        @media (max-width: 640px) {
          .dest-icon-strip {
            flex-wrap: nowrap;
            justify-content: flex-start;
            overflow-x: auto;
            padding-bottom: 0.5rem;
            margin-bottom: 1.25rem;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }
          .dest-icon-strip::-webkit-scrollbar {
            display: none;
          }
          .dest-icon-card {
            min-width: 110px;
            padding: 0.65rem 0.75rem;
            flex-shrink: 0;
            border-radius: 12px;
          }
          .spotlight-card-wrapper {
            padding: 1rem;
            border-radius: 18px;
          }
          .spotlight-2col-grid {
            gap: 1.25rem;
          }
          .spotlight-title {
            font-size: 1.35rem;
            margin-bottom: 0.35rem;
          }
          .spotlight-tagline {
            font-size: 0.85rem;
            margin-bottom: 0.5rem;
          }
          .spotlight-desc {
            font-size: 0.8rem;
            margin-bottom: 1rem;
            line-height: 1.45;
          }
          .spotlight-info-grid {
            grid-template-columns: 1fr 1fr;
            gap: 0.6rem;
            margin-bottom: 1.15rem;
            padding-top: 0.85rem;
          }
          .info-badge-val {
            font-size: 0.8rem;
          }
          .spotlight-media-card {
            height: 140px;
            border-radius: 14px;
          }
          .btn-emerald-glowing,
          .btn-whatsapp-outline {
            width: 100%;
            justify-content: center;
            padding: 0.65rem 1rem;
            font-size: 0.82rem;
          }
        }
      `}</style>
    </section>
  );
};
