
export function calculateReadingTime(content, summary = '') {
  let wordCount = 0;
  if (Array.isArray(content)) {
    content.forEach((b) => {
      if (b.text) wordCount += b.text.split(/\s+/).filter(Boolean).length;
      if (b.title) wordCount += b.title.split(/\s+/).filter(Boolean).length;
      if (Array.isArray(b.items)) wordCount += b.items.join(' ').split(/\s+/).filter(Boolean).length;
      if (Array.isArray(b.rows)) wordCount += b.rows.map(r => Array.isArray(r) ? r.join(' ') : '').join(' ').split(/\s+/).filter(Boolean).length;
    });
  }
  if (summary) wordCount += summary.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(wordCount / 200));
  return `${minutes} min read`;
}
import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Save,
  Eye,
  Upload,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Image as ImageIcon,
  HelpCircle,
  Table as TableIcon,
  ListOrdered,
  Type,
  FileText,
  Search,
  ExternalLink,
  ShieldAlert,
  Car,
  Tag,
  Calendar,
  Clock,
  User,
} from 'lucide-react';
import { adminBlogApi, formatMediaUrl } from '../../services/api';
import { AdminBlogPreviewModal } from './AdminBlogPreviewModal';
import './admin.css';

const DEFAULT_CATEGORIES = [
  'Travel Guides',
  'Expressway Guides',
  'Fleet & Vehicles',
  'Airport Transfers',
  'Cost & Tips',
  'Outstation Guides',
  'Weekend Getaways',
  'Darshan Tours',
];

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

