// Location Controller — Public + Admin CRUD
const prisma = require('../utils/prisma');
const { AppError } = require('../middleware/errorHandler');

/**
 * GET /api/locations
 * Returns all active locations
 */
const getAllLocations = async (req, res, next) => {
  try {
    const locations = await prisma.location.findMany({
      where: { isActive: true },
      orderBy: [{ side: 'asc' }, { name: 'asc' }]
    });
    res.json({ success: true, data: locations });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/locations/destinations?pickupId=ID
 * Returns valid drop destinations for a given pickup location.
 * Backend validates that active routes exist.
 */
const getDestinations = async (req, res, next) => {
  try {
    const { pickupId } = req.query;
    if (!pickupId) {
      return next(new AppError('pickupId query parameter is required.', 400));
    }

    const pickupLocation = await prisma.location.findFirst({
      where: { id: pickupId, isActive: true }
    });

    if (!pickupLocation) {
      return next(new AppError('Pickup location not found.', 404));
    }

    // Find all active routes FROM this pickup, and return their drop locations
    const routes = await prisma.route.findMany({
      where: {
        pickupLocationId: pickupId,
        isActive: true,
      },
      include: {
        dropLocation: true,
      }
    });

    const destinations = routes
      .filter(r => r.dropLocation.isActive)
      .map(r => r.dropLocation);

    res.json({ success: true, data: destinations, pickup: pickupLocation });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// ADMIN CRUD
// ============================================================

/**
 * POST /api/admin/locations — Create location
 */
const createLocation = async (req, res, next) => {
  try {
    const { name, city, state, type, side } = req.body;
    if (!name || !city || !side) {
      return next(new AppError('name, city, and side are required.', 400));
    }
    if (!['PUNE_SIDE', 'MUMBAI_SIDE'].includes(side)) {
      return next(new AppError('side must be PUNE_SIDE or MUMBAI_SIDE.', 400));
    }

    const location = await prisma.location.create({
      data: { name, city, state: state || 'Maharashtra', type: type || 'CITY', side }
    });

    res.status(201).json({ success: true, data: location });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/admin/locations/:id — Update location
 */
const updateLocation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, city, state, type, side, isActive } = req.body;

    const existing = await prisma.location.findUnique({ where: { id } });
    if (!existing) return next(new AppError('Location not found.', 404));

    const updated = await prisma.location.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(city !== undefined && { city }),
        ...(state !== undefined && { state }),
        ...(type !== undefined && { type }),
        ...(side !== undefined && { side }),
        ...(isActive !== undefined && { isActive }),
      }
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/admin/locations/:id — Soft delete (deactivate)
 */
const deleteLocation = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.location.update({
      where: { id },
      data: { isActive: false }
    });
    res.json({ success: true, message: 'Location deactivated.' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllLocations,
  getDestinations,
  createLocation,
  updateLocation,
  deleteLocation,
};
