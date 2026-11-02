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
  MessageSquare,
  Search,
  HelpCircle,
  FileText,
} from 'lucide-react';
import { adminDashboardApi, adminFareConfigApi, bookingApi, routeApi, vehicleApi, enquiryApi, adminBlogApi } from '../../services/api';
import './admin.css';

const AdminFares = React.lazy(() => import('./AdminFares').then(m => ({ default: m.AdminFares })));
const AdminVehicles = React.lazy(() => import('./AdminVehicles').then(m => ({ default: m.AdminVehicles })));
const AdminLocalVehicles = React.lazy(() => import('./AdminLocalVehicles').then(m => ({ default: m.AdminLocalVehicles })));
const AdminBookings = React.lazy(() => import('./AdminBookings').then(m => ({ default: m.AdminBookings })));
const AdminEnquiries = React.lazy(() => import('./AdminEnquiries').then(m => ({ default: m.AdminEnquiries })));
const AdminFareForm = React.lazy(() => import('./AdminFareForm').then(m => ({ default: m.AdminFareForm })));
const AdminWhatsAppSettings = React.lazy(() => import('./AdminWhatsAppSettings').then(m => ({ default: m.AdminWhatsAppSettings })));
const AdminSeo = React.lazy(() => import('./AdminSeo').then(m => ({ default: m.AdminSeo })));
const AdminBlogs = React.lazy(() => import('./AdminBlogs').then(m => ({ default: m.AdminBlogs })));

const AdminTabLoader = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', gap: '0.75rem', color: '#64748B' }}>
    <Loader2 className="animate-spin" size={24} style={{ color: '#0284C7' }} />
    <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>Loading section...</span>
  </div>
);

