import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Car,
  Users,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Upload,
  Image as ImageIcon,
  Check,
} from 'lucide-react';
import { vehicleApi, API_BASE_URL } from '../../services/api';
import './admin.css';

const PRESET_VEHICLES = [
  { label: 'Executive Sedan', url: '/assets/sedan.webp', category: 'SEDAN', seats: 4 },
  { label: 'Family SUV (Ertiga)', url: '/assets/suv.webp', category: 'SUV', seats: 6 },
  { label: 'Toyota Innova Crysta', url: '/assets/luxury.jpg', category: 'LUXURY', seats: 6 },
  { label: 'Tempo Traveller (12-Seater)', url: '/assets/minibus.jpg', category: 'TEMPO_TRAVELLER', seats: 12 },
  { label: 'Compact Hatchback', url: '/assets/hatchback.jpg', category: 'HATCHBACK', seats: 4 },
];

export const AdminVehicleForm = ({ isOpen, vehicle, onClose, onSuccess }) => {
  const isEditMode = Boolean(vehicle?.id);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: '',
    category: 'SEDAN',
    seatingCapacity: '',
    displayOrder: 0,
    image: '',
    description: '',
    isActive: true,
  });

  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);

  useEffect(() => {
    if (vehicle) {
      setFormData({
        name: vehicle.name || '',
        category: vehicle.category || 'SEDAN',
        seatingCapacity: vehicle.seatingCapacity || 4,
        displayOrder: vehicle.displayOrder !== undefined ? vehicle.displayOrder : 0,
        image: vehicle.image || '/assets/sedan.webp',
        description: vehicle.description || '',
        isActive: vehicle.isActive !== undefined ? Boolean(vehicle.isActive) : true,
      });
    } else {
      setFormData({
        name: '',
        category: 'SEDAN',
        seatingCapacity: '',
        displayOrder: 0,
        image: '',
        description: '',
        isActive: true,
      });
    }
    setErrorMsg('');
    setUploadSuccess(false);
  }, [vehicle, isOpen]);

  // Lock background scrolling and close on Escape key press
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleApplyPreset = (preset) => {
    setFormData((prev) => ({
      ...prev,
      name: prev.name.includes('(') ? `${preset.label} (${prev.name.split('(')[1]}` : preset.label,
      category: preset.category,
      seatingCapacity: preset.seats,
      image: preset.url,
    }));
  };

  const handleImageFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please upload a valid image file (PNG, JPG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('Image file size must be less than 5MB.');
      return;
    }

    setUploadingImage(true);
    setErrorMsg('');
    setUploadSuccess(false);

    try {
      const data = new FormData();
      data.append('image', file);
      const res = await vehicleApi.uploadImage(data);
      const uploadedUrl = res.data?.imageUrl;

      if (uploadedUrl) {
        setFormData((prev) => ({ ...prev, image: uploadedUrl }));
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
      } else {
        throw new Error('Image upload failed to return a valid URL.');
      }
    } catch (err) {
      console.error('Vehicle image upload error:', err);
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to upload vehicle image.');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.name.trim()) {
      setErrorMsg('Vehicle Name is required.');
      return;
    }

    const payload = {
      name: formData.name.trim(),
      category: formData.category,
      seatingCapacity: parseInt(formData.seatingCapacity, 10) || 4,
      displayOrder: parseInt(formData.displayOrder, 10) || 0,
      image: formData.image || '/assets/sedan.webp',
      description: formData.description.trim() || null,
      isActive: formData.isActive,
    };

    setSubmitting(true);
    try {
      if (isEditMode) {
        await vehicleApi.update(vehicle.id, payload);
      } else {
        await vehicleApi.create(payload);
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Vehicle save error:', err);
      setErrorMsg(err.response?.data?.message || err.message || 'Failed to save vehicle details.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const previewSrc = formData.image?.startsWith('/uploads')
    ? `${API_BASE_URL || ''}${formData.image}`
    : formData.image || '/assets/sedan.webp';

  return (
    <div
      className="admin-modal-backdrop admin-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
        overflowY: 'auto',
      }}
    >
      <div
        className="admin-modal-card admin-modal-container"
        style={{
          maxWidth: '640px',
          width: '100%',
          maxHeight: '90vh',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid #E2E8F0',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="admin-modal-header" style={{ padding: '1rem 1.25rem', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: '#ECFDF5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Car size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                {isEditMode ? 'Edit Fleet Vehicle' : 'Add New Fleet Vehicle'}
              </h2>
              <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0.15rem 0 0 0' }}>
                Manage intercity fleet specifications, category & seating capacity
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="admin-modal-btn-close admin-modal-close"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form */}
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          <div className="admin-modal-body" style={{ padding: '1.25rem' }}>
            {errorMsg && (
              <div
                style={{
                  backgroundColor: '#FFE4E6',
                  border: '1px solid #FECDD3',
                  color: '#BE123C',
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
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

            {/* Quick Presets Bar */}
            <div style={{ marginBottom: '1.15rem' }}>
              <div
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: '#64748B',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: '0.4rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <Sparkles size={13} color="#059669" />
                <span>Quick Fleet Presets</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {PRESET_VEHICLES.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    style={{
                      padding: '0.3rem 0.65rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      border: '1px solid #E2E8F0',
                      backgroundColor: formData.category === preset.category ? '#ECFDF5' : '#FFFFFF',
                      color: formData.category === preset.category ? '#047857' : '#475569',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Basic Info Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div className="admin-input-group" style={{ margin: 0 }}>
                <label className="admin-input-label">Vehicle Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Executive Sedan (Dzire / Etios)"
                  required
                  className="admin-input-control"
                  style={{ height: '38px', fontSize: '0.86rem' }}
                />
              </div>

              <div className="admin-form-grid-3">
                <div className="admin-input-group" style={{ margin: 0 }}>
                  <label className="admin-input-label">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="admin-input-control"
                    style={{ height: '38px', fontSize: '0.86rem' }}
                  >
                    <option value="SEDAN">SEDAN</option>
                    <option value="SUV">SUV</option>
                    <option value="LUXURY">LUXURY</option>
                    <option value="TEMPO_TRAVELLER">TEMPO_TRAVELLER</option>
                    <option value="HATCHBACK">HATCHBACK</option>
                    <option value="MINIBUS">MINIBUS</option>
                  </select>
                </div>

                <div className="admin-input-group" style={{ margin: 0 }}>
                  <label className="admin-input-label">Seating Capacity *</label>
                  <input
                    type="number"
                    min="1"
                    max="35"
                    value={formData.seatingCapacity}
                    onChange={(e) => setFormData({ ...formData, seatingCapacity: e.target.value })}
                    required
                    className="admin-input-control"
                    style={{ height: '38px', fontSize: '0.86rem' }}
                  />
                </div>

                <div className="admin-input-group" style={{ margin: 0 }}>
                  <label className="admin-input-label">Display Order</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: e.target.value })}
                    className="admin-input-control"
                    style={{ height: '38px', fontSize: '0.86rem' }}
                  />
                </div>
              </div>

              {/* Vehicle Description */}
              <div className="admin-input-group" style={{ margin: 0 }}>
                <label className="admin-input-label">Description / Feature Summary</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  placeholder="e.g. Clean AC vehicle, boot space for 3 large suitcases, bottle holders, USB charging."
                  className="admin-input-control"
                  style={{ resize: 'vertical', fontSize: '0.82rem' }}
                />
              </div>

              {/* Vehicle Image Upload & Preview Section */}
              <div
                style={{
                  border: '1px solid #E2E8F0',
                  borderRadius: '10px',
                  padding: '0.85rem 1rem',
                  backgroundColor: '#F8FAFC',
                }}
              >
                <label className="admin-input-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
                  Vehicle Photo & Media
                </label>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  {/* Live Image Preview Thumbnail */}
                  <div
                    style={{
                      width: '100px',
                      height: '70px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      backgroundColor: '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      flexShrink: 0,
                    }}
                  >
                    {formData.image ? (
                      <img
                        src={previewSrc}
                        alt="Vehicle Preview"
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        onError={(e) => {
                          e.target.src = '/assets/sedan.webp';
                        }}
                      />
                    ) : (
                      <Car size={26} color="#94A3B8" />
                    )}
                  </div>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="text"
                        value={formData.image}
                        onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                        placeholder="/assets/sedan.webp or image URL"
                        className="admin-input-control"
                        style={{ height: '36px', fontSize: '0.82rem', flex: 1 }}
                      />

                      {/* File Upload Trigger Button */}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImage}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          padding: '0 0.8rem',
                          height: '36px',
                          borderRadius: '8px',
                          border: '1px solid #CBD5E1',
                          backgroundColor: '#FFFFFF',
                          color: '#0F172A',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: uploadingImage ? 'not-allowed' : 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {uploadingImage ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Upload size={14} />
                        )}
                        <span>{uploadingImage ? 'Uploading...' : 'Upload File'}</span>
                      </button>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/jpg"
                        style={{ display: 'none' }}
                        onChange={handleImageFileUpload}
                      />
                    </div>

                    {uploadSuccess && (
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: '#059669',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          fontWeight: 600,
                        }}
                      >
                        <CheckCircle2 size={13} />
                        <span>Photo uploaded and linked to vehicle successfully!</span>
                      </div>
                    )}
                    <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
                      Supports direct upload (JPG, PNG, WebP &lt; 5MB) or entering asset path.
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Toggle */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  backgroundColor: formData.isActive ? '#F0FDF4' : '#F8FAFC',
                  border: '1px solid',
                  borderColor: formData.isActive ? '#BBF7D0' : '#E2E8F0',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0F172A' }}>
                    Active Status
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748B' }}>
                    {formData.isActive
                      ? 'Vehicle is active and available for route fare calculations.'
                      : 'Vehicle is deactivated (soft-deleted) and hidden from public search.'}
                  </div>
                </div>

                <label
                  style={{
                    position: 'relative',
                    display: 'inline-block',
                    width: '44px',
                    height: '24px',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      cursor: 'pointer',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: formData.isActive ? '#10B981' : '#CBD5E1',
                      transition: '.2s',
                      borderRadius: '24px',
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        content: '',
                        height: '18px',
                        width: '18px',
                        left: formData.isActive ? '23px' : '3px',
                        bottom: '3px',
                        backgroundColor: 'white',
                        transition: '.2s',
                        borderRadius: '50%',
                      }}
                    />
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div
            className="admin-modal-footer"
            style={{
              padding: '0.85rem 1.25rem',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.65rem',
              borderTop: '1px solid #E2E8F0',
              backgroundColor: '#F8FAFC',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="admin-btn-secondary"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="admin-btn-primary"
              style={{ minWidth: '130px' }}
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{isEditMode ? 'Update Vehicle' : 'Save Vehicle'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

