const express = require('express');
const router = express.Router();
const { getAvailability, adminGetAvailability, createAvailability, updateAvailability, deleteAvailability } = require('../controllers/availabilityController');
const { getTolls, adminGetTolls, createToll, updateToll, deleteToll } = require('../controllers/tollController');
const { adminGetParking, createParking, updateParking, deleteParking } = require('../controllers/parkingController');
const { adminGetWaiting, createWaiting, updateWaiting, deleteWaiting } = require('../controllers/waitingController');
const { getAuditLog } = require('../controllers/auditController');
const { getGrandDeals } = require('../controllers/grandDealsController');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');

// PUBLIC
router.get('/grand-deals', getGrandDeals);
router.get('/availability', getAvailability);
router.get('/tolls', getTolls);

// ADMIN — AVAILABILITY
router.get('/admin/availability', auth, adminOnly, adminGetAvailability);
router.post('/admin/availability', auth, adminOnly, createAvailability);
router.put('/admin/availability/:id', auth, adminOnly, updateAvailability);
router.delete('/admin/availability/:id', auth, adminOnly, deleteAvailability);

// ADMIN — TOLLS
router.get('/admin/tolls', auth, adminOnly, adminGetTolls);
router.post('/admin/tolls', auth, adminOnly, createToll);
router.put('/admin/tolls/:id', auth, adminOnly, updateToll);
router.delete('/admin/tolls/:id', auth, adminOnly, deleteToll);

// ADMIN — PARKING
router.get('/admin/parking', auth, adminOnly, adminGetParking);
router.post('/admin/parking', auth, adminOnly, createParking);
router.put('/admin/parking/:id', auth, adminOnly, updateParking);
router.delete('/admin/parking/:id', auth, adminOnly, deleteParking);

// ADMIN — WAITING/STAY
router.get('/admin/waiting', auth, adminOnly, adminGetWaiting);
router.post('/admin/waiting', auth, adminOnly, createWaiting);
router.put('/admin/waiting/:id', auth, adminOnly, updateWaiting);
router.delete('/admin/waiting/:id', auth, adminOnly, deleteWaiting);

// ADMIN — AUDIT LOG
router.get('/admin/audit', auth, adminOnly, getAuditLog);
router.get('/audit', auth, adminOnly, getAuditLog);

module.exports = router;
