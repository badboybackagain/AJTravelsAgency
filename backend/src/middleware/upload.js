const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Valid asset categories
const VALID_CATEGORIES = ['vehicles', 'blogs', 'destinations', 'services', 'general'];

// Resolve root uploads directory
let uploadRootDir = path.resolve(__dirname, '../../uploads');
try {
  if (!fs.existsSync(uploadRootDir)) {
    fs.mkdirSync(uploadRootDir, { recursive: true });
  }
} catch (err) {
  // Fall back to system temporary directory in read-only environments
  uploadRootDir = path.join(os.tmpdir(), 'ajtravels-uploads');
  try {
    if (!fs.existsSync(uploadRootDir)) {
      fs.mkdirSync(uploadRootDir, { recursive: true });
    }
  } catch (tmpErr) {
    console.warn('⚠️ Warning: Could not initialize local upload directory:', tmpErr.message);
  }
}

// Pre-create category subdirectories
VALID_CATEGORIES.forEach((cat) => {
  const dir = path.join(uploadRootDir, cat);
  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (err) {
    console.warn(`⚠️ Warning: Could not create upload subdirectory for ${cat}:`, err.message);
  }
});

// Category resolver helper
const resolveCategory = (req) => {
  const candidate = (
    req.uploadCategory ||
    req.headers['x-category'] ||
    req.query?.category ||
    req.body?.category ||
    (req.baseUrl && req.baseUrl.includes('vehicles') ? 'vehicles' : 'general')
  );
  const normalized = String(candidate).trim().toLowerCase();
  return VALID_CATEGORIES.includes(normalized) ? normalized : 'general';
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const category = resolveCategory(req);
    const targetDir = path.join(uploadRootDir, category);
    try {
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      file.targetCategory = category;
      cb(null, targetDir);
    } catch (err) {
      cb(err);
    }
  },
  filename: (req, file, cb) => {
    const category = file.targetCategory || resolveCategory(req);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanExt = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext) ? ext : '.jpg';
    const filename = `${category}-${uniqueSuffix}${cleanExt}`;
    file.targetFilename = filename;
    file.publicUrl = `/uploads/${category}/${filename}`;
    cb(null, filename);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = ['.jpg', '.jpeg', '.png', '.webp'];

  if (allowedMimes.includes(file.mimetype) && allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG, and WEBP images up to 5MB are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

/**
 * Delete a media file from disk safely with path traversal protection
 * @param {string} publicUrl - e.g. "/uploads/vehicles/vehicle-123.jpg"
 * @returns {boolean} true if deleted or not found
 */
const deleteMediaFile = (publicUrl) => {
  if (!publicUrl || typeof publicUrl !== 'string') return false;

  // Only manage files located under /uploads/
  if (!publicUrl.startsWith('/uploads/')) return false;

  const relativePath = publicUrl.replace(/^\/uploads\//, '');
  const resolvedRoot = path.resolve(uploadRootDir);
  const targetPath = path.resolve(uploadRootDir, relativePath);

  // Path traversal guard: must be strictly inside uploadRootDir
  if (!targetPath.startsWith(resolvedRoot)) {
    console.error('Security alert: Path traversal attempt blocked for path:', publicUrl);
    throw new Error('Access denied: Invalid file path');
  }

  try {
    if (fs.existsSync(targetPath)) {
      fs.unlinkSync(targetPath);
      return true;
    }
  } catch (err) {
    console.warn(`Failed to unlink file ${targetPath}:`, err.message);
  }
  return false;
};

upload.VALID_CATEGORIES = VALID_CATEGORIES;
upload.uploadRootDir = uploadRootDir;
upload.deleteMediaFile = deleteMediaFile;

module.exports = upload;
