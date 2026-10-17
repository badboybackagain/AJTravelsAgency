import axios from 'axios';

// Support both VITE_API_BASE_URL (standard) and VITE_API_URL (handoff documentation).
// In development, fallback to 'http://localhost:3001' if unconfigured.
// In production builds, default to '' (relative path) to prevent hardcoding localhost into client bundle.
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:3001' : '');

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add JWT token interceptor for admin routes
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response error handler
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
        localStorage.removeItem('adminToken');
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

// Unified Admin Fare Config API
export const adminFareConfigApi = {
  getAll: (params) => api.get('/fares/admin/configs', { params }),
  getById: (id) => api.get(`/fares/admin/configs/${id}`),
  create: (data) => api.post('/fares/admin/configs', data),
  update: (id, data) => api.put(`/fares/admin/configs/${id}`, data),
  toggleStatus: (id, isActive) => api.patch(`/fares/admin/configs/${id}/toggle-status`, { isActive }),
  delete: (id) => api.delete(`/fares/admin/configs/${id}`),
  duplicate: (id) => api.post(`/fares/admin/configs/${id}/duplicate`),
};

// Admin Local Vehicles API (Hourly Packages)
export const adminLocalVehicleApi = {
  getAll: (params) => api.get('/admin/local-vehicles', { params }),
  getById: (id) => api.get(`/admin/local-vehicles/${id}`),
  create: (data) => api.post('/admin/local-vehicles', data),
  update: (id, data) => api.put(`/admin/local-vehicles/${id}`, data),
  delete: (id) => api.delete(`/admin/local-vehicles/${id}`),
};

// Public Local Vehicles API (Hourly Packages)
export const localVehicleApi = {
  getAll: (params) => api.get('/local-vehicles', { params }),
  getById: (id) => api.get(`/local-vehicles/${id}`),
};

// Public & Admin Locations API
export const locationApi = {
  getLocations: (side) => api.get('/locations', { params: { side } }),
  getDestinations: (pickupId) => api.get('/locations/destinations', { params: { pickupId } }),
  adminGetAll: () => api.get('/locations/admin'),
  create: (data) => api.post('/locations', data),
  update: (id, data) => api.put(`/locations/${id}`, data),
  delete: (id) => api.delete(`/locations/${id}`),
};

