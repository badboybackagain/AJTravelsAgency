import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { EnquiryModal } from '../components/EnquiryModal';
import { MobileStickyBar } from '../components/MobileStickyBar';
import { usePageSeo } from '../hooks/usePageSeo';
import { blogApi, normalizeBlogPost } from '../services/api';
import { 
  BookOpen, 
  Clock, 
  Calendar, 
  User, 
  ArrowRight, 
  Sparkles,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

export function BlogPage() {
  usePageSeo(
    'blog',
    'Travel Guides & Cab Rental Advice | AJ Travels Pune',
    'Read Maharashtra travel guides, Pune to Mumbai cab travel tips, Tempo Traveller rental advice, and weekend getaway itineraries from AJ Travels.',
    'https://ajtravelspune.com/blog/'
  );

  const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadPosts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await blogApi.getAll();
      const raw = res.data?.data || [];
      const normalized = raw.map(normalizeBlogPost);
      setPosts(normalized);
    } catch (err) {
      console.error('Error loading published blogs:', err);
      setError(err.response?.data?.message || 'Unable to connect to the blog service. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  // Compute categories dynamically from loaded published articles
  const categories = useMemo(() => {
    const set = new Set();
    posts.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    const dynamicList = [{ id: 'ALL', label: 'All Articles' }];
    Array.from(set).forEach((cat) => {
      dynamicList.push({ id: cat, label: cat });
    });
    return dynamicList;
  }, [posts]);

  // Filter articles based on selected category
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      return selectedCategory === 'ALL' || post.category === selectedCategory;
    });
  }, [posts, selectedCategory]);

  // Primary featured post: check for isFeatured flag, otherwise default to first post
  const featuredPost = useMemo(() => {
    if (posts.length === 0) return null;
    return posts.find((p) => p.isFeatured) || posts[0];
  }, [posts]);

  return (
    <div className="blog-page-wrapper">
      <Header onOpenEnquiry={() => setIsEnquiryOpen(true)} isDark={false} />

      {/* Internal Hero Banner */}
      <section className="internal-hero-section">
        <div className="container">
          <div className="breadcrumbs-nav">
            <Link to="/">Home</Link>
            <span className="bc-sep">/</span>
            <span className="bc-current">Blog &amp; Travel Guides</span>
          </div>

          <div className="internal-hero-content">
            <div className="hero-badge-pill">
              <Sparkles size={14} />
              <span>INSIGHTS, ADVICE &amp; ITINERARIES</span>
            </div>
            <h1 className="internal-hero-title">
              AJ Travels <span className="text-gradient">Travel Insights &amp; Guides</span>
            </h1>
            <p className="internal-hero-subtitle">
              Objective travel intelligence, Pune–Mumbai Expressway advice, weekend getaway recommendations, and vehicle rental tips curated by our highway travel specialists.
            </p>
          </div>
        </div>
      </section>

      {/* Filter Category Strip */}
      <section className="blog-controls-strip">
        <div className="container">
          <div className="controls-row">
            {/* Category Pills */}
            <div className="category-pills-list">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`cat-pill-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main Blog Grid Section */}
      <section className="blog-main-section">
        <div className="container">
          
          {/* ============================================================ */}
          {/* 1. LOADING SKELETON STATE (Zero Static Flash) */}
          {/* ============================================================ */}
          {loading && (
            <div aria-busy="true" aria-label="Loading blog articles">
              {/* Featured Article Skeleton */}
              <div className="featured-article-card skeleton-featured">
                <div className="featured-img-side skeleton-box" style={{ minHeight: '320px', borderRadius: '0' }} />
                <div className="featured-body-side">
                  <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                    <div className="skeleton-box" style={{ width: '110px', height: '22px', borderRadius: '9999px' }} />
                    <div className="skeleton-box" style={{ width: '80px', height: '22px', borderRadius: '6px' }} />
                    <div className="skeleton-box" style={{ width: '90px', height: '22px', borderRadius: '6px' }} />
                  </div>
                  <div className="skeleton-box" style={{ width: '85%', height: '32px', marginBottom: '0.75rem' }} />
                  <div className="skeleton-box" style={{ width: '65%', height: '32px', marginBottom: '1.25rem' }} />
                  <div className="skeleton-box" style={{ width: '100%', height: '18px', marginBottom: '0.5rem' }} />
                  <div className="skeleton-box" style={{ width: '92%', height: '18px', marginBottom: '1.75rem' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="skeleton-box" style={{ width: '130px', height: '24px', borderRadius: '6px' }} />
                    <div className="skeleton-box" style={{ width: '140px', height: '40px', borderRadius: '10px' }} />
                  </div>
                </div>
              </div>

              {/* 6 Grid Card Skeletons */}
              <div className="articles-grid">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="article-card skeleton-card">
                    <div className="skeleton-box" style={{ width: '100%', height: '200px', borderRadius: '0' }} />
                    <div className="article-card-body">
                      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <div className="skeleton-box" style={{ width: '70px', height: '16px', borderRadius: '4px' }} />
                        <div className="skeleton-box" style={{ width: '85px', height: '16px', borderRadius: '4px' }} />
                      </div>
                      <div className="skeleton-box" style={{ width: '90%', height: '22px', marginBottom: '0.5rem' }} />
                      <div className="skeleton-box" style={{ width: '70%', height: '22px', marginBottom: '0.85rem' }} />
                      <div className="skeleton-box" style={{ width: '100%', height: '14px', marginBottom: '0.4rem' }} />
                      <div className="skeleton-box" style={{ width: '85%', height: '14px', marginBottom: '1.25rem' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div className="skeleton-box" style={{ width: '100px', height: '16px', borderRadius: '4px' }} />
                        <div className="skeleton-box" style={{ width: '60px', height: '16px', borderRadius: '4px' }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* 2. ERROR STATE (With Retry Button) */}
          {/* ============================================================ */}
          {!loading && error && (
            <div className="blog-error-box">
              <AlertCircle size={44} color="#EF4444" style={{ margin: '0 auto 1rem' }} />
              <h3>Unable to load travel guides</h3>
              <p style={{ color: '#64748B', maxWidth: '480px', margin: '0.5rem auto 1.5rem', fontSize: '0.92rem' }}>
                {error}
              </p>
              <button type="button" onClick={loadPosts} className="btn-retry-blog">
                <RefreshCw size={15} />
                <span>Retry Loading Articles</span>
              </button>
            </div>
          )}

          {/* ============================================================ */}
          {/* 3. LOADED ARTICLES STATE */}
          {/* ============================================================ */}
          {!loading && !error && (
            <>
              {/* Featured Article Card (shown when looking at All) */}
              {selectedCategory === 'ALL' && featuredPost && (
                <div className="featured-article-card">
                  <div className="featured-img-side">
                    <img 
                      src={featuredPost.featuredImage} 
                      alt={featuredPost.imageAlt || featuredPost.title} 
                      className="featured-cover-img"
                    />
                    <span className="featured-floating-tag">FEATURED GUIDE</span>
                  </div>
                  <div className="featured-body-side">
                    <div className="post-meta-row">
                      <span className="post-category-badge">{featuredPost.category}</span>
                      <span className="post-meta-divider">•</span>
                      <span className="meta-item"><Clock size={13} /> {featuredPost.readTime}</span>
                      <span className="post-meta-divider">•</span>
                      <span className="meta-item"><Calendar size={13} /> {featuredPost.publishedDate}</span>
                    </div>

                    <h2 className="featured-title">
                      <Link to={`/blog/${featuredPost.slug}`}>{featuredPost.title}</Link>
                    </h2>

                    <p className="featured-excerpt">{featuredPost.summary}</p>

                    <div className="featured-bottom-row">
                      <div className="post-author-chip">
                        <User size={14} />
                        <span>{featuredPost.author}</span>
                      </div>
                      <Link to={`/blog/${featuredPost.slug}`} className="btn-read-featured">
                        <span>Read Full Guide</span>
                        <ArrowRight size={16} />
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Grid of Articles */}
              <div className="articles-grid">
                {filteredPosts.map((post) => (
                  <article key={post.slug} className="article-card">
                    <Link to={`/blog/${post.slug}`} className="article-img-link">
                      <img 
                        src={post.featuredImage} 
                        alt={post.imageAlt || post.title} 
                        className="article-img"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.src = '/assets/pune-to-mumbai-premium-travel-banner.webp';
                        }}
                      />
                      <span className="article-cat-badge">{post.category}</span>
                    </Link>

                    <div className="article-card-body">
                      <div className="card-meta-line">
                        <span className="meta-sub-item"><Clock size={12} /> {post.readTime}</span>
                        <span className="meta-sub-item"><Calendar size={12} /> {post.publishedDate}</span>
                      </div>

                      <h3 className="article-card-title">
                        <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                      </h3>

                      <p className="article-card-summary">{post.summary}</p>

                      <div className="article-card-footer">
                        <span className="author-small"><User size={12} /> {post.author}</span>
                        <Link to={`/blog/${post.slug}`} className="read-more-link">
                          <span>Read</span>
                          <ArrowRight size={13} />
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {filteredPosts.length === 0 && (
                <div className="no-posts-box">
                  <BookOpen size={36} color="#94A3B8" />
                  <h3>No articles found</h3>
                  <p>Choose another category to view available guides.</p>
                  <button 
                    type="button" 
                    onClick={() => setSelectedCategory('ALL')}
                    className="btn-reset-filters"
                  >
                    View All Guides
                  </button>
                </div>
              )}
            </>
          )}

        </div>
      </section>

      <Footer />
      <MobileStickyBar onOpenEnquiry={() => setIsEnquiryOpen(true)} />
      <EnquiryModal isOpen={isEnquiryOpen} onClose={() => setIsEnquiryOpen(false)} />

      <style>{`
        .blog-page-wrapper {
          min-height: 100vh;
          background: #FFFFFF;
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

        /* Controls Strip */
        .blog-controls-strip {
          background: #FFFFFF;
          border-bottom: 1px solid #E2E8F0;
          padding: 0.75rem 0;
          position: sticky;
          top: 0;
          z-index: 20;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
        }

        .controls-row {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .category-pills-list {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .cat-pill-btn {
          background: #F1F5F9;
          color: #475569;
          border: 1px solid #E2E8F0;
          padding: 0.45rem 0.95rem;
          border-radius: 9999px;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .cat-pill-btn:hover {
          background: #E2E8F0;
          color: #0F172A;
        }

        .cat-pill-btn.active {
          background: #2563EB;
          color: #FFFFFF;
          border-color: #2563EB;
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.25);
        }

        /* Blog Main Section */
        .blog-main-section {
          padding: 1.75rem 0 3.5rem;
          background: #F8FAFC;
        }

        /* Featured Article Card */
        .featured-article-card {
          background: #FFFFFF;
          border-radius: 20px;
          border: 1px solid #CBD5E1;
          overflow: hidden;
          display: grid;
          grid-template-columns: 1.1fr 1fr;
          margin-bottom: 2rem;
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.05);
          transition: all 0.3s ease;
        }

        .featured-article-card:hover {
          box-shadow: 0 16px 40px rgba(15, 23, 42, 0.1);
          border-color: #93C5FD;
        }

        .featured-img-side {
          position: relative;
          min-height: 320px;
        }

        .featured-cover-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .featured-floating-tag {
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

        .featured-body-side {
          padding: 2.5rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .post-meta-row {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          font-size: 0.8rem;
          color: #64748B;
          margin-bottom: 0.85rem;
          flex-wrap: wrap;
        }

        .post-category-badge {
          background: #EFF6FF;
          color: #1D4ED8;
          font-weight: 700;
          font-size: 0.75rem;
          padding: 0.25rem 0.65rem;
          border-radius: 6px;
          letter-spacing: 0.03em;
        }

        .post-meta-divider {
          color: #CBD5E1;
        }

        .meta-item {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
        }

        .featured-title {
          font-size: 1.6rem;
          font-weight: 800;
          line-height: 1.35;
          margin-bottom: 0.85rem;
          color: #0F172A;
        }

        .featured-title a {
          color: inherit;
          text-decoration: none;
          transition: color 0.2s;
        }

        .featured-title a:hover {
          color: #2563EB;
        }

        .featured-excerpt {
          font-size: 0.95rem;
          line-height: 1.65;
          color: #475569;
          margin-bottom: 1.5rem;
        }

        .featured-bottom-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 1.25rem;
          border-top: 1px solid #F1F5F9;
        }

        .post-author-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.82rem;
          font-weight: 600;
          color: #334155;
        }

        .btn-read-featured {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: #2563EB;
          color: #FFFFFF;
          padding: 0.65rem 1.25rem;
          border-radius: 10px;
          font-size: 0.88rem;
          font-weight: 700;
          text-decoration: none;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
        }

        .btn-read-featured:hover {
          background: #1D4ED8;
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(37, 99, 235, 0.35);
        }

        /* 3-Column Articles Grid */
        .articles-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1.5rem;
        }

        .article-card {
          background: #FFFFFF;
          border-radius: 16px;
          border: 1px solid #E2E8F0;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transition: all 0.25s ease;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
        }

        .article-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
          border-color: #BFDBFE;
        }

        .article-img-link {
          position: relative;
          display: block;
          height: 200px;
          overflow: hidden;
          background: #0F172A;
        }

        .article-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s ease;
        }

        .article-card:hover .article-img {
          transform: scale(1.05);
        }

        .article-cat-badge {
          position: absolute;
          bottom: 0.85rem;
          left: 0.85rem;
          background: rgba(15, 23, 42, 0.85);
          backdrop-filter: blur(4px);
          color: #FFFFFF;
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          padding: 0.25rem 0.65rem;
          border-radius: 4px;
        }

        .article-card-body {
          padding: 1.35rem;
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .card-meta-line {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.75rem;
          color: #64748B;
          margin-bottom: 0.65rem;
        }

        .meta-sub-item {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
        }

        .article-card-title {
          font-size: 1.1rem;
          font-weight: 700;
          line-height: 1.4;
          margin-bottom: 0.6rem;
          color: #0F172A;
        }

        .article-card-title a {
          color: inherit;
          text-decoration: none;
          transition: color 0.2s;
        }

        .article-card-title a:hover {
          color: #2563EB;
        }

        .article-card-summary {
          font-size: 0.86rem;
          line-height: 1.6;
          color: #475569;
          margin-bottom: 1.25rem;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
          flex: 1;
        }

        .article-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 0.85rem;
          border-top: 1px solid #F1F5F9;
        }

        .author-small {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          font-size: 0.75rem;
          font-weight: 600;
          color: #475569;
        }

        .read-more-link {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          font-size: 0.82rem;
          font-weight: 700;
          color: #2563EB;
          text-decoration: none;
        }

        .read-more-link:hover {
          color: #1D4ED8;
          text-decoration: underline;
        }

        /* Skeleton Pulse Styles */
        @keyframes blogPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }

        .skeleton-box {
          background: #E2E8F0;
          border-radius: 6px;
          animation: blogPulse 1.6s ease-in-out infinite;
        }

        .skeleton-featured {
          border-color: #E2E8F0;
          box-shadow: none;
        }

        .skeleton-card {
          border-color: #E2E8F0;
          box-shadow: none;
        }

        /* Error and Empty States */
        .blog-error-box {
          text-align: center;
          padding: 4.5rem 1.5rem;
          background: #FFFFFF;
          border-radius: 16px;
          border: 1px solid #FCA5A5;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.05);
        }

        .blog-error-box h3 {
          font-size: 1.35rem;
          font-weight: 800;
          color: #991B1B;
          margin: 0;
        }

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
          transition: all 0.2s ease;
        }

        .btn-retry-blog:hover {
          background: #1D4ED8;
          transform: translateY(-1px);
        }

        .no-posts-box {
          text-align: center;
          padding: 4rem 1rem;
          background: #FFFFFF;
          border-radius: 16px;
          border: 1px dashed #CBD5E1;
        }

        .no-posts-box h3 {
          font-size: 1.25rem;
          font-weight: 700;
          color: #0F172A;
          margin: 0.85rem 0 0.35rem;
        }

        .no-posts-box p {
          color: #64748B;
          font-size: 0.9rem;
          margin-bottom: 1.25rem;
        }

        .btn-reset-filters {
          background: #2563EB;
          color: #FFFFFF;
          border: none;
          padding: 0.55rem 1.15rem;
          border-radius: 8px;
          font-size: 0.82rem;
          font-weight: 700;
          cursor: pointer;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .articles-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .featured-article-card {
            grid-template-columns: 1fr;
          }
          .featured-img-side {
            min-height: 240px;
          }
          .featured-body-side {
            padding: 1.75rem;
          }
        }

        @media (max-width: 640px) {
          .articles-grid {
            grid-template-columns: 1fr;
          }
          .internal-hero-title {
            font-size: 1.75rem;
          }
        }
      `}</style>
    </div>
  );
}
