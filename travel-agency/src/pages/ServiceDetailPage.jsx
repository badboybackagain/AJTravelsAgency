import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { EnquiryModal } from '../components/EnquiryModal';
import { MobileStickyBar } from '../components/MobileStickyBar';
import { usePageSeo } from '../hooks/usePageSeo';
import { getServiceBySlug, servicesData } from '../data/servicesData';
import { vehicleApi } from '../services/api';
import { 
  Navigation, 
  Clock, 
  MapPin, 
  Car, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  HelpCircle, 
  Users 
} from 'lucide-react';

export function ServiceDetailPage() {
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);
  const [dbVehicles, setDbVehicles] = useState([]);

  const cleanPathSlug = location.pathname.replace(/^\/|\/$/g, '').replace(/^services\//, '');
  const activeSlug = slug || cleanPathSlug;
  const service = getServiceBySlug(activeSlug);

  useEffect(() => {
    let isMounted = true;
    vehicleApi
      .getAll()
      .then((res) => {
        if (isMounted && res.data?.data) {
          setDbVehicles(res.data.data);
        }
      })
      .catch((err) => {
        console.warn('ServiceDetailPage: Failed to load dynamic fleet fares:', err?.message);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const sedanMatch = dbVehicles.find((v) => v.category === 'SEDAN');
  const suvMatch = dbVehicles.find((v) => v.category === 'SUV' || v.category === 'ERTIGA');
  const crystaMatch = dbVehicles.find((v) => v.category === 'LUXURY' || v.category === 'INNOVA_CRYSTA');

  const sedanFare = sedanMatch?.startingBaseFare ? `₹${sedanMatch.startingBaseFare.toLocaleString()}` : '₹2,300';
  const suvFare = suvMatch?.startingBaseFare ? `₹${suvMatch.startingBaseFare.toLocaleString()}` : '₹3,199';
  const crystaFare = crystaMatch?.startingBaseFare ? `₹${crystaMatch.startingBaseFare.toLocaleString()}` : '₹4,899';

  const canonicalUrl = service
    ? (service.slug.endsWith('-taxi') ? `https://ajtravelsagency.vercel.app/${service.slug}/` : `https://ajtravelsagency.vercel.app/services/${service.slug}`)
    : undefined;

  usePageSeo(
    service ? `service_${service.slug}` : 'service_not_found',
    service ? service.metaTitle : 'Corridor Service Not Found | AJ Travels',
    service ? service.metaDesc : 'Chauffeured intercity corridor travel service from AJ Travels.',
    canonicalUrl
  );

  if (!service) {
    return (
      <div className="svc-detail-wrapper">
        <Header onOpenEnquiry={() => setIsEnquiryOpen(true)} isDark={false} />
        <div className="container" style={{ padding: '6rem 1rem', textAlign: 'center' }}>
          <h2>Corridor Service Not Found</h2>
          <p style={{ color: '#64748B', margin: '1rem 0 2rem' }}>The requested transportation corridor was not found.</p>
          <Link to="/services" className="btn-back-link">
            <ArrowLeft size={16} />
            <span>Return to All Services</span>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const handleBookNow = () => {
    const pId = service.pickupDefault || 'pune';
    const dId = service.dropDefault || 'mumbai';
    const pName = pId === 'mumbai' ? 'Mumbai (All Areas)' : (pId === 'hinjawadi' ? 'Hinjawadi, Pune' : 'Pune (All Areas)');
    const dName = dId === 'pune' ? 'Pune (All Areas)' : (dId === 'mumbai airport' ? 'Mumbai Airport (BOM - T1/T2)' : (dId === 'mahabaleshwar' ? 'Mahabaleshwar' : (dId === 'bkc' ? 'BKC (Bandra Kurla)' : 'Mumbai (All Areas)')));

    const params = new URLSearchParams({
      tripType: 'ONE_WAY',
      pickupId: pId,
      dropId: dId,
      pickupName: pName,
      dropName: dName
    });
    navigate(`/fare?${params.toString()}`);
  };

  return (
    <div className="svc-detail-wrapper">
      <Header onOpenEnquiry={() => setIsEnquiryOpen(true)} isDark={false} />

      {/* Breadcrumbs Strip */}
      <section className="svc-breadcrumbs-strip">
        <div className="container">
          <div className="breadcrumbs-nav">
            <Link to="/">Home</Link>
            <span className="bc-sep">/</span>
            <Link to="/services">Services</Link>
            <span className="bc-sep">/</span>
            <span className="bc-current">{service.title}</span>
          </div>
        </div>
      </section>

      {/* Service Hero */}
      <section className="svc-hero-section">
        <div className="container">
          <div className="svc-hero-grid">
            <div className="svc-hero-content">
              <span className="svc-badge-tag">{service.badge}</span>
              <h1 className="svc-hero-title">{service.title}</h1>
              <p className="svc-hero-tagline">{service.tagline}</p>

              <div className="svc-stats-chips-row">
                <div className="chip-box">
                  <Navigation size={15} color="#2563EB" />
                  <div>
                    <span className="chip-lbl">TOTAL DISTANCE</span>
                    <strong>{service.distance}</strong>
                  </div>
                </div>
                <div className="chip-box">
                  <Clock size={15} color="#2563EB" />
                  <div>
                    <span className="chip-lbl">DRIVING TIME</span>
                    <strong>{service.duration}</strong>
                  </div>
                </div>
                <div className="chip-box">
                  <MapPin size={15} color="#2563EB" />
                  <div>
                    <span className="chip-lbl">CORRIDOR ROUTE</span>
                    <strong>{service.route}</strong>
                  </div>
                </div>
              </div>

              <div className="svc-hero-cta-row">
                <button 
                  type="button" 
                  onClick={handleBookNow}
                  className="btn-book-now-solid"
                >
                  <Car size={18} />
                  <span>Calculate Fare & Book</span>
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsEnquiryOpen(true)}
                  className="btn-custom-inquiry"
                >
                  <span>Request Custom Quote</span>
                </button>
              </div>
            </div>

            <div className="svc-hero-image-box">
              <img 
                src={service.heroImg} 
                alt={service.title} 
                className="svc-hero-cover-photo" 
              />
              <div className="svc-image-badge-glass">
                <ShieldCheck size={18} color="#10B981" />
                <span>100% Tolls Included in One-Way Fares</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* In-Depth Overview & Highlights */}
      <section className="svc-detail-content-section">
        <div className="container">
          <div className="svc-content-2col-grid">
            {/* Left Main Overview Column */}
            <div className="svc-main-col">
              <div className="content-card">
                <span className="section-eyebrow">ROUTE INTELLIGENCE & ADVICE</span>
                <h2 className="content-card-title">Corridor Overview</h2>
                <p className="lead-text">{service.overview}</p>

                <h3 className="subsection-title">Key Advantages of this Service</h3>
                <div className="highlights-grid">
                  {service.highlights.map((h, idx) => {
                    const hasColon = h.includes(':');
                    const title = hasColon ? h.split(':')[0].trim() : h;
                    const desc = hasColon ? h.split(':').slice(1).join(':').trim() : '';
                    return (
                      <div key={idx} className="highlight-pill">
                        <CheckCircle2 size={16} color="#10B981" className="hl-icon" />
                        <div className="hl-text-wrap">
                          <strong className="hl-title">{title}</strong>
                          {desc && <span className="hl-desc">{desc}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {service.popularStops && service.popularStops.length > 0 && (
                  <div className="stops-box">
                    <h4 className="stops-title">Recommended Highway Stops</h4>
                    <ul className="stops-list">
                      {service.popularStops.map((stop, i) => (
                        <li key={i}>{stop}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Contextual Link between Taxi & Cab Service Pages */}
                {service.contextualLink && (
                  <div className="svc-context-link-box">
                    <Navigation size={18} color="#2563EB" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <span className="svc-context-desc">{service.contextualLink.text}</span>
                      <Link to={service.contextualLink.url} className="svc-context-anchor">
                        <span>{service.contextualLink.linkText}</span>
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Booking & Fleet Selection Sidebar (Sticky on Desktop) */}
            <div className="svc-sidebar-col">
              <div className="sidebar-booking-card">
                <span className="sb-badge">INSTANT BOOKING</span>
                <h3>Book {service.title}</h3>
                <p>Choose your preferred car category and get instant pricing with tolls included.</p>

                <div className="sidebar-vehicles-list">
                  <div className="sb-vehicle-row">
                    <Car size={16} color="#2563EB" />
                    <div>
                      <strong>Executive Sedan</strong>
                      <span>4 Seater • Dzire / Etios</span>
                    </div>
                    <span className="sb-from-rate">From {sedanFare}*</span>
                  </div>

                  <div className="sb-vehicle-row">
                    <Users size={16} color="#2563EB" />
                    <div>
                      <strong>Family SUV</strong>
                      <span>6 Seater • Maruti Ertiga</span>
                    </div>
                    <span className="sb-from-rate">From {suvFare}*</span>
                  </div>

                  <div className="sb-vehicle-row">
                    <Sparkles size={16} color="#2563EB" />
                    <div>
                      <strong>Innova Crysta</strong>
                      <span>6-7 Seater • Luxury Captain</span>
                    </div>
                    <span className="sb-from-rate">From {crystaFare}*</span>
                  </div>
                </div>

                <button 
                  type="button" 
                  onClick={handleBookNow} 
                  className="btn-sidebar-book"
                >
                  <span>Open Fare Calculator</span>
                  <ArrowRight size={16} />
                </button>
              </div>

              {/* Other Corridors */}
              <div className="sidebar-other-corridors">
                <h4>Other Popular Corridors</h4>
                <div className="other-corridors-list">
                  {servicesData
                    .filter(s => s.slug !== service.slug)
                    .map(s => (
                      <Link key={s.slug} to={s.slug.endsWith('-taxi') ? `/${s.slug}` : `/services/${s.slug}`} className="other-corridor-item">
                        <span>{s.title}</span>
                        <ArrowRight size={14} />
                      </Link>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Full-Width Balanced FAQs Section */}
      {service.faqs && service.faqs.length > 0 && (
        <section className="svc-faqs-section">
          <div className="container">
            <div className="faq-section-header">
              <div className="faq-badge-pill">
                <HelpCircle size={15} color="#2563EB" />
                <span>ROUTE INTEL & POLICIES</span>
              </div>
              <h2 className="faq-main-title">Frequently Asked Questions</h2>
              <p className="faq-main-subtitle">
                Clear answers regarding expressway tolls, timing, driver allowances, and fleet options for your journey.
              </p>
            </div>
            <div className={`faq-grid ${service.faqs.length === 1 ? 'faq-grid-single' : 'faq-grid-2col'}`}>
              {service.faqs.map((f, i) => (
                <div key={i} className="faq-card-box">
                  <h3 className="faq-q-title">{f.q}</h3>
                  <p className="faq-a-desc">{f.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Route Bottom CTA Strip */}
      <section className="svc-bottom-cta-strip">
        <div className="container">
          <div className="svc-bottom-cta-card">
            <div className="cta-left-text">
              <h3>Ready to Book Your {service.title}?</h3>
              <p>100% Toll-Inclusive Pricing • Verified Highway Chauffeurs • Doorstep Pickup Across Pune & PCMC</p>
            </div>
            <div className="cta-right-actions">
              <button type="button" onClick={handleBookNow} className="btn-cta-calculate">
                <Car size={16} />
                <span>Calculate Fare & Book</span>
              </button>
              <button type="button" onClick={() => setIsEnquiryOpen(true)} className="btn-cta-enquire">
                <span>Request Custom Quote</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <MobileStickyBar onOpenEnquiry={() => setIsEnquiryOpen(true)} />
      <EnquiryModal isOpen={isEnquiryOpen} onClose={() => setIsEnquiryOpen(false)} />

      <style>{`
        .svc-detail-wrapper {
          min-height: 100vh;
          background: #FFFFFF;
          color: #0F172A;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .svc-breadcrumbs-strip {
          background: #F8FAFC;
          border-bottom: 1px solid #E2E8F0;
          padding: 7rem 0 1.25rem;
        }

        .breadcrumbs-nav {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          color: #64748B;
        }

        .breadcrumbs-nav a { color: #2563EB; text-decoration: none; font-weight: 500; }
        .bc-sep { color: #94A3B8; }
        .bc-current { color: #0F172A; font-weight: 600; }

        .svc-hero-section {
          background: linear-gradient(180deg, #F8FAFC 0%, #EFF6FF 100%);
          padding: 2.25rem 0 2rem;
          border-bottom: 1px solid #E2E8F0;
        }

        .svc-hero-grid {
          display: grid;
          grid-template-columns: 1.25fr 1fr;
          gap: 2.5rem;
          align-items: stretch;
        }

        .svc-hero-content {
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .svc-badge-tag {
          display: inline-block;
          background: rgba(37, 99, 235, 0.12);
          color: #2563EB;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          padding: 0.35rem 0.8rem;
          border-radius: 9999px;
          margin-bottom: 0.85rem;
          align-self: flex-start;
        }

        .svc-hero-title {
          font-size: 2.25rem;
          font-weight: 800;
          line-height: 1.25;
          color: #0F172A;
          margin-bottom: 0.65rem;
        }

        .svc-hero-tagline {
          font-size: 1.05rem;
          line-height: 1.55;
          color: #475569;
          margin-bottom: 1.5rem;
        }

        .svc-stats-chips-row {
          display: flex;
          gap: 0.65rem;
          margin-bottom: 1.75rem;
          flex-wrap: nowrap;
          align-items: stretch;
        }

        .chip-box {
          background: #FFFFFF;
          border: 1px solid #CBD5E1;
          border-radius: 12px;
          padding: 0.65rem 0.85rem;
          display: flex;
          align-items: center;
          gap: 0.6rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
          flex: 0 0 auto;
        }

        .chip-box:last-child {
          flex: 1 1 auto;
          min-width: 0;
        }

        .chip-lbl {
          display: block;
          font-size: 0.62rem;
          font-weight: 800;
          letter-spacing: 0.06em;
          color: #94A3B8;
        }

        .chip-box strong {
          display: block;
          font-size: 0.82rem;
          color: #0F172A;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .svc-hero-cta-row {
          display: flex;
          gap: 0.85rem;
          flex-wrap: wrap;
        }

        .btn-book-now-solid {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: linear-gradient(135deg, #1D4ED8 0%, #1E40AF 100%);
          color: #FFFFFF;
          font-weight: 700;
          font-size: 0.95rem;
          padding: 0.85rem 1.5rem;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(29, 78, 216, 0.3);
          transition: all 0.2s ease;
        }

        .btn-book-now-solid:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(29, 78, 216, 0.4);
        }

        .btn-custom-inquiry {
          display: inline-flex;
          align-items: center;
          background: #FFFFFF;
          color: #1D4ED8;
          font-weight: 700;
          font-size: 0.95rem;
          padding: 0.85rem 1.35rem;
          border-radius: 12px;
          border: 1.5px solid #BFDBFE;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-custom-inquiry:hover {
          background: #EFF6FF;
        }

        .svc-hero-image-box {
          position: relative;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 16px 36px rgba(15, 23, 42, 0.1);
          border: 1px solid #CBD5E1;
          height: 100%;
          min-height: 340px;
          display: flex;
          flex-direction: column;
        }

        .svc-hero-cover-photo {
          width: 100%;
          height: 100%;
          min-height: 340px;
          object-fit: cover;
          display: block;
          flex: 1;
        }

        .svc-image-badge-glass {
          position: absolute;
          bottom: 1.25rem;
          left: 1.25rem;
          right: 1.25rem;
          background: rgba(15, 23, 42, 0.85);
          backdrop-filter: blur(8px);
          color: #FFFFFF;
          padding: 0.75rem 1rem;
          border-radius: 10px;
          font-size: 0.85rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }

        /* Detail Content */
        .svc-detail-content-section {
          padding: 2.25rem 0 4rem;
          background: #F8FAFC;
        }

        .svc-content-2col-grid {
          display: grid;
          grid-template-columns: 1.35fr 1fr;
          gap: 2.25rem;
          align-items: flex-start;
        }

        .svc-sidebar-col {
          position: sticky;
          top: 6.5rem;
          align-self: flex-start;
        }

        .content-card {
          background: #FFFFFF;
          border-radius: 20px;
          padding: 2.5rem;
          border: 1px solid #E2E8F0;
          box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
        }

        .section-eyebrow {
          display: block;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: #2563EB;
          margin-bottom: 0.5rem;
        }

        .content-card-title {
          font-size: 1.85rem;
          font-weight: 800;
          color: #0F172A;
          margin-bottom: 1.25rem;
        }

        .lead-text {
          font-size: 1.05rem;
          line-height: 1.75;
          color: #334155;
          margin-bottom: 2rem;
        }

        .subsection-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #0F172A;
          margin-bottom: 1.1rem;
        }

        .highlights-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0.85rem;
          margin-bottom: 2rem;
        }

        .highlight-pill {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          padding: 0.85rem 1.15rem;
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
        }

        .hl-icon {
          flex-shrink: 0;
          margin-top: 3px;
        }

        .hl-text-wrap {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }

        .hl-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: #0F172A;
          line-height: 1.35;
        }

        .hl-desc {
          font-size: 0.86rem;
          color: #64748B;
          line-height: 1.5;
        }

        .stops-box {
          background: #EFF6FF;
          border: 1px solid #BFDBFE;
          border-radius: 12px;
          padding: 1.25rem 1.5rem;
        }

        .stops-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: #1E3A8A;
          margin-bottom: 0.65rem;
        }

        .stops-list {
          padding-left: 1.25rem;
          margin: 0;
          color: #334155;
          font-size: 0.88rem;
          line-height: 1.6;
        }

        .svc-context-link-box {
          margin-top: 1.5rem;
          background: #EFF6FF;
          border: 1px solid #BFDBFE;
          border-radius: 12px;
          padding: 1rem 1.25rem;
          display: flex;
          align-items: flex-start;
          gap: 0.85rem;
        }

        .svc-context-desc {
          display: block;
          font-size: 0.86rem;
          color: #1E3A8A;
          margin-bottom: 0.35rem;
          font-weight: 500;
          line-height: 1.5;
        }

        .svc-context-anchor {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          color: #2563EB;
          font-weight: 700;
          font-size: 0.88rem;
          text-decoration: none;
        }

        .svc-context-anchor:hover {
          color: #1D4ED8;
          text-decoration: underline;
        }

        /* Full-Width FAQs Section */
        .svc-faqs-section {
          padding: 3.5rem 0 1.25rem;
          background: #FFFFFF;
          border-top: 1px solid #E2E8F0;
        }

        .faq-section-header {
          text-align: center;
          max-width: 720px;
          margin: 0 auto 2.5rem;
        }

        .faq-badge-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          background: #EFF6FF;
          color: #2563EB;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          padding: 0.35rem 0.85rem;
          border-radius: 9999px;
          margin-bottom: 0.85rem;
        }

        .faq-main-title {
          font-size: 2rem;
          font-weight: 800;
          color: #0F172A;
          margin-bottom: 0.5rem;
          line-height: 1.25;
        }

        .faq-main-subtitle {
          font-size: 0.95rem;
          color: #64748B;
          line-height: 1.6;
        }

        .faq-grid-2col {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.25rem;
        }

        .faq-grid-single {
          display: flex;
          justify-content: center;
          max-width: 780px;
          margin: 0 auto;
          width: 100%;
        }

        .faq-grid-single .faq-card-box {
          width: 100%;
        }

        .faq-card-box {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 14px;
          padding: 1.5rem 1.65rem;
          transition: all 0.2s ease;
        }

        .faq-card-box:hover {
          border-color: #BFDBFE;
          box-shadow: 0 4px 16px rgba(37, 99, 235, 0.06);
        }

        .faq-q-title {
          font-size: 1.05rem;
          font-weight: 700;
          color: #0F172A;
          margin-bottom: 0.65rem;
          line-height: 1.4;
        }

        .faq-a-desc {
          font-size: 0.9rem;
          color: #475569;
          line-height: 1.6;
          margin: 0;
        }

        /* Route Bottom CTA Strip — Distinct Floating Rectangular Card Separating from Footer */
        .svc-bottom-cta-strip {
          background: #FFFFFF;
          padding: 0.75rem 0 2.5rem;
        }

        .svc-bottom-cta-card {
          background: #0F172A;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 18px;
          padding: 2.25rem 3rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 2.5rem;
          box-shadow: 0 16px 36px -8px rgba(15, 23, 42, 0.20);
          position: relative;
          overflow: hidden;
        }



        .cta-left-text h3 {
          font-size: 1.65rem;
          font-weight: 800;
          color: #FFFFFF;
          margin-bottom: 0.35rem;
        }

        .cta-left-text p {
          font-size: 0.92rem;
          color: #94A3B8;
          margin: 0;
        }

        .cta-right-actions {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          flex-wrap: wrap;
          position: relative;
          z-index: 2;
        }

        .btn-cta-calculate {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
          color: #FFFFFF;
          font-weight: 700;
          font-size: 0.92rem;
          padding: 0.85rem 1.5rem;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
          transition: all 0.2s ease;
        }

        .btn-cta-calculate:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(37, 99, 235, 0.45);
        }

        .btn-cta-enquire {
          display: inline-flex;
          align-items: center;
          background: rgba(255, 255, 255, 0.1);
          color: #FFFFFF;
          font-weight: 700;
          font-size: 0.92rem;
          padding: 0.85rem 1.4rem;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-cta-enquire:hover {
          background: rgba(255, 255, 255, 0.18);
        }
          font-size: 0.92rem;
          padding: 0.85rem 1.4rem;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-cta-enquire:hover {
          background: rgba(255, 255, 255, 0.18);
        }

        /* Sidebar */
        .sidebar-booking-card {
          background: #FFFFFF;
          border-radius: 20px;
          padding: 2.25rem;
          border: 1.5px solid #CBD5E1;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
          margin-bottom: 2rem;
        }

        .sb-badge {
          display: inline-block;
          background: #EFF6FF;
          color: #2563EB;
          font-size: 0.7rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          padding: 0.25rem 0.65rem;
          border-radius: 9999px;
          margin-bottom: 0.65rem;
        }

        .sidebar-booking-card h3 {
          font-size: 1.4rem;
          font-weight: 800;
          color: #0F172A;
          margin-bottom: 0.35rem;
        }

        .sidebar-booking-card p {
          font-size: 0.88rem;
          color: #64748B;
          margin-bottom: 1.5rem;
        }

        .sidebar-vehicles-list {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
          margin-bottom: 1.75rem;
        }

        .sb-vehicle-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: #F8FAFC;
          border-radius: 10px;
          border: 1px solid #E2E8F0;
        }

        .sb-vehicle-row strong {
          display: block;
          font-size: 0.85rem;
          color: #0F172A;
        }

        .sb-vehicle-row span {
          display: block;
          font-size: 0.75rem;
          color: #64748B;
        }

        .sb-from-rate {
          margin-left: auto;
          font-size: 0.82rem !important;
          font-weight: 700;
          color: #10B981 !important;
        }

        .btn-sidebar-book {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          background: linear-gradient(135deg, #1D4ED8 0%, #1E40AF 100%);
          color: #FFFFFF;
          font-weight: 700;
          font-size: 0.92rem;
          padding: 0.85rem;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(29, 78, 216, 0.25);
          transition: all 0.2s ease;
        }

        .btn-sidebar-book:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(29, 78, 216, 0.35);
        }

        .sidebar-other-corridors {
          background: #FFFFFF;
          border-radius: 18px;
          padding: 1.75rem;
          border: 1px solid #E2E8F0;
        }

        .sidebar-other-corridors h4 {
          font-size: 1.05rem;
          font-weight: 700;
          color: #0F172A;
          margin-bottom: 1rem;
        }

        .other-corridors-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .other-corridor-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.65rem 0.75rem;
          border-radius: 8px;
          color: #334155;
          text-decoration: none;
          font-size: 0.85rem;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .other-corridor-item:hover {
          background: #EFF6FF;
          color: #2563EB;
        }

        .btn-back-link {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          color: #2563EB;
          font-weight: 600;
          text-decoration: none;
        }

        @media (max-width: 991px) {
          .svc-hero-grid,
          .svc-content-2col-grid {
            grid-template-columns: 1fr;
          }
          .svc-sidebar-col {
            position: static;
          }
        }

        @media (max-width: 768px) {
          .svc-breadcrumbs-strip {
            padding: 5.8rem 0 0.85rem;
          }
          .svc-hero-section {
            padding: 1.25rem 0 1rem;
          }
          .svc-hero-title {
            font-size: 1.45rem;
            margin-bottom: 0.35rem;
            line-height: 1.25;
          }
          .svc-hero-tagline {
            font-size: 0.82rem;
            margin-bottom: 0.75rem;
          }
          .svc-stats-chips-row {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 0.5rem !important;
            margin-bottom: 0.85rem !important;
            width: 100% !important;
          }
          .chip-box {
            flex: none !important;
            padding: 0.5rem 0.65rem !important;
            gap: 0.45rem !important;
            width: 100% !important;
            box-sizing: border-box !important;
          }
          .chip-box:last-child {
            grid-column: 1 / -1 !important;
            width: 100% !important;
          }
          .chip-lbl {
            font-size: 0.62rem;
          }
          .chip-box strong {
            font-size: 0.78rem;
            white-space: normal !important;
          }
          .svc-hero-cta-row {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 0.5rem !important;
            margin-bottom: 1rem !important;
            width: 100% !important;
          }
          .btn-book-now-solid,
          .btn-custom-inquiry {
            width: 100% !important;
            padding: 0.65rem 0.35rem !important;
            font-size: 0.74rem !important;
            justify-content: center !important;
            text-align: center !important;
            box-sizing: border-box !important;
            white-space: nowrap !important;
          }
          .svc-hero-image-box {
            width: 100% !important;
            max-width: 100% !important;
            height: 180px !important;
            min-height: 180px !important;
            border-radius: 16px !important;
            overflow: hidden !important;
            box-sizing: border-box !important;
          }
          .svc-hero-cover-photo {
            width: 100% !important;
            height: 180px !important;
            min-height: 180px !important;
            object-fit: cover !important;
          }
          .svc-image-badge-glass {
            padding: 0.45rem 0.75rem;
            font-size: 0.75rem;
            bottom: 0.65rem;
            left: 0.65rem;
            right: 0.65rem;
          }
          .svc-detail-content-section {
            padding: 1.25rem 0 2.5rem;
          }
          .content-card {
            padding: 1.15rem 1.1rem;
            border-radius: 14px;
          }
          .content-card-title {
            font-size: 1.25rem;
            margin-bottom: 0.5rem;
          }
          .lead-text {
            font-size: 0.82rem;
            line-height: 1.45;
          }
          .subsection-title {
            font-size: 1.05rem;
            margin-top: 1rem;
            margin-bottom: 0.65rem;
          }
          .highlights-grid {
            grid-template-columns: 1fr;
            gap: 0.45rem;
          }
          /* Hide verbose descriptive lines on mobile — strictly show main points */
          .hl-desc {
            display: none !important;
          }
          .highlight-pill {
            padding: 0.55rem 0.75rem;
            align-items: center;
            border-radius: 10px;
          }
          .hl-icon {
            margin-top: 0;
            width: 14px;
            height: 14px;
          }
          .hl-title {
            font-size: 0.8rem;
            font-weight: 700;
          }
          .sidebar-booking-card {
            padding: 1.1rem 1rem;
            border-radius: 14px;
          }
          .sidebar-booking-card h3 {
            font-size: 1.15rem;
          }
          .svc-faqs-section {
            padding: 2rem 0 0.75rem;
          }
          .faq-section-header {
            margin-bottom: 1.5rem;
          }
          .faq-main-title {
            font-size: 1.4rem;
          }
          .faq-main-subtitle {
            font-size: 0.82rem;
            line-height: 1.45;
          }
          .faq-grid-2col {
            grid-template-columns: 1fr;
            gap: 0.85rem;
          }
          .faq-card-box {
            padding: 1rem 1.15rem;
            border-radius: 12px;
          }
          .faq-q-title {
            font-size: 0.92rem;
            margin-bottom: 0.35rem;
          }
          .faq-a-desc {
            font-size: 0.8rem;
            line-height: 1.45;
          }
          .svc-bottom-cta-strip {
            background: #FFFFFF !important;
            padding: 0.5rem 0 2rem !important;
            border-top: none !important;
          }
          .svc-bottom-cta-card {
            border-radius: 14px !important;
            padding: 1.35rem 1.15rem !important;
            flex-direction: column;
            align-items: stretch !important;
            gap: 1.15rem;
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
          }
          .cta-left-text {
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
          }
          .cta-left-text h3 {
            font-size: 1.25rem;
            word-break: break-word;
          }
          .cta-left-text p {
            font-size: 0.82rem;
          }
          .cta-right-actions {
            width: 100%;
            max-width: 100%;
            box-sizing: border-box;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.5rem;
          }
          .btn-cta-calculate,
          .btn-cta-enquire {
            width: 100%;
            max-width: 100%;
            min-height: 44px;
            height: auto;
            box-sizing: border-box;
            justify-content: center;
            padding: 0.75rem 0.6rem;
            font-size: 0.82rem;
            white-space: normal;
            word-break: break-word;
            text-align: center;
          }
        }

        @media (max-width: 480px) {
          .cta-right-actions {
            grid-template-columns: 1fr;
            gap: 0.65rem;
          }
        }
      `}</style>
    </div>
  );
}
