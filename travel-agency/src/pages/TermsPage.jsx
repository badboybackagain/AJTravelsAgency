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
    <div className="about-page-wrapper">
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
      <section style={{ padding: '3.5rem 0 5rem', background: '#F8FAFC' }}>
        <div className="container" style={{ maxWidth: '900px' }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            padding: '2.5rem',
            boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid #E2E8F0' }}>
              <ShieldCheck size={28} color="#0284C7" />
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
                  AJ Travels Standard Booking Terms
                </h2>
                <span style={{ fontSize: '0.8rem', color: '#64748B' }}>Valid across all Pune, Mumbai &amp; Maharashtra routes</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {termsSections.map((sec, idx) => (
                <div key={idx}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1E293B', marginBottom: '0.5rem' }}>
                    {sec.title}
                  </h3>
                  <p style={{ fontSize: '0.92rem', lineHeight: 1.7, color: '#475569', margin: 0 }}>
                    {sec.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* Assistance Banner */}
            <div style={{
              marginTop: '3rem',
              padding: '1.5rem',
              background: '#F8FAFC',
              borderRadius: '12px',
              border: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div>
                <h4 style={{ margin: '0 0 0.25rem', fontSize: '0.95rem', fontWeight: 800, color: '#0F172A' }}>
                  Need Assistance or Route Guidance?
                </h4>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748B' }}>
                  Our dispatch operations desk is open 24 hours a day, 7 days a week.
                </p>
              </div>
              <Link
                to="/fare"
                className="admin-btn-primary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.8rem',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  textDecoration: 'none'
                }}
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
    </div>
  );
}
