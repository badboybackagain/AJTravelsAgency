// Media Asset Controller
// Handles upload, retrieval, metadata modification, and safe deletion of media assets

const prisma = require('../utils/prisma');
const { deleteMediaFile, VALID_CATEGORIES } = require('../middleware/upload');
const { AppError } = require('../middleware/errorHandler');

/**
 * Upload a media file and store metadata in database
 * POST /api/media/upload
 */
const uploadMedia = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file was provided for upload.',
      });
    }

    const file = req.file;
    const category = file.targetCategory || (VALID_CATEGORIES.includes(req.body.category) ? req.body.category : 'general');
    const altText = (req.body.altText || '').trim();
    const title = (req.body.title || file.originalname.replace(/\.[^/.]+$/, '')).trim();

    // The public URL matches express static route /uploads/:category/:filename
    const publicUrl = file.publicUrl || `/uploads/${category}/${file.filename}`;

    const asset = await prisma.mediaAsset.create({
      data: {
        filename: file.filename,
        originalName: file.originalname,
        url: publicUrl,
        mimeType: file.mimetype,
        fileSize: file.size,
        category,
        altText: altText || null,
        title: title || null,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Media asset uploaded successfully.',
      data: asset,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * List media assets with search, category filtering, and pagination
 * GET /api/media
 */
const getMediaList = async (req, res, next) => {
  try {
    const { category, search, page = 1, limit = 30, sortBy = 'createdAt', order = 'desc' } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 30));
    const skip = (pageNum - 1) * limitNum;

    const where = {};

    // Filter by valid category if specified
    if (category && category !== 'all') {
      const normalizedCat = String(category).toLowerCase();
      if (VALID_CATEGORIES.includes(normalizedCat)) {
        where.category = normalizedCat;
      }
    }

    // Keyword search over originalName, title, altText, filename
    if (search && String(search).trim() !== '') {
      const searchTerm = String(search).trim();
      where.OR = [
        { originalName: { contains: searchTerm, mode: 'insensitive' } },
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { altText: { contains: searchTerm, mode: 'insensitive' } },
        { filename: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    // Supported sort columns
    const validSortCols = ['createdAt', 'fileSize', 'originalName', 'title'];
    const sortField = validSortCols.includes(sortBy) ? sortBy : 'createdAt';
    const sortOrder = order === 'asc' ? 'asc' : 'desc';

    const [total, assets] = await Promise.all([
      prisma.mediaAsset.count({ where }),
      prisma.mediaAsset.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { [sortField]: sortOrder },
      }),
    ]);

    // Gather usage counts for each asset so UI can show in-use indicator
    const urls = assets.map((a) => a.url);
    const [vehicleMatches, localVehicleMatches, seoMatches] = await Promise.all([
      prisma.vehicle.findMany({
        where: { image: { in: urls } },
        select: { id: true, name: true, image: true },
      }),
      prisma.localVehicle.findMany({
        where: { image: { in: urls } },
        select: { id: true, name: true, image: true },
      }),
      prisma.seoMeta.findMany({
        where: { ogImage: { in: urls } },
        select: { id: true, pageLabel: true, ogImage: true },
      }),
    ]);

    // Attach reference metadata
    const assetsWithUsage = assets.map((asset) => {
      const usedByVehicles = vehicleMatches.filter((v) => v.image === asset.url).map((v) => `Vehicle: ${v.name}`);
      const usedByLocal = localVehicleMatches.filter((v) => v.image === asset.url).map((v) => `Local Package: ${v.name}`);
      const usedBySeo = seoMatches.filter((s) => s.ogImage === asset.url).map((s) => `SEO OG Image: ${s.pageLabel}`);
      const references = [...usedByVehicles, ...usedByLocal, ...usedBySeo];

      return {
        ...asset,
        isReferenced: references.length > 0,
        references,
      };
    });

    return res.json({
      success: true,
      data: assetsWithUsage,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get single media asset by ID
 * GET /api/media/:id
 */
const getMediaById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const asset = await prisma.mediaAsset.findUnique({ where: { id } });

    if (!asset) {
      return res.status(404).json({ success: false, message: 'Media asset not found.' });
    }

    return res.json({ success: true, data: asset });
  } catch (err) {
    next(err);
  }
};

/**
 * Update media metadata (altText, title, category)
 * PUT /api/media/:id
 */
const updateMediaMetadata = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { altText, title, category } = req.body;

    const existing = await prisma.mediaAsset.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Media asset not found.' });
    }

    const updateData = {};
    if (altText !== undefined) updateData.altText = (altText || '').trim() || null;
    if (title !== undefined) updateData.title = (title || '').trim() || null;
    if (category !== undefined && VALID_CATEGORIES.includes(String(category).toLowerCase())) {
      updateData.category = String(category).toLowerCase();
    }

    const updated = await prisma.mediaAsset.update({
      where: { id },
      data: updateData,
    });

    return res.json({
      success: true,
      message: 'Media asset metadata updated successfully.',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete media asset from database and local disk with safeguard checks
 * DELETE /api/media/:id
 */
const deleteMedia = async (req, res, next) => {
  try {
    const { id } = req.params;
    const force = req.query.force === 'true';

    const asset = await prisma.mediaAsset.findUnique({ where: { id } });
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Media asset not found.' });
    }

    // Check references before deleting
    const [vehicleMatches, localMatches, seoMatches] = await Promise.all([
      prisma.vehicle.findMany({ where: { image: asset.url }, select: { name: true } }),
      prisma.localVehicle.findMany({ where: { image: asset.url }, select: { name: true } }),
      prisma.seoMeta.findMany({ where: { ogImage: asset.url }, select: { pageLabel: true } }),
    ]);

    const references = [
      ...vehicleMatches.map((v) => `Vehicle (${v.name})`),
      ...localMatches.map((v) => `Local Vehicle (${v.name})`),
      ...seoMatches.map((s) => `SEO Meta (${s.pageLabel})`),
    ];

    if (references.length > 0 && !force) {
      return res.status(409).json({
        success: false,
        code: 'MEDIA_IN_USE',
        message: `This image cannot be deleted because it is currently in use by: ${references.join(', ')}. Please update those records or confirm force deletion.`,
        references,
      });
    }

    // Delete database record
    await prisma.mediaAsset.delete({ where: { id } });

    // Safely remove file from disk
    try {
      deleteMediaFile(asset.url);
    } catch (fsErr) {
      console.warn(`File unlink warning for ${asset.url}:`, fsErr.message);
    }

    return res.json({
      success: true,
      message: 'Media asset deleted successfully.',
      id,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  uploadMedia,
  getMediaList,
  getMediaById,
  updateMediaMetadata,
  deleteMedia,
};
