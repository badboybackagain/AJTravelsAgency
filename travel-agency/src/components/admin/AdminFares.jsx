import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Copy,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Car,
  MapPin,
  RefreshCw,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';
import { adminFareConfigApi, API_BASE_URL } from '../../services/api';
import { AdminFareForm, prefetchFareFormData } from './AdminFareForm';
import './admin.css';

export const AdminFares = () => {
  const [fares, setFares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, ACTIVE, INACTIVE
  const [tripTypeFilter, setTripTypeFilter] = useState('ALL'); // ALL, ONE_WAY, ROUND_TRIP
  
  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFare, setEditingFare] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [successToast, setSuccessToast] = useState('');

  const fetchFares = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminFareConfigApi.getAll();
      setFares(res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load fare configurations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFares();
    prefetchFareFormData();
  }, []);

  const showToast = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 4000);
  };

  const handleOpenCreate = () => {
    setEditingFare(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (fare) => {
    setEditingFare(fare);
    setIsFormOpen(true);
  };

  const handleDuplicate = async (fareId) => {
    setActionLoadingId(fareId);
    try {
      await adminFareConfigApi.duplicate(fareId);
      showToast('Fare duplicated successfully!');
      fetchFares();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to duplicate fare');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleStatus = async (fare) => {
    setActionLoadingId(fare.id);
    try {
      await adminFareConfigApi.toggleStatus(fare.id, !fare.isActive);
      showToast(`Fare ${!fare.isActive ? 'activated' : 'deactivated'}!`);
      fetchFares();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update fare');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (fare) => {
    if (!window.confirm('Are you sure you want to delete this fare?')) {
      return;
    }

    setActionLoadingId(fare.id);
    try {
      await adminFareConfigApi.delete(fare.id);
      showToast('Fare deleted successfully!');
      fetchFares();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete fare');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filtered fares
  const filteredFares = fares.filter((f) => {
    // Status filter
    if (statusFilter === 'ACTIVE' && !f.isActive) return false;
    if (statusFilter === 'INACTIVE' && f.isActive) return false;

    // Trip type filter
    if (tripTypeFilter !== 'ALL' && f.tripType !== tripTypeFilter) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const routeMatch = f.route?.routeName?.toLowerCase().includes(q) ||
        f.route?.pickupLocation?.name?.toLowerCase().includes(q) ||
        f.route?.dropLocation?.name?.toLowerCase().includes(q);
      const vehicleMatch = f.vehicle?.name?.toLowerCase().includes(q) ||
        f.vehicle?.category?.toLowerCase().includes(q);
      const tripMatch = f.tripType?.toLowerCase().includes(q) ||
        (f.tripType === 'ONE_WAY' ? 'one way' : 'round trip').includes(q);
      return routeMatch || vehicleMatch || tripMatch;
    }
    return true;
  });

  return (
    <div>
      
      {/* Toast Notification */}
      {successToast && (
        <div style={{
          position: 'fixed',
          top: '1.5rem',
          right: '1.5rem',
          zIndex: 99,
          backgroundColor: '#059669',
          color: '#FFFFFF',
          padding: '0.85rem 1.5rem',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
          fontWeight: 600,
          fontSize: '0.85rem'
        }}>
          <CheckCircle size={18} color="#D1FAE5" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Top Banner & Primary Action */}
      <div className="admin-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              Unified Fare Management
            </h1>
            <span style={{
              padding: '0.2rem 0.65rem',
              borderRadius: '9999px',
              backgroundColor: '#E0F2FE',
              color: '#0369A1',
              fontSize: '0.75rem',
              fontWeight: 800
            }}>
              {fares.length} Configs
            </span>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#64748B', margin: '0.35rem 0 0 0' }}>
            Single control hub to configure routes, fleet vehicles, base pricing, tolls, parking, stay & availability.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={fetchFares}
            disabled={loading}
            className="admin-btn-secondary"
            style={{ height: '42px', padding: '0 1rem' }}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button onClick={handleOpenCreate} className="admin-btn-primary">
            <Plus size={16} />
            <span>+ ADD FARE CONFIGURATION</span>
          </button>
        </div>
      </div>

      {/* Toolbar: Search and Status Filters */}
      <div className="admin-toolbar">
        
        {/* Search input */}
        <div className="admin-search-wrapper">
          <Search size={16} className="admin-search-icon" />
          <input
            type="text"
            placeholder="Search route, vehicle, location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="admin-search-input"
          />
        </div>

        {/* Status filters */}
        <div className="admin-filter-pills">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`admin-filter-btn ${statusFilter === 'ALL' ? 'active' : ''}`}
          >
            All Fares ({fares.length})
          </button>
          <button
            onClick={() => setStatusFilter('ACTIVE')}
            className={`admin-filter-btn ${statusFilter === 'ACTIVE' ? 'active' : ''}`}
          >
            Active ({fares.filter((f) => f.isActive).length})
          </button>
          <button
            onClick={() => setStatusFilter('INACTIVE')}
            className={`admin-filter-btn ${statusFilter === 'INACTIVE' ? 'active' : ''}`}
          >
            Disabled ({fares.filter((f) => !f.isActive).length})
          </button>
          <span style={{ color: '#CBD5E1', margin: '0 0.25rem' }}>|</span>
          <button
            onClick={() => setTripTypeFilter('ALL')}
            className={`admin-filter-btn ${tripTypeFilter === 'ALL' ? 'active' : ''}`}
          >
            All Modes
          </button>
          <button
            onClick={() => setTripTypeFilter('ONE_WAY')}
            className={`admin-filter-btn ${tripTypeFilter === 'ONE_WAY' ? 'active' : ''}`}
          >
            One Way ({fares.filter((f) => f.tripType === 'ONE_WAY').length})
          </button>
          <button
            onClick={() => setTripTypeFilter('ROUND_TRIP')}
            className={`admin-filter-btn ${tripTypeFilter === 'ROUND_TRIP' ? 'active' : ''}`}
          >
            Round Trip ({fares.filter((f) => f.tripType === 'ROUND_TRIP').length})
          </button>
        </div>

      </div>

      {/* Main Fare Table */}
      <div className="admin-table-container">
        
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#94A3B8' }}>
            <Loader2 size={30} className="animate-spin text-sky-500" style={{ margin: '0 auto 0.75rem auto' }} />
            <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Loading fare configurations...</div>
          </div>
        ) : error ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#E11D48' }}>
            <AlertCircle size={28} style={{ margin: '0 auto 0.5rem auto' }} />
            <div style={{ fontWeight: 700 }}>{error}</div>
            <button onClick={fetchFares} className="admin-btn-secondary" style={{ marginTop: '1rem' }}>
              Try Again
            </button>
          </div>
        ) : filteredFares.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', color: '#64748B' }}>
            <Car size={36} color="#CBD5E1" style={{ margin: '0 auto 0.75rem auto' }} />
            <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0F172A', marginBottom: '0.35rem' }}>
              No Fare Configurations Found
            </div>
            <p style={{ fontSize: '0.8rem', color: '#94A3B8', maxWidth: '360px', margin: '0 auto 1.25rem auto' }}>
              {searchQuery ? 'No fares matched your search terms.' : 'Create your first route and vehicle pricing configuration.'}
            </p>
            <button onClick={handleOpenCreate} className="admin-btn-primary">
              + Create First Fare
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ minWidth: '220px' }}>Route & Origin/Destination</th>
                  <th style={{ minWidth: '200px' }}>Vehicle & Class</th>
                  <th style={{ minWidth: '110px' }}>Base Fare</th>
                  <th style={{ minWidth: '110px' }}>Tolls</th>
                  <th style={{ minWidth: '140px' }}>Parking / Stay</th>
                  <th style={{ minWidth: '130px' }}>
                    Estimated Total
                    <span style={{ fontSize: '0.68rem', fontWeight: 500, color: '#64748B', display: 'block' }}>
                      (incl. 1 hr waiting)
                    </span>
                  </th>
                  <th style={{ minWidth: '140px' }}>Availability</th>
                  <th style={{ minWidth: '130px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFares.map((f) => {
                  const isActionLoading = actionLoadingId === f.id;
                  const vehicleImgUrl = f.vehicle?.image?.startsWith('/uploads')
                    ? `${API_BASE_URL}${f.vehicle.image}`
                    : (f.vehicle?.image || '/assets/sedan.webp');

                  const isAvail = f.availability?.status === 'AVAILABLE';
                  const isLimited = f.availability?.status === 'LIMITED';

                  return (
                    <tr key={f.id} style={{ opacity: f.isActive ? 1 : 0.65 }}>
                      
                      {/* Route */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.88rem' }}>
                            {f.route?.routeName || 'Unnamed Route'}
                          </span>
                          <span
                            style={{
                              fontSize: '0.66rem',
                              fontWeight: 800,
                              padding: '0.12rem 0.45rem',
                              borderRadius: '6px',
                              letterSpacing: '0.04em',
                              backgroundColor: f.tripType === 'ROUND_TRIP' ? '#EEF2FF' : '#ECFDF5',
                              color: f.tripType === 'ROUND_TRIP' ? '#4F46E5' : '#059669',
                              border: f.tripType === 'ROUND_TRIP' ? '1px solid #C7D2FE' : '1px solid #A7F3D0',
                            }}
                          >
                            {f.tripType === 'ROUND_TRIP' ? 'ROUND TRIP' : 'ONE WAY'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.25rem' }}>
                          <MapPin size={12} color="#0284C7" />
                          <span>{f.route?.pickupLocation?.name || 'Pickup'}</span>
                          <span style={{ color: '#94A3B8' }}>➔</span>
                          <span>{f.route?.dropLocation?.name || 'Drop'}</span>
                        </div>
                      </td>

                      {/* Vehicle */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <img
                            src={vehicleImgUrl}
                            alt={f.vehicle?.name || 'Vehicle'}
                            className="admin-table-vehicle-img"
                            onError={(e) => { e.target.src = '/assets/sedan.webp'; }}
                          />
                          <div>
                            <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.86rem' }}>
                              {f.vehicle?.name}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '0.15rem' }}>
                              <span style={{ fontWeight: 800, color: '#0284C7' }}>{f.vehicle?.category}</span> • {f.vehicle?.seatingCapacity} Seats
                            </div>
                          </div>
                        </div>
                      </td>
 
                      {/* Base Fare */}
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <span style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.92rem' }}>
                          ₹{f.baseFare?.toLocaleString()}
                        </span>
                      </td>

                      {/* Tolls */}
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {f.totalToll > 0 ? (
                          <div>
                            <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.86rem' }}>
                              ₹{f.totalToll?.toLocaleString()}
                            </div>
                            <div style={{ fontSize: '0.68rem', color: '#94A3B8' }}>
                              ({f.tolls?.length || 0} tolls)
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>No tolls</span>
                        )}
                      </td>

                      {/* Parking / Stay */}
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                          {f.parking?.enabled ? (
                            <span style={{ color: '#0284C7', fontWeight: 700, fontSize: '0.75rem' }}>
                              Parking: ₹{f.parking.amount}
                            </span>
                          ) : (
                            <span style={{ color: '#94A3B8', fontSize: '0.72rem' }}>Parking: Incl.</span>
                          )}
                          {f.waiting?.enabled ? (
                            <span style={{ color: '#D97706', fontWeight: 600, fontSize: '0.74rem' }}>
                              Stay: ₹{f.waiting.perHourCharge}/hr
                            </span>
                          ) : (
                            <span style={{ color: '#94A3B8', fontSize: '0.72rem' }}>Stay: Incl.</span>
                          )}
                        </div>
                      </td>

                      {/* Calculated Estimated Total */}
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <span
                          className="admin-total-badge"
                          title={`Base (₹${f.baseFare}) + Tolls (₹${f.totalToll}) + Parking (₹${f.parking?.amount || 0}) + 1 hr Waiting (₹${f.waiting?.perHourCharge || 0})`}
                        >
                          ₹{f.estimatedTotal?.toLocaleString()}
                        </span>
                        <span style={{ fontSize: '0.68rem', color: '#64748B', display: 'block', marginTop: '0.2rem' }}>
                          Cust. quote: ₹{(f.baseFare + f.totalToll + (f.parking?.enabled ? f.parking.amount : 0))?.toLocaleString()}
                        </span>
                      </td>

                      {/* Availability */}
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <span className={`admin-status-pill ${
                          !f.isActive
                            ? 'unavailable'
                            : isAvail
                            ? 'available'
                            : isLimited
                            ? 'limited'
                            : 'unavailable'
                        }`}>
                          <span style={{ fontSize: '0.6rem' }}>{!f.isActive ? '○' : '●'}</span>
                          <span>
                            {!f.isActive
                              ? 'Inactive'
                              : `${isLimited ? 'Limited' : 'Available'} (${f.availability?.availableQuantity ?? 1})`}
                          </span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <button
                            onClick={() => handleOpenEdit(f)}
                            disabled={isActionLoading}
                            className="admin-action-btn edit"
                            title="Edit Fare Configuration"
                          >
                            <Edit2 size={13} />
                          </button>

                          <button
                            onClick={() => handleDuplicate(f.id)}
                            disabled={isActionLoading}
                            className="admin-action-btn copy"
                            title="Duplicate Fare Configuration"
                          >
                            <Copy size={13} />
                          </button>

                          <button
                            onClick={() => handleToggleStatus(f)}
                            disabled={isActionLoading}
                            className="admin-action-btn"
                            style={{
                              backgroundColor: f.isActive ? '#FEF3C7' : '#DCFCE7',
                              color: f.isActive ? '#B45309' : '#15803D',
                              borderColor: f.isActive ? '#FDE68A' : '#BBF7D0',
                            }}
                            title={f.isActive ? 'Deactivate Fare' : 'Activate Fare'}
                          >
                            {f.isActive ? <XCircle size={13} /> : <CheckCircle size={13} />}
                          </button>

                          <button
                            onClick={() => handleDelete(f)}
                            disabled={isActionLoading}
                            className="admin-action-btn delete"
                            title="Permanently Delete Fare"
                          >
                            <Trash2 size={13} />
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

      </div>

      {/* Form Modal */}
      <AdminFareForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={() => {
          showToast(editingFare ? 'Fare configuration updated successfully!' : 'New fare configuration created successfully!');
          fetchFares();
        }}
        initialData={editingFare}
      />

    </div>
  );
};
