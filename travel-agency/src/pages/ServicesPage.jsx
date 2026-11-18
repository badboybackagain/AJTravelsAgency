import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { EnquiryModal } from '../components/EnquiryModal';
import { MobileStickyBar } from '../components/MobileStickyBar';
import { usePageSeo } from '../hooks/usePageSeo';
import { servicesData } from '../data/servicesData';
import { 
  Compass, 
  Clock, 
  MapPin, 
  Car, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles,
  Plane,
  Building2,
  Navigation
} from 'lucide-react';

export function ServicesPage() {
  usePageSeo(
    'services',
    'Car Rental Services in Pune | Intercity Cabs & Airport Transfers - AJ Travels',
    'Explore chauffeur-driven car rental services in Pune: Pune to Mumbai cabs, 24/7 airport transfers (BOM & PNQ), outstation tours, and corporate car rentals with AJ Travels.',
    'https://ajtravelsagency.vercel.app/services/'
  );

  const navigate = useNavigate();
  const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);

  const handleBookService = (service) => {
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
    <div className="services-page-wrapper">
      <Header onOpenEnquiry={() => setIsEnquiryOpen(true)} isDark={false} />

      {/* Internal Hero Banner */}
      <section className="internal-hero-section">
        <div className="container">
          <div className="breadcrumbs-nav">
            <Link to="/">Home</Link>
            <span className="bc-sep">/</span>
            <span className="bc-current">Our Services</span>
          </div>

          <div className="internal-hero-content">
            <div className="hero-badge-pill">
              <Sparkles size={14} />
              <span>PREMIER INTERCITY TRANSPORT</span>
            </div>
            <h1 className="internal-hero-title">
              Chauffeur-Driven Car Rental & <span className="text-gradient">Intercity Cab Services</span>
            </h1>
            <p className="internal-hero-subtitle">
              Punctual, fully insured, and verified chauffeured services connecting Pune with Mumbai, Maharashtra hill stations, IT parks, and international airports.
            </p>
          </div>
        </div>
      </section>

      {/* Services Showcase Cards */}
      <section className="services-main-section">
        <div className="container">
          <div className="services-stack">
            {servicesData.map((svc, idx) => (
              <div key={svc.slug} className={`service-showcase-card ${idx % 2 === 1 ? 'reverse-grid' : ''}`}>
                <div className="svc-img-side">
                  <img 
                    src={svc.heroImg} 
                    alt={svc.title} 
                    className="svc-photo" 
                    loading="lazy"
                  />
                  <span className="svc-floating-badge">{svc.badge}</span>
                </div>

                <div className="svc-info-side">
                  <div className="svc-route-meta-strip">
                    <span className="meta-pill"><Navigation size={13} /> {svc.distance}</span>
                    <span className="meta-pill"><Clock size={13} /> {svc.duration}</span>
                    <span className="meta-pill"><MapPin size={13} /> {svc.route}</span>
                  </div>

                  <h2 className="svc-card-title">
                    <Link to={`/services/${svc.slug}`}>{svc.title}</Link>
                  </h2>

                  <p className="svc-tagline">{svc.tagline}</p>
                  <p className="svc-overview-txt">{svc.overview}</p>

                  <div className="svc-highlights-list">
                    {svc.highlights.slice(0, 4).map((h, i) => {
                      const hasColon = h.includes(':');
                      const title = hasColon ? h.split(':')[0].trim() : h;
                      const desc = hasColon ? h.split(':').slice(1).join(':').trim() : '';
                      return (
                        <div key={i} className={`svc-hl-item ${i >= 2 ? 'hide-on-mobile' : ''}`}>
                          <CheckCircle2 size={15} color="#10B981" className="svc-hl-icon" />
                          <div className="svc-hl-text">
                            <span className="svc-hl-title">{title}</span>
                            {desc && <span className="svc-hl-desc">{desc}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="svc-action-buttons">
                    <button 
                      type="button" 
                      onClick={() => handleBookService(svc)}
                      className="btn-book-corridor"
                    >
                      <Car size={15} />
                      <span>Book Corridor</span>
                    </button>
                    <Link to={`/services/${svc.slug}`} className="btn-view-details">
                      <span>Route Details</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
      <MobileStickyBar onOpenEnquiry={() => setIsEnquiryOpen(true)} />
      <EnquiryModal isOpen={isEnquiryOpen} onClose={() => setIsEnquiryOpen(false)} />

      <style>{`
        .services-page-wrapper {
          min-height: 100vh;
          background: #FFFFFF;
          color: #0F172A;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .internal-hero-section {
          background: linear-gradient(180deg, #F8FAFC 0%, #EFF6FF 100%);
          padding: 7.5rem 0 2.5rem;
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

        .breadcrumbs-nav a { color: #2563EB; text-decoration: none; font-weight: 500; }
        .bc-sep { color: #94A3B8; }
        .bc-current { color: #0F172A; font-weight: 600; }

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

        .services-main-section {
          padding: 2rem 0 4rem;
          background: #F8FAFC;
        }

        .services-stack {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .service-showcase-card {
          background: #FFFFFF;
          border-radius: 20px;
          border: 1px solid #CBD5E1;
          overflow: hidden;
          display: grid;
          grid-template-columns: 1fr 1.25fr;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
          transition: all 0.3s ease;
        }

        .service-showcase-card:hover {
          border-color: #93C5FD;
          box-shadow: 0 16px 40px rgba(15, 23, 42, 0.1);
        }

        .reverse-grid {
          grid-template-columns: 1.25fr 1fr;
        }
        .reverse-grid .svc-img-side {
          order: 2;
        }
        .reverse-grid .svc-info-side {
          order: 1;
        }

        .svc-img-side {
          position: relative;
          min-height: 320px;
        }

        .svc-photo {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .svc-floating-badge {
          position: absolute;
          top: 1.25rem;
          left: 1.25rem;
          background: #1D4ED8;
          color: #FFFFFF;
          font-size: 0.7rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          padding: 0.35rem 0.75rem;
          border-radius: 6px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
        }

        .svc-info-side {
          padding: 2.5rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .svc-route-meta-strip {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          margin-bottom: 0.85rem;
          flex-wrap: wrap;
        }

        .meta-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          background: #F1F5F9;
          color: #475569;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.25rem 0.65rem;
          border-radius: 6px;
        }

        .svc-card-title {
          font-size: 1.65rem;
          font-weight: 800;
          margin-bottom: 0.4rem;
        }

        .svc-card-title a {
          color: #0F172A;
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .svc-card-title a:hover {
          color: #2563EB;
        }

        .svc-tagline {
          font-size: 0.95rem;
          font-weight: 600;
          color: #2563EB;
          margin-bottom: 0.75rem;
        }

        .svc-overview-txt {
          font-size: 0.92rem;
          line-height: 1.65;
          color: #64748B;
          margin-bottom: 1.25rem;
        }

        .svc-highlights-list {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem 1.25rem;
          margin-bottom: 1.5rem;
        }

        .svc-hl-item {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          font-size: 0.88rem;
          color: #334155;
        }

        .svc-hl-icon {
          flex-shrink: 0;
          margin-top: 2px;
        }

        .svc-hl-text {
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }

        .svc-hl-title {
          font-weight: 700;
          color: #0F172A;
          line-height: 1.35;
        }

        .svc-hl-desc {
          font-size: 0.8rem;
          color: #64748B;
          line-height: 1.45;
        }

        .svc-action-buttons {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          flex-wrap: wrap;
        }

        .btn-book-corridor {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: linear-gradient(135deg, #1D4ED8 0%, #1E40AF 100%);
          color: #FFFFFF;
          font-weight: 700;
          font-size: 0.88rem;
          padding: 0.75rem 1.35rem;
          border-radius: 10px;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(29, 78, 216, 0.25);
          transition: all 0.2s ease;
        }

        .btn-book-corridor:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(29, 78, 216, 0.35);
        }

        .btn-view-details {
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

        .btn-view-details:hover {
          background: #DBEAFE;
        }

        @media (max-width: 991px) {
          .service-showcase-card,
          .reverse-grid {
            grid-template-columns: 1fr;
          }
          .reverse-grid .svc-img-side {
            order: 1;
          }
          .reverse-grid .svc-info-side {
            order: 2;
          }
        }

        @media (max-width: 768px) {
          .internal-hero-section {
            padding: 6rem 0 1.25rem;
          }
          .internal-hero-title {
            font-size: 1.4rem;
            margin-bottom: 0.35rem;
          }
          .internal-hero-subtitle {
            font-size: 0.8rem;
            line-height: 1.4;
          }
          .services-main-section {
            padding: 1rem 0 2rem;
          }
          .services-stack {
            gap: 1.25rem;
          }
          .service-showcase-card {
            border-radius: 16px;
          }
          .svc-img-side {
            min-height: auto;
            height: 170px;
          }
          .svc-floating-badge {
            top: 0.65rem;
            left: 0.65rem;
            font-size: 0.65rem;
            padding: 0.2rem 0.55rem;
          }
          .svc-info-side {
            padding: 1rem 1rem 1.15rem;
          }
          .svc-route-meta-strip {
            gap: 0.3rem;
            margin-bottom: 0.4rem;
          }
          .meta-pill {
            padding: 0.2rem 0.45rem;
            font-size: 0.68rem;
            gap: 0.25rem;
          }
          .svc-card-title {
            font-size: 1.2rem;
            margin-bottom: 0.2rem;
            line-height: 1.25;
          }
          .svc-tagline {
            font-size: 0.78rem;
            margin-bottom: 0.45rem;
            line-height: 1.35;
          }
          /* Hide verbose overview paragraph on mobile — keep punchy tagline */
          .svc-overview-txt {
            display: none !important;
          }
          /* Hide highlights beyond the first 2 on mobile */
          .hide-on-mobile {
            display: none !important;
          }
          /* Hide verbose descriptive lines on mobile — strictly show main points */
          .svc-hl-desc {
            display: none !important;
          }
          .svc-highlights-list {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.4rem 0.6rem;
            margin-bottom: 0.85rem;
          }
          .svc-hl-item {
            font-size: 0.74rem;
            align-items: center;
            gap: 0.35rem;
          }
          .svc-hl-icon {
            width: 14px;
            height: 14px;
            margin-top: 0;
          }
          .svc-hl-title {
            font-size: 0.74rem;
            font-weight: 700;
            line-height: 1.2;
          }
          .svc-action-buttons {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.5rem;
            width: 100%;
            align-items: stretch;
          }
          .btn-book-corridor,
          .btn-view-details {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 0.35rem;
            height: 42px;
            padding: 0 0.5rem;
            font-size: 0.78rem;
            font-weight: 700;
            white-space: nowrap;
            box-sizing: border-box;
            border-radius: 10px;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
}
