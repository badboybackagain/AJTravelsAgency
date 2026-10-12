// ============================================================
// Express App Configuration
// Pune ↔ Mumbai Private Travel Backend
// ============================================================

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { errorHandler } = require('./middleware/errorHandler');

const path = require('path');

// Route imports
const authRoutes = require('./routes/authRoutes');
const locationRoutes = require('./routes/locationRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');
const routeRoutes = require('./routes/routeRoutes');
const fareRoutes = require('./routes/fareRoutes');
const miscRoutes = require('./routes/miscRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const adminLocalVehicleRoutes = require('./routes/adminLocalVehicleRoutes');
const localVehicleRoutes = require('./routes/localVehicleRoutes');

const app = express();

// ============================================================
// STATIC FILES (Uploads)
// ============================================================
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));


// ============================================================
// SECURITY MIDDLEWARE
// ============================================================

// Helmet — sets secure HTTP headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS — allow frontend origins
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, server-to-server) or any localhost port
    if (!origin || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      callback(null, true);
    } else {
      callback(null, true); // Dev-permissive
    }
  },
  credentials: true,
}));

// Global rate limiter — prevent DDoS
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  message: { success: false, message: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// ============================================================
// REQUEST PARSING
// ============================================================
app.use(express.json({ limit: '10kb' })); // Limit payload size
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ============================================================
// ROOT & HEALTH CHECK
// ============================================================
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to Pune ↔ Mumbai Private Travel API',
    health: 'http://localhost:3001/health',
    documentation: 'Use frontend at http://localhost:8080 or admin at http://localhost:8080/admin/login'
  });
});

app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    service: 'Pune Mumbai Travel API',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ============================================================
// API ROUTES
// ============================================================
app.use('/api/auth', authRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/fares', fareRoutes);
app.use('/api/fare', fareRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin/local-vehicles', adminLocalVehicleRoutes);
app.use('/api/local-vehicles', localVehicleRoutes);
app.use('/api', miscRoutes);


// ============================================================
// 404 HANDLER
// ============================================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// ============================================================
// CENTRALIZED ERROR HANDLER (must be last)
// ============================================================
app.use(errorHandler);

module.exports = app;
