import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { EnquiryModal } from '../components/EnquiryModal';
import { MobileStickyBar } from '../components/MobileStickyBar';
import { usePageSeo } from '../hooks/usePageSeo';
import { 
  FileCheck2, 
  ShieldCheck, 
  ArrowRight
} from 'lucide-react';

export function TermsPage() {
  usePageSeo(
    'terms',
    'Terms & Conditions | Booking Policies - AJ Travels',
    'Terms of service and booking conditions for AJ Travels Pune. Details on transparent all-inclusive toll pricing, cancellation terms, and chauffeur standards.',
    'https://ajtravelsagency.vercel.app/terms/'
  );

  const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);

  const termsSections = [
    {
      title: '1. Transparent All-Inclusive Pricing Policy',
      desc: 'All intercity quotes provided by AJ Travels (including Pune to Mumbai, airport transfers, and outstation packages) explicitly include expressway toll plaza charges, state entry permits, and chauffeur allowances as stated in your quote. Parking fees at private airports, malls, or monuments incurred during local waiting are payable at actuals against parking receipts.'
    },
    {
      title: '2. Doorstep Pickup & Chauffeur Punctuality',
      desc: 'Our chauffeurs arrive at your designated pickup address 10 to 15 minutes before scheduled departure. Chauffeur details and vehicle registration numbers are dispatched via WhatsApp/SMS 2 hours prior to journey time. We request passengers to be ready at the scheduled time to avoid highway traffic bottlenecks.'
    },
    {
      title: '3. Flight Tracking & Airport Transfers',
      desc: 'For Mumbai Airport (BOM T1 & T2) and Pune Airport (PNQ) arrival pickups, our operations team actively tracks inbound flight status. In the event of flight delays, pickup timing is automatically recalibrated without applying waiting penalties.'
    },
    {
      title: '4. Cancellation & Rescheduling Policy',
      desc: 'Bookings may be cancelled or rescheduled up to 4 hours prior to scheduled pickup time with zero cancellation charges. For cancellations made within 2 hours of departure after vehicle dispatch, a nominal dispatch fee may apply to compensate the chauffeur.'
    },
    {
      title: '5. Vehicle Upkeep & Passenger Safety Rules',
      desc: 'Every vehicle in our commercial fleet undergoes regular preventive maintenance, brake testing, and sanitization. In compliance with safety regulations, seatbelts must be worn at all times. Smoking, hazardous substances, and open consumption of alcoholic beverages are strictly prohibited inside the vehicle.'
    },
    {
      title: '6. Payment Modes & GST Invoicing',
      desc: 'Payments may be completed securely via UPI, digital bank transfer, corporate credit, or cash paid directly to the chauffeur upon arrival. GST-compliant tax invoices are issued promptly upon journey completion.'
    }
  ];

  return (
    <div className="terms-page-wrapper">
      <Header onOpenEnquiry={() => setIsEnquiryOpen(true)} isDark={false} />

      {/* Internal Hero Banner */}
      <section className="internal-hero-section">
        <div className="container">
          <div className="breadcrumbs-nav">
            <Link to="/">Home</Link>
            <span className="bc-sep">/</span>
            <span className="bc-current">Terms &amp; Conditions</span>
          </div>

          <div className="internal-hero-content">
            <div className="hero-badge-pill">
              <FileCheck2 size={14} />
              <span>TRANSPARENT BOOKING POLICIES</span>
            </div>
            <h1 className="internal-hero-title">
              Terms &amp; <span className="text-gradient">Conditions</span>
            </h1>
            <p className="internal-hero-subtitle">
              Clear, transparent guidelines governing all intercity cab reservations, airport transfers, and vehicle rentals with AJ Travels.
            </p>
          </div>
        </div>
      </section>

      {/* Main Terms Content Section */}
      <section className="terms-content-section">
        <div className="container" style={{ maxWidth: '900px' }}>
          <div className="terms-card">
            <div className="terms-card-header">
              <div className="terms-header-icon-box">
                <ShieldCheck size={26} color="#2563EB" />
              </div>
              <div>
                <h2 className="terms-card-title">
                  AJ Travels Standard Booking Terms
                </h2>
                <span className="terms-card-subtitle">Valid across all Pune, Mumbai &amp; Maharashtra routes</span>
              </div>
            </div>

            <div className="terms-sections-list">
              {termsSections.map((sec, idx) => (
                <div key={idx} className="terms-section-item">
                  <h3 className="terms-section-title">
                    {sec.title}
                  </h3>
                  <p className="terms-section-desc">
                    {sec.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* Assistance Banner */}
            <div className="terms-assistance-banner">
              <div>
                <h4 className="terms-assistance-heading">
                  Need Assistance or Route Guidance?
                </h4>
                <p className="terms-assistance-subtext">
                  Our dispatch operations desk is open 24 hours a day, 7 days a week.
                </p>
              </div>
              <Link
                to="/fare"
                className="terms-fare-btn"
              >
                <span>Calculate Your Fare</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer & Global Elements */}
      <Footer />
      <EnquiryModal isOpen={isEnquiryOpen} onClose={() => setIsEnquiryOpen(false)} />
      <MobileStickyBar onOpenEnquiry={() => setIsEnquiryOpen(true)} />

      <style>{`
        .terms-page-wrapper {
          min-height: 100vh;
          background-color: #F8FAFC;
          color: #0F172A;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .internal-hero-section {
          background: linear-gradient(180deg, #F8FAFC 0%, #EFF6FF 100%);
          padding: 7rem 0 2.5rem;
          border-bottom: 1px solid #E2E8F0;
        }

        .breadcrumbs-nav {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          color: #64748B;
          margin-bottom: 1rem;
        }

        .breadcrumbs-nav a {
          color: #2563EB;
          text-decoration: none;
          font-weight: 500;
          transition: color 0.15s ease;
        }

        .breadcrumbs-nav a:hover {
          color: #1D4ED8;
          text-decoration: underline;
        }

        .bc-sep {
          color: #94A3B8;
        }

        .bc-current {
          color: #0F172A;
          font-weight: 600;
        }

        .hero-badge-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          background: rgba(37, 99, 235, 0.1);
          color: #2563EB;
          padding: 0.35rem 0.85rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          margin-bottom: 0.75rem;
        }

        .internal-hero-title {
          font-size: 2.35rem;
          font-weight: 800;
          line-height: 1.2;
          color: #0F172A;
          max-width: 820px;
          margin-bottom: 0.75rem;
          letter-spacing: -0.02em;
        }

        .text-gradient {
          background: linear-gradient(135deg, #1D4ED8 0%, #0284C7 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .internal-hero-subtitle {
          font-size: 1.05rem;
          line-height: 1.6;
          color: #475569;
          max-width: 760px;
          margin: 0;
        }

        .terms-content-section {
          padding: 3.5rem 0 5rem;
          background: #F8FAFC;
        }

        .terms-card {
          background: #FFFFFF;
          border-radius: 20px;
          border: 1px solid #E2E8F0;
          padding: 2.75rem;
          box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.04), 0 2px 8px -2px rgba(0, 0, 0, 0.02);
        }

        .terms-card-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2.25rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid #E2E8F0;
        }

        .terms-header-icon-box {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: #EFF6FF;
          border: 1px solid #BFDBFE;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .terms-card-title {
          margin: 0;
          font-size: 1.35rem;
          font-weight: 800;
          color: #0F172A;
          letter-spacing: -0.01em;
        }

        .terms-card-subtitle {
          display: block;
          font-size: 0.82rem;
          color: #64748B;
          margin-top: 0.25rem;
        }

        .terms-sections-list {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .terms-section-item {
          display: flex;
          flex-direction: column;
        }

        .terms-section-title {
          font-size: 1.08rem;
          font-weight: 700;
          color: #1E293B;
          margin: 0 0 0.5rem;
          letter-spacing: -0.01em;
        }

        .terms-section-desc {
          font-size: 0.94rem;
          line-height: 1.75;
          color: #475569;
          margin: 0;
        }

        .terms-assistance-banner {
          margin-top: 3rem;
          padding: 1.5rem 1.75rem;
          background: #EFF6FF;
          border-radius: 14px;
          border: 1px solid #BFDBFE;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1.25rem;
        }

        .terms-assistance-heading {
          margin: 0 0 0.35rem;
          font-size: 0.98rem;
          font-weight: 800;
          color: #1D4ED8;
        }

        .terms-assistance-subtext {
          margin: 0;
          font-size: 0.85rem;
          color: #1E40AF;
        }

        .terms-fare-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
          color: #FFFFFF !important;
          font-size: 0.84rem;
          font-weight: 700;
          padding: 0.65rem 1.25rem;
          border-radius: 10px;
          text-decoration: none;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
          transition: all 0.2s ease;
        }

        .terms-fare-btn:hover {
          background: linear-gradient(135deg, #1D4ED8 0%, #1E40AF 100%);
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(37, 99, 235, 0.35);
        }

        @media (max-width: 768px) {
          .internal-hero-section {
            padding: 5.5rem 0 1.75rem;
          }
          .internal-hero-title {
            font-size: 1.75rem;
          }
          .internal-hero-subtitle {
            font-size: 0.92rem;
          }
          .terms-content-section {
            padding: 2rem 0 3.5rem;
          }
          .terms-card {
            padding: 1.5rem 1.25rem;
            border-radius: 16px;
          }
          .terms-card-title {
            font-size: 1.12rem;
          }
          .terms-section-title {
            font-size: 0.98rem;
          }
          .terms-section-desc {
            font-size: 0.88rem;
            line-height: 1.65;
          }
          .terms-assistance-banner {
            flex-direction: column;
            align-items: flex-start;
            padding: 1.25rem;
            margin-top: 2rem;
          }
          .terms-fare-btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}
