import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { EnquiryModal } from '../components/EnquiryModal';
import { MobileStickyBar } from '../components/MobileStickyBar';
import { usePageSeo } from '../hooks/usePageSeo';
import { blogPosts } from '../data/blogData';
import { 
  BookOpen, 
  Clock, 
  Calendar, 
  User, 
  ArrowRight, 
  Sparkles,
  Tag
} from 'lucide-react';

export function BlogPage() {
  usePageSeo(
    'blog',
    'AJ Travels Blog | Pune to Mumbai Cab Guides & Travel Advice',
    'Explore comprehensive travel guides, expressway tips, outstation getaway itineraries, and vehicle rental advice from Maharashtra’s premier intercity travel team.'
  );

  const [isEnquiryOpen, setIsEnquiryOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const categories = [
    { id: 'ALL', label: 'All Articles' },
    { id: 'Pune-Mumbai Routes', label: 'Pune-Mumbai Corridors' },
    { id: 'Fleet & Vehicles', label: 'Fleet & Vehicle Guides' },
    { id: 'Travel Guides', label: 'Travel & Weekend Guides' },
    { id: 'Airport Transfers', label: 'Airport Advice' },
    { id: 'Outstation Corridors', label: 'Outstation Trips' }
  ];

  const filteredPosts = useMemo(() => {
    return blogPosts.filter(post => {
      return selectedCategory === 'ALL' || post.category === selectedCategory;
    });
  }, [selectedCategory]);

  const featuredPost = blogPosts[0];

  return (
    <div className="blog-page-wrapper">
      <Header onOpenEnquiry={() => setIsEnquiryOpen(true)} isDark={false} />

      {/* Internal Hero Banner */}
      <section className="internal-hero-section">
        <div className="container">
          <div className="breadcrumbs-nav">
            <Link to="/">Home</Link>
            <span className="bc-sep">/</span>
            <span className="bc-current">Blog & Travel Guides</span>
          </div>

          <div className="internal-hero-content">
            <div className="hero-badge-pill">
              <Sparkles size={14} />
              <span>INSIGHTS, ADVICE & ITINERARIES</span>
            </div>
            <h1 className="internal-hero-title">
              AJ Travels <span className="text-gradient">Travel Insights & Guides</span>
            </h1>
            <p className="internal-hero-subtitle">
              Objective travel intelligence, Pune–Mumbai Expressway advice, weekend getaway recommendations, and vehicle rental tips curated by our highway travel specialists.
            </p>
          </div>
        </div>
      </section>

      {/* Filter Category Strip — Clean Horizontal Bar without Search Bloat */}
      <section className="blog-controls-strip">
        <div className="container">
          <div className="controls-row">
            {/* Category Pills */}
            <div className="category-pills-list">
              {categories.map(cat => (
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
          {/* Featured Article Card (shown when looking at All) */}
          {selectedCategory === 'ALL' && featuredPost && (
            <div className="featured-article-card">
              <div className="featured-img-side">
                <img 
                  src={featuredPost.featuredImage} 
                  alt={featuredPost.title} 
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
            {filteredPosts.map(post => (
              <article key={post.slug} className="article-card">
                <Link to={`/blog/${post.slug}`} className="article-img-link">
                  <img 
                    src={post.featuredImage} 
                    alt={post.title} 
                    className="article-img"
                    loading="lazy"
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
          font-size: 0.72rem;
          padding: 0.2rem 0.65rem;
          border-radius: 6px;
        }

        .post-meta-divider { color: #CBD5E1; }

        .meta-item {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
        }

        .featured-title {
          font-size: 1.65rem;
          font-weight: 800;
          line-height: 1.3;
          margin-bottom: 0.85rem;
        }

        .featured-title a {
          color: #0F172A;
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .featured-title a:hover {
          color: #2563EB;
        }

        .featured-excerpt {
          font-size: 0.95rem;
          line-height: 1.65;
          color: #475569;
          margin-bottom: 1.75rem;
        }

        .featured-bottom-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-top: 1px solid #F1F5F9;
          padding-top: 1.25rem;
        }

        .post-author-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.82rem;
          font-weight: 600;
          color: #475569;
        }

        .btn-read-featured {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          background: #1D4ED8;
          color: #FFFFFF;
          font-weight: 700;
          font-size: 0.85rem;
          padding: 0.65rem 1.25rem;
          border-radius: 8px;
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .btn-read-featured:hover {
          background: #1E40AF;
        }

        /* Articles Grid */
        .articles-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
        }

        .article-card {
          background: #FFFFFF;
          border-radius: 18px;
          border: 1px solid #E2E8F0;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transition: all 0.25s ease;
        }

        .article-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 28px rgba(15, 23, 42, 0.08);
          border-color: #93C5FD;
        }

        .article-img-link {
          position: relative;
          display: block;
          height: 190px;
          overflow: hidden;
        }

        .article-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.35s ease;
        }

        .article-card:hover .article-img {
          transform: scale(1.05);
        }

        .article-cat-badge {
          position: absolute;
          top: 0.85rem;
          left: 0.85rem;
          background: rgba(15, 23, 42, 0.85);
          backdrop-filter: blur(6px);
          color: #FFFFFF;
          font-size: 0.68rem;
          font-weight: 700;
          padding: 0.25rem 0.6rem;
          border-radius: 6px;
        }

        .article-card-body {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .card-meta-line {
          display: flex;
          gap: 0.85rem;
          font-size: 0.75rem;
          color: #94A3B8;
          margin-bottom: 0.65rem;
        }

        .meta-sub-item {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
        }

        .article-card-title {
          font-size: 1.15rem;
          font-weight: 700;
          line-height: 1.35;
          margin-bottom: 0.75rem;
        }

        .article-card-title a {
          color: #0F172A;
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .article-card-title a:hover {
          color: #2563EB;
        }

        .article-card-summary {
          font-size: 0.88rem;
          line-height: 1.6;
          color: #64748B;
          margin-bottom: 1.25rem;
          flex: 1;
        }

        .article-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-top: 1px solid #F1F5F9;
          padding-top: 0.85rem;
        }

        .author-small {
          font-size: 0.75rem;
          color: #64748B;
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
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
          text-decoration: underline;
        }

        .no-posts-box {
          text-align: center;
          padding: 4rem 1rem;
        }

        .no-posts-box h3 {
          font-size: 1.35rem;
          color: #0F172A;
          margin: 1rem 0 0.5rem;
        }

        .no-posts-box p {
          color: #64748B;
          margin-bottom: 1.5rem;
        }

        .btn-reset-filters {
          background: #2563EB;
          color: #FFFFFF;
          border: none;
          padding: 0.6rem 1.25rem;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
        }

        @media (max-width: 991px) {
          .featured-article-card {
            grid-template-columns: 1fr;
          }
          .articles-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .internal-hero-title {
            font-size: 1.85rem;
          }
          .articles-grid {
            grid-template-columns: 1fr;
          }
          .controls-row {
            flex-direction: column;
            align-items: stretch;
          }
          .search-box-wrapper {
            min-width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
