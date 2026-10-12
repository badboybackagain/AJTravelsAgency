const express = require('express');
const router = express.Router();
const {
  createBooking,
  adminGetBookings,
  updateBookingStatus,
} = require('../controllers/bookingController');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');

// PUBLIC — Create Booking
router.post('/', createBooking);

// ADMIN — Get all bookings & update status
router.get('/admin', auth, adminOnly, adminGetBookings);
router.put('/admin/:id/status', auth, adminOnly, updateBookingStatus);

module.exports = router;
