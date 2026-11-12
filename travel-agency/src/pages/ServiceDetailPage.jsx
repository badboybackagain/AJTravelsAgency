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
                  {service.highlights.map((h, idx) => (
                    <div key={idx} className="highlight-pill">
                      <CheckCircle2 size={16} color="#10B981" />
                      <span>{h}</span>
                    </div>
                  ))}
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

              {/* FAQs */}
              {service.faqs && service.faqs.length > 0 && (
                <div className="content-card" style={{ marginTop: '2rem' }}>
                  <div className="faq-card-head">
                    <HelpCircle size={22} color="#2563EB" />
                    <h3>Frequently Asked Questions</h3>
                  </div>
                  <div className="faq-list">
                    {service.faqs.map((f, i) => (
                      <div key={i} className="faq-item">
                        <h4>{f.q}</h4>
                        <p>{f.a}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Booking & Fleet Selection Sidebar */}
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
          padding: 1.1rem 0;
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
          grid-template-columns: 1.2fr 1fr;
          gap: 2.5rem;
          align-items: center;
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
          margin-bottom: 1rem;
        }

        .svc-hero-title {
          font-size: 2.4rem;
          font-weight: 800;
          line-height: 1.25;
          color: #0F172A;
          margin-bottom: 0.75rem;
        }

        .svc-hero-tagline {
          font-size: 1.1rem;
          line-height: 1.6;
          color: #475569;
          margin-bottom: 1.75rem;
        }

        .svc-stats-chips-row {
          display: flex;
          gap: 1.25rem;
          margin-bottom: 2rem;
          flex-wrap: wrap;
        }

        .chip-box {
          background: #FFFFFF;
          border: 1px solid #CBD5E1;
          border-radius: 12px;
          padding: 0.75rem 1rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
        }

        .chip-lbl {
          display: block;
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 0.06em;
          color: #94A3B8;
        }

        .chip-box strong {
          display: block;
          font-size: 0.88rem;
          color: #0F172A;
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
        }

        .svc-hero-cover-photo {
          width: 100%;
          height: 380px;
          object-fit: cover;
          display: block;
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
          border-radius: 10px;
          padding: 0.85rem 1rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.92rem;
          color: #1E293B;
          font-weight: 500;
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

        .faq-card-head {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          margin-bottom: 1.5rem;
        }

        .faq-card-head h3 {
          font-size: 1.35rem;
          font-weight: 800;
          color: #0F172A;
          margin: 0;
        }

        .faq-list {
          display: flex;
          flex-direction: column;
          gap: 1.1rem;
        }

        .faq-item {
          background: #F8FAFC;
          padding: 1rem 1.25rem;
          border-radius: 10px;
          border: 1px solid #E2E8F0;
        }

        .faq-item h4 {
          font-size: 0.98rem;
          font-weight: 700;
          color: #0F172A;
          margin-bottom: 0.35rem;
        }

        .faq-item p {
          font-size: 0.88rem;
          color: #64748B;
          line-height: 1.55;
          margin: 0;
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
        }

        @media (max-width: 768px) {
          .svc-breadcrumbs-strip {
            padding: 0.65rem 0;
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
            gap: 0.45rem;
            margin-bottom: 0.85rem;
          }
          .chip-box {
            padding: 0.45rem 0.65rem;
            gap: 0.45rem;
            flex: 1 1 calc(50% - 0.45rem);
          }
          .chip-lbl {
            font-size: 0.62rem;
          }
          .chip-box strong {
            font-size: 0.78rem;
          }
          .svc-hero-cta-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.5rem;
            margin-bottom: 1rem;
          }
          .btn-book-now-solid,
          .btn-custom-inquiry {
            padding: 0.6rem 0.65rem;
            font-size: 0.78rem;
            justify-content: center;
            text-align: center;
          }
          .svc-hero-cover-photo {
            height: 180px;
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
            padding: 1rem 1.1rem;
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
          .highlight-pill {
            padding: 0.5rem 0.65rem;
            font-size: 0.78rem;
          }
          .sidebar-booking-card {
            padding: 1.1rem 1rem;
            border-radius: 14px;
          }
          .sidebar-booking-card h3 {
            font-size: 1.15rem;
          }
        }
      `}</style>
    </div>
  );
}
