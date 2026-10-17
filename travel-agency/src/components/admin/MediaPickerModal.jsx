import React, { useState, useEffect } from 'react';
import {
  X,
  Upload,
  Search,
  Check,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { mediaApi, API_BASE_URL } from '../../services/api';
import './admin.css';

const CATEGORIES = [
  { id: 'all', label: 'All Media' },
  { id: 'vehicles', label: 'Vehicles' },
  { id: 'blogs', label: 'Blogs' },
  { id: 'destinations', label: 'Destinations' },
  { id: 'services', label: 'Services' },
  { id: 'general', label: 'General' },
];

export const MediaPickerModal = ({
  isOpen,
  onClose,
  onSelect,
  initialCategory = 'all',
  currentValue = '',
  title = 'Select Media Asset',
}) => {
  const [activeTab, setActiveTab] = useState('browse'); // 'browse' | 'upload'
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [category, setCategory] = useState(initialCategory);
  const [search, setSearch] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Upload Form State
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadCategory, setUploadCategory] = useState(initialCategory !== 'all' ? initialCategory : 'general');
  const [uploadAltText, setUploadAltText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadPreview, setUploadPreview] = useState(null);

  // Fetch media assets
  const fetchAssets = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const params = {
        limit: 48,
        sortBy: 'createdAt',
        order: 'desc',
      };
      if (category && category !== 'all') {
        params.category = category;
      }
      if (search.trim()) {
        params.search = search.trim();
      }

      const res = await mediaApi.getAll(params);
      const list = res.data?.data || [];
      setAssets(list);

      // If currentValue exists, pre-select matching asset
      if (currentValue && !selectedAsset) {
        const match = list.find((a) => a.url === currentValue);
        if (match) setSelectedAsset(match);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to load media assets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAssets();
    } else {
      setSelectedAsset(null);
      setActiveTab('browse');
      setUploadFile(null);
      setUploadPreview(null);
    }
  }, [isOpen, category]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAssets();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg('Selected file exceeds maximum allowed size of 5MB.');
        return;
      }
      setUploadFile(file);
      setUploadPreview(URL.createObjectURL(file));
      setErrorMsg('');
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      setErrorMsg('Please select an image file to upload.');
      return;
    }

    setUploading(true);
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('category', uploadCategory);
      formData.append('altText', uploadAltText);

      const res = await mediaApi.upload(formData);
      const newAsset = res.data?.data;

      if (newAsset) {
        // Auto select newly uploaded asset
        setSelectedAsset(newAsset);
        setUploadFile(null);
        setUploadPreview(null);
        setUploadAltText('');
        setActiveTab('browse');
        // Refresh list
        await fetchAssets();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to upload image.');
    } finally {
      setUploading(false);
    }
  };

  const handleConfirm = () => {
    if (selectedAsset && onSelect) {
      onSelect(selectedAsset);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '920px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#F8FAFC',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>
              {title}
            </h3>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: '#64748B' }}>
              Select an image from the central library or upload a new authentic business asset
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#F1F5F9',
              border: 'none',
              borderRadius: '8px',
              padding: '0.45rem',
              cursor: 'pointer',
              color: '#475569',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Controls & Filter Bar */}
        <div
          style={{
            padding: '0.85rem 1.5rem',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            backgroundColor: '#FFFFFF',
          }}
        >
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0.4rem', backgroundColor: '#F1F5F9', padding: '0.25rem', borderRadius: '10px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('browse')}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: activeTab === 'browse' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'browse' ? '#0284C7' : '#64748B',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                boxShadow: activeTab === 'browse' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              Browse Library
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: activeTab === 'upload' ? '#FFFFFF' : 'transparent',
                color: activeTab === 'upload' ? '#0284C7' : '#64748B',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                boxShadow: activeTab === 'upload' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              <Upload size={13} />
              <span>Upload New</span>
            </button>
          </div>

          {/* Search & Category Filter (Browse Tab Only) */}
          {activeTab === 'browse' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, justifyContent: 'flex-end' }}>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  height: '34px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  padding: '0 0.6rem',
                  fontSize: '0.78rem',
                  color: '#334155',
                  backgroundColor: '#FFFFFF',
                }}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>

              <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Search assets..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    height: '34px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    padding: '0 2rem 0 0.75rem',
                    fontSize: '0.78rem',
                    width: '180px',
                  }}
                />
                <button
                  type="submit"
                  style={{
                    position: 'absolute',
                    right: '6px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94A3B8',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <Search size={14} />
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div
            style={{
              padding: '0.65rem 1.5rem',
              backgroundColor: '#FEF2F2',
              borderBottom: '1px solid #FEE2E2',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#B91C1C',
              fontSize: '0.78rem',
            }}
          >
            <AlertCircle size={15} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem', minHeight: '360px' }}>
          {/* TAB 1: BROWSE MEDIA */}
          {activeTab === 'browse' && (
            <>
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '280px', color: '#64748B' }}>
                  <Loader2 size={32} className="spin" style={{ marginBottom: '0.75rem', color: '#0284C7' }} />
                  <span style={{ fontSize: '0.85rem' }}>Loading media assets...</span>
                </div>
              ) : assets.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '280px', color: '#94A3B8', textAlign: 'center' }}>
                  <ImageIcon size={44} style={{ marginBottom: '0.75rem', opacity: 0.5 }} />
                  <p style={{ margin: 0, fontWeight: 700, color: '#475569' }}>No media assets found</p>
                  <p style={{ margin: '0.25rem 0 1rem', fontSize: '0.78rem' }}>
                    Upload authentic photos to get started or clear search filters.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('upload')}
                    className="admin-btn-primary"
                    style={{ fontSize: '0.78rem', height: '34px' }}
                  >
                    <Plus size={14} />
                    <span>Upload Image Now</span>
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(135px, 1fr))',
                    gap: '0.85rem',
                  }}
                >
                  {assets.map((asset) => {
                    const isSelected = selectedAsset?.id === asset.id || currentValue === asset.url;
                    const fullUrl = asset.url.startsWith('http')
                      ? asset.url
                      : `${asset.url.startsWith('/uploads') ? API_BASE_URL : ''}${asset.url}`;

                    return (
                      <div
                        key={asset.id}
                        onClick={() => setSelectedAsset(asset)}
                        style={{
                          borderRadius: '10px',
                          border: isSelected ? '2px solid #0284C7' : '1px solid #E2E8F0',
                          backgroundColor: isSelected ? '#F0F9FF' : '#FFFFFF',
                          overflow: 'hidden',
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'all 0.15s ease',
                          display: 'flex',
                          flexDirection: 'column',
                        }}
                      >
                        {/* Thumbnail */}
                        <div style={{ width: '100%', height: '95px', backgroundColor: '#F8FAFC', position: 'relative' }}>
                          <img
                            src={fullUrl}
                            alt={asset.altText || asset.originalName}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                              e.target.src = '/assets/sedan.webp';
                            }}
                          />
                          {isSelected && (
                            <div
                              style={{
                                position: 'absolute',
                                top: '6px',
                                right: '6px',
                                width: '22px',
                                height: '22px',
                                borderRadius: '50%',
                                backgroundColor: '#0284C7',
                                color: '#FFFFFF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                              }}
                            >
                              <Check size={13} strokeWidth={3} />
                            </div>
                          )}
                          <span
                            style={{
                              position: 'absolute',
                              bottom: '4px',
                              left: '4px',
                              backgroundColor: 'rgba(15, 23, 42, 0.75)',
                              color: '#FFFFFF',
                              fontSize: '0.62rem',
                              fontWeight: 700,
                              padding: '1px 5px',
                              borderRadius: '4px',
                              textTransform: 'uppercase',
                            }}
                          >
                            {asset.category}
                          </span>
                        </div>

                        {/* Caption */}
                        <div style={{ padding: '0.45rem', fontSize: '0.72rem' }}>
                          <div
                            style={{
                              fontWeight: 600,
                              color: isSelected ? '#0369A1' : '#1E293B',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                            title={asset.originalName}
                          >
                            {asset.originalName}
                          </div>
                          <div style={{ color: '#94A3B8', fontSize: '0.65rem' }}>
                            {(asset.fileSize / 1024).toFixed(0)} KB
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* TAB 2: UPLOAD NEW ASSET */}
          {activeTab === 'upload' && (
            <form onSubmit={handleUploadSubmit} style={{ maxWidth: '520px', margin: '0 auto' }}>
              <div
                style={{
                  border: '2px dashed #CBD5E1',
                  borderRadius: '12px',
                  padding: '2rem 1.5rem',
                  textAlign: 'center',
                  backgroundColor: '#F8FAFC',
                  marginBottom: '1rem',
                  position: 'relative',
                }}
              >
                {uploadPreview ? (
                  <div>
                    <img
                      src={uploadPreview}
                      alt="Preview"
                      style={{
                        maxHeight: '160px',
                        maxWidth: '100%',
                        borderRadius: '8px',
                        objectFit: 'contain',
                        marginBottom: '0.75rem',
                      }}
                    />
                    <div style={{ fontSize: '0.78rem', color: '#0F172A', fontWeight: 600 }}>
                      {uploadFile?.name} ({(uploadFile?.size / 1024).toFixed(0)} KB)
                    </div>
                  </div>
                ) : (
                  <div>
                    <Upload size={36} style={{ color: '#0284C7', marginBottom: '0.75rem' }} />
                    <p style={{ margin: 0, fontWeight: 700, color: '#0F172A', fontSize: '0.9rem' }}>
                      Click to choose image or drag & drop here
                    </p>
                    <p style={{ margin: '0.3rem 0 0', fontSize: '0.75rem', color: '#64748B' }}>
                      JPG, PNG, or WebP up to 5MB
                    </p>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileChange}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    opacity: 0,
                    cursor: 'pointer',
                    width: '100%',
                    height: '100%',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.3rem' }}>
                    Asset Category
                  </label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                    style={{
                      width: '100%',
                      height: '36px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      padding: '0 0.6rem',
                      fontSize: '0.8rem',
                      backgroundColor: '#FFFFFF',
                    }}
                  >
                    <option value="vehicles">Fleet Vehicles</option>
                    <option value="blogs">Blog Articles</option>
                    <option value="destinations">Destinations & Routes</option>
                    <option value="services">Services</option>
                    <option value="general">General / Homepage</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.3rem' }}>
                    Alt Text (SEO & Accessibility)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Pune to Mumbai Cab"
                    value={uploadAltText}
                    onChange={(e) => setUploadAltText(e.target.value)}
                    style={{
                      width: '100%',
                      height: '36px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      padding: '0 0.6rem',
                      fontSize: '0.8rem',
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={uploading || !uploadFile}
                className="admin-btn-primary"
                style={{ width: '100%', height: '40px', justifyContent: 'center' }}
              >
                {uploading ? (
                  <>
                    <Loader2 size={16} className="spin" />
                    <span>Uploading Asset...</span>
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    <span>Upload & Select</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#F8FAFC',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0, flex: 1 }}>
            {selectedAsset ? (
              <>
                <img
                  src={
                    selectedAsset.url.startsWith('http')
                      ? selectedAsset.url
                      : `${selectedAsset.url.startsWith('/uploads') ? API_BASE_URL : ''}${selectedAsset.url}`
                  }
                  alt={selectedAsset.originalName}
                  style={{ width: '38px', height: '38px', borderRadius: '6px', objectFit: 'cover', border: '1px solid #CBD5E1' }}
                />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    Selected: {selectedAsset.originalName}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {selectedAsset.url}
                  </div>
                </div>
              </>
            ) : (
              <span style={{ fontSize: '0.78rem', color: '#94A3B8' }}>No image currently selected</span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
            <button type="button" onClick={onClose} className="admin-btn-secondary" style={{ height: '38px' }}>
              Cancel
            </button>
            <button
              type="button"
              disabled={!selectedAsset}
              onClick={handleConfirm}
              className="admin-btn-primary"
              style={{ height: '38px' }}
            >
              <Check size={16} />
              <span>Use Selected Image</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
