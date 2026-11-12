import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { EnquiryModal } from '../components/EnquiryModal';
import { MobileStickyBar } from '../components/MobileStickyBar';
import { usePageSeo } from '../hooks/usePageSeo';
import { getSitemapSections, getAllVerifiedSitemapLinks } from '../data/sitemapData';
import { Search, X, ExternalLink, ChevronRight } from 'lucide-react';

export function SitemapPage() {
  usePageSeo(
    'sitemap',
    'Sitemap | Complete Website Directory - AJ Travels Pune',
    'Browse the complete customer-friendly sitemap of AJ Travels Pune. Easily navigate our intercity cab services, vehicle fleet, fare calculation tools, travel guides, and contact information.',
    'https://ajtravelsagency.vercel.app/sitemap'
  );

  const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');

  const sections = useMemo(() => getSitemapSections(), []);
  const allLinks = useMemo(() => getAllVerifiedSitemapLinks(), []);

  // Set canonical URL tag and JSON-LD schema
  useEffect(() => {
    const canonicalTags = document.querySelectorAll('link[rel="canonical"]');
    if (canonicalTags.length > 0) {
      canonicalTags[0].setAttribute('href', 'https://ajtravelsagency.vercel.app/sitemap');
      for (let i = 1; i < canonicalTags.length; i++) {
        canonicalTags[i].remove();
      }
    } else {
      const canonicalTag = document.createElement('link');
      canonicalTag.setAttribute('rel', 'canonical');
      canonicalTag.setAttribute('href', 'https://ajtravelsagency.vercel.app/sitemap');
      document.head.appendChild(canonicalTag);
    }

    const schemaId = 'sitemap-page-schema';
    let scriptTag = document.getElementById(schemaId);
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = schemaId;
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }

    const schemaData = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebPage',
          '@id': 'https://ajtravelsagency.vercel.app/sitemap#webpage',
          'url': 'https://ajtravelsagency.vercel.app/sitemap',
          'name': 'Sitemap | Complete Website Directory - AJ Travels Pune',
          'description': 'Customer-friendly directory of verified intercity cab services, vehicle fleet options, fare calculators, travel guides, and company support.',
          'breadcrumb': {
            '@type': 'BreadcrumbList',
            'itemListElement': [
              {
                '@type': 'ListItem',
                'position': 1,
                'name': 'Home',
                'item': 'https://ajtravelsagency.vercel.app/'
              },
              {
                '@type': 'ListItem',
                'position': 2,
                'name': 'Sitemap',
                'item': 'https://ajtravelsagency.vercel.app/sitemap'
              }
            ]
          }
        }
      ]
    };

    scriptTag.text = JSON.stringify(schemaData);

    return () => {
      const tag = document.getElementById(schemaId);
      if (tag) tag.remove();
    };
  }, []);

  // Filter sections when user types into the search field
  const filteredSections = useMemo(() => {
    const q = filterQuery.trim().toLowerCase();
    if (!q) return sections;

    return sections
      .map(section => {
        let matchingItems = [];
        if (section.items) {
          matchingItems = section.items.filter(
            item =>
              item.title.toLowerCase().includes(q) ||
              item.path.toLowerCase().includes(q)
          );
        }

        let matchingSubSections = [];
        if (section.subSections) {
          matchingSubSections = section.subSections
            .map(sub => {
              const subItems = sub.items.filter(
                item =>
                  item.title.toLowerCase().includes(q) ||
                  item.path.toLowerCase().includes(q)
              );
              if (subItems.length === 0) return null;
              return { ...sub, items: subItems };
            })
            .filter(Boolean);
        }

        if (matchingItems.length === 0 && matchingSubSections.length === 0) {
          return null;
        }

        return {
          ...section,
          items: matchingItems.length > 0 ? matchingItems : undefined,
          subSections: matchingSubSections.length > 0 ? matchingSubSections : undefined
        };
      })
      .filter(Boolean);
  }, [sections, filterQuery]);

  const totalMatches = useMemo(() => {
    let count = 0;
    filteredSections.forEach(sec => {
      if (sec.items) count += sec.items.length;
      if (sec.subSections) {
        sec.subSections.forEach(sub => (count += sub.items.length));
      }
    });
    return count;
  }, [filteredSections]);

  return (
    <div className="sitemap-page">
      <Header onOpenEnquiry={() => setIsEnquiryOpen(true)} isDark={false} />

      <main className="sitemap-content-area">
        <div className="sitemap-container">
          {/* Breadcrumb Navigation */}
          <nav className="sitemap-breadcrumb" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <span className="crumb-sep">/</span>
            <span className="crumb-active">Sitemap</span>
          </nav>

          {/* Clean, Balanced Page Header */}
          <header className="sitemap-header">
            <div className="sitemap-header-text">
              <h1 className="sitemap-title">Sitemap</h1>
              <p className="sitemap-subtitle">
                Browse our complete directory of {allLinks.length} verified public pages, including intercity cab services, vehicle fleet options, fare calculators, locality rentals, and published Maharashtra travel guides.
              </p>
            </div>

            {/* Modest, Non-Intrusive Search Field & XML Notice */}
            <div className="sitemap-header-tools">
              <div className="search-box">
                <Search size={16} className="search-icon" aria-hidden="true" />
                <input
                  type="text"
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  placeholder="Filter pages by keyword..."
                  className="search-input"
                  aria-label="Filter sitemap pages"
                />
                {filterQuery && (
                  <button
                    type="button"
                    onClick={() => setFilterQuery('')}
                    className="search-clear-btn"
                    aria-label="Clear filter"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="xml-sitemap-note">
                <span>Looking for search engines?</span>{' '}
                <a
                  href="/sitemap.xml"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="xml-link"
                >
                  View XML sitemap (sitemap.xml) <ExternalLink size={11} aria-hidden="true" />
                </a>
              </div>
            </div>
          </header>

          {/* Active Search Result Notification */}
          {filterQuery && (
            <div className="search-feedback-bar">
              <span>
                Showing <strong>{totalMatches}</strong> of {allLinks.length} pages matching &ldquo;{filterQuery}&rdquo;
              </span>
              <button
                type="button"
                onClick={() => setFilterQuery('')}
                className="btn-reset-inline"
              >
                Clear filter
              </button>
            </div>
          )}

          {/* Sitemap Sections */}
          {filteredSections.length > 0 ? (
            <div className="sitemap-sections-list">
              {filteredSections.map((section) => (
                <section
                  key={section.id}
                  id={section.id}
                  className="sitemap-section-card"
                  aria-labelledby={`heading-${section.id}`}
                >
                  <div className="section-header">
                    <h2 id={`heading-${section.id}`} className="section-heading">
                      {section.title}
                    </h2>
                    {section.description && (
                      <p className="section-description">{section.description}</p>
                    )}
                  </div>

                  {/* Direct Items List (if section has no sub-sections) */}
                  {section.items && section.items.length > 0 && (
                    <ul className="sitemap-links-list">
                      {section.items.map((item) => (
                        <li key={item.path} className="sitemap-link-item">
                          <Link to={item.path} className="sitemap-anchor">
                            <ChevronRight size={13} className="bullet-chevron" aria-hidden="true" />
                            <span className="anchor-label">{item.title}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Sub-Sections List (for grouped categories like Services or Locality Rentals) */}
                  {section.subSections && section.subSections.length > 0 && (
                    <div className="sitemap-subsections-grid">
                      {section.subSections.map((sub) => (
                        <div key={sub.name} className="sitemap-subsection">
                          <h3 className="subsection-title">
                            {sub.name}{' '}
                            <span className="subsection-count">({sub.items.length})</span>
                          </h3>
                          <ul className="sitemap-links-list">
                            {sub.items.map((item) => (
                              <li key={item.path} className="sitemap-link-item">
                                <Link to={item.path} className="sitemap-anchor">
                                  <ChevronRight size={13} className="bullet-chevron" aria-hidden="true" />
                                  <span className="anchor-label">{item.title}</span>
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              ))}
            </div>
          ) : (
            <div className="empty-search-state">
              <p>No verified pages found matching &ldquo;{filterQuery}&rdquo;.</p>
              <button
                type="button"
                onClick={() => setFilterQuery('')}
                className="btn-reset-search"
              >
                Reset Filter &amp; Show All {allLinks.length} Pages
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <Footer />

      {/* Booking Enquiry Modal */}
      <EnquiryModal isOpen={isEnquiryOpen} onClose={() => setIsEnquiryOpen(false)} />

      {/* Mobile Sticky Bar */}
      <MobileStickyBar onOpenEnquiry={() => setIsEnquiryOpen(true)} />

      <style>{`
        /* ── Page Base ── */
        .sitemap-page {
          min-height: 100vh;
          background: #F8FAFC;
          color: #1E293B;
          display: flex;
          flex-direction: column;
        }

        .sitemap-content-area {
          flex: 1;
          padding-top: 5.5rem;
          padding-bottom: 4rem;
        }

        .sitemap-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1.25rem;
        }

        /* ── Breadcrumb Navigation ── */
        .sitemap-breadcrumb {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          color: #64748B;
          margin-bottom: 1.25rem;
        }

        .sitemap-breadcrumb a {
          color: #0284C7;
          text-decoration: none;
          font-weight: 500;
        }

        .sitemap-breadcrumb a:hover {
          text-decoration: underline;
        }

        .crumb-sep {
          color: #94A3B8;
        }

        .crumb-active {
          color: #334155;
          font-weight: 600;
        }

        /* ── Header ── */
        .sitemap-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 1.75rem;
          border-bottom: 1px solid #E2E8F0;
          padding-bottom: 1.5rem;
          margin-bottom: 2rem;
          flex-wrap: wrap;
        }

        .sitemap-header-text {
          max-width: 680px;
        }

        .sitemap-title {
          font-family: var(--font-heading, 'Outfit', sans-serif);
          font-size: 2.15rem;
          font-weight: 700;
          color: #0F172A;
          margin: 0 0 0.5rem;
          letter-spacing: -0.02em;
        }

        .sitemap-subtitle {
          font-size: 0.95rem;
          color: #475569;
          line-height: 1.6;
          margin: 0;
        }

        .sitemap-header-tools {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 0.5rem;
        }

        /* ── Small Search Box ── */
        .search-box {
          position: relative;
          display: flex;
          align-items: center;
          width: 290px;
        }

        .search-icon {
          position: absolute;
          left: 0.75rem;
          color: #94A3B8;
          pointer-events: none;
        }

        .search-input {
          width: 100%;
          padding: 0.55rem 2rem 0.55rem 2.25rem;
          background: #FFFFFF;
          border: 1px solid #CBD5E1;
          border-radius: 8px;
          color: #0F172A;
          font-size: 0.88rem;
          outline: none;
          transition: all 0.15s ease;
        }

        .search-input::placeholder {
          color: #94A3B8;
        }

        .search-input:focus {
          border-color: #0284C7;
          box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.15);
        }

        .search-clear-btn {
          position: absolute;
          right: 0.6rem;
          background: #E2E8F0;
          border: none;
          color: #475569;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .search-clear-btn:hover {
          background: #CBD5E1;
        }

        .xml-sitemap-note {
          font-size: 0.78rem;
          color: #64748B;
        }

        .xml-link {
          color: #0284C7;
          text-decoration: none;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 0.2rem;
        }

        .xml-link:hover {
          text-decoration: underline;
        }

        /* ── Filter Feedback Bar ── */
        .search-feedback-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #EFF6FF;
          border: 1px solid #BFDBFE;
          border-radius: 8px;
          padding: 0.55rem 1rem;
          font-size: 0.85rem;
          color: #1E40AF;
          margin-bottom: 1.5rem;
        }

        .btn-reset-inline {
          background: none;
          border: none;
          color: #0284C7;
          font-weight: 600;
          font-size: 0.82rem;
          cursor: pointer;
          text-decoration: underline;
        }

        /* ── Section Cards ── */
        .sitemap-sections-list {
          display: flex;
          flex-direction: column;
          gap: 1.75rem;
        }

        .sitemap-section-card {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          padding: 1.75rem 2rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
        }

        .section-header {
          border-bottom: 1px solid #F1F5F9;
          padding-bottom: 0.85rem;
          margin-bottom: 1.25rem;
        }

        .section-heading {
          font-family: var(--font-heading, 'Outfit', sans-serif);
          font-size: 1.25rem;
          font-weight: 700;
          color: #0F172A;
          margin: 0 0 0.25rem;
          letter-spacing: -0.01em;
        }

        .section-description {
          font-size: 0.85rem;
          color: #64748B;
          margin: 0;
        }

        /* ── Links Grid / Columns ── */
        .sitemap-links-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 0.65rem 1.75rem;
        }

        .sitemap-link-item {
          display: flex;
          align-items: center;
        }

        .sitemap-anchor {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          color: #334155;
          text-decoration: none;
          font-size: 0.9rem;
          line-height: 1.45;
          padding: 0.2rem 0;
          transition: all 0.15s ease;
        }

        .bullet-chevron {
          color: #94A3B8;
          flex-shrink: 0;
          transition: transform 0.15s ease, color 0.15s ease;
        }

        .anchor-label {
          font-weight: 450;
        }

        .sitemap-anchor:hover {
          color: #0284C7;
        }

        .sitemap-anchor:hover .bullet-chevron {
          color: #0284C7;
          transform: translateX(2px);
        }

        /* ── Subsections (within Services, Locality, etc.) ── */
        .sitemap-subsections-grid {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .sitemap-subsection {
          padding-top: 0.25rem;
        }

        .subsection-title {
          font-size: 0.95rem;
          font-weight: 600;
          color: #0F172A;
          margin: 0 0 0.85rem;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .subsection-count {
          font-size: 0.78rem;
          color: #64748B;
          font-weight: 500;
        }

        /* ── Empty Search State ── */
        .empty-search-state {
          background: #FFFFFF;
          border: 1px solid #E2E8F0;
          border-radius: 12px;
          padding: 3rem 1.5rem;
          text-align: center;
          color: #64748B;
        }

        .btn-reset-search {
          margin-top: 1rem;
          background: #0284C7;
          color: #FFFFFF;
          border: none;
          padding: 0.6rem 1.25rem;
          border-radius: 6px;
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s ease;
        }

        .btn-reset-search:hover {
          background: #0369A1;
        }

        /* ── Responsive Styling ── */
        @media (max-width: 900px) {
          .sitemap-links-list {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .sitemap-content-area {
            padding-top: 5rem;
            padding-bottom: 6rem;
          }

          .sitemap-header {
            flex-direction: column;
            align-items: stretch;
            gap: 1.25rem;
          }

          .sitemap-header-tools {
            width: 100%;
          }

          .search-box {
            width: 100%;
          }

          .sitemap-title {
            font-size: 1.85rem;
          }

          .sitemap-section-card {
            padding: 1.25rem;
          }

          .sitemap-links-list {
            grid-template-columns: 1fr;
            gap: 0.5rem;
          }

          .sitemap-anchor {
            padding: 0.35rem 0; /* Enhanced touch target size */
          }
        }
      `}</style>
    </div>
  );
}
