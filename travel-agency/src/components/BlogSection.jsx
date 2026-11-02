import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock, ArrowRight, BookOpen, Sparkles } from 'lucide-react';
import { blogApi, normalizeBlogPost } from '../services/api';

export const BlogSection = () => {
  const [featuredArticles, setFeaturedArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isSubscribed = true;

    const fetchFeatured = async () => {
      try {
        setLoading(true);
        const res = await blogApi.getAll();
        const rawList = res.data?.data || [];
        const normalized = rawList.map(normalizeBlogPost);
        if (isSubscribed) {
          setFeaturedArticles(normalized.slice(0, 3));
          setError(null);
        }
      } catch (err) {
        console.error('Error fetching homepage blog showcase:', err);
        if (isSubscribed) {
          setError('Unable to load featured articles.');
        }
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    };

    fetchFeatured();

    return () => {
      isSubscribed = false;
    };
  }, []);

  return (
    <section className="blog-showcase-section" id="travel-guides">
      <div className="container">
        {/* Section Header */}
        <div className="section-header-center">
          <div className="badge-pill">
            <Sparkles size={14} className="badge-icon" />
            <span>TRAVEL INSIGHTS & HIGHWAY ADVICE</span>
          </div>
          <h2 className="section-title">
            Featured Route Guides &amp; <span className="text-gradient">Travel Tips</span>
          </h2>
          <p className="section-subtitle">
            Essential intelligence on Pune–Mumbai Expressway transit, vehicle luggage capacities, airport transfer timing, and Maharashtra road trips.
          </p>
        </div>

        {/* Blog Cards Grid */}
        <div className="blog-grid-3col">
          {loading ? (
            // 3 skeleton cards during loading - zero static content flash
            Array.from({ length: 3 }).map((_, idx) => (
              <div key={`blog-skeleton-${idx}`} className="blog-card skeleton-card">
                <div className="skeleton-media shimmer" />
                <div className="blog-card-body">
                  <div className="skeleton-meta shimmer" />
                  <div className="skeleton-title shimmer" />
                  <div className="skeleton-excerpt shimmer" />
                  <div className="skeleton-excerpt short shimmer" />
                  <div className="blog-card-footer">
                    <div className="skeleton-btn shimmer" />
                  </div>
                </div>
              </div>
            ))
          ) : error && featuredArticles.length === 0 ? (
            <div className="blog-error-box">
              <p>Articles are temporarily unavailable. Browse our fleet and fares above.</p>
            </div>
          ) : (
            featuredArticles.map((article) => (
              <article key={article.slug} className="blog-card">
                <Link to={`/blog/${article.slug}`} className="blog-card-media" aria-label={article.title}>
                  <img
                    src={article.featuredImage}
                    alt={article.title}
                    loading="lazy"
                    className="blog-card-img"
                    onError={(e) => {
                      e.currentTarget.src = '/assets/pune-to-mumbai-premium-travel-banner.webp';
                    }}
                  />
                  <span className="blog-card-badge">{article.category}</span>
                </Link>

                <div className="blog-card-body">
                  <div className="blog-card-meta">
                    <span className="meta-item">
                      <Calendar size={13} />
                      <span>{article.publishedDate}</span>
                    </span>
                    <span className="meta-sep">•</span>
                    <span className="meta-item">
                      <Clock size={13} />
                      <span>{article.readTime}</span>
                    </span>
                  </div>

                  <h3 className="blog-card-title">
                    <Link to={`/blog/${article.slug}`}>{article.title}</Link>
                  </h3>

                  <p className="blog-card-excerpt">{article.summary}</p>

                  <div className="blog-card-footer">
                    <Link to={`/blog/${article.slug}`} className="blog-read-link">
                      <span>Read Travel Guide</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>

        {/* View All CTA Strip */}
        <div className="blog-view-all-cta">
          <Link to="/blog" className="btn-view-all-articles">
            <BookOpen size={16} />
            <span>View All Travel Guides &amp; Articles</span>
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>

      <style>{`
        .blog-showcase-section {
          padding: 5.5rem 0;
          background: #0B1120;
          position: relative;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .section-header-center {
          text-align: center;
          max-width: 720px;
          margin: 0 auto 3.5rem;
        }

        .badge-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.35rem 0.95rem;
          background: rgba(56, 189, 248, 0.12);
          border: 1px solid rgba(56, 189, 248, 0.28);
          border-radius: 9999px;
          color: #38BDF8;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 1rem;
        }

        .section-title {
          font-family: var(--font-heading, 'Outfit', sans-serif);
          font-size: 2.35rem;
          font-weight: 800;
          color: #FFFFFF;
          line-height: 1.2;
          margin-bottom: 1rem;
          letter-spacing: -0.02em;
        }

        .text-gradient {
          background: linear-gradient(135deg, #38BDF8 0%, #818CF8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .section-subtitle {
          font-size: 1.025rem;
          line-height: 1.65;
          color: #94A3B8;
        }

        .blog-grid-3col {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
          margin-bottom: 3.5rem;
        }

        .blog-card {
          background: rgba(15, 23, 42, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 18px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          backdrop-filter: blur(12px);
        }

        .blog-card:hover {
          transform: translateY(-6px);
          border-color: rgba(56, 189, 248, 0.4);
          box-shadow: 0 20px 40px -15px rgba(2, 132, 199, 0.25);
        }

        .blog-card-media {
          position: relative;
          display: block;
          aspect-ratio: 16 / 10;
          overflow: hidden;
          background: #1E293B;
        }

        .blog-card-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.45s ease;
        }

        .blog-card:hover .blog-card-img {
          transform: scale(1.06);
        }

        .blog-card-badge {
          position: absolute;
          top: 1rem;
          left: 1rem;
          padding: 0.3rem 0.75rem;
          background: rgba(15, 23, 42, 0.85);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 9999px;
          font-size: 0.72rem;
          font-weight: 700;
          color: #38BDF8;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .blog-card-body {
          padding: 1.75rem;
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .blog-card-meta {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.8rem;
          color: #94A3B8;
          margin-bottom: 0.85rem;
        }

        .meta-item {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
        }

        .meta-sep {
          color: #475569;
        }

        .blog-card-title {
          font-family: var(--font-heading, 'Outfit', sans-serif);
          font-size: 1.2rem;
          font-weight: 700;
          color: #F8FAFC;
          line-height: 1.35;
          margin-bottom: 0.85rem;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .blog-card-title a {
          color: inherit;
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .blog-card-title a:hover {
          color: #38BDF8;
        }

        .blog-card-excerpt {
          font-size: 0.9rem;
          line-height: 1.6;
          color: #94A3B8;
          margin-bottom: 1.5rem;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
          flex: 1;
        }

        .blog-card-footer {
          margin-top: auto;
          padding-top: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        .blog-read-link {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          font-size: 0.875rem;
          font-weight: 700;
          color: #38BDF8;
          text-decoration: none;
          transition: all 0.2s ease;
        }

        .blog-read-link:hover {
          color: #7DD3FC;
          transform: translateX(4px);
        }

        .blog-view-all-cta {
          text-align: center;
        }

        .btn-view-all-articles {
          display: inline-flex;
          align-items: center;
          gap: 0.6rem;
          padding: 0.9rem 2.2rem;
          background: rgba(30, 41, 59, 0.85);
          border: 1px solid rgba(56, 189, 248, 0.3);
          border-radius: 9999px;
          color: #FFFFFF;
          font-family: var(--font-heading, 'Outfit', sans-serif);
          font-size: 0.95rem;
          font-weight: 700;
          text-decoration: none;
          transition: all 0.25s ease;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
        }

        .btn-view-all-articles:hover {
          background: #0284C7;
          border-color: #38BDF8;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(2, 132, 199, 0.4);
        }

        /* Skeleton Styles */
        .skeleton-card {
          pointer-events: none;
        }

        .skeleton-media {
          aspect-ratio: 16 / 10;
          width: 100%;
          background: #1E293B;
        }

        .skeleton-meta {
          width: 45%;
          height: 14px;
          border-radius: 4px;
          background: #1E293B;
          margin-bottom: 1rem;
        }

        .skeleton-title {
          width: 85%;
          height: 22px;
          border-radius: 4px;
          background: #1E293B;
          margin-bottom: 1rem;
        }

        .skeleton-excerpt {
          width: 100%;
          height: 14px;
          border-radius: 4px;
          background: #1E293B;
          margin-bottom: 0.5rem;
        }

        .skeleton-excerpt.short {
          width: 60%;
          margin-bottom: 1.5rem;
        }

        .skeleton-btn {
          width: 40%;
          height: 16px;
          border-radius: 4px;
          background: #1E293B;
        }

        .shimmer {
          position: relative;
          overflow: hidden;
        }

        .shimmer::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent);
          animation: shimmerAnim 1.6s infinite;
        }

        @keyframes shimmerAnim {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .blog-error-box {
          grid-column: 1 / -1;
          padding: 2rem;
          text-align: center;
          color: #94A3B8;
          background: rgba(15, 23, 42, 0.5);
          border-radius: 12px;
          border: 1px dashed rgba(255, 255, 255, 0.15);
        }

        @media (max-width: 1024px) {
          .blog-grid-3col {
            grid-template-columns: repeat(2, 1fr);
            gap: 1.5rem;
          }
          .section-title {
            font-size: 2rem;
          }
        }

        @media (max-width: 640px) {
          .blog-showcase-section {
            padding: 4rem 0;
          }
          .blog-grid-3col {
            grid-template-columns: 1fr;
            gap: 1.5rem;
          }
          .section-title {
            font-size: 1.65rem;
          }
          .blog-card-body {
            padding: 1.25rem;
          }
        }
      `}</style>
    </section>
  );
};
