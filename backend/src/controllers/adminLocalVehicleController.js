const prisma = require('../utils/prisma');
const { AppError } = require('../middleware/errorHandler');

const toNumber = (val, fallback = 0) => {
  if (val === undefined || val === null || isNaN(Number(val))) return fallback;
  return parseFloat(Number(val).toFixed(2));
};

/**
 * GET /api/admin/local-vehicles — List all local vehicles
 */
const listLocalVehicles = async (req, res, next) => {
  try {
    const { city, category, isActive } = req.query;

    const whereClause = {
      ...(city && { city: { contains: city } }),
      ...(category && { category }),
      ...(isActive !== undefined && { isActive: isActive === 'true' }),
    };

    const localVehicles = await prisma.localVehicle.findMany({
      where: whereClause,
      orderBy: [{ city: 'asc' }, { durationHours: 'asc' }, { baseFare: 'asc' }],
    });

    res.json({ success: true, data: localVehicles, count: localVehicles.length });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/local-vehicles/:id — Get single local vehicle
 */
const getLocalVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const vehicle = await prisma.localVehicle.findUnique({ where: { id } });

    if (!vehicle) {
      return next(new AppError('Local vehicle package not found', 404));
    }

    res.json({ success: true, data: vehicle });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/local-vehicles — Create new local vehicle package
 */
const createLocalVehicle = async (req, res, next) => {
  try {
    const {
      name,
      category = 'SEDAN',
      city,
      durationHours,
      baseFare,
      extraHourCharge = 150,
      parkingEnabled = false,
      parkingAmount = 0,
      seatingCapacity = 4,
      image = '/assets/sedan.webp',
      description,
      status = 'AVAILABLE',
      availableQuantity = 5,
      isActive = true,
    } = req.body;

    if (!name || !city || !durationHours || baseFare === undefined) {
      return next(new AppError('Name, City, Duration (hours), and Base Fare are required.', 400));
    }

    const created = await prisma.localVehicle.create({
      data: {
        name,
        category,
        city: city.trim(),
        durationHours: parseInt(durationHours, 10),
        baseFare: toNumber(baseFare),
        extraHourCharge: toNumber(extraHourCharge, 150),
        parkingEnabled: Boolean(parkingEnabled),
        parkingAmount: toNumber(parkingAmount, 0),
        seatingCapacity: parseInt(seatingCapacity, 10) || 4,
        image,
        description: description || `${city} Local Rental (${durationHours} Hrs Package)`,
        status,
        availableQuantity: parseInt(availableQuantity, 10) || 5,
        isActive: isActive !== undefined ? Boolean(isActive) : true,
      },
    });

    res.status(201).json({ success: true, message: 'Local vehicle package created', data: created });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/admin/local-vehicles/:id — Update local vehicle package
 */
const updateLocalVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      category,
      city,
      durationHours,
      baseFare,
      extraHourCharge,
      parkingEnabled,
      parkingAmount,
      seatingCapacity,
      image,
      description,
      status,
      availableQuantity,
      isActive,
    } = req.body;

    const existing = await prisma.localVehicle.findUnique({ where: { id } });
    if (!existing) {
      return next(new AppError('Local vehicle package not found', 404));
    }

    const updated = await prisma.localVehicle.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(category && { category }),
        ...(city && { city: city.trim() }),
        ...(durationHours !== undefined && { durationHours: parseInt(durationHours, 10) }),
        ...(baseFare !== undefined && { baseFare: toNumber(baseFare) }),
        ...(extraHourCharge !== undefined && { extraHourCharge: toNumber(extraHourCharge) }),
        ...(parkingEnabled !== undefined && { parkingEnabled: Boolean(parkingEnabled) }),
        ...(parkingAmount !== undefined && { parkingAmount: toNumber(parkingAmount) }),
        ...(seatingCapacity !== undefined && { seatingCapacity: parseInt(seatingCapacity, 10) }),
        ...(image && { image }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
        ...(availableQuantity !== undefined && { availableQuantity: parseInt(availableQuantity, 10) }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      },
    });

    res.json({ success: true, message: 'Local vehicle package updated', data: updated });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/admin/local-vehicles/:id — Delete local vehicle package
 */
const deleteLocalVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.localVehicle.findUnique({ where: { id } });
    if (!existing) {
      return next(new AppError('Local vehicle package not found', 404));
    }

    await prisma.localVehicle.delete({ where: { id } });
    res.json({ success: true, message: 'Local vehicle package deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listLocalVehicles,
  getLocalVehicle,
  createLocalVehicle,
  updateLocalVehicle,
  deleteLocalVehicle,
};
