import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { EnquiryModal } from '../components/EnquiryModal';
import { MobileStickyBar } from '../components/MobileStickyBar';
import { usePageSeo } from '../hooks/usePageSeo';
import { blogApi, normalizeBlogPost } from '../services/api';
import { businessConfig } from '../config/business.config';
import { getLocationDisplayName } from '../utils/locationNames';
import './blogPost.css';
import { 
  Clock, 
  Calendar, 
  User, 
  ArrowLeft, 
  Car, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  HelpCircle,
  AlertCircle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

export function BlogPostPage({ isRootFallback = false }) {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);

  const cleanSlug = slug ? slug.replace(/^\/|\/$/g, '') : '';

  const [post, setPost] = useState(null);
  const [allPosts, setAllPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(false);

  const loadArticle = async () => {
    if (!cleanSlug) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setNotFound(false);

    try {
      const [articleRes, allRes] = await Promise.all([
        blogApi.getBySlug(cleanSlug).catch((err) => {
          if (err.response?.status === 404) return { is404: true };
          throw err;
        }),
        blogApi.getAll().catch(() => ({ data: { data: [] } })),
      ]);

      if (articleRes?.is404 || !articleRes?.data?.data) {
        setNotFound(true);
      } else {
        const normalized = normalizeBlogPost(articleRes.data.data);
        setPost(normalized);
        const normalizedAll = (allRes.data?.data || []).map(normalizeBlogPost);
        setAllPosts(normalizedAll);
      }
    } catch (err) {
      console.error('Error fetching blog article:', err);
      setError(err.response?.data?.message || 'Failed to load article from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArticle();
  }, [cleanSlug]);

  // Page SEO: sets title and meta description
  usePageSeo(
    post ? `post_${post.slug}` : 'post_not_found',
    post ? (post.metaTitle || `${post.title} | AJ Travels`) : 'Article Not Found | AJ Travels Blog',
    post ? (post.metaDesc || post.summary) : 'Travel guide and intercity cab advice from AJ Travels.',
    post ? `https://ajtravelsagency.vercel.app/${post.slug}/` : undefined
  );

  // Structured Data (BlogPosting, BreadcrumbList, and conditional FAQPage)
  useEffect(() => {
    if (!post) return;

    const schemaId = 'blog-post-schema';
    const breadcrumbSchemaId = 'blog-breadcrumb-schema';
    const faqSchemaId = 'blog-faq-schema';

    // 1. BlogPosting Schema
    let scriptTag = document.getElementById(schemaId);
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = schemaId;
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }

    const postCanonical = `https://ajtravelsagency.vercel.app/${post.slug}/`;
    const imageUrl = post.featuredImage?.startsWith('http')
      ? post.featuredImage
      : `https://ajtravelsagency.vercel.app${post.featuredImage}`;

    const schemaData = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      'headline': post.title,
      'description': post.metaDesc || post.summary,
      'image': imageUrl,
      'author': {
        '@type': 'Organization',
        'name': post.author || 'AJ Travels Editorial Team',
      },
      'publisher': {
        '@type': 'Organization',
        'name': 'AJ Travels',
        'logo': {
          '@type': 'ImageObject',
          'url': 'https://ajtravelsagency.vercel.app/assets/aj-travels-logo.png',
        },
      },
      'datePublished': post.publishedAt ? post.publishedAt.split('T')[0] : '2026-03-15',
      'dateModified': post.updatedAt ? post.updatedAt.split('T')[0] : '2026-03-15',
      'mainEntityOfPage': {
        '@type': 'WebPage',
        '@id': postCanonical,
      },
    };

    scriptTag.text = JSON.stringify(schemaData);

    // 2. BreadcrumbList Schema
    let bcScript = document.getElementById(breadcrumbSchemaId);
    if (!bcScript) {
      bcScript = document.createElement('script');
      bcScript.id = breadcrumbSchemaId;
      bcScript.type = 'application/ld+json';
      document.head.appendChild(bcScript);
    }
    const bcData = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      'itemListElement': [
        {
          '@type': 'ListItem',
          'position': 1,
          'name': 'Home',
          'item': 'https://ajtravelsagency.vercel.app/',
        },
        {
          '@type': 'ListItem',
          'position': 2,
          'name': 'Blog',
          'item': 'https://ajtravelsagency.vercel.app/blog/',
        },
        {
          '@type': 'ListItem',
          'position': 3,
          'name': post.title,
          'item': postCanonical,
        },
      ],
    };
    bcScript.text = JSON.stringify(bcData);

    // 3. FAQPage Schema (Only injected if genuine FAQs exist)
    if (post.faqs && post.faqs.length > 0) {
      let faqScript = document.getElementById(faqSchemaId);
      if (!faqScript) {
        faqScript = document.createElement('script');
        faqScript.id = faqSchemaId;
        faqScript.type = 'application/ld+json';
        document.head.appendChild(faqScript);
      }
      const faqData = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        'mainEntity': post.faqs.map((f) => ({
          '@type': 'Question',
          'name': f.q,
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': f.a,
          },
        })),
      };
      faqScript.text = JSON.stringify(faqData);
    } else {
      const existingFaqScript = document.getElementById(faqSchemaId);
      if (existingFaqScript) existingFaqScript.remove();
    }

    // Maintain document canonical tag (enforce single canonical tag)
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
      // Clean up stale JSON-LD scripts on route change
      const t1 = document.getElementById(schemaId);
      if (t1) t1.remove();
      const t2 = document.getElementById(breadcrumbSchemaId);
      if (t2) t2.remove();
      const t3 = document.getElementById(faqSchemaId);
      if (t3) t3.remove();
    };
  }, [post]);

  // ============================================================
  // 1. LOADING SKELETON STATE (Zero Static Flash)
  // ============================================================
  if (loading) {
    return (
      <div className="blog-detail-wrapper" aria-busy="true" aria-label="Loading travel guide">
        <Header onOpenEnquiry={() => setIsEnquiryOpen(true)} isDark={false} />

        {/* Skeleton Breadcrumbs Strip */}
        <section className="article-breadcrumbs-strip">
          <div className="container">
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <div className="skeleton-box" style={{ width: '50px', height: '16px' }} />
              <span style={{ color: '#94A3B8' }}>/</span>
              <div className="skeleton-box" style={{ width: '40px', height: '16px' }} />
              <span style={{ color: '#94A3B8' }}>/</span>
              <div className="skeleton-box" style={{ width: '180px', height: '16px' }} />
            </div>
          </div>
        </section>

        {/* 2-Column Skeleton Editorial Layout */}
        <article className="article-main-container">
          <div className="container">
            <div className="article-2col-layout">
              {/* Left Column Skeleton */}
              <div className="article-main-col">
                <header className="article-header">
                  <div className="skeleton-box" style={{ width: '130px', height: '24px', borderRadius: '6px', marginBottom: '1rem' }} />
                  <div className="skeleton-box" style={{ width: '92%', height: '38px', marginBottom: '0.65rem' }} />
                  <div className="skeleton-box" style={{ width: '75%', height: '38px', marginBottom: '1.25rem' }} />
                  <div className="skeleton-box" style={{ width: '100%', height: '20px', marginBottom: '0.5rem' }} />
                  <div className="skeleton-box" style={{ width: '88%', height: '20px', marginBottom: '1.5rem' }} />

                  <div style={{ display: 'flex', gap: '1rem', paddingBottom: '1.5rem', borderBottom: '1px solid #F1F5F9' }}>
                    <div className="skeleton-box" style={{ width: '140px', height: '20px' }} />
                    <div className="skeleton-box" style={{ width: '100px', height: '20px' }} />
                    <div className="skeleton-box" style={{ width: '80px', height: '20px' }} />
                  </div>
                </header>

                {/* Hero Photo Skeleton */}
                <div className="skeleton-box" style={{ width: '100%', height: '380px', borderRadius: '16px', margin: '2rem 0' }} />

                {/* Callout Skeleton */}
                <div className="skeleton-box" style={{ width: '100%', height: '80px', borderRadius: '12px', marginBottom: '2rem' }} />

                {/* Content Prose Skeletons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', margin: '2rem 0' }}>
                  <div className="skeleton-box" style={{ width: '100%', height: '18px' }} />
                  <div className="skeleton-box" style={{ width: '96%', height: '18px' }} />
                  <div className="skeleton-box" style={{ width: '92%', height: '18px' }} />
                  <div className="skeleton-box" style={{ width: '60%', height: '30px', margin: '1.5rem 0 0.5rem' }} />
                  <div className="skeleton-box" style={{ width: '100%', height: '18px' }} />
                  <div className="skeleton-box" style={{ width: '94%', height: '18px' }} />
                  <div className="skeleton-box" style={{ width: '100%', height: '140px', borderRadius: '12px', margin: '1rem 0' }} />
                </div>
              </div>

              {/* Right Column Sidebar Skeleton */}
              <aside className="article-sidebar-col">
                <div className="skeleton-box" style={{ width: '100%', height: '360px', borderRadius: '16px' }} />
              </aside>
            </div>
          </div>
        </article>

        <Footer />
        <style>{`
          @keyframes blogPulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.45; }
          }
          .skeleton-box {
            background: #E2E8F0;
            border-radius: 6px;
            animation: blogPulse 1.6s ease-in-out infinite;
          }
        `}</style>
      </div>
    );
  }

  // ============================================================
  // 2. ERROR STATE (With Retry Button)
  // ============================================================
  if (error) {
    return (
      <div className="blog-detail-wrapper">
        <Header onOpenEnquiry={() => setIsEnquiryOpen(true)} isDark={false} />
        <div className="container" style={{ padding: '6rem 1rem', textAlign: 'center' }}>
          <AlertCircle size={44} color="#EF4444" style={{ margin: '0 auto 1rem' }} />
          <h2>Unable to Load Travel Guide</h2>
          <p style={{ color: '#64748B', margin: '1rem auto 2rem', maxWidth: '480px' }}>
            {error}
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button type="button" onClick={loadArticle} className="btn-retry-blog">
              <RefreshCw size={15} />
              <span>Retry</span>
            </button>
            <Link to="/blog" className="btn-back-blog">
              <ArrowLeft size={16} />
              <span>Return to All Travel Guides</span>
            </Link>
          </div>
        </div>
        <Footer />
        <style>{`
          .btn-retry-blog {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            background: #2563EB;
            color: #FFFFFF;
            padding: 0.65rem 1.35rem;
            border-radius: 10px;
            font-size: 0.88rem;
            font-weight: 700;
            border: none;
            cursor: pointer;
          }
        `}</style>
      </div>
    );
  }

  // ============================================================
  // 3. NOT FOUND / UNPUBLISHED STATE
  // ============================================================
  if (notFound || !post) {
    return (
      <div className="blog-detail-wrapper">
        <Header onOpenEnquiry={() => setIsEnquiryOpen(true)} isDark={false} />
        <div className="container" style={{ padding: '6rem 1rem', textAlign: 'center' }}>
          <h2>Article Not Found</h2>
          <p style={{ color: '#64748B', margin: '1rem 0 2rem' }}>
            The travel guide you requested does not exist, may be an unpublished draft, or has been updated.
          </p>
          <Link to="/blog" className="btn-back-blog">
            <ArrowLeft size={16} />
            <span>Return to All Travel Guides</span>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  // Booking Corridor Logic
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
      dropName: dName,
    });
    navigate(`/fare?${params.toString()}`);
  };

  // Resolve related published articles strictly from active database articles
  const related = (post.relatedPosts || [])
    .map((rSlug) => allPosts.find((p) => p.slug === rSlug && p.slug !== post.slug))
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
                  alt={post.imageAlt || post.title} 
                  className="article-featured-photo"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.src = '/assets/pune-to-mumbai-premium-travel-banner.webp';
                  }}
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

              {/* Render Structured Content Blocks */}
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
                    if (Number(block.level) === 2 || !block.level) {
                      return <h2 key={idx} className="prose-h2">{block.title}</h2>;
                    }
                    return <h3 key={idx} className="prose-h3">{block.title}</h3>;
                  }

                  if (block.type === 'points') {
                    return (
                      <div key={idx} className="prose-points-box">
                        {block.title && <h4 className="points-box-title">{block.title}</h4>}
                        <ul className="prose-bullets-list">
                          {(block.items || []).map((item, i) => (
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
                              {(block.headers || []).map((h, i) => <th key={i}>{h}</th>)}
                            </tr>
                          </thead>
                          <tbody>
                            {(block.rows || []).map((row, rIdx) => (
                              <tr key={rIdx}>
                                {row.map((cell, cIdx) => <td key={cIdx}>{cell}</td>)}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  }

                  if (block.type === 'image') {
                    return (
                      <div key={idx} className="prose-inline-img-box" style={{ margin: '2rem 0', textAlign: 'center' }}>
                        <img 
                          src={block.url} 
                          alt={block.alt || 'Inline guide illustration'} 
                          style={{ maxWidth: '100%', borderRadius: '12px' }}
                        />
                        {block.caption && (
                          <span style={{ display: 'block', fontSize: '0.8rem', color: '#64748B', marginTop: '0.4rem' }}>
                            {block.caption}
                          </span>
                        )}
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

              {/* Authoritative FAQ Accordion Section */}
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

              {/* Related Articles Section */}
              {related.length > 0 && (
                <div className="article-related-section" style={{ marginTop: '3rem', borderTop: '1px solid #E2E8F0', paddingTop: '2.5rem' }}>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0F172A', marginBottom: '1.25rem' }}>
                    Related Travel Guides
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
                    {related.map((rel) => (
                      <article key={rel.slug} style={{ border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#FFFFFF' }}>
                        <Link to={`/blog/${rel.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
                          <img 
                            src={rel.featuredImage} 
                            alt={rel.title} 
                            style={{ width: '100%', height: '140px', objectFit: 'cover' }}
                            onError={(e) => {
                              e.currentTarget.src = '/assets/pune-to-mumbai-premium-travel-banner.webp';
                            }}
                          />
                          <div style={{ padding: '1rem' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#2563EB', textTransform: 'uppercase' }}>
                              {rel.category}
                            </span>
                            <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0F172A', margin: '0.35rem 0 0', lineHeight: 1.4 }}>
                              {rel.title}
                            </h4>
                          </div>
                        </Link>
                      </article>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Sticky Sidebar Booking Card & Highway Specs */}
            <aside className="article-sidebar-col">
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
                  <span>Check Fare &amp; Availability</span>
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
            </aside>
          </div>
        </div>
      </article>

      <Footer />
      <MobileStickyBar onOpenEnquiry={() => setIsEnquiryOpen(true)} />
      <EnquiryModal isOpen={isEnquiryOpen} onClose={() => setIsEnquiryOpen(false)} />
    </div>
  );
}
