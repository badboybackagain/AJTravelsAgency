const express = require('express');
const router = express.Router();
const {
  listLocalVehicles,
  getLocalVehicle,
} = require('../controllers/adminLocalVehicleController');

// PUBLIC read-only endpoints
router.get('/', listLocalVehicles);
router.get('/:id', getLocalVehicle);

module.exports = router;
