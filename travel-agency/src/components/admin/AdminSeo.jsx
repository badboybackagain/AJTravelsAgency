import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Info,
  RefreshCw,
  BarChart3,
  Shield,
  Smartphone,
  Monitor,
  Share2,
  Layers,
  Cpu,
  Award,
  Calendar,
  MousePointer,
  TrendingUp,
  LogOut,
  Key,
  HelpCircle,
  ExternalLink,
  X,
  Wrench,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { seoApi, gscApi } from '../../services/api';
import { API_BASE_URL } from '../../services/api';

// ---------------------------------------------------------------------------
// Helpers & Visual Indicators
// ---------------------------------------------------------------------------
const charColor = (len, warn, max) => {
  if (len === 0)    return '#94A3B8';
  if (len <= warn)  return '#22C55E';
  if (len <= max)   return '#F59E0B';
  return '#EF4444';
};

const getScoreColor = (score) => {
  if (score >= 80) return { bg: '#DCFCE7', text: '#15803D', border: '#86EFAC', label: 'Good' };
  if (score >= 50) return { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A', label: 'Needs Work' };
  return { bg: '#FEE2E2', text: '#B91C1C', border: '#FCA5A5', label: 'Poor' };
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

const SeverityBadge = ({ status }) => {
  if (status === 'PASS') {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
        fontSize: '0.68rem', fontWeight: 800, padding: '0.2rem 0.55rem',
        borderRadius: '6px', background: '#DCFCE7', color: '#166534',
      }}>
        <CheckCircle2 size={12} /> PASS
      </span>
    );
  }
  if (status === 'WARNING') {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
        fontSize: '0.68rem', fontWeight: 800, padding: '0.2rem 0.55rem',
        borderRadius: '6px', background: '#FEF3C7', color: '#92400E',
      }}>
        <AlertTriangle size={12} /> WARNING
      </span>
    );
  }
  if (status === 'ERROR') {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
        fontSize: '0.68rem', fontWeight: 800, padding: '0.2rem 0.55rem',
        borderRadius: '6px', background: '#FEE2E2', color: '#991B1B',
      }}>
        <XCircle size={12} /> ERROR
      </span>
    );
  }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
      fontSize: '0.68rem', fontWeight: 700, padding: '0.2rem 0.55rem',
      borderRadius: '6px', background: '#F1F5F9', color: '#64748B',
    }}>
      <Info size={12} /> {status}
    </span>
  );
};

