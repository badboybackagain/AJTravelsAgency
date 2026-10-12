const express = require('express');
const router = express.Router();
const {
  getAllLocations,
  getDestinations,
  createLocation,
  updateLocation,
  deleteLocation,
} = require('../controllers/locationController');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');

// PUBLIC
// GET /api/locations
router.get('/', getAllLocations);

// GET /api/locations/destinations?pickupId=X
router.get('/destinations', getDestinations);

// ADMIN — Protected
// GET /api/locations/admin
router.get('/admin', auth, adminOnly, getAllLocations);
router.get('/admin/all', auth, adminOnly, getAllLocations);

// POST /api/locations
router.post('/', auth, adminOnly, createLocation);

// PUT /api/locations/:id
router.put('/:id', auth, adminOnly, updateLocation);

// DELETE /api/locations/:id
router.delete('/:id', auth, adminOnly, deleteLocation);

module.exports = router;
