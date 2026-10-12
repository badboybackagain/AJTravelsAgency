import React from 'react';
import { MapPin, Calendar, Calculator, CheckCircle } from 'lucide-react';

export const BookingSteps = () => {
  const steps = [
    {
      num: '01',
      title: 'ENTER PICKUP & DESTINATION',
      desc: 'Specify your exact pickup location in Pune or Mumbai (home, office, hotel, or airport terminal).',
      icon: MapPin
    },
    {
      num: '02',
      title: 'CHOOSE DATE & VEHICLE',
      desc: 'Select your preferred departure date, time, passenger count, and vehicle class (Sedan, SUV, Luxury, Mini Bus).',
      icon: Calendar
    },
    {
      num: '03',
      title: 'GET FARE & AVAILABILITY',
      desc: 'Receive transparent fare estimates and current vehicle availability instantly via WhatsApp or phone.',
      icon: Calculator
    },
    {
      num: '04',
      title: 'CONFIRM & RIDE',
      desc: 'Confirm your booking, receive driver details, and enjoy a safe, comfortable intercity journey.',
      icon: CheckCircle
    }
  ];

  return (
    <section className="section-padding bg-light">
      <div className="container">
        <div className="section-header">
          <span className="eyebrow">EFFORTLESS BOOKING WORKFLOW</span>
          <h2>Book Your Pune–Mumbai Journey in 4 Simple Steps</h2>
          <p>
            No complex sign-ups. Get fast vehicle confirmation in minutes.
          </p>
        </div>

        <div className="steps-timeline-grid">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div key={idx} className="step-timeline-card card-hover-effect">
                <div className="step-card-header">
                  <span className="step-number">{step.num}</span>
                  <div className="step-icon-box">
                    <Icon size={20} color="#D8AE55" />
                  </div>
                </div>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-desc">{step.desc}</p>
                {idx < steps.length - 1 && <div className="step-connector-arrow">→</div>}
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        .steps-timeline-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
          position: relative;
        }

        .step-timeline-card {
          background: #FFFFFF;
          border-radius: var(--radius-xl);
          padding: 1.75rem;
          border: 1px solid #E5E7EB;
          display: flex;
          flex-direction: column;
          position: relative;
          box-shadow: var(--shadow-sm);
        }

        .step-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.25rem;
        }

        .step-number {
          font-family: var(--font-heading);
          font-size: 1.8rem;
          font-weight: 800;
          color: var(--accent-gold-soft);
        }

        .step-icon-box {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: rgba(216, 174, 85, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .step-title {
          font-size: 1rem;
          color: var(--bg-dark-navy);
          margin-bottom: 0.6rem;
          letter-spacing: 0.02em;
        }

        .step-desc {
          font-size: 0.85rem;
          color: #6B7280;
          line-height: 1.5;
        }

        .step-connector-arrow {
          position: absolute;
          top: 50%;
          right: -1rem;
          transform: translateY(-50%);
          font-size: 1.2rem;
          color: var(--accent-gold-soft);
          font-weight: 800;
          z-index: 2;
        }

        @media (max-width: 1024px) {
          .steps-timeline-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .step-connector-arrow {
            display: none;
          }
        }

        @media (max-width: 640px) {
          .steps-timeline-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  );
};
