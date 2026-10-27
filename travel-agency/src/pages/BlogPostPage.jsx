import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { EnquiryModal } from '../components/EnquiryModal';
import { MobileStickyBar } from '../components/MobileStickyBar';
import { usePageSeo } from '../hooks/usePageSeo';
import { getPostBySlug, blogPosts } from '../data/blogData';
import { businessConfig } from '../config/business.config';
import { getLocationDisplayName } from '../utils/locationNames';
import { 
  Clock, 
  Calendar, 
  User, 
  ArrowLeft, 
  Car, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  ChevronRight,
  HelpCircle,
  Share2
} from 'lucide-react';

export function BlogPostPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);

  const cleanSlug = slug ? slug.replace(/^\/|\/$/g, '') : '';
  const post = getPostBySlug(cleanSlug);

  usePageSeo(
    post ? `post_${post.slug}` : 'post_not_found',
    post ? post.metaTitle : 'Article Not Found | AJ Travels Blog',
    post ? post.metaDesc : 'Travel guide and intercity cab advice from AJ Travels.',
    post ? `https://ajtravelspune.com/${post.slug}/` : undefined
  );

  // Inject BlogPosting JSON-LD structured data into head
  useEffect(() => {
    if (!post) return;

    const schemaId = 'blog-post-schema';
    let scriptTag = document.getElementById(schemaId);
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = schemaId;
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }

    const schemaData = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      'headline': post.title,
      'description': post.metaDesc,
      'image': `https://ajtravelspune.com${post.featuredImage}`,
      'author': {
        '@type': 'Organization',
        'name': post.author
      },
      'publisher': {
        '@type': 'Organization',
        'name': 'AJ Travels',
        'logo': {
          '@type': 'ImageObject',
          'url': 'https://ajtravelspune.com/assets/hero-luxury-cars.jpg'
        }
      },
      'datePublished': '2026-03-15',
      'dateModified': '2026-03-15',
      'mainEntityOfPage': {
        '@type': 'WebPage',
        '@id': `https://ajtravelspune.com/blog/${post.slug}`
      }
    };

    scriptTag.text = JSON.stringify(schemaData);

    // Maintain document canonical tag
    const postCanonical = `https://ajtravelspune.com/${post.slug}/`;
    const canonicalTags = document.querySelectorAll('link[rel="canonical"]');
    if (canonicalTags.length > 0) {
      canonicalTags[0].setAttribute('href', postCanonical);
      for (let i = 1; i < canonicalTags.length; i++) {
        canonicalTags[i].remove();
      }
    } else {
      const canonicalTag = document.createElement('link');
      canonicalTag.setAttribute('rel', 'canonical');
      canonicalTag.setAttribute('href', postCanonical);
      document.head.appendChild(canonicalTag);
    }

    return () => {
      const tag = document.getElementById(schemaId);
      if (tag) tag.remove();
    };
  }, [post]);

  if (!post) {
    return (
      <div className="blog-detail-wrapper">
        <Header onOpenEnquiry={() => setIsEnquiryOpen(true)} isDark={false} />
        <div className="container" style={{ padding: '6rem 1rem', textAlign: 'center' }}>
          <h2>Article Not Found</h2>
          <p style={{ color: '#64748B', margin: '1rem 0 2rem' }}>The travel guide you requested does not exist or may have been updated.</p>
          <Link to="/blog" className="btn-back-blog">
            <ArrowLeft size={16} />
            <span>Return to All Travel Guides</span>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const pId = post.pickupDefault || 'pune';
  const dId = post.dropDefault || 'mumbai';
  const isPuneMumbaiCorridor =
    (post.slug?.includes('pune-to-mumbai') || post.slug?.includes('mumbai-to-pune')) &&
    Boolean(post.dropDefault) &&
    ((pId === 'pune' && dId === 'mumbai') || (pId === 'mumbai' && dId === 'pune'));

  const handleBookNow = () => {
    const pName = getLocationDisplayName(pId);
    const dName = getLocationDisplayName(dId);
    const params = new URLSearchParams({
      tripType: 'ONE_WAY',
      pickupId: pId,
      dropId: dId,
      pickupName: pName,
      dropName: dName
    });
    navigate(`/fare?${params.toString()}`);
  };

  const related = (post.relatedPosts || [])
    .map(rSlug => getPostBySlug(rSlug))
    .filter(Boolean);

  return (
    <div className="blog-detail-wrapper">
      <Header onOpenEnquiry={() => setIsEnquiryOpen(true)} isDark={false} />

      {/* Breadcrumbs Strip */}
      <section className="article-breadcrumbs-strip">
        <div className="container">
          <div className="breadcrumbs-nav">
            <Link to="/">Home</Link>
            <span className="bc-sep">/</span>
            <Link to="/blog">Blog</Link>
            <span className="bc-sep">/</span>
            <span className="bc-current">{post.title}</span>
          </div>
        </div>
      </section>

      {/* Main 2-Column Editorial & Booking Layout */}
      <article className="article-main-container">
        <div className="container">
          <div className="article-2col-layout">
            {/* Left Column: Full Editorial Guide */}
            <div className="article-main-col">
              {/* Article Header */}
              <header className="article-header">
                <div className="article-category-chip">{post.category}</div>
                <h1 className="article-main-title">{post.title}</h1>
                <p className="article-main-summary">{post.summary}</p>

                <div className="article-author-meta-bar">
                  <div className="author-pill">
                    <User size={15} color="#2563EB" />
                    <span>{post.author}</span>
                  </div>
                  <div className="meta-split-dot">•</div>
                  <div className="meta-pill">
                    <Calendar size={14} />
                    <span>{post.publishedDate}</span>
                  </div>
                  <div className="meta-split-dot">•</div>
                  <div className="meta-pill">
                    <Clock size={14} />
                    <span>{post.readTime}</span>
                  </div>
                </div>
              </header>

              {/* Featured Cover Image */}
              <div className="article-hero-img-box">
                <img 
                  src={post.featuredImage} 
                  alt={post.title} 
                  className="article-featured-photo"
                />
              </div>

              {/* Quick Context Box / Key Takeaways */}
              <div className="key-takeaways-callout">
                <div className="callout-head">
                  <ShieldCheck size={20} color="#1D4ED8" />
                  <strong>Quick Route Summary</strong>
                </div>
                <p>
                  Travel with AJ Travels: 100% all-inclusive fares with tolls included, flight tracking for airport transfers, verified courteous drivers, and instant online fare calculator.
                </p>
              </div>

              {/* Render Structured Content */}
              <div className="article-prose">
                {post.content.map((block, idx) => {
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
                  if (block.type === 'table') {
                    return (
                      <div key={idx} className="prose-table-wrapper">
                        <table className="prose-table">
                          <thead>
                            <tr>
                              {block.headers.map((h, i) => <th key={i}>{h}</th>)}
                            </tr>
                          </thead>
                          <tbody>
                            {block.rows.map((row, rIdx) => (
                              <tr key={rIdx}>
                                {row.map((cell, cIdx) => <td key={cIdx}>{cell}</td>)}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>

              {/* Contextual High-Converting Booking Box */}
              <div className="article-booking-cta-card">
                <div className="cta-left">
                  <span className="cta-badge">INSTANT FARE QUOTE</span>
                  <h3>Planning a Trip on this Corridor?</h3>
                  <p>Check transparent vehicle rates with all expressway tolls included. Pay only what you see.</p>
                  <div className="cta-fleet-links">
                    <span>Recommended: </span>
                    <Link to="/vehicles/sedan">Sedan (Dzire)</Link> • 
                    <Link to="/vehicles/ertiga-suv">6-Seater SUV</Link> • 
                    <Link to="/vehicles/innova-crysta">Innova Crysta</Link>
                  </div>
                </div>
                <div className="cta-right">
                  <button 
                    type="button" 
                    onClick={handleBookNow}
                    className="btn-cta-calculate"
                  >
                    <Car size={18} />
                    <span>Calculate Cab Fare</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>

              {/* FAQ Accordion Section if present */}
              {post.faqs && post.faqs.length > 0 && (
                <div className="article-faqs-section">
                  <div className="faqs-head">
                    <HelpCircle size={22} color="#2563EB" />
                    <h3>Frequently Asked Questions</h3>
                  </div>
                  <div className="faqs-list">
                    {post.faqs.map((faq, idx) => (
                      <div key={idx} className="article-faq-item">
                        <h4 className="faq-question">{faq.q}</h4>
                        <p className="faq-answer">{faq.a}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Sticky Sidebar Booking Card & Highway Specs */}
            <aside className="article-sidebar-col">
              {/* Widget 1: Direct Cab Fare & Booking CTA */}
              <div className="sidebar-card sidebar-booking-card">
                <div className="sidebar-card-badge">DIRECT BOOKING</div>
                <h3 className="sidebar-card-title">Book Cab For This Route</h3>
                <div className="sidebar-corridor-pill">
                  <span className="corridor-point">{post.pickupDefault ? post.pickupDefault.toUpperCase() : 'PUNE'}</span>
                  <ArrowRight size={14} color="#1D4ED8" />
                  <span className="corridor-point">{post.dropDefault ? post.dropDefault.toUpperCase() : 'MUMBAI'}</span>
                </div>
                <p className="sidebar-card-desc">
                  {isPuneMumbaiCorridor
                    ? 'Doorstep pickup across Pune & Mumbai with verified drivers and 100% expressway toll-inclusive flat fares.'
                    : `Doorstep pickup from ${getLocationDisplayName(pId)} to ${getLocationDisplayName(dId)} with verified chauffeurs and all-inclusive pricing.`}
                </p>
                <button 
                  type="button" 
                  onClick={handleBookNow}
                  className="sidebar-btn-book"
                >
                  <Car size={16} />
                  <span>Check Fare & Availability</span>
                  <ArrowRight size={14} />
                </button>

                <div className="sidebar-desk-actions">
                  <a href={`tel:${businessConfig.phone}`} className="sidebar-desk-link call">
                    <span>📞 Call 24/7 Desk: {businessConfig.phoneDisplay}</span>
                  </a>
                  <a 
                    href={`https://wa.me/${businessConfig.whatsapp}?text=${encodeURIComponent(`Hi AJ Travels, I am reading your guide for "${post.title}" and would like to enquire about cab availability.`)}`}
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="sidebar-desk-link whatsapp"
                  >
                    <span>💬 Book on WhatsApp</span>
                  </a>
                </div>
              </div>

              {/* Widget 2: Route Quick Specs (Only shown on verified Pune-Mumbai Expressway routes) */}
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

              {/* Widget 3: Popular Guides List */}
              {related.length > 0 && (
                <div className="sidebar-card sidebar-related-card">
                  <h4 className="sidebar-specs-heading">Top Travel Guides</h4>
                  <div className="sidebar-guides-list">
                    {related.slice(0, 3).map((rel) => (
                      <Link key={rel.slug} to={`/blog/${rel.slug}`} className="sidebar-guide-item">
                        <img src={rel.featuredImage} alt={rel.title} className="sidebar-guide-thumb" />
                        <div className="sidebar-guide-info">
                          <span className="sidebar-guide-cat">{rel.category}</span>
                          <h5 className="sidebar-guide-title">{rel.title}</h5>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Widget 4: AJ Travels Guarantee Box */}
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

          {/* Full Width Related Articles Section */}
          {related.length > 0 && (
            <div className="article-related-posts-section">
              <h3 className="related-title">More Travel Guides & Routes</h3>
              <div className="related-grid">
                {related.map(rel => (
                  <Link key={rel.slug} to={`/blog/${rel.slug}`} className="related-card">
                    <img src={rel.featuredImage} alt={rel.title} className="related-img" />
                    <div className="related-body">
                      <span className="related-cat">{rel.category}</span>
                      <h4>{rel.title}</h4>
                      <span className="related-read-more">
                        Read Guide <ArrowRight size={12} />
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Back to Blog Button */}
          <div className="article-back-bar">
            <Link to="/blog" className="btn-back-blog">
              <ArrowLeft size={16} />
              <span>Back to All Travel Guides</span>
            </Link>
          </div>
        </div>
      </article>

      <Footer />
      <MobileStickyBar onOpenEnquiry={() => setIsEnquiryOpen(true)} />
      <EnquiryModal isOpen={isEnquiryOpen} onClose={() => setIsEnquiryOpen(false)} />

      <style>{`
        .blog-detail-wrapper {
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

        .article-main-container {
          padding: 2rem 0 4rem;
          background: #FFFFFF;
        }

        .article-header {
          text-align: left;
          margin-bottom: 1.5rem;
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
          font-size: 2.25rem;
          font-weight: 800;
          line-height: 1.25;
          color: #0F172A;
          margin-bottom: 0.85rem;
        }

        .article-main-summary {
          font-size: 1.08rem;
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
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(15, 23, 42, 0.06);
          border: 1px solid #E2E8F0;
          margin-bottom: 2rem;
          max-height: 380px;
          aspect-ratio: 16 / 9;
        }

        .article-featured-photo {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .key-takeaways-callout {
          background: #EFF6FF;
          border: 1px solid #BFDBFE;
          border-left: 4px solid #1D4ED8;
          border-radius: 12px;
          padding: 1.15rem 1.35rem;
          margin-bottom: 2rem;
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

        .prose-table-wrapper {
          overflow-x: auto;
          margin: 2rem 0;
          border-radius: 12px;
          border: 1px solid #E2E8F0;
        }

        .prose-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.92rem;
          text-align: left;
        }

        .prose-table th {
          background: #0F172A;
          color: #FFFFFF;
          padding: 0.85rem 1rem;
          font-weight: 700;
        }

        .prose-table td {
          padding: 0.85rem 1rem;
          border-bottom: 1px solid #E2E8F0;
          color: #334155;
        }

        .prose-table tr:last-child td {
          border-bottom: none;
        }

        .prose-table tr:nth-child(even) td {
          background: #F8FAFC;
        }

        /* Booking CTA Box */
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

        /* FAQ Section */
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

        /* Related Posts */
        .article-related-posts-section {
          margin-bottom: 3rem;
        }

        .related-title {
          font-size: 1.4rem;
          font-weight: 800;
          color: #0F172A;
          margin-bottom: 1.5rem;
        }

        .related-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
        }

        .related-card {
          background: #FFFFFF;
          border-radius: 14px;
          border: 1px solid #E2E8F0;
          overflow: hidden;
          text-decoration: none;
          transition: all 0.25s ease;
          display: flex;
          flex-direction: column;
        }

        .related-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
          border-color: #93C5FD;
        }

        .related-img {
          width: 100%;
          height: 140px;
          object-fit: cover;
        }

        .related-body {
          padding: 1rem;
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .related-cat {
          font-size: 0.68rem;
          font-weight: 800;
          color: #2563EB;
          text-transform: uppercase;
          margin-bottom: 0.35rem;
        }

        .related-body h4 {
          font-size: 0.95rem;
          font-weight: 700;
          color: #0F172A;
          line-height: 1.35;
          margin-bottom: 0.75rem;
          flex: 1;
        }

        .related-read-more {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          font-size: 0.78rem;
          font-weight: 700;
          color: #2563EB;
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

        .sidebar-guides-list {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }

        .sidebar-guide-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .sidebar-guide-item:hover .sidebar-guide-title {
          color: #2563EB;
        }

        .sidebar-guide-thumb {
          width: 64px;
          height: 48px;
          border-radius: 8px;
          object-fit: cover;
          flex-shrink: 0;
        }

        .sidebar-guide-info {
          min-width: 0;
        }

        .sidebar-guide-cat {
          font-size: 0.65rem;
          font-weight: 700;
          color: #2563EB;
          text-transform: uppercase;
          display: block;
        }

        .sidebar-guide-title {
          font-size: 0.82rem;
          font-weight: 700;
          color: #1E293B;
          line-height: 1.3;
          margin: 0.15rem 0 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
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
          .related-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
