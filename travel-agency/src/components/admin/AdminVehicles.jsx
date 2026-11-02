import React, { useState, useEffect } from 'react';
import {
  Car,
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Sparkles,
  ArrowUpDown,
  RefreshCw,
  Eye,
  EyeOff,
} from 'lucide-react';
import { vehicleApi, API_BASE_URL } from '../../services/api';
import { AdminVehicleForm } from './AdminVehicleForm';
import './admin.css';

export const AdminVehicles = ({ onVehicleUpdated }) => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'INACTIVE'
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadVehicles = async () => {
    setLoading(true);
    try {
      const res = await vehicleApi.adminGetAll();
      setVehicles(res.data?.data || []);
    } catch (err) {
      console.error('Error fetching fleet vehicles:', err);
      showToast(err.response?.data?.message || 'Failed to load fleet vehicles', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  const handleToggleActive = async (vehicle) => {
    setActionLoadingId(vehicle.id);
    const newStatus = !vehicle.isActive;
    try {
      await vehicleApi.update(vehicle.id, { isActive: newStatus });
      showToast(`Vehicle "${vehicle.name}" ${newStatus ? 'activated' : 'deactivated'}`);
      loadVehicles();
      onVehicleUpdated?.();
    } catch (err) {
      console.error('Toggle status error:', err);
      showToast(err.response?.data?.message || 'Failed to update vehicle status', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (vehicle) => {
    if (!window.confirm(`Are you sure you want to deactivate "${vehicle.name}"? Existing bookings will retain historical reference.`)) {
      return;
    }
    setActionLoadingId(vehicle.id);
    try {
      await vehicleApi.delete(vehicle.id);
      showToast(`Vehicle "${vehicle.name}" deactivated successfully`);
      loadVehicles();
      onVehicleUpdated?.();
    } catch (err) {
      console.error('Delete vehicle error:', err);
      showToast(err.response?.data?.message || 'Failed to deactivate vehicle', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenAdd = () => {
    setEditingVehicle(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (vehicle) => {
    setEditingVehicle(vehicle);
    setIsFormOpen(true);
  };

  const filteredVehicles = vehicles.filter((v) => {
    // Status filter
    if (statusFilter === 'ACTIVE' && !v.isActive) return false;
    if (statusFilter === 'INACTIVE' && v.isActive) return false;

    // Category filter
    if (categoryFilter !== 'ALL' && v.category?.toUpperCase() !== categoryFilter) return false;

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = v.name?.toLowerCase().includes(q);
      const matchCategory = v.category?.toLowerCase().includes(q);
      const matchDesc = v.description?.toLowerCase().includes(q);
      return matchName || matchCategory || matchDesc;
    }

    return true;
  });

  const activeCount = vehicles.filter((v) => v.isActive).length;
  const inactiveCount = vehicles.filter((v) => !v.isActive).length;

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
            Fleet Vehicle Management
          </h2>
          <p style={{ fontSize: '0.84rem', color: '#64748B', margin: '0.25rem 0 0 0' }}>
            Manage intercity vehicles, seating capacities, categories and photos for quotes and bookings.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <button
            onClick={loadVehicles}
            className="admin-btn-secondary"
            title="Refresh Fleet List"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', height: '38px', padding: '0 0.85rem' }}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="admin-btn-primary"
            style={{ height: '38px' }}
          >
            <Plus size={16} />
            <span>Add Fleet Vehicle</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="admin-filter-bar">
        {/* Status Tabs */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: `All Vehicles (${vehicles.length})` },
            { id: 'ACTIVE', label: `Active (${activeCount})` },
            { id: 'INACTIVE', label: `Deactivated (${inactiveCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              style={{
                padding: '0.45rem 0.9rem',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: 700,
                border: '1px solid',
                borderColor: statusFilter === tab.id ? '#059669' : '#E2E8F0',
                backgroundColor: statusFilter === tab.id ? '#059669' : '#FFFFFF',
                color: statusFilter === tab.id ? '#FFFFFF' : '#475569',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Category Filter Dropdown */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="admin-input"
            style={{ height: '38px', fontSize: '0.82rem', padding: '0 0.75rem', fontWeight: 600 }}
          >
            <option value="ALL">All Categories</option>
            <option value="SEDAN">Sedans</option>
            <option value="SUV">SUVs</option>
            <option value="LUXURY">Luxury</option>
            <option value="TEMPO_TRAVELLER">Tempo Traveller</option>
            <option value="HATCHBACK">Hatchback</option>
            <option value="MINIBUS">Minibus</option>
          </select>
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', flex: 1, maxWidth: '280px', marginLeft: 'auto' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#94A3B8',
            }}
          />
          <input
            type="text"
            placeholder="Search vehicle by name, type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="admin-input"
            style={{ paddingLeft: '2.4rem', width: '100%', height: '38px' }}
          />
        </div>
      </div>

      {/* Table Content */}
      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: '#94A3B8' }}>
          <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 0.75rem' }} />
          <div>Loading fleet vehicles...</div>
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div className="admin-card" style={{ padding: '3rem', textAlign: 'center' }}>
          <Car size={36} color="#CBD5E1" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#334155' }}>
            No fleet vehicles match your filter
          </h3>
          <p style={{ fontSize: '0.82rem', color: '#94A3B8', maxWidth: '420px', margin: '0.5rem auto 1rem' }}>
            {search ? 'Try clearing your search query.' : 'Click "Add Fleet Vehicle" to add a new car to the fleet.'}
          </p>
          <button onClick={handleOpenAdd} className="admin-btn-primary" style={{ margin: '0 auto' }}>
            <Plus size={16} />
            <span>Add Vehicle</span>
          </button>
        </div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ minWidth: '220px' }}>Vehicle & Model</th>
                <th style={{ minWidth: '110px' }}>Category</th>
                <th style={{ minWidth: '100px' }}>Capacity</th>
                <th style={{ minWidth: '100px' }}>Order</th>
                <th style={{ minWidth: '100px' }}>Status</th>
                <th style={{ minWidth: '110px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.map((v) => {
                const isActionLoading = actionLoadingId === v.id;
                const imgSrc = v.image?.startsWith('/uploads')
                  ? `${API_BASE_URL || ''}${v.image}`
                  : v.image || '/assets/sedan.webp';

                return (
                  <tr key={v.id} style={{ opacity: v.isActive ? 1 : 0.65 }}>
                    {/* Vehicle & Image Preview */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <div
                          style={{
                            width: '54px',
                            height: '38px',
                            borderRadius: '6px',
                            backgroundColor: '#F8FAFC',
                            border: '1px solid #E2E8F0',
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <img
                            src={imgSrc}
                            alt={v.name}
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            onError={(e) => {
                              e.target.src = '/assets/sedan.webp';
                            }}
                          />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.88rem' }}>
                            {v.name}
                          </div>
                          {v.description && (
                            <div
                              style={{
                                fontSize: '0.73rem',
                                color: '#64748B',
                                maxWidth: '320px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                              title={v.description}
                            >
                              {v.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          color: '#047857',
                          backgroundColor: '#ECFDF5',
                          border: '1px solid #A7F3D0',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                          display: 'inline-block',
                        }}
                      >
                        {v.category}
                      </span>
                    </td>

                    {/* Capacity */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#334155', fontWeight: 600, fontSize: '0.84rem' }}>
                        <Users size={14} color="#64748B" />
                        <span>{v.seatingCapacity} Seats</span>
                      </div>
                    </td>

                    {/* Display Order */}
                    <td>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          color: '#475569',
                          backgroundColor: '#F1F5F9',
                          padding: '0.15rem 0.5rem',
                          borderRadius: '4px',
                        }}
                      >
                        #{v.displayOrder || 0}
                      </span>
                    </td>

                    {/* Active Status Toggle */}
                    <td>
                      <button
                        type="button"
                        onClick={() => handleToggleActive(v)}
                        disabled={isActionLoading}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.25rem 0.65rem',
                          borderRadius: '20px',
                          border: '1px solid',
                          borderColor: v.isActive ? '#BBF7D0' : '#E2E8F0',
                          backgroundColor: v.isActive ? '#F0FDF4' : '#F8FAFC',
                          color: v.isActive ? '#15803D' : '#64748B',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                        title={v.isActive ? 'Click to deactivate' : 'Click to activate'}
                      >
                        {isActionLoading ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : v.isActive ? (
                          <CheckCircle2 size={13} color="#16A34A" />
                        ) : (
                          <XCircle size={13} color="#94A3B8" />
                        )}
                        <span>{v.isActive ? 'Active' : 'Inactive'}</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(v)}
                          style={{
                            padding: '0.35rem',
                            border: '1px solid #E2E8F0',
                            backgroundColor: '#FFFFFF',
                            borderRadius: '6px',
                            color: '#0284C7',
                            cursor: 'pointer',
                          }}
                          title="Edit Vehicle"
                        >
                          <Edit2 size={15} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(v)}
                          disabled={isActionLoading}
                          style={{
                            padding: '0.35rem',
                            border: '1px solid #FEE2E2',
                            backgroundColor: '#FEF2F2',
                            borderRadius: '6px',
                            color: '#DC2626',
                            cursor: isActionLoading ? 'not-allowed' : 'pointer',
                          }}
                          title="Deactivate Vehicle"
                        >
                          <Trash2 size={15} />
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

      {/* Add / Edit Vehicle Modal */}
      <AdminVehicleForm
        isOpen={isFormOpen}
        vehicle={editingVehicle}
        onClose={() => setIsFormOpen(false)}
        onSuccess={() => {
          loadVehicles();
          onVehicleUpdated?.();
        }}
      />
    </div>
  );
};

