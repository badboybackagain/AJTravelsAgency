import React from 'react';
import { Plane, Clock, ShieldCheck, MessageSquare } from 'lucide-react';
import { getWhatsAppLink } from '../utils/whatsapp';

export const AirportSection = () => {
  return (
    <section id="airport" className="section-padding bg-light">
      <div className="container">
        <div className="section-header">
          <span className="eyebrow">AIRPORT EXPRESS TRANSFERS</span>
          <h2>Pune ↔ Mumbai Airport Transfers</h2>
          <p>
            Need to travel between Pune and Mumbai airports or connect with an airport journey? Request private airport transportation with vehicle options suited to your passengers and luggage.
          </p>
        </div>

        <div className="airport-grid">
          {/* Card 1: Pune Airport -> Mumbai */}
          <div className="airport-card card-hover-effect">
            <div className="airport-badge">ROUTE 01</div>
            <h3>Pune Airport (PNQ) → Mumbai City & Airport</h3>
            <p className="airport-copy">
              Direct terminal pickup from Pune Airport (PNQ) to your residence, hotel, or flight connection at Mumbai International Airport (BOM T1 & T2).
            </p>
            <ul className="airport-features">
              <li><Clock size={14} color="#C89B3C" /> Flight delay tracking & punctual pickup</li>
              <li><ShieldCheck size={14} color="#C89B3C" /> Dedicated luggage space for international bags</li>
            </ul>
            <a
              href={getWhatsAppLink({ from: 'Pune Airport (PNQ)', to: 'Mumbai Airport (BOM)', tripType: 'Airport Transfer' })}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-whatsapp btn-full"
            >
              <MessageSquare size={16} />
              <span>BOOK PUNE AIRPORT → MUMBAI</span>
            </a>
          </div>

          {/* Card 2: Mumbai Airport -> Pune */}
          <div className="airport-card card-hover-effect">
            <div className="airport-badge gold-badge">ROUTE 02</div>
            <h3>Mumbai Airport (BOM) → Pune City</h3>
            <p className="airport-copy">
              Pre-booked pickup from Mumbai Airport T1 & T2 arrival gates directly to your home, office, or hotel in Pune, Hinjawadi, or Wakad.
            </p>
            <ul className="airport-features">
              <li><Clock size={14} color="#C89B3C" /> Driver waiting with name board at airport exit</li>
              <li><ShieldCheck size={14} color="#C89B3C" /> Clean sedan & SUV options ready upon arrival</li>
            </ul>
            <a
              href={getWhatsAppLink({ from: 'Mumbai Airport (BOM)', to: 'Pune', tripType: 'Airport Transfer' })}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-gold btn-full"
            >
              <MessageSquare size={16} />
              <span>BOOK MUMBAI AIRPORT → PUNE</span>
            </a>
          </div>
        </div>
      </div>

      <style>{`
        .airport-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }

        .airport-card {
          background: #FFFFFF;
          border-radius: var(--radius-xl);
          padding: 2.25rem;
          border: 1px solid #E5E7EB;
          display: flex;
          flex-direction: column;
          box-shadow: var(--shadow-sm);
        }

        .airport-badge {
          display: inline-block;
          align-self: flex-start;
          font-family: var(--font-heading);
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          background: var(--bg-dark-navy);
          color: #FFFFFF;
          padding: 0.25rem 0.65rem;
          border-radius: 4px;
          margin-bottom: 1rem;
        }

        .gold-badge {
          background: var(--accent-gold-soft);
          color: #000000;
        }

        .airport-card h3 {
          font-size: 1.5rem;
          color: var(--bg-dark-navy);
          margin-bottom: 0.85rem;
        }

        .airport-copy {
          font-size: 0.92rem;
          color: var(--text-muted);
          line-height: 1.6;
          margin-bottom: 1.5rem;
          flex-grow: 1;
        }

        .airport-features {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          margin-bottom: 2rem;
        }

        .airport-features li {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          font-weight: 600;
          color: #374151;
        }

        @media (max-width: 768px) {
          .airport-grid {
            display: flex;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            gap: 1rem;
            padding: 0.5rem 0.25rem 1rem;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }
          .airport-grid::-webkit-scrollbar {
            display: none;
          }
          .airport-card {
            flex: 0 0 85%;
            max-width: 310px;
            scroll-snap-align: start;
            padding: 1.25rem;
            border-radius: 18px;
          }
          .airport-card h3 {
            font-size: 1.25rem;
          }
          .airport-copy {
            font-size: 0.84rem;
            margin-bottom: 1rem;
          }
        }
      `}</style>
    </section>
  );
};
