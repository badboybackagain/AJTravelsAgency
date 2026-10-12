import React, { useState, useEffect } from 'react';
import {
  Car,
  Clock,
  MapPin,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Sparkles,
  Users,
  ShieldCheck,
  IndianRupee,
} from 'lucide-react';
import { adminLocalVehicleApi } from '../../services/api';
import { AdminLocalVehicleForm } from './AdminLocalVehicleForm';
import './admin.css';

export const AdminLocalVehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('ALL'); // 'ALL' | 'Pune' | 'Mumbai'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadVehicles = async () => {
    setLoading(true);
    try {
      const res = await adminLocalVehicleApi.getAll();
      setVehicles(res.data?.data || []);
    } catch (err) {
      console.error('Error fetching local vehicles:', err);
      showToast('Failed to load local vehicle packages', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  const handleToggleActive = async (vehicle) => {
    setActionLoadingId(vehicle.id);
    try {
      await adminLocalVehicleApi.update(vehicle.id, { isActive: !vehicle.isActive });
      showToast(`Package "${vehicle.name}" ${!vehicle.isActive ? 'activated' : 'disabled'}`);
      loadVehicles();
    } catch (err) {
      showToast('Failed to update status', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (vehicle) => {
    if (!window.confirm(`Are you sure you want to delete "${vehicle.name}"?`)) return;
    setActionLoadingId(vehicle.id);
    try {
      await adminLocalVehicleApi.delete(vehicle.id);
      showToast('Package deleted successfully');
      loadVehicles();
    } catch (err) {
      showToast('Failed to delete package', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filtered = vehicles.filter((v) => {
    const matchesCity = cityFilter === 'ALL' || v.city.toLowerCase() === cityFilter.toLowerCase();
    const matchesSearch =
      !search ||
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.category.toLowerCase().includes(search.toLowerCase()) ||
      v.city.toLowerCase().includes(search.toLowerCase());
    return matchesCity && matchesSearch;
  });

  return (
    <div className="admin-fares-container">
      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
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
      <div className="admin-fares-header">
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
            Local Hourly Cab Packages
          </h2>
          <p style={{ fontSize: '0.84rem', color: '#64748B', margin: '0.25rem 0 0 0' }}>
            Manage city-specific hourly car rentals (Pune & Mumbai local packages: 4, 8, 12 Hrs).
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedVehicle(null);
            setIsModalOpen(true);
          }}
          className="admin-btn-primary"
        >
          <Plus size={16} />
          <span>Add Local Package</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="admin-filter-bar">
        {/* City Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {['ALL', 'Pune', 'Mumbai'].map((c) => (
            <button
              key={c}
              onClick={() => setCityFilter(c)}
              style={{
                padding: '0.45rem 1rem',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 700,
                border: '1px solid',
                borderColor: cityFilter === c ? '#0284C7' : '#E2E8F0',
                backgroundColor: cityFilter === c ? '#0284C7' : '#FFFFFF',
                color: cityFilter === c ? '#FFFFFF' : '#475569',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {c === 'ALL' ? 'All Cities' : `${c} Local`}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', flex: 1, maxWidth: '320px', marginLeft: 'auto' }}>
          <Search
            size={16}
            style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }}
          />
          <input
            type="text"
            placeholder="Search package name, type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="admin-input"
            style={{ paddingLeft: '2.4rem', width: '100%' }}
          />
        </div>
      </div>

      {/* Content Table */}
      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: '#94A3B8' }}>
          <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 0.75rem' }} />
          <div>Loading local packages...</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="admin-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <Car size={36} color="#CBD5E1" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#334155' }}>No local packages found</h3>
          <p style={{ fontSize: '0.82rem', color: '#94A3B8' }}>Click "Add Local Package" to create a new hourly rental option.</p>
        </div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ minWidth: '190px' }}>Vehicle & Class</th>
                <th style={{ minWidth: '95px' }}>City</th>
                <th style={{ minWidth: '130px' }}>Package Duration</th>
                <th style={{ minWidth: '100px' }}>Base Fare</th>
                <th style={{ minWidth: '100px' }}>Extra Hr Rate</th>
                <th style={{ minWidth: '90px' }}>Parking</th>
                <th style={{ minWidth: '80px' }}>Capacity</th>
                <th style={{ minWidth: '95px' }}>Status</th>
                <th style={{ minWidth: '95px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => {
                const isActionLoading = actionLoadingId === v.id;
                const isPune = v.city?.toLowerCase() === 'pune';

                return (
                  <tr key={v.id} style={{ opacity: v.isActive ? 1 : 0.65 }}>
                    {/* Vehicle & Category */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <img
                          src={v.image || '/assets/sedan.webp'}
                          alt={v.name}
                          style={{
                            width: '46px',
                            height: '32px',
                            objectFit: 'contain',
                            borderRadius: '6px',
                            backgroundColor: '#F8FAFC',
                            border: '1px solid #F1F5F9',
                            flexShrink: 0,
                          }}
                          onError={(e) => {
                            e.target.src = '/assets/sedan.webp';
                          }}
                        />
                        <div>
                          <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.86rem' }}>{v.name}</div>
                          <span
                            style={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              color: '#0284C7',
                              backgroundColor: '#E0F2FE',
                              padding: '0.1rem 0.4rem',
                              borderRadius: '4px',
                              display: 'inline-block',
                              marginTop: '0.15rem',
                            }}
                          >
                            {v.category}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* City */}
                    <td>
                      <span
                        style={{
                          padding: '0.2rem 0.55rem',
                          borderRadius: '6px',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          backgroundColor: isPune ? '#E0F2FE' : '#FEF3C7',
                          color: isPune ? '#0369A1' : '#B45309',
                        }}
                      >
                        {v.city}
                      </span>
                    </td>

                    {/* Package Duration */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700, color: '#1E293B', fontSize: '0.82rem' }}>
                        <Clock size={13} color="#0284C7" />
                        <span>{v.durationHours}h ({v.durationHours * 10}km)</span>
                      </div>
                    </td>

                    {/* Base Fare */}
                    <td>
                      <div style={{ fontWeight: 800, fontSize: '0.94rem', color: '#0F172A' }}>
                        ₹{parseFloat(v.baseFare).toLocaleString()}
                      </div>
                    </td>

                    {/* Extra Hour Rate */}
                    <td>
                      <span style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>
                        ₹{parseFloat(v.extraHourCharge)}/hr
                      </span>
                    </td>

                    {/* Parking */}
                    <td>
                      {v.parkingEnabled ? (
                        <span style={{ fontSize: '0.75rem', color: '#15803D', fontWeight: 700 }}>
                          +₹{parseFloat(v.parkingAmount)}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.74rem', color: '#94A3B8' }}>Included</span>
                      )}
                    </td>

                    {/* Capacity */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', color: '#475569' }}>
                        <Users size={13} />
                        <span>{v.seatingCapacity} Seats</span>
                      </div>
                    </td>

                    {/* Status Toggle */}
                    <td>
                      <button
                        onClick={() => handleToggleActive(v)}
                        disabled={isActionLoading}
                        style={{
                          border: 'none',
                          background: 'none',
                          cursor: 'pointer',
                          padding: 0,
                        }}
                        title="Click to toggle status"
                      >
                        <span className={`admin-status-pill ${v.isActive ? 'available' : 'unavailable'}`}>
                          {v.isActive ? '● Active' : '○ Disabled'}
                        </span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.45rem' }}>
                        <button
                          onClick={() => {
                            setSelectedVehicle(v);
                            setIsModalOpen(true);
                          }}
                          className="admin-btn-secondary"
                          style={{ height: '30px', padding: '0 0.55rem', fontSize: '0.74rem' }}
                          title="Edit Package"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => handleDelete(v)}
                          disabled={isActionLoading}
                          className="admin-btn-logout"
                          style={{ height: '30px', padding: '0 0.55rem' }}
                          title="Delete Package"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Local Vehicle Modal Form */}
      <AdminLocalVehicleForm
        isOpen={isModalOpen}
        vehicle={selectedVehicle}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          loadVehicles();
          showToast(selectedVehicle ? 'Package updated successfully' : 'Package created successfully');
        }}
      />
    </div>
  );
};
