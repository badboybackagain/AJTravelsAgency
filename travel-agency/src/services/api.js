import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

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

export default api;
