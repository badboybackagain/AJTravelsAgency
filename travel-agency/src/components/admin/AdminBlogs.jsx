import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Star,
  Tag,
  Calendar,
  Clock,
  User,
  ExternalLink,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Filter,
  X,
} from 'lucide-react';
import { adminBlogApi, formatMediaUrl } from '../../services/api';
import { AdminBlogForm } from './AdminBlogForm';
import { AdminBlogPreviewModal } from './AdminBlogPreviewModal';
import './admin.css';

export const AdminBlogs = ({ onBlogUpdated }) => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'PUBLISHED' | 'DRAFT'
  const [stats, setStats] = useState({ total: 0, publishedCount: 0, draftCount: 0 });

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);
  const [previewBlog, setPreviewBlog] = useState(null);
  const [deleteConfirmBlog, setDeleteConfirmBlog] = useState(null);

  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadBlogs = async () => {
    setLoading(true);
    try {
      const res = await adminBlogApi.getAll({ limit: 100 });
      const items = res.data?.data || [];
      setBlogs(items);
      if (res.data?.stats) {
        setStats(res.data.stats);
      } else {
        const pub = items.filter((b) => b.isPublished).length;
        setStats({
          total: items.length,
          publishedCount: pub,
          draftCount: items.length - pub,
        });
      }
    } catch (err) {
      console.error('Error fetching admin blogs:', err);
      showToast(err.response?.data?.message || 'Failed to load blog articles', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBlogs();
  }, []);

  // Publish / Unpublish Toggle
  const handleTogglePublish = async (blog) => {
    setActionLoadingId(blog.id);
    const targetStatus = !blog.isPublished;
    try {
      await adminBlogApi.togglePublishStatus(blog.id, targetStatus);
      showToast(`Article "${blog.title}" ${targetStatus ? 'published' : 'moved to drafts'}`);
      loadBlogs();
      onBlogUpdated?.();
    } catch (err) {
      console.error('Toggle publish status error:', err);
      showToast(err.response?.data?.message || 'Failed to update publication status', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Feature / Unfeature Toggle
  const handleToggleFeatured = async (blog) => {
    setActionLoadingId(blog.id);
    const newFeatured = !blog.isFeatured;
    try {
      await adminBlogApi.update(blog.id, { isFeatured: newFeatured });
      showToast(`Article "${blog.title}" ${newFeatured ? 'marked as Featured' : 'removed from Featured'}`);
      loadBlogs();
      onBlogUpdated?.();
    } catch (err) {
      console.error('Toggle featured error:', err);
      showToast(err.response?.data?.message || 'Failed to update featured status', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Delete Action
  const handleDeleteBlog = async () => {
    if (!deleteConfirmBlog) return;
    const blogToDelete = deleteConfirmBlog;
    setActionLoadingId(blogToDelete.id);
    try {
      await adminBlogApi.delete(blogToDelete.id);
      showToast(`Article "${blogToDelete.title}" deleted successfully`);
      setDeleteConfirmBlog(null);
      loadBlogs();
      onBlogUpdated?.();
    } catch (err) {
      console.error('Delete blog error:', err);
      showToast(err.response?.data?.message || 'Failed to delete article', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenAdd = () => {
    setEditingBlog(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (blog) => {
    setEditingBlog(blog);
    setIsFormOpen(true);
  };

  // Categories list derived from current articles
  const categories = Array.from(new Set(blogs.map((b) => b.category).filter(Boolean)));

  // Filtered Articles
  const filteredBlogs = blogs.filter((b) => {
    if (statusFilter === 'PUBLISHED' && !b.isPublished) return false;
    if (statusFilter === 'DRAFT' && b.isPublished) return false;

    if (categoryFilter !== 'ALL' && b.category !== categoryFilter) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = b.title?.toLowerCase().includes(q);
      const matchSlug = b.slug?.toLowerCase().includes(q);
      const matchAuthor = b.author?.toLowerCase().includes(q);
      const matchSummary = b.summary?.toLowerCase().includes(q);
      return matchTitle || matchSlug || matchAuthor || matchSummary;
    }

    return true;
  });

  const featuredCount = blogs.filter((b) => b.isFeatured).length;

  return (
    <div className="admin-fares-container">
      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 99999,
            backgroundColor: toast.type === 'error' ? '#EF4444' : '#10B981',
            color: '#FFFFFF',
            padding: '0.85rem 1.4rem',
            borderRadius: '10px',
            fontWeight: 700,
            fontSize: '0.88rem',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
          }}
        >
          {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Header Controls */}
      <div className="admin-fares-header" style={{ marginBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              Blog &amp; Travel Guides Management
            </h2>
          </div>
          <p style={{ fontSize: '0.82rem', color: '#64748B', margin: 0 }}>
            Manage articles, SEO content, publication status, and featured guides.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <button
            onClick={loadBlogs}
            disabled={loading}
            className="admin-btn-secondary"
            title="Refresh articles from database"
            style={{ height: '38px', padding: '0 0.85rem' }}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="admin-btn-primary"
            style={{ height: '38px', padding: '0 1.15rem' }}
          >
            <Plus size={16} />
            <span>Add New Blog</span>
          </button>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div className="admin-stat-card" style={{ padding: '1.15rem' }}>
          <div className="admin-stat-icon blue">
            <BookOpen size={22} />
          </div>
          <div>
            <div className="admin-stat-label">Total Articles</div>
            <div className="admin-stat-val">{stats.total || blogs.length}</div>
          </div>
        </div>

        <div className="admin-stat-card" style={{ padding: '1.15rem' }}>
          <div className="admin-stat-icon green">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div className="admin-stat-label">Published</div>
            <div className="admin-stat-val" style={{ color: '#059669' }}>
              {stats.publishedCount}
            </div>
          </div>
        </div>

        <div className="admin-stat-card" style={{ padding: '1.15rem' }}>
          <div className="admin-stat-icon amber">
            <Clock size={22} />
          </div>
          <div>
            <div className="admin-stat-label">Drafts</div>
            <div className="admin-stat-val" style={{ color: '#D97706' }}>
              {stats.draftCount}
            </div>
          </div>
        </div>

        <div className="admin-stat-card" style={{ padding: '1.15rem' }}>
          <div className="admin-stat-icon purple">
            <Star size={22} />
          </div>
          <div>
            <div className="admin-stat-label">Featured Guides</div>
            <div className="admin-stat-val" style={{ color: '#7C3AED' }}>
              {featuredCount}
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div
        className="admin-card"
        style={{
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.85rem',
        }}
      >
        {/* Status Pills */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: `All (${blogs.length})` },
            { id: 'PUBLISHED', label: `Published (${stats.publishedCount})` },
            { id: 'DRAFT', label: `Drafts (${stats.draftCount})` },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: statusFilter === st.id ? '#0284C7' : '#F1F5F9',
                color: statusFilter === st.id ? '#FFFFFF' : '#475569',
                transition: 'all 0.15s ease',
              }}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* Category & Search Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' }}>
          {/* Category Dropdown */}
          <div style={{ minWidth: '170px' }}>
            <select
              className="admin-form-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ height: '36px', fontSize: '0.8rem', padding: '0 0.75rem' }}
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Search Input */}
          <div style={{ position: 'relative', width: '260px' }}>
            <Search
              size={15}
              style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}
            />
            <input
              type="text"
              className="admin-form-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, slug, author..."
              style={{ height: '36px', paddingLeft: '32px', fontSize: '0.8rem' }}
            />
          </div>
        </div>
      </div>

      {/* Articles Management Table */}
      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#94A3B8' }}>
            <Loader2 size={26} className="animate-spin" style={{ margin: '0 auto 0.5rem' }} />
            <div style={{ fontSize: '0.84rem' }}>Loading blog articles...</div>
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div style={{ padding: '3.5rem', textAlign: 'center', color: '#64748B' }}>
            <BookOpen size={36} color="#94A3B8" style={{ margin: '0 auto 0.75rem' }} />
            <h4 style={{ margin: '0 0 0.25rem', color: '#0F172A', fontWeight: 800 }}>No articles match your criteria</h4>
            <p style={{ margin: 0, fontSize: '0.82rem' }}>
              Try adjusting your search query, status tab, or category filter.
            </p>
          </div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>Photo</th>
                  <th style={{ minWidth: '220px' }}>Article Title &amp; Slug</th>
                  <th>Category</th>
                  <th>Author</th>
                  <th>Published Date</th>
                  <th>Read Time</th>
                  <th>Status</th>
                  <th>Featured</th>
                  <th style={{ textAlign: 'right', minWidth: '160px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBlogs.map((b) => (
                  <tr key={b.id}>
                    {/* 1. Featured image thumbnail */}
                    <td>
                      <div
                        style={{
                          width: '52px',
                          height: '40px',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          backgroundColor: '#0F172A',
                          border: '1px solid #E2E8F0',
                        }}
                      >
                        <img
                          src={formatMediaUrl(b.featuredImage, '/assets/pune-to-mumbai-premium-travel-banner.webp')}
                          alt={b.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            e.currentTarget.src = '/assets/pune-to-mumbai-premium-travel-banner.webp';
                          }}
                        />
                      </div>
                    </td>

                    {/* 2. Article Title & Slug */}
                    <td>
                      <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.86rem', lineHeight: 1.35 }}>
                        {b.title}
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          marginTop: '0.2rem',
                          fontFamily: 'monospace',
                          fontSize: '0.74rem',
                          color: '#0284C7',
                        }}
                      >
                        <span>/{b.slug}</span>
                      </div>
                    </td>

                    {/* 3. Category */}
                    <td>
                      <span
                        style={{
                          padding: '0.2rem 0.55rem',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          backgroundColor: '#F1F5F9',
                          color: '#334155',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {b.category}
                      </span>
                    </td>

                    {/* 4. Author */}
                    <td>
                      <span style={{ fontSize: '0.8rem', color: '#475569', whiteSpace: 'nowrap' }}>
                        {b.author || 'AJ Travels'}
                      </span>
                    </td>

                    {/* 5. Publication Date */}
                    <td>
                      <span style={{ fontSize: '0.78rem', color: '#64748B', whiteSpace: 'nowrap' }}>
                        {b.publishedAt
                          ? new Date(b.publishedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : 'Draft'}
                      </span>
                    </td>

                    {/* 6. Reading Time */}
                    <td>
                      <span style={{ fontSize: '0.78rem', color: '#64748B', whiteSpace: 'nowrap' }}>
                        {b.readTime || '5 min'}
                      </span>
                    </td>

                    {/* 7. Publication Status */}
                    <td>
                      <button
                        type="button"
                        onClick={() => handleTogglePublish(b)}
                        disabled={actionLoadingId === b.id}
                        style={{
                          border: 'none',
                          background: 'none',
                          cursor: 'pointer',
                          padding: 0,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                        }}
                        title={b.isPublished ? 'Click to Unpublish (move to Draft)' : 'Click to Publish live'}
                      >
                        <span
                          className={`admin-status-pill ${b.isPublished ? 'available' : 'unavailable'}`}
                          style={{ cursor: 'pointer' }}
                        >
                          {b.isPublished ? 'Published' : 'Draft'}
                        </span>
                      </button>
                    </td>

                    {/* 8. Featured Status */}
                    <td>
                      <button
                        type="button"
                        onClick={() => handleToggleFeatured(b)}
                        disabled={actionLoadingId === b.id}
                        style={{
                          border: 'none',
                          background: 'none',
                          cursor: 'pointer',
                          padding: '0.2rem',
                          color: b.isFeatured ? '#F59E0B' : '#CBD5E1',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                        }}
                        title={b.isFeatured ? 'Featured on Homepage (Click to remove)' : 'Click to Feature on Homepage'}
                      >
                        <Star size={16} fill={b.isFeatured ? '#F59E0B' : 'none'} />
                        {b.isFeatured && (
                          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#D97706' }}>
                            Top
                          </span>
                        )}
                      </button>
                    </td>

                    {/* 9. Actions */}
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.35rem' }}>
                        {/* Open live article on website */}
                        {b.isPublished && (
                          <a
                            href={`/blog/${b.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="admin-table-action-btn"
                            title="Open live article on website"
                            style={{ color: '#059669', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
                          >
                            <ExternalLink size={15} />
                          </a>
                        )}

                        {/* Preview */}
                        <button
                          type="button"
                          onClick={() => setPreviewBlog(b)}
                          className="admin-table-action-btn"
                          title="Preview Article Layout"
                          style={{ color: '#0284C7' }}
                        >
                          <Eye size={15} />
                        </button>

                        {/* Edit */}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(b)}
                          className="admin-table-action-btn"
                          title="Edit Article"
                        >
                          <Edit2 size={15} />
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmBlog(b)}
                          className="admin-table-action-btn delete"
                          title="Delete Article"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit / Create Form Modal */}
      <AdminBlogForm
        isOpen={isFormOpen}
        blog={editingBlog}
        availableArticles={blogs}
        onClose={() => setIsFormOpen(false)}
        onSuccess={() => {
          loadBlogs();
          onBlogUpdated?.();
        }}
      />

      {/* Standalone Preview Modal */}
      <AdminBlogPreviewModal
        isOpen={Boolean(previewBlog)}
        blog={previewBlog}
        availableArticles={blogs}
        onClose={() => setPreviewBlog(null)}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirmBlog && (
        <div
          className="admin-modal-backdrop"
          onClick={() => setDeleteConfirmBlog(null)}
          style={{ zIndex: 10090 }}
        >
          <div
            className="admin-modal-card compact"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '480px' }}
          >
            <div className="admin-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: '#FEE2E2',
                    color: '#EF4444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Trash2 size={18} />
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Confirm Delete Article
                </h3>
              </div>
              <button onClick={() => setDeleteConfirmBlog(null)} className="admin-modal-close">
                <X size={18} />
              </button>
            </div>

            <div className="admin-modal-body" style={{ padding: '1.5rem' }}>
              <p style={{ margin: '0 0 0.85rem', color: '#1E293B', fontSize: '0.92rem', lineHeight: 1.5 }}>
                Are you sure you want to permanently delete article:
              </p>
              <div
                style={{
                  padding: '0.85rem',
                  backgroundColor: '#F8FAFC',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  fontWeight: 700,
                  color: '#0F172A',
                  fontSize: '0.88rem',
                  marginBottom: '1rem',
                }}
              >
                "{deleteConfirmBlog.title}"
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748B', lineHeight: 1.5 }}>
                • The article record and SEO mappings will be deleted.<br />
                • Uploaded photos in the Media Library remain safe and will not be broken.
              </p>
            </div>

            <div className="admin-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setDeleteConfirmBlog(null)}
                className="admin-btn-secondary"
                disabled={actionLoadingId === deleteConfirmBlog.id}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteBlog}
                disabled={actionLoadingId === deleteConfirmBlog.id}
                className="admin-btn-primary"
                style={{ backgroundColor: '#EF4444', borderColor: '#DC2626' }}
              >
                {actionLoadingId === deleteConfirmBlog.id ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete Article</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

