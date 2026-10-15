const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Ensure upload directory exists safely (guard against read-only serverless filesystems)
let uploadDir = path.join(__dirname, '../../uploads/vehicles');
try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
} catch (err) {
  // Fall back to system temporary directory in read-only environments (e.g. Vercel serverless)
  uploadDir = path.join(os.tmpdir(), 'uploads', 'vehicles');
  try {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
  } catch (tmpErr) {
    // Non-fatal warning at initialization time; individual uploads will fail with descriptive error
    console.warn('⚠️ Warning: Could not initialize local upload directory:', tmpErr.message);
  }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `vehicle-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG, and WEBP images are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

module.exports = upload;
