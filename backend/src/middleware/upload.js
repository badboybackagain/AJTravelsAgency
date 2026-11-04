const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Valid asset categories
const VALID_CATEGORIES = ['vehicles', 'blogs', 'destinations', 'services', 'general'];

// Resolve root uploads directory
let uploadRootDir = path.resolve(__dirname, '../../uploads');

// Detect if running in serverless / read-only runtime (e.g. Vercel, AWS Lambda)
const isServerless = Boolean(
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.NOW_REGION ||
  process.env.VERCEL_ENV
);

// Determine if disk is truly writable
let isDiskWritable = !isServerless;
if (isDiskWritable) {
  try {
    if (!fs.existsSync(uploadRootDir)) {
      fs.mkdirSync(uploadRootDir, { recursive: true });
    }
    const testFile = path.join(uploadRootDir, `.write_probe_${Date.now()}`);
    fs.writeFileSync(testFile, 'probe');
    fs.unlinkSync(testFile);
  } catch (err) {
    isDiskWritable = false;
  }
}

// Pre-create category subdirectories if local disk is writable
if (isDiskWritable) {
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
}

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

// Disk storage engine for writable local environments
const diskStorageEngine = multer.diskStorage({
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
    // Normalize .jfif to .jpg, preserve .jpg, .jpeg, .png, .webp, .avif
    let cleanExt = '.jpg';
    if (['.jpg', '.jpeg', '.png', '.webp', '.avif'].includes(ext)) {
      cleanExt = ext;
    } else if (ext === '.jfif') {
      cleanExt = '.jpg';
    }
    const filename = `${category}-${uniqueSuffix}${cleanExt}`;
    file.targetFilename = filename;
    file.publicUrl = `/uploads/${category}/${filename}`;
    cb(null, filename);
  },
});

// Memory storage engine for serverless / read-only environments
const memoryStorageEngine = multer.memoryStorage();

// Hybrid storage engine: writes to disk if writable, keeps in memory as Data URI if read-only
class HybridStorageEngine {
  _handleFile(req, file, cb) {
    if (isDiskWritable) {
      return diskStorageEngine._handleFile(req, file, cb);
    }

    // In-memory fallback for Vercel / serverless runtimes
    memoryStorageEngine._handleFile(req, file, (err, info) => {
      if (err) return cb(err);
      const category = resolveCategory(req);
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
      let cleanExt = '.jpg';
      if (['.jpg', '.jpeg', '.png', '.webp', '.avif'].includes(ext)) {
        cleanExt = ext;
      } else if (ext === '.jfif') {
        cleanExt = '.jpg';
      }
      const filename = `${category}-${uniqueSuffix}${cleanExt}`;
      const dataUri = `data:${file.mimetype || 'image/jpeg'};base64,${info.buffer.toString('base64')}`;

      file.targetCategory = category;
      file.targetFilename = filename;
      file.filename = filename;
      file.publicUrl = dataUri;
      file.size = info.buffer ? info.buffer.length : (info.size || 0);

      cb(null, {
        buffer: info.buffer,
        size: file.size,
        filename,
        publicUrl: dataUri,
      });
    });
  }

  _removeFile(req, file, cb) {
    if (isDiskWritable) {
      return diskStorageEngine._removeFile(req, file, cb);
    }
    cb(null);
  }
}

const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/pjpeg',
    'image/jfif',
    'image/png',
    'image/x-png',
    'image/webp',
    'image/avif',
  ];
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = ['.jpg', '.jpeg', '.jfif', '.png', '.webp', '.avif'];

  // Accept if valid MIME or valid extension (handles browser variations on Windows)
  const mimeValid = allowedMimes.includes(file.mimetype) || (file.mimetype === 'application/octet-stream' && allowedExts.includes(ext));
  const extValid = allowedExts.includes(ext);

  if (mimeValid && extValid) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG, WEBP, AVIF, and JFIF images up to 5MB are allowed.'), false);
  }
};

const upload = multer({
  storage: new HybridStorageEngine(),
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

/**
 * Delete a media file from disk safely with path traversal protection
 * @param {string} publicUrl - e.g. "/uploads/vehicles/vehicle-123.jpg" or data: URI
 * @returns {boolean} true if deleted or not found
 */
const deleteMediaFile = (publicUrl) => {
  if (!publicUrl || typeof publicUrl !== 'string') return false;

  // Data URIs do not occupy server disk space
  if (publicUrl.startsWith('data:')) return true;

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
upload.isDiskWritable = isDiskWritable;

module.exports = upload;
