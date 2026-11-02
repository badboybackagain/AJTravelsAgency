import { formatMediaUrl } from '../../services/api';
import React from 'react';
import {
  X,
  Calendar,
  Clock,
  User,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  Car,
  ArrowRight,
  Sparkles,
  Eye,
  FileText,
  ExternalLink,
} from 'lucide-react';
import './admin.css';

export const AdminBlogPreviewModal = ({ isOpen, blog, onClose, availableArticles = [] }) => {
  if (!isOpen || !blog) return null;

  const contentBlocks = Array.isArray(blog.content) ? blog.content : [];
  const faqs = Array.isArray(blog.faqs) ? blog.faqs : [];
  const relatedSlugs = Array.isArray(blog.relatedPosts) ? blog.relatedPosts : [];

  // Match related article details from available articles
  const relatedArticles = relatedSlugs
    .map((slug) => availableArticles.find((a) => a.slug === slug))
    .filter(Boolean);

  const formattedDate = blog.publishedAt
    ? new Date(blog.publishedAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Unpublished Draft (Date will set on publish)';

  return (
    <div className="admin-modal-backdrop" onClick={onClose} style={{ zIndex: 10050 }}>
      <div
        className="admin-modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '1000px',
          width: '95vw',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.3)',
        }}
      >
        {/* Preview Top Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1rem 1.75rem',
            backgroundColor: '#0F172A',
            color: '#FFFFFF',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                color: '#38BDF8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Eye size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', letterSpacing: '0.01em' }}>
                Article Live Preview
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                Simulating public article page layout • Client-side render
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span
              style={{
                padding: '0.28rem 0.75rem',
                borderRadius: '9999px',
                fontSize: '0.72rem',
                fontWeight: 800,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                backgroundColor: blog.isPublished ? '#DCFCE7' : '#FEF3C7',
                color: blog.isPublished ? '#15803D' : '#B45309',
              }}
            >
              {blog.isPublished ? '● Published' : '○ Draft Preview'}
            </span>

            {blog.isFeatured && (
              <span
                style={{
                  padding: '0.28rem 0.75rem',
                  borderRadius: '9999px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  backgroundColor: '#EFF6FF',
                  color: '#2563EB',
                }}
              >
                ★ Featured
              </span>
            )}

            {blog.isPublished && blog.slug && (
              <a
                href={`/blog/${blog.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.35rem 0.8rem',
                  backgroundColor: '#0284C7',
                  color: '#FFFFFF',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
                title="Open live article in new tab"
              >
                <ExternalLink size={13} />
                <span>View on Website</span>
              </a>
            )}

            <button
              onClick={onClose}
              className="admin-modal-close"
              title="Close Preview"
              style={{ marginLeft: '0.5rem' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Preview Body (Emulating BlogPostPage) */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '2rem 2.5rem',
            backgroundColor: '#F8FAFC',
          }}
        >
          {/* Breadcrumbs */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.82rem',
              color: '#64748B',
              marginBottom: '1.25rem',
            }}
          >
            <span>Home</span>
            <span>/</span>
            <span>Blog</span>
            <span>/</span>
            <span style={{ color: '#0F172A', fontWeight: 600 }}>{blog.title || 'Untitled Article'}</span>
          </div>

          {/* Article Container Card */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #E2E8F0',
              padding: '2.25rem',
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.03)',
            }}
          >
            {/* Category Tag */}
            <span
              style={{
                display: 'inline-block',
                padding: '0.3rem 0.85rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                backgroundColor: '#EFF6FF',
                color: '#2563EB',
                marginBottom: '1rem',
              }}
            >
              {blog.category || 'General Guide'}
            </span>

            {/* Title */}
            <h1
              style={{
                fontSize: '1.9rem',
                fontWeight: 800,
                color: '#0F172A',
                lineHeight: 1.3,
                marginBottom: '1rem',
              }}
            >
              {blog.title || 'Untitled Article'}
            </h1>

            {/* Summary */}
            {blog.summary && (
              <p
                style={{
                  fontSize: '1.05rem',
                  lineHeight: 1.6,
                  color: '#475569',
                  marginBottom: '1.5rem',
                  fontWeight: 500,
                }}
              >
                {blog.summary}
              </p>
            )}

            {/* Meta Bar */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '1rem',
                paddingBottom: '1.5rem',
                marginBottom: '1.75rem',
                borderBottom: '1px solid #F1F5F9',
                fontSize: '0.84rem',
                color: '#64748B',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <User size={15} color="#2563EB" />
                <span style={{ fontWeight: 600, color: '#1E293B' }}>{blog.author || 'AJ Travels Editorial Team'}</span>
              </div>
              <span>•</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Calendar size={14} />
                <span>{formattedDate}</span>
              </div>
              <span>•</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Clock size={14} />
                <span>{blog.readTime || '5 min read'}</span>
              </div>
            </div>

            {/* Featured Image */}
            {Boolean(blog.featuredImage) && (
              <div
                style={{
                  borderRadius: '12px',
                  overflow: 'hidden',
                  marginBottom: '2rem',
                  backgroundColor: '#0F172A',
                  maxHeight: '420px',
                }}
              >
                <img
                  src={formatMediaUrl(blog.featuredImage, '/assets/pune-to-mumbai-premium-travel-banner.webp')}
                  alt={blog.imageAlt || blog.title || 'Featured Article'}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                  onError={(e) => {
                    e.currentTarget.src = '/assets/pune-to-mumbai-premium-travel-banner.webp';
                  }}
                />
              </div>
            )}

            {/* Quick Context Callout */}
            <div
              style={{
                backgroundColor: '#EFF6FF',
                borderLeft: '4px solid #2563EB',
                padding: '1rem 1.25rem',
                borderRadius: '0 8px 8px 0',
                marginBottom: '2rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
              }}
            >
              <ShieldCheck size={22} color="#1D4ED8" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ display: 'block', color: '#1E3A8A', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                  Quick Route Summary
                </strong>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#1E40AF', lineHeight: 1.5 }}>
                  Travel with AJ Travels: 100% all-inclusive fares with tolls included, flight tracking for airport transfers, verified courteous drivers, and instant online fare calculator.
                </p>
              </div>
            </div>

            {/* Structured Content Blocks */}
            <div style={{ lineHeight: 1.75, color: '#334155', fontSize: '0.98rem' }}>
              {contentBlocks.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8', fontStyle: 'italic' }}>
                  No content blocks added yet. Use Section C in the editor to add intro, paragraphs, headings, bullet lists, or tables.
                </div>
              ) : (
                contentBlocks.map((block, idx) => {
                  if (block.type === 'intro') {
                    return (
                      <p
                        key={idx}
                        style={{
                          fontSize: '1.1rem',
                          fontWeight: 500,
                          color: '#1E293B',
                          lineHeight: 1.7,
                          marginBottom: '1.5rem',
                        }}
                      >
                        {block.text}
                      </p>
                    );
                  }

                  if (block.type === 'heading') {
                    const isH2 = Number(block.level) === 2 || !block.level;
                    return (
                      <div
                        key={idx}
                        style={{
                          fontSize: isH2 ? '1.4rem' : '1.2rem',
                          fontWeight: 800,
                          color: '#0F172A',
                          marginTop: '2rem',
                          marginBottom: '0.85rem',
                          borderBottom: isH2 ? '2px solid #E2E8F0' : 'none',
                          paddingBottom: isH2 ? '0.4rem' : 0,
                        }}
                      >
                        {block.title}
                      </div>
                    );
                  }

                  if (block.type === 'paragraph') {
                    return (
                      <p key={idx} style={{ marginBottom: '1.25rem', whiteSpace: 'pre-line' }}>
                        {block.text}
                      </p>
                    );
                  }

                  if (block.type === 'points') {
                    return (
                      <div
                        key={idx}
                        style={{
                          backgroundColor: '#F8FAFC',
                          border: '1px solid #E2E8F0',
                          borderRadius: '12px',
                          padding: '1.25rem 1.5rem',
                          margin: '1.5rem 0',
                        }}
                      >
                        {block.title && (
                          <div style={{ fontWeight: 800, color: '#0F172A', marginBottom: '0.75rem', fontSize: '0.95rem' }}>
                            {block.title}
                          </div>
                        )}
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                          {(block.items || []).map((item, i) => (
                            <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', fontSize: '0.92rem' }}>
                              <CheckCircle2 size={16} color="#10B981" style={{ flexShrink: 0, marginTop: '3px' }} />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  }

                  if (block.type === 'table') {
                    return (
                      <div
                        key={idx}
                        style={{
                          overflowX: 'auto',
                          margin: '1.75rem 0',
                          border: '1px solid #E2E8F0',
                          borderRadius: '10px',
                        }}
                      >
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                          <thead>
                            <tr style={{ backgroundColor: '#F1F5F9', borderBottom: '2px solid #CBD5E1' }}>
                              {(block.headers || []).map((h, i) => (
                                <th key={i} style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#0F172A' }}>
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {(block.rows || []).map((row, rIdx) => (
                              <tr
                                key={rIdx}
                                style={{
                                  borderBottom: '1px solid #E2E8F0',
                                  backgroundColor: rIdx % 2 === 0 ? '#FFFFFF' : '#FAFAFA',
                                }}
                              >
                                {row.map((cell, cIdx) => (
                                  <td key={cIdx} style={{ padding: '0.75rem 1rem', color: '#334155' }}>
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  }

                  if (block.type === 'image') {
                    if (!block.url) return null;
                    return (
                      <div key={idx} style={{ margin: '1.75rem 0', textAlign: 'center' }}>
                        <img
                          src={formatMediaUrl(block.url, '/assets/pune-to-mumbai-premium-travel-banner.webp')}
                          alt={block.alt || 'Inline blog illustration'}
                          style={{ maxWidth: '100%', borderRadius: '10px', border: '1px solid #E2E8F0' }}
                        />
                        {block.caption && (
                          <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '0.4rem' }}>
                            {block.caption}
                          </div>
                        )}
                      </div>
                    );
                  }

                  return null;
                })
              )}
            </div>

            {/* Corridor Booking Card Preview */}
            <div
              style={{
                marginTop: '2.5rem',
                padding: '1.5rem',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1.25rem',
              }}
            >
              <div>
                <span
                  style={{
                    backgroundColor: '#0284C7',
                    color: '#FFFFFF',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '4px',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                  }}
                >
                  Direct Booking Route
                </span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0.5rem 0 0.25rem', color: '#FFFFFF' }}>
                  Book Cab for {blog.pickupDefault?.toUpperCase() || 'PUNE'} ➔ {blog.dropDefault?.toUpperCase() || 'MUMBAI'}
                </h3>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#94A3B8' }}>
                  Door-to-door pickup with verified drivers and 100% expressway toll-inclusive pricing.
                </p>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.65rem 1.25rem',
                  backgroundColor: '#0284C7',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  color: '#FFFFFF',
                }}
              >
                <Car size={16} />
                <span>Calculate Cab Fare</span>
                <ArrowRight size={14} />
              </div>
            </div>

            {/* FAQ Accordion Section */}
            {faqs.length > 0 && (
              <div style={{ marginTop: '2.5rem', borderTop: '1px solid #E2E8F0', paddingTop: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  <HelpCircle size={22} color="#2563EB" />
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    Frequently Asked Questions ({faqs.length})
                  </h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {faqs.map((faq, i) => (
                    <div
                      key={i}
                      style={{
                        backgroundColor: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                        borderRadius: '10px',
                        padding: '1.15rem 1.4rem',
                      }}
                    >
                      <h4 style={{ fontSize: '0.96rem', fontWeight: 700, color: '#0F172A', margin: '0 0 0.4rem' }}>
                        {faq.q}
                      </h4>
                      <p style={{ fontSize: '0.88rem', color: '#475569', margin: 0, lineHeight: 1.6 }}>
                        {faq.a}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Related Articles Section */}
            {relatedArticles.length > 0 && (
              <div style={{ marginTop: '2.5rem', borderTop: '1px solid #E2E8F0', paddingTop: '2rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', marginBottom: '1rem' }}>
                  Related Travel Guides
                </h3>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                    gap: '1rem',
                  }}
                >
                  {relatedArticles.map((rel) => (
                    <div
                      key={rel.slug}
                      style={{
                        border: '1px solid #E2E8F0',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        backgroundColor: '#FFFFFF',
                      }}
                    >
                      {Boolean(rel.featuredImage) ? (
                        <img
                          src={formatMediaUrl(rel.featuredImage, '/assets/pune-to-mumbai-premium-travel-banner.webp')}
                          alt={rel.title}
                          style={{ width: '100%', height: '120px', objectFit: 'cover' }}
                          onError={(e) => {
                            e.currentTarget.src = '/assets/pune-to-mumbai-premium-travel-banner.webp';
                          }}
                        />
                      ) : (
                        <div style={{ width: '100%', height: '120px', backgroundColor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8' }}>
                          <FileText size={24} />
                        </div>
                      )}
                      <div style={{ padding: '0.85rem' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#2563EB', textTransform: 'uppercase' }}>
                          {rel.category}
                        </span>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0F172A', marginTop: '0.2rem', lineHeight: 1.4 }}>
                          {rel.title}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '1rem 1.75rem',
            backgroundColor: '#FFFFFF',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button onClick={onClose} className="admin-btn-secondary" style={{ padding: '0.5rem 1.5rem', fontWeight: 700 }}>
            <span>Close Preview</span>
          </button>
        </div>
      </div>
    </div>
  );
};

