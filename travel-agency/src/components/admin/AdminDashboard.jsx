import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Tag,
  BookOpen,
  LogOut,
  Car,
  MapPin,
  Plus,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Loader2,
  Calendar,
  Menu,
  X,
} from 'lucide-react';
import { adminFareConfigApi, bookingApi, routeApi, vehicleApi } from '../../services/api';
import { AdminFares } from './AdminFares';
import { AdminLocalVehicles } from './AdminLocalVehicles';
import { AdminBookings } from './AdminBookings';
import { AdminFareForm } from './AdminFareForm';
import './admin.css';

export const AdminDashboard = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('fares'); // 'dashboard' | 'fares' | 'bookings'
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState({
    activeFares: 0,
    vehiclesCount: 0,
    routesCount: 0,
    bookingsCount: 0,
  });
  const [recentFares, setRecentFares] = useState([]);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);

  const adminEmail = localStorage.getItem('adminEmail') || 'admin@punemumbaitravels.in';

  const loadDashboardData = async () => {
    setLoadingDashboard(true);
    try {
      const [faresRes, vehiclesRes, routesRes, bookingsRes] = await Promise.all([
        adminFareConfigApi.getAll().catch(() => ({ data: { data: [] } })),
        vehicleApi.adminGetAll().catch(() => ({ data: { data: [] } })),
        routeApi.adminGetAll().catch(() => ({ data: { data: [] } })),
        bookingApi.adminGetAll().catch(() => ({ data: { data: [] } })),
      ]);

      const allFares = faresRes.data?.data || [];
      const allVehicles = vehiclesRes.data?.data || [];
      const allRoutes = routesRes.data?.data || [];
      const allBookings = bookingsRes.data?.data || [];

      setStats({
        activeFares: allFares.filter((f) => f.isActive).length,
        vehiclesCount: allVehicles.length,
        routesCount: allRoutes.length,
        bookingsCount: allBookings.length,
      });

      setRecentFares(allFares.slice(0, 5));
    } catch (err) {
      console.error('Error loading dashboard stats:', err);
    } finally {
      setLoadingDashboard(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminEmail');
    if (onLogout) {
      onLogout();
    } else {
      window.location.href = '/admin/login';
    }
  };

  return (
    <div className="admin-layout">
      
      {/* Mobile Backdrop Overlay */}
      {isMobileMenuOpen && (
        <div
          className="admin-mobile-backdrop"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* ── Left Sidebar (Responsive Off-Canvas on Mobile) ── */}
      <aside className={`admin-sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        
        {/* Brand Header */}
        <div className="admin-brand">
          <div className="admin-brand-logo">PM</div>
          <div style={{ flex: 1 }}>
            <div className="admin-brand-title">Pune ↔ Mumbai</div>
            <div className="admin-brand-sub">Admin Portal</div>
          </div>
          {/* Close button inside mobile drawer */}
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="admin-sidebar-close-btn"
            title="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <nav className="admin-nav">
          <button
            onClick={() => {
              setActiveTab('dashboard');
              setIsMobileMenuOpen(false);
            }}
            className={`admin-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('fares');
              setIsMobileMenuOpen(false);
            }}
            className={`admin-nav-item ${activeTab === 'fares' ? 'active' : ''}`}
          >
            <Tag size={18} />
            <span>Intercity Fares</span>
            {stats.activeFares > 0 && (
              <span className="admin-nav-badge">{stats.activeFares}</span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab('local');
              setIsMobileMenuOpen(false);
            }}
            className={`admin-nav-item ${activeTab === 'local' ? 'active' : ''}`}
          >
            <Clock size={18} />
            <span>Local Packages</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('bookings');
              setIsMobileMenuOpen(false);
            }}
            className={`admin-nav-item ${activeTab === 'bookings' ? 'active' : ''}`}
          >
            <BookOpen size={18} />
            <span>Bookings</span>
            {stats.bookingsCount > 0 && (
              <span className="admin-nav-badge" style={{ backgroundColor: '#DCFCE7', color: '#15803D' }}>
                {stats.bookingsCount}
              </span>
            )}
          </button>
        </nav>

        {/* User Profile Card */}
        <div className="admin-user-card">
          <div className="admin-user-info">
            <div className="admin-avatar">AD</div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Administrator
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {adminEmail}
              </div>
            </div>
          </div>

          <div className="admin-user-actions">
            <a href="/" target="_blank" rel="noopener noreferrer" className="admin-btn-secondary">
              <ExternalLink size={13} />
              <span>Website</span>
            </a>
            <button onClick={handleLogout} className="admin-btn-logout">
              <LogOut size={13} />
              <span>Logout</span>
            </button>
          </div>
        </div>

      </aside>

      {/* ── Main Workspace ── */}
      <div className="admin-main">
        
        {/* Top Header Bar */}
        <header className="admin-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Mobile Menu Hamburger Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="admin-mobile-menu-btn"
              title="Open Navigation Menu"
            >
              <Menu size={20} />
            </button>

            <div className="admin-breadcrumbs">
              <span>Admin</span>
              <ChevronRight size={14} />
              <span className="admin-breadcrumbs-current">
                {activeTab === 'fares'
                  ? 'Fare Management'
                  : activeTab === 'local'
                  ? 'Local Hourly Packages'
                  : activeTab === 'bookings'
                  ? 'Customer Bookings'
                  : 'Dashboard Overview'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div className="admin-live-badge">
              <div className="admin-live-dot"></div>
              <span>API Live</span>
            </div>

            <button onClick={() => setIsQuickCreateOpen(true)} className="admin-btn-primary admin-header-add-btn">
              <Plus size={16} />
              <span>Add Fare</span>
            </button>
          </div>
        </header>

        {/* Dynamic Main Workspace Content */}
        <main className="admin-content">
          
          {/* TAB 1: DASHBOARD OVERVIEW */}
          {activeTab === 'dashboard' && (
            <div>
              
              {/* Welcome Banner */}
              <div className="admin-banner">
                <div style={{ maxWidth: '650px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                    <Sparkles size={18} color="#BAE6FD" />
                    <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                      Pune ↔ Mumbai Travels Fare Control
                    </h2>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: '#E0F2FE', margin: 0 }}>
                    Configure base fares, tolls, parking, and availability in one unified form. The customer website and booking engine reflect all updates in real-time.
                  </p>
                </div>

                <button
                  onClick={() => setActiveTab('fares')}
                  className="admin-btn-secondary"
                  style={{ height: '40px', padding: '0 1.25rem', fontWeight: 700, fontSize: '0.82rem' }}
                >
                  <Tag size={15} />
                  <span>Go to Fare Management</span>
                </button>
              </div>

              {/* 4 Metric Cards */}
              <div className="admin-stats-grid">
                
                <div className="admin-stat-card">
                  <div className="admin-stat-icon blue">
                    <Tag size={24} />
                  </div>
                  <div>
                    <div className="admin-stat-label">Active Fares</div>
                    <div className="admin-stat-val">{stats.activeFares}</div>
                  </div>
                </div>

                <div className="admin-stat-card">
                  <div className="admin-stat-icon green">
                    <Car size={24} />
                  </div>
                  <div>
                    <div className="admin-stat-label">Fleet Vehicles</div>
                    <div className="admin-stat-val">{stats.vehiclesCount}</div>
                  </div>
                </div>

                <div className="admin-stat-card">
                  <div className="admin-stat-icon amber">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <div className="admin-stat-label">Active Routes</div>
                    <div className="admin-stat-val">{stats.routesCount}</div>
                  </div>
                </div>

                <div className="admin-stat-card">
                  <div className="admin-stat-icon purple">
                    <BookOpen size={24} />
                  </div>
                  <div>
                    <div className="admin-stat-label">Total Bookings</div>
                    <div className="admin-stat-val">{stats.bookingsCount}</div>
                  </div>
                </div>

              </div>

              {/* Recent Fares Table */}
              <div className="admin-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', marginBottom: '1.25rem' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                    Recent Fare Configurations
                  </h3>
                  <button
                    onClick={() => setActiveTab('fares')}
                    style={{ marginLeft: 'auto', fontSize: '0.78rem', fontWeight: 700, color: '#0284C7', display: 'flex', alignItems: 'center', gap: '0.2rem', cursor: 'pointer', background: 'none', border: 'none' }}
                  >
                    <span>View All</span>
                    <ChevronRight size={14} />
                  </button>
                </div>

                {loadingDashboard ? (
                  <div style={{ padding: '3rem', textAlign: 'center', color: '#94A3B8' }}>
                    <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto' }} />
                  </div>
                ) : recentFares.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#94A3B8', fontSize: '0.82rem' }}>
                    No fare configurations created yet.
                  </div>
                ) : (
                  <div className="admin-table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Route</th>
                          <th>Vehicle</th>
                          <th>Base Fare</th>
                          <th>Tolls</th>
                          <th>Total Estimated</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentFares.map((f) => (
                          <tr key={f.id}>
                            <td style={{ fontWeight: 700, color: '#0F172A' }}>
                              {f.route?.routeName}
                            </td>
                            <td>
                              <span style={{ fontWeight: 600 }}>{f.vehicle?.name}</span>
                              <span style={{ fontSize: '0.72rem', color: '#64748B', display: 'block' }}>
                                {f.vehicle?.category}
                              </span>
                            </td>
                            <td style={{ fontWeight: 700 }}>₹{f.baseFare?.toLocaleString()}</td>
                            <td>₹{f.totalToll?.toLocaleString()}</td>
                            <td>
                              <span className="admin-total-badge">₹{f.estimatedTotal?.toLocaleString()}</span>
                            </td>
                            <td>
                              <span className={`admin-status-pill ${f.isActive ? 'available' : 'unavailable'}`}>
                                {f.isActive ? 'Active' : 'Disabled'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: UNIFIED FARE MANAGEMENT */}
          {activeTab === 'fares' && <AdminFares />}

          {/* TAB 3: LOCAL HOURLY PACKAGES */}
          {activeTab === 'local' && <AdminLocalVehicles />}

          {/* TAB 4: BOOKINGS */}
          {activeTab === 'bookings' && <AdminBookings />}

        </main>

      </div>

      {/* Quick Add Fare Modal */}
      <AdminFareForm
        isOpen={isQuickCreateOpen}
        onClose={() => setIsQuickCreateOpen(false)}
        onSuccess={() => {
          loadDashboardData();
          setActiveTab('fares');
        }}
      />

    </div>
  );
};
