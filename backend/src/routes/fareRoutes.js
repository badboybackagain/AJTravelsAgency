const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const {
  getFareQuote,
  adminGetFares,
  createFare,
  updateFare,
  deleteFare,
} = require('../controllers/fareController');
const {
  listFareConfigs,
  getFareConfig,
  createFareConfig,
  updateFareConfig,
  deleteFareConfig,
  toggleFareStatus,
  duplicateFareConfig,
} = require('../controllers/adminFareConfigController');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');

// Rate limiter for fare quote — prevent abuse
const fareQuoteLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  message: { success: false, message: 'Too many fare requests. Please try again in a few minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// PUBLIC — POST or GET /api/fares/quote or /api/fare/quote
router.post('/quote', fareQuoteLimit, getFareQuote);
router.get('/quote', fareQuoteLimit, getFareQuote);

// ============================================================
// ADMIN — UNIFIED FARE MANAGEMENT
// ============================================================
router.get('/admin/configs', auth, adminOnly, listFareConfigs);
router.get('/admin/configs/:id', auth, adminOnly, getFareConfig);
router.post('/admin/configs', auth, adminOnly, createFareConfig);
router.put('/admin/configs/:id', auth, adminOnly, updateFareConfig);
router.patch('/admin/configs/:id/toggle-status', auth, adminOnly, toggleFareStatus);
router.delete('/admin/configs/:id', auth, adminOnly, deleteFareConfig);
router.post('/admin/configs/:id/duplicate', auth, adminOnly, duplicateFareConfig);

// ADMIN — LEGACY FARE ROUTES (for backward compatibility)
router.get('/admin', auth, adminOnly, adminGetFares);
router.get('/admin/all', auth, adminOnly, adminGetFares);
router.post('/', auth, adminOnly, createFare);
router.put('/:id', auth, adminOnly, updateFare);
router.delete('/:id', auth, adminOnly, deleteFare);

module.exports = router;

