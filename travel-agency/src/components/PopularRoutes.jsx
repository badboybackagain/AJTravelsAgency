import { useNavigate } from 'react-router-dom';
import { Navigation, ArrowRight, MessageSquare, Car } from 'lucide-react';
import { getWhatsAppLink } from '../utils/whatsapp';

export const PopularRoutes = () => {
  const navigate = useNavigate();

  const handleBookRoute = (route) => {
    window.dispatchEvent(
      new CustomEvent('preFillBooking', {
        detail: {
          tripType: 'ONE_WAY',
          pickupId: route.from,
          dropId: route.to,
        },
      })
    );

    const params = new URLSearchParams({
      tripType: 'ONE_WAY',
      pickupId: route.from,
      dropId: route.to,
      pickupName: route.from,
      dropName: route.to,
    });
    navigate(`/fare?${params.toString()}`);
  };

  const routes = [
    {
      from: 'Pune',
      to: 'Mumbai',
      desc: 'Hinjawadi, Wakad, Baner to All Mumbai Areas',
      vehicle: 'Sedan / SUV / Luxury',
    },
    {
      from: 'Mumbai',
      to: 'Pune',
      desc: 'Andheri, Bandra, BKC to All Pune Locations',
      vehicle: 'Sedan / SUV / Luxury',
    },
    {
      from: 'Pune Airport (PNQ)',
      to: 'Mumbai',
      desc: 'Direct Terminal Pickup to Mumbai Destination',
      vehicle: 'Airport Express Sedan/SUV',
    },
    {
      from: 'Mumbai Airport (BOM)',
      to: 'Pune',
      desc: 'T1 & T2 Airport Pickups to Pune Home/Office',
      vehicle: 'Flight Tracked Taxi',
    },
    {
      from: 'Pune',
      to: 'BKC, Mumbai',
      desc: 'Hinjawadi / Kothrud to Financial Hub BKC',
      vehicle: 'Executive Corporate Luxury',
    },
    {
      from: 'BKC, Mumbai',
      to: 'Pune',
      desc: 'Corporate Evening Departure to Pune City',
      vehicle: 'Executive Corporate Luxury',
    },
    {
      from: 'Hinjawadi, Pune',
      to: 'Mumbai',
      desc: 'IT Park Doorstep Pickup to Mumbai Intercity',
      vehicle: 'Sedan / SUV',
    },
    {
      from: 'Mumbai',
      to: 'Hinjawadi, Pune',
      desc: 'Mumbai Doorstep Pickup to Hinjawadi Phase 1-3',
      vehicle: 'Sedan / SUV',
    }
  ];

  return (
    <section id="routes" className="section-padding bg-light">
      <div className="container">
        <div className="section-header">
          <span className="eyebrow">PUNE ↔ MUMBAI INTERCITY NETWORK</span>
          <h2>Popular Pune ↔ Mumbai Routes</h2>
          <p>
            Private travel options for everyday journeys, business trips and airport connections with doorstep pickup.
          </p>
        </div>

        <div className="routes-grid">
          {routes.map((route, idx) => (
            <div key={idx} className="route-card card-hover-effect">
              <div className="route-header">
                <span className="route-pill">{route.from}</span>
                <ArrowRight size={16} color="#C89B3C" />
                <span className="route-pill route-dest">{route.to}</span>
              </div>
              <p className="route-desc">{route.desc}</p>
              <div className="route-footer">
                <span className="route-vehicle-tag">
                  <Navigation size={12} /> {route.vehicle}
                </span>
                <button
                  type="button"
                  onClick={() => handleBookRoute(route)}
                  className="route-book-btn"
                  style={{ border: 'none', cursor: 'pointer' }}
                >
                  <Car size={14} /> Book Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .routes-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.25rem;
        }

        .route-card {
          background: #FFFFFF;
          border-radius: var(--radius-lg);
          padding: 1.25rem;
          border: 1px solid #E5E7EB;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .route-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }

        .route-pill {
          font-family: var(--font-heading);
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--bg-dark-navy);
          background: #F3F4F6;
          padding: 0.25rem 0.6rem;
          border-radius: 6px;
        }

        .route-dest {
          background: rgba(216, 174, 85, 0.15);
          color: #8B6508;
        }

        .route-desc {
          font-size: 0.82rem;
          color: #4B5563;
          margin-bottom: 1.25rem;
          line-height: 1.4;
        }

        .route-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 0.75rem;
          border-top: 1px dashed #E5E7EB;
        }

        .route-vehicle-tag {
          font-size: 0.72rem;
          color: #6B7280;
          display: flex;
          align-items: center;
          gap: 0.3rem;
          font-weight: 500;
        }

        .route-book-btn {
          font-family: var(--font-heading);
          font-size: 0.78rem;
          font-weight: 700;
          color: var(--brand-whatsapp);
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          transition: color 0.2s ease;
        }

        .route-book-btn:hover {
          color: var(--brand-whatsapp-hover);
        }

        @media (max-width: 1200px) {
          .routes-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .routes-grid {
            display: flex;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            gap: 1rem;
            padding: 0.5rem 0.25rem 1rem;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }
          .routes-grid::-webkit-scrollbar {
            display: none;
          }
          .route-card {
            flex: 0 0 78%;
            max-width: 270px;
            scroll-snap-align: start;
            padding: 1rem;
            border-radius: 14px;
          }
        }
      `}</style>
    </section>
  );
};
