import React from 'react';
import { Shield, Sparkles, UserCheck, MapPin, RefreshCw, Users } from 'lucide-react';
import { businessConfig } from '../config/business.config';

export const WhyChooseUs = () => {
  const features = [
    {
      num: '01',
      title: 'FAST VEHICLE AVAILABILITY',
      copy: businessConfig.dispatchDisclaimer,
      icon: Shield
    },
    {
      num: '02',
      title: 'CLEAN & COMFORTABLE VEHICLES',
      copy: 'Comfortable, clean and well-maintained vehicles equipped with dual air conditioning and leatherette seating for intercity travel.',
      icon: Sparkles
    },
    {
      num: '03',
      title: 'PROFESSIONAL DRIVERS',
      copy: 'Professional, verified drivers focused on a comfortable, punctual and safety-conscious journey on the Pune-Mumbai Expressway.',
      icon: UserCheck
    },
    {
      num: '04',
      title: 'DOORSTEP PICKUP',
      copy: 'Request pickup from your home, office, hotel, airport or another suitable location across supported Pune and Mumbai sectors.',
      icon: MapPin
    },
    {
      num: '05',
      title: 'FLEXIBLE TRAVEL OPTIONS',
      copy: 'Dedicated one-way and customized round-trip options designed around your specific travel schedule and return preferences.',
      icon: RefreshCw
    },
    {
      num: '06',
      title: 'GROUP TRANSPORTATION',
      copy: 'Tempo Traveller mini buses and 20-seater mini coaches available for eligible family, corporate, wedding and event group bookings.',
      icon: Users
    }
  ];

  return (
    <section id="why-us" className="section-padding bg-dark-navy">
      <div className="container">
        <div className="section-header">
          <span className="eyebrow">THE PRIVATE TRAVEL ADVANTAGE</span>
          <h2>More Than a Ride. A Better Way to Travel.</h2>
          <p>
            Why thousands of intercity travelers choose our private chauffeured cars between Pune and Mumbai.
          </p>
        </div>

        <div className="why-us-grid">
          {features.map((f, idx) => {
            const Icon = f.icon;
            return (
              <div key={idx} className="why-card card-hover-effect">
                <div className="why-card-top">
                  <span className="why-num">{f.num}</span>
                  <div className="why-icon-box">
                    <Icon size={20} color="#D8AE55" />
                  </div>
                </div>
                <h3 className="why-title">{f.title}</h3>
                <p className="why-copy">{f.copy}</p>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        .why-us-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.75rem;
        }

        .why-card {
          background: rgba(255, 255, 255, 0.03);
          border-radius: var(--radius-xl);
          padding: 2rem;
          border: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          flex-direction: column;
        }

        .why-card:hover {
          border-color: var(--accent-gold-soft);
          background: rgba(255, 255, 255, 0.05);
        }

        .why-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.25rem;
        }

        .why-num {
          font-family: var(--font-heading);
          font-size: 2rem;
          font-weight: 800;
          color: var(--accent-gold-soft);
          opacity: 0.6;
        }

        .why-icon-box {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: rgba(216, 174, 85, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .why-title {
          font-size: 1.15rem;
          color: #FFFFFF;
          margin-bottom: 0.75rem;
          letter-spacing: 0.02em;
        }

        .why-copy {
          font-size: 0.88rem;
          color: #9CA3AF;
          line-height: 1.6;
        }

        @media (max-width: 1024px) {
          .why-us-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .why-us-grid {
            display: flex;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            gap: 1rem;
            padding: 0.5rem 0.25rem 1rem;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }
          .why-us-grid::-webkit-scrollbar {
            display: none;
          }
          .why-card {
            flex: 0 0 82%;
            max-width: 290px;
            scroll-snap-align: start;
            padding: 1.25rem;
            border-radius: 18px;
          }
        }
      `}</style>
    </section>
  );
};
