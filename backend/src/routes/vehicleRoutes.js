const express = require('express');
const router = express.Router();
const { getAllVehicles, getVehicle, adminGetVehicles, createVehicle, updateVehicle, deleteVehicle } = require('../controllers/vehicleController');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const upload = require('../middleware/upload');

// ADMIN
router.get('/admin', auth, adminOnly, adminGetVehicles);
router.get('/admin/all', auth, adminOnly, adminGetVehicles);

// PUBLIC
router.get('/', getAllVehicles);
router.get('/:id', getVehicle);

const prisma = require('../utils/prisma');

// ADMIN — IMAGE UPLOAD
router.post(
  '/upload-image',
  auth,
  adminOnly,
  (req, res, next) => {
    req.uploadCategory = 'vehicles';
    next();
  },
  upload.single('image'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No image file uploaded' });
      }
      const imageUrl = req.file.publicUrl || `/uploads/vehicles/${req.file.filename}`;

      // Synchronize with Central Media Library
      try {
        await prisma.mediaAsset.create({
          data: {
            filename: req.file.filename,
            originalName: req.file.originalname,
            url: imageUrl,
            mimeType: req.file.mimetype,
            fileSize: req.file.size,
            category: 'vehicles',
            altText: `Fleet Vehicle Image - ${req.file.originalname}`,
            title: req.file.originalname.replace(/\.[^/.]+$/, ''),
          },
        });
      } catch (dbErr) {
        // Non-fatal if asset record creation fails; keep image upload functional
        console.warn('Could not index vehicle upload in MediaAsset:', dbErr.message);
      }

      res.json({ success: true, imageUrl, message: 'Vehicle image uploaded successfully' });
    } catch (err) {
      next(err);
    }
  }
);

// ADMIN MUTATIONS
router.post('/', auth, adminOnly, createVehicle);
router.put('/:id', auth, adminOnly, updateVehicle);
router.delete('/:id', auth, adminOnly, deleteVehicle);

module.exports = router;