export const AdminDashboard = ({ onLogout }) => {
  const getInitialTab = () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      const validTabs = ['dashboard', 'fares', 'vehicles', 'local', 'bookings', 'enquiries', 'blogs', 'whatsapp', 'seo'];
      if (tabParam && validTabs.includes(tabParam)) {
        return tabParam;
      }
    } catch {
      // fallback
    }
    return 'dashboard';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [visitedTabs, setVisitedTabs] = useState(() => new Set([getInitialTab()]));
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState({
    activeFares: 0,
    vehiclesCount: 0,
    routesCount: 0,
    bookingsCount: 0,
    enquiriesCount: 0,
    newEnquiriesCount: 0,
    blogsCount: 0,
  });
  const [recentFares, setRecentFares] = useState([]);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);

  useEffect(() => {
    const tabTitles = {
      dashboard: 'Admin Dashboard | AJ Travels',
      fares: 'Intercity Fares | AJ Travels Admin',
      vehicles: 'Fleet Vehicles | AJ Travels Admin',
      local: 'Local Packages | AJ Travels Admin',
      bookings: 'Bookings | AJ Travels Admin',
      enquiries: 'Enquiries | AJ Travels Admin',
      blogs: 'Blog & Travel Guides | AJ Travels Admin',
      whatsapp: 'WhatsApp Settings | AJ Travels Admin',
      seo: 'SEO Management | AJ Travels Admin',
    };
    document.title = tabTitles[activeTab] || 'AJ Travels — Admin Control Panel';
  }, [activeTab]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setVisitedTabs((prev) => {
      const next = new Set(prev);
      next.add(tab);
      return next;
    });

    try {
      const url = new URL(window.location.href);
      if (tab === 'dashboard') {
        url.searchParams.delete('tab');
      } else {
        url.searchParams.set('tab', tab);
      }
      window.history.replaceState({}, '', url.pathname + url.search);
    } catch {
      // ignore
    }
  };

  const adminEmail = localStorage.getItem('adminEmail') || 'admin@ajtravelspune.com';

  const loadDashboardData = async () => {
    setLoadingDashboard(true);
    try {
      // 1. Try aggregated dashboard stats endpoint first (1 single fast query)
      const fastStats = await adminDashboardApi.getStats().catch(() => null);
      if (fastStats?.data?.success && fastStats.data.data?.stats) {
        setStats(fastStats.data.data.stats);
        setRecentFares(fastStats.data.data.recentFares || []);
        return;
      }

      const [faresRes, vehiclesRes, routesRes, bookingsRes, enquiriesRes, blogsRes] = await Promise.all([
        adminFareConfigApi.getAll().catch(() => ({ data: { data: [] } })),
        vehicleApi.adminGetAll().catch(() => ({ data: { data: [] } })),
        routeApi.adminGetAll().catch(() => ({ data: { data: [] } })),
        bookingApi.adminGetAll().catch(() => ({ data: { data: [] } })),
        enquiryApi.adminGetAll().catch(() => ({ data: { data: [] } })),
        adminBlogApi.getAll().catch(() => ({ data: { data: [], stats: { publishedCount: 0 } } })),
      ]);

      const allFares = faresRes.data?.data || [];
      const allVehicles = vehiclesRes.data?.data || [];
      const allRoutes = routesRes.data?.data || [];
      const allBookings = bookingsRes.data?.data || [];
      const allEnquiries = enquiriesRes.data?.data || [];
      const newEnquiries = allEnquiries.filter((e) => e.status === 'NEW').length;
      const publishedBlogs = blogsRes.data?.stats?.publishedCount ?? (blogsRes.data?.data || []).filter(b => b.isPublished).length;

      setStats({
        activeFares: allFares.filter((f) => f.isActive).length,
        vehiclesCount: allVehicles.length,
        routesCount: allRoutes.length,
        bookingsCount: allBookings.length,
        enquiriesCount: allEnquiries.length,
        newEnquiriesCount: newEnquiries,
        blogsCount: publishedBlogs,
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
    import('./AdminFareForm').then(m => m.prefetchFareFormData && m.prefetchFareFormData());
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
      
      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="admin-mobile-backdrop"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* ── Left Sidebar ── */}
      <aside className={`admin-sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        
        {/* Brand Logo & Title */}
        <div className="admin-brand">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div className="admin-logo-badge">
                <span style={{ fontWeight: 900, color: '#FFFFFF', fontSize: '1.05rem', letterSpacing: '-0.03em' }}>AJ</span>
              </div>
              <div>
                <h1 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#FFFFFF', margin: 0, letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                  AJ TRAVELS
                </h1>
                <div style={{ fontSize: '0.65rem', fontWeight: 600, color: '#38BDF8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  CONTROL PANEL
                </div>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="admin-mobile-close-btn"
              title="Close Navigation"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="admin-nav">
          <button
            onClick={() => {
              handleTabChange('dashboard');
              setIsMobileMenuOpen(false);
            }}
            className={`admin-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => {
              handleTabChange('fares');
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
              handleTabChange('vehicles');
              setIsMobileMenuOpen(false);
            }}
            className={`admin-nav-item ${activeTab === 'vehicles' ? 'active' : ''}`}
          >
            <Car size={18} />
            <span>Fleet Vehicles</span>
            {stats.vehiclesCount > 0 && (
              <span className="admin-nav-badge" style={{ backgroundColor: '#ECFDF5', color: '#047857' }}>
                {stats.vehiclesCount}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              handleTabChange('local');
              setIsMobileMenuOpen(false);
            }}
            className={`admin-nav-item ${activeTab === 'local' ? 'active' : ''}`}
          >
            <Clock size={18} />
            <span>Local Packages</span>
          </button>

          <button
            onClick={() => {
              handleTabChange('bookings');
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

          <button
            onClick={() => {
              handleTabChange('enquiries');
              setIsMobileMenuOpen(false);
            }}
            className={`admin-nav-item ${activeTab === 'enquiries' ? 'active' : ''}`}
          >
            <HelpCircle size={18} />
            <span>Enquiries</span>
            {stats.newEnquiriesCount > 0 ? (
              <span className="admin-nav-badge" style={{ backgroundColor: '#FEF3C7', color: '#B45309' }}>
                {stats.newEnquiriesCount} New
              </span>
            ) : stats.enquiriesCount > 0 ? (
              <span className="admin-nav-badge" style={{ backgroundColor: '#E0F2FE', color: '#0369A1' }}>
                {stats.enquiriesCount}
              </span>
            ) : null}
          </button>

          <button
            onClick={() => {
              handleTabChange('blogs');
              setIsMobileMenuOpen(false);
            }}
            className={`admin-nav-item ${activeTab === 'blogs' ? 'active' : ''}`}
          >
            <FileText size={18} />
            <span>Blog Management</span>
            {stats.blogsCount > 0 && (
              <span className="admin-nav-badge" style={{ backgroundColor: '#EDE9FE', color: '#6D28D9' }}>
                {stats.blogsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              handleTabChange('whatsapp');
              setIsMobileMenuOpen(false);
            }}
            className={`admin-nav-item ${activeTab === 'whatsapp' ? 'active' : ''}`}
          >
            <MessageSquare size={18} />
            <span>WhatsApp Integration</span>
          </button>

          <button
            onClick={() => {
              handleTabChange('seo');
              setIsMobileMenuOpen(false);
            }}
            className={`admin-nav-item ${activeTab === 'seo' ? 'active' : ''}`}
          >
            <Search size={18} />
            <span>SEO Management</span>
          </button>
        </nav>

        {/* User Profile Card */}
        <div className="admin-user-card">
          <div className="admin-user-info">
            <div className="admin-avatar">AD</div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '0.01em' }}>
                Administrator
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
                  : activeTab === 'vehicles'
                  ? 'Fleet Vehicle Management'
                  : activeTab === 'local'
                  ? 'Local Hourly Packages'
                  : activeTab === 'bookings'
                  ? 'Customer Bookings'
                  : activeTab === 'enquiries'
                  ? 'Customer Enquiries'
                  : activeTab === 'blogs'
                  ? 'Blog Management'
                  : activeTab === 'whatsapp'
                  ? 'WhatsApp Integration'
                  : activeTab === 'seo'
                  ? 'SEO Management'
                  : 'Dashboard Overview'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div className="admin-live-badge">
              <div className="admin-live-dot"></div>
              <span>API Live</span>
            </div>

            {(activeTab === 'fares' || activeTab === 'local') && (
              <button onClick={() => setIsQuickCreateOpen(true)} className="admin-btn-primary admin-header-add-btn">
                <Plus size={16} />
                <span>Add Fare</span>
              </button>
            )}
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
                      AJ Travels — Fares & Vehicle Rental Control
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

              {/* 6 Metric Cards */}
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

                <div
                  className="admin-stat-card"
                  onClick={() => handleTabChange('vehicles')}
                  style={{ cursor: 'pointer' }}
                  title="Click to view Fleet Vehicles"
                >
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

                <div className="admin-stat-card">
                  <div className="admin-stat-icon" style={{ backgroundColor: '#FEF3C7', color: '#B45309' }}>
                    <HelpCircle size={24} />
                  </div>
                  <div>
                    <div className="admin-stat-label">Customer Enquiries</div>
                    <div className="admin-stat-val" style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                      <span>{stats.enquiriesCount}</span>
                      {stats.newEnquiriesCount > 0 && (
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#B45309' }}>
                          ({stats.newEnquiriesCount} New)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div
                  className="admin-stat-card"
                  onClick={() => handleTabChange('blogs')}
                  style={{ cursor: 'pointer' }}
                  title="Click to view Blog Management"
                >
                  <div className="admin-stat-icon" style={{ backgroundColor: '#EDE9FE', color: '#6D28D9' }}>
                    <FileText size={24} />
                  </div>
                  <div>
                    <div className="admin-stat-label">Blog Articles</div>
                    <div className="admin-stat-val">{stats.blogsCount}</div>
                  </div>
                </div>

              </div>

              {/* Recent Fares Table */}
              <div className="admin-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
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
                          <th>Trip Type</th>
                          <th>Base Fare</th>
                          <th>Customer Quote</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentFares.map((fare) => (
                          <tr key={fare.id}>
                            <td>
                              <span style={{ fontWeight: 700, color: '#0F172A' }}>
                                {fare.route?.origin?.name} → {fare.route?.destination?.name}
                              </span>
                            </td>
                            <td>
                              <span style={{ fontWeight: 600 }}>{fare.vehicle?.name}</span>
                            </td>
                            <td>
                              <span className="admin-badge badge-blue">
                                {fare.tripType === 'ONE_WAY' ? 'One Way' : 'Round Trip'}
                              </span>
                            </td>
                            <td>
                              <span style={{ fontWeight: 700, color: '#0F172A' }}>
                                ₹{fare.baseFare?.toLocaleString('en-IN')}
                              </span>
                            </td>
                            <td>
                              <span style={{ fontWeight: 800, color: '#0284C7' }}>
                                ₹{fare.calculatedTotal?.toLocaleString('en-IN')}
                              </span>
                            </td>
                            <td>
                              <span className={`admin-badge ${fare.isActive ? 'badge-green' : 'badge-gray'}`}>
                                {fare.isActive ? 'Active' : 'Disabled'}
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

          <React.Suspense fallback={<AdminTabLoader />}>
            {/* TAB 2: INTERCITY FARES */}
            <div style={{ display: activeTab === 'fares' ? 'block' : 'none' }}>
              {(visitedTabs.has('fares') || activeTab === 'fares') && <AdminFares />}
            </div>

            {/* TAB: FLEET VEHICLES */}
            <div style={{ display: activeTab === 'vehicles' ? 'block' : 'none' }}>
              {(visitedTabs.has('vehicles') || activeTab === 'vehicles') && (
                <AdminVehicles onVehicleUpdated={loadDashboardData} />
              )}
            </div>

            {/* TAB 3: LOCAL HOURLY PACKAGES */}
            <div style={{ display: activeTab === 'local' ? 'block' : 'none' }}>
              {(visitedTabs.has('local') || activeTab === 'local') && <AdminLocalVehicles />}
            </div>

            {/* TAB 4: BOOKINGS */}
            <div style={{ display: activeTab === 'bookings' ? 'block' : 'none' }}>
              {(visitedTabs.has('bookings') || activeTab === 'bookings') && <AdminBookings />}
            </div>

            {/* TAB: ENQUIRIES */}
            <div style={{ display: activeTab === 'enquiries' ? 'block' : 'none' }}>
              {(visitedTabs.has('enquiries') || activeTab === 'enquiries') && <AdminEnquiries />}
            </div>

            {/* TAB: BLOG MANAGEMENT */}
            <div style={{ display: activeTab === 'blogs' ? 'block' : 'none' }}>
              {(visitedTabs.has('blogs') || activeTab === 'blogs') && (
                <AdminBlogs onBlogUpdated={loadDashboardData} />
              )}
            </div>

            {/* TAB 5: WHATSAPP INTEGRATION */}
            <div style={{ display: activeTab === 'whatsapp' ? 'block' : 'none' }}>
              {(visitedTabs.has('whatsapp') || activeTab === 'whatsapp') && <AdminWhatsAppSettings />}
            </div>

            {/* TAB 6: SEO MANAGEMENT */}
            <div style={{ display: activeTab === 'seo' ? 'block' : 'none' }}>
              {(visitedTabs.has('seo') || activeTab === 'seo') && <AdminSeo />}
            </div>
          </React.Suspense>

        </main>

      </div>

      {/* Quick Add Fare Modal */}
      <React.Suspense fallback={null}>
        <AdminFareForm
          isOpen={isQuickCreateOpen}
        onClose={() => setIsQuickCreateOpen(false)}
        onSuccess={() => {
          loadDashboardData();
          setActiveTab('fares');
        }}
      />
      </React.Suspense>

    </div>
  );
};
