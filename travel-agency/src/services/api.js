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
  timeout: 30000, // 30 second timeout prevents premature timeout during remote database queries
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

// Unified Admin Fare Config API with in-flight request deduplication
let inFlightFareConfigsPromise = null;

export const adminFareConfigApi = {
  getAll: (params) => {
    // If no params are passed (full list on mount), reuse the in-flight request
    if (!params || Object.keys(params).length === 0) {
      if (inFlightFareConfigsPromise) {
        return inFlightFareConfigsPromise;
      }
      inFlightFareConfigsPromise = api.get('/fares/admin/configs')
        .finally(() => {
          setTimeout(() => {
            inFlightFareConfigsPromise = null;
          }, 300);
        });
      return inFlightFareConfigsPromise;
    }
    return api.get('/fares/admin/configs', { params });
  },
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

// Public & Admin Locations API with In-Flight De-duplication and Session Caching
let sharedLocationsCache = null;
let sharedLocationsPromise = null;

export const locationApi = {
  getLocations: (side, config = {}) => {
    if (side) {
      return api.get('/locations', { params: { side }, ...config });
    }
    if (sharedLocationsCache && sharedLocationsCache.length > 0) {
      return Promise.resolve({ data: { success: true, data: sharedLocationsCache } });
    }
    if (sharedLocationsPromise) {
      return sharedLocationsPromise;
    }
    sharedLocationsPromise = api
      .get('/locations', config)
      .then((res) => {
        sharedLocationsCache = res.data?.data || [];
        return res;
      })
      .finally(() => {
        sharedLocationsPromise = null;
      });
    return sharedLocationsPromise;
  },
  clearCache: () => {
    sharedLocationsCache = null;
    sharedLocationsPromise = null;
  },
  getDestinations: (pickupId, config = {}) => api.get('/locations/destinations', { params: { pickupId }, ...config }),
  adminGetAll: (config = {}) => api.get('/locations/admin', config),
  create: (data) => {
    locationApi.clearCache();
    return api.post('/locations', data);
  },
  update: (id, data) => {
    locationApi.clearCache();
    return api.put(`/locations/${id}`, data);
  },
  delete: (id) => {
    locationApi.clearCache();
    return api.delete(`/locations/${id}`);
  },
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
      headers: { 'Content-Type': undefined },
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
  getQuote: (params, config = {}) => api.post('/fares/quote', params, config),
  getQuoteGet: (params, config = {}) => api.get('/fares/quote', { params, ...config }),
  adminGetAll: (config = {}) => api.get('/fares/admin/all', config),
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
  createEnquiry: (data) => api.post('/enquiries', data),
  adminGetAll: (params) => api.get('/enquiries/admin', { params }),
  adminUpdateStatus: (id, status) => api.put(`/enquiries/admin/${id}/status`, { status }),
};

export const quoteApi = {
  // Admin endpoints
  adminPrepareQuote: (enquiryId, data) => api.post(`/enquiries/admin/${enquiryId}/quote`, data),
  adminGetQuotes: (enquiryId) => api.get(`/enquiries/admin/${enquiryId}/quotes`),
  adminConvertToBooking: (enquiryId, quoteId) => api.post(`/enquiries/admin/${enquiryId}/quotes/${quoteId}/convert-to-booking`),

  // Public customer endpoints
  getByToken: (token) => api.get(`/quotes/${token}`),
  accept: (token) => api.post(`/quotes/${token}/accept`),
  decline: (token, data) => api.post(`/quotes/${token}/decline`, data),
};

export const seoApi = {
  getPages: () => api.get('/admin/seo/pages', { timeout: 60000 }),
  getPage: (pageKey) => api.get(`/admin/seo/pages/${pageKey}`),
  updatePage: (pageKey, data) => api.put(`/admin/seo/pages/${pageKey}`, data),
  getPublicPages: () => api.get('/seo/public'),
  getAnalyzerOverview: () => api.get('/admin/seo/analyzer/overview', { timeout: 60000 }),
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
      headers: { 'Content-Type': undefined },
    }),
  updateMetadata: (id, data) => api.put(`/media/${id}`, data),
  delete: (id, force = false) => api.delete(`/media/${id}`, { params: { force } }),
};

export default api;