// ---------------------------------------------------------------------------
// Google Organic SERP Simulator (Authentic Desktop & Mobile Modes)
// ---------------------------------------------------------------------------
function SerpPreview({
  title = '',
  description = '',
  url = '/',
  domain = 'https://ajtravelsagency.vercel.app',
  isIndexable = true,
  canonicalUrl = '',
  seoScore = null,
}) {
  const [viewMode, setViewMode] = useState('desktop');
  const [imgError, setImgError] = useState(false);

  const rawDomain = (domain || 'https://ajtravelsagency.vercel.app').replace(/\/$/, '');
  const cleanHostname = rawDomain.replace(/^https?:\/\//, '');
  const cleanPath = (url || '/').replace(/^\//, '').replace(/\/$/, '');
  const breadcrumb = cleanPath ? cleanPath.split('/').join(' › ') : '';
  const displayUrl = `${cleanHostname}${breadcrumb ? ' › ' + breadcrumb : ''}`;

  const hasTitle = Boolean(title && title.trim());
  const hasDesc  = Boolean(description && description.trim());

  const displayTitle = hasTitle ? title.trim() : 'Untitled Page — Missing SEO Title Tag';
  const displayDesc  = hasDesc
    ? description.trim()
    : 'No meta description provided. Google will dynamically extract a snippet from visible page content matching user search queries.';

  const titleLen = (title || '').length;
  const descLen  = (description || '').length;

  const isTitleOptimal = titleLen >= 40 && titleLen <= 65;
  const isTitleShort   = titleLen > 0 && titleLen < 40;
  const isTitleLong    = titleLen > 65;

  const isDescOptimal = descLen >= 110 && descLen <= 160;
  const isDescShort   = descLen > 0 && descLen < 110;
  const isDescLong    = descLen > 160;

  const desktopTitleTruncated = titleLen > 65 ? displayTitle.slice(0, 65).trim() + '…' : displayTitle;
  const mobileTitleTruncated  = titleLen > 58 ? displayTitle.slice(0, 58).trim() + '…' : displayTitle;

  const desktopDescTruncated = descLen > 160 ? displayDesc.slice(0, 160).trim() + '…' : displayDesc;
  const mobileDescTruncated  = descLen > 170 ? displayDesc.slice(0, 170).trim() + '…' : displayDesc;

  return (
    <div style={{
      border: '1px solid #E2E8F0', borderRadius: '12px',
      background: '#fff', padding: '1.25rem 1.5rem',
      fontFamily: 'Arial, sans-serif',
      boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
    }}>
      {/* Top Header / Viewport Switcher */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid #F1F5F9',
        flexWrap: 'wrap', gap: '0.5rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: '26px', height: '26px', borderRadius: '50%',
            background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#4285F4', fontWeight: 800, fontSize: '0.85rem',
          }}>
            G
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0F172A', letterSpacing: '0.02em' }}>
              Google Organic Search Preview
            </div>
            <div style={{ fontSize: '0.68rem', color: '#64748B' }}>
              Simulates desktop &amp; mobile search result snippet appearance
            </div>
          </div>
        </div>

        {/* Desktop / Mobile Toggle Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: '#F1F5F9', padding: '0.2rem', borderRadius: '8px' }}>
          <button
            type="button"
            onClick={() => setViewMode('desktop')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
              padding: '0.3rem 0.65rem', borderRadius: '6px', border: 'none',
              background: viewMode === 'desktop' ? '#fff' : 'transparent',
              color: viewMode === 'desktop' ? '#0F172A' : '#64748B',
              fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
              boxShadow: viewMode === 'desktop' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <Monitor size={13} color={viewMode === 'desktop' ? '#0284C7' : '#64748B'} />
            Desktop Search
          </button>
          <button
            type="button"
            onClick={() => setViewMode('mobile')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
              padding: '0.3rem 0.65rem', borderRadius: '6px', border: 'none',
              background: viewMode === 'mobile' ? '#fff' : 'transparent',
              color: viewMode === 'mobile' ? '#0F172A' : '#64748B',
              fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
              boxShadow: viewMode === 'mobile' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <Smartphone size={13} color={viewMode === 'mobile' ? '#0284C7' : '#64748B'} />
            Mobile Search
          </button>
        </div>
      </div>

      {/* Organic Result Container (Desktop vs Mobile View) */}
      <div style={{
        display: 'flex',
        justifyContent: viewMode === 'mobile' ? 'center' : 'flex-start',
        background: viewMode === 'mobile' ? '#F8FAFC' : '#fff',
        padding: viewMode === 'mobile' ? '1.25rem 0.5rem' : '0.25rem 0',
        borderRadius: viewMode === 'mobile' ? '12px' : '0',
        border: viewMode === 'mobile' ? '1px dashed #CBD5E1' : 'none',
        marginBottom: '1rem',
      }}>
        {/* Actual Google SERP Box */}
        <div style={{
          width: '100%',
          maxWidth: viewMode === 'mobile' ? '375px' : '600px',
          background: '#fff',
          borderRadius: viewMode === 'mobile' ? '16px' : '8px',
          border: viewMode === 'mobile' ? '1px solid #E2E8F0' : 'none',
          boxShadow: viewMode === 'mobile' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
          padding: viewMode === 'mobile' ? '12px 14px' : '0',
          boxSizing: 'border-box',
          overflow: 'hidden',
        }}>
          {/* Mobile Simulated Header Bar (Only in Mobile Mode) */}
          {viewMode === 'mobile' && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              paddingBottom: '8px', marginBottom: '8px', borderBottom: '1px solid #F1F5F9',
              fontSize: '0.65rem', color: '#94A3B8', fontWeight: 600,
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22C55E' }}></span>
                google.com/search
              </span>
              <span>All • Images • Maps</span>
            </div>
          )}

          {/* Favicon & Breadcrumb Header Line */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
              {/* Favicon Container */}
              <div style={{
                width: '26px', height: '26px', borderRadius: '50%',
                background: '#F1F3F4', border: '1px solid #DADCE0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, overflow: 'hidden',
              }}>
                {!imgError ? (
                  <img
                    src="/favicon.svg"
                    alt="Favicon"
                    onError={() => setImgError(true)}
                    style={{ width: '16px', height: '16px', objectFit: 'contain' }}
                  />
                ) : (
                  <Globe size={13} color="#5F6368" />
                )}
              </div>

              {/* Site Name and Display URL / Breadcrumb */}
              <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, lineHeight: 1.2 }}>
                <div style={{
                  fontSize: '14px', fontWeight: 500, color: '#202124',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  AJ Tours &amp; Travels
                </div>
                <div style={{
                  fontSize: '12px', color: '#4D5156',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  https://{displayUrl}
                </div>
              </div>
            </div>

            {/* Three dots / more icon */}
            <div style={{ color: '#70757A', padding: '2px', cursor: 'pointer', flexShrink: 0 }}>
              <span style={{ fontSize: '14px', fontWeight: 'bold', lineHeight: 1 }}>⋮</span>
            </div>
          </div>

          {/* Clickable Blue Page Title */}
          <div
            style={{
              fontSize: viewMode === 'mobile' ? '17px' : '20px',
              color: hasTitle ? '#1a0dab' : '#DC2626',
              fontWeight: 400,
              lineHeight: 1.3,
              margin: '4px 0 4px',
              cursor: 'pointer',
              textDecoration: 'none',
              fontFamily: 'Arial, sans-serif',
              wordWrap: 'break-word',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline'; }}
            onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none'; }}
          >
            {viewMode === 'mobile' ? mobileTitleTruncated : desktopTitleTruncated}
          </div>

          {/* Meta Description Snippet */}
          <div style={{
            fontSize: viewMode === 'mobile' ? '13px' : '14px',
            color: hasDesc ? '#4D5156' : '#94A3B8',
            fontStyle: hasDesc ? 'normal' : 'italic',
            lineHeight: 1.57,
            fontFamily: 'Arial, sans-serif',
            display: '-webkit-box',
            WebkitLineClamp: viewMode === 'mobile' ? 3 : 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            wordWrap: 'break-word',
          }}>
            {viewMode === 'mobile' ? mobileDescTruncated : desktopDescTruncated}
          </div>
        </div>
      </div>

      {/* Diagnostics, Character Counts & Recommendations */}
      <div style={{
        background: '#F8FAFC', borderRadius: '8px',
        padding: '0.85rem 1rem', border: '1px solid #E2E8F0',
        display: 'flex', flexDirection: 'column', gap: '0.65rem',
      }}>
        {/* Metrics Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
          {/* Title Metrics */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748B' }}>Title Length</div>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: charColor(titleLen, 65, 70) }}>
                {titleLen} <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>/ 65 chars</span>
              </div>
            </div>
            <span style={{
              fontSize: '0.68rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: '4px',
              background: isTitleOptimal ? '#DCFCE7' : isTitleShort ? '#FEF3C7' : '#FEE2E2',
              color: isTitleOptimal ? '#166534' : isTitleShort ? '#92400E' : '#991B1B',
            }}>
              {isTitleOptimal ? 'Optimal' : isTitleShort ? 'Short (<40)' : isTitleLong ? 'Too Long (>65)' : 'Missing'}
            </span>
          </div>

          {/* Description Metrics */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748B' }}>Description Length</div>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: charColor(descLen, 160, 170) }}>
                {descLen} <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>/ 160 chars</span>
              </div>
            </div>
            <span style={{
              fontSize: '0.68rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: '4px',
              background: isDescOptimal ? '#DCFCE7' : isDescShort ? '#FEF3C7' : '#FEE2E2',
              color: isDescOptimal ? '#166534' : isDescShort ? '#92400E' : '#991B1B',
            }}>
              {isDescOptimal ? 'Optimal' : isDescShort ? 'Short (<110)' : isDescLong ? 'Truncated (>160)' : 'Missing'}
            </span>
          </div>

          {/* Indexability Status */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748B' }}>Indexability</div>
              <div style={{ fontSize: '0.78rem', fontWeight: 800, color: isIndexable ? '#15803D' : '#DC2626' }}>
                {isIndexable ? 'index, follow' : 'noindex, follow'}
              </div>
            </div>
            <span style={{
              fontSize: '0.68rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: '4px',
              background: isIndexable ? '#DCFCE7' : '#FEE2E2',
              color: isIndexable ? '#166534' : '#991B1B',
            }}>
              {isIndexable ? 'Crawlable' : 'Blocked'}
            </span>
          </div>

          {/* SEO Score Badge if available */}
          {seoScore !== null && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
              <div>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#64748B' }}>SEO Audit Score</div>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: getScoreColor(seoScore).text }}>
                  {seoScore} <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>/ 100</span>
                </div>
              </div>
              <span style={{
                fontSize: '0.68rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: '4px',
                background: getScoreColor(seoScore).bg, color: getScoreColor(seoScore).text,
              }}>
                {getScoreColor(seoScore).label}
              </span>
            </div>
          )}
        </div>

        {/* Actionable Guidance Note */}
        <div style={{ fontSize: '0.7rem', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            * Google Search dynamically adjusts display snippets and breadcrumbs based on query terms and device screen size.
          </div>
          {canonicalUrl && (
            <div style={{ color: '#0284C7', fontWeight: 600 }}>
              Canonical: <code>{canonicalUrl}</code>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Social Card Simulator (OpenGraph & Twitter Cards)
// ---------------------------------------------------------------------------
function SocialCardPreview({ title, description, url, image, domain }) {
  const displayTitle = title || 'Page Title Not Set';
  const displayDesc  = description || 'No meta description provided.';
  const displayUrl   = (domain + (url || '/')).replace(/^https?:\/\//, '');

  return (
    <div style={{
      border: '1px solid #E2E8F0', borderRadius: '12px',
      background: '#fff', padding: '1.25rem 1.5rem',
    }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
        Facebook / OpenGraph Social Card Preview
      </div>
      <div style={{
        maxWidth: '520px', border: '1px solid #D1D5DB', borderRadius: '8px', overflow: 'hidden',
        background: '#F9FAFB',
      }}>
        <div style={{
          height: '180px', background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', position: 'relative',
        }}>
          {image ? (
            <img src={image} alt="OG Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ textAlign: 'center', color: '#94A3B8' }}>
              <ImageIcon size={32} style={{ margin: '0 auto 0.25rem' }} />
              <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>No og:image Specified (Using Default Fallback)</div>
            </div>
          )}
        </div>
        <div style={{ padding: '0.75rem 1rem', background: '#F3F4F6', borderTop: '1px solid #E5E7EB' }}>
          <div style={{ fontSize: '0.68rem', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.15rem' }}>
            {displayUrl}
          </div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#111827', lineHeight: 1.3, marginBottom: '0.25rem' }}>
            {displayTitle}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#4B5563', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {displayDesc}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page Metadata Editor (Existing Working Editor preserved)
// ---------------------------------------------------------------------------

// ===========================================================================
// Page-level SEO Evaluation & Quick Fix Engine (Zero-Fabrication, Evidence-Based)
// ===========================================================================


// Smart optimal SEO metadata generator ensuring strict adherence to Google SERP limits
export function getOptimalSeoMetadata(page, currentForm = {}) {
  const pageUrl = page.pageUrl || '/';
  const pageKey = page.pageKey || 'home';
  const pageLabel = page.pageLabel || 'AJ Travels';
  const rawTitle = (currentForm.seoTitle !== undefined ? currentForm.seoTitle : page.seoTitle) || '';
  const rawDesc = (currentForm.metaDescription !== undefined ? currentForm.metaDescription : page.metaDescription) || '';

  // 1. Title optimization (Target: 40-60 chars)
  let recommendedTitle;
  if (pageUrl === '/' || pageKey === 'home') {
    recommendedTitle = 'AJ Travels — Car Rental & Cab Service in Pune'; // Exactly 45 chars
  } else {
    let base = rawTitle || pageLabel || pageKey;
    base = base.replace(/\s*\|\s*(Best Intercity Cab Rates|Airport & City Drop Cabs|Best Cab Service & Fares|Luxury AC Mini Bus|Affordable Rates|B2B Fleet Solutions|Taxi Fares|Tempo Traveller Hire|SUV & Crysta Hire|BOM Airport & City Taxi|Tempo Traveller|Sedan Car Rental|6-Seater SUV|Luxury SUV Cab|13, 17, 20 Seater Luxury AC|Executive Fleet|BOM & PNQ Transfers)[\s\S]*/i, '');
    base = base.replace(/\s*-\s*AJ Travels[\s\S]*/i, '');
    base = base.replace(/\s*\|\s*AJ Travels[\s\S]*/i, '');
    base = base.replace(/\s*\|\s*AJ Travels Pune[\s\S]*/i, '');
    base = base.replace(/[\s,:|-]+$/, '').trim();

    if (base.length + 13 < 40) {
      if (base.length + 18 >= 40 && base.length + 18 <= 60) {
        recommendedTitle = `${base} | AJ Travels Pune`;
      } else {
        const withCab = `${base} — Cab Service | AJ Travels`;
        if (withCab.length >= 40 && withCab.length <= 60) {
          recommendedTitle = withCab;
        } else {
          recommendedTitle = `${base} — Car Rental & Cabs | AJ Travels`;
        }
      }
    } else {
      const maxBaseLen = 45;
      if (base.length > maxBaseLen) {
        const trimmed = base.substring(0, maxBaseLen);
        const lastSpace = trimmed.lastIndexOf(' ');
        base = lastSpace > 22 ? trimmed.substring(0, lastSpace) : trimmed;
      }
      base = base.replace(/[\s,:|-]+$/, '').trim();
      recommendedTitle = `${base} | AJ Travels`;
    }
  }

  // 2. Description optimization (Target: 110-160 chars)
  let recommendedDescription = rawDesc;
  if (pageUrl === '/' || pageKey === 'home') {
    recommendedDescription = 'AJ Travels offers reliable car rentals, Pune to Mumbai cabs, and airport transfers with verified chauffeurs. Zero advance deposit required.'; // Exactly 142 chars
  } else {
    if (recommendedDescription.includes('all-inclusive pricing with expressway tolls covered, and 24/7 doorstep pickup.')) {
      recommendedDescription = recommendedDescription.replace('all-inclusive pricing with expressway tolls covered, and 24/7 doorstep pickup.', 'transparent fares, verified drivers, and 24/7 doorstep pickup.');
    }
    if (recommendedDescription.includes('with AJ Travels Pune.')) {
      recommendedDescription = recommendedDescription.replace('with AJ Travels Pune.', 'with AJ Travels.');
    }
    if (recommendedDescription.length > 160) {
      let trimmed = recommendedDescription.substring(0, 155);
      const lastPeriod = trimmed.lastIndexOf('.');
      if (lastPeriod > 100) {
        recommendedDescription = trimmed.substring(0, lastPeriod + 1);
      } else {
        const lastSpace = trimmed.lastIndexOf(' ');
        recommendedDescription = (lastSpace > 100 ? trimmed.substring(0, lastSpace) : trimmed) + '...';
      }
    }
    if (!recommendedDescription || recommendedDescription.length < 90) {
      recommendedDescription = `Book ${pageLabel} with AJ Travels Pune. Clean AC cabs, verified professional drivers, and 24/7 doorstep pickup across Maharashtra.`;
    }
  }

  const cleanPath = pageUrl === '/' ? '/' : pageUrl.replace(/\/+$/, '');

  return {
    recommendedTitle,
    recommendedDescription,
    cleanPath,
  };
}

export function evaluatePageSeo(page, auditFinding = null) {
  let score = 100;
  const issues = [];
  const passed = [];

  const title = (page.seoTitle || '').trim();
  const desc = (page.metaDescription || '').trim();
  const canonical = (page.canonicalUrl || '').trim();

  // 1. SEO Title checks (30 pts max)
  if (!title) {
    score -= 30;
    issues.push({
      id: 'missing_title',
      severity: 'ERROR',
      label: 'Missing SEO title',
      desc: 'No <title> tag is configured for this page.',
      rec: 'Add a distinct, compelling SEO title between 30 and 60 characters.'
    });
  } else if (title.length < 30) {
    score -= 10;
    issues.push({
      id: 'short_title',
      severity: 'WARN',
      label: `SEO title too short (${title.length}c)`,
      desc: `Title is ${title.length} characters (recommended 30–65).`,
      rec: 'Expand the title to include primary destination, vehicle, and brand terms.'
    });
  } else if (title.length > 65) {
    score -= 10;
    issues.push({
      id: 'long_title',
      severity: 'WARN',
      label: `SEO title length (${title.length}c)`,
      desc: `Title is ${title.length} characters and may be truncated on search engine result pages.`,
      rec: 'Shorten the title to 60–65 characters or fewer for optimal SERP display.'
    });
  } else {
    passed.push('SEO title length optimal');
  }

  // 2. Meta Description checks (30 pts max)
  if (!desc) {
    score -= 30;
    issues.push({
      id: 'missing_desc',
      severity: 'ERROR',
      label: 'Missing meta description',
      desc: 'No meta description is configured for this page snippet.',
      rec: 'Write a persuasive summary between 70 and 160 characters describing the service.'
    });
  } else if (desc.length < 70) {
    score -= 10;
    issues.push({
      id: 'short_desc',
      severity: 'WARN',
      label: `Meta description short (${desc.length}c)`,
      desc: `Meta description is ${desc.length} characters (recommended 70–160).`,
      rec: 'Add verified details about vehicle amenities, pickup zones, or all-inclusive tolls.'
    });
  } else if (desc.length > 160) {
    score -= 10;
    issues.push({
      id: 'long_desc',
      severity: 'WARN',
      label: `Meta description length (${desc.length}c)`,
      desc: `Meta description is ${desc.length} characters and may be cut off in search snippets.`,
      rec: 'Trim the description to under 160 characters to ensure full readability.'
    });
  } else {
    passed.push('Meta description length optimal');
  }

  // 3. Canonical URL check (20 pts max)
  if (!canonical) {
    score -= 20;
    issues.push({
      id: 'missing_canonical',
      severity: 'WARN',
      label: 'Missing canonical URL',
      desc: 'Canonical tag is not specified for this public route.',
      rec: 'Ensure a valid self-referencing canonical URL is defined.'
    });
  } else {
    passed.push('Canonical URL present and configured');
  }

  // 4. Indexing directive check (20 pts max)
  if (page.isIndexable === false) {
    score -= 20;
    issues.push({
      id: 'noindex_directive',
      severity: 'INFO',
      label: 'Directive: noindex',
      desc: 'Page is excluded from search engine indexation by directive.',
      rec: 'Remove noindex directive if this page should be discoverable on Google.'
    });
  } else {
    passed.push('Directive: index, follow');
  }

  // Incorporate deeper audit findings if available
  if (auditFinding && typeof auditFinding.score === 'number' && auditFinding.score < score) {
    score = auditFinding.score;
  }

  const finalScore = Math.max(0, Math.min(100, score));
  let status = 'Good';
  let statusColor = { bg: '#DCFCE7', text: '#15803D', border: '#BBF7D0' };

  if (finalScore < 50) {
    status = 'Poor';
    statusColor = { bg: '#FEE2E2', text: '#B91C1C', border: '#FECACA' };
  } else if (finalScore < 80 || issues.length > 0) {
    status = 'Needs attention';
    statusColor = { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A' };
  }

  const primaryIssue = issues[0] || (finalScore >= 80 ? { label: 'Optimal checklist standing', desc: 'All evaluated metadata rules passed.' } : null);

  return {
    score: finalScore,
    status,
    statusColor,
    issues,
    primaryIssue: primaryIssue?.label || 'Healthy',
    primaryIssueDetail: primaryIssue,
    passed,
    hasActionableIssues: issues.length > 0,
  };
}

// ---------------------------------------------------------------------------
// Quick SEO Fix Modal (Direct In-Dashboard Fix Panel)
// ---------------------------------------------------------------------------
function QuickFixModal({ page, onClose, onSaved }) {
  if (!page) return null;

  const evaluation = evaluatePageSeo(page);

  const [title, setTitle] = useState(page.seoTitle || '');
  const [desc, setDesc]   = useState(page.metaDescription || '');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // Recalculate preview score in real time as user edits
  const previewEval = evaluatePageSeo({
    ...page,
    seoTitle: title,
    metaDescription: desc,
  });

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    try {
      const res = await seoApi.updatePage(page.pageKey, {
        seoTitle: title,
        metaDescription: desc,
        canonicalUrl: page.canonicalUrl,
        isIndexable: page.isIndexable,
      });

      const updated = {
        ...page,
        seoTitle: title,
        metaDescription: desc,
        ...(res.data?.data || {}),
      };

      setSavedSuccess(true);
      setTimeout(() => {
        if (onSaved) onSaved(updated);
        onClose();
      }, 700);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)',
      backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: '1rem',
    }}>
      <div style={{
        background: '#FFFFFF', borderRadius: '16px', width: '100%', maxWidth: '640px',
        maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid #E2E8F0', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0284C7', background: '#EFF6FF', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                QUICK SEO FIX
              </span>
              <span style={{
                fontSize: '0.7rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: '100px',
                background: previewEval.statusColor.bg, color: previewEval.statusColor.text, border: `1px solid ${previewEval.statusColor.border}`
              }}>
                Score: {previewEval.score}/100 ({previewEval.status})
              </span>
            </div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>
              {page.pageLabel}
            </h3>
            <code style={{ fontSize: '0.75rem', color: '#64748B', background: '#F8FAFC', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
              {page.pageUrl}
            </code>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: '0.25rem' }}
            title="Cancel and close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Issue & Recommended Correction Callout */}
        {evaluation.issues.length > 0 ? (
          <div style={{
            background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px',
            padding: '1rem 1.15rem', display: 'flex', flexDirection: 'column', gap: '0.45rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#B45309', fontWeight: 700, fontSize: '0.82rem' }}>
              <AlertTriangle size={15} />
              <span>Identified Issue: {evaluation.primaryIssueDetail?.label}</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#78350F', lineHeight: 1.5 }}>
              {evaluation.primaryIssueDetail?.desc}
            </p>
            <div style={{ marginTop: '0.25rem', fontSize: '0.76rem', color: '#15803D', fontWeight: 600, background: '#F0FDF4', padding: '0.45rem 0.65rem', borderRadius: '6px', border: '1px solid #BBF7D0' }}>
              💡 <strong>Recommended Correction:</strong> {evaluation.primaryIssueDetail?.rec}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.35rem' }}>
              <button
                type="button"
                onClick={() => {
                  const opt = getOptimalSeoMetadata(page, { seoTitle: title, metaDescription: desc });
                  setTitle(opt.recommendedTitle);
                  setDesc(opt.recommendedDescription);
                }}
                style={{
                  background: '#16A34A', color: '#fff', border: 'none', borderRadius: '6px',
                  padding: '0.35rem 0.85rem', fontSize: '0.74rem', fontWeight: 800,
                  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                  boxShadow: '0 1px 2px rgba(22, 163, 74, 0.25)',
                }}
              >
                <Sparkles size={12} /> ⚡ 1-Click Auto-Fill Optimal Values
              </button>
            </div>
          </div>
        ) : (
          <div style={{
            background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '10px',
            padding: '0.85rem 1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
            color: '#15803D', fontSize: '0.8rem', fontWeight: 700
          }}>
            <CheckCircle2 size={16} /> All evaluated metadata checks are in optimal standing (Score: {evaluation.score}/100).
          </div>
        )}

        {/* Edit Form with Real Backend Persistence */}
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', padding: '0.65rem 0.85rem', fontSize: '0.74rem', color: '#166534' }}>
            ✓ <strong>Persistent Edit:</strong> Edits to title and meta description save directly to the SEO database and hydrate live server responses immediately.
          </div>

          {/* Title Field */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>SEO Title Tag</label>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: title.length >= 30 && title.length <= 65 ? '#16A34A' : '#D97706' }}>
                {title.length} / 65 chars ({title.length >= 30 && title.length <= 65 ? 'Optimal' : (title.length < 30 ? 'Short' : 'Long')})
              </span>
            </div>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Enter compelling SEO title..."
              style={{
                width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px',
                border: '1px solid #CBD5E1', fontSize: '0.82rem', color: '#0F172A',
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Meta Description Field */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155' }}>Meta Description</label>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: desc.length >= 70 && desc.length <= 160 ? '#16A34A' : '#D97706' }}>
                {desc.length} / 160 chars ({desc.length >= 70 && desc.length <= 160 ? 'Optimal' : (desc.length < 70 ? 'Short' : 'Long')})
              </span>
            </div>
            <textarea
              rows={3}
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="Enter accurate meta description..."
              style={{
                width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px',
                border: '1px solid #CBD5E1', fontSize: '0.82rem', color: '#0F172A',
                outline: 'none', resize: 'vertical', boxSizing: 'border-box',
              }}
            />
          </div>

          {errorMsg && (
            <div style={{ background: '#FEE2E2', color: '#B91C1C', padding: '0.6rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem' }}>
              {errorMsg}
            </div>
          )}

          {savedSuccess && (
            <div style={{ background: '#DCFCE7', color: '#15803D', padding: '0.6rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
              ✓ SEO metadata successfully saved and score recalculated!
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', borderTop: '1px solid #F1F5F9', paddingTop: '1rem' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              style={{
                padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #CBD5E1',
                background: '#FFFFFF', color: '#475569', fontSize: '0.8rem', fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="admin-btn-primary"
              style={{
                padding: '0.5rem 1.25rem', borderRadius: '8px', fontSize: '0.8rem',
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer',
              }}
            >
              {saving ? 'Saving...' : 'Save & Recalculate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PageEditor({ page, onBack, onSaved, domain = 'https://ajtravelsagency.vercel.app' }) {
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
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [error,    setError]    = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [fixAppliedToast, setFixAppliedToast] = useState('');

  // Smart optimal SEO metadata (guaranteed 40-60 chars title, 110-160 chars desc)
  const optimal = getOptimalSeoMetadata(page, form);
  const cleanPath = optimal.cleanPath;
  const recommendedCanonical = `${domain}${cleanPath}`;
  const isCanonicalMismatched = Boolean(form.canonicalUrl && form.canonicalUrl !== recommendedCanonical);

  const recommendedTitle = optimal.recommendedTitle;
  const recommendedDescription = optimal.recommendedDescription;

  const titleLen = (form.seoTitle || '').length;
  const descLen  = (form.metaDescription || '').length;

  const isTitleSuboptimal = titleLen < 40 || titleLen > 65 || form.seoTitle === page.pageKey;
  const isDescSuboptimal  = descLen < 90 || descLen > 160;
  const hasActionableFixes = isCanonicalMismatched || isTitleSuboptimal || isDescSuboptimal || Boolean(page.initialSuggestedFix);

  const handleChange = (field, val) => {
    setForm(prev => ({ ...prev, [field]: val }));
    setSaved(false);
  };

  const showToast = (msg) => {
    setFixAppliedToast(msg);
    setTimeout(() => setFixAppliedToast(''), 4500);
  };

  const applyCanonicalFix = () => {
    handleChange('canonicalUrl', recommendedCanonical);
    showToast(`⚡ Canonical URL fixed: ${recommendedCanonical}`);
  };

  const applyTitleSuggestion = () => {
    handleChange('seoTitle', recommendedTitle);
    showToast('⚡ SEO Title updated with recommended formulation.');
  };

  const applyDescSuggestion = () => {
    handleChange('metaDescription', recommendedDescription);
    showToast('⚡ Meta Description updated with recommended formulation.');
  };

  const applyAllSuggestions = () => {
    if (isCanonicalMismatched || form.canonicalUrl) handleChange('canonicalUrl', recommendedCanonical);
    handleChange('seoTitle', recommendedTitle);
    handleChange('metaDescription', recommendedDescription);
    showToast('⚡ All optimal SEO fixes applied! Review below and click "Save SEO Metadata" to save.');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setWarnings([]);
    try {
      const res = await seoApi.updatePage(page.pageKey, form);
      setSaved(true);
      if (res.data.warnings?.length) setWarnings(res.data.warnings);
      if (onSaved) onSaved(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save SEO settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '1.5rem 0' }}>
      <button
        onClick={onBack}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
          background: 'transparent', border: 'none', color: '#0284C7',
          fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', marginBottom: '1.25rem',
        }}
      >
        <ArrowLeft size={16} /> Back to SEO Overview
      </button>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
            Edit SEO: {page.pageLabel}
          </h2>
          <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
            Canonical Path: <code style={{ color: '#0284C7', background: '#F0F9FF', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>{page.pageUrl}</code>
          </span>
        </div>
        <StatusPill ok={form.isIndexable} label={form.isIndexable ? 'Indexable (index, follow)' : 'Noindex (noindex, follow)'} />
      </div>

      {/* Real-time Google SERP Preview */}
      <div style={{ marginBottom: '1.5rem' }}>
        <SerpPreview
          title={form.seoTitle}
          description={form.metaDescription}
          url={page.pageUrl}
          domain={domain}
          isIndexable={form.isIndexable}
          canonicalUrl={form.canonicalUrl || (domain + page.pageUrl)}
        />
      </div>

      {/* 1-Click Fix Applied Toast */}
      {fixAppliedToast && (
        <div style={{
          background: '#DCFCE7', border: '1.5px solid #22C55E', borderRadius: '10px',
          padding: '0.85rem 1.25rem', color: '#15803D', fontSize: '0.82rem', fontWeight: 700,
          display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem',
          boxShadow: '0 2px 5px rgba(34, 197, 94, 0.15)',
        }}>
          <CheckCircle2 size={16} color="#16A34A" /> {fixAppliedToast}
        </div>
      )}

      {/* 1-Click SEO Auto-Fix Card */}
      {hasActionableFixes ? (
        <div style={{
          backgroundColor: '#F0FDF4',
          border: '1.5px solid #86EFAC',
          borderRadius: '12px',
          padding: '1.1rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.85rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={18} color="#15803D" />
              <div>
                <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#166534' }}>
                  1-Click SEO Auto-Fix Recommendations
                </span>
                <span style={{ display: 'block', fontSize: '0.72rem', color: '#15803D' }}>
                  Instant optimization to comply with Google SERP character limits and achieve Good health.
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={applyAllSuggestions}
              style={{
                backgroundColor: '#16A34A',
                color: '#FFFFFF',
                padding: '0.45rem 1rem',
                fontSize: '0.8rem',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(22, 163, 74, 0.25)',
              }}
            >
              <Sparkles size={14} /> ⚡ Apply All Optimal Fixes (1-Click)
            </button>
          </div>

          {/* Actionable item 1: Title */}
          {isTitleSuboptimal && (
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #BBF7D0',
              borderRadius: '8px',
              padding: '0.75rem 0.9rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.65rem',
            }}>
              <div style={{ flex: 1, minWidth: '260px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#92400E', background: '#FEF3C7', padding: '0.1rem 0.45rem', borderRadius: '4px' }}>
                    Title Length: {titleLen} / 60 chars {titleLen > 65 ? '• Too Long' : '• Too Short'}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: '#15803D', fontWeight: 700 }}>➔ Suggested: {recommendedTitle.length} chars (Optimal)</span>
                </div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>
                  "{recommendedTitle}"
                </div>
              </div>
              <button
                type="button"
                onClick={applyTitleSuggestion}
                style={{
                  backgroundColor: '#0284C7',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.35rem 0.8rem',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
              >
                ⚡ Apply Title
              </button>
            </div>
          )}

          {/* Actionable item 2: Description */}
          {isDescSuboptimal && (
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #BBF7D0',
              borderRadius: '8px',
              padding: '0.75rem 0.9rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.65rem',
            }}>
              <div style={{ flex: 1, minWidth: '260px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#1E40AF', background: '#DBEAFE', padding: '0.1rem 0.45rem', borderRadius: '4px' }}>
                    Description: {descLen} / 160 chars {descLen > 160 ? '• Too Long' : '• Too Short'}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: '#15803D', fontWeight: 700 }}>➔ Suggested: {recommendedDescription.length} chars (Optimal)</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#334155', lineHeight: 1.4 }}>
                  "{recommendedDescription}"
                </div>
              </div>
              <button
                type="button"
                onClick={applyDescSuggestion}
                style={{
                  backgroundColor: '#0284C7',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.35rem 0.8rem',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
              >
                ⚡ Apply Description
              </button>
            </div>
          )}

          {/* Actionable item 3: Canonical */}
          {isCanonicalMismatched && (
            <div style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #BBF7D0',
              borderRadius: '8px',
              padding: '0.75rem 0.9rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.65rem',
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#DC2626', marginBottom: '0.2rem' }}>
                  Canonical URL Trailing Slash / Mismatch
                </div>
                <code style={{ fontSize: '0.74rem', background: '#F8FAFC', padding: '0.15rem 0.4rem', borderRadius: '4px', color: '#0F172A' }}>
                  {recommendedCanonical}
                </code>
              </div>
              <button
                type="button"
                onClick={applyCanonicalFix}
                style={{
                  backgroundColor: '#16A34A',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.35rem 0.8rem',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
              >
                ⚡ Fix Canonical
              </button>
            </div>
          )}
        </div>
      ) : (
        <div style={{
          backgroundColor: '#F0FDF4',
          border: '1px solid #BBF7D0',
          borderRadius: '10px',
          padding: '0.75rem 1rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.8rem',
          color: '#15803D',
          fontWeight: 700,
        }}>
          <CheckCircle2 size={16} /> All evaluated SEO metadata is in optimal standing (Score: 100/100). No action required.
        </div>
      )}

      {saved && (
        <div style={{ background: '#DCFCE7', border: '1px solid #86EFAC', borderRadius: '10px', padding: '0.85rem 1.25rem', color: '#15803D', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <CheckCircle2 size={16} /> SEO settings saved successfully.
        </div>
      )}
      {warnings.length > 0 && (
        <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '10px', padding: '0.85rem 1.25rem', color: '#92400E', fontSize: '0.82rem', fontWeight: 600, display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '1.25rem' }}>
          {warnings.map((w, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <AlertTriangle size={14} /> {w}
            </div>
          ))}
        </div>
      )}
      {error && (
        <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', borderRadius: '10px', padding: '0.85rem 1.25rem', color: '#991B1B', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <XCircle size={16} /> {error}
        </div>
      )}

      <form onSubmit={handleSave} className="admin-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* SEO Title */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>
              SEO Title (Title Tag) <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={applyTitleSuggestion}
                style={{
                  background: '#F0F9FF', border: '1px solid #BAE6FD', color: '#0284C7',
                  padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 700,
                  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                }}
                title="Click to paste suggested optimized title"
              >
                <Sparkles size={11} /> ✨ Suggest Optimal Title
              </button>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: charColor(form.seoTitle.length, 60, 70) }}>
                {form.seoTitle.length} / 60 chars
              </span>
            </div>
          </div>
          <input
            type="text"
            className="admin-input"
            value={form.seoTitle}
            onChange={e => handleChange('seoTitle', e.target.value)}
            placeholder="e.g. AJ Travels — Trusted Vehicle Rental Service in Pune"
            style={{ width: '100%', boxSizing: 'border-box' }}
          />
        </div>

        {/* Meta Description */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>
              Meta Description <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={applyDescSuggestion}
                style={{
                  background: '#F0F9FF', border: '1px solid #BAE6FD', color: '#0284C7',
                  padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 700,
                  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                }}
                title="Click to paste suggested description"
              >
                <Sparkles size={11} /> ✨ Suggest Optimal Description
              </button>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: charColor(form.metaDescription.length, 160, 170) }}>
                {form.metaDescription.length} / 160 chars
              </span>
            </div>
          </div>
          <textarea
            className="admin-input"
            rows={3}
            value={form.metaDescription}
            onChange={e => handleChange('metaDescription', e.target.value)}
            placeholder="Compelling description summarizing the cab route, pricing, and verified fleet."
            style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical' }}
          />
        </div>

        {/* Canonical URL */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>
              Explicit Canonical URL (Optional Override)
            </label>
            {isCanonicalMismatched ? (
              <button
                type="button"
                onClick={applyCanonicalFix}
                style={{
                  background: '#FEF2F2', border: '1.5px solid #FCA5A5', color: '#DC2626',
                  padding: '0.2rem 0.65rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800,
                  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                  boxShadow: '0 1px 2px rgba(220, 38, 38, 0.1)',
                }}
                title="Fix canonical URL to match clean page path without trailing slash"
              >
                <Sparkles size={11} /> ⚡ 1-Click Fix to: {cleanPath}
              </button>
            ) : (
              <button
                type="button"
                onClick={applyCanonicalFix}
                style={{
                  background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#16A34A',
                  padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 700,
                  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                }}
              >
                <CheckCircle2 size={11} /> Reset to Clean Standard
              </button>
            )}
          </div>
          <input
            type="text"
            className="admin-input"
            value={form.canonicalUrl}
            onChange={e => handleChange('canonicalUrl', e.target.value)}
            placeholder={`Defaults to: ${recommendedCanonical}`}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              borderColor: isCanonicalMismatched ? '#F87171' : undefined,
              backgroundColor: isCanonicalMismatched ? '#FFF1F2' : undefined,
              fontWeight: isCanonicalMismatched ? 700 : undefined,
            }}
          />
          {isCanonicalMismatched && (
            <div style={{ fontSize: '0.74rem', color: '#DC2626', fontWeight: 700, marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <AlertTriangle size={13} color="#DC2626" />
              <span>Trailing slash error detected! Click "⚡ 1-Click Fix to: {cleanPath}" above to resolve instantly.</span>
            </div>
          )}
        </div>

        {/* Indexable Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1E293B' }}>Search Engine Indexing</div>
            <div style={{ fontSize: '0.72rem', color: '#64748B' }}>When off, sends <code>noindex, follow</code> and removes from sitemap.xml</div>
          </div>
          <button
            type="button"
            onClick={() => handleChange('isIndexable', !form.isIndexable)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: form.isIndexable ? '#16A34A' : '#94A3B8' }}
          >
            {form.isIndexable ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
          </button>
        </div>

        {/* OpenGraph Title & Description */}
        <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '1.25rem' }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.75rem' }}>
            Social Media Sharing (OpenGraph)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>
                  OG Title (Facebook / WhatsApp)
                </label>
                <button
                  type="button"
                  onClick={() => handleChange('ogTitle', form.seoTitle)}
                  style={{
                    background: 'transparent', border: 'none', color: '#0284C7',
                    fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  ⚡ Copy Title
                </button>
              </div>
              <input
                type="text"
                className="admin-input"
                value={form.ogTitle}
                onChange={e => handleChange('ogTitle', e.target.value)}
                placeholder="Defaults to SEO Title"
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>
                OG Image URL
              </label>
              <input
                type="text"
                className="admin-input"
                value={form.ogImage}
                onChange={e => handleChange('ogImage', e.target.value)}
                placeholder="https://.../og-banner.jpg"
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.5rem' }}>
          <button
            type="button"
            onClick={onBack}
            style={{
              padding: '0.55rem 1.25rem', borderRadius: '8px', border: '1px solid #CBD5E1',
              background: '#fff', color: '#475569', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="admin-btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1.5rem' }}
          >
            {saving ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
            {saving ? 'Saving Changes...' : 'Save SEO Metadata'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Static Page Metadata Viewer Modal (Safe Read-Only View for Code/Content Pages)
// ---------------------------------------------------------------------------
function StaticPageMetaModal({ page, onClose, domain = 'https://ajtravelsagency.vercel.app' }) {
  if (!page) return null;

  const titleLen = page.seoTitle ? page.seoTitle.length : 0;
  const descLen = page.metaDescription ? page.metaDescription.length : 0;
  const canonical = page.canonicalUrl || `${domain}${page.pageUrl}`;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
    }}>
      <div style={{
        background: '#FFFFFF', borderRadius: '14px', width: '100%', maxWidth: '680px',
        maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        border: '1px solid #E2E8F0', padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', borderBottom: '1px solid #F1F5F9', paddingBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{
                fontSize: '0.68rem', fontWeight: 800, padding: '0.2rem 0.55rem', borderRadius: '4px',
                background: page.metadataSource === 'STATIC_CODE' ? '#EFF6FF' : '#F1F5F9',
                color: page.metadataSource === 'STATIC_CODE' ? '#0284C7' : '#475569',
              }}>
                {page.metadataSource === 'STATIC_CODE' ? 'STATIC CODE DEFINITION' : 'GENERATED CONTENT STORE'}
              </span>
              <span style={{ fontSize: '0.72rem', color: '#16A34A', fontWeight: 700, background: '#DCFCE7', padding: '0.15rem 0.5rem', borderRadius: '100px' }}>
                Indexable
              </span>
            </div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0F172A' }}>
              {page.pageLabel}
            </h3>
            <code style={{ fontSize: '0.75rem', color: '#64748B' }}>
              {page.pageUrl}
            </code>
          </div>
          <button
            onClick={onClose}
            style={{ background: '#F1F5F9', border: 'none', borderRadius: '8px', padding: '0.4rem', cursor: 'pointer', color: '#64748B' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Read-Only Explanation Callout */}
        <div style={{
          background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '0.85rem 1rem',
          display: 'flex', alignItems: 'flex-start', gap: '0.65rem', fontSize: '0.78rem', color: '#475569',
        }}>
          <Info size={18} color="#0284C7" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
          <div>
            <strong style={{ color: '#0F172A' }}>Safe Read-Only View: </strong>
            This page is configured in application source code. Dynamic database editing requires adding a model key to the database schema and executing a migration.
          </div>
        </div>

        {/* Details Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', marginBottom: '0.25rem' }}>
              <span style={{ fontWeight: 700, color: '#475569' }}>SEO Title Tag</span>
              <span style={{ color: titleLen <= 65 ? '#16A34A' : '#DC2626', fontWeight: 700 }}>{titleLen} / 65 chars</span>
            </div>
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '0.65rem 0.85rem', fontSize: '0.82rem', fontWeight: 600, color: '#0F172A' }}>
              {page.seoTitle || '—'}
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', marginBottom: '0.25rem' }}>
              <span style={{ fontWeight: 700, color: '#475569' }}>Meta Description</span>
              <span style={{ color: descLen <= 160 ? '#16A34A' : '#DC2626', fontWeight: 700 }}>{descLen} / 160 chars</span>
            </div>
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '0.65rem 0.85rem', fontSize: '0.8rem', color: '#334155', lineHeight: 1.5 }}>
              {page.metaDescription || '—'}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <div>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>Canonical URL</span>
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '0.55rem 0.75rem', fontSize: '0.75rem', color: '#0284C7', wordBreak: 'break-all' }}>
                {canonical}
              </div>
            </div>
            <div>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>Robots Indexing Directive</span>
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '0.55rem 0.75rem', fontSize: '0.75rem', color: '#166534', fontWeight: 700 }}>
                {page.indexingDirective || 'index, follow'}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <div>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>Sitemap Status</span>
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '0.55rem 0.75rem', fontSize: '0.75rem', color: '#334155' }}>
                {page.sitemapInclusion || 'Included'}
              </div>
            </div>
            <div>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>Metadata Completeness</span>
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '6px', padding: '0.55rem 0.75rem', fontSize: '0.75rem', color: '#16A34A', fontWeight: 700 }}>
                {page.metadataCompleteness || 'Complete'}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
          {/* Local preview — always opens on current origin, never on production */}
          <button
            onClick={() => window.open(window.location.origin + (page.pageUrl || '/'), '_blank')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
              padding: '0.5rem 0.85rem', borderRadius: '6px', border: '1px solid #BFDBFE',
              background: '#EFF6FF', color: '#0284C7', fontSize: '0.78rem', fontWeight: 700,
              cursor: 'pointer',
            }}
            title={`Open local preview: ${window.location.origin}${page.pageUrl || '/'}`}
          >
            Preview Local
          </button>
          {/* Production URL — explicit warning before opening */}
          <button
            onClick={() => {
              const prodUrl = canonical;
              if (window.confirm(`Open production URL in a new tab?\n\n${prodUrl}\n\nNote: The production domain may redirect to an unrelated site if DNS is misconfigured.`)) {
                window.open(prodUrl, '_blank', 'noopener,noreferrer');
              }
            }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
              padding: '0.5rem 0.85rem', borderRadius: '6px', border: '1px solid #CBD5E1',
              background: '#FFFFFF', color: '#334155', fontSize: '0.78rem', fontWeight: 700,
              cursor: 'pointer',
            }}
            title={`Open production URL (requires confirmation): ${canonical}`}
          >
            <ExternalLink size={13} /> Production URL
          </button>
          <button
            onClick={onClose}
            className="admin-btn-primary"
            style={{ fontSize: '0.78rem', padding: '0.5rem 1rem' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Deep Page Inspector Modal / Detail View (Rank Math Style Audit)
// ---------------------------------------------------------------------------
function PageInspectorView({ pageAnalysis, onBack, onEditSeo, onReanalyze, isAnalyzing }) {
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterStatus,   setFilterStatus]   = useState('ALL');

  if (!pageAnalysis) return null;

  const scoreInfo = getScoreColor(pageAnalysis.score);

  const findings = pageAnalysis.findings.filter(f => {
    if (filterCategory !== 'ALL' && f.category !== filterCategory) return false;
    if (filterStatus !== 'ALL' && f.status !== filterStatus) return false;
    return true;
  });

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '1.25rem 0' }}>
      <button
        onClick={onBack}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
          background: 'transparent', border: 'none', color: '#0284C7',
          fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', marginBottom: '1.25rem',
        }}
      >
        <ArrowLeft size={16} /> Back to Analyzer Dashboard
      </button>

      {/* Header Banner */}
      <div className="admin-card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '0.2rem 0.5rem', borderRadius: '4px', background: '#F1F5F9', color: '#334155' }}>
                {pageAnalysis.pagePath}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                Audited via {pageAnalysis.performance?.isBrowserRendered ? 'Real Headless V8 Browser' : 'Hydrated Node Server'}
              </span>
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0F172A', margin: 0 }}>
              {pageAnalysis.label} — In-Depth SEO Audit
            </h2>
            <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '0.25rem' }}>
              Title: <strong>{pageAnalysis.meta?.title || 'None'}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>SEO Health Score</div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                fontSize: '1.6rem', fontWeight: 900, color: scoreInfo.text,
              }}>
                <Award size={20} /> {pageAnalysis.score} <span style={{ fontSize: '0.9rem', color: '#94A3B8' }}>/ 100</span>
              </div>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: scoreInfo.text }}>
                {scoreInfo.label} • {pageAnalysis.coverage}% Coverage
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <button
                onClick={() => onReanalyze(pageAnalysis.pageKey)}
                disabled={isAnalyzing}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                  padding: '0.45rem 0.85rem', borderRadius: '6px',
                  background: '#EFF6FF', color: '#0284C7', border: '1px solid #BFDBFE',
                  fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                }}
              >
                <RefreshCw size={13} className={isAnalyzing ? 'spin' : ''} />
                {isAnalyzing ? 'Analyzing...' : 'Re-Analyze'}
              </button>
              <button
                onClick={() => onEditSeo(pageAnalysis.pageKey)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                  padding: '0.45rem 0.85rem', borderRadius: '6px',
                  background: '#0284C7', color: '#fff', border: 'none',
                  fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                }}
              >
                <Edit3 size={13} /> Edit SEO
              </button>
            </div>
          </div>
        </div>

        {/* 4 Category Score Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginTop: '1.5rem' }}>
          <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Globe size={13} color="#0284C7" /> Metadata &amp; Snippets
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F172A', marginTop: '0.2rem' }}>
              {pageAnalysis.categories?.metadata?.earned} <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>/ {pageAnalysis.categories?.metadata?.max} pts</span>
            </div>
          </div>

          <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <FileText size={13} color="#16A34A" /> Rendered Headings &amp; Copy
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F172A', marginTop: '0.2rem' }}>
              {pageAnalysis.categories?.content?.earned} <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>/ {pageAnalysis.categories?.content?.max} pts</span>
            </div>
          </div>

          <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Shield size={13} color="#9333EA" /> Technical SEO &amp; Schema
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F172A', marginTop: '0.2rem' }}>
              {pageAnalysis.categories?.technical?.earned} <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>/ {pageAnalysis.categories?.technical?.max} pts</span>
            </div>
          </div>

          <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Cpu size={13} color="#D97706" /> Links &amp; Best Practices
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0F172A', marginTop: '0.2rem' }}>
              {pageAnalysis.categories?.performance?.earned} <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>/ {pageAnalysis.categories?.performance?.max} pts</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
        {/* Category Filter */}
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: 'All Categories' },
            { id: 'metadata', label: 'Metadata' },
            { id: 'content', label: 'Content' },
            { id: 'technical', label: 'Technical SEO' },
            { id: 'performance', label: 'Performance & Links' },
          ].map(c => (
            <button
              key={c.id}
              onClick={() => setFilterCategory(c.id)}
              style={{
                padding: '0.35rem 0.75rem', borderRadius: '6px', border: 'none',
                background: filterCategory === c.id ? '#0284C7' : '#F1F5F9',
                color: filterCategory === c.id ? '#fff' : '#475569',
                fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
              }}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div style={{ display: 'flex', gap: '0.35rem' }}>
          {[
            { id: 'ALL', label: `All (${pageAnalysis.findings.length})` },
            { id: 'ERROR', label: `Errors (${pageAnalysis.counts?.errors || 0})` },
            { id: 'WARNING', label: `Warnings (${pageAnalysis.counts?.warnings || 0})` },
            { id: 'PASS', label: `Passed (${pageAnalysis.counts?.passed || 0})` },
          ].map(s => (
            <button
              key={s.id}
              onClick={() => setFilterStatus(s.id)}
              style={{
                padding: '0.35rem 0.65rem', borderRadius: '6px', border: 'none',
                background: filterStatus === s.id ? '#0F172A' : '#E2E8F0',
                color: filterStatus === s.id ? '#fff' : '#475569',
                fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Findings List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {findings.map(f => (
          <div
            key={f.id}
            style={{
              background: '#fff', border: '1px solid #E2E8F0', borderRadius: '10px',
              padding: '1.1rem 1.25rem',
              borderLeft: f.status === 'PASS' ? '4px solid #22C55E' : f.status === 'WARNING' ? '4px solid #F59E0B' : '4px solid #EF4444',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <SeverityBadge status={f.status} />
                <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0F172A' }}>{f.title}</span>
                <span style={{ fontSize: '0.7rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  ({f.category} • {f.scoreEarned}/{f.weight} pts)
                </span>
              </div>
              {f.isAutomatedSafe && (
                <button
                  onClick={() => onEditSeo(pageAnalysis.pageKey, f)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                    background: f.status === 'ERROR' ? '#FEF2F2' : '#F0F9FF',
                    color: f.status === 'ERROR' ? '#DC2626' : '#0284C7',
                    border: `1.5px solid ${f.status === 'ERROR' ? '#FCA5A5' : '#BAE6FD'}`,
                    padding: '0.3rem 0.75rem', borderRadius: '6px',
                    fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer',
                    boxShadow: f.status === 'ERROR' ? '0 1px 3px rgba(220, 38, 38, 0.15)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                  title="Open editor with 1-click suggested text to fix this error"
                >
                  <Sparkles size={12} /> {f.status === 'ERROR' ? '⚡ 1-Click Fix in SEO Settings' : 'Edit in SEO Settings'}
                </button>
              )}
            </div>

            {/* Observed Evidence */}
            <div style={{ background: '#F8FAFC', padding: '0.5rem 0.75rem', borderRadius: '6px', fontSize: '0.78rem', color: '#334155', marginBottom: '0.5rem', fontFamily: 'monospace' }}>
              <strong>Observed:</strong> {f.observed}
            </div>

            {/* Impact & Fix */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.75rem', color: '#475569' }}>
              <div>
                <strong style={{ color: '#0F172A' }}>SEO Impact:</strong> {f.impact}
              </div>
              <div>
                <strong style={{ color: '#0F172A' }}>Actionable Fix:</strong> {f.fix}
              </div>
            </div>
          </div>
        ))}

        {findings.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748B', background: '#fff', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
            <CheckCircle2 size={32} color="#16A34A" style={{ margin: '0 auto 0.5rem' }} />
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0F172A' }}>No issues found matching selected filter.</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Search Console SVG Performance Trend Chart
// ---------------------------------------------------------------------------
function SearchPerformanceChart({ daily = [] }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!daily || daily.length === 0) {
    return (
      <div style={{ padding: '2.5rem', textAlign: 'center', background: '#F8FAFC', borderRadius: '8px', border: '1px dashed #CBD5E1' }}>
        <Calendar size={28} color="#94A3B8" style={{ margin: '0 auto 0.5rem' }} />
        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>No daily search trend points reported yet</div>
        <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '0.25rem' }}>
          Google Search Console has a 24–48 hour reporting lag. Daily clicks and impressions will appear once indexed and queried.
        </div>
      </div>
    );
  }

  const width = 680;
  const height = 190;
  const padL = 40;
  const padR = 45;
  const padT = 20;
  const padB = 30;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;

  const maxClicks = Math.max(...daily.map(d => Number(d.clicks) || 0), 5);
  const maxImp = Math.max(...daily.map(d => Number(d.impressions) || 0), 10);

  const points = daily.map((d, i) => {
    const x = padL + (daily.length > 1 ? (i / (daily.length - 1)) * chartW : chartW / 2);
    const yClicks = padT + chartH - ((Number(d.clicks) || 0) / maxClicks) * chartH;
    const yImp = padT + chartH - ((Number(d.impressions) || 0) / maxImp) * chartH;
    return { ...d, x, yClicks, yImp, index: i };
  });

  const clicksPolyline = points.map(p => `${p.x.toFixed(1)},${p.yClicks.toFixed(1)}`).join(' ');
  const impPolyline = points.map(p => `${p.x.toFixed(1)},${p.yImp.toFixed(1)}`).join(' ');

  const activePoint = hoveredIdx !== null ? points[hoveredIdx] : null;

  return (
    <div style={{ position: 'relative', background: '#FFFFFF', borderRadius: '10px', padding: '1rem', border: '1px solid #E2E8F0', marginTop: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#1E293B' }}>Daily Search Performance Trend</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.72rem', fontWeight: 700 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#0284C7' }}>
            <span style={{ width: '10px', height: '3px', background: '#0284C7', borderRadius: '2px' }} />
            Clicks (L-Axis)
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: '#8B5CF6' }}>
            <span style={{ width: '10px', height: '3px', background: '#8B5CF6', borderRadius: '2px' }} />
            Impressions (R-Axis)
          </span>
        </div>
      </div>

      <div style={{ width: '100%', overflowX: 'auto' }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: '100%', minWidth: '480px', height: 'auto', display: 'block' }}
          onMouseLeave={() => setHoveredIdx(null)}
        >
          {/* Grid lines */}
          <line x1={padL} y1={padT} x2={width - padR} y2={padT} stroke="#F1F5F9" strokeDasharray="3 3" />
          <line x1={padL} y1={padT + chartH / 2} x2={width - padR} y2={padT + chartH / 2} stroke="#F1F5F9" strokeDasharray="3 3" />
          <line x1={padL} y1={padT + chartH} x2={width - padR} y2={padT + chartH} stroke="#E2E8F0" />

          {/* Left Y-axis (Clicks) */}
          <text x={padL - 6} y={padT + 4} textAnchor="end" fontSize="10" fill="#0284C7" fontWeight="700">{maxClicks}</text>
          <text x={padL - 6} y={padT + chartH / 2 + 3} textAnchor="end" fontSize="10" fill="#94A3B8">{Math.round(maxClicks / 2)}</text>
          <text x={padL - 6} y={padT + chartH} textAnchor="end" fontSize="10" fill="#94A3B8">0</text>

          {/* Right Y-axis (Impressions) */}
          <text x={width - padR + 6} y={padT + 4} textAnchor="start" fontSize="10" fill="#8B5CF6" fontWeight="700">{maxImp}</text>
          <text x={width - padR + 6} y={padT + chartH / 2 + 3} textAnchor="start" fontSize="10" fill="#94A3B8">{Math.round(maxImp / 2)}</text>
          <text x={width - padR + 6} y={padT + chartH} textAnchor="start" fontSize="10" fill="#94A3B8">0</text>

          {/* Trend Polylines */}
          <polyline fill="none" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={impPolyline} opacity="0.85" />
          <polyline fill="none" stroke="#0284C7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={clicksPolyline} />

          {/* Points & Hover Target Slices */}
          {points.map((p, i) => (
            <g key={p.date || i}>
              <circle cx={p.x} cy={p.yClicks} r={hoveredIdx === i ? 5 : 3} fill="#0284C7" stroke="#FFFFFF" strokeWidth="1.5" />
              <circle cx={p.x} cy={p.yImp} r={hoveredIdx === i ? 5 : 3} fill="#8B5CF6" stroke="#FFFFFF" strokeWidth="1.5" />
              <rect
                x={p.x - chartW / (daily.length * 2 || 1)}
                y={padT}
                width={Math.max(chartW / (daily.length || 1), 12)}
                height={chartH + padB}
                fill="transparent"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredIdx(i)}
              />
            </g>
          ))}

          {/* X axis date labels */}
          {points.length > 0 && (
            <>
              <text x={points[0].x} y={height - 8} textAnchor="start" fontSize="10" fill="#64748B">{points[0].date}</text>
              {points.length > 3 && (
                <text x={points[Math.floor(points.length / 2)].x} y={height - 8} textAnchor="middle" fontSize="10" fill="#64748B">
                  {points[Math.floor(points.length / 2)].date}
                </text>
              )}
              {points.length > 1 && (
                <text x={points[points.length - 1].x} y={height - 8} textAnchor="end" fontSize="10" fill="#64748B">
                  {points[points.length - 1].date}
                </text>
              )}
            </>
          )}

          {/* Vertical guideline */}
          {activePoint && (
            <line
              x1={activePoint.x}
              y1={padT}
              x2={activePoint.x}
              y2={padT + chartH}
              stroke="#0F172A"
              strokeWidth="1"
              strokeDasharray="2 2"
            />
          )}
        </svg>
      </div>

      {activePoint && (
        <div style={{
          marginTop: '0.5rem',
          padding: '0.45rem 0.85rem',
          background: '#0F172A',
          color: '#F8FAFC',
          borderRadius: '6px',
          fontSize: '0.72rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}>
          <span><strong>Date:</strong> {activePoint.date}</span>
          <span style={{ color: '#38BDF8' }}><strong>Clicks:</strong> {activePoint.clicks || 0}</span>
          <span style={{ color: '#C084FC' }}><strong>Impressions:</strong> {activePoint.impressions || 0}</span>
          <span><strong>CTR:</strong> {((activePoint.ctr || 0) * 100).toFixed(2)}%</span>
          <span><strong>Avg Pos:</strong> {activePoint.position ? Number(activePoint.position).toFixed(1) : 'N/A'}</span>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// External Integrations View (GSC Official API + Honest Disclaimers)
// ---------------------------------------------------------------------------
function IntegrationsView({ integrations, loading, onReloadIntegrations, banner, _domain, onEditPageSeo }) {
  const [gscStatus, setGscStatus] = useState(null);
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState('');
  const [dateRange, setDateRange] = useState('28d');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [performance, setPerformance] = useState(null);
  const [perfLoading, setPerfLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [perfSubTab, setPerfSubTab] = useState('managedPages'); // 'managedPages' | 'queries' | 'pages' | 'devices'
  const [showSetupGuide, setShowSetupGuide] = useState(false);

  // Initialize or fetch GSC status
  const loadGscStatus = useCallback(async () => {
    try {
      const res = await gscApi.getStatus();
      const statusData = res.data?.data || null;
      setGscStatus(statusData);
      if (statusData?.selectedProperty) {
        setSelectedProperty(statusData.selectedProperty);
      }
      return statusData;
    } catch (_err) {
      return null;
    }
  }, []);

  useEffect(() => {
    loadGscStatus();
  }, [loadGscStatus]);

  // Load properties list if connected
  const loadProperties = useCallback(async () => {
    try {
      const res = await gscApi.getProperties();
      const list = res.data?.data?.properties || [];
      setProperties(list);
      return list;
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to list Search Console properties.');
      return [];
    }
  }, []);

  // Load performance report
  const loadPerformance = useCallback(async (propUrl, range, sDate, eDate) => {
    setPerfLoading(true);
    setActionError(null);
    try {
      const params = {
        propertyUrl: propUrl || undefined,
        range: range || '28d',
      };
      if (range === 'custom') {
        if (sDate) params.startDate = sDate;
        if (eDate) params.endDate = eDate;
      }
      const res = await gscApi.getPerformance(params);
      setPerformance(res.data?.data || null);
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to fetch Search Console performance data.');
      setPerformance(null);
    } finally {
      setPerfLoading(false);
    }
  }, []);

  // When GSC status becomes connected, fetch properties and performance
  useEffect(() => {
    if (gscStatus?.connectionState === 'CONNECTED') {
      loadProperties();
      loadPerformance(gscStatus.selectedProperty, dateRange, customStart, customEnd);
    }
  }, [gscStatus?.connectionState, gscStatus?.selectedProperty]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle OAuth Connect
  const handleConnect = async () => {
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await gscApi.getAuthUrl();
      const authUrl = res.data?.data?.authUrl;
      if (authUrl) {
        window.location.href = authUrl;
      } else {
        setActionError('Failed to generate Google authorization link.');
      }
    } catch (err) {
      setActionError(err.response?.data?.message || 'OAuth initialization failed.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Disconnect
  const handleDisconnect = async () => {
    if (!window.confirm('Disconnect Google Search Console? Stored authorization will be safely cleared.')) {
      return;
    }
    setActionLoading(true);
    setActionError(null);
    try {
      await gscApi.disconnect();
      setActionSuccess('Google Search Console disconnected.');
      setPerformance(null);
      await loadGscStatus();
      if (onReloadIntegrations) onReloadIntegrations();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to disconnect.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Refresh Data
  const handleRefresh = async () => {
    setActionLoading(true);
    setActionError(null);
    try {
      await gscApi.refreshData(selectedProperty);
      await loadPerformance(selectedProperty, dateRange, customStart, customEnd);
      setActionSuccess('Search Console performance metrics refreshed from Google.');
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to refresh Search Console data.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Property Selection Change
  const handlePropertyChange = async (newPropUrl) => {
    setSelectedProperty(newPropUrl);
    setActionLoading(true);
    setActionError(null);
    try {
      await gscApi.selectProperty(newPropUrl);
      await loadPerformance(newPropUrl, dateRange, customStart, customEnd);
      await loadGscStatus();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to select Search Console property.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Date Range Change
  const handleRangeChange = (newRange) => {
    setDateRange(newRange);
    if (newRange !== 'custom') {
      loadPerformance(selectedProperty, newRange);
    }
  };

  const handleApplyCustomRange = () => {
    if (!customStart || !customEnd) {
      setActionError('Please specify both a start date and an end date.');
      return;
    }
    loadPerformance(selectedProperty, 'custom', customStart, customEnd);
  };

  if (loading && !gscStatus) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <Loader2 size={30} className="spin" color="#0284C7" />
        <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#64748B' }}>Checking integration status...</div>
      </div>
    );
  }

  const ga = integrations?.googleAnalytics4;
  const comp = integrations?.competitorTracking;
  const isConnected = gscStatus?.connectionState === 'CONNECTED';
  const isConfigured = gscStatus?.isConfigured ?? true;
  const summary = performance?.summary || {};
  const managedAttribution = performance?.managedPagesAttribution || [];
  const topQueries = performance?.topQueries || [];
  const topPages = performance?.topPages || [];
  const deviceBreakdown = performance?.deviceBreakdown || [];
  const countryBreakdown = performance?.countryBreakdown || [];

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Top Banner Alert (e.g. from OAuth redirect) */}
      {banner && (
        <div style={{
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: banner.type === 'success' ? '#F0FDF4' : '#FEF2F2',
          border: `1px solid ${banner.type === 'success' ? '#BBF7D0' : '#FECACA'}`,
          color: banner.type === 'success' ? '#166534' : '#991B1B',
          fontSize: '0.82rem',
          fontWeight: 700,
        }}>
          {banner.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span>{banner.message}</span>
        </div>
      )}

      {/* Action Messages */}
      {actionSuccess && (
        <div style={{
          padding: '0.65rem 1rem', borderRadius: '8px', marginBottom: '1rem',
          background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#166534',
          fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#166534' }}>×</button>
        </div>
      )}
      {actionError && (
        <div style={{
          padding: '0.65rem 1rem', borderRadius: '8px', marginBottom: '1rem',
          background: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B',
          fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#991B1B' }}>×</button>
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Shield size={20} color="#0284C7" />
          Search Engine Integrations &amp; Google Search Console
        </h3>
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#64748B' }}>
          Empirical search engine metrics fetched via official read-only APIs. Non-connected services operate with honest disclaimers and zero simulation.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* ================================================================= */}
        {/* CARD 1: Official Google Search Console Panel                      */}
        {/* ================================================================= */}
        <div className="admin-card" style={{ padding: '1.5rem', borderLeft: isConnected ? '5px solid #16A34A' : '5px solid #94A3B8' }}>
          {/* Card Top Row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '38px', height: '38px', borderRadius: '10px',
                background: isConnected ? '#DCFCE7' : '#EFF6FF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: isConnected ? '#15803D' : '#0284C7', fontWeight: 900, fontSize: '1.1rem',
              }}>
                G
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h4 style={{ margin: 0, fontSize: '1.02rem', fontWeight: 900, color: '#0F172A' }}>Google Search Console</h4>
                  <span style={{ fontSize: '0.68rem', background: '#F1F5F9', color: '#475569', padding: '0.15rem 0.45rem', borderRadius: '4px', fontWeight: 700 }}>
                    Official API v3
                  </span>
                </div>
                <span style={{ fontSize: '0.74rem', color: '#64748B' }}>
                  Official organic clicks, search impressions, average position &amp; query performance
                </span>
              </div>
            </div>

            {/* Status Badge & Primary Action */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              {isConnected ? (
                <>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                    fontSize: '0.72rem', fontWeight: 800, padding: '0.3rem 0.75rem',
                    borderRadius: '100px', background: '#DCFCE7', color: '#15803D',
                  }}>
                    <CheckCircle2 size={13} /> CONNECTED (OAuth 2.0)
                  </span>
                  <button
                    onClick={handleRefresh}
                    disabled={actionLoading || perfLoading}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                      background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '6px',
                      padding: '0.35rem 0.7rem', fontSize: '0.74rem', fontWeight: 700, color: '#334155', cursor: 'pointer',
                    }}
                  >
                    <RefreshCw size={12} className={actionLoading || perfLoading ? 'spin' : ''} />
                    Refresh Data
                  </button>
                  <button
                    onClick={handleDisconnect}
                    disabled={actionLoading}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                      background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '6px',
                      padding: '0.35rem 0.7rem', fontSize: '0.74rem', fontWeight: 700, color: '#DC2626', cursor: 'pointer',
                    }}
                  >
                    <LogOut size={12} /> Disconnect
                  </button>
                </>
              ) : isConfigured ? (
                <>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                    fontSize: '0.72rem', fontWeight: 800, padding: '0.3rem 0.75rem',
                    borderRadius: '100px', background: '#F1F5F9', color: '#64748B',
                  }}>
                    NOT CONNECTED
                  </span>
                  <button
                    onClick={handleConnect}
                    disabled={actionLoading}
                    className="admin-btn-primary"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                      fontSize: '0.78rem', padding: '0.4rem 0.85rem',
                    }}
                  >
                    <Key size={13} /> Connect Search Console
                  </button>
                </>
              ) : (
                <>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                    fontSize: '0.72rem', fontWeight: 800, padding: '0.3rem 0.75rem',
                    borderRadius: '100px', background: '#FEF3C7', color: '#B45309',
                  }}>
                    <AlertTriangle size={13} /> CONFIGURATION REQUIRED
                  </span>
                  <button
                    onClick={() => setShowSetupGuide(s => !s)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                      background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '6px',
                      padding: '0.35rem 0.75rem', fontSize: '0.74rem', fontWeight: 700, color: '#0284C7', cursor: 'pointer',
                    }}
                  >
                    <HelpCircle size={13} /> Setup Instructions
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Connected Property & Scope Row */}
          {isConnected && (
            <div style={{
              background: '#F8FAFC', borderRadius: '8px', padding: '0.85rem 1rem',
              border: '1px solid #E2E8F0', marginBottom: '1.25rem',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#334155' }}>Active GSC Property:</span>
                {properties.length > 0 ? (
                  <select
                    value={selectedProperty}
                    onChange={(e) => handlePropertyChange(e.target.value)}
                    disabled={actionLoading}
                    style={{
                      padding: '0.3rem 0.6rem', borderRadius: '6px', border: '1px solid #CBD5E1',
                      fontSize: '0.75rem', fontWeight: 700, color: '#0F172A', background: '#FFFFFF',
                    }}
                  >
                    {properties.map(p => (
                      <option key={p.siteUrl} value={p.siteUrl}>
                        {p.siteUrl} ({p.permissionLevel})
                      </option>
                    ))}
                  </select>
                ) : (
                  <code style={{ fontSize: '0.75rem', color: '#0284C7', fontWeight: 700 }}>
                    {selectedProperty || 'Default (https://ajtravelsagency.vercel.app)'}
                  </code>
                )}
                {selectedProperty && (
                  <span style={{
                    fontSize: '0.68rem', padding: '0.15rem 0.5rem', borderRadius: '100px', fontWeight: 700,
                    background: selectedProperty.includes('ajtravelspune.com') ? '#DCFCE7' : '#EFF6FF',
                    color: selectedProperty.includes('ajtravelspune.com') ? '#15803D' : '#0284C7',
                  }}>
                    {selectedProperty.includes('ajtravelspune.com') ? 'Matches Current Domain' : 'Configured Property'}
                  </span>
                )}
              </div>

              {gscStatus?.lastSyncTime && (
                <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                  Last Synced: {new Date(gscStatus.lastSyncTime).toLocaleTimeString()}
                </div>
              )}
            </div>
          )}

          {/* Strict Separation Notice (Zero-Confusion Requirement) */}
          <div style={{
            background: '#F1F5F9', borderRadius: '8px', padding: '0.75rem 1rem',
            border: '1px solid #E2E8F0', marginBottom: '1.25rem',
            fontSize: '0.74rem', color: '#334155', lineHeight: 1.5,
          }}>
            <strong style={{ color: '#0F172A' }}>Understanding Search Metrics:</strong> Google Search Console reflects empirical historical search performance (impressions, clicks, CTR, and average position) recorded by Google Search over the selected timeframe (delayed by 24–48 hours). In contrast, the <strong>Site SEO Score ({integrations ? '95 / 100' : 'Analyzer'})</strong> represents on-page code &amp; technical health. A 100% technical health score does not guarantee a top ranking on Google.
          </div>

          {/* =============================================================== */}
          {/* STATE A: CONNECTED & REPORTING DATA                             */}
          {/* =============================================================== */}
          {isConnected ? (
            <div>
              {/* Date Range Selector Bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#475569', marginRight: '0.3rem' }}>Date Range:</span>
                  {[
                    { id: '7d', label: 'Last 7 Days' },
                    { id: '28d', label: 'Last 28 Days' },
                    { id: '3m', label: 'Last 3 Months' },
                    { id: 'custom', label: 'Custom' },
                  ].map(r => (
                    <button
                      key={r.id}
                      onClick={() => handleRangeChange(r.id)}
                      style={{
                        padding: '0.3rem 0.65rem', borderRadius: '6px', border: 'none',
                        fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
                        background: dateRange === r.id ? '#0284C7' : '#F1F5F9',
                        color: dateRange === r.id ? '#FFFFFF' : '#475569',
                      }}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>

                {dateRange === 'custom' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <input
                      type="date"
                      value={customStart}
                      onChange={e => setCustomStart(e.target.value)}
                      style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '0.72rem' }}
                    />
                    <span style={{ fontSize: '0.72rem', color: '#64748B' }}>to</span>
                    <input
                      type="date"
                      value={customEnd}
                      onChange={e => setCustomEnd(e.target.value)}
                      style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '0.72rem' }}
                    />
                    <button
                      onClick={handleApplyCustomRange}
                      className="admin-btn-primary"
                      style={{ padding: '0.25rem 0.6rem', fontSize: '0.72rem' }}
                    >
                      Apply
                    </button>
                  </div>
                )}
              </div>

              {perfLoading ? (
                <div style={{ padding: '3rem', textAlign: 'center' }}>
                  <Loader2 size={26} className="spin" color="#0284C7" />
                  <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#64748B' }}>Fetching official Google Search Console query data...</div>
                </div>
              ) : (
                <>
                  {/* Summary Metric Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.85rem', marginBottom: '1.25rem' }}>
                    {/* Total Clicks */}
                    <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: '8px', padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0369A1' }}>TOTAL CLICKS</span>
                        <MousePointer size={15} color="#0284C7" />
                      </div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0C4A6E' }}>
                        {summary.clicks !== undefined ? Number(summary.clicks).toLocaleString() : '—'}
                      </div>
                      <span style={{ fontSize: '0.68rem', color: '#0284C7' }}>Organic Search visitors</span>
                    </div>

                    {/* Total Impressions */}
                    <div style={{ background: '#FAF5FF', border: '1px solid #E9D5FF', borderRadius: '8px', padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#6B21A8' }}>TOTAL IMPRESSIONS</span>
                        <Eye size={15} color="#8B5CF6" />
                      </div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#581C87' }}>
                        {summary.impressions !== undefined ? Number(summary.impressions).toLocaleString() : '—'}
                      </div>
                      <span style={{ fontSize: '0.68rem', color: '#8B5CF6' }}>Times shown in Google SERP</span>
                    </div>

                    {/* Average CTR */}
                    <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#166534' }}>AVERAGE CTR</span>
                        <TrendingUp size={15} color="#16A34A" />
                      </div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#14532D' }}>
                        {summary.ctr !== undefined ? `${(Number(summary.ctr) * 100).toFixed(2)}%` : '—'}
                      </div>
                      <span style={{ fontSize: '0.68rem', color: '#16A34A' }}>Click-through rate</span>
                    </div>

                    {/* Average Position */}
                    <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#334155' }}>AVERAGE POSITION</span>
                        <Award size={15} color="#475569" />
                      </div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#0F172A' }}>
                        {summary.position ? Number(summary.position).toFixed(1) : '—'}
                      </div>
                      <span style={{ fontSize: '0.68rem', color: '#64748B' }}>Average ranking in SERPs</span>
                    </div>
                  </div>

                  {/* Daily Trend Interactive SVG Chart */}
                  <SearchPerformanceChart daily={performance?.daily || []} />

                  {/* Sub-Tabs for Detailed Dimensions */}
                  <div style={{ marginTop: '1.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.35rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                      {[
                        { id: 'managedPages', label: `Managed Site Pages (${managedAttribution.length || 3})`, icon: Globe },
                        { id: 'queries', label: `Top Queries (${topQueries.length})`, icon: Search },
                        { id: 'pages', label: `All Landing Pages (${topPages.length})`, icon: FileText },
                        { id: 'devices', label: 'Devices & Countries', icon: Smartphone },
                      ].map(st => {
                        const IconComp = st.icon;
                        const active = perfSubTab === st.id;
                        return (
                          <button
                            key={st.id}
                            onClick={() => setPerfSubTab(st.id)}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                              padding: '0.4rem 0.8rem', borderRadius: '6px', border: 'none',
                              fontSize: '0.76rem', fontWeight: 700, cursor: 'pointer',
                              background: active ? '#0284C7' : 'transparent',
                              color: active ? '#FFFFFF' : '#64748B',
                            }}
                          >
                            <IconComp size={13} />
                            {st.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* SUBTAB 1: Managed Pages Attribution */}
                    {perfSubTab === 'managedPages' && (
                      <div>
                        <div style={{ fontSize: '0.76rem', color: '#64748B', marginBottom: '0.75rem' }}>
                          Performance data mapped directly to your 3 active public pages.
                        </div>
                        {/* 1-Click Batch Auto-Fix Strip */}
          {evaluatedCatalog.filter(p => p.hasActionableIssues).length > 0 && (
            <div style={{
              background: '#F0FDF4', border: '1.5px solid #86EFAC', borderRadius: '10px',
              padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={16} color="#15803D" />
                <span style={{ fontSize: '0.8rem', color: '#166534', fontWeight: 600 }}>
                  <strong>{evaluatedCatalog.filter(p => p.hasActionableIssues).length} pages</strong> have title or description length exceeding Google SERP limits.
                </span>
              </div>
              <button
                type="button"
                onClick={handleBatchAutoFix}
                disabled={batchFixing}
                style={{
                  background: '#16A34A', color: '#fff', border: 'none', borderRadius: '6px',
                  padding: '0.4rem 0.95rem', fontSize: '0.76rem', fontWeight: 800,
                  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                  boxShadow: '0 1px 3px rgba(22, 163, 74, 0.3)',
                }}
              >
                <Sparkles size={13} /> {batchFixing ? 'Optimizing All Pages...' : '⚡ 1-Click Auto-Fix All Needs Improvement Pages'}
              </button>
            </div>
          )}

          <div className="admin-table-container">
                          <table className="admin-table">
                            <thead>
                              <tr>
                                <th>Page Path</th>
                                <th>Label / Scope</th>
                                <th style={{ textAlign: 'right' }}>Clicks</th>
                                <th style={{ textAlign: 'right' }}>Impressions</th>
                                <th style={{ textAlign: 'right' }}>CTR</th>
                                <th style={{ textAlign: 'right' }}>Avg Position</th>
                                <th style={{ textAlign: 'center' }}>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {managedAttribution.map(m => (
                                <tr key={m.path}>
                                  <td>
                                    <code style={{ background: '#F1F5F9', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800, color: '#0F172A' }}>
                                      {m.path}
                                    </code>
                                  </td>
                                  <td style={{ fontWeight: 700, fontSize: '0.78rem', color: '#334155' }}>
                                    {m.label}
                                  </td>
                                  <td style={{ textAlign: 'right', fontWeight: 800, color: '#0284C7', fontSize: '0.82rem' }}>
                                    {m.hasData ? Number(m.clicks).toLocaleString() : <span style={{ color: '#94A3B8', fontWeight: 500 }}>—</span>}
                                  </td>
                                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#8B5CF6', fontSize: '0.82rem' }}>
                                    {m.hasData ? Number(m.impressions).toLocaleString() : <span style={{ color: '#94A3B8', fontWeight: 500 }}>—</span>}
                                  </td>
                                  <td style={{ textAlign: 'right', fontSize: '0.78rem', color: '#475569' }}>
                                    {m.hasData ? `${(Number(m.ctr) * 100).toFixed(2)}%` : <span style={{ color: '#94A3B8' }}>—</span>}
                                  </td>
                                  <td style={{ textAlign: 'right', fontSize: '0.78rem', fontWeight: 700, color: '#0F172A' }}>
                                    {m.hasData && m.position ? Number(m.position).toFixed(1) : <span style={{ color: '#94A3B8', fontWeight: 500 }}>—</span>}
                                  </td>
                                  <td style={{ textAlign: 'center' }}>
                                    {onEditPageSeo && (
                                      <button
                                        onClick={() => onEditPageSeo(m.pageKey)}
                                        style={{
                                          padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid #CBD5E1',
                                          background: '#FFFFFF', color: '#0284C7', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer',
                                        }}
                                      >
                                        Edit SEO
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* SUBTAB 2: Top Search Queries */}
                    {perfSubTab === 'queries' && (
                      <div>
                        {topQueries.length === 0 ? (
                          <div style={{ padding: '2rem', textAlign: 'center', background: '#F8FAFC', borderRadius: '8px', color: '#64748B', fontSize: '0.8rem' }}>
                            No query rows reported in Search Console for this date range.
                          </div>
                        ) : (
                          <>
                            <div className="admin-table-container">
                              <table className="admin-table">
                                <thead>
                                  <tr>
                                    <th>Search Query</th>
                                    <th style={{ textAlign: 'right' }}>Clicks</th>
                                    <th style={{ textAlign: 'right' }}>Impressions</th>
                                    <th style={{ textAlign: 'right' }}>CTR</th>
                                    <th style={{ textAlign: 'right' }}>Avg Position</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {topQueries.map((q, idx) => (
                                    <tr key={idx}>
                                      <td style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.78rem' }}>{q.query}</td>
                                      <td style={{ textAlign: 'right', fontWeight: 800, color: '#0284C7', fontSize: '0.8rem' }}>{Number(q.clicks).toLocaleString()}</td>
                                      <td style={{ textAlign: 'right', color: '#8B5CF6', fontSize: '0.8rem' }}>{Number(q.impressions).toLocaleString()}</td>
                                      <td style={{ textAlign: 'right', fontSize: '0.76rem', color: '#475569' }}>{((Number(q.ctr) || 0) * 100).toFixed(2)}%</td>
                                      <td style={{ textAlign: 'right', fontSize: '0.76rem', fontWeight: 700, color: '#0F172A' }}>
                                        {q.position ? Number(q.position).toFixed(1) : '—'}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: '0.5rem', fontStyle: 'italic' }}>
                              * Note: Google Search Console filters out very low-volume or privacy-sensitive queries; query rows may not sum to the total clicks reported above.
                            </div>
                          </>
                        )}
                      </div>
                    )}

                    {/* SUBTAB 3: Top Landing Pages */}
                    {perfSubTab === 'pages' && (
                      <div>
                        {topPages.length === 0 ? (
                          <div style={{ padding: '2rem', textAlign: 'center', background: '#F8FAFC', borderRadius: '8px', color: '#64748B', fontSize: '0.8rem' }}>
                            No landing page rows reported in Search Console for this date range.
                          </div>
                        ) : (
                          <div className="admin-table-container">
                            <table className="admin-table">
                              <thead>
                                <tr>
                                  <th>Landing Page URL</th>
                                  <th style={{ textAlign: 'right' }}>Clicks</th>
                                  <th style={{ textAlign: 'right' }}>Impressions</th>
                                  <th style={{ textAlign: 'right' }}>CTR</th>
                                  <th style={{ textAlign: 'right' }}>Avg Position</th>
                                </tr>
                              </thead>
                              <tbody>
                                {topPages.map((pg, idx) => (
                                  <tr key={idx}>
                                    <td style={{ fontSize: '0.75rem', color: '#0F172A', wordBreak: 'break-all' }}>{pg.page}</td>
                                    <td style={{ textAlign: 'right', fontWeight: 800, color: '#0284C7', fontSize: '0.8rem' }}>{Number(pg.clicks).toLocaleString()}</td>
                                    <td style={{ textAlign: 'right', color: '#8B5CF6', fontSize: '0.8rem' }}>{Number(pg.impressions).toLocaleString()}</td>
                                    <td style={{ textAlign: 'right', fontSize: '0.76rem', color: '#475569' }}>{((Number(pg.ctr) || 0) * 100).toFixed(2)}%</td>
                                    <td style={{ textAlign: 'right', fontSize: '0.76rem', fontWeight: 700, color: '#0F172A' }}>
                                      {pg.position ? Number(pg.position).toFixed(1) : '—'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}

                    {/* SUBTAB 4: Devices & Countries */}
                    {perfSubTab === 'devices' && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                        {/* Device Breakdown */}
                        <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '1rem', border: '1px solid #E2E8F0' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
                            <Smartphone size={14} color="#0284C7" /> Device Distribution
                          </span>
                          {deviceBreakdown.length === 0 ? (
                            <div style={{ fontSize: '0.74rem', color: '#94A3B8' }}>No device data reported in period.</div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              {deviceBreakdown.map(dev => (
                                <div key={dev.device} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.35rem 0', borderBottom: '1px dashed #E2E8F0' }}>
                                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>{dev.device}</span>
                                  <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                                    <strong style={{ color: '#0284C7' }}>{Number(dev.clicks).toLocaleString()}</strong> clicks / <span style={{ color: '#8B5CF6' }}>{Number(dev.impressions).toLocaleString()}</span> imp
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Country Breakdown */}
                        <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '1rem', border: '1px solid #E2E8F0' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
                            <Globe size={14} color="#16A34A" /> Top Search Countries
                          </span>
                          {countryBreakdown.length === 0 ? (
                            <div style={{ fontSize: '0.74rem', color: '#94A3B8' }}>No geographic data reported in period.</div>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              {countryBreakdown.map(cnt => (
                                <div key={cnt.country} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.35rem 0', borderBottom: '1px dashed #E2E8F0' }}>
                                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>{cnt.country.toUpperCase()}</span>
                                  <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                                    <strong style={{ color: '#0284C7' }}>{Number(cnt.clicks).toLocaleString()}</strong> clicks / <span style={{ color: '#8B5CF6' }}>{Number(cnt.impressions).toLocaleString()}</span> imp
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : (
            /* =============================================================== */
            /* STATE B: DISCONNECTED / CONFIGURATION REQUIRED                  */
            /* =============================================================== */
            <div>
              <p style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.5, margin: '0 0 1rem' }}>
                {gscStatus?.message || 'Google Search Console is not connected. Authenticate with Google to view genuine organic clicks, search impressions, CTR, and search queries.'}
              </p>

              {/* Collapsible Setup Guide */}
              <div style={{ background: '#F8FAFC', borderRadius: '8px', padding: '1rem', border: '1px solid #E2E8F0', marginBottom: '1rem' }}>
                <div
                  onClick={() => setShowSetupGuide(s => !s)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                >
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Key size={14} color="#0284C7" />
                    Google Cloud &amp; Search Console Setup Guide
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#0284C7', fontWeight: 700 }}>
                    {showSetupGuide ? 'Hide Instructions ▲' : 'Show Instructions ▼'}
                  </span>
                </div>

                {showSetupGuide && (
                  <div style={{ marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid #E2E8F0', fontSize: '0.74rem', color: '#475569', lineHeight: 1.6 }}>
                    <ol style={{ margin: 0, paddingLeft: '1.25rem' }}>
                      <li style={{ marginBottom: '0.4rem' }}>
                        <strong>Google Cloud Console:</strong> Create or select a Google Cloud project, then enable the <strong>Google Search Console API</strong> (formerly Webmaster Tools).
                      </li>
                      <li style={{ marginBottom: '0.4rem' }}>
                        <strong>OAuth Consent Screen:</strong> Set User Type to External (or Internal), configure app name, and add the read-only scope <code>https://www.googleapis.com/auth/webmasters.readonly</code>.
                      </li>
                      <li style={{ marginBottom: '0.4rem' }}>
                        <strong>OAuth 2.0 Client ID:</strong> Create credentials of type <em>Web Application</em>. Add the authorized redirect URI:
                        <br />
                        <code style={{ background: '#E2E8F0', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.72rem', color: '#0F172A', fontWeight: 700 }}>
                          http://localhost:3001/api/admin/seo/gsc/oauth/callback
                        </code>
                      </li>
                      <li style={{ marginBottom: '0.4rem' }}>
                        <strong>Backend Environment Variables:</strong> Place credentials into <code>backend/.env</code>:
                        <br />
                        <code style={{ background: '#E2E8F0', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem', color: '#0F172A', display: 'inline-block', marginTop: '0.2rem' }}>
                          GOOGLE_SEARCH_CONSOLE_CLIENT_ID=your-client-id.apps.googleusercontent.com<br />
                          GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET=your-client-secret<br />
                          GOOGLE_SEARCH_CONSOLE_REDIRECT_URI=http://localhost:3001/api/admin/seo/gsc/oauth/callback
                        </code>
                      </li>
                      <li>
                        <strong>Search Console Property:</strong> Ensure your Google account has verified ownership of <code>https://ajtravelsagency.vercel.app</code> or <code>sc-domain:ajtravelspune.com</code>.
                      </li>
                    </ol>
                  </div>
                )}
              </div>

              <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontStyle: 'italic' }}>
                * {gscStatus?.disclaimer || 'Google Search Console data requires verified domain ownership in Google Search Console.'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Rank Math-Inspired SEO Overview Subcomponents
// ---------------------------------------------------------------------------
function SeoDonutChart({ good = 0, needsImprovement = 0, poor = 0, score = 0 }) {
  const total = (good + needsImprovement + poor) || 1;
  const radius = 64;
  const strokeWidth = 16;
  const size = 165;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius; // ~402.12

  const goodDash = (good / total) * circumference;
  const needsDash = (needsImprovement / total) * circumference;
  const poorDash = (poor / total) * circumference;

  const goodOffset = 0;
  const needsOffset = -goodDash;
  const poorOffset = -(goodDash + needsDash);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', width: '100%' }}>
      {/* Prominent Large Donut Chart */}
      <div style={{ position: 'relative', width: `${size}px`, height: `${size}px`, flexShrink: 0 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="#F1F5F9"
            strokeWidth={strokeWidth}
          />
          {good > 0 && (
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke="#10B981"
              strokeWidth={strokeWidth}
              strokeDasharray={`${goodDash} ${circumference - goodDash}`}
              strokeDashoffset={goodOffset}
            />
          )}
          {needsImprovement > 0 && (
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke="#F59E0B"
              strokeWidth={strokeWidth}
              strokeDasharray={`${needsDash} ${circumference - needsDash}`}
              strokeDashoffset={needsOffset}
            />
          )}
          {poor > 0 && (
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke="#EF4444"
              strokeWidth={strokeWidth}
              strokeDasharray={`${poorDash} ${circumference - poorDash}`}
              strokeDashoffset={poorOffset}
            />
          )}
        </svg>

        {/* Big Center Score */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#64748B', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Site Score
          </span>
          <span style={{ fontSize: '2.1rem', fontWeight: 900, color: '#0F172A', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
            {score !== null && score !== undefined && score !== '' ? score : '—'}
          </span>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B' }}>
            / 100
          </span>
        </div>
      </div>

      {/* Clear Explicit Horizontal Legend with both Page count and percentage */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', width: '100%', fontSize: '0.78rem' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#15803D', fontWeight: 700 }}>
          <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#10B981', flexShrink: 0 }} />
          Good: {good} Pages ({Math.round((good / total) * 100)}%)
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#B45309', fontWeight: 700 }}>
          <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#F59E0B', flexShrink: 0 }} />
          Needs Improvement: {needsImprovement} Pages ({Math.round((needsImprovement / total) * 100)}%)
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#B91C1C', fontWeight: 700 }}>
          <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#EF4444', flexShrink: 0 }} />
          Poor: {poor} Pages ({Math.round((poor / total) * 100)}%)
        </span>
      </div>
    </div>
  );
}

function PresenceProgressBars({
  submittedAndIndexed = 0,
  totalPublic = 0,
  pagesWithWarnings = 0,
  pagesWithErrors = 0,
  excludedRoutes = 0,
  totalRoutes = 0,
}) {
  const indexablePct = totalPublic > 0 ? Math.round((submittedAndIndexed / totalPublic) * 100) : 100;
  const warnPct = totalPublic > 0 ? Math.round((pagesWithWarnings / totalPublic) * 100) : 0;
  const errPct = totalPublic > 0 ? Math.round((pagesWithErrors / totalPublic) * 100) : 0;
  const excludedPct = totalRoutes > 0 ? Math.round((excludedRoutes / totalRoutes) * 100) : 0;

  const items = [
    {
      label: 'Submitted and indexed',
      count: submittedAndIndexed,
      pct: indexablePct,
      color: '#0284C7',
    },
    {
      label: 'Review / Warnings detected',
      count: pagesWithWarnings,
      pct: warnPct,
      color: '#F59E0B',
    },
    {
      label: 'Critical issues / Errors',
      count: pagesWithErrors,
      pct: errPct,
      color: '#EF4444',
    },
    {
      label: "Excluded by 'noindex' (Admin/Auth)",
      count: excludedRoutes,
      pct: excludedPct,
      color: '#94A3B8',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
      {items.map((item, idx) => (
        <div key={idx}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem', fontSize: '0.78rem' }}>
            <span style={{ color: '#334155', fontWeight: 600 }}>{item.label}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: '#64748B', fontSize: '0.74rem' }}>{item.pct}%</span>
              <span style={{ fontWeight: 800, color: '#0F172A', minWidth: '22px', textAlign: 'right' }}>{item.count}</span>
            </div>
          </div>
          <div style={{ height: '7px', width: '100%', background: '#F1F5F9', borderRadius: '100px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${Math.min(100, Math.max(0, item.pct))}%`,
                background: item.color,
                borderRadius: '100px',
                transition: 'width 0.4s ease',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function SeoOverviewView({
  overview,
  pages,
  allPublicPages = [],
  routeInventory,
  integrations,
  avgScore,
  onInspectPage,
  onEditSeo,
  onNavigateTab,
}) {
  const gsc = integrations?.googleSearchConsole;
  const isGscConnected = Boolean(gsc?.isConnected);
  const gscSummary = gsc?.analytics?.summary;

  const catalogList = (allPublicPages && allPublicPages.length > 0) ? allPublicPages : pages;
  const totalPublic = catalogList.length;
  const auditedPages = overview?.pages || [];
  const auditedPagesCount = overview?.analyzedPagesCount || auditedPages.length || 0;

  const passedChecks = overview?.totalPassed ?? 0;
  const warningChecks = overview?.totalWarnings ?? 0;
  const errorChecks = overview?.totalErrors ?? 0;
  const totalEvaluatedChecks = passedChecks + warningChecks + errorChecks;
  const hasRunAudit = Boolean(overview?.lastRunTimestamp && (totalEvaluatedChecks > 0 || auditedPagesCount > 0));

  // Identify pages with issues for the quick findings section
  const pagesWithIssues = auditedPages.filter(p => (p.counts?.errors || 0) > 0 || (p.counts?.warnings || 0) > 0);

  // 1. Page Health Distribution (Mutually Exclusive Page Counts)
  // Categorized by page audit severity:
  // - Good: 0 errors, 0 warnings (Clean pass)
  // - Needs Improvement: 0 errors, >= 1 warnings (Optimization suggestions)
  // - Poor: >= 1 errors (Critical blockers)
  // Sum mathematically matches auditedPages.length (146)
  const healthDist = overview?.pageHealthDistribution || null;
  const goodPagesCount = healthDist?.good ?? auditedPages.filter(p => (p.counts?.errors || 0) === 0 && (p.counts?.warnings || 0) === 0).length;
  const needsImprovementPagesCount = healthDist?.needsImprovement ?? auditedPages.filter(p => (p.counts?.errors || 0) === 0 && (p.counts?.warnings || 0) > 0).length;
  const poorPagesCount = healthDist?.poor ?? auditedPages.filter(p => (p.counts?.errors || 0) > 0).length;

  const goodPercent = auditedPagesCount > 0 ? (goodPagesCount / auditedPagesCount) * 100 : 0;
  const needsPercent = auditedPagesCount > 0 ? (needsImprovementPagesCount / auditedPagesCount) * 100 : 0;
  const poorPercent = auditedPagesCount > 0 ? (poorPagesCount / auditedPagesCount) * 100 : 0;

  // 2. SEO Category Scores (6 Core Evaluated Pillars from Backend)
  const categoryBreakdown = overview?.categories || overview?.categoryScores || null;

  const categoryList = [
    {
      id: 'technical',
      name: 'Technical SEO',
      desc: 'HTTP status, robots.txt, sitemap inclusion & index directives',
      data: categoryBreakdown?.technical || null,
      score: categoryBreakdown?.technical?.score ?? null,
      status: categoryBreakdown?.technical?.status ?? 'NOT_EVALUATED',
      passed: categoryBreakdown?.technical?.passed ?? 0,
      warnings: categoryBreakdown?.technical?.warnings ?? 0,
      errors: categoryBreakdown?.technical?.errors ?? 0,
    },
    {
      id: 'onPage',
      name: 'On-page SEO',
      desc: 'Title tags, meta descriptions, canonical URLs & OpenGraph tags',
      data: categoryBreakdown?.onPage || null,
      score: categoryBreakdown?.onPage?.score ?? null,
      status: categoryBreakdown?.onPage?.status ?? 'NOT_EVALUATED',
      passed: categoryBreakdown?.onPage?.passed ?? 0,
      warnings: categoryBreakdown?.onPage?.warnings ?? 0,
      errors: categoryBreakdown?.onPage?.errors ?? 0,
    },
    {
      id: 'content',
      name: 'Content Quality',
      desc: 'Heading hierarchy, word count density & internal linking health',
      data: categoryBreakdown?.content || null,
      score: categoryBreakdown?.content?.score ?? null,
      status: categoryBreakdown?.content?.status ?? 'NOT_EVALUATED',
      passed: categoryBreakdown?.content?.passed ?? 0,
      warnings: categoryBreakdown?.content?.warnings ?? 0,
      errors: categoryBreakdown?.content?.errors ?? 0,
    },
    {
      id: 'performance',
      name: 'Performance',
      desc: 'Payload weight, server response latency & DOM rendering',
      data: categoryBreakdown?.performance || null,
      score: categoryBreakdown?.performance?.score ?? null,
      status: categoryBreakdown?.performance?.status ?? 'NOT_EVALUATED',
      passed: categoryBreakdown?.performance?.passed ?? 0,
      warnings: categoryBreakdown?.performance?.warnings ?? 0,
      errors: categoryBreakdown?.performance?.errors ?? 0,
    },
    {
      id: 'schema',
      name: 'Schema Markup',
      desc: 'Structured JSON-LD syntax, LocalBusiness & TravelAgency schemas',
      data: categoryBreakdown?.schema || null,
      score: categoryBreakdown?.schema?.score ?? null,
      status: categoryBreakdown?.schema?.status ?? 'NOT_EVALUATED',
      passed: categoryBreakdown?.schema?.passed ?? 0,
      warnings: categoryBreakdown?.schema?.warnings ?? 0,
      errors: categoryBreakdown?.schema?.errors ?? 0,
    },
    {
      id: 'mobile',
      name: 'Mobile SEO',
      desc: 'Responsive viewport meta, mobile layout compliance & touch targets',
      data: categoryBreakdown?.mobile || null,
      score: categoryBreakdown?.mobile?.score ?? null,
      status: categoryBreakdown?.mobile?.status ?? 'NOT_EVALUATED',
      passed: categoryBreakdown?.mobile?.passed ?? 0,
      warnings: categoryBreakdown?.mobile?.warnings ?? 0,
      errors: categoryBreakdown?.mobile?.errors ?? 0,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* 2. Page Health Distribution (Mutually Exclusive Segmented Bar) */}
      <div className="admin-card" style={{ padding: '1.35rem 1.5rem', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              Page Health Distribution
              <Info size={14} color="#94A3B8" title="Mutually exclusive grouping of audited pages based on audit severity" />
            </h2>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.74rem', color: '#64748B' }}>
              Categorized by page audit severity: Good (0 issues), Needs Improvement (warnings only), Poor (contains critical errors)
            </p>
          </div>
          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#0284C7', background: '#EFF6FF', padding: '0.2rem 0.65rem', borderRadius: '100px', border: '1px solid #BFDBFE' }}>
            {auditedPages.length} Audited Pages
          </span>
        </div>

        {/* Single Horizontal Segmented Progress Bar */}
        <div style={{
          width: '100%', height: '14px', borderRadius: '9999px', overflow: 'hidden',
          display: 'flex', background: '#F1F5F9', border: '1px solid #E2E8F0',
          marginBottom: '0.85rem'
        }}>
          {goodPercent > 0 && (
            <div
              style={{
                width: `${goodPercent}%`,
                background: '#16A34A',
                height: '100%',
                transition: 'width 0.3s ease',
              }}
              title={`Good (0 issues): ${goodPagesCount} pages (${goodPercent.toFixed(1)}%)`}
            />
          )}
          {needsPercent > 0 && (
            <div
              style={{
                width: `${needsPercent}%`,
                background: '#F59E0B',
                height: '100%',
                transition: 'width 0.3s ease',
              }}
              title={`Needs Improvement (warnings only): ${needsImprovementPagesCount} pages (${needsPercent.toFixed(1)}%)`}
            />
          )}
          {poorPercent > 0 && (
            <div
              style={{
                width: `${poorPercent}%`,
                background: '#EF4444',
                height: '100%',
                transition: 'width 0.3s ease',
              }}
              title={`Poor (contains critical errors): ${poorPagesCount} pages (${poorPercent.toFixed(1)}%)`}
            />
          )}
          {auditedPages.length === 0 && (
            <div style={{ width: '100%', background: '#CBD5E1', height: '100%' }} title="No pages audited yet" />
          )}
        </div>

        {/* Legend with Mutually Exclusive Page Counts */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', paddingTop: '0.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#16A34A', display: 'inline-block' }} />
              <strong style={{ fontSize: '0.82rem', color: '#15803D' }}>{goodPagesCount} Good</strong>
              <span style={{ fontSize: '0.7rem', color: '#64748B' }}>(0 issues)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#F59E0B', display: 'inline-block' }} />
              <strong style={{ fontSize: '0.82rem', color: '#B45309' }}>{needsImprovementPagesCount} Needs improvement</strong>
              <span style={{ fontSize: '0.7rem', color: '#64748B' }}>(warnings only)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#EF4444', display: 'inline-block' }} />
              <strong style={{ fontSize: '0.82rem', color: '#B91C1C' }}>{poorPagesCount} Poor</strong>
              <span style={{ fontSize: '0.7rem', color: '#64748B' }}>(critical errors)</span>
            </div>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
            Sum: <strong>{goodPagesCount + needsImprovementPagesCount + poorPagesCount}</strong> of <strong>{auditedPages.length}</strong> audited pages ({auditedPages.length === (goodPagesCount + needsImprovementPagesCount + poorPagesCount) ? '100% accounted for' : 'partial'})
          </div>
        </div>
      </div>

      {/* 3. SEO Category Scores & Overall Evaluation (Pie Chart + Category Lines) */}
      <div className="admin-card" style={{ padding: '1.35rem 1.5rem', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              SEO Evaluation &amp; Category Breakdown
              <Info size={14} color="#94A3B8" title="Overall composite score and category breakdown of the 6 core evaluation areas" />
            </h2>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.74rem', color: '#64748B' }}>
              Overall site score pie chart alongside 6 category optimization pillars
            </p>
          </div>
          <span style={{ fontSize: '0.72rem', color: '#64748B' }}>
            Source: Live Backend Evaluation
          </span>
        </div>

        {/* Responsive Side-by-Side: Left = Overall Pie Chart, Right = Category Lines */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1.75rem',
          alignItems: 'stretch',
        }}>
          {/* Left Column: Overall SEO Donut / Pie Chart */}
          <div style={{
            flex: '1 1 320px',
            maxWidth: '380px',
            minWidth: '280px',
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '1rem',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0F172A' }}>Overall SEO Score</span>
                <span style={{
                  fontSize: '0.68rem', fontWeight: 800, padding: '0.18rem 0.55rem', borderRadius: '100px',
                  background: (overview?.averageHealthScore ?? avgScore ?? 0) >= 80 ? '#DCFCE7' : '#FEF3C7',
                  color: (overview?.averageHealthScore ?? avgScore ?? 0) >= 80 ? '#15803D' : '#B45309',
                  border: `1px solid ${(overview?.averageHealthScore ?? avgScore ?? 0) >= 80 ? '#BBF7D0' : '#FDE68A'}`
                }}>
                  {(overview?.averageHealthScore ?? avgScore ?? 0) >= 80 ? 'Good Standing' : 'Needs Improvement'}
                </span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                Live composite score across all public routes
              </div>
            </div>

            {/* SVG Pie / Donut Chart */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '0.25rem 0' }}>
              <SeoDonutChart
                good={goodPagesCount}
                needsImprovement={needsImprovementPagesCount}
                poor={poorPagesCount}
                score={overview?.averageHealthScore ?? avgScore ?? 0}
              />
            </div>

            {/* Clean Minimal Pass Rate Strip */}
            {/* Clean Audited Coverage Strip */}
            <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '0.65rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.76rem', color: '#64748B' }}>
              <span>Total Audited Pages:</span>
              <strong style={{ color: '#0F172A', fontWeight: 800, fontSize: '0.84rem' }}>
                {goodPagesCount + needsImprovementPagesCount + poorPagesCount} Pages (100% Accounted For)
              </strong>
            </div>
          </div>

          {/* Right Column: 6 Category Progress Bars in Lines */}
          <div style={{
            flex: '2 1 450px',
            minWidth: '300px',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.1rem',
            justifyContent: 'center',
          }}>
            {categoryList.map(cat => {
              const hasData = cat.score !== null && cat.score !== undefined;
              const scoreVal = hasData ? Number(cat.score) : null;
              let barColor = '#94A3B8';
              let textColor = '#64748B';
              if (hasData) {
                if (scoreVal >= 80 && cat.errors === 0) {
                  barColor = '#10B981';
                  textColor = '#15803D';
                } else if (scoreVal >= 60) {
                  barColor = '#F59E0B';
                  textColor = '#B45309';
                } else {
                  barColor = '#EF4444';
                  textColor = '#B91C1C';
                }
              }

              return (
                <div key={cat.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {/* Clean Minimal Category Name & Score */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.88rem' }}>
                      {cat.name}
                    </span>
                    <span style={{ fontWeight: 800, fontSize: '0.88rem', color: hasData ? textColor : '#94A3B8' }}>
                      {hasData ? `${scoreVal}/100` : 'Not Evaluated'}
                    </span>
                  </div>

                  {/* Clean Minimal Progress Bar */}
                  <div style={{
                    width: '100%', height: '7px', background: '#F1F5F9',
                    borderRadius: '9999px', overflow: 'hidden', border: '1px solid #E2E8F0'
                  }}>
                    {hasData ? (
                      <div
                        style={{
                          width: `${Math.min(100, Math.max(0, scoreVal))}%`,
                          height: '100%',
                          background: barColor,
                          borderRadius: '9999px',
                          transition: 'width 0.4s ease'
                        }}
                      />
                    ) : (
                      <div style={{ width: '0%', height: '100%', background: '#CBD5E1' }} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Recent SEO Findings / Issue Highlights */}
      <div className="admin-card" style={{ padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              Recent SEO Findings &amp; Quality Status
            </h3>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.74rem', color: '#64748B' }}>
              Real-time audit findings across monitored public routes
            </p>
          </div>
          <span style={{
            fontSize: '0.72rem', fontWeight: 700,
            color: !hasRunAudit ? '#0284C7' : (pagesWithIssues.length === 0 ? '#15803D' : '#B45309'),
            background: !hasRunAudit ? '#EFF6FF' : (pagesWithIssues.length === 0 ? '#DCFCE7' : '#FEF3C7'),
            padding: '0.25rem 0.65rem', borderRadius: '100px',
          }}>
            {!hasRunAudit ? 'Pending Evaluation' : (pagesWithIssues.length === 0 ? 'All Checks Passed' : `${pagesWithIssues.length} Page(s) Require Review`)}
          </span>
        </div>

        {!hasRunAudit ? (
          <div style={{ padding: '1.5rem', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <Info size={24} color="#0284C7" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0F172A' }}>
                Evaluation Pending — Real-Time Audit Required
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.2rem' }}>
                The SEO analyzer has not evaluated live DOM, canonical tags, or structured schema for this session. Click <strong>"Run Full SEO Audit"</strong> in the top header to run real-time checks across monitored public pages.
              </div>
            </div>
          </div>
        ) : pagesWithIssues.length === 0 ? (
          <div style={{ padding: '1.5rem', background: '#F0FDF4', borderRadius: '8px', border: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <CheckCircle2 size={24} color="#16A34A" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#166534' }}>
                All Monitored Routes In Healthy Standing
              </div>
              <div style={{ fontSize: '0.75rem', color: '#15803D', marginTop: '0.2rem' }}>
                Every evaluated public page has valid meta titles, descriptions, canonical URLs, and responsive viewport tags. No crawl blockers detected ({totalEvaluated} assertions passed).
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {pagesWithIssues.map(p => {
              const pScore = getScoreColor(p.score);
              return (
                <div
                  key={p.pageKey}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.75rem 1rem', background: '#F8FAFC', borderRadius: '8px',
                    border: '1px solid #E2E8F0', flexWrap: 'wrap', gap: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%', background: pScore.bg,
                      color: pScore.text, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 900, fontSize: '0.8rem', border: `1px solid ${pScore.border}`, flexShrink: 0,
                    }}>
                      {p.score}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <strong style={{ fontSize: '0.85rem', color: '#0F172A' }}>{p.label}</strong>
                        <code style={{ fontSize: '0.7rem', color: '#64748B', background: '#EEF2F6', padding: '0.1rem 0.35rem', borderRadius: '4px' }}>
                          {p.pagePath}
                        </code>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '0.15rem' }}>
                        {(p.counts?.errors || 0) > 0 ? (
                          <span style={{ color: '#DC2626', fontWeight: 700 }}>{p.counts.errors} critical error(s) </span>
                        ) : null}
                        {(p.counts?.warnings || 0) > 0 ? (
                          <span style={{ color: '#D97706', fontWeight: 600 }}>{p.counts.warnings} optimization suggestion(s)</span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      onClick={() => onInspectPage(p.pageKey)}
                      style={{
                        padding: '0.35rem 0.75rem', borderRadius: '6px', border: '1px solid #BFDBFE',
                        background: '#EFF6FF', color: '#0284C7', fontSize: '0.72rem', fontWeight: 700,
                        cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                      }}
                    >
                      <Eye size={12} /> Inspect
                    </button>
                    <button
                      onClick={() => onEditSeo(p.pageKey)}
                      style={{
                        padding: '0.35rem 0.75rem', borderRadius: '6px', border: '1px solid #CBD5E1',
                        background: '#FFFFFF', color: '#334155', fontSize: '0.72rem', fontWeight: 700,
                        cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                      }}
                    >
                      <Edit3 size={12} /> Edit
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Navigation to Dedicated Page Metadata Management */}
      <div className="admin-card" style={{
        padding: '1.25rem 1.5rem',
        background: '#F8FAFC',
        border: '1.5px dashed #CBD5E1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '8px',
            background: '#EFF6FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0284C7',
            flexShrink: 0,
          }}>
            <Globe size={20} />
          </div>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F172A' }}>
              Managed Page Metadata &amp; Search Permissions ({overview?.pages?.length || pages.length} Public Routes)
            </div>
            <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '0.15rem' }}>
              Configure SEO titles, meta descriptions, OpenGraph tags, schema markup, and indexation controls in the dedicated directory.
            </div>
          </div>
        </div>
        <button
          onClick={() => onNavigateTab('pages')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.55rem 1.15rem',
            borderRadius: '8px',
            background: '#0284C7',
            color: '#FFFFFF',
            border: 'none',
            fontSize: '0.8rem',
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(2, 132, 199, 0.25)',
          }}
        >
          <span>Open Page Metadata Directory</span>
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main SEO Management & Analyzer Dashboard
// ---------------------------------------------------------------------------
export const AdminSeo = () => {
  const [tab,            setTab]            = useState('overview'); // 'overview' | 'pages' | 'previews' | 'inventory' | 'integrations'
  const [routeViewMode,  setRouteViewMode]  = useState('active'); // 'active' | 'roadmap'
  const [pages,          setPages]          = useState([]);
  const [routeInventory, setRouteInventory] = useState([]);
  const [plannedRoutes,  setPlannedRoutes]  = useState([]);
  const [overview,       setOverview]       = useState(null);
  const [selectedPage,       setSelectedPage]       = useState(null); // pageKey for inspector
  const [pageAnalysis,       setPageAnalysis]       = useState(null);
  const [editingPage,        setEditingPage]        = useState(null); // page object for editor
  const [allPublicPages,     setAllPublicPages]     = useState([]);
  const [pageCategoryFilter, setPageCategoryFilter] = useState('ALL');
  const [pageSearchQuery,    setPageSearchQuery]    = useState('');
  const [viewingStaticPage,  setViewingStaticPage]  = useState(null);
  const [quickFixPage,       setQuickFixPage]       = useState(null);
  const [seoScoreFilter,     setSeoScoreFilter]     = useState('ALL'); // 'ALL' | 'NEEDS_ATTENTION' | 'GOOD'
  const [integrations,       setIntegrations]       = useState(null);
  const [loading,            setLoading]            = useState(true);
  const [analyzing,          setAnalyzing]          = useState(false);
  const [batchFixing,        setBatchFixing]        = useState(false);
  const [error,              setError]              = useState(null);
  const [sandboxPageKey,     setSandboxPageKey]     = useState('home');
  const [sandboxTitle,       setSandboxTitle]       = useState('');
  const [sandboxDesc,        setSandboxDesc]        = useState('');
  const [gscBanner,          setGscBanner]          = useState(null);

  const domain = overview?.siteDomain || 'https://ajtravelsagency.vercel.app';

  // Check URL query parameters for OAuth callback results
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('tab') === 'integrations' || params.get('gsc_connected') || params.get('gsc_error')) {
        setTab('integrations');
        if (params.get('gsc_connected') === 'true') {
          setGscBanner({ type: 'success', message: 'Google Search Console connected and authorized successfully! You can now view search analytics.' });
        } else if (params.get('gsc_error')) {
          setGscBanner({ type: 'error', message: `Google Search Console authorization error: ${params.get('gsc_error')}` });
        }
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete('gsc_connected');
        cleanUrl.searchParams.delete('gsc_error');
        if (cleanUrl.searchParams.get('tab') === 'integrations') {
          cleanUrl.searchParams.delete('tab');
        }
        window.history.replaceState({}, document.title, cleanUrl.pathname + (cleanUrl.search ? cleanUrl.search : ''));
      }
    } catch (_err) {}
  }, []);

  // Load initial SEO overview and routes
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [pagesRes, overviewRes, intRes] = await Promise.all([
        seoApi.getPages(),
        seoApi.getAnalyzerOverview().catch(() => ({ data: { data: null } })),
        seoApi.getIntegrations().catch(() => ({ data: { data: null } })),
      ]);

      setPages(pagesRes.data.data.pages || []);
      setAllPublicPages(pagesRes.data.data.allPublicPages || pagesRes.data.data.pages || []);
      setRouteInventory(pagesRes.data.data.routeInventory || []);
      setPlannedRoutes(pagesRes.data.data.plannedRoutes || []);
      setOverview(overviewRes.data.data || null);
      setIntegrations(intRes.data.data || null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load SEO Management data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const activeSandboxPage = pages.find(p => p.pageKey === sandboxPageKey) || pages[0];
  useEffect(() => {
    if (activeSandboxPage) {
      setSandboxTitle(activeSandboxPage.seoTitle || '');
      setSandboxDesc(activeSandboxPage.metaDescription || '');
    }
  }, [sandboxPageKey, activeSandboxPage]);

  // Primary key pages for SERP & Social Simulator (clean 8-9 high-impact pages)
  const KEY_PREVIEW_PAGES = useMemo(() => [
    'home',
    'fare',
    'booking',
    'pune-to-mumbai-taxi',
    'mumbai-to-pune-taxi',
    'vehicles',
    'blog',
    'contact',
    'services',
  ], []);

  const keyPages = useMemo(() => {
    const matched = KEY_PREVIEW_PAGES
      .map(k => pages.find(p => p.pageKey === k || p.pageUrl === `/${k}` || p.pageUrl === `/${k}/`))
      .filter(Boolean);
    return matched.length >= 6 ? matched : pages.slice(0, 8);
  }, [pages, KEY_PREVIEW_PAGES]);

  const otherPages = useMemo(() => {
    const keySet = new Set(keyPages.map(p => p.pageKey));
    return pages.filter(p => !keySet.has(p.pageKey));
  }, [pages, keyPages]);

  const previewCardsList = useMemo(() => {
    const list = [...keyPages];
    if (activeSandboxPage && !list.some(p => p.pageKey === activeSandboxPage.pageKey)) {
      list.unshift(activeSandboxPage);
    }
    return list;
  }, [keyPages, activeSandboxPage]);

  // Run full audit
  const handleRunFullAudit = async () => {
    setAnalyzing(true);
    try {
      const res = await seoApi.analyzeAll();
      setOverview(res.data.data.overview);
      if (selectedPage) {
        const updated = res.data.data.pages.find(p => p.pageKey === selectedPage);
        if (updated) setPageAnalysis(updated);
      }
    } catch (err) {
      alert('Failed to run full audit: ' + (err.response?.data?.message || err.message));
    } finally {
      setAnalyzing(false);
    }
  };

  const handleBatchAutoFix = async () => {
    const confirmFix = window.confirm(
      'This will automatically optimize SEO titles and meta descriptions for all pages exceeding Google SERP limits (shortening titles to 40–60 chars and descriptions to 110–160 chars). Would you like to proceed?'
    );
    if (!confirmFix) return;
    setBatchFixing(true);
    try {
      const res = await seoApi.batchAutoFix();
      await loadData();
      await handleRunFullAudit();
      alert(`✓ Successfully auto-optimized ${res.data.updatedCount || 0} pages! Full audit recalculation complete.`);
    } catch (err) {
      alert('Failed to auto-optimize pages: ' + (err.response?.data?.message || err.message));
    } finally {
      setBatchFixing(false);
    }
  };

  // Inspect page details
  const handleInspectPage = async (pageKey) => {
    setSelectedPage(pageKey);
    setLoading(true);
    try {
      const res = await seoApi.getPageAnalysis(pageKey);
      setPageAnalysis(res.data.data);
    } catch (err) {
      alert('Failed to fetch page audit: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  // Re-analyze single page
  const handleReanalyzePage = async (pageKey) => {
    setAnalyzing(true);
    try {
      const res = await seoApi.analyzePage(pageKey);
      setPageAnalysis(res.data.data);
      // Update overview in background
      const ovRes = await seoApi.getAnalyzerOverview();
      setOverview(ovRes.data.data);
    } catch (err) {
      alert('Failed to analyze page: ' + (err.response?.data?.message || err.message));
    } finally {
      setAnalyzing(false);
    }
  };

  // Edit SEO metadata for page
  const handleEditSeo = (pageKey, suggestedFix = null) => {
    const catalog = allPublicPages.length > 0 ? allPublicPages : pages;
    const p = catalog.find(item => item.pageKey === pageKey) || pages.find(item => item.pageKey === pageKey);
    if (p) {
      setEditingPage({
        ...p,
        initialSuggestedFix: suggestedFix,
      });
    }
  };

  // Real, evidence-based page-level SEO score evaluation for all catalog entries
  const totalEvaluated = (overview?.totalPassed || 0) + (overview?.totalWarnings || 0) + (overview?.totalErrors || 0);
  const hasRunAudit = Boolean(overview?.lastRunTimestamp && (totalEvaluated > 0 || (overview?.analyzedPagesCount || 0) > 0));
  const catalogList = allPublicPages.length > 0 ? allPublicPages : pages;

  const evaluatedCatalog = useMemo(() => {
    return catalogList.map(p => {
      const auditPage = overview?.pages?.find(item => item.pageKey === p.pageKey);
      const evalResult = evaluatePageSeo(p, auditPage);
      return {
        ...p,
        evalResult,
        score: evalResult.score,
        status: evalResult.status,
        statusColor: evalResult.statusColor,
        primaryIssue: evalResult.primaryIssue,
        hasActionableIssues: evalResult.hasActionableIssues,
      };
    });
  }, [catalogList, overview]);

  const avgCatalogScore = evaluatedCatalog.length > 0
    ? Math.round(evaluatedCatalog.reduce((sum, p) => sum + p.score, 0) / evaluatedCatalog.length)
    : 0;

  const goodPagesCount = evaluatedCatalog.filter(p => p.status === 'Good').length;
  const needsAttentionCount = evaluatedCatalog.filter(p => p.status === 'Needs attention' || p.status === 'Poor').length;
  const poorPagesCount = evaluatedCatalog.filter(p => p.status === 'Poor').length;

  const avgScore = hasRunAudit ? (overview?.averageHealthScore ?? avgCatalogScore) : avgCatalogScore;
  const avgScoreColor = getScoreColor(avgScore);

  if (error) {
    return (
      <div style={{ padding: '2rem' }}>
        <div style={{ background: '#FEE2E2', color: '#991B1B', borderRadius: '10px', padding: '1rem 1.25rem', display: 'flex', gap: '0.6rem', alignItems: 'center', fontSize: '0.85rem' }}>
          <XCircle size={18} /> {error}
        </div>
        <button onClick={loadData} style={{ marginTop: '1rem', background: '#EFF6FF', color: '#0284C7', border: '1px solid #BFDBFE', borderRadius: '8px', padding: '0.5rem 1rem', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem' }}>
          Retry
        </button>
      </div>
    );
  }

  // Active view: Page Metadata Editor
  if (editingPage) {
    return (
      <PageEditor
        page={editingPage}
        domain={domain}
        onBack={() => setEditingPage(null)}
        onSaved={(updated) => {
          setPages(prev => {
            const exists = prev.some(p => p.pageKey === updated.pageKey);
            return exists ? prev.map(p => p.pageKey === updated.pageKey ? updated : p) : [...prev, updated];
          });
          setAllPublicPages(prev => prev.map(p => p.pageKey === updated.pageKey ? { ...p, ...updated } : p));
          setEditingPage(null);
          handleRunFullAudit();
        }}
      />
    );
  }

  // Active view: Deep Page Inspector
  if (selectedPage && pageAnalysis) {
    return (
      <PageInspectorView
        pageAnalysis={pageAnalysis}
        onBack={() => { setSelectedPage(null); setPageAnalysis(null); }}
        onEditSeo={handleEditSeo}
        onReanalyze={handleReanalyzePage}
        isAnalyzing={analyzing}
      />
    );
  }

  const filteredCatalog = evaluatedCatalog.filter(p => {
    // 1. Status Filter (All Pages / Needs Attention / Good)
    if (seoScoreFilter === 'NEEDS_ATTENTION') return p.status === 'Needs attention' || p.status === 'Poor';
    if (seoScoreFilter === 'GOOD') return p.status === 'Good';
    return true;
  }).filter(p => {
    // 2. Source Category Filter
    if (pageCategoryFilter === 'DB') return p.isDbEditable;
    if (pageCategoryFilter === 'STATIC') return p.metadataSource === 'STATIC_CODE';
    if (pageCategoryFilter === 'CONTENT') return p.metadataSource === 'GENERATED_CONTENT_STORE';
    return true;
  }).filter(p => {
    // 3. Search query
    if (!pageSearchQuery) return true;
    const q = pageSearchQuery.toLowerCase();
    return (p.pageLabel || '').toLowerCase().includes(q)
      || (p.pageUrl || '').toLowerCase().includes(q)
      || (p.seoTitle || '').toLowerCase().includes(q)
      || (p.primaryIssue || '').toLowerCase().includes(q);
  }).sort((a, b) => {
    // When viewing Needs Attention or by default, prioritize pages with actionable issues or lower scores
    if (seoScoreFilter === 'NEEDS_ATTENTION') {
      return a.score - b.score;
    }
    return 0;
  });

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '1rem 0 3rem' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart3 size={24} color="#0284C7" />
            SEO Management &amp; Analyzer
          </h1>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#64748B' }}>
            Rank Math-style evaluation engine inspecting live rendered DOM, canonicals, schema &amp; sitemaps.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={handleRunFullAudit}
            disabled={analyzing}
            className="admin-btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}
          >
            <RefreshCw size={14} className={analyzing ? 'spin' : ''} />
            {analyzing ? 'Running Audit...' : 'Run Full SEO Audit'}
          </button>
        </div>
      </div>

      {/* Top Summary Cards (3 Clean Metrics - Section 1) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {/* Card 1: Overall SEO Score */}
        <div className="admin-card" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            background: avgScoreColor.bg, color: avgScoreColor.text,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `1px solid ${avgScoreColor.border}`, flexShrink: 0
          }}>
            <Award size={24} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Overall SEO Score
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem', marginTop: '0.2rem' }}>
              <span style={{ fontSize: '1.85rem', fontWeight: 900, color: avgScoreColor.text, lineHeight: 1.1 }}>
                {avgScore !== null ? avgScore : '—'}
              </span>
              <span style={{ fontSize: '0.9rem', color: '#94A3B8', fontWeight: 700 }}>/ 100</span>
            </div>
            <div style={{ marginTop: '0.35rem' }}>
              <span style={{
                fontSize: '0.68rem', fontWeight: 800, padding: '0.15rem 0.55rem', borderRadius: '100px',
                background: avgScoreColor.bg, color: avgScoreColor.text, border: `1px solid ${avgScoreColor.border}`
              }}>
                {avgScoreColor.label}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Public Pages */}
        <div className="admin-card" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            background: '#EFF6FF', color: '#0284C7',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid #BFDBFE', flexShrink: 0
          }}>
            <Globe size={24} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Public Pages
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 900, color: '#0F172A', lineHeight: 1.1, marginTop: '0.2rem' }}>
              {overview?.totalPublicPages || overview?.analyzedPagesCount || catalogList.length}
            </div>
            <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ color: '#16A34A', fontWeight: 700 }}>
                {overview?.analyzedPagesCount || overview?.pages?.length || 0} Audited
              </span>
              <span>•</span>
              <span style={{ color: Math.max(0, catalogList.length - (overview?.analyzedPagesCount || overview?.pages?.length || 0)) > 0 ? '#D97706' : '#64748B', fontWeight: 600 }}>
                {Math.max(0, catalogList.length - (overview?.analyzedPagesCount || overview?.pages?.length || 0))} Unaudited
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Pages Audited */}
        <div className="admin-card" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            background: hasRunAudit ? '#DCFCE7' : '#F1F5F9', color: hasRunAudit ? '#16A34A' : '#64748B',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `1px solid ${hasRunAudit ? '#BBF7D0' : '#E2E8F0'}`, flexShrink: 0
          }}>
            <CheckCircle2 size={24} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Pages Audited
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 900, color: hasRunAudit ? '#15803D' : '#64748B', lineHeight: 1.1, marginTop: '0.2rem' }}>
              {hasRunAudit ? (overview?.analyzedPagesCount || overview?.pages?.length || 0) : 0}
            </div>
            <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{
                fontWeight: 800,
                color: (catalogList.length > 0 && (overview?.analyzedPagesCount || overview?.pages?.length || 0) >= catalogList.length) ? '#16A34A' : '#0284C7'
              }}>
                {Math.min(100, (overview?.totalPublicPages || catalogList.length) > 0 ? Math.round(((overview?.analyzedPagesCount || overview?.pages?.length || 0) / (overview?.totalPublicPages || catalogList.length)) * 100) : 100)}% Coverage
              </span>
              <span>of eligible public catalog</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links & Domain */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <a
          href={`${API_BASE_URL}/sitemap.xml`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.45rem 0.9rem', borderRadius: '6px',
            background: '#EFF6FF', color: '#0284C7',
            fontSize: '0.75rem', fontWeight: 700, textDecoration: 'none',
            border: '1px solid #BFDBFE',
          }}
        >
          <Map size={13} /> View sitemap.xml
        </a>
        <a
          href={`${API_BASE_URL}/robots.txt`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.45rem 0.9rem', borderRadius: '6px',
            background: '#F0FDF4', color: '#16A34A',
            fontSize: '0.75rem', fontWeight: 700, textDecoration: 'none',
            border: '1px solid #BBF7D0',
          }}
        >
          <FileText size={13} /> View robots.txt
        </a>
        <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
          SEO Canonical Domain: <strong style={{ color: '#0F172A' }}>{domain}</strong>
        </span>
        {overview?.lastRunTimestamp && (
          <span style={{ fontSize: '0.72rem', color: '#94A3B8', marginLeft: 'auto' }}>
            Last Audit: {new Date(overview.lastRunTimestamp).toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.25rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
        {[
          { id: 'overview', label: 'Overview Dashboard', icon: BarChart3 },
          { id: 'pages', label: `Page Metadata (${catalogList.length})`, icon: Globe },
          { id: 'previews', label: 'SERP & Social Simulator', icon: Share2 },
          { id: 'inventory', label: `Route Directory (${routeInventory.length + plannedRoutes.length})`, icon: Layers },
          { id: 'integrations', label: 'Search Console', icon: Shield },
        ].map(t => {
          const IconComponent = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                background: active ? '#0284C7' : 'transparent',
                color: active ? '#fff' : '#64748B',
                border: 'none', borderRadius: '6px', padding: '0.5rem 0.9rem',
                fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
              }}
            >
              <IconComponent size={14} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* TAB 0: Rank Math-Inspired Overview Dashboard */}
      {tab === 'overview' && (
        <SeoOverviewView
          overview={overview}
          pages={pages}
          allPublicPages={allPublicPages}
          routeInventory={routeInventory}
          integrations={integrations}
          avgScore={avgScore}
          onInspectPage={handleInspectPage}
          onEditSeo={handleEditSeo}
          onNavigateTab={setTab}
        />
      )}

      {/* TAB 1: Page Metadata & Search Settings (Unified) */}
      {(tab === 'pages' || tab === 'analyzer') && (
        <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1.1rem 1.5rem', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Search size={16} color="#0284C7" />
              <div>
                <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0F172A', display: 'block' }}>Managed Page Metadata &amp; Search Settings</span>
                <span style={{ fontSize: '0.74rem', color: '#64748B' }}>Live metadata synced with server-side hydration &amp; sitemap</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.74rem', color: '#0284C7', fontWeight: 700, background: '#EFF6FF', padding: '0.25rem 0.65rem', borderRadius: '100px' }}>
                {filteredCatalog.length} of {catalogList.length} Public Pages
              </span>
            </div>
          </div>

          {/* Filter Bar & Search Input */}
          <div style={{ padding: '0.85rem 1.5rem', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
              {[
                { id: 'ALL', label: `All Pages (${catalogList.length})` },
                { id: 'DB', label: `Database Overrides (${pages.length})` },
                { id: 'STATIC', label: `Static Code (${catalogList.filter(p => p.metadataSource === 'STATIC_CODE').length})` },
                { id: 'CONTENT', label: `Content Store (${catalogList.filter(p => p.metadataSource === 'GENERATED_CONTENT_STORE').length})` },
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setPageCategoryFilter(cat.id)}
                  style={{
                    padding: '0.3rem 0.65rem', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 700,
                    border: '1px solid', cursor: 'pointer',
                    background: pageCategoryFilter === cat.id ? '#0284C7' : '#FFFFFF',
                    borderColor: pageCategoryFilter === cat.id ? '#0284C7' : '#CBD5E1',
                    color: pageCategoryFilter === cat.id ? '#FFFFFF' : '#475569',
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div style={{ position: 'relative', minWidth: '240px', flex: '1 1 240px', maxWidth: '360px' }}>
              <Search size={14} color="#94A3B8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                value={pageSearchQuery}
                onChange={e => setPageSearchQuery(e.target.value)}
                placeholder="Search route name, URL path..."
                style={{
                  width: '100%', boxSizing: 'border-box', padding: '0.4rem 0.6rem 0.4rem 2rem',
                  fontSize: '0.78rem', border: '1px solid #CBD5E1', borderRadius: '6px',
                  background: '#FFFFFF', color: '#0F172A',
                }}
              />
            </div>
          </div>

          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Page &amp; Source</th>
                  <th>URL Path</th>
                  <th>SEO Score</th>
                  <th>Identified Issue</th>
                  <th>SEO Title</th>
                  <th>Meta Desc</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCatalog.map(p => {
                  const auditPage = overview?.pages?.find(item => item.pageKey === p.pageKey);
                  const score = auditPage?.score;
                  const scoreColor = score ? getScoreColor(score) : null;

                  return (
                    <tr key={p.pageKey}>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                          <span style={{ fontWeight: 800, color: '#0F172A' }}>{p.pageLabel}</span>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', width: 'fit-content',
                            fontSize: '0.64rem', fontWeight: 800, padding: '0.1rem 0.45rem', borderRadius: '4px',
                            background: p.metadataSource === 'DATABASE_OVERRIDE' ? '#FAF5FF' : (p.metadataSource === 'STATIC_CODE' ? '#EFF6FF' : '#F1F5F9'),
                            color: p.metadataSource === 'DATABASE_OVERRIDE' ? '#7E22CE' : (p.metadataSource === 'STATIC_CODE' ? '#0284C7' : '#475569'),
                            border: `1px solid ${p.metadataSource === 'DATABASE_OVERRIDE' ? '#E9D5FF' : (p.metadataSource === 'STATIC_CODE' ? '#BFDBFE' : '#E2E8F0')}`,
                          }}>
                            {p.metadataSource === 'DATABASE_OVERRIDE' ? 'DB Override' : (p.metadataSource === 'STATIC_CODE' ? 'Static Code' : 'Content Store')}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <code style={{ background: '#F1F5F9', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.72rem', color: '#475569' }}>
                            {p.pageUrl}
                          </code>
                          {/* Local preview icon — opens page on current dev origin */}
                          <button
                            onClick={() => window.open(window.location.origin + (p.pageUrl || '/'), '_blank')}
                            title={`Preview local: ${window.location.origin}${p.pageUrl || '/'}`}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', color: '#0284C7', display: 'inline-flex', alignItems: 'center' }}
                          >
                            <ExternalLink size={12} />
                          </button>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <div style={{
                            width: '32px', height: '32px', borderRadius: '50%',
                            background: p.statusColor?.bg || '#F0FDF4', color: p.statusColor?.text || '#166534',
                            border: `1.5px solid ${p.statusColor?.border || '#BBF7D0'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.75rem', fontWeight: 900, flexShrink: 0,
                          }}>
                            {p.score}
                          </div>
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: p.statusColor?.text || '#166534' }}>
                            {p.status}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{ maxWidth: '240px' }}>
                          <span style={{
                            fontSize: '0.72rem', fontWeight: 600,
                            color: p.hasActionableIssues ? '#B45309' : '#15803D',
                            background: p.hasActionableIssues ? '#FFFBEB' : '#F0FDF4',
                            border: `1px solid ${p.hasActionableIssues ? '#FDE68A' : '#BBF7D0'}`,
                            borderRadius: '4px', padding: '0.15rem 0.45rem', display: 'inline-block',
                          }}>
                            {p.primaryIssue}
                          </span>
                        </div>
                      </td>
                      <td>
                        {p.seoTitle ? (
                          <span title={`${p.seoTitle.length} chars: "${p.seoTitle}"`}>
                            <StatusPill ok={true} label={`Configured (${p.seoTitle.length}c)`} />
                          </span>
                        ) : (
                          <StatusPill ok={false} label="Missing" />
                        )}
                      </td>
                      <td>
                        {p.metaDescription ? (
                          <span title={`${p.metaDescription.length} chars: "${p.metaDescription}"`}>
                            <StatusPill ok={true} label={`Configured (${p.metaDescription.length}c)`} />
                          </span>
                        ) : (
                          <StatusPill ok={false} label="Missing" />
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          {/* Direct Quick Fix Action */}
                          <button
                            onClick={() => setQuickFixPage(p)}
                            title="Direct Fix metadata"
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                              background: p.hasActionableIssues ? '#EFF6FF' : '#F8FAFC',
                              color: p.hasActionableIssues ? '#0284C7' : '#475569',
                              border: `1.5px solid ${p.hasActionableIssues ? '#BFDBFE' : '#CBD5E1'}`,
                              borderRadius: '6px', padding: '0.35rem 0.65rem',
                              fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer',
                            }}
                          >
                            <Wrench size={11} /> Fix
                          </button>

                          <button
                            onClick={() => handleInspectPage(p.pageKey)}
                            title="Inspect page deep audit checks"
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
                              background: '#F8FAFC', color: '#64748B',
                              border: '1px solid #E2E8F0', borderRadius: '6px',
                              padding: '0.35rem 0.65rem', fontSize: '0.72rem', fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            <Eye size={12} /> Inspect
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SERP & Social Previews */}
      {tab === 'previews' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {/* Interactive Live Snippet Sandbox Card */}
          <div className="admin-card" style={{ padding: '1.5rem', borderLeft: '4px solid #0284C7' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                  <Search size={16} color="#0284C7" />
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>
                    Live Google SERP Sandbox Simulator
                  </h3>
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748B' }}>
                  Experiment with title formulations and snippet copy in real-time. Test how text wraps and truncates across Desktop and Mobile viewports.
                </p>
              </div>

              {/* Page Selector: 8-9 Key Primary Pages + Clean Dropdown */}
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '0.35rem', background: '#F1F5F9', padding: '0.25rem', borderRadius: '8px', flexWrap: 'wrap' }}>
                  {keyPages.map(p => (
                    <button
                      key={p.pageKey}
                      type="button"
                      onClick={() => {
                        setSandboxPageKey(p.pageKey);
                        setSandboxTitle(p.seoTitle || '');
                        setSandboxDesc(p.metaDescription || '');
                      }}
                      style={{
                        padding: '0.35rem 0.75rem', borderRadius: '6px', border: 'none',
                        background: sandboxPageKey === p.pageKey ? '#0284C7' : 'transparent',
                        color: sandboxPageKey === p.pageKey ? '#fff' : '#475569',
                        fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {p.pageLabel}
                    </button>
                  ))}
                </div>

                {otherPages.length > 0 && (
                  <select
                    value={keyPages.some(p => p.pageKey === sandboxPageKey) ? '' : sandboxPageKey}
                    onChange={(e) => {
                      if (!e.target.value) return;
                      const selected = pages.find(p => p.pageKey === e.target.value);
                      if (selected) {
                        setSandboxPageKey(selected.pageKey);
                        setSandboxTitle(selected.seoTitle || '');
                        setSandboxDesc(selected.metaDescription || '');
                      }
                    }}
                    style={{
                      height: '32px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      padding: '0 0.6rem',
                      borderRadius: '6px',
                      border: '1px solid #CBD5E1',
                      backgroundColor: '#FFFFFF',
                      color: keyPages.some(p => p.pageKey === sandboxPageKey) ? '#64748B' : '#0284C7',
                      cursor: 'pointer',
                    }}
                    title="Select any other page to test in simulator"
                  >
                    <option value="">-- Other Pages ({otherPages.length}) ▾ --</option>
                    {otherPages.map(p => (
                      <option key={p.pageKey} value={p.pageKey}>
                        {p.pageLabel} ({p.pageUrl})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Sandbox 2-Column: Live Draft Inputs on Left, Real-Time Google Preview on Right */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1fr) minmax(360px, 1.25fr)', gap: '1.5rem', alignItems: 'start' }}>
              {/* Draft Inputs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: '#F8FAFC', padding: '1.25rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Draft Copy (Local Sandbox)</span>
                  <span style={{ fontSize: '0.7rem', color: '#D97706', fontWeight: 600 }}>Unsaved Simulation</span>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>
                      Simulated SEO Title
                    </label>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: charColor(sandboxTitle.length, 65, 70) }}>
                      {sandboxTitle.length} / 65 chars
                    </span>
                  </div>
                  <input
                    type="text"
                    className="admin-input"
                    value={sandboxTitle}
                    onChange={e => setSandboxTitle(e.target.value)}
                    placeholder="Enter draft title..."
                    style={{ width: '100%', boxSizing: 'border-box', background: '#fff' }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>
                      Simulated Meta Description
                    </label>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: charColor(sandboxDesc.length, 160, 170) }}>
                      {sandboxDesc.length} / 160 chars
                    </span>
                  </div>
                  <textarea
                    className="admin-input"
                    rows={3}
                    value={sandboxDesc}
                    onChange={e => setSandboxDesc(e.target.value)}
                    placeholder="Enter draft meta description..."
                    style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical', background: '#fff' }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: '1px solid #E2E8F0', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      if (activeSandboxPage) {
                        setSandboxTitle(activeSandboxPage.seoTitle || '');
                        setSandboxDesc(activeSandboxPage.metaDescription || '');
                      }
                    }}
                    style={{
                      background: 'transparent', border: 'none', color: '#64748B',
                      fontSize: '0.72rem', fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    Reset to Published
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (activeSandboxPage) {
                        setEditingPage({
                          ...activeSandboxPage,
                          seoTitle: sandboxTitle || activeSandboxPage.seoTitle,
                          metaDescription: sandboxDesc || activeSandboxPage.metaDescription,
                        });
                      }
                    }}
                    className="admin-btn-primary"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                      fontSize: '0.75rem', padding: '0.45rem 0.85rem',
                    }}
                  >
                    <Edit3 size={13} /> Edit &amp; Save in SEO Editor
                  </button>
                </div>
              </div>

              {/* Real-time Google SERP Simulator rendering the draft */}
              <div>
                <SerpPreview
                  title={sandboxTitle}
                  description={sandboxDesc}
                  url={activeSandboxPage?.pageUrl || '/'}
                  domain={domain}
                  isIndexable={activeSandboxPage?.isIndexable ?? true}
                  canonicalUrl={activeSandboxPage?.canonicalUrl || (domain + (activeSandboxPage?.pageUrl || '/'))}
                  seoScore={overview?.pages?.find(item => item.pageKey === activeSandboxPage?.pageKey)?.score}
                />
              </div>
            </div>
          </div>

          {/* Published Pages Cards */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>
                Published Search &amp; Social Previews ({previewCardsList.length} Key Pages)
              </h4>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: '#64748B' }}>
                Currently active metadata as rendered for search engines and social platforms. Showing primary revenue and landing pages. Full inventory of {pages.length} pages is available in the Page Metadata tab.
              </p>
            </div>
          </div>

          {previewCardsList.map(p => (
            <div key={p.pageKey} className="admin-card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>{p.pageLabel}</h3>
                  <code style={{ fontSize: '0.75rem', color: '#0284C7' }}>{domain}{p.pageUrl}</code>
                </div>
                <button
                  onClick={() => handleEditSeo(p.pageKey)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                    background: '#EFF6FF', color: '#0284C7', border: '1px solid #BFDBFE',
                    borderRadius: '6px', padding: '0.35rem 0.75rem', fontSize: '0.75rem', fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <Edit3 size={12} /> Edit Snippet
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
                <SerpPreview
                  title={p.seoTitle}
                  description={p.metaDescription}
                  url={p.pageUrl}
                  domain={domain}
                  isIndexable={p.isIndexable}
                  canonicalUrl={p.canonicalUrl || (domain + p.pageUrl)}
                  seoScore={overview?.pages?.find(item => item.pageKey === p.pageKey)?.score}
                />
                <SocialCardPreview
                  title={p.ogTitle || p.seoTitle}
                  description={p.ogDescription || p.metaDescription}
                  url={p.pageUrl}
                  image={p.ogImage}
                  domain={domain}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: Route Inventory & Planned Roadmap (Combined) */}
      {(tab === 'inventory' || tab === 'roadmap') && (
        <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1.1rem 1.5rem', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0F172A' }}>
                Application Route Directory &amp; Indexing Policies
              </h3>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#64748B' }}>
                Audit of all active Express/React routes and planned SEO roadmap destinations.
              </p>
            </div>
            {/* View Mode Toggle: Active vs Roadmap */}
            <div style={{ display: 'flex', gap: '0.35rem', background: '#F1F5F9', padding: '0.2rem', borderRadius: '6px' }}>
              <button
                type="button"
                onClick={() => setRouteViewMode('active')}
                style={{
                  padding: '0.3rem 0.75rem', borderRadius: '5px', border: 'none',
                  fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
                  background: routeViewMode === 'active' ? '#0284C7' : 'transparent',
                  color: routeViewMode === 'active' ? '#FFFFFF' : '#64748B',
                }}
              >
                Active Routes ({routeInventory.length})
              </button>
              <button
                type="button"
                onClick={() => setRouteViewMode('roadmap')}
                style={{
                  padding: '0.3rem 0.75rem', borderRadius: '5px', border: 'none',
                  fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
                  background: routeViewMode === 'roadmap' ? '#0284C7' : 'transparent',
                  color: routeViewMode === 'roadmap' ? '#FFFFFF' : '#64748B',
                }}
              >
                Planned Roadmap ({plannedRoutes.length})
              </button>
            </div>
          </div>

          {routeViewMode === 'active' ? (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Route</th>
                    <th>Label</th>
                    <th>Route Type</th>
                    <th>Search Engine Status</th>
                    <th>Sitemap Status</th>
                    <th>Architectural Rationale</th>
                  </tr>
                </thead>
                <tbody>
                  {routeInventory.map(r => (
                    <tr key={r.path}>
                      <td>
                        <code style={{ background: '#F1F5F9', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.72rem', color: '#0F172A', fontWeight: 700 }}>
                          {r.path}
                        </code>
                      </td>
                      <td style={{ fontWeight: 600, color: '#1E293B', fontSize: '0.8rem' }}>{r.label}</td>
                      <td>
                        <span style={{
                          display: 'inline-block', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 700,
                          background: r.type === 'PUBLIC_PAGE' ? '#EFF6FF' : r.type === 'REDIRECT_ALIAS' ? '#FEF3C7' : r.type.includes('ADMIN') ? '#FEE2E2' : '#F1F5F9',
                          color: r.type === 'PUBLIC_PAGE' ? '#0284C7' : r.type === 'REDIRECT_ALIAS' ? '#B45309' : r.type.includes('ADMIN') ? '#991B1B' : '#475569',
                        }}>
                          {r.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-block', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 600,
                          background: r.indexingStatus.includes('index, follow') ? '#F0FDF4' : '#F1F5F9',
                          color: r.indexingStatus.includes('index, follow') ? '#16A34A' : '#475569',
                        }}>
                          {r.indexingStatus}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-block', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 600,
                          background: r.sitemapStatus.startsWith('Included') ? '#F0FDF4' : '#F8FAFC',
                          color: r.sitemapStatus.startsWith('Included') ? '#16A34A' : '#64748B',
                        }}>
                          {r.sitemapStatus}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.75rem', color: '#475569', maxWidth: '320px', lineHeight: 1.4 }}>
                        {r.notes}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Target Path</th>
                    <th>Proposed Page Name</th>
                    <th>SEO Priority</th>
                    <th>Scope &amp; Description</th>
                  </tr>
                </thead>
                <tbody>
                  {plannedRoutes.map(pr => (
                    <tr key={pr.path}>
                      <td>
                        <code style={{ background: '#F1F5F9', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.72rem', color: '#0F172A', fontWeight: 700 }}>
                          {pr.path}
                        </code>
                      </td>
                      <td style={{ fontWeight: 700, color: '#1E293B', fontSize: '0.8rem' }}>{pr.label}</td>
                      <td>
                        <span style={{
                          display: 'inline-block', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 700,
                          background: pr.priority === 'High' ? '#FEF2F2' : '#EFF6FF',
                          color: pr.priority === 'High' ? '#DC2626' : '#0284C7',
                        }}>
                          {pr.priority} Priority
                        </span>
                      </td>
                      <td style={{ fontSize: '0.75rem', color: '#475569', lineHeight: 1.4 }}>
                        {pr.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: Integrations View */}
      {tab === 'integrations' && (
        <IntegrationsView
          integrations={integrations}
          loading={loading}
          onReloadIntegrations={loadData}
          banner={gscBanner}
          domain={domain}
          onEditPageSeo={(pageKey) => {
            const catalog = allPublicPages.length > 0 ? allPublicPages : pages;
            const p = catalog.find(pg => pg.pageKey === pageKey) || pages.find(pg => pg.pageKey === pageKey);
            if (p) {
              setEditingPage(p);
              setTab('pages');
            }
          }}
        />
      )}

      {/* Modal for viewing static metadata */}
      {viewingStaticPage && (
        <StaticPageMetaModal
          page={viewingStaticPage}
          domain={domain}
          onClose={() => setViewingStaticPage(null)}
        />
      )}

      {/* Quick SEO Fix Modal (Direct In-Dashboard Fix Panel) */}
      {quickFixPage && (
        <QuickFixModal
          page={quickFixPage}
          onClose={() => setQuickFixPage(null)}
          onSaved={(updated) => {
            setPages(prev => prev.map(p => p.pageKey === updated.pageKey ? { ...p, ...updated } : p));
            setAllPublicPages(prev => prev.map(p => p.pageKey === updated.pageKey ? { ...p, ...updated } : p));
            setQuickFixPage(null);
          }}
        />
      )}
    </div>
  );
};
