import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { EnquiryModal } from '../components/EnquiryModal';
import { MobileStickyBar } from '../components/MobileStickyBar';
import { usePageSeo } from '../hooks/usePageSeo';
import { getLivePage } from '../data/livePagesContent';
import { AboutPage } from './AboutPage';
import { ContactPage } from './ContactPage';
import { BlogPage } from './BlogPage';
import { SitemapPage } from './SitemapPage';
import { NotFoundPage } from './NotFoundPage';
import { businessConfig } from '../config/business.config';
import { getLocationDisplayName } from '../utils/locationNames';
import { 
  Car, 
  Bus,
  ArrowRight, 
  Clock, 
  Calendar, 
  User, 
  CheckCircle2, 
  ShieldCheck, 
  HelpCircle,
  MapPin,
  Sparkles,
  ArrowLeft
} from 'lucide-react';

export function LiveMigratedPage() {
  const { slug } = useParams();
  const location = useLocation();

  // Normalize slug from route param or pathname (handles trailing slashes)
  const currentSlug = slug || location.pathname.replace(/^\/|\/$/g, '');

  // Aliases for core pages
  if (currentSlug === 'about-us' || currentSlug === 'about') {
    return <AboutPage />;
  }
  if (currentSlug === 'contact-us' || currentSlug === 'contact') {
    return <ContactPage />;
  }
  if (currentSlug === 'blog') {
    return <BlogPage />;
  }
  if (currentSlug === 'sitemap') {
    return <SitemapPage />;
  }

  return <LiveMigratedContent currentSlug={currentSlug} />;
}

