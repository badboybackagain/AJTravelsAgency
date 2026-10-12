const express = require('express');
const router = express.Router();
const {
  listLocalVehicles,
  getLocalVehicle,
  createLocalVehicle,
  updateLocalVehicle,
  deleteLocalVehicle,
} = require('../controllers/adminLocalVehicleController');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');

router.get('/', auth, adminOnly, listLocalVehicles);
router.get('/:id', auth, adminOnly, getLocalVehicle);
router.post('/', auth, adminOnly, createLocalVehicle);
router.put('/:id', auth, adminOnly, updateLocalVehicle);
router.delete('/:id', auth, adminOnly, deleteLocalVehicle);

module.exports = router;
