import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Globe,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Edit3,
  ArrowLeft,
  Save,
  Eye,
  Loader2,
  Map,
  ToggleLeft,
  ToggleRight,
  Image as ImageIcon,
  Link,
  Info,
  ExternalLink,
} from 'lucide-react';
import { seoApi } from '../../services/api';
import { API_BASE_URL } from '../../services/api';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const charColor = (len, warn, max) => {
  if (len === 0)    return '#94A3B8';
  if (len <= warn)  return '#22C55E';
  if (len <= max)   return '#F59E0B';
  return '#EF4444';
};

const StatusPill = ({ ok, label }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
    fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.6rem',
    borderRadius: '100px',
    background: ok ? '#DCFCE7' : '#FEF9C3',
    color: ok ? '#15803D' : '#92400E',
  }}>
    {ok ? <CheckCircle2 size={11} /> : <AlertTriangle size={11} />}
    {label}
  </span>
);

// ---------------------------------------------------------------------------
// Google SERP Preview
// ---------------------------------------------------------------------------
function SerpPreview({ title, description, url, domain }) {
  const displayTitle = title || 'Page Title Not Set';
  const displayDesc  = description || 'No meta description provided. Search engines may use page content instead.';
  const displayUrl   = domain + (url || '/');

  return (
    <div style={{
      border: '1px solid #E2E8F0', borderRadius: '12px',
      background: '#fff', padding: '1.25rem 1.5rem',
      fontFamily: 'Arial, sans-serif',
    }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748B', marginBottom: '0.5rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        Google Search Preview
      </div>
      {/* URL breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem' }}>
        <div style={{
          width: '18px', height: '18px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #4285F4, #34A853)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '9px', color: '#fff', fontWeight: 700, flexShrink: 0,
        }}>G</div>
        <span style={{ fontSize: '0.78rem', color: '#202124' }}>{displayUrl}</span>
      </div>
      {/* Title */}
      <div style={{
        fontSize: '1.1rem', color: '#1a0dab', fontWeight: 400,
        lineHeight: 1.3, marginBottom: '0.25rem',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        maxWidth: '560px',
        fontFamily: 'arial, sans-serif',
      }}>
        {displayTitle.length > 60 ? displayTitle.slice(0, 60) + '…' : displayTitle}
      </div>
      {/* Description */}
      <div style={{
        fontSize: '0.82rem', color: '#4D5156', lineHeight: 1.55,
        maxWidth: '560px',
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        fontFamily: 'arial, sans-serif',
      }}>
        {displayDesc.length > 160 ? displayDesc.slice(0, 160) + '…' : displayDesc}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page Editor
// ---------------------------------------------------------------------------
function PageEditor({ page, onBack, onSaved }) {
  const [form, setForm] = useState({
    seoTitle:        page.seoTitle        || '',
    metaDescription: page.metaDescription || '',
    canonicalUrl:    page.canonicalUrl    || '',
    isIndexable:     page.isIndexable     ?? true,
    ogTitle:         page.ogTitle         || '',
    ogDescription:   page.ogDescription   || '',
    ogImage:         page.ogImage         || '',
    slug:            page.slug            || '',
  });
  const [saving, setSaving]   = useState(false);
  const [saved,  setSaved]    = useState(false);
  const [errors, setErrors]   = useState([]);
  const [warnings, setWarnings] = useState([]);

  const domain = window.location.hostname === 'localhost'
    ? 'https://ajtoursandtravels.in'
    : window.location.origin;

  const set = (key, val) => {
    setForm(f => ({ ...f, [key]: val }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setErrors([]);
    setWarnings([]);
    try {
      const res = await seoApi.updatePage(page.pageKey, form);
      if (res.data?.warnings?.length) setWarnings(res.data.warnings);
      setSaved(true);
      if (onSaved) onSaved(res.data.data);
    } catch (err) {
      setErrors([err.response?.data?.message || 'Failed to save. Please try again.']);
    } finally {
      setSaving(false);
    }
  };

  const titleLen = form.seoTitle.length;
  const descLen  = form.metaDescription.length;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <button
          onClick={onBack}
          style={{
            background: '#F1F5F9', border: 'none', cursor: 'pointer',
            borderRadius: '8px', padding: '0.5rem', display: 'flex', alignItems: 'center',
            color: '#475569',
          }}
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>
            {page.pageLabel}
          </h2>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.1rem' }}>
            Edit SEO metadata · <code style={{ background: '#F1F5F9', padding: '0.1rem 0.35rem', borderRadius: '4px', fontSize: '0.72rem' }}>{page.pageUrl}</code>
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {saved && (
            <span style={{ fontSize: '0.75rem', color: '#16A34A', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}>
              <CheckCircle2 size={14} /> Saved
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              background: saving ? '#CBD5E1' : 'linear-gradient(135deg, #0EA5E9, #0284C7)',
              color: '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
              borderRadius: '8px', padding: '0.6rem 1.1rem',
              fontSize: '0.82rem', fontWeight: 700,
            }}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Errors / Warnings */}
      {errors.map((e, i) => (
        <div key={i} style={{ background: '#FEE2E2', color: '#991B1B', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '0.75rem', fontSize: '0.82rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <XCircle size={15} /> {e}
        </div>
      ))}
      {warnings.map((w, i) => (
        <div key={i} style={{ background: '#FEF9C3', color: '#92400E', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '0.75rem', fontSize: '0.82rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <AlertTriangle size={15} /> {w}
        </div>
      ))}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>

        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Search Appearance */}
          <div className="admin-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Search size={16} color="#0284C7" />
              <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0F172A' }}>Search Appearance</span>
            </div>

            {/* SEO Title */}
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: '0.3rem' }}>
              SEO Title
            </label>
            <input
              value={form.seoTitle}
              onChange={e => set('seoTitle', e.target.value)}
              placeholder="e.g. Best Pune to Mumbai Cab Service | AJ Tours"
              style={{
                width: '100%', boxSizing: 'border-box',
                border: '1.5px solid #E2E8F0', borderRadius: '8px', padding: '0.6rem 0.75rem',
                fontSize: '0.82rem', outline: 'none',
                borderColor: titleLen > 60 ? '#F59E0B' : '#E2E8F0',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem', fontSize: '0.7rem' }}>
              <span style={{ color: '#94A3B8' }}>Recommended: 50–60 characters</span>
              <span style={{ fontWeight: 700, color: charColor(titleLen, 60, 70) }}>
                {titleLen}/60
              </span>
            </div>

            {/* Meta Description */}
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: '0.3rem', marginTop: '0.9rem' }}>
              Meta Description
            </label>
            <textarea
              value={form.metaDescription}
              onChange={e => set('metaDescription', e.target.value)}
              placeholder="e.g. Book reliable Pune to Mumbai cabs online. Fixed prices, verified drivers, and WhatsApp support."
              rows={3}
              style={{
                width: '100%', boxSizing: 'border-box', resize: 'vertical',
                border: '1.5px solid #E2E8F0', borderRadius: '8px', padding: '0.6rem 0.75rem',
                fontSize: '0.82rem', outline: 'none', fontFamily: 'inherit',
                borderColor: descLen > 160 ? '#F59E0B' : '#E2E8F0',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem', fontSize: '0.7rem' }}>
              <span style={{ color: '#94A3B8' }}>Recommended: 130–160 characters</span>
              <span style={{ fontWeight: 700, color: charColor(descLen, 160, 180) }}>
                {descLen}/160
              </span>
            </div>

            {/* Canonical URL */}
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: '0.3rem', marginTop: '0.9rem' }}>
              Canonical URL <span style={{ fontWeight: 400, color: '#94A3B8' }}>(optional)</span>
            </label>
            <input
              value={form.canonicalUrl}
              onChange={e => set('canonicalUrl', e.target.value)}
              placeholder={`${domain}${page.pageUrl}`}
              style={{
                width: '100%', boxSizing: 'border-box',
                border: '1.5px solid #E2E8F0', borderRadius: '8px', padding: '0.6rem 0.75rem',
                fontSize: '0.82rem', outline: 'none',
              }}
            />
            <p style={{ fontSize: '0.7rem', color: '#94A3B8', margin: '0.2rem 0 0' }}>
              Leave blank to use default page URL.
            </p>

            {/* Indexability toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #F1F5F9' }}>
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>Allow Search Engine Indexing</div>
                <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>
                  {form.isIndexable ? 'Page is indexable (index, follow)' : 'Page is noindex, nofollow'}
                </div>
              </div>
              <button
                onClick={() => set('isIndexable', !form.isIndexable)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: form.isIndexable ? '#22C55E' : '#94A3B8' }}
              >
                {form.isIndexable ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
              </button>
            </div>
          </div>

          {/* Open Graph */}
          <div className="admin-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Globe size={16} color="#7C3AED" />
              <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0F172A' }}>Social / Open Graph</span>
            </div>

            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: '0.3rem' }}>OG Title</label>
            <input
              value={form.ogTitle}
              onChange={e => set('ogTitle', e.target.value)}
              placeholder="Social share title (defaults to SEO title)"
              style={{ width: '100%', boxSizing: 'border-box', border: '1.5px solid #E2E8F0', borderRadius: '8px', padding: '0.6rem 0.75rem', fontSize: '0.82rem', outline: 'none' }}
            />

            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: '0.3rem', marginTop: '0.9rem' }}>OG Description</label>
            <textarea
              value={form.ogDescription}
              onChange={e => set('ogDescription', e.target.value)}
              placeholder="Social share description (defaults to meta description)"
              rows={2}
              style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical', border: '1.5px solid #E2E8F0', borderRadius: '8px', padding: '0.6rem 0.75rem', fontSize: '0.82rem', outline: 'none', fontFamily: 'inherit' }}
            />

            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: '0.3rem', marginTop: '0.9rem' }}>OG Image URL</label>
            <input
              value={form.ogImage}
              onChange={e => set('ogImage', e.target.value)}
              placeholder="https://ajtoursandtravels.in/og-image.jpg"
              style={{ width: '100%', boxSizing: 'border-box', border: '1.5px solid #E2E8F0', borderRadius: '8px', padding: '0.6rem 0.75rem', fontSize: '0.82rem', outline: 'none' }}
            />
            <p style={{ fontSize: '0.7rem', color: '#94A3B8', margin: '0.2rem 0 0' }}>
              Recommended: 1200×630px. Used when shared on WhatsApp, Facebook, Twitter.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* SERP Preview */}
          <SerpPreview
            title={form.seoTitle}
            description={form.metaDescription}
            url={form.canonicalUrl || page.pageUrl}
            domain={domain}
          />

          {/* OG Preview card */}
          {form.ogImage && (
            <div style={{
              border: '1px solid #E2E8F0', borderRadius: '12px', overflow: 'hidden',
              background: '#fff',
            }}>
              <img src={form.ogImage} alt="OG Preview" style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block' }} onError={e => e.target.style.display = 'none'} />
              <div style={{ padding: '0.75rem 1rem' }}>
                <div style={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                  {domain.replace('https://', '')}
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0F172A' }}>
                  {form.ogTitle || form.seoTitle || page.pageLabel}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '0.2rem' }}>
                  {form.ogDescription || form.metaDescription}
                </div>
              </div>
            </div>
          )}

          {/* Info card */}
          <div style={{
            background: 'linear-gradient(135deg, #EFF6FF, #F0FDF4)',
            border: '1px solid #BFDBFE', borderRadius: '12px',
            padding: '1rem 1.25rem',
          }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
              <Info size={15} color="#0284C7" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
              <div style={{ fontSize: '0.76rem', color: '#1E40AF', lineHeight: 1.6 }}>
                <strong>Note:</strong> Changes here update the database. To reflect metadata in live page HTML, the frontend must read these values from the API and inject them into <code>&lt;head&gt;</code> tags. Character counts are guidance — not hard limits.
              </div>
            </div>
          </div>

          {/* Sitemap & Robots */}
          <div className="admin-card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <Map size={16} color="#0284C7" />
              <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0F172A' }}>Sitemap & Robots</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <a
                href={`${API_BASE_URL}/sitemap.xml`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#0284C7', fontWeight: 600, textDecoration: 'none' }}
              >
                <ExternalLink size={12} /> View sitemap.xml
              </a>
              <a
                href={`${API_BASE_URL}/robots.txt`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#0284C7', fontWeight: 600, textDecoration: 'none' }}
              >
                <ExternalLink size={12} /> View robots.txt
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SEO Dashboard (index view)
// ---------------------------------------------------------------------------
function SeoDashboard({ pages, stats, onEdit, loading }) {
  const domain = window.location.hostname === 'localhost'
    ? 'https://ajtoursandtravels.in'
    : window.location.origin;

  if (loading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center', color: '#94A3B8' }}>
        <Loader2 size={28} style={{ margin: '0 auto', display: 'block', animation: 'spin 1s linear infinite' }} />
        <p style={{ marginTop: '0.75rem', fontSize: '0.82rem' }}>Loading SEO data…</p>
      </div>
    );
  }

  return (
    <div>
      {/* Stats Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Pages', value: stats.total,        icon: <FileText size={20} />, color: '#0284C7', bg: '#EFF6FF' },
          { label: 'Indexable',   value: stats.indexable,    icon: <Globe size={20} />,    color: '#16A34A', bg: '#F0FDF4' },
          { label: 'Missing Title', value: stats.missingTitle, icon: <AlertTriangle size={20} />, color: stats.missingTitle > 0 ? '#D97706' : '#16A34A', bg: stats.missingTitle > 0 ? '#FFFBEB' : '#F0FDF4' },
          { label: 'Missing Desc', value: stats.missingDesc,  icon: <AlertTriangle size={20} />, color: stats.missingDesc > 0 ? '#D97706' : '#16A34A',   bg: stats.missingDesc > 0  ? '#FFFBEB' : '#F0FDF4' },
        ].map(s => (
          <div key={s.label} className="admin-stat-card" style={{ padding: '1rem', gap: '0.75rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, flexShrink: 0 }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748B', marginBottom: '0.15rem' }}>{s.label}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0F172A', lineHeight: 1 }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Sitemap / Robots quick links */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <a
          href={`${API_BASE_URL}/sitemap.xml`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.5rem 1rem', borderRadius: '8px',
            background: '#EFF6FF', color: '#0284C7',
            fontSize: '0.78rem', fontWeight: 700, textDecoration: 'none',
            border: '1px solid #BFDBFE',
          }}
        >
          <Map size={14} /> View sitemap.xml
        </a>
        <a
          href={`${API_BASE_URL}/robots.txt`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.5rem 1rem', borderRadius: '8px',
            background: '#F0FDF4', color: '#16A34A',
            fontSize: '0.78rem', fontWeight: 700, textDecoration: 'none',
            border: '1px solid #BBF7D0',
          }}
        >
          <FileText size={14} /> View robots.txt
        </a>
        <div style={{ fontSize: '0.75rem', color: '#94A3B8', alignSelf: 'center' }}>
          Domain: <strong style={{ color: '#0F172A' }}>{domain}</strong>
        </div>
      </div>

      {/* Pages Table */}
      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.1rem 1.5rem', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Search size={16} color="#0284C7" />
          <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0F172A' }}>Pages &amp; SEO Status</span>
        </div>
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Page</th>
                <th>URL</th>
                <th>SEO Title</th>
                <th>Meta Desc</th>
                <th>Indexable</th>
                <th>OG Image</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {pages.map(p => (
                <tr key={p.pageKey}>
                  <td style={{ fontWeight: 700, color: '#0F172A' }}>{p.pageLabel}</td>
                  <td>
                    <code style={{ background: '#F1F5F9', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.72rem', color: '#475569' }}>
                      {p.pageUrl}
                    </code>
                  </td>
                  <td>
                    {p.seoTitle
                      ? <StatusPill ok={true}  label="Set" />
                      : <StatusPill ok={false} label="Missing" />}
                  </td>
                  <td>
                    {p.metaDescription
                      ? <StatusPill ok={true}  label="Set" />
                      : <StatusPill ok={false} label="Missing" />}
                  </td>
                  <td>
                    {p.isIndexable
                      ? <StatusPill ok={true}  label="Index" />
                      : <StatusPill ok={false} label="Noindex" />}
                  </td>
                  <td>
                    {p.ogImage
                      ? <StatusPill ok={true}  label="Set" />
                      : <StatusPill ok={false} label="Missing" />}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => onEdit(p)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                        background: '#EFF6FF', color: '#0284C7',
                        border: '1px solid #BFDBFE', borderRadius: '6px',
                        padding: '0.35rem 0.75rem', fontSize: '0.75rem', fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      <Edit3 size={12} /> Edit SEO
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Export
// ---------------------------------------------------------------------------
export const AdminSeo = () => {
  const [pages,   setPages]   = useState([]);
  const [stats,   setStats]   = useState({ total: 0, indexable: 0, missingTitle: 0, missingDesc: 0 });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // the page object being edited
  const [error,   setError]   = useState(null);

  const fetchPages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await seoApi.getPages();
      setPages(res.data.data.pages);
      setStats(res.data.data.stats);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load SEO data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPages(); }, [fetchPages]);

  const handleSaved = (updatedPage) => {
    setPages(prev => prev.map(p => p.pageKey === updatedPage.pageKey ? updatedPage : p));
    // Recalculate stats
    setPages(prev => {
      const updated = prev.map(p => p.pageKey === updatedPage.pageKey ? updatedPage : p);
      setStats({
        total:        updated.length,
        indexable:    updated.filter(p => p.isIndexable).length,
        missingTitle: updated.filter(p => !p.seoTitle).length,
        missingDesc:  updated.filter(p => !p.metaDescription).length,
      });
      return updated;
    });
  };

  if (error) {
    return (
      <div style={{ padding: '2rem' }}>
        <div style={{ background: '#FEE2E2', color: '#991B1B', borderRadius: '10px', padding: '1rem 1.25rem', display: 'flex', gap: '0.6rem', alignItems: 'center', fontSize: '0.85rem' }}>
          <XCircle size={18} /> {error}
        </div>
        <button onClick={fetchPages} style={{ marginTop: '1rem', background: '#EFF6FF', color: '#0284C7', border: '1px solid #BFDBFE', borderRadius: '8px', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem' }}>
          Retry
        </button>
      </div>
    );
  }

  if (editing) {
    return (
      <PageEditor
        page={editing}
        onBack={() => setEditing(null)}
        onSaved={(updated) => { handleSaved(updated); setEditing(updated); }}
      />
    );
  }

  return (
    <SeoDashboard
      pages={pages}
      stats={stats}
      onEdit={setEditing}
      loading={loading}
    />
  );
};
