import React, { useState, useEffect } from 'react';
import {
  X,
  Car,
  Clock,
  MapPin,
  IndianRupee,
  Users,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Image as ImageIcon,
} from 'lucide-react';
import { adminLocalVehicleApi } from '../../services/api';
import './admin.css';

const PRESET_IMAGES = [
  { label: 'Executive Sedan', url: '/assets/sedan.webp', category: 'SEDAN', seats: 4 },
  { label: 'Spacious SUV', url: '/assets/suv.webp', category: 'SUV', seats: 6 },
  { label: 'Compact Hatchback', url: '/assets/hatchback.jpg', category: 'HATCHBACK', seats: 4 },
  { label: 'Luxury Crysta', url: '/assets/luxury.jpg', category: 'LUXURY', seats: 6 },
  { label: 'Tempo Traveller', url: '/assets/minibus.jpg', category: 'MINIBUS', seats: 12 },
];

export const AdminLocalVehicleForm = ({ isOpen, vehicle, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: 'SEDAN',
    city: 'Pune',
    durationHours: 8,
    baseFare: '',
    extraHourCharge: '150',
    parkingEnabled: true,
    parkingAmount: '100',
    seatingCapacity: 4,
    image: '/assets/sedan.webp',
    description: '',
    status: 'AVAILABLE',
    availableQuantity: 5,
    isActive: true,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (vehicle) {
      setFormData({
        name: vehicle.name || '',
        category: vehicle.category || 'SEDAN',
        city: vehicle.city || 'Pune',
        durationHours: vehicle.durationHours || 8,
        baseFare: vehicle.baseFare !== undefined ? vehicle.baseFare.toString() : '',
        extraHourCharge: vehicle.extraHourCharge !== undefined ? vehicle.extraHourCharge.toString() : '150',
        parkingEnabled: Boolean(vehicle.parkingEnabled),
        parkingAmount: vehicle.parkingAmount !== undefined ? vehicle.parkingAmount.toString() : '0',
        seatingCapacity: vehicle.seatingCapacity || 4,
        image: vehicle.image || '/assets/sedan.webp',
        description: vehicle.description || '',
        status: vehicle.status || 'AVAILABLE',
        availableQuantity: vehicle.availableQuantity || 5,
        isActive: vehicle.isActive !== undefined ? Boolean(vehicle.isActive) : true,
      });
    } else {
      setFormData({
        name: 'AC Executive Sedan (Pune Local 8 Hrs)',
        category: 'SEDAN',
        city: 'Pune',
        durationHours: 8,
        baseFare: '1850',
        extraHourCharge: '150',
        parkingEnabled: true,
        parkingAmount: '100',
        seatingCapacity: 4,
        image: '/assets/sedan.webp',
        description: 'Fuel: CNG / Petrol | 8 Hrs / 80 KMs package with professional city driver.',
        status: 'AVAILABLE',
        availableQuantity: 5,
        isActive: true,
      });
    }
    setError(null);
  }, [vehicle, isOpen]);

  if (!isOpen) return null;

  const handleApplyPreset = (preset) => {
    setFormData((prev) => ({
      ...prev,
      category: preset.category,
      image: preset.url,
      seatingCapacity: preset.seats,
      name: `AC ${preset.label} (${prev.city} Local ${prev.durationHours} Hrs)`,
    }));
  };

  const handleCityChange = (newCity) => {
    setFormData((prev) => ({
      ...prev,
      city: newCity,
      name: prev.name.replace(/(Pune|Mumbai)/g, newCity),
    }));
  };

  const handleDurationChange = (hrs) => {
    setFormData((prev) => ({
      ...prev,
      durationHours: hrs,
      name: prev.name.replace(/\d+\s*Hrs/g, `${hrs} Hrs`),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Please provide a package name.');
      return;
    }
    if (!formData.baseFare || parseFloat(formData.baseFare) <= 0) {
      setError('Please enter a valid base fare.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (vehicle?.id) {
        await adminLocalVehicleApi.update(vehicle.id, formData);
      } else {
        await adminLocalVehicleApi.create(formData);
      }
      onSuccess();
    } catch (err) {
      console.error('Error saving local vehicle package:', err);
      setError(err.response?.data?.message || 'Failed to save local vehicle package');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        className="admin-modal-card"
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.75rem',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              {vehicle ? 'Edit Local Hourly Package' : 'Create Local Hourly Package'}
            </h3>
            <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '0.2rem 0 0 0' }}>
              Define city, package hours, pricing, and vehicle specifications for Local Mode.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#F1F5F9',
              border: 'none',
              borderRadius: '8px',
              padding: '0.4rem',
              cursor: 'pointer',
              color: '#64748B',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem 1.75rem' }}>
          {error && (
            <div
              style={{
                backgroundColor: '#FEF2F2',
                border: '1px solid #FCA5A5',
                color: '#991B1B',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                fontSize: '0.82rem',
                marginBottom: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Presets */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              Quick Vehicle Preset
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
              {PRESET_IMAGES.map((p) => {
                const isSelected = formData.category === p.category;
                return (
                  <button
                    type="button"
                    key={p.label}
                    onClick={() => handleApplyPreset(p)}
                    style={{
                      padding: '0.65rem 0.5rem',
                      border: isSelected ? '2px solid #0284C7' : '1.5px solid #E2E8F0',
                      backgroundColor: isSelected ? '#F0F9FF' : '#FFFFFF',
                      borderRadius: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: isSelected ? '0 4px 12px rgba(2, 132, 199, 0.15)' : '0 1px 3px rgba(0,0,0,0.04)',
                    }}
                  >
                    <div style={{ width: '48px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src={p.url} alt={p.label} style={{ maxHeight: '28px', maxWidth: '44px', objectFit: 'contain' }} />
                    </div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: isSelected ? '#0284C7' : '#0F172A', textAlign: 'center', lineHeight: 1.1 }}>
                      {p.label}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: isSelected ? '#0369A1' : '#64748B', fontWeight: 600 }}>
                      {p.seats} Seats
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            {/* City */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                City *
              </label>
              <select
                value={formData.city}
                onChange={(e) => handleCityChange(e.target.value)}
                className="admin-input"
                style={{ width: '100%' }}
              >
                <option value="Pune">Pune Local</option>
                <option value="Mumbai">Mumbai Local</option>
              </select>
            </div>

            {/* Duration */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Package Duration (Hours) *
              </label>
              <select
                value={formData.durationHours}
                onChange={(e) => handleDurationChange(parseInt(e.target.value, 10))}
                className="admin-input"
                style={{ width: '100%' }}
              >
                <option value={4}>4 Hours / 40 KMs</option>
                <option value={8}>8 Hours / 80 KMs (Standard)</option>
                <option value={12}>12 Hours / 120 KMs (Full Day)</option>
              </select>
            </div>
          </div>

          {/* Package Name */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
              Package Title *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. AC Executive Sedan (Pune Local 8 Hrs)"
              className="admin-input"
              style={{ width: '100%' }}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            {/* Base Fare */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Base Fare (₹) *
              </label>
              <input
                type="number"
                value={formData.baseFare}
                onChange={(e) => setFormData({ ...formData, baseFare: e.target.value })}
                placeholder="e.g. 1850"
                className="admin-input"
                style={{ width: '100%' }}
                required
              />
            </div>

            {/* Extra Hour Charge */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Extra Hour Rate (₹/hr) *
              </label>
              <input
                type="number"
                value={formData.extraHourCharge}
                onChange={(e) => setFormData({ ...formData, extraHourCharge: e.target.value })}
                placeholder="e.g. 150"
                className="admin-input"
                style={{ width: '100%' }}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            {/* Seating Capacity */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Seating Capacity (Pass.)
              </label>
              <select
                value={formData.seatingCapacity}
                onChange={(e) => setFormData({ ...formData, seatingCapacity: parseInt(e.target.value, 10) })}
                className="admin-input"
                style={{ width: '100%' }}
              >
                <option value={4}>4 Passengers (Sedan / Hatchback)</option>
                <option value={6}>6 Passengers (SUV / Crysta)</option>
                <option value={7}>7 Passengers (Large SUV)</option>
                <option value={12}>12+ Passengers (Tempo Traveller)</option>
              </select>
            </div>

            {/* Parking Charge */}
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                Parking Amount (₹)
              </label>
              <input
                type="number"
                value={formData.parkingAmount}
                onChange={(e) => setFormData({ ...formData, parkingAmount: e.target.value, parkingEnabled: parseFloat(e.target.value) > 0 })}
                placeholder="e.g. 100"
                className="admin-input"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Description & Fuel type */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
              Features & Fuel Tag (Shown on card)
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g. Fuel: CNG / Petrol | 8 Hrs / 80 KMs package with professional city driver."
              className="admin-input"
              style={{ width: '100%' }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', borderTop: '1px solid #E2E8F0', paddingTop: '1.25rem' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="admin-btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="admin-btn-primary"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{vehicle ? 'Update Package' : 'Create Package'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
