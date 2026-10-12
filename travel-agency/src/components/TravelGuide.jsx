import React from 'react';
import { BookOpen, Train, Bus, Calendar, Car } from 'lucide-react';

export const TravelGuide = () => {
  return (
    <section className="section-padding bg-white">
      <div className="container">
        <div className="section-header">
          <span className="eyebrow">INSIGHTS & INTERCITY ADVICE</span>
          <h2>Pune to Mumbai Travel Guide</h2>
          <p>
            Objective information to help you plan your journey between Pune and Mumbai.
          </p>
        </div>

        <div className="guide-grid">
          {/* Taxi vs Train */}
          <div className="guide-card">
            <div className="guide-card-header">
              <Train size={20} color="#C89B3C" />
              <h3>Pune to Mumbai Taxi vs Train</h3>
            </div>
            <p className="guide-text">
              While express trains like the Deccan Queen and Shatabdi run scheduled trips between Pune Junction and Mumbai CSMT/Dadars, a <strong>private taxi</strong> offers distinct advantages:
            </p>
            <ul className="guide-bullets">
              <li><strong>Doorstep Pickup:</strong> Eliminates travel to railway stations with luggage.</li>
              <li><strong>Flexible Departure:</strong> Leave whenever your schedule demands, 24/7.</li>
              <li><strong>Private Space:</strong> Dedicated cabin for privacy, working, or resting.</li>
              <li><strong>Luggage Convenience:</strong> Direct trunk loading without station staircases.</li>
              <li><strong>Point-to-Point Destination:</strong> Direct arrival at your exact Mumbai destination.</li>
            </ul>
          </div>

          {/* Taxi vs Bus */}
          <div className="guide-card">
            <div className="guide-card-header">
              <Bus size={20} color="#C89B3C" />
              <h3>Pune to Mumbai Taxi vs Bus</h3>
            </div>
            <p className="guide-text">
              Intercity buses run regularly along the expressway. However, choosing a chauffeured <strong>private cab</strong> provides:
            </p>
            <ul className="guide-bullets">
              <li><strong>No Fixed Stops:</strong> Skip multiple passenger pickup points across the city.</li>
              <li><strong>Exclusive Vehicle:</strong> No sharing seats with strangers during travel.</li>
              <li><strong>Custom Route Pauses:</strong> Stop at food malls or rest plazas on your preference.</li>
              <li><strong>Group Economy:</strong> Families and groups of 4-6 often find private SUVs comparable in total cost to multiple individual luxury bus tickets.</li>
            </ul>
          </div>

          {/* When to Book */}
          <div className="guide-card">
            <div className="guide-card-header">
              <Calendar size={20} color="#C89B3C" />
              <h3>When Should You Book a Pune Mumbai Taxi?</h3>
            </div>
            <p className="guide-text">
              <strong>Advance Booking:</strong> Recommended for airport transfers, early morning international flights, long weekend holidays, festival seasons, and 12-20 seater group vehicles.
            </p>
            <p className="guide-text" style={{ marginTop: '0.75rem' }}>
              <strong>Urgent / Last-Minute Travel:</strong> Contact our team directly to check real-time vehicle availability across supported Pune and Mumbai sectors for immediate dispatch.
            </p>
          </div>

          {/* Vehicle Selection Guide */}
          <div className="guide-card">
            <div className="guide-card-header">
              <Car size={20} color="#C89B3C" />
              <h3>Which Vehicle Is Best for Your Trip?</h3>
            </div>
            <ul className="guide-bullets">
              <li><strong>Executive Sedan:</strong> Best for 1–3 passengers with 2 medium bags seeking economical private travel.</li>
              <li><strong>Spacious SUV (Innova/Ertiga):</strong> Ideal for 4–6 passengers, family travel, and heavy airport luggage.</li>
              <li><strong>Premium / Luxury Class:</strong> Recommended for VIP delegates, executive corporate visits, and high-comfort rides.</li>
              <li><strong>Mini Bus & 20-Seater:</strong> Essential for wedding guests, event teams, and 7–20 passenger groups.</li>
            </ul>
          </div>
        </div>
      </div>

      <style>{`
        .guide-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }

        .guide-card {
          background: #FAFAFA;
          border-radius: var(--radius-xl);
          padding: 2rem;
          border: 1px solid #E5E7EB;
        }

        .guide-card-header {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          margin-bottom: 1.25rem;
          padding-bottom: 0.75rem;
          border-bottom: 2px solid #E5E7EB;
        }

        .guide-card-header h3 {
          font-size: 1.3rem;
          color: var(--bg-dark-navy);
        }

        .guide-text {
          font-size: 0.92rem;
          color: #4B5563;
          line-height: 1.6;
        }

        .guide-bullets {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
          margin-top: 1rem;
        }

        .guide-bullets li {
          font-size: 0.88rem;
          color: #374151;
          line-height: 1.5;
          position: relative;
          padding-left: 1.25rem;
        }

        .guide-bullets li::before {
          content: "•";
          color: var(--accent-gold-soft);
          font-weight: bold;
          font-size: 1.2rem;
          position: absolute;
          left: 0;
          top: -0.1rem;
        }

        @media (max-width: 768px) {
          .guide-grid {
            display: flex;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            gap: 1rem;
            padding: 0.5rem 0.25rem 1rem;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }
          .guide-grid::-webkit-scrollbar {
            display: none;
          }
          .guide-card {
            flex: 0 0 85%;
            max-width: 310px;
            scroll-snap-align: start;
            padding: 1.25rem;
            border-radius: 18px;
          }
          .guide-card-header h3 {
            font-size: 1.15rem;
          }
          .guide-text {
            font-size: 0.84rem;
          }
          .guide-bullets li {
            font-size: 0.8rem;
          }
        }
      `}</style>
    </section>
  );
};
