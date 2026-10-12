import React from 'react';
import { ShieldCheck, CheckCircle2, Wrench, UserCheck, PhoneCall, FileText } from 'lucide-react';

export const SafetySection = () => {
  const safetyPractices = [
    {
      icon: Wrench,
      title: 'Regular Vehicle Maintenance',
      desc: 'Frequent technical inspections, tire health checks, and engine servicing prior to outstation trips.'
    },
    {
      icon: UserCheck,
      title: 'Background Verified Drivers',
      desc: 'All chauffeurs undergo identity verification, commercial driving license checks, and route training.'
    },
    {
      icon: FileText,
      title: 'Instant Trip Confirmation',
      desc: 'Receive clear vehicle details, driver contact numbers, and pickup timings directly on WhatsApp or SMS.'
    },
    {
      icon: PhoneCall,
      title: '24/7 Operational Support',
      desc: 'Dedicated customer support team reachable during your trip for location updates or emergency queries.'
    }
  ];

  return (
    <section className="section-padding bg-white">
      <div className="container">
        <div className="safety-box">
          <div className="safety-header">
            <span className="eyebrow-text">SAFETY & QUALITY ASSURANCE</span>
            <h2>Travel With Comfort & Confidence</h2>
            <p>
              We focus on clean vehicles, professional driving standards and a booking process designed strictly around customer convenience and safety.
            </p>
          </div>

          <div className="safety-grid">
            {safetyPractices.map((practice, idx) => {
              const Icon = practice.icon;
              return (
                <div key={idx} className="safety-item">
                  <div className="safety-icon-wrapper">
                    <Icon size={22} color="#C89B3C" />
                  </div>
                  <div>
                    <h3 className="safety-item-title">{practice.title}</h3>
                    <p className="safety-item-desc">{practice.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        .safety-box {
          background: #FAFAFA;
          border-radius: var(--radius-xl);
          padding: 3rem;
          border: 1px solid #E5E7EB;
          box-shadow: var(--shadow-md);
        }

        .safety-header {
          text-align: center;
          max-width: 720px;
          margin: 0 auto 3rem auto;
        }

        .safety-header h2 {
          font-size: 2.2rem;
          color: var(--bg-dark-navy);
          margin-bottom: 0.75rem;
        }

        .safety-header p {
          color: var(--text-muted);
          font-size: 1.05rem;
        }

        .safety-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 2rem;
        }

        .safety-item {
          display: flex;
          align-items: flex-start;
          gap: 1.25rem;
          background: #FFFFFF;
          padding: 1.5rem;
          border-radius: var(--radius-lg);
          border: 1px solid #F3F4F6;
        }

        .safety-icon-wrapper {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: rgba(200, 155, 60, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .safety-item-title {
          font-size: 1.1rem;
          color: var(--bg-dark-navy);
          margin-bottom: 0.35rem;
        }

        .safety-item-desc {
          font-size: 0.88rem;
          color: #6B7280;
          line-height: 1.5;
        }

        @media (max-width: 768px) {
          .safety-box {
            padding: 1.5rem;
          }
          .safety-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  );
};
