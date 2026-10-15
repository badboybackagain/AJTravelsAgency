const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const {
  createEnquiry,
  adminGetEnquiries,
  adminUpdateEnquiryStatus,
} = require('../controllers/enquiryController');

// PUBLIC — Submit Enquiry
router.post('/', createEnquiry);

// ADMIN — View and manage enquiries
router.get('/admin', auth, adminOnly, adminGetEnquiries);
router.put('/admin/:id/status', auth, adminOnly, adminUpdateEnquiryStatus);

module.exports = router;
