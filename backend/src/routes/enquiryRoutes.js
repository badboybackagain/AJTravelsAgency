const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const {
  createEnquiry,
  adminGetEnquiries,
  adminUpdateEnquiryStatus,
} = require('../controllers/enquiryController');
const {
  prepareQuote,
  getEnquiryQuotes,
  convertToBooking,
} = require('../controllers/quoteController');

// PUBLIC — Submit Enquiry
router.post('/', createEnquiry);

// ADMIN — View and manage enquiries
router.get('/admin', auth, adminOnly, adminGetEnquiries);
router.put('/admin/:id/status', auth, adminOnly, adminUpdateEnquiryStatus);

// ADMIN — Quotation Management & Booking Conversion
router.post('/admin/:id/quote', auth, adminOnly, prepareQuote);
router.get('/admin/:id/quotes', auth, adminOnly, getEnquiryQuotes);
router.post('/admin/:id/quotes/:quoteId/convert-to-booking', auth, adminOnly, convertToBooking);

module.exports = router;


