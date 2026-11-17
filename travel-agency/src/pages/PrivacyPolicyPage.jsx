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
    'https://ajtravelsagency.vercel.app/privacy-policy/'
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
    <div className="policy-page-wrapper">
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
      <section className="policy-content-section">
        <div className="container" style={{ maxWidth: '900px' }}>
          <div className="policy-card">
            <div className="policy-card-header">
              <div className="policy-header-icon-box">
                <ShieldCheck size={26} color="#2563EB" />
              </div>
              <div>
                <h2 className="policy-card-title">
                  AJ Travels Customer Privacy Commitment
                </h2>
                <span className="policy-card-subtitle">Last updated: March 2026 • Effective for all bookings</span>
              </div>
            </div>

            <div className="policy-sections-list">
              {policySections.map((sec, idx) => (
                <div key={idx} className="policy-section-item">
                  <h3 className="policy-section-title">
                    {sec.title}
                  </h3>
                  <p className="policy-section-desc">
                    {sec.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* Contact Box */}
            <div className="policy-contact-box">
              <h4 className="policy-contact-heading">
                Questions or Data Inquiries?
              </h4>
              <p className="policy-contact-subtext">
                If you have questions regarding our privacy practices or wish to update your details, contact our 24/7 desk:
              </p>
              <div className="policy-contact-channels">
                <span className="policy-contact-pill">
                  <Phone size={14} /> {businessConfig.phoneDisplay}
                </span>
                <span className="policy-contact-pill">
                  <Mail size={14} /> {businessConfig.email}
                </span>
                <span className="policy-contact-pill">
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

      <style>{`
        .policy-page-wrapper {
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

        .policy-content-section {
          padding: 3.5rem 0 5rem;
          background: #F8FAFC;
        }

        .policy-card {
          background: #FFFFFF;
          border-radius: 20px;
          border: 1px solid #E2E8F0;
          padding: 2.75rem;
          box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.04), 0 2px 8px -2px rgba(0, 0, 0, 0.02);
        }

        .policy-card-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2.25rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid #E2E8F0;
        }

        .policy-header-icon-box {
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

        .policy-card-title {
          margin: 0;
          font-size: 1.35rem;
          font-weight: 800;
          color: #0F172A;
          letter-spacing: -0.01em;
        }

        .policy-card-subtitle {
          display: block;
          font-size: 0.82rem;
          color: #64748B;
          margin-top: 0.25rem;
        }

        .policy-sections-list {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .policy-section-item {
          display: flex;
          flex-direction: column;
        }

        .policy-section-title {
          font-size: 1.08rem;
          font-weight: 700;
          color: #1E293B;
          margin: 0 0 0.5rem;
          letter-spacing: -0.01em;
        }

        .policy-section-desc {
          font-size: 0.94rem;
          line-height: 1.75;
          color: #475569;
          margin: 0;
        }

        .policy-contact-box {
          margin-top: 3rem;
          padding: 1.75rem;
          background: #EFF6FF;
          border-radius: 14px;
          border: 1px solid #BFDBFE;
        }

        .policy-contact-heading {
          margin: 0 0 0.45rem;
          font-size: 0.98rem;
          font-weight: 800;
          color: #1D4ED8;
        }

        .policy-contact-subtext {
          margin: 0 0 1rem;
          font-size: 0.86rem;
          color: #1E40AF;
          line-height: 1.6;
        }

        .policy-contact-channels {
          display: flex;
          flex-wrap: wrap;
          gap: 1.25rem;
        }

        .policy-contact-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          color: #1D4ED8;
          font-weight: 600;
          font-size: 0.86rem;
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
          .policy-content-section {
            padding: 2rem 0 3.5rem;
          }
          .policy-card {
            padding: 1.5rem 1.25rem;
            border-radius: 16px;
          }
          .policy-card-title {
            font-size: 1.12rem;
          }
          .policy-section-title {
            font-size: 0.98rem;
          }
          .policy-section-desc {
            font-size: 0.88rem;
            line-height: 1.65;
          }
          .policy-contact-box {
            padding: 1.25rem;
            margin-top: 2rem;
          }
          .policy-contact-channels {
            flex-direction: column;
            gap: 0.65rem;
          }
        }
      `}</style>
    </div>
  );
}
