import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { EnquiryModal } from '../components/EnquiryModal';
import { MobileStickyBar } from '../components/MobileStickyBar';
import { usePageSeo } from '../hooks/usePageSeo';
import { businessConfig } from '../config/business.config';
import { 
  ShieldCheck, 
  Lock, 
  Phone, 
  Mail, 
  MapPin
} from 'lucide-react';

export function PrivacyPolicyPage() {
  usePageSeo(
    'privacy_policy',
    'Privacy Policy | AJ Travels Pune Vehicle Rental Agency',
    'Read the privacy policy of AJ Travels Pune. Information on passenger privacy, OTP phone verification security, and customer data protection standards.',
    'https://ajtravelspune.com/privacy-policy/'
  );

  const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);

  const policySections = [
    {
      title: '1. Information We Collect',
      desc: 'To provide reliable intercity cab bookings and calculate transparent quotes, we collect only essential travel details. This includes passenger name, contact phone number, travel dates, pickup location, and drop destination. Phone numbers are verified through standard WhatsApp OTP to prevent spam and protect booking integrity.'
    },
    {
      title: '2. How Your Information Is Used',
      desc: 'Collected information is strictly used for dispatch coordination: assigning licensed chauffeurs, sending vehicle arrival updates, issuing digital trip sheets, providing GST invoices, and offering customer support. We do not use your details for unsolicited commercial robocalls or marketing spam.'
    },
    {
      title: '3. Zero Data Sharing & Selling',
      desc: 'AJ Travels maintains a strict zero-tolerance policy against selling, renting, or trading customer personal records to third-party data brokers, marketers, or advertisers. Your contact details are shared exclusively with the assigned chauffeur 2 hours prior to scheduled departure for doorstep pickup navigation.'
    },
    {
      title: '4. WhatsApp & Communication Privacy',
      desc: 'All communications conducted via WhatsApp or phone are strictly operational. You may request customer service or trip modifications at any time by messaging our 24/7 travel desk. We never solicit sensitive banking credentials, OTPs, or passwords over WhatsApp.'
    },
    {
      title: '5. Data Security Standards',
      desc: 'We implement industry-standard encryption, SSL (HTTPS), and secure operational protocols to protect all stored information against unauthorized access, loss, or disclosure. Server logs and temporary trip quotes are periodically pruned.'
    },
    {
      title: '6. Policy Updates & Contact Details',
      desc: 'This Privacy Policy is effective as of 2026. For inquiries regarding data protection or to request removal of your contact record from our booking registry, please contact our administrative desk.'
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
            <span className="bc-current">Privacy Policy</span>
          </div>

          <div className="internal-hero-content">
            <div className="hero-badge-pill">
              <Lock size={14} />
              <span>DATA PROTECTION &amp; PRIVACY</span>
            </div>
            <h1 className="internal-hero-title">
              Privacy <span className="text-gradient">Policy</span>
            </h1>
            <p className="internal-hero-subtitle">
              At AJ Travels, protecting the privacy and personal details of our passengers, corporate clients, and website visitors is fundamental to how we operate.
            </p>
          </div>
        </div>
      </section>

      {/* Main Policy Content Section */}
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
                  AJ Travels Customer Privacy Commitment
                </h2>
                <span style={{ fontSize: '0.8rem', color: '#64748B' }}>Last updated: March 2026 • Effective for all bookings</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {policySections.map((sec, idx) => (
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

            {/* Contact Box */}
            <div style={{
              marginTop: '3rem',
              padding: '1.5rem',
              background: '#F0F9FF',
              borderRadius: '12px',
              border: '1px solid #BAE6FD'
            }}>
              <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem', fontWeight: 800, color: '#0369A1' }}>
                Questions or Data Inquiries?
              </h4>
              <p style={{ margin: '0 0 1rem', fontSize: '0.85rem', color: '#0C4A6E', lineHeight: 1.6 }}>
                If you have questions regarding our privacy practices or wish to update your details, contact our 24/7 desk:
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', fontSize: '0.85rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0369A1', fontWeight: 600 }}>
                  <Phone size={14} /> {businessConfig.phoneDisplay}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0369A1', fontWeight: 600 }}>
                  <Mail size={14} /> {businessConfig.email}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#0369A1', fontWeight: 600 }}>
                  <MapPin size={14} /> Kasarwadi Hub, Pune 411064
                </span>
              </div>
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
