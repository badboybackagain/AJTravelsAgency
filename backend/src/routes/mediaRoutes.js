// Media Management Routes
// Protected by JWT authentication and ADMIN role requirement

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const upload = require('../middleware/upload');
const {
  uploadMedia,
  getMediaList,
  getMediaById,
  updateMediaMetadata,
  deleteMedia,
} = require('../controllers/mediaController');

// Multer middleware supporting both 'file' and 'image' field names
const uploadMiddleware = upload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'image', maxCount: 1 },
]);

const handleFileUpload = (req, res, next) => {
  uploadMiddleware(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload error occurred.',
      });
    }

    // Normalize req.file from either 'file' or 'image' field
    if (req.files) {
      if (req.files.file && req.files.file[0]) {
        req.file = req.files.file[0];
      } else if (req.files.image && req.files.image[0]) {
        req.file = req.files.image[0];
      }
    }

    next();
  });
};

// All media endpoints require authentication and admin role
router.use(auth);
router.use(adminOnly);

// Route definitions
router.post('/upload', handleFileUpload, uploadMedia);
router.get('/', getMediaList);
router.get('/:id', getMediaById);
router.put('/:id', updateMediaMetadata);
router.patch('/:id', updateMediaMetadata);
router.delete('/:id', deleteMedia);

module.exports = router;
