// Vehicle Controller — Public + Admin CRUD
const prisma = require('../utils/prisma');
const { AppError } = require('../middleware/errorHandler');

/**
 * GET /api/vehicles — All active vehicles
 */
const getAllVehicles = async (req, res, next) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      where: { isActive: true },
      orderBy: [{ displayOrder: 'asc' }, { seatingCapacity: 'asc' }]
    });
    res.json({ success: true, data: vehicles });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/vehicles/:id
 */
const getVehicle = async (req, res, next) => {
  try {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: req.params.id }
    });
    if (!vehicle) return next(new AppError('Vehicle not found.', 404));
    res.json({ success: true, data: vehicle });
  } catch (err) {
    next(err);
  }
};

// ============================================================
// ADMIN CRUD
// ============================================================

/**
 * GET /api/admin/vehicles — All vehicles (including inactive)
 */
const adminGetVehicles = async (req, res, next) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }]
    });
    res.json({ success: true, data: vehicles });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/vehicles
 */
const createVehicle = async (req, res, next) => {
  try {
    const { name, category, image, description, seatingCapacity, displayOrder } = req.body;
    if (!name || !category || !seatingCapacity) {
      return next(new AppError('name, category, and seatingCapacity are required.', 400));
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        name,
        category,
        image: image || '/assets/sedan.webp',
        description: description || null,
        seatingCapacity: parseInt(seatingCapacity),
        displayOrder: displayOrder ? parseInt(displayOrder) : 0,
      }
    });

    res.status(201).json({ success: true, data: vehicle });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/admin/vehicles/:id
 */
const updateVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, category, image, description, seatingCapacity, isActive, displayOrder } = req.body;

    const existing = await prisma.vehicle.findUnique({ where: { id } });
    if (!existing) return next(new AppError('Vehicle not found.', 404));

    const updated = await prisma.vehicle.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(category !== undefined && { category }),
        ...(image !== undefined && { image }),
        ...(description !== undefined && { description }),
        ...(seatingCapacity !== undefined && { seatingCapacity: parseInt(seatingCapacity) }),
        ...(isActive !== undefined && { isActive }),
        ...(displayOrder !== undefined && { displayOrder: parseInt(displayOrder) }),
      }
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/admin/vehicles/:id — Soft delete
 */
const deleteVehicle = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.vehicle.update({ where: { id }, data: { isActive: false } });
    res.json({ success: true, message: 'Vehicle deactivated.' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllVehicles,
  getVehicle,
  adminGetVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
};
