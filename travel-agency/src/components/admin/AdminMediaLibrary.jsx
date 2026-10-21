import React, { useState, useEffect } from 'react';
import {
  Image as ImageIcon,
  Upload,
  Search,
  Filter,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  Edit2,
  AlertTriangle,
  AlertCircle,
  Loader2,
  Calendar,
  HardDrive,
  Tag,
  Eye,
  X,
  Plus,
  RefreshCw,
  ShieldAlert,
  Car,
} from 'lucide-react';
import { mediaApi, vehicleApi, API_BASE_URL } from '../../services/api';
import './admin.css';

const CATEGORIES = [
  { id: 'all', label: 'All Media' },
  { id: 'vehicles', label: 'Vehicles' },
  { id: 'blogs', label: 'Blog Articles' },
  { id: 'destinations', label: 'Destinations' },
  { id: 'services', label: 'Services' },
  { id: 'general', label: 'General / Homepage' },
];

export const AdminMediaLibrary = () => {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [copiedUrl, setCopiedUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  // Upload Modal State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadCategory, setUploadCategory] = useState('general');
  const [uploadAssignVehicleId, setUploadAssignVehicleId] = useState('');
  const [uploadAltText, setUploadAltText] = useState('');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadPreview, setUploadPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Metadata Edit State (in detail drawer)
  const [editingAlt, setEditingAlt] = useState('');
  const [editingTitle, setEditingTitle] = useState('');
  const [editingCategory, setEditingCategory] = useState('');
  const [savingMeta, setSavingMeta] = useState(false);

  // Delete State
  const [assetToDelete, setAssetToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [forceDelete, setForceDelete] = useState(false);

  // Direct Vehicle Assignment State
  const [fleetVehicles, setFleetVehicles] = useState([]);
  const [assignTargetVehicleId, setAssignTargetVehicleId] = useState('');
  const [assigningVehicle, setAssigningVehicle] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState('');

  const loadFleetVehicles = async () => {
    try {
      const res = await vehicleApi.adminGetAll();
      if (res.data?.data) {
        setFleetVehicles(res.data.data);
      }
    } catch (err) {
      console.warn('AdminMediaLibrary: Could not load fleet vehicles:', err?.message);
    }
  };

  useEffect(() => {
    loadFleetVehicles();
  }, []);

  const handleAssignToVehicle = async () => {
    if (!assignTargetVehicleId || !selectedAsset) return;
    setAssigningVehicle(true);
    setAssignSuccess('');
    setErrorMsg('');
    try {
      await vehicleApi.update(assignTargetVehicleId, {
        image: selectedAsset.url,
      });
      const targetV = fleetVehicles.find((v) => v.id === assignTargetVehicleId);
      setAssignSuccess(`Assigned to ${targetV?.name || 'vehicle'}!`);
      setTimeout(() => setAssignSuccess(''), 4000);
      loadMedia();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to assign image to vehicle.');
    } finally {
      setAssigningVehicle(false);
    }
  };

  // Load Media Assets
  const loadMedia = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const params = {
        page,
        limit: 28,
        sortBy: 'createdAt',
        order: 'desc',
      };
      if (category !== 'all') params.category = category;
      if (search.trim()) params.search = search.trim();

      const res = await mediaApi.getAll(params);
      setAssets(res.data?.data || []);
      setPagination(res.data?.pagination || { total: 0, totalPages: 1 });

      // If active selected asset is in new list, update it
      if (selectedAsset) {
        const refreshed = (res.data?.data || []).find((a) => a.id === selectedAsset.id);
        if (refreshed) {
          setSelectedAsset(refreshed);
          setEditingAlt(refreshed.altText || '');
          setEditingTitle(refreshed.title || '');
          setEditingCategory(refreshed.category || 'general');
        }
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to fetch media assets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, [category, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadMedia();
  };

  const handleSelectAsset = (asset) => {
    setSelectedAsset(asset);
    setEditingAlt(asset.altText || '');
    setEditingTitle(asset.title || '');
    setEditingCategory(asset.category || 'general');
  };

  const handleCopyUrl = (url) => {
    const fullUrl = url.startsWith('http')
      ? url
      : `${url.startsWith('/uploads') ? (API_BASE_URL || window.location.origin) : ''}${url}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(''), 2200);
  };

  // Upload handler
  const handleFilePick = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg('Image size cannot exceed 5MB.');
        return;
      }
      setUploadFile(file);
      setUploadPreview(URL.createObjectURL(file));
      setUploadTitle(file.name.replace(/\.[^/.]+$/, ''));
      setErrorMsg('');
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      setErrorMsg('Please select a photo file.');
      return;
    }

    setUploading(true);
    setErrorMsg('');
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('category', uploadCategory);
      formData.append('altText', uploadAltText);
      formData.append('title', uploadTitle);

      const res = await mediaApi.upload(formData);
      const uploadedAsset = res.data?.data;
      if (uploadAssignVehicleId && uploadedAsset?.url) {
        await vehicleApi.update(uploadAssignVehicleId, { image: uploadedAsset.url });
      }

      setSuccessMsg(
        uploadAssignVehicleId 
          ? 'Photo uploaded and assigned to vehicle successfully!' 
          : 'Media uploaded successfully!'
      );
      setTimeout(() => setSuccessMsg(''), 3500);

      // Reset upload modal
      setIsUploadOpen(false);
      setUploadFile(null);
      setUploadPreview(null);
      setUploadAltText('');
      setUploadTitle('');
      setUploadAssignVehicleId('');

      // Auto-select uploaded asset
      if (uploadedAsset) {
        handleSelectAsset(uploadedAsset);
      }
      loadMedia();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to upload photo.');
    } finally {
      setUploading(false);
    }
  };

  // Save metadata
  const handleSaveMetadata = async () => {
    if (!selectedAsset) return;
    setSavingMeta(true);
    setErrorMsg('');
    try {
      const res = await mediaApi.updateMetadata(selectedAsset.id, {
        altText: editingAlt,
        title: editingTitle,
        category: editingCategory,
      });

      const updated = res.data?.data;
      setSelectedAsset(updated);
      setSuccessMsg('Metadata saved successfully!');
      setTimeout(() => setSuccessMsg(''), 2500);

      // Update in assets array
      setAssets((prev) => prev.map((a) => (a.id === updated.id ? { ...a, ...updated } : a)));
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to update metadata.');
    } finally {
      setSavingMeta(false);
    }
  };

  // Delete handler
  const confirmDelete = async () => {
    if (!assetToDelete) return;
    setDeleting(true);
    setErrorMsg('');
    try {
      await mediaApi.delete(assetToDelete.id, forceDelete);
      setSuccessMsg('Image deleted from database and storage.');
      setTimeout(() => setSuccessMsg(''), 2500);

      if (selectedAsset?.id === assetToDelete.id) {
        setSelectedAsset(null);
      }
      setAssetToDelete(null);
      setForceDelete(false);
      loadMedia();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete media asset.';
      setErrorMsg(msg);
      // If server returned 409 MEDIA_IN_USE, enable force delete option in modal
      if (err.response?.status === 409) {
        setForceDelete(true);
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="admin-content-wrap">
      {/* ── Top Banner & Primary Actions ── */}
      <div
        className="admin-card"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.5rem',
          flexWrap: 'wrap',
          marginBottom: '1.25rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <h1
              style={{
                fontSize: '1.4rem',
                fontWeight: 800,
                color: '#0F172A',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
              }}
            >
              <ImageIcon size={24} style={{ color: '#0284C7' }} />
              <span>Central Media Library</span>
            </h1>
            <span
              style={{
                padding: '0.2rem 0.65rem',
                borderRadius: '9999px',
                backgroundColor: '#E0F2FE',
                color: '#0369A1',
                fontSize: '0.75rem',
                fontWeight: 800,
              }}
            >
              {(pagination?.total ?? assets.length)} Assets
            </span>
          </div>
          <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '0.35rem 0 0 0' }}>
            Upload, inspect, catalog and reuse authentic photographs across fleets, blogs, destinations and homepage
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={loadMedia}
            className="admin-btn-secondary"
            title="Refresh assets list"
            disabled={loading}
            style={{ height: '42px', padding: '0 1rem' }}
          >
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={() => setIsUploadOpen(true)}
            className="admin-btn-primary"
            style={{ height: '42px', padding: '0 1.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Upload size={16} />
            <span>Upload Media</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div
          style={{
            padding: '0.75rem 1.25rem',
            backgroundColor: '#DCFCE7',
            border: '1px solid #BBF7D0',
            borderRadius: '10px',
            color: '#15803D',
            fontSize: '0.82rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1rem',
          }}
        >
          <Check size={16} strokeWidth={2.5} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div
          style={{
            padding: '0.75rem 1.25rem',
            backgroundColor: '#FEF2F2',
            border: '1px solid #FEE2E2',
            borderRadius: '10px',
            color: '#B91C1C',
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            marginBottom: '1rem',
          }}
        >
          <AlertCircle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ── Filter Bar ── */}
      <div
        className="admin-card"
        style={{
          marginBottom: '1.25rem',
          padding: '0.85rem 1.25rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        {/* Category Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setCategory(cat.id);
                setPage(1);
              }}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '8px',
                border: '1px solid',
                borderColor: category === cat.id ? '#0284C7' : '#E2E8F0',
                backgroundColor: category === cat.id ? '#F0F9FF' : '#FFFFFF',
                color: category === cat.id ? '#0369A1' : '#64748B',
                fontWeight: category === cat.id ? 700 : 500,
                fontSize: '0.78rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
          <input
            type="text"
            placeholder="Search by title, filename or alt..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              height: '36px',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              padding: '0 2.2rem 0 0.85rem',
              fontSize: '0.8rem',
              width: '260px',
            }}
          />
          <button
            type="submit"
            style={{
              position: 'absolute',
              right: '8px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#94A3B8',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Search size={15} />
          </button>
        </form>
      </div>

      {/* ── Main Layout: Media Grid + Asset Detail Drawer ── */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedAsset ? '1fr 340px' : '1fr', gap: '1.25rem', alignItems: 'start' }}>
        
        {/* Media Grid */}
        <div className="admin-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>
              Showing {assets.length} of {pagination.total} assets
            </div>
            {pagination.totalPages > 1 && (
              <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="admin-btn-secondary"
                  style={{ height: '30px', padding: '0 0.6rem', fontSize: '0.75rem' }}
                >
                  Prev
                </button>
                <span style={{ fontSize: '0.75rem', color: '#64748B', padding: '0 0.4rem' }}>
                  {page} / {pagination.totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="admin-btn-secondary"
                  style={{ height: '30px', padding: '0 0.6rem', fontSize: '0.75rem' }}
                >
                  Next
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '320px', color: '#64748B' }}>
              <Loader2 size={36} className="spin" style={{ color: '#0284C7', marginBottom: '0.85rem' }} />
              <span style={{ fontSize: '0.85rem' }}>Loading photographs from storage...</span>
            </div>
          ) : assets.length === 0 ? (
            <div style={{ padding: '4rem 2rem', textAlign: 'center', color: '#94A3B8' }}>
              <ImageIcon size={48} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
              <div style={{ fontWeight: 700, color: '#334155', fontSize: '0.95rem' }}>
                No media photographs found
              </div>
              <p style={{ margin: '0.35rem 0 1.25rem', fontSize: '0.8rem' }}>
                Upload vehicle, corridor, or destination pictures to build the central library.
              </p>
              <button
                type="button"
                onClick={() => setIsUploadOpen(true)}
                className="admin-btn-primary"
                style={{ margin: '0 auto' }}
              >
                <Plus size={15} />
                <span>Upload First Asset</span>
              </button>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                gap: '1rem',
              }}
            >
              {assets.map((asset) => {
                const isSelected = selectedAsset?.id === asset.id;
                const fullUrl = asset.url.startsWith('http')
                  ? asset.url
                  : `${asset.url.startsWith('/uploads') ? API_BASE_URL : ''}${asset.url}`;

                return (
                  <div
                    key={asset.id}
                    onClick={() => handleSelectAsset(asset)}
                    style={{
                      borderRadius: '12px',
                      border: isSelected ? '2px solid #0284C7' : '1px solid #E2E8F0',
                      backgroundColor: isSelected ? '#F0F9FF' : '#FFFFFF',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    {/* Image Preview */}
                    <div style={{ width: '100%', height: '115px', backgroundColor: '#F8FAFC', position: 'relative' }}>
                      <img
                        src={fullUrl}
                        alt={asset.altText || asset.originalName}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          e.target.src = '/assets/sedan.webp';
                        }}
                      />

                      {/* In-Use Indicator Tag */}
                      {asset.isReferenced && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '6px',
                            left: '6px',
                            backgroundColor: '#0F766E',
                            color: '#FFFFFF',
                            fontSize: '0.62rem',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
                          }}
                          title={`Referenced: ${asset.references?.join(', ')}`}
                        >
                          In Use
                        </div>
                      )}

                      {/* Category Tag */}
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '6px',
                          left: '6px',
                          backgroundColor: 'rgba(15, 23, 42, 0.8)',
                          color: '#FFFFFF',
                          fontSize: '0.6rem',
                          fontWeight: 700,
                          padding: '1px 5px',
                          borderRadius: '4px',
                          textTransform: 'uppercase',
                        }}
                      >
                        {asset.category}
                      </div>

                      {/* Quick 1-click Copy Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyUrl(asset.url);
                        }}
                        style={{
                          position: 'absolute',
                          bottom: '6px',
                          right: '6px',
                          width: '24px',
                          height: '24px',
                          borderRadius: '6px',
                          backgroundColor: copiedUrl === asset.url ? '#16A34A' : 'rgba(255, 255, 255, 0.9)',
                          color: copiedUrl === asset.url ? '#FFFFFF' : '#334155',
                          border: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                        }}
                        title="Copy Public URL"
                      >
                        {copiedUrl === asset.url ? <Check size={12} strokeWidth={3} /> : <Copy size={12} />}
                      </button>
                    </div>

                    {/* Metadata summary */}
                    <div style={{ padding: '0.6rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          color: isSelected ? '#0369A1' : '#0F172A',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                        title={asset.title || asset.originalName}
                      >
                        {asset.title || asset.originalName}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#94A3B8', marginTop: '0.25rem' }}>
                        <span>{(asset.fileSize / 1024).toFixed(0)} KB</span>
                        <span>{new Date(asset.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Asset Detail & Metadata Inspector Drawer ── */}
        {selectedAsset && (
          <div
            className="admin-card"
            style={{
              padding: '1.25rem',
              position: 'sticky',
              top: '1rem',
              maxHeight: 'calc(100vh - 2rem)',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0F172A' }}>
                Asset Details
              </div>
              <button
                type="button"
                onClick={() => setSelectedAsset(null)}
                style={{
                  background: '#F1F5F9',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.35rem',
                  cursor: 'pointer',
                  color: '#64748B',
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Large Preview */}
            <div
              style={{
                width: '100%',
                height: '180px',
                borderRadius: '10px',
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                overflow: 'hidden',
                marginBottom: '1rem',
              }}
            >
              <img
                src={
                  selectedAsset.url.startsWith('http')
                    ? selectedAsset.url
                    : `${selectedAsset.url.startsWith('/uploads') ? API_BASE_URL : ''}${selectedAsset.url}`
                }
                alt={selectedAsset.altText || selectedAsset.originalName}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                onError={(e) => {
                  e.target.src = '/assets/sedan.webp';
                }}
              />
            </div>

            {/* In-Use Alert if referenced */}
            {selectedAsset.isReferenced && (
              <div
                style={{
                  padding: '0.65rem 0.85rem',
                  backgroundColor: '#ECFDF5',
                  border: '1px solid #A7F3D0',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                  fontSize: '0.74rem',
                  color: '#065F46',
                }}
              >
                <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.2rem' }}>
                  <ShieldAlert size={14} />
                  <span>Currently In Use On Website</span>
                </div>
                <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
                  {selectedAsset.references?.map((ref, idx) => (
                    <li key={idx}>{ref}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Copy URL Row */}
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>
                Public Image URL
              </label>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <input
                  type="text"
                  readOnly
                  value={selectedAsset.url}
                  style={{
                    flex: 1,
                    height: '32px',
                    borderRadius: '6px',
                    border: '1px solid #CBD5E1',
                    padding: '0 0.5rem',
                    fontSize: '0.72rem',
                    backgroundColor: '#F8FAFC',
                    color: '#334155',
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleCopyUrl(selectedAsset.url)}
                  className="admin-btn-secondary"
                  style={{ height: '32px', padding: '0 0.65rem', fontSize: '0.72rem' }}
                >
                  {copiedUrl === selectedAsset.url ? <Check size={13} /> : <Copy size={13} />}
                  <span>{copiedUrl === selectedAsset.url ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* Quick Assign to Fleet Vehicle */}
            <div
              style={{
                marginBottom: '1.15rem',
                padding: '0.75rem',
                backgroundColor: '#F0FDF4',
                border: '1px solid #BBF7D0',
                borderRadius: '8px',
              }}
            >
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#166534',
                  marginBottom: '0.45rem',
                }}
              >
                <Car size={14} color="#16A34A" />
                <span>Assign to Fleet Vehicle</span>
              </label>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <select
                  value={assignTargetVehicleId}
                  onChange={(e) => setAssignTargetVehicleId(e.target.value)}
                  style={{
                    flex: 1,
                    height: '32px',
                    borderRadius: '6px',
                    border: '1px solid #86EFAC',
                    padding: '0 0.4rem',
                    fontSize: '0.74rem',
                    backgroundColor: '#FFFFFF',
                    color: '#0F172A',
                  }}
                >
                  <option value="">-- Choose Vehicle --</option>
                  {fleetVehicles.map((fv) => (
                    <option key={fv.id} value={fv.id}>
                      {fv.name} ({fv.category})
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAssignToVehicle}
                  disabled={!assignTargetVehicleId || assigningVehicle}
                  className="admin-btn-primary"
                  style={{
                    height: '32px',
                    padding: '0 0.75rem',
                    fontSize: '0.74rem',
                    backgroundColor: '#16A34A',
                    borderColor: '#16A34A',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {assigningVehicle ? <Loader2 size={12} className="spin" /> : <Check size={12} />}
                  <span>Assign</span>
                </button>
              </div>
              {assignSuccess && (
                <div
                  style={{
                    fontSize: '0.72rem',
                    color: '#15803D',
                    fontWeight: 600,
                    marginTop: '0.4rem',
                  }}
                >
                  ✓ {assignSuccess}
                </div>
              )}
            </div>

            {/* Editable Metadata Form */}
            <div style={{ marginBottom: '0.85rem' }}>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>
                Asset Title
              </label>
              <input
                type="text"
                value={editingTitle}
                onChange={(e) => setEditingTitle(e.target.value)}
                placeholder="Descriptive title"
                style={{
                  width: '100%',
                  height: '34px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  padding: '0 0.6rem',
                  fontSize: '0.78rem',
                }}
              />
            </div>

            <div style={{ marginBottom: '0.85rem' }}>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>
                Alt Text (Crucial for SEO & Accessibility)
              </label>
              <textarea
                rows={2}
                value={editingAlt}
                onChange={(e) => setEditingAlt(e.target.value)}
                placeholder="e.g. Innova Crysta cab parked at Mumbai International Airport"
                style={{
                  width: '100%',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  padding: '0.5rem 0.6rem',
                  fontSize: '0.78rem',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>
                Category
              </label>
              <select
                value={editingCategory}
                onChange={(e) => setEditingCategory(e.target.value)}
                style={{
                  width: '100%',
                  height: '34px',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  padding: '0 0.6rem',
                  fontSize: '0.78rem',
                  backgroundColor: '#FFFFFF',
                }}
              >
                <option value="vehicles">Vehicles</option>
                <option value="blogs">Blog Articles</option>
                <option value="destinations">Destinations</option>
                <option value="services">Services</option>
                <option value="general">General / Homepage</option>
              </select>
            </div>

            {/* Save Metadata Button */}
            <button
              type="button"
              onClick={handleSaveMetadata}
              disabled={savingMeta}
              className="admin-btn-primary"
              style={{ width: '100%', height: '36px', justifyContent: 'center', marginBottom: '1.25rem', fontSize: '0.8rem' }}
            >
              {savingMeta ? <Loader2 size={14} className="spin" /> : <Edit2 size={14} />}
              <span>{savingMeta ? 'Saving Changes...' : 'Save Asset Info'}</span>
            </button>

            {/* Readonly Specs Table */}
            <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '0.85rem', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Technical Metadata
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.74rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}>
                  <span>Original Name:</span>
                  <span style={{ color: '#0F172A', fontWeight: 600, maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {selectedAsset.originalName}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}>
                  <span>Disk Filename:</span>
                  <span style={{ color: '#0F172A', fontWeight: 600, maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {selectedAsset.filename}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}>
                  <span>File Size:</span>
                  <span style={{ color: '#0F172A', fontWeight: 600 }}>
                    {(selectedAsset.fileSize / 1024).toFixed(1)} KB ({selectedAsset.fileSize.toLocaleString()} bytes)
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}>
                  <span>Format:</span>
                  <span style={{ color: '#0F172A', fontWeight: 600 }}>{selectedAsset.mimeType}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748B' }}>
                  <span>Uploaded On:</span>
                  <span style={{ color: '#0F172A', fontWeight: 600 }}>
                    {new Date(selectedAsset.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Delete Trigger */}
            <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '0.85rem' }}>
              <button
                type="button"
                onClick={() => {
                  setAssetToDelete(selectedAsset);
                  setForceDelete(false);
                }}
                className="admin-btn-logout"
                style={{ width: '100%', height: '36px', justifyContent: 'center', fontSize: '0.78rem' }}
              >
                <Trash2 size={14} />
                <span>Delete Asset From Disk</span>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* ── Upload New Asset Modal ── */}
      {isUploadOpen && (
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
              maxWidth: '560px',
              padding: '1.5rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              border: '1px solid #E2E8F0',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0F172A' }}>
                Upload Real Business Image
              </div>
              <button
                type="button"
                onClick={() => setIsUploadOpen(false)}
                style={{ background: '#F1F5F9', border: 'none', borderRadius: '6px', padding: '0.4rem', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit}>
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
                        maxHeight: '170px',
                        maxWidth: '100%',
                        borderRadius: '8px',
                        objectFit: 'contain',
                        marginBottom: '0.75rem',
                      }}
                    />
                    <div style={{ fontSize: '0.8rem', color: '#0F172A', fontWeight: 600 }}>
                      {uploadFile?.name} ({(uploadFile?.size / 1024).toFixed(0)} KB)
                    </div>
                  </div>
                ) : (
                  <div>
                    <Upload size={38} style={{ color: '#0284C7', marginBottom: '0.75rem' }} />
                    <p style={{ margin: 0, fontWeight: 700, color: '#0F172A', fontSize: '0.95rem' }}>
                      Click to choose image or drag & drop here
                    </p>
                    <p style={{ margin: '0.35rem 0 0', fontSize: '0.75rem', color: '#64748B' }}>
                      WebP, JPEG, PNG, AVIF or JFIF up to 5MB
                    </p>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif,.jfif,.jpg,.jpeg,.png,.webp,.avif"
                  onChange={handleFilePick}
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

              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>
                  Target Category
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

              {uploadCategory === 'vehicles' && (
                <div
                  style={{
                    marginBottom: '0.85rem',
                    padding: '0.65rem 0.85rem',
                    backgroundColor: '#F0FDF4',
                    border: '1px solid #BBF7D0',
                    borderRadius: '8px',
                  }}
                >
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      color: '#166534',
                      marginBottom: '0.35rem',
                    }}
                  >
                    <Car size={13} color="#16A34A" />
                    <span>Assign Immediately to Vehicle (Optional)</span>
                  </label>
                  <select
                    value={uploadAssignVehicleId}
                    onChange={(e) => setUploadAssignVehicleId(e.target.value)}
                    style={{
                      width: '100%',
                      height: '34px',
                      borderRadius: '6px',
                      border: '1px solid #86EFAC',
                      padding: '0 0.5rem',
                      fontSize: '0.78rem',
                      backgroundColor: '#FFFFFF',
                      color: '#0F172A',
                    }}
                  >
                    <option value="">-- None (Only save in Media Library) --</option>
                    {fleetVehicles.map((fv) => (
                      <option key={fv.id} value={fv.id}>
                        {fv.name} ({fv.category})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ marginBottom: '0.75rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>
                  Image Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Pune Airport Sedan Fleet"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
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

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.25rem' }}>
                  Alt Text (SEO & Accessibility)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Toyota Innova Crysta at Mumbai Airport terminal"
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

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="admin-btn-secondary"
                  style={{ height: '38px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !uploadFile}
                  className="admin-btn-primary"
                  style={{ height: '38px' }}
                >
                  {uploading ? <Loader2 size={15} className="spin" /> : <Upload size={15} />}
                  <span>{uploading ? 'Uploading...' : 'Save to Library'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Safeguard Modal ── */}
      {assetToDelete && (
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
              maxWidth: '480px',
              padding: '1.5rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              border: '1px solid #E2E8F0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: '#B91C1C' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
                  Delete Media Asset?
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                  This will permanently delete the file from the server disk.
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: '#F8FAFC', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem' }}>
              <img
                src={
                  assetToDelete.url.startsWith('http')
                    ? assetToDelete.url
                    : `${assetToDelete.url.startsWith('/uploads') ? API_BASE_URL : ''}${assetToDelete.url}`
                }
                alt={assetToDelete.originalName}
                style={{ width: '48px', height: '48px', borderRadius: '6px', objectFit: 'cover' }}
              />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {assetToDelete.title || assetToDelete.originalName}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
                  {assetToDelete.url}
                </div>
              </div>
            </div>

            {/* In-Use Warning Safeguard */}
            {assetToDelete.isReferenced && (
              <div
                style={{
                  padding: '0.85rem',
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FEE2E2',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                  fontSize: '0.75rem',
                  color: '#991B1B',
                }}
              >
                <div style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
                  <ShieldAlert size={16} />
                  <span>Safeguard Alert: Image In Active Use</span>
                </div>
                <p style={{ margin: '0 0 0.5rem' }}>
                  Deleting this file will cause broken images on the following records:
                </p>
                <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                  {assetToDelete.references?.map((r, i) => (
                    <li key={i} style={{ fontWeight: 600 }}>{r}</li>
                  ))}
                </ul>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem', cursor: 'pointer', fontWeight: 700 }}>
                  <input
                    type="checkbox"
                    checked={forceDelete}
                    onChange={(e) => setForceDelete(e.target.checked)}
                  />
                  <span>I understand and want to force delete this file anyway</span>
                </label>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => {
                  setAssetToDelete(null);
                  setForceDelete(false);
                }}
                className="admin-btn-secondary"
                style={{ height: '38px' }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting || (assetToDelete.isReferenced && !forceDelete)}
                onClick={confirmDelete}
                className="admin-btn-logout"
                style={{ height: '38px', padding: '0 1rem' }}
              >
                {deleting ? <Loader2 size={15} className="spin" /> : <Trash2 size={15} />}
                <span>{deleting ? 'Deleting...' : 'Confirm Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
