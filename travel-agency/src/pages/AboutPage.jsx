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
  Award, 
  Users, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  Car, 
  Phone, 
  ArrowRight,
  Sparkles,
  HeartHandshake
} from 'lucide-react';

export function AboutPage() {
  usePageSeo(
    'about',
    'About AJ Travels | Car Rental & Outstation Cab Service in Pune',
    'Discover AJ Travels, Pune’s trusted agency for chauffeur-driven car rental, intercity outstation cabs, and group Tempo Traveller rentals with transparent pricing.',
    'https://ajtravelspune.com/about-us/'
  );

  const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);

  const pillars = [
    {
      icon: ShieldCheck,
      title: 'Safety First Philosophy',
      desc: 'All vehicles undergo daily multi-point mechanical inspections. GPS tracking and SOS emergency support ensure 100% peace of mind on every highway trip.'
    },
    {
      icon: Clock,
      title: 'Punctual Doorstep Arrival',
      desc: 'Our chauffeurs arrive 10 to 15 minutes ahead of scheduled time. With flight tracking, airport drop-offs and pickups run with surgical precision.'
    },
    {
      icon: Award,
      title: 'Verified Professional Chauffeurs',
      desc: 'Polite, background-verified highway drivers trained in courteous client communication, defensive driving, and optimal route selection.'
    },
    {
      icon: HeartHandshake,
      title: '100% All-Inclusive Transparency',
      desc: 'Zero hidden surprises. Our quotes include expressway tolls, state entry taxes, and driver allowances. You pay only what was agreed.'
    }
  ];

  const milestones = [
    { number: 'Verified', label: 'Commercial Licensed Fleet' },
    { number: '100%', label: 'Doorstep Pickup Across Pune' },
    { number: 'All-Inclusive', label: 'Tolls & State Taxes Covered' },
    { number: '24/7', label: 'Dedicated Travel Desk' }
  ];

  return (
    <div className="about-page-wrapper">
      <Header onOpenEnquiry={() => setIsEnquiryOpen(true)} isDark={false} />

      {/* Page Hero Header */}
      <section className="internal-hero-section">
        <div className="container">
          <div className="breadcrumbs-nav">
            <Link to="/">Home</Link>
            <span className="bc-sep">/</span>
            <span className="bc-current">About Us</span>
          </div>

          <div className="internal-hero-content">
            <div className="hero-badge-pill">
              <Sparkles size={14} />
              <span>THE AJ TRAVELS PROMISE</span>
            </div>
            <h1 className="internal-hero-title">
              Setting the Standard in <span className="text-gradient">Chauffeured Intercity Travel</span>
            </h1>
            <p className="internal-hero-subtitle">
              From our operational headquarters in Pune to executive destinations across Mumbai and Maharashtra, AJ Travels connects people, businesses, and families with comfort, safety, and unwavering reliability.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Counter Bar */}
      <section className="stats-counter-strip">
        <div className="container">
          <div className="stats-grid">
            {milestones.map((m, idx) => (
              <div key={idx} className="stat-card">
                <span className="stat-number">{m.number}</span>
                <span className="stat-label">{m.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Company Story & Mission */}
      <section className="content-section bg-white">
        <div className="container">
          <div className="story-2col-grid">
            <div className="story-text-col">
              <span className="section-eyebrow">OUR STORY & VISION</span>
              <h2 className="section-title">A Travel Service Built Around Respect for Your Time</h2>
              <p className="lead-paragraph">
                AJ Travels was founded to address a persistent frustration shared by frequent highway commuters: the unpredictability of intercity cabs, sudden cancellations, unmaintained cars, and surprise surcharges.
              </p>
              <p className="body-paragraph">
                We set out to build an executive-grade transport network that honors your schedule. Whether an early morning flight from Mumbai International Airport (BOM), a critical corporate presentation in BKC, or a weekend family holiday to Mahabaleshwar, our mission is simple: provide immaculate vehicles, skilled drivers, and a stress-free travel experience.
              </p>
              <div className="story-checklist">
                <div className="story-check-item">
                  <CheckCircle2 size={18} color="#2563EB" />
                  <span>Doorstep pickup across all Pune and Mumbai municipal sectors</span>
                </div>
                <div className="story-check-item">
                  <CheckCircle2 size={18} color="#2563EB" />
                  <span>Dedicated corporate accounts and instant GST invoicing</span>
                </div>
                <div className="story-check-item">
                  <CheckCircle2 size={18} color="#2563EB" />
                  <span>Comprehensive fleet: Sedans, Ertiga SUVs, Innova Crysta & Tempo Travellers</span>
                </div>
              </div>
            </div>

            <div className="story-image-col">
              <div className="story-image-card">
                <img 
                  src="/assets/pune-to-mumbai-premium-travel-banner.webp" 
                  alt="AJ Travels Executive Fleet" 
                  className="story-banner-img"
                  loading="lazy"
                />
                <div className="story-image-overlay-box">
                  <div className="overlay-badge">
                    <ShieldCheck size={20} color="#2563EB" />
                    <div>
                      <strong>Verified Fleet</strong>
                      <span>Fully Licensed & Insured</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Operational Pillars */}
      <section className="content-section bg-light-neutral">
        <div className="container">
          <div className="section-header-center">
            <span className="section-eyebrow">WHY TRAVEL WITH US</span>
            <h2 className="section-title">The Four Pillars of Our Service</h2>
            <p className="section-subtitle">
              Every trip booked with AJ Travels is governed by our strict service-level commitments.
            </p>
          </div>

          <div className="pillars-grid">
            {pillars.map((p, idx) => {
              const Icon = p.icon;
              return (
                <div key={idx} className="pillar-card">
                  <div className="pillar-icon-box">
                    <Icon size={24} color="#2563EB" />
                  </div>
                  <h3 className="pillar-title">{p.title}</h3>
                  <p className="pillar-desc">{p.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Operating Hubs & Credentials */}
      <section className="content-section bg-white">
        <div className="container">
          <div className="hubs-card">
            <div className="hubs-grid">
              <div className="hub-info">
                <span className="section-eyebrow">HEADQUARTERS & SERVICE HUBS</span>
                <h3 className="hubs-title">Strategic Bases in Pune & Mumbai</h3>
                <p className="hubs-desc">
                  With vehicles stationed across West Pune (Hinjawadi, Wakad, Baner, Kothrud), East Pune (Viman Nagar, Kharadi, Hadapsar), and key transit points in Navi Mumbai and Mumbai Airport, our average dispatch time is under 45 minutes.
                </p>
                <div className="hub-address-block">
                  <MapPin size={18} color="#2563EB" />
                  <div>
                    <strong>Primary Operational Desk:</strong>
                    <span>{businessConfig.address}</span>
                  </div>
                </div>
              </div>

              <div className="hub-action-box">
                <h4>Ready to Plan Your Next Journey?</h4>
                <p>Calculate your exact fare online with zero obligation, or speak directly with our 24/7 travel desk.</p>
                <div className="hub-action-btns">
                  <Link to="/booking" className="btn-primary-action">
                    <Car size={18} />
                    <span>Book a Cab Online</span>
                  </Link>
                  <Link to="/fare" className="btn-secondary-action">
                    <span>Calculate Fare</span>
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <MobileStickyBar onOpenEnquiry={() => setIsEnquiryOpen(true)} />
      <EnquiryModal isOpen={isEnquiryOpen} onClose={() => setIsEnquiryOpen(false)} />

      <style>{`
        .about-page-wrapper {
          min-height: 100vh;
          background-color: #FFFFFF;
          color: #0F172A;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .internal-hero-section {
          background: linear-gradient(180deg, #F8FAFC 0%, #EFF6FF 100%);
          padding: 2.25rem 0 1.5rem;
          border-bottom: 1px solid #E2E8F0;
        }

        .breadcrumbs-nav {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          color: #64748B;
          margin-bottom: 0.85rem;
        }

        .breadcrumbs-nav a {
          color: #2563EB;
          text-decoration: none;
          font-weight: 500;
        }

        .breadcrumbs-nav a:hover {
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
          font-size: 2.2rem;
          font-weight: 800;
          line-height: 1.2;
          color: #0F172A;
          max-width: 820px;
          margin-bottom: 0.75rem;
        }

        .text-gradient {
          background: linear-gradient(135deg, #1D4ED8 0%, #0284C7 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .internal-hero-subtitle {
          font-size: 1rem;
          line-height: 1.6;
          color: #475569;
          max-width: 760px;
        }

        /* Stats Counter Strip */
        .stats-counter-strip {
          background: #FFFFFF;
          padding: 1.5rem 0;
          border-bottom: 1px solid #E2E8F0;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.25rem;
        }

        .stat-card {
          text-align: center;
          padding: 1rem;
          border-radius: 12px;
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
        }

        .stat-number {
          display: block;
          font-size: 2.1rem;
          font-weight: 800;
          color: #1D4ED8;
          line-height: 1.1;
          margin-bottom: 0.35rem;
        }

        .stat-label {
          font-size: 0.82rem;
          font-weight: 600;
          color: #64748B;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        /* Content Sections */
        .content-section {
          padding: 3rem 0;
        }

        .bg-light-neutral {
          background-color: #F8FAFC;
        }

        .story-2col-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 3.5rem;
          align-items: center;
        }

        .section-eyebrow {
          display: block;
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: #2563EB;
          margin-bottom: 0.6rem;
        }

        .section-title {
          font-size: 2.1rem;
          font-weight: 800;
          color: #0F172A;
          line-height: 1.25;
          margin-bottom: 1.25rem;
        }

        .lead-paragraph {
          font-size: 1.05rem;
          line-height: 1.7;
          color: #334155;
          margin-bottom: 1rem;
          font-weight: 500;
        }

        .body-paragraph {
          font-size: 0.95rem;
          line-height: 1.65;
          color: #64748B;
          margin-bottom: 1.75rem;
        }

        .story-checklist {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }

        .story-check-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.92rem;
          font-weight: 600;
          color: #1E293B;
        }

        .story-image-card {
          position: relative;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 16px 36px rgba(15, 23, 42, 0.1);
          border: 1px solid #E2E8F0;
        }

        .story-banner-img {
          width: 100%;
          height: 380px;
          object-fit: cover;
          display: block;
        }

        .story-image-overlay-box {
          position: absolute;
          bottom: 1.25rem;
          left: 1.25rem;
          right: 1.25rem;
        }

        .overlay-badge {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(8px);
          padding: 0.85rem 1.25rem;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 0.85rem;
          border: 1px solid rgba(226, 232, 240, 0.8);
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
        }

        .overlay-badge strong {
          display: block;
          font-size: 0.92rem;
          color: #0F172A;
        }

        .overlay-badge span {
          display: block;
          font-size: 0.75rem;
          color: #64748B;
        }

        /* Pillars Section */
        .section-header-center {
          text-align: center;
          max-width: 650px;
          margin: 0 auto 3rem;
        }

        .section-subtitle {
          font-size: 1rem;
          color: #64748B;
          line-height: 1.6;
        }

        .pillars-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.5rem;
        }

        .pillar-card {
          background: #FFFFFF;
          padding: 2rem 1.5rem;
          border-radius: 18px;
          border: 1px solid #E2E8F0;
          transition: all 0.3s ease;
        }

        .pillar-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 28px rgba(37, 99, 235, 0.08);
          border-color: #BFDBFE;
        }

        .pillar-icon-box {
          width: 52px;
          height: 52px;
          border-radius: 12px;
          background: #EFF6FF;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.25rem;
        }

        .pillar-title {
          font-size: 1.15rem;
          font-weight: 700;
          color: #0F172A;
          margin-bottom: 0.65rem;
        }

        .pillar-desc {
          font-size: 0.88rem;
          line-height: 1.6;
          color: #64748B;
        }

        /* Hubs Card */
        .hubs-card {
          background: #F8FAFC;
          border-radius: 24px;
          padding: 3rem;
          border: 1.5px solid #E2E8F0;
        }

        .hubs-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 3rem;
          align-items: center;
        }

        .hubs-title {
          font-size: 1.6rem;
          font-weight: 800;
          color: #0F172A;
          margin-bottom: 0.85rem;
        }

        .hubs-desc {
          font-size: 0.95rem;
          line-height: 1.65;
          color: #64748B;
          margin-bottom: 1.5rem;
        }

        .hub-address-block {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
          padding: 1rem;
          background: #FFFFFF;
          border-radius: 12px;
          border: 1px solid #E2E8F0;
        }

        .hub-address-block strong {
          display: block;
          font-size: 0.85rem;
          color: #0F172A;
          margin-bottom: 0.15rem;
        }

        .hub-address-block span {
          font-size: 0.82rem;
          color: #64748B;
        }

        .hub-action-box {
          background: #FFFFFF;
          padding: 2rem;
          border-radius: 18px;
          border: 1px solid #CBD5E1;
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.05);
        }

        .hub-action-box h4 {
          font-size: 1.25rem;
          font-weight: 800;
          color: #0F172A;
          margin-bottom: 0.5rem;
        }

        .hub-action-box p {
          font-size: 0.88rem;
          color: #64748B;
          line-height: 1.55;
          margin-bottom: 1.5rem;
        }

        .hub-action-btns {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .btn-primary-action {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: linear-gradient(135deg, #1D4ED8 0%, #1E40AF 100%);
          color: #FFFFFF;
          font-weight: 700;
          font-size: 0.88rem;
          padding: 0.75rem 1.35rem;
          border-radius: 10px;
          text-decoration: none;
          box-shadow: 0 4px 12px rgba(29, 78, 216, 0.25);
          transition: all 0.2s ease;
        }

        .btn-primary-action:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(29, 78, 216, 0.35);
        }

        .btn-secondary-action {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: #EFF6FF;
          color: #1D4ED8;
          font-weight: 700;
          font-size: 0.88rem;
          padding: 0.75rem 1.25rem;
          border-radius: 10px;
          text-decoration: none;
          border: 1px solid #BFDBFE;
          transition: all 0.2s ease;
        }

        .btn-secondary-action:hover {
          background: #DBEAFE;
        }

        @media (max-width: 991px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .story-2col-grid,
          .hubs-grid {
            grid-template-columns: 1fr;
            gap: 2rem;
          }
          .pillars-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .internal-hero-title {
            font-size: 1.85rem;
          }
          .stats-grid,
          .pillars-grid {
            grid-template-columns: 1fr;
          }
          .hubs-card {
            padding: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}
