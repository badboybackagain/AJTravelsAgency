import React from 'react';
import { CheckCircle2, MessageSquare, MapPin, ShieldCheck } from 'lucide-react';
import { getWhatsAppLink } from '../utils/whatsapp';

export const MumbaiToPuneSection = () => {
  const benefits = [
    { title: 'Doorstep Pickup Anywhere in Mumbai', desc: 'Pickups from Andheri, BKC, Bandra, Powai, Thane, Navi Mumbai & Airports.' },
    { title: 'Dedicated One-Way Travel', desc: 'Pay only for your one-way journey with no hidden multi-day charges.' },
    { title: 'Round-Trip Flexibility', desc: 'Keep the vehicle for return travel to Mumbai on your customized schedule.' },
    { title: 'Mumbai Airport (BOM) Express', desc: 'Seamless pickups right from Chhatrapati Shivaji Maharaj International Airport (T1 & T2).' },
    { title: 'Corporate Executive Transportation', desc: 'Comfortable cars for business meetings, conferences, and office visits.' },
    { title: 'Family & Group Fleets', desc: 'Choice of Sedan, SUV, Luxury Cars, Mini Bus, and 20-Seater options.' }
  ];

  return (
    <section id="mumbai-to-pune" className="section-padding bg-light">
      <div className="container">
        <div className="split-grid split-reverse">
          {/* Left Column: Copy & Benefits */}
          <div className="split-content">
            <span className="eyebrow-text">MUMBAI → PUNE PRIVATE TAXI</span>
            <h2>Mumbai to Pune Taxi Service</h2>
            <p className="lead-paragraph">
              Travel from Mumbai to Pune with convenient private transportation and pickup from your preferred location, subject to service availability. Choose from available sedan, SUV, premium and larger group vehicle options.
            </p>

            <h3 className="subheading">Mumbai to Pune Travel Made Simple</h3>

            <div className="benefits-grid">
              {benefits.map((b, idx) => (
                <div key={idx} className="benefit-item">
                  <CheckCircle2 size={18} color="#C89B3C" className="benefit-icon" />
                  <div>
                    <h4 className="benefit-title">{b.title}</h4>
                    <p className="benefit-desc">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="action-row">
              <a
                href={getWhatsAppLink({ from: 'Mumbai', to: 'Pune', tripType: 'One Way' })}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-whatsapp btn-lg"
              >
                <MessageSquare size={18} />
                <span>BOOK MUMBAI → PUNE</span>
              </a>
            </div>
          </div>

          {/* Right Column: Visual Media */}
          <div className="split-media">
            <img
              src="/assets/suv.webp"
              alt="Mumbai to Pune Taxi Service spacious SUV"
              className="split-img rounded-img"
              loading="lazy"
            />
            <div className="media-overlay-badge">
              <ShieldCheck size={18} color="#D8AE55" />
              <span>Mumbai → Pune Return Express</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .split-reverse {
          grid-template-columns: 1fr 1fr;
        }

        @media (max-width: 992px) {
          .split-reverse {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
          .split-reverse .split-media {
            order: -1;
          }
          .split-reverse .split-img {
            height: 180px;
          }
          .split-reverse .benefits-grid {
            grid-template-columns: 1fr 1fr;
            gap: 0.75rem;
          }
        }
      `}</style>
    </section>
  );
};
