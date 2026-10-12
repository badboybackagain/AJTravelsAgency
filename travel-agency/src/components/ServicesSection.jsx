import React from 'react';
import { Compass, Car, Plane, Building2, HeartHandshake, Users, CalendarCheck, Zap, MessageSquare } from 'lucide-react';
import { getWhatsAppLink } from '../utils/whatsapp';

export const ServicesSection = () => {
  const services = [
    {
      icon: Car,
      title: 'ONE-WAY TAXI',
      desc: 'Pay only for the single journey between Pune and Mumbai. Ideal for travelers who do not need a same-day return trip.',
      tag: 'Point to Point'
    },
    {
      icon: Compass,
      title: 'ROUND-TRIP TAXI',
      desc: 'Seamless return private transportation arrangements for business visits, weekend family trips, and short stays.',
      tag: 'Flexible Return'
    },
    {
      icon: Plane,
      title: 'AIRPORT TRANSFERS',
      desc: 'Punctual airport taxi service connecting Pune locations directly with Chhatrapati Shivaji Maharaj International Airport (BOM).',
      tag: 'Flight Tracked'
    },
    {
      icon: Building2,
      title: 'CORPORATE TRAVEL',
      desc: 'Executive car rental solution for meetings between Pune IT parks (Hinjawadi, Magarpatta) and Mumbai business districts (BKC, Nariman Point).',
      tag: 'B2B Executive'
    },
    {
      icon: HeartHandshake,
      title: 'FAMILY TRAVEL',
      desc: 'Clean, sanitized SUVs and sedans equipped with ample boot space and safety child-friendly seating for comfortable family journeys.',
      tag: 'Family Safe'
    },
    {
      icon: Users,
      title: 'GROUP TRAVEL',
      desc: 'Tempo Traveller mini buses and luxury coaches keeping your group together for outstation trips, reunions, and events.',
      tag: 'Mini Bus & Coach'
    },
    {
      icon: CalendarCheck,
      title: 'WEDDINGS & EVENTS',
      desc: 'Customized fleet management and chauffeured vehicles for guest transportation between Pune and Mumbai wedding venues.',
      tag: 'Event Fleet'
    },
    {
      icon: Zap,
      title: 'LAST-MINUTE BOOKING',
      desc: 'Urgent intercity travel requirements handled with rapid vehicle dispatch targets across Pune and Mumbai supported sectors.',
      tag: 'Express Dispatch'
    }
  ];

  return (
    <section id="services" className="section-padding bg-white">
      <div className="container">
        <div className="section-header">
          <span className="eyebrow">OUR SPECIALIZED SERVICES</span>
          <h2>Pune Mumbai Travel Services</h2>
          <p>
            Customized private travel solutions tailored to your itinerary, group size, and comfort requirements.
          </p>
        </div>

        <div className="services-grid">
          {services.map((s, idx) => {
            const Icon = s.icon;
            return (
              <div key={idx} className="service-card card-hover-effect">
                <div className="service-card-top">
                  <div className="service-icon-box">
                    <Icon size={24} color="#D8AE55" />
                  </div>
                  <span className="service-tag">{s.tag}</span>
                </div>
                <h3 className="service-title">{s.title}</h3>
                <p className="service-desc">{s.desc}</p>
                <a
                  href={getWhatsAppLink({ tripType: s.title })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="service-link"
                >
                  <MessageSquare size={14} /> Request Fare & Details
                </a>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        .services-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
        }

        .service-card {
          background: #FAFAFA;
          border-radius: var(--radius-lg);
          padding: 1.5rem;
          border: 1px solid #E5E7EB;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .service-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.25rem;
        }

        .service-icon-box {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: rgba(216, 174, 85, 0.12);
          border: 1px solid var(--border-gold);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .service-tag {
          font-family: var(--font-heading);
          font-size: 0.7rem;
          font-weight: 700;
          color: #4B5563;
          background: #E5E7EB;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
        }

        .service-title {
          font-size: 1.15rem;
          color: var(--bg-dark-navy);
          margin-bottom: 0.6rem;
        }

        .service-desc {
          font-size: 0.85rem;
          color: #6B7280;
          line-height: 1.5;
          margin-bottom: 1.25rem;
          flex-grow: 1;
        }

        .service-link {
          font-family: var(--font-heading);
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--brand-whatsapp);
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          transition: color 0.2s ease;
        }

        .service-link:hover {
          color: var(--brand-whatsapp-hover);
        }

        @media (max-width: 1200px) {
          .services-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .services-grid {
            display: flex;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            gap: 1rem;
            padding: 0.5rem 0.25rem 1rem;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }
          .services-grid::-webkit-scrollbar {
            display: none;
          }
          .service-card {
            flex: 0 0 78%;
            max-width: 270px;
            scroll-snap-align: start;
            padding: 1.1rem;
            border-radius: 14px;
          }
        }
      `}</style>
    </section>
  );
};
