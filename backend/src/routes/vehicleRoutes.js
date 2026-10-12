const express = require('express');
const router = express.Router();
const { getAllVehicles, getVehicle, adminGetVehicles, createVehicle, updateVehicle, deleteVehicle } = require('../controllers/vehicleController');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const upload = require('../middleware/upload');

// PUBLIC
router.get('/', getAllVehicles);
router.get('/:id', getVehicle);

// ADMIN — IMAGE UPLOAD
router.post('/upload-image', auth, adminOnly, upload.single('image'), (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file uploaded' });
    }
    const imageUrl = `/uploads/vehicles/${req.file.filename}`;
    res.json({ success: true, imageUrl, message: 'Vehicle image uploaded successfully' });
  } catch (err) {
    next(err);
  }
});

// ADMIN
router.get('/admin', auth, adminOnly, adminGetVehicles);
router.get('/admin/all', auth, adminOnly, adminGetVehicles);
router.post('/', auth, adminOnly, createVehicle);
router.put('/:id', auth, adminOnly, updateVehicle);
router.delete('/:id', auth, adminOnly, deleteVehicle);

module.exports = router;

