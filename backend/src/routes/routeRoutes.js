const express = require('express');
const router = express.Router();
const { getAllRoutes, adminGetRoutes, createRoute, updateRoute, deleteRoute } = require('../controllers/routeController');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');

// PUBLIC
router.get('/', getAllRoutes);

// ADMIN
router.get('/admin', auth, adminOnly, adminGetRoutes);
router.get('/admin/all', auth, adminOnly, adminGetRoutes);
router.post('/', auth, adminOnly, createRoute);
router.put('/:id', auth, adminOnly, updateRoute);
router.delete('/:id', auth, adminOnly, deleteRoute);

module.exports = router;