export const AdminBlogForm = ({ isOpen, blog, onClose, onSuccess, availableArticles = [] }) => {
  // Dynamically resolve category options from available articles and defaults
  const dynamicCategories = Array.from(
    new Set((availableArticles || []).map((a) => a.category).filter(Boolean))
  );
  const allCategoryOptions = Array.from(new Set([...DEFAULT_CATEGORIES, ...dynamicCategories]));
  const isEditMode = Boolean(blog?.id);
  const fileInputRef = useRef(null);

  // Form tabs: 'basic' | 'content' | 'faqs' | 'seo'
  const [activeTab, setActiveTab] = useState('basic');

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    category: '',
    categorySlug: '',
    author: '',
    publishedAt: '',
    readTime: '',
    summary: '',
    featuredImage: '',
    imageAlt: '',
    pickupDefault: '',
    dropDefault: '',
    metaTitle: '',
    metaDesc: '',
    canonicalUrl: '',
    isPublished: false,
    isFeatured: false,
    displayOrder: 0,
    content: [],
    faqs: [],
    relatedPosts: [],
  });

  const [initialSlug, setInitialSlug] = useState('');
  const [isSlugManual, setIsSlugManual] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Initialize or reset form state
  useEffect(() => {
    if (blog) {
      setFormData({
        title: blog.title || '',
        slug: blog.slug || '',
        category: blog.category || 'Travel Guides',
        categorySlug: blog.categorySlug || slugify(blog.category || 'travel-guides'),
        author: blog.author || 'AJ Travels Editorial Team',
        publishedAt: blog.publishedAt ? new Date(blog.publishedAt).toISOString().split('T')[0] : '',
        readTime: blog.readTime || '5 min read',
        summary: blog.summary || '',
        featuredImage: blog.featuredImage || '/assets/pune-to-mumbai-premium-travel-banner.webp',
        imageAlt: blog.imageAlt || blog.title || '',
        pickupDefault: blog.pickupDefault || 'pune',
        dropDefault: blog.dropDefault || 'mumbai',
        metaTitle: blog.metaTitle || '',
        metaDesc: blog.metaDesc || '',
        canonicalUrl: blog.canonicalUrl || `https://ajtravelspune.com/${blog.slug}/`,
        isPublished: Boolean(blog.isPublished),
        isFeatured: Boolean(blog.isFeatured),
        displayOrder: blog.displayOrder !== undefined ? blog.displayOrder : 0,
        content: Array.isArray(blog.content) ? JSON.parse(JSON.stringify(blog.content)) : [],
        faqs: Array.isArray(blog.faqs) ? JSON.parse(JSON.stringify(blog.faqs)) : [],
        relatedPosts: Array.isArray(blog.relatedPosts) ? [...blog.relatedPosts] : [],
      });
      setInitialSlug(blog.slug || '');
      setIsSlugManual(true);
    } else {
      // New article defaults - clean and empty
      setFormData({
        title: '',
        slug: '',
        category: '',
        categorySlug: '',
        author: '',
        publishedAt: '',
        readTime: '',
        summary: '',
        featuredImage: '',
        imageAlt: '',
        pickupDefault: '',
        dropDefault: '',
        metaTitle: '',
        metaDesc: '',
        canonicalUrl: '',
        isPublished: false,
        isFeatured: false,
        displayOrder: 0,
        content: [],
        faqs: [],
        relatedPosts: [],
      });
      setInitialSlug('');
      setIsSlugManual(false);
    }
    setActiveTab('basic');
    setErrorMsg('');
    setSuccessMsg('');
  }, [blog, isOpen]);

  // Handle Title Change (auto-slug generation on create)
  const handleTitleChange = (val) => {
    setFormData((prev) => {
      const updated = { ...prev, title: val };
      if (!isSlugManual && !isEditMode) {
        const genSlug = slugify(val);
        updated.slug = genSlug;
        updated.canonicalUrl = genSlug ? `https://ajtravelspune.com/${genSlug}/` : '';
      }
      if (!prev.imageAlt || prev.imageAlt === prev.title) {
        updated.imageAlt = val;
      }
      if (!prev.metaTitle) {
        updated.metaTitle = val ? `${val} | AJ Travels` : '';
      }
      return updated;
    });
  };

  // Handle Category Change
  const handleCategoryChange = (catName) => {
    const catSlug = slugify(catName);
    setFormData((prev) => ({
      ...prev,
      category: catName,
      categorySlug: catSlug,
    }));
  };

  // Handle Image Upload
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Image file size must be less than 5MB.');
      return;
    }

    setUploadingImage(true);
    setErrorMsg('');

    try {
      const data = new FormData();
      data.append('image', file);
      data.append('altText', formData.imageAlt || formData.title || 'Blog Featured Image');
      data.append('title', formData.title || file.name);

      const res = await adminBlogApi.uploadImage(data);
      const uploadedUrl = res.data?.imageUrl || res.data?.data?.url;

      if (uploadedUrl) {
        setFormData((prev) => ({
          ...prev,
          featuredImage: uploadedUrl,
        }));
        setSuccessMsg('Image uploaded and registered successfully!');
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      console.error('Image upload error:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to upload image. Please try again.');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ============================================================
  // CONTENT BLOCKS HANDLERS
  // ============================================================

  const addBlock = (type) => {
    let newBlock;
    if (type === 'intro') {
      newBlock = { type: 'intro', text: '' };
    } else if (type === 'heading') {
      newBlock = { type: 'heading', level: 2, title: '' };
    } else if (type === 'paragraph') {
      newBlock = { type: 'paragraph', text: '' };
    } else if (type === 'points') {
      newBlock = { type: 'points', title: 'Key Highlights:', items: ['First bullet point detail'] };
    } else if (type === 'table') {
      newBlock = {
        type: 'table',
        headers: ['Sector / Route', 'Distance', 'Approx Time', 'Recommended Vehicle'],
        rows: [
          ['Origin to Destination', '150 km', '3 hrs', 'Sedan / SUV'],
        ],
      };
    } else if (type === 'image') {
      newBlock = { type: 'image', url: '', alt: '', caption: '' };
    }

    if (newBlock) {
      setFormData((prev) => ({
        ...prev,
        content: [...prev.content, newBlock],
      }));
    }
  };

  const updateBlock = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.content];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, content: updated };
    });
  };

  const removeBlock = (index) => {
    setFormData((prev) => ({
      ...prev,
      content: prev.content.filter((_, i) => i !== index),
    }));
  };

  const moveBlock = (index, direction) => {
    setFormData((prev) => {
      const updated = [...prev.content];
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= updated.length) return prev;
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      return { ...prev, content: updated };
    });
  };

  // Points block bullet item handlers
  const addBulletItem = (blockIndex) => {
    setFormData((prev) => {
      const updated = [...prev.content];
      const items = [...(updated[blockIndex].items || []), ''];
      updated[blockIndex] = { ...updated[blockIndex], items };
      return { ...prev, content: updated };
    });
  };

  const updateBulletItem = (blockIndex, itemIndex, value) => {
    setFormData((prev) => {
      const updated = [...prev.content];
      const items = [...(updated[blockIndex].items || [])];
      items[itemIndex] = value;
      updated[blockIndex] = { ...updated[blockIndex], items };
      return { ...prev, content: updated };
    });
  };

  const removeBulletItem = (blockIndex, itemIndex) => {
    setFormData((prev) => {
      const updated = [...prev.content];
      const items = (updated[blockIndex].items || []).filter((_, i) => i !== itemIndex);
      updated[blockIndex] = { ...updated[blockIndex], items };
      return { ...prev, content: updated };
    });
  };

  // Table block handlers
  const addTableHeader = (blockIndex) => {
    setFormData((prev) => {
      const updated = [...prev.content];
      const headers = [...(updated[blockIndex].headers || []), `Column ${updated[blockIndex].headers.length + 1}`];
      const rows = (updated[blockIndex].rows || []).map((row) => [...row, '-']);
      updated[blockIndex] = { ...updated[blockIndex], headers, rows };
      return { ...prev, content: updated };
    });
  };

  const updateTableHeader = (blockIndex, headerIndex, value) => {
    setFormData((prev) => {
      const updated = [...prev.content];
      const headers = [...(updated[blockIndex].headers || [])];
      headers[headerIndex] = value;
      updated[blockIndex] = { ...updated[blockIndex], headers };
      return { ...prev, content: updated };
    });
  };

  const removeTableHeader = (blockIndex, headerIndex) => {
    setFormData((prev) => {
      const updated = [...prev.content];
      const headers = (updated[blockIndex].headers || []).filter((_, i) => i !== headerIndex);
      const rows = (updated[blockIndex].rows || []).map((row) =>
        row.filter((_, i) => i !== headerIndex)
      );
      updated[blockIndex] = { ...updated[blockIndex], headers, rows };
      return { ...prev, content: updated };
    });
  };

  const addTableRow = (blockIndex) => {
    setFormData((prev) => {
      const updated = [...prev.content];
      const headerCount = (updated[blockIndex].headers || []).length || 1;
      const newRow = Array(headerCount).fill('');
      const rows = [...(updated[blockIndex].rows || []), newRow];
      updated[blockIndex] = { ...updated[blockIndex], rows };
      return { ...prev, content: updated };
    });
  };

  const updateTableCell = (blockIndex, rowIndex, cellIndex, value) => {
    setFormData((prev) => {
      const updated = [...prev.content];
      const rows = [...(updated[blockIndex].rows || [])];
      const row = [...rows[rowIndex]];
      row[cellIndex] = value;
      rows[rowIndex] = row;
      updated[blockIndex] = { ...updated[blockIndex], rows };
      return { ...prev, content: updated };
    });
  };

  const removeTableRow = (blockIndex, rowIndex) => {
    setFormData((prev) => {
      const updated = [...prev.content];
      const rows = (updated[blockIndex].rows || []).filter((_, i) => i !== rowIndex);
      updated[blockIndex] = { ...updated[blockIndex], rows };
      return { ...prev, content: updated };
    });
  };

  // ============================================================
  // FAQs HANDLERS
  // ============================================================

  const addFaq = () => {
    setFormData((prev) => ({
      ...prev,
      faqs: [...prev.faqs, { q: '', a: '' }],
    }));
  };

  const updateFaq = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.faqs];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, faqs: updated };
    });
  };

  const removeFaq = (index) => {
    setFormData((prev) => ({
      ...prev,
      faqs: prev.faqs.filter((_, i) => i !== index),
    }));
  };

  const moveFaq = (index, direction) => {
    setFormData((prev) => {
      const updated = [...prev.faqs];
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= updated.length) return prev;
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      return { ...prev, faqs: updated };
    });
  };

  // ============================================================
  // RELATED POSTS HANDLERS
  // ============================================================

  const toggleRelatedPost = (slug) => {
    setFormData((prev) => {
      const exists = prev.relatedPosts.includes(slug);
      const updated = exists
        ? prev.relatedPosts.filter((s) => s !== slug)
        : [...prev.relatedPosts, slug];
      return { ...prev, relatedPosts: updated };
    });
  };

  // ============================================================
  // SUBMIT HANDLER (SAVE DRAFT OR PUBLISH)
  // ============================================================

  const handleSubmit = async (publishIntent) => {
    setErrorMsg('');
    setSuccessMsg('');

    // Validations
    if (!formData.title.trim()) {
      setActiveTab('basic');
      setErrorMsg('Article title is required.');
      return;
    }

    const resolvedSlug = formData.slug.trim() ? slugify(formData.slug) : slugify(formData.title);
    if (!resolvedSlug) {
      setActiveTab('basic');
      setErrorMsg('A valid URL slug is required.');
      return;
    }

    if (!formData.summary.trim()) {
      setActiveTab('basic');
      setErrorMsg('Article summary / excerpt is required.');
      return;
    }

    if (!formData.content || formData.content.length === 0) {
      setActiveTab('content');
      setErrorMsg('At least one content block is required.');
      return;
    }

    // Determine target publication status
    // If publishIntent is provided, use it; otherwise preserve current state
    const targetPublish = publishIntent !== undefined ? publishIntent : formData.isPublished;

    setSubmitting(true);

    try {
      const payload = {
        title: formData.title.trim(),
        slug: resolvedSlug,
        category: formData.category.trim(),
        categorySlug: formData.categorySlug ? slugify(formData.categorySlug) : slugify(formData.category),
        author: formData.author.trim() || 'AJ Travels Editorial Team',
        publishedAt: formData.publishedAt ? new Date(formData.publishedAt).toISOString() : null,
        readTime: calculateReadingTime(formData.content, formData.summary),
        summary: formData.summary.trim(),
        featuredImage: formData.featuredImage.trim() || '/assets/pune-to-mumbai-premium-travel-banner.webp',
        imageAlt: formData.imageAlt.trim() || formData.title.trim(),
        pickupDefault: formData.pickupDefault.trim() || 'pune',
        dropDefault: formData.dropDefault.trim() || 'mumbai',
        metaTitle: formData.metaTitle.trim() || null,
        metaDesc: formData.metaDesc.trim() || null,
        canonicalUrl: `https://ajtravelspune.com/${resolvedSlug}/`,
        isPublished: targetPublish,
        isFeatured: Boolean(formData.isFeatured),
        displayOrder: parseInt(formData.displayOrder, 10) || 0,
        content: formData.content,
        faqs: formData.faqs.filter((f) => f.q.trim() && f.a.trim()),
        relatedPosts: formData.relatedPosts,
      };

      if (isEditMode) {
        await adminBlogApi.update(blog.id, payload);
        setSuccessMsg(`Article "${payload.title}" updated successfully!`);
      } else {
        await adminBlogApi.create(payload);
        setSuccessMsg(`Article "${payload.title}" created successfully!`);
      }

      setTimeout(() => {
        onSuccess?.();
        onClose?.();
      }, 700);
    } catch (err) {
      console.error('Error saving blog article:', err);
      const apiMessage = err.response?.data?.message || err.message || 'Failed to save blog article.';
      setErrorMsg(apiMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const isSlugChanged = isEditMode && initialSlug && formData.slug && formData.slug !== initialSlug;

  return (
    <>
      <div className="admin-modal-backdrop" onClick={onClose} style={{ zIndex: 10000 }}>
        <div
          className="admin-modal-card"
          onClick={(e) => e.stopPropagation()}
          style={{
            maxWidth: '1100px',
            width: '96vw',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '20px',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div className="admin-modal-header" style={{ padding: '1.25rem 1.75rem', backgroundColor: '#FFFFFF' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  backgroundColor: '#EFF6FF',
                  color: '#2563EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FileText size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  {isEditMode ? `Edit Article: ${formData.title || blog.slug}` : 'Create New Travel Guide'}
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '0.15rem 0 0' }}>
                  {isEditMode
                    ? 'Update structured content, SEO attributes, and publication status.'
                    : 'Craft a new SEO-optimized route guide or fleet rental article.'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <button
                type="button"
                onClick={() => setIsPreviewOpen(true)}
                className="admin-btn-secondary"
                style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem', fontWeight: 700 }}
                title="Preview article before saving"
              >
                <Eye size={15} />
                <span>Preview</span>
              </button>

              <button onClick={onClose} className="admin-modal-close" title="Close editor">
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Section Navigation Tabs */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1.75rem',
              backgroundColor: '#F8FAFC',
              borderBottom: '1px solid #E2E8F0',
              overflowX: 'auto',
            }}
          >
            {[
              { id: 'basic', label: 'Section A & B: Basic Info & Image', icon: Tag },
              { id: 'content', label: `Section C: Content Blocks (${formData.content.length})`, icon: Type },
              { id: 'faqs', label: `Section D & E: FAQs (${formData.faqs.length}) & Related`, icon: HelpCircle },
              { id: 'seo', label: 'Section F & G: Booking & SEO', icon: Search },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.5rem 0.95rem',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    backgroundColor: isActive ? '#0284C7' : '#FFFFFF',
                    color: isActive ? '#FFFFFF' : '#475569',
                    boxShadow: isActive ? '0 2px 6px rgba(2, 132, 199, 0.25)' : '0 1px 2px rgba(0,0,0,0.04)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Alerts / Error Messages */}
          {errorMsg && (
            <div
              style={{
                margin: '1rem 1.75rem 0',
                padding: '0.75rem 1rem',
                backgroundColor: '#FEE2E2',
                border: '1px solid #FCA5A5',
                borderRadius: '8px',
                color: '#991B1B',
                fontSize: '0.85rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div
              style={{
                margin: '1rem 1.75rem 0',
                padding: '0.75rem 1rem',
                backgroundColor: '#DCFCE7',
                border: '1px solid #86EFAC',
                borderRadius: '8px',
                color: '#166534',
                fontSize: '0.85rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form Scrollable Body */}
          <div className="admin-modal-body" style={{ flex: 1, padding: '1.75rem', overflowY: 'auto' }}>
            {/* ============================================================ */}
            {/* TAB 1: BASIC INFORMATION & FEATURED IMAGE */}
            {/* ============================================================ */}
            {activeTab === 'basic' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Section A — Basic Info Card */}
                <div className="admin-form-section">
                  <div className="admin-form-section-title">
                    <Tag size={16} color="#0284C7" />
                    <span>Section A — Article Specifications</span>
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">
                      Article Title <span className="admin-required">*</span>
                    </label>
                    <input
                      type="text"
                      className="admin-form-input"
                      value={formData.title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      placeholder="e.g. Pune to Mumbai One-Way Cab: Complete Travel Guide & Fares"
                      style={{ fontSize: '0.98rem', fontWeight: 600 }}
                    />
                  </div>

                  {/* Slug & Warning */}
                  <div className="admin-form-group">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <label className="admin-form-label" style={{ margin: 0 }}>
                        URL Slug <span className="admin-required">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const auto = slugify(formData.title);
                          setFormData((p) => ({ ...p, slug: auto }));
                          setIsSlugManual(false);
                        }}
                        style={{ background: 'none', border: 'none', color: '#0284C7', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        Auto-generate from Title
                      </button>
                    </div>

                    <div style={{ position: 'relative' }}>
                      <span
                        style={{
                          position: 'absolute',
                          left: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          fontSize: '0.82rem',
                          color: '#94A3B8',
                          fontWeight: 500,
                        }}
                      >
                        ajtravelspune.com/blog/
                      </span>
                      <input
                        type="text"
                        className="admin-form-input"
                        value={formData.slug}
                        onChange={(e) => {
                          setIsSlugManual(true);
                          setFormData((p) => ({
                            ...p,
                            slug: slugify(e.target.value),
                            canonicalUrl: `https://ajtravelspune.com/${slugify(e.target.value)}/`,
                          }));
                        }}
                        placeholder="pune-to-mumbai-one-way-cab"
                        style={{ paddingLeft: '175px', fontFamily: 'monospace', fontWeight: 600 }}
                      />
                    </div>

                    {isSlugChanged && (
                      <div
                        style={{
                          marginTop: '0.5rem',
                          padding: '0.6rem 0.85rem',
                          backgroundColor: '#FFFBEB',
                          border: '1px solid #FDE68A',
                          borderRadius: '6px',
                          color: '#92400E',
                          fontSize: '0.78rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                        }}
                      >
                        <ShieldAlert size={16} style={{ flexShrink: 0 }} />
                        <span>
                          <strong>Warning:</strong> Changing an existing slug alters its live URL. Inbound backlinks and indexed Google search results may require a redirect.
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Category, Author, Published Date Grid */}
                  <div className="admin-form-grid-3">
                    <div className="admin-form-group">
                      <label className="admin-form-label">
                        Category <span className="admin-required">*</span>
                      </label>
                      <input
                        type="text"
                        list="blog-category-options"
                        className="admin-form-input"
                        value={formData.category}
                        onChange={(e) => handleCategoryChange(e.target.value)}
                        placeholder="e.g. Travel Guides"
                      />
                      <datalist id="blog-category-options">
                        {allCategoryOptions.map((cat) => (
                          <option key={cat} value={cat} />
                        ))}
                      </datalist>
                    </div>

                    <div className="admin-form-group">
                      <label className="admin-form-label">Category Slug</label>
                      <input
                        type="text"
                        className="admin-form-input"
                        value={formData.categorySlug}
                        onChange={(e) => setFormData((p) => ({ ...p, categorySlug: slugify(e.target.value) }))}
                        placeholder="travel-guides"
                      />
                    </div>

                    <div className="admin-form-group">
                      <label className="admin-form-label">Author Name</label>
                      <input
                        type="text"
                        className="admin-form-input"
                        value={formData.author}
                        onChange={(e) => setFormData((p) => ({ ...p, author: e.target.value }))}
                        placeholder="AJ Travels Editorial Team"
                      />
                    </div>
                  </div>

                  <div className="admin-form-group">
                    <label className="admin-form-label">Publication Date</label>
                    <input
                      type="date"
                      className="admin-form-input"
                      value={formData.publishedAt}
                      onChange={(e) => setFormData((p) => ({ ...p, publishedAt: e.target.value }))}
                    />
                  </div>

                  {/* Summary / Excerpt */}
                  <div className="admin-form-group" style={{ marginBottom: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <label className="admin-form-label" style={{ margin: 0 }}>
                        Article Summary / Excerpt <span className="admin-required">*</span>
                      </label>
                      <span style={{ fontSize: '0.72rem', color: formData.summary.length > 200 ? '#0284C7' : '#94A3B8' }}>
                        {formData.summary.length} characters
                      </span>
                    </div>
                    <textarea
                      className="admin-form-textarea"
                      rows={3}
                      value={formData.summary}
                      onChange={(e) => setFormData((p) => ({ ...p, summary: e.target.value }))}
                      placeholder="A comprehensive summary of this travel guide displayed on blog listing cards, social shares, and search snippets..."
                    />
                  </div>
                </div>

                {/* Section B — Featured Image Card */}
                <div className="admin-form-section">
                  <div className="admin-form-section-title">
                    <ImageIcon size={16} color="#0284C7" />
                    <span>Section B — Featured Cover Photo</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '1.5rem', alignItems: 'flex-start' }}>
                    {/* Thumbnail Preview */}
                    <div
                      style={{
                        height: '145px',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        border: '2px solid #E2E8F0',
                        backgroundColor: '#0F172A',
                        position: 'relative',
                      }}
                    >
                      {formData.featuredImage ? (
                        <>
                          <img
                            src={formatMediaUrl(formData.featuredImage, '/assets/pune-to-mumbai-premium-travel-banner.webp')}
                            alt="Preview"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                              e.currentTarget.src = '/assets/pune-to-mumbai-premium-travel-banner.webp';
                            }}
                          />
                          <span
                            style={{
                              position: 'absolute',
                              bottom: '6px',
                              left: '6px',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              backgroundColor: 'rgba(15, 23, 42, 0.75)',
                              color: '#FFFFFF',
                              padding: '0.15rem 0.45rem',
                              borderRadius: '4px',
                            }}
                          >
                            Featured
                          </span>
                        </>
                      ) : (
                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', gap: '0.35rem' }}>
                          <ImageIcon size={28} />
                          <span style={{ fontSize: '0.72rem' }}>No cover photo</span>
                        </div>
                      )}
                    </div>

                    {/* Image Controls */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      <div className="admin-form-group" style={{ margin: 0 }}>
                        <label className="admin-form-label">Image Asset URL or Path</label>
                        <input
                          type="text"
                          className="admin-form-input"
                          value={formData.featuredImage}
                          onChange={(e) => setFormData((p) => ({ ...p, featuredImage: e.target.value }))}
                          placeholder="/assets/pune-to-mumbai-premium-travel-banner.webp"
                        />
                      </div>

                      <div className="admin-form-group" style={{ margin: 0 }}>
                        <label className="admin-form-label">Image Accessibility Alt Text</label>
                        <input
                          type="text"
                          className="admin-form-input"
                          value={formData.imageAlt}
                          onChange={(e) => setFormData((p) => ({ ...p, imageAlt: e.target.value }))}
                          placeholder="e.g. Pune to Mumbai Cab Travelling on Highway"
                        />
                      </div>

                      <div>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleImageUpload}
                          accept="image/png, image/jpeg, image/webp"
                          style={{ display: 'none' }}
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingImage}
                          className="admin-btn-secondary"
                          style={{ height: '36px', padding: '0 1rem', fontSize: '0.82rem', fontWeight: 700 }}
                        >
                          {uploadingImage ? (
                            <>
                              <Loader2 size={14} className="animate-spin" />
                              <span>Uploading to Media Library...</span>
                            </>
                          ) : (
                            <>
                              <Upload size={14} />
                              <span>Upload New Image (WebP/JPG/PNG &lt; 5MB)</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* TAB 2: STRUCTURED CONTENT BLOCKS (Section C) */}
            {/* ============================================================ */}
            {activeTab === 'content' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Block Creation Toolbar */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                    padding: '0.85rem 1.25rem',
                    backgroundColor: '#F1F5F9',
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    + Insert Content Block:
                  </span>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    <button
                      type="button"
                      onClick={() => addBlock('heading')}
                      className="admin-btn-secondary"
                      style={{ height: '32px', fontSize: '0.78rem', padding: '0 0.75rem', fontWeight: 700 }}
                    >
                      <Type size={13} />
                      <span>Heading (H2/H3)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => addBlock('paragraph')}
                      className="admin-btn-secondary"
                      style={{ height: '32px', fontSize: '0.78rem', padding: '0 0.75rem', fontWeight: 700 }}
                    >
                      <FileText size={13} />
                      <span>Paragraph</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => addBlock('points')}
                      className="admin-btn-secondary"
                      style={{ height: '32px', fontSize: '0.78rem', padding: '0 0.75rem', fontWeight: 700 }}
                    >
                      <ListOrdered size={13} />
                      <span>Bullet Points</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => addBlock('table')}
                      className="admin-btn-secondary"
                      style={{ height: '32px', fontSize: '0.78rem', padding: '0 0.75rem', fontWeight: 700 }}
                    >
                      <TableIcon size={13} />
                      <span>Table</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => addBlock('intro')}
                      className="admin-btn-secondary"
                      style={{ height: '32px', fontSize: '0.78rem', padding: '0 0.75rem', fontWeight: 700 }}
                    >
                      <Sparkles size={13} />
                      <span>Lead Intro</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => addBlock('image')}
                      className="admin-btn-secondary"
                      style={{ height: '32px', fontSize: '0.78rem', padding: '0 0.75rem', fontWeight: 700 }}
                    >
                      <ImageIcon size={13} />
                      <span>Inline Image</span>
                    </button>
                  </div>
                </div>

                {/* Blocks List */}
                {formData.content.length === 0 ? (
                  <div
                    style={{
                      padding: '3rem',
                      textAlign: 'center',
                      backgroundColor: '#FFFFFF',
                      borderRadius: '12px',
                      border: '2px dashed #CBD5E1',
                    }}
                  >
                    <Type size={32} color="#94A3B8" style={{ margin: '0 auto 0.75rem' }} />
                    <h4 style={{ margin: '0 0 0.25rem', color: '#0F172A', fontWeight: 700 }}>
                      No structured content blocks
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748B' }}>
                      Click any block button above to begin structuring the article.
                    </p>
                  </div>
                ) : (
                  formData.content.map((block, idx) => (
                    <div
                      key={idx}
                      style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: '12px',
                        padding: '1.25rem',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                      }}
                    >
                      {/* Block Header */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '0.85rem',
                          paddingBottom: '0.65rem',
                          borderBottom: '1px solid #F1F5F9',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span
                            style={{
                              padding: '0.2rem 0.6rem',
                              borderRadius: '6px',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              backgroundColor: '#EFF6FF',
                              color: '#2563EB',
                            }}
                          >
                            #{idx + 1} {block.type}
                          </span>
                        </div>

                        {/* Reorder and Delete Actions */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <button
                            type="button"
                            onClick={() => moveBlock(idx, -1)}
                            disabled={idx === 0}
                            style={{
                              padding: '0.25rem',
                              background: 'none',
                              border: '1px solid #E2E8F0',
                              borderRadius: '4px',
                              cursor: idx === 0 ? 'not-allowed' : 'pointer',
                              opacity: idx === 0 ? 0.3 : 1,
                            }}
                            title="Move Up"
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveBlock(idx, 1)}
                            disabled={idx === formData.content.length - 1}
                            style={{
                              padding: '0.25rem',
                              background: 'none',
                              border: '1px solid #E2E8F0',
                              borderRadius: '4px',
                              cursor: idx === formData.content.length - 1 ? 'not-allowed' : 'pointer',
                              opacity: idx === formData.content.length - 1 ? 0.3 : 1,
                            }}
                            title="Move Down"
                          >
                            <ArrowDown size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeBlock(idx)}
                            style={{
                              padding: '0.25rem',
                              background: 'none',
                              border: '1px solid #FCA5A5',
                              borderRadius: '4px',
                              color: '#EF4444',
                              cursor: 'pointer',
                            }}
                            title="Delete Block"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Block Specific Form Fields */}
                      {block.type === 'intro' && (
                        <div>
                          <label className="admin-form-label">Lead Paragraph Text</label>
                          <textarea
                            className="admin-form-textarea"
                            rows={3}
                            value={block.text || ''}
                            onChange={(e) => updateBlock(idx, 'text', e.target.value)}
                            placeholder="Opening lead paragraph text in large font..."
                          />
                        </div>
                      )}

                      {block.type === 'heading' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.85rem' }}>
                          <div>
                            <label className="admin-form-label">Level</label>
                            <select
                              className="admin-form-select"
                              value={block.level || 2}
                              onChange={(e) => updateBlock(idx, 'level', parseInt(e.target.value, 10))}
                            >
                              <option value={2}>H2 Heading</option>
                              <option value={3}>H3 Subhead</option>
                            </select>
                          </div>
                          <div>
                            <label className="admin-form-label">Heading Text</label>
                            <input
                              type="text"
                              className="admin-form-input"
                              value={block.title || ''}
                              onChange={(e) => updateBlock(idx, 'title', e.target.value)}
                              placeholder="e.g. Pune to Mumbai Route, Tolls & Travel Times"
                              style={{ fontWeight: 700 }}
                            />
                          </div>
                        </div>
                      )}

                      {block.type === 'paragraph' && (
                        <div>
                          <label className="admin-form-label">Body Paragraph Text</label>
                          <textarea
                            className="admin-form-textarea"
                            rows={4}
                            value={block.text || ''}
                            onChange={(e) => updateBlock(idx, 'text', e.target.value)}
                            placeholder="Write comprehensive, helpful travel information..."
                          />
                        </div>
                      )}

                      {block.type === 'points' && (
                        <div>
                          <div className="admin-form-group">
                            <label className="admin-form-label">Section Title</label>
                            <input
                              type="text"
                              className="admin-form-input"
                              value={block.title || ''}
                              onChange={(e) => updateBlock(idx, 'title', e.target.value)}
                              placeholder="e.g. Key Advantages of AJ Travels One-Way Cab Service:"
                            />
                          </div>

                          <label className="admin-form-label">Bullet Items</label>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {(block.items || []).map((item, itemIdx) => (
                              <div key={itemIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ fontSize: '0.75rem', color: '#94A3B8', width: '20px' }}>
                                  #{itemIdx + 1}
                                </span>
                                <input
                                  type="text"
                                  className="admin-form-input"
                                  value={item}
                                  onChange={(e) => updateBulletItem(idx, itemIdx, e.target.value)}
                                  placeholder="Bullet point detail..."
                                  style={{ flex: 1 }}
                                />
                                <button
                                  type="button"
                                  onClick={() => removeBulletItem(idx, itemIdx)}
                                  style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}
                                  title="Remove Item"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            ))}

                            <button
                              type="button"
                              onClick={() => addBulletItem(idx)}
                              className="admin-btn-secondary"
                              style={{ height: '30px', alignSelf: 'flex-start', fontSize: '0.75rem', marginTop: '0.25rem' }}
                            >
                              <Plus size={13} />
                              <span>Add Bullet Point</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {block.type === 'table' && (
                        <div>
                          <div className="admin-form-group">
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <label className="admin-form-label">Table Column Headers</label>
                              <button
                                type="button"
                                onClick={() => addTableHeader(idx)}
                                style={{ background: 'none', border: 'none', color: '#0284C7', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                              >
                                + Add Column
                              </button>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                              {(block.headers || []).map((header, hIdx) => (
                                <div key={hIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: '#F1F5F9', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                                  <input
                                    type="text"
                                    value={header}
                                    onChange={(e) => updateTableHeader(idx, hIdx, e.target.value)}
                                    style={{ border: 'none', background: 'transparent', fontSize: '0.8rem', fontWeight: 700, width: '130px' }}
                                  />
                                  {(block.headers || []).length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => removeTableHeader(idx, hIdx)}
                                      style={{ border: 'none', background: 'none', color: '#EF4444', cursor: 'pointer' }}
                                    >
                                      <X size={12} />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          <label className="admin-form-label">Table Rows & Cells</label>
                          <div style={{ overflowX: 'auto', marginBottom: '0.75rem' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                              <tbody>
                                {(block.rows || []).map((row, rIdx) => (
                                  <tr key={rIdx} style={{ borderBottom: '1px solid #E2E8F0' }}>
                                    <td style={{ padding: '0.4rem', color: '#94A3B8', fontSize: '0.72rem', width: '25px' }}>
                                      {rIdx + 1}
                                    </td>
                                    {row.map((cell, cIdx) => (
                                      <td key={cIdx} style={{ padding: '0.35rem' }}>
                                        <input
                                          type="text"
                                          className="admin-form-input"
                                          value={cell}
                                          onChange={(e) => updateTableCell(idx, rIdx, cIdx, e.target.value)}
                                          style={{ height: '32px', fontSize: '0.82rem' }}
                                        />
                                      </td>
                                    ))}
                                    <td style={{ padding: '0.35rem', width: '30px' }}>
                                      <button
                                        type="button"
                                        onClick={() => removeTableRow(idx, rIdx)}
                                        style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}
                                        title="Delete Row"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          <button
                            type="button"
                            onClick={() => addTableRow(idx)}
                            className="admin-btn-secondary"
                            style={{ height: '30px', fontSize: '0.75rem' }}
                          >
                            <Plus size={13} />
                            <span>Add Row</span>
                          </button>
                        </div>
                      )}

                      {block.type === 'image' && (
                        <div className="admin-form-grid-3">
                          <div className="admin-form-group">
                            <label className="admin-form-label">Image URL</label>
                            <input
                              type="text"
                              className="admin-form-input"
                              value={block.url || ''}
                              onChange={(e) => updateBlock(idx, 'url', e.target.value)}
                              placeholder="/assets/blog/..."
                            />
                          </div>
                          <div className="admin-form-group">
                            <label className="admin-form-label">Alt Text</label>
                            <input
                              type="text"
                              className="admin-form-input"
                              value={block.alt || ''}
                              onChange={(e) => updateBlock(idx, 'alt', e.target.value)}
                              placeholder="Image description"
                            />
                          </div>
                          <div className="admin-form-group">
                            <label className="admin-form-label">Caption (Optional)</label>
                            <input
                              type="text"
                              className="admin-form-input"
                              value={block.caption || ''}
                              onChange={(e) => updateBlock(idx, 'caption', e.target.value)}
                              placeholder="Photo caption"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ============================================================ */}
            {/* TAB 3: FAQs & RELATED ARTICLES (Sections D & E) */}
            {/* ============================================================ */}
            {activeTab === 'faqs' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Section D — FAQs Card */}
                <div className="admin-form-section">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div className="admin-form-section-title" style={{ margin: 0 }}>
                      <HelpCircle size={16} color="#0284C7" />
                      <span>Section D — Authoritative FAQs ({formData.faqs.length})</span>
                    </div>

                    <button
                      type="button"
                      onClick={addFaq}
                      className="admin-btn-primary"
                      style={{ height: '32px', fontSize: '0.78rem', padding: '0 0.85rem' }}
                    >
                      <Plus size={13} />
                      <span>Add New FAQ</span>
                    </button>
                  </div>

                  <p style={{ fontSize: '0.78rem', color: '#64748B', marginTop: 0, marginBottom: '1rem' }}>
                    Stored in authoritative database field <code>BlogPost.faqs</code>. Rendered on public pages as an interactive Q&amp;A accordion and structured Schema.org FAQ data.
                  </p>

                  {formData.faqs.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.84rem' }}>
                      No FAQs configured for this article.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      {formData.faqs.map((faq, i) => (
                        <div
                          key={i}
                          style={{
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #E2E8F0',
                            borderRadius: '10px',
                            padding: '1rem',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0284C7' }}>
                              Question #{i + 1}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                              <button
                                type="button"
                                onClick={() => moveFaq(i, -1)}
                                disabled={i === 0}
                                style={{ background: 'none', border: 'none', cursor: i === 0 ? 'not-allowed' : 'pointer', opacity: i === 0 ? 0.3 : 1 }}
                              >
                                <ArrowUp size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => moveFaq(i, 1)}
                                disabled={i === formData.faqs.length - 1}
                                style={{ background: 'none', border: 'none', cursor: i === formData.faqs.length - 1 ? 'not-allowed' : 'pointer', opacity: i === formData.faqs.length - 1 ? 0.3 : 1 }}
                              >
                                <ArrowDown size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeFaq(i)}
                                style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>

                          <div className="admin-form-group">
                            <input
                              type="text"
                              className="admin-form-input"
                              value={faq.q}
                              onChange={(e) => updateFaq(i, 'q', e.target.value)}
                              placeholder="e.g. Are expressway tolls included in the fixed fare?"
                              style={{ fontWeight: 600 }}
                            />
                          </div>

                          <div className="admin-form-group" style={{ marginBottom: 0 }}>
                            <textarea
                              className="admin-form-textarea"
                              rows={2}
                              value={faq.a}
                              onChange={(e) => updateFaq(i, 'a', e.target.value)}
                              placeholder="e.g. Yes, all AJ Travels one-way and outstation fares explicitly include toll plaza charges..."
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Section E — Related Articles Card */}
                <div className="admin-form-section">
                  <div className="admin-form-section-title">
                    <FileText size={16} color="#0284C7" />
                    <span>Section E — Related Articles ({formData.relatedPosts.length} selected)</span>
                  </div>

                  <p style={{ fontSize: '0.78rem', color: '#64748B', marginTop: 0, marginBottom: '1rem' }}>
                    Select articles from your existing library to display in the "Related Guides" section. Current article is automatically excluded.
                  </p>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                      gap: '0.65rem',
                      maxHeight: '260px',
                      overflowY: 'auto',
                    }}
                  >
                    {availableArticles
                      .filter((a) => (isEditMode ? a.id !== blog.id : a.slug !== formData.slug))
                      .map((art) => {
                        const isSelected = formData.relatedPosts.includes(art.slug);
                        return (
                          <div
                            key={art.slug}
                            onClick={() => toggleRelatedPost(art.slug)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.6rem',
                              padding: '0.6rem 0.85rem',
                              borderRadius: '8px',
                              border: isSelected ? '2px solid #0284C7' : '1px solid #E2E8F0',
                              backgroundColor: isSelected ? '#F0F9FF' : '#FFFFFF',
                              cursor: 'pointer',
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}} // handled by parent onClick
                              style={{ cursor: 'pointer' }}
                            />
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {art.title}
                              </div>
                              <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
                                {art.category} • {art.slug}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* TAB 4: BOOKING DEFAULTS & SEO SETTINGS (Sections F & G) */}
            {/* ============================================================ */}
            {activeTab === 'seo' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Section F — Booking Defaults Card */}
                <div className="admin-form-section">
                  <div className="admin-form-section-title">
                    <Car size={16} color="#0284C7" />
                    <span>Section F — Contextual Booking Sidebar Defaults</span>
                  </div>

                  <p style={{ fontSize: '0.78rem', color: '#64748B', marginTop: 0, marginBottom: '1rem' }}>
                    Configure the corridor defaults used by the sticky sidebar booking calculator on this article's page.
                  </p>

                  <div className="admin-form-grid-2">
                    <div className="admin-form-group">
                      <label className="admin-form-label">Pickup Location Key</label>
                      <input
                        type="text"
                        className="admin-form-input"
                        value={formData.pickupDefault}
                        onChange={(e) => setFormData((p) => ({ ...p, pickupDefault: e.target.value.toLowerCase() }))}
                        placeholder="e.g. pune"
                      />
                    </div>

                    <div className="admin-form-group">
                      <label className="admin-form-label">Drop Location Key</label>
                      <input
                        type="text"
                        className="admin-form-input"
                        value={formData.dropDefault}
                        onChange={(e) => setFormData((p) => ({ ...p, dropDefault: e.target.value.toLowerCase() }))}
                        placeholder="e.g. mumbai"
                      />
                    </div>
                  </div>
                </div>

                {/* Section G — SEO Settings Card */}
                <div className="admin-form-section">
                  <div className="admin-form-section-title">
                    <Search size={16} color="#0284C7" />
                    <span>Section G — Search Engine Optimization (SEO)</span>
                  </div>

                  <div className="admin-form-group">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <label className="admin-form-label" style={{ margin: 0 }}>SEO Meta Title</label>
                      <span style={{ fontSize: '0.72rem', color: formData.metaTitle.length > 60 ? '#D97706' : '#64748B' }}>
                        {formData.metaTitle.length} / 60 recommended
                      </span>
                    </div>
                    <input
                      type="text"
                      className="admin-form-input"
                      value={formData.metaTitle}
                      onChange={(e) => setFormData((p) => ({ ...p, metaTitle: e.target.value }))}
                      placeholder="e.g. Pune to Mumbai One-Way Cab | Rates, Routes & Booking - AJ Travels"
                    />
                  </div>

                  <div className="admin-form-group">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <label className="admin-form-label" style={{ margin: 0 }}>SEO Meta Description</label>
                      <span style={{ fontSize: '0.72rem', color: formData.metaDesc.length > 160 ? '#D97706' : '#64748B' }}>
                        {formData.metaDesc.length} / 160 recommended
                      </span>
                    </div>
                    <textarea
                      className="admin-form-textarea"
                      rows={3}
                      value={formData.metaDesc}
                      onChange={(e) => setFormData((p) => ({ ...p, metaDesc: e.target.value }))}
                      placeholder="e.g. Looking for a reliable Pune to Mumbai one-way cab? Discover transparent fares with tolls included..."
                    />
                  </div>

                  {/* Canonical URL Preview */}
                  <div className="admin-form-group">
                    <label className="admin-form-label">Canonical URL (Permanent Indexing Anchor)</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      value={formData.canonicalUrl || `https://ajtravelspune.com/${formData.slug}/`}
                      readOnly
                      style={{ backgroundColor: '#F1F5F9', color: '#64748B' }}
                    />
                  </div>

                  {/* Search Snippet Preview Box */}
                  <div
                    style={{
                      marginTop: '1.25rem',
                      padding: '1.25rem',
                      borderRadius: '10px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                    }}
                  >
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
                      Google Search Result Snippet Preview:
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#202124', marginBottom: '0.15rem' }}>
                      https://ajtravelspune.com › blog › {formData.slug || 'pune-to-mumbai-cab'}
                    </div>
                    <div style={{ fontSize: '1.15rem', color: '#1A0DAB', fontWeight: 600, cursor: 'pointer', lineHeight: 1.3, marginBottom: '0.35rem' }}>
                      {formData.metaTitle || formData.title || 'Untitled Travel Article — AJ Travels Pune'}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#4D5156', lineHeight: 1.4 }}>
                      {formData.metaDesc || formData.summary || 'Essential travel intelligence, route comparison, luggage capacities and taxi advice from AJ Travels.'}
                    </div>
                  </div>
                </div>

                {/* Display Order & Featured Toggles */}
                <div className="admin-form-section">
                  <div className="admin-form-grid-2">
                    <div className="admin-form-group">
                      <label className="admin-form-label">Display Priority Order</label>
                      <input
                        type="number"
                        className="admin-form-input"
                        value={formData.displayOrder}
                        onChange={(e) => setFormData((p) => ({ ...p, displayOrder: parseInt(e.target.value, 10) || 0 }))}
                        placeholder="0"
                      />
                      <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
                        Lower number displays earlier in lists (e.g. 1 before 2).
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', justifyContent: 'center' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700, color: '#0F172A' }}>
                        <input
                          type="checkbox"
                          checked={formData.isFeatured}
                          onChange={(e) => setFormData((p) => ({ ...p, isFeatured: e.target.checked }))}
                          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                        <span>Feature this article on Homepage Showcase</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer Save & Publish Controls */}
          <div
            className="admin-modal-footer"
            style={{
              padding: '1.1rem 1.75rem',
              backgroundColor: '#FFFFFF',
              borderTop: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            {/* Status indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span
                style={{
                  display: 'inline-block',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: formData.isPublished ? '#10B981' : '#F59E0B',
                }}
              />
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>
                Current Status: {formData.isPublished ? 'Published' : 'Draft'}
              </span>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <button
                type="button"
                onClick={onClose}
                className="admin-btn-secondary"
                disabled={submitting}
                style={{ padding: '0.55rem 1.25rem', fontWeight: 700 }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => handleSubmit(false)}
                disabled={submitting}
                className="admin-btn-secondary"
                style={{
                  padding: '0.55rem 1.25rem',
                  fontWeight: 700,
                  backgroundColor: '#FEF3C7 !important',
                  borderColor: '#FDE68A !important',
                  color: '#92400E !important',
                }}
              >
                {submitting ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                <span>Save as Draft</span>
              </button>

              <button
                type="button"
                onClick={() => handleSubmit(true)}
                disabled={submitting}
                className="admin-btn-primary"
                style={{ padding: '0.55rem 1.5rem', fontWeight: 700 }}
              >
                {submitting ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={15} />
                    <span>{isEditMode && formData.isPublished ? 'Update Published' : 'Publish Article'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Embedded Live Preview Modal */}
      <AdminBlogPreviewModal
        isOpen={isPreviewOpen}
        blog={formData}
        availableArticles={availableArticles}
        onClose={() => setIsPreviewOpen(false)}
      />
    </>
  );
};