// Fleet Vehicles API
export const vehicleApi = {
  getAll: () => api.get('/vehicles'),
  getById: (id) => api.get(`/vehicles/${id}`),
  adminGetAll: () => api.get('/vehicles/admin/all'),
  create: (data) => api.post('/vehicles', data),
  update: (id, data) => api.put(`/vehicles/${id}`, data),
  delete: (id) => api.delete(`/vehicles/${id}`),
  uploadImage: (formData) =>
    api.post('/vehicles/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// Routes API
export const routeApi = {
  getAll: () => api.get('/routes'),
  adminGetAll: () => api.get('/routes/admin'),
  create: (data) => api.post('/routes', data),
  update: (id, data) => api.put(`/routes/${id}`, data),
  delete: (id) => api.delete(`/routes/${id}`),
};

// Fare Quote API
export const fareApi = {
  getQuote: (params) => api.post('/fares/quote', params),
  getQuoteGet: (params) => api.get('/fares/quote', { params }),
  adminGetAll: () => api.get('/fares/admin/all'),
  create: (data) => api.post('/fares', data),
  update: (id, data) => api.put(`/fares/${id}`, data),
  delete: (id) => api.delete(`/fares/${id}`),
};

// Bookings API
export const bookingApi = {
  create: (data) => api.post('/bookings', data),
  adminGetAll: (params) => api.get('/bookings/admin', { params }),
  updateStatus: (id, status) => api.put(`/bookings/admin/${id}/status`, { status }),
};

export const grandDealsApi = {
  getDeals: () => api.get('/grand-deals'),
};

export const availabilityApi = {
  getAvailability: (params) => api.get('/availability', { params }),
  adminGetAll: (params) => api.get('/availability/admin', { params }),
  create: (data) => api.post('/availability', data),
  update: (id, data) => api.put(`/availability/${id}`, data),
  delete: (id) => api.delete(`/availability/${id}`),
};

export const tollApi = {
  getTolls: (routeId) => api.get('/tolls', { params: { routeId } }),
  adminGetAll: () => api.get('/tolls/admin'),
  create: (data) => api.post('/tolls', data),
  update: (id, data) => api.put(`/tolls/${id}`, data),
  delete: (id) => api.delete(`/tolls/${id}`),
};

export const parkingApi = {
  adminGetAll: () => api.get('/parking/admin'),
  create: (data) => api.post('/parking', data),
  update: (id, data) => api.put(`/parking/${id}`, data),
  delete: (id) => api.delete(`/parking/${id}`),
};

export const waitingApi = {
  adminGetAll: () => api.get('/waiting/admin'),
  create: (data) => api.post('/waiting', data),
  update: (id, data) => api.put(`/waiting/${id}`, data),
  delete: (id) => api.delete(`/waiting/${id}`),
};

export const auditApi = {
  getLogs: (params) => api.get('/audit', { params }),
};

export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  signup: (data) => api.post('/auth/signup', data),
  me: () => api.get('/auth/me'),
};

export const adminWhatsAppApi = {
  getSettings: () => api.get('/admin/whatsapp/settings'),
  updateSettings: (data) => api.put('/admin/whatsapp/settings', data),
  verifyConnection: (data) => api.post('/admin/whatsapp/verify', data, { timeout: 60000 }),
  toggle: (isEnabled) => api.patch('/admin/whatsapp/toggle', { isEnabled }),
  test: (destinationNumber) => api.post('/admin/whatsapp/test', { destinationNumber }),
  getLogs: () => api.get('/admin/whatsapp/logs'),
};

export const otpApi = {
  send: (phone) => api.post('/otp/send', { phone }),
  verify: (phone, otp) => api.post('/otp/verify', { phone, otp }),
};

export const enquiryApi = {
  create: (data) => api.post('/enquiries', data),
  adminGetAll: () => api.get('/enquiries/admin'),
  adminUpdateStatus: (id, status) => api.put(`/enquiries/admin/${id}/status`, { status }),
};

export const seoApi = {
  getPages: () => api.get('/admin/seo/pages'),
  getPage: (pageKey) => api.get(`/admin/seo/pages/${pageKey}`),
  updatePage: (pageKey, data) => api.put(`/admin/seo/pages/${pageKey}`, data),
  getPublicPages: () => api.get('/seo/public'),
  getAnalyzerOverview: () => api.get('/admin/seo/analyzer/overview'),
  analyzeAll: () => api.post('/admin/seo/analyzer/analyze-all'),
  analyzePage: (pageKey) => api.post('/admin/seo/analyzer/analyze-page', { pageKey }),
  getPageAnalysis: (pageKey) => api.get(`/admin/seo/analyzer/page/${pageKey}`),
  getIntegrations: () => api.get('/admin/seo/analyzer/integrations'),
};

export const gscApi = {
  getStatus: () => api.get('/admin/seo/gsc/status'),
  getAuthUrl: () => api.get('/admin/seo/gsc/auth-url'),
  disconnect: () => api.post('/admin/seo/gsc/disconnect'),
  getProperties: () => api.get('/admin/seo/gsc/properties'),
  selectProperty: (siteUrl) => api.post('/admin/seo/gsc/select-property', { siteUrl }),
  getPerformance: (params) => api.get('/admin/seo/gsc/performance', { params }),
  refreshData: (data) => api.post('/admin/seo/gsc/refresh', data),
};

export const mediaApi = {
  getAll: (params) => api.get('/media', { params }),
  getById: (id) => api.get(`/media/${id}`),
  upload: (formData) =>
    api.post('/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  updateMetadata: (id, data) => api.put(`/media/${id}`, data),
  delete: (id, force = false) => api.delete(`/media/${id}`, { params: { force } }),
};

export default api;