function LiveMigratedContent({ currentSlug }) {
  const navigate = useNavigate();
  const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);
  const page = getLivePage(currentSlug);

  usePageSeo(
    page ? `live_${page.slug}` : 'page_not_found',
    page ? page.metaTitle : 'Page Not Found | AJ Travels',
    page ? page.metaDesc : 'AJ Travels intercity chauffeured travel service.',
    page ? page.canonicalUrl : undefined
  );

  // Inject JSON-LD Schema & Maintain Canonical Tag
  useEffect(() => {
    if (!page) return;

    // Synchronize canonical tag in document head
    if (page.canonicalUrl) {
      const canonicalTags = document.querySelectorAll('link[rel="canonical"]');
      if (canonicalTags.length > 0) {
        canonicalTags[0].setAttribute('href', page.canonicalUrl);
        for (let i = 1; i < canonicalTags.length; i++) {
          canonicalTags[i].remove();
        }
      } else {
        const canonicalTag = document.createElement('link');
        canonicalTag.setAttribute('rel', 'canonical');
        canonicalTag.setAttribute('href', page.canonicalUrl);
        document.head.appendChild(canonicalTag);
      }
    }

    const schemaId = 'live-page-schema';
    let scriptTag = document.getElementById(schemaId);
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = schemaId;
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }

    const schemaData = {
      '@context': 'https://schema.org',
      '@type': page.category === 'Travel Guide' ? 'BlogPosting' : 'Service',
      'headline': page.h1,
      'name': page.h1,
      'description': page.metaDesc,
      'url': page.canonicalUrl,
      'provider': {
        '@type': 'TravelAgency',
        'name': businessConfig.businessName,
        'telephone': businessConfig.phone,
        'email': businessConfig.email,
        'address': {
          '@type': 'PostalAddress',
          'streetAddress': 'Old Mumbai–Pune Highway, Nashik Fata, Kasarawadi',
          'addressLocality': 'Pune',
          'postalCode': '411064',
          'addressRegion': 'Maharashtra',
          'addressCountry': 'IN'
        }
      }
    };

    scriptTag.text = JSON.stringify(schemaData);

    return () => {
      const tag = document.getElementById(schemaId);
      if (tag) tag.remove();
    };
  }, [page]);

  if (!page) {
    return <NotFoundPage />;
  }

  const isEditorialBlog = page.category === 'Travel Guide' || page.category === 'Blog';
  const isLocalityPage = 
    page.category === 'Car Rentals' || 
    page.category === 'Tempo Traveller Rentals' || 
    page.category === 'Bus & Coach Rentals' ||
    page.slug?.startsWith('car-on-rent-') ||
    page.slug?.startsWith('tempo-traveller-on-rent-') ||
    page.slug?.startsWith('bus-on-rent-') ||
    page.slug?.endsWith('-in-pcmc');

  // Extract locality name if present in H1 e.g. "Car on Rent in Moshi, PCMC with Driver" -> "Moshi, PCMC"
  const extractLocalityName = () => {
    if (page.bookingDefaults?.pickupName) return page.bookingDefaults.pickupName;
    const match = page.h1?.match(/in\s+([^|(,]+)/i);
    if (match) {
      const loc = match[1].trim();
      return page.h1.includes('PCMC') && !loc.includes('PCMC') ? `${loc}, PCMC` : loc;
    }
    return 'Pune & PCMC';
  };
  const localityName = extractLocalityName();

  const pId = page.bookingDefaults?.pickupId || 'pune';
  const dId = page.bookingDefaults?.dropId || null;
  const isPuneMumbaiCorridor =
    Boolean(dId) &&
    ((pId === 'pune' && dId === 'mumbai') || (pId === 'mumbai' && dId === 'pune'));

  const handleBookNow = () => {
    const pName = page.bookingDefaults?.pickupName || getLocationDisplayName(pId);
    const params = new URLSearchParams({
      tripType: page.bookingDefaults?.tripType || (dId ? 'ONE_WAY' : 'LOCAL'),
      pickupId: pId,
      pickupName: pName,
      category: page.bookingDefaults?.category || 'SEDAN'
    });
    if (dId) {
      const dName = page.bookingDefaults?.dropName || getLocationDisplayName(dId);
      params.set('dropId', dId);
      params.set('dropName', dName);
    } else {
      params.set('city', 'Pune');
    }
    navigate(`/fare?${params.toString()}`);
  };

  const getCategoryBreadcrumb = (category) => {
    switch (category) {
      case 'Travel Guide':
      case 'Blog':
        return { label: 'Travel Guides & Blog', path: '/blog' };
      case 'Car Rentals':
        return { label: isLocalityPage ? 'Locality Rentals (Pune & PCMC)' : 'Fleet & Vehicles', path: '/sitemap#locality-rentals' };
      case 'Tempo Traveller Rentals':
        return { label: isLocalityPage ? 'Tempo Traveller by Locality' : 'Fleet & Vehicles', path: '/sitemap#locality-rentals' };
      case 'Bus & Coach Rentals':
        return { label: isLocalityPage ? 'Bus on Rent by Locality' : 'Fleet & Vehicles', path: '/sitemap#locality-rentals' };
      case 'Pickup & Drop Corridors':
        return { label: 'Corridor Services', path: '/services' };
      case 'Corporate Travel':
        return { label: 'Corporate Solutions', path: '/services' };
      default:
        return { label: 'Services', path: '/services' };
    }
  };

  const bcParent = getCategoryBreadcrumb(page.category);

  const getCategoryBadgeLabel = () => {
    if (isLocalityPage) {
      if (page.category === 'Bus & Coach Rentals') return `BUS & COACH HIRE • ${localityName.toUpperCase()}`;
      if (page.category === 'Tempo Traveller Rentals') return `TEMPO TRAVELLER RENTAL • ${localityName.toUpperCase()}`;
      return `CAR RENTAL WITH DRIVER • ${localityName.toUpperCase()}`;
    }
    if (page.category === 'Pickup & Drop Corridors') return 'INTERCITY PICKUP & DROP CORRIDOR';
    if (page.category === 'Corporate Travel') return 'CORPORATE LEASING & FLEET';
    return page.category;
  };

  return (
    <div className="migrated-page-wrapper">
      <Header onOpenEnquiry={() => setIsEnquiryOpen(true)} isDark={false} />

      {/* Breadcrumbs Navigation Strip */}
      <section className="article-breadcrumbs-strip">
        <div className="container">
          <div className="breadcrumbs-nav">
            <Link to="/">Home</Link>
            <span className="bc-sep">/</span>
            <Link to={bcParent.path}>{bcParent.label}</Link>
            <span className="bc-sep">/</span>
            <span className="bc-current">{page.h1}</span>
          </div>
        </div>
      </section>

      {/* Main 2-Column Content Layout */}
      <main className="article-content-container">
        <div className="container">
          <div className="article-2col-layout">
            {/* Left Column: Content */}
            <div className="article-main-col">
              {/* Header */}
              <header className="article-header-section">
                <div className="article-category-chip">{getCategoryBadgeLabel()}</div>
                <h1 className="article-main-title">{page.h1}</h1>
                <p className="article-main-summary">{page.summary}</p>

                {isEditorialBlog ? (
                  /* Editorial Author Meta Bar — Only for Travel Guides and Blog Articles */
                  <div className="article-author-meta-bar">
                    <div className="author-pill">
                      <User size={15} color="#2563EB" />
                      <span>{page.author || 'AJ Travels Editorial Desk'}</span>
                    </div>
                    <div className="meta-split-dot">•</div>
                    <div className="meta-pill">
                      <Calendar size={14} />
                      <span>{page.publishedDate || '2026-03-15'}</span>
                    </div>
                    <div className="meta-split-dot">•</div>
                    <div className="meta-pill">
                      <Clock size={14} />
                      <span>{page.readTime || '5 min read'}</span>
                    </div>
                  </div>
                ) : (
                  /* Commercial Service Trust Highlights Bar — For Locality, Fleet & Corridor Pages */
                  <div className="commercial-service-trust-bar">
                    <div className="trust-pill">
                      <MapPin size={15} color="#2563EB" />
                      <span>Doorstep Pickup in {localityName}</span>
                    </div>
                    <div className="trust-pill">
                      <ShieldCheck size={15} color="#10B981" />
                      <span>Verified Chauffeurs</span>
                    </div>
                    <div className="trust-pill">
                      <CheckCircle2 size={15} color="#10B981" />
                      <span>Sanitized AC Vehicles</span>
                    </div>
                    <div className="trust-pill">
                      <Clock size={15} color="#2563EB" />
                      <span>24/7 Dispatch Desk</span>
                    </div>
                  </div>
                )}
              </header>

              {/* Featured Vehicle / Route Banner */}
              <div className="article-hero-img-box" style={{ marginBottom: '2rem' }}>
                <img 
                  src={page.heroImg} 
                  alt={page.category === 'Bus & Coach Rentals' ? `${page.h1} - 20 to 50 Seater Luxury AC Coach Interior` : page.h1} 
                  className="article-featured-photo"
                  style={{
                    objectPosition: page.category === 'Bus & Coach Rentals' ? 'center 25%' : 'center center'
                  }}
                />
                {!isEditorialBlog && (
                  <div className="commercial-image-overlay-badge">
                    {page.category === 'Bus & Coach Rentals' ? <Bus size={16} /> : <Car size={16} />}
                    <span>
                      {page.category === 'Bus & Coach Rentals'
                        ? `20 to 50 Seater Luxury AC Coaches • Available in ${localityName}`
                        : page.category === 'Tempo Traveller Rentals'
                        ? `13, 17 & 20 Seater AC Force Tempo Travellers • Doorstep Pickup in ${localityName}`
                        : `Executive Sedans & Family SUVs • Doorstep Pickup in ${localityName}`}
                    </span>
                  </div>
                )}
              </div>

              {/* Key Takeaways Callout */}
              <div className="key-takeaways-callout">
                <div className="callout-head">
                  <ShieldCheck size={20} color="#1D4ED8" />
                  <strong>Trip Assurance by AJ Travels</strong>
                </div>
                <p>
                  {isLocalityPage 
                    ? `Reliable chauffeur-driven transport in ${localityName}. Transparent fixed rates with no hidden surprises, punctual doorstep arrival, and full AC comfort.`
                    : '100% all-inclusive pricing with expressway tolls included, verified courteous chauffeurs, sanitized vehicles with dual air conditioning, and 24/7 customer support desk.'}
                </p>
              </div>

              {/* Structured Content Prose */}
              <div className="article-prose">
                {page.content.map((block, idx) => {
                  if (block.type === 'intro' || block.type === 'paragraph') {
                    return (
                      <p key={idx} className={block.type === 'intro' ? 'lead-prose' : 'standard-prose'}>
                        {block.text}
                      </p>
                    );
                  }
                  if (block.type === 'heading') {
                    if (block.level === 2) {
                      return <h2 key={idx} className="prose-h2">{block.title}</h2>;
                    }
                    return <h3 key={idx} className="prose-h3">{block.title}</h3>;
                  }
                  if (block.type === 'points') {
                    return (
                      <div key={idx} className="prose-points-box">
                        {block.title && <h4 className="points-box-title">{block.title}</h4>}
                        <ul className="prose-bullets-list">
                          {block.items.map((item, i) => (
                            <li key={i}>
                              <CheckCircle2 size={16} color="#10B981" className="bullet-icon" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>

              {/* Interactive Fare Calculator Booking Card */}
              <div className="article-booking-cta-card">
                <div className="cta-left">
                  <span className="cta-badge">INSTANT ALL-INCLUSIVE QUOTE</span>
                  <h3>{isLocalityPage ? `Need a Cab in ${localityName}?` : 'Need a Cab for this Route?'}</h3>
                  <p>
                    {isLocalityPage 
                      ? `Book doorstep car rental in ${localityName} with professional driver. Hourly packages and outstation rates available.`
                      : 'Calculate your exact fare online in seconds. Tolls, taxes, and driver charges included.'}
                  </p>
                  <div className="cta-fleet-links">
                    <span>Fleet options: </span>
                    <Link to="/swift-dzire-car-on-rent-with-driver-in-pune/">Sedan</Link> • 
                    <Link to="/ertiga-car-on-rent-in-pune/">Ertiga SUV</Link> • 
                    <Link to="/innova-car-on-rent-in-pune/">Innova Crysta</Link> • 
                    <Link to="/tempo-traveller-on-rent-in-pune/">Tempo Traveller</Link>
                  </div>
                </div>
                <div className="cta-right">
                  <button 
                    type="button" 
                    onClick={handleBookNow}
                    className="btn-cta-calculate"
                  >
                    <Car size={18} />
                    <span>{isLocalityPage ? `Book Car in ${localityName}` : 'Calculate Cab Fare'}</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>

              {/* FAQs Section */}
              {page.faqs && page.faqs.length > 0 && (
                <div className="article-faqs-section">
                  <div className="faqs-head">
                    <HelpCircle size={22} color="#2563EB" />
                    <h3>Frequently Asked Questions</h3>
                  </div>
                  <div className="faqs-list">
                    {page.faqs.map((faq, idx) => (
                      <div key={idx} className="article-faq-item">
                        <h4 className="faq-question">{faq.q}</h4>
                        <p className="faq-answer">{faq.a}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Sticky Sidebar Booking Card & Highway/Locality Specs */}
            <aside className="article-sidebar-col">
              {/* Widget 1: Direct Cab Fare & Booking CTA */}
              <div className="sidebar-card sidebar-booking-card">
                <div className="sidebar-card-badge">
                  {isLocalityPage ? 'LOCALITY RENTAL' : 'DIRECT BOOKING'}
                </div>
                <h3 className="sidebar-card-title">
                  {isLocalityPage ? `Book Cab in ${localityName}` : 'Book Cab For This Route'}
                </h3>
                {dId ? (
                  <div className="sidebar-corridor-pill">
                    <span className="corridor-point">{pId.toUpperCase()}</span>
                    <ArrowRight size={14} color="#1D4ED8" />
                    <span className="corridor-point">{dId.toUpperCase()}</span>
                  </div>
                ) : (
                  <div className="sidebar-corridor-pill">
                    <MapPin size={14} color="#1D4ED8" />
                    <span className="corridor-point">
                      {localityName.toUpperCase()}
                    </span>
                  </div>
                )}
                <p className="sidebar-card-desc">
                  {isPuneMumbaiCorridor
                    ? 'Doorstep pickup across Pune & Mumbai with verified drivers and 100% expressway toll-inclusive flat fares.'
                    : dId
                    ? `Doorstep pickup from ${getLocationDisplayName(pId)} to ${getLocationDisplayName(dId)} with verified chauffeurs and all-inclusive pricing.`
                    : `Doorstep pickup across ${localityName} with verified drivers for local city running, airport transfers, and flexible hourly or outstation rental options.`}
                </p>
                <button 
                  type="button" 
                  onClick={handleBookNow}
                  className="sidebar-btn-book"
                >
                  <Car size={16} />
                  <span>{isLocalityPage ? `Book in ${localityName}` : 'Check Fare & Availability'}</span>
                  <ArrowRight size={14} />
                </button>

                <div className="sidebar-desk-actions">
                  <a href={`tel:${businessConfig.phone}`} className="sidebar-desk-link call">
                    <span>📞 Call 24/7 Desk: {businessConfig.phoneDisplay}</span>
                  </a>
                  <a 
                    href={`https://wa.me/${businessConfig.whatsapp}?text=${encodeURIComponent(`Hi AJ Travels, I am on "${page.h1}" and would like to enquire about cab availability in ${localityName}.`)}`}
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="sidebar-desk-link whatsapp"
                  >
                    <span>💬 Book on WhatsApp</span>
                  </a>
                </div>
              </div>

              {/* Widget 2: Corridor Highway Specs (Shown only when Expressway specs are factually verified) */}
              {isPuneMumbaiCorridor && (
                <div className="sidebar-card sidebar-specs-card">
                  <h4 className="sidebar-specs-heading">Corridor Highway Specs</h4>
                  <div className="sidebar-spec-row">
                    <span className="spec-label">Route</span>
                    <span className="spec-value">Expressway (NH 48)</span>
                  </div>
                  <div className="sidebar-spec-row">
                    <span className="spec-label">Est. Distance</span>
                    <span className="spec-value">~150 KMs</span>
                  </div>
                  <div className="sidebar-spec-row">
                    <span className="spec-label">Travel Time</span>
                    <span className="spec-value">2.5 – 3.5 Hours</span>
                  </div>
                  <div className="sidebar-spec-row">
                    <span className="spec-label">Toll Charges</span>
                    <span className="spec-value text-green">100% Included</span>
                  </div>
                  <div className="sidebar-spec-row">
                    <span className="spec-label">Available Cabs</span>
                    <span className="spec-value">Sedan, Ertiga, Crysta</span>
                  </div>
                </div>
              )}

              {/* Widget 2b: Locality Rental Specs (Shown for Locality pages) */}
              {isLocalityPage && (
                <div className="sidebar-card sidebar-specs-card">
                  <h4 className="sidebar-specs-heading">Locality Rental Details</h4>
                  <div className="sidebar-spec-row">
                    <span className="spec-label">Service Area</span>
                    <span className="spec-value">{localityName}</span>
                  </div>
                  <div className="sidebar-spec-row">
                    <span className="spec-label">Local Packages</span>
                    <span className="spec-value">4h/40km, 8h/80km, 12h/120km</span>
                  </div>
                  <div className="sidebar-spec-row">
                    <span className="spec-label">Outstation</span>
                    <span className="spec-value">Mumbai, Shirdi, Konkan</span>
                  </div>
                  <div className="sidebar-spec-row">
                    <span className="spec-label">Airport Drop</span>
                    <span className="spec-value">Pune (PNQ) & Mumbai (BOM)</span>
                  </div>
                  <div className="sidebar-spec-row">
                    <span className="spec-label">Chauffeur</span>
                    <span className="spec-value text-green">Verified Highway Driver</span>
                  </div>
                </div>
              )}

              {/* Widget 3: AJ Travels Guarantee Box */}
              <div className="sidebar-card sidebar-trust-box">
                <div className="trust-box-header">
                  <ShieldCheck size={18} color="#1D4ED8" />
                  <strong>AJ Travels Guarantee</strong>
                </div>
                <ul className="trust-box-list">
                  <li>✓ Dedicated private car — no sharing</li>
                  <li>✓ Verified highway chauffeur arrives early</li>
                  <li>✓ 100% flat fare with all toll receipts</li>
                </ul>
              </div>
            </aside>
          </div>

          {/* Contextual Internal Links Section */}
          {page.relatedLinks && page.relatedLinks.length > 0 && (
            <div className="article-related-links-card">
              <h4>Recommended Related Services & Guides</h4>
              <div className="related-links-grid">
                {page.relatedLinks.map((link, i) => (
                  <Link key={i} to={link.url} className="contextual-internal-link">
                    <span>{link.title}</span>
                    <ArrowRight size={14} />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Return link */}
          <div className="article-back-bar">
            <Link to="/" className="btn-back-blog">
              <ArrowLeft size={16} />
              <span>Return to AJ Travels Home</span>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
      <MobileStickyBar onOpenEnquiry={() => setIsEnquiryOpen(true)} />
      <EnquiryModal isOpen={isEnquiryOpen} onClose={() => setIsEnquiryOpen(false)} />

      <style>{`
        .migrated-page-wrapper {
          min-height: 100vh;
          background: #FFFFFF;
          color: #0F172A;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .article-breadcrumbs-strip {
          background: #F8FAFC;
          border-bottom: 1px solid #E2E8F0;
          padding: 0.85rem 0;
        }

        .breadcrumbs-nav {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          color: #64748B;
          flex-wrap: wrap;
        }

        .breadcrumbs-nav a { color: #2563EB; text-decoration: none; font-weight: 500; }
        .bc-sep { color: #94A3B8; }
        .bc-current { color: #0F172A; font-weight: 600; }

        .article-header-section {
          padding: 2rem 0 1rem;
          text-align: left;
        }

        .article-category-chip {
          display: inline-block;
          background: #EFF6FF;
          color: #1D4ED8;
          font-size: 0.75rem;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          padding: 0.35rem 0.85rem;
          border-radius: 9999px;
          margin-bottom: 0.85rem;
        }

        .article-main-title {
          font-size: 2.2rem;
          font-weight: 800;
          line-height: 1.25;
          color: #0F172A;
          margin-bottom: 0.75rem;
        }

        .article-main-summary {
          font-size: 1.05rem;
          line-height: 1.6;
          color: #475569;
          margin-bottom: 1.25rem;
        }

        .article-author-meta-bar {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          gap: 0.75rem;
          font-size: 0.85rem;
          color: #64748B;
          flex-wrap: wrap;
          margin-bottom: 1.5rem;
        }

        .commercial-service-trust-bar {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          flex-wrap: wrap;
          margin-bottom: 1.5rem;
        }

        .trust-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.825rem;
          font-weight: 600;
          color: #1E293B;
          background: #F1F5F9;
          padding: 0.4rem 0.85rem;
          border-radius: 9999px;
          border: 1px solid #E2E8F0;
        }

        .author-pill, .meta-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          font-weight: 500;
        }

        .author-pill {
          font-weight: 700;
          color: #0F172A;
        }

        .meta-split-dot { color: #CBD5E1; }

        .article-hero-img-box {
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
          border: 1px solid #E2E8F0;
        }

        .commercial-image-overlay-badge {
          background: #0F172A;
          color: #F8FAFC;
          padding: 0.75rem 1.25rem;
          display: flex;
          align-items: center;
          gap: 0.6rem;
          font-size: 0.85rem;
          font-weight: 600;
          border-top: 1px solid #1E293B;
        }

        .article-featured-photo {
          width: 100%;
          height: auto;
          max-height: 420px;
          object-fit: cover;
          display: block;
        }

        .article-content-container {
          padding: 1rem 0 5rem;
        }

        .key-takeaways-callout {
          background: #EFF6FF;
          border: 1px solid #BFDBFE;
          border-left: 4px solid #1D4ED8;
          border-radius: 12px;
          padding: 1.25rem 1.5rem;
          margin-bottom: 2.5rem;
        }

        .callout-head {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #1D4ED8;
          margin-bottom: 0.4rem;
        }

        .key-takeaways-callout p {
          font-size: 0.95rem;
          line-height: 1.6;
          color: #1E3A8A;
          margin: 0;
        }

        .article-prose {
          margin-bottom: 3rem;
        }

        .lead-prose {
          font-size: 1.15rem;
          line-height: 1.75;
          color: #1E293B;
          font-weight: 500;
          margin-bottom: 1.5rem;
        }

        .standard-prose {
          font-size: 1.02rem;
          line-height: 1.75;
          color: #334155;
          margin-bottom: 1.5rem;
        }

        .prose-h2 {
          font-size: 1.75rem;
          font-weight: 800;
          color: #0F172A;
          margin: 2.5rem 0 1rem;
          line-height: 1.3;
        }

        .prose-h3 {
          font-size: 1.35rem;
          font-weight: 700;
          color: #0F172A;
          margin: 2rem 0 0.85rem;
        }

        .prose-points-box {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 14px;
          padding: 1.5rem;
          margin: 1.75rem 0;
        }

        .points-box-title {
          font-size: 1.05rem;
          font-weight: 700;
          color: #0F172A;
          margin-bottom: 1rem;
        }

        .prose-bullets-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }

        .prose-bullets-list li {
          display: flex;
          align-items: flex-start;
          gap: 0.65rem;
          font-size: 0.95rem;
          line-height: 1.6;
          color: #334155;
        }

        .bullet-icon {
          flex-shrink: 0;
          margin-top: 0.2rem;
        }

        /* Booking CTA Card */
        .article-booking-cta-card {
          background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
          border-radius: 20px;
          padding: 2.25rem;
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 2rem;
          margin: 3.5rem 0;
          box-shadow: 0 12px 32px rgba(15, 23, 42, 0.2);
        }

        .cta-badge {
          display: inline-block;
          background: rgba(56, 189, 248, 0.2);
          color: #38BDF8;
          font-size: 0.7rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          padding: 0.25rem 0.65rem;
          border-radius: 9999px;
          margin-bottom: 0.6rem;
        }

        .article-booking-cta-card h3 {
          font-size: 1.45rem;
          font-weight: 800;
          color: #FFFFFF;
          margin-bottom: 0.4rem;
        }

        .article-booking-cta-card p {
          font-size: 0.9rem;
          color: #CBD5E1;
          margin-bottom: 0.85rem;
        }

        .cta-fleet-links {
          font-size: 0.82rem;
          color: #94A3B8;
        }

        .cta-fleet-links a {
          color: #38BDF8;
          text-decoration: none;
          margin: 0 0.35rem;
        }

        .cta-fleet-links a:hover {
          text-decoration: underline;
        }

        .btn-cta-calculate {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
          color: #FFFFFF;
          font-size: 0.95rem;
          font-weight: 700;
          padding: 0.95rem 1.6rem;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          white-space: nowrap;
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);
          transition: all 0.2s ease;
        }

        .btn-cta-calculate:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(37, 99, 235, 0.5);
        }

        /* FAQs Section */
        .article-faqs-section {
          background: #F8FAFC;
          border-radius: 18px;
          border: 1px solid #E2E8F0;
          padding: 2.25rem;
          margin-bottom: 3.5rem;
        }

        .faqs-head {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          margin-bottom: 1.5rem;
        }

        .faqs-head h3 {
          font-size: 1.35rem;
          font-weight: 800;
          color: #0F172A;
          margin: 0;
        }

        .faqs-list {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .article-faq-item {
          background: #FFFFFF;
          padding: 1.25rem;
          border-radius: 12px;
          border: 1px solid #E2E8F0;
        }

        .faq-question {
          font-size: 1.05rem;
          font-weight: 700;
          color: #0F172A;
          margin-bottom: 0.5rem;
        }

        .faq-answer {
          font-size: 0.92rem;
          line-height: 1.6;
          color: #475569;
          margin: 0;
        }

        /* Related Links Card */
        .article-related-links-card {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 16px;
          padding: 1.75rem;
          margin-bottom: 3rem;
        }

        .article-related-links-card h4 {
          font-size: 1.05rem;
          font-weight: 700;
          color: #0F172A;
          margin-bottom: 1rem;
        }

        .related-links-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }

        .contextual-internal-link {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #FFFFFF;
          border: 1px solid #CBD5E1;
          padding: 0.75rem 1rem;
          border-radius: 10px;
          color: #1E293B;
          text-decoration: none;
          font-size: 0.85rem;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .contextual-internal-link:hover {
          border-color: #2563EB;
          color: #2563EB;
          background: #EFF6FF;
          transform: translateY(-2px);
        }

        .article-back-bar {
          text-align: center;
          padding-top: 2rem;
          border-top: 1px solid #E2E8F0;
        }

        .btn-back-blog {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          color: #2563EB;
          font-weight: 700;
          font-size: 0.92rem;
          text-decoration: none;
        }

        .btn-back-blog:hover {
          text-decoration: underline;
        }

        /* 2-Column Editorial & Conversion Layout */
        .article-2col-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 350px;
          gap: 2.75rem;
          align-items: flex-start;
          margin-bottom: 3.5rem;
        }

        .article-main-col {
          min-width: 0;
        }

        .article-sidebar-col {
          position: sticky;
          top: 96px;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .sidebar-card {
          background: #FFFFFF;
          border-radius: 16px;
          border: 1px solid #E2E8F0;
          padding: 1.5rem;
          box-shadow: 0 4px 16px rgba(15, 23, 42, 0.05);
        }

        .sidebar-booking-card {
          background: linear-gradient(180deg, #0B1629 0%, #0F172A 100%);
          border-color: rgba(255, 255, 255, 0.12);
          color: #FFFFFF;
          box-shadow: 0 10px 30px rgba(15, 23, 42, 0.25);
        }

        .sidebar-card-badge {
          display: inline-block;
          background: rgba(56, 189, 248, 0.2);
          color: #38BDF8;
          font-size: 0.68rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          padding: 0.25rem 0.6rem;
          border-radius: 9999px;
          margin-bottom: 0.6rem;
        }

        .sidebar-card-title {
          font-size: 1.18rem;
          font-weight: 800;
          color: #FFFFFF;
          margin-bottom: 0.85rem;
        }

        .sidebar-corridor-pill {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.14);
          padding: 0.5rem 0.85rem;
          border-radius: 10px;
          margin-bottom: 0.85rem;
        }

        .corridor-point {
          font-size: 0.82rem;
          font-weight: 800;
          color: #38BDF8;
          letter-spacing: 0.04em;
        }

        .sidebar-card-desc {
          font-size: 0.84rem;
          line-height: 1.55;
          color: #CBD5E1;
          margin-bottom: 1.15rem;
        }

        .sidebar-btn-book {
          width: 100%;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          background: linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%);
          color: #FFFFFF;
          font-size: 0.92rem;
          font-weight: 800;
          border-radius: 11px;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);
          transition: all 0.22s ease;
          margin-bottom: 0.85rem;
        }

        .sidebar-btn-book:hover {
          background: linear-gradient(135deg, #1D4ED8 0%, #1E40AF 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(37, 99, 235, 0.55);
        }

        .sidebar-desk-actions {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
        }

        .sidebar-desk-link {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.65rem;
          border-radius: 9px;
          font-size: 0.82rem;
          font-weight: 700;
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .sidebar-desk-link.call {
          background: rgba(255, 255, 255, 0.1);
          color: #FFFFFF;
          border: 1px solid rgba(255, 255, 255, 0.18);
        }
        .sidebar-desk-link.call:hover {
          background: rgba(255, 255, 255, 0.18);
        }

        .sidebar-desk-link.whatsapp {
          background: #25D366;
          color: #FFFFFF;
        }
        .sidebar-desk-link.whatsapp:hover {
          background: #1EBE5D;
        }

        .sidebar-specs-heading {
          font-size: 0.98rem;
          font-weight: 800;
          color: #0F172A;
          margin-bottom: 0.95rem;
          border-bottom: 1px solid #F1F5F9;
          padding-bottom: 0.5rem;
        }

        .sidebar-spec-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.45rem 0;
          border-bottom: 1px solid #F8FAFC;
          font-size: 0.84rem;
        }

        .spec-label {
          color: #64748B;
          font-weight: 500;
        }

        .spec-value {
          color: #0F172A;
          font-weight: 700;
        }

        .spec-value.text-green {
          color: #10B981;
        }

        .sidebar-trust-box {
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
        }

        .trust-box-header {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          color: #1D4ED8;
          font-size: 0.88rem;
          font-weight: 700;
          margin-bottom: 0.65rem;
        }

        .trust-box-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          font-size: 0.8rem;
          color: #475569;
        }

        @media (max-width: 1024px) {
          .article-2col-layout {
            grid-template-columns: 1fr;
            gap: 2.5rem;
          }
          .article-sidebar-col {
            position: static;
          }
        }

        @media (max-width: 768px) {
          .article-main-title {
            font-size: 1.85rem;
          }
          .article-booking-cta-card {
            flex-direction: column;
            align-items: flex-start;
          }
          .related-links-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
