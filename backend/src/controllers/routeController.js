// Route Controller — Admin CRUD (Routes are admin-managed)
const prisma = require('../utils/prisma');
const { AppError } = require('../middleware/errorHandler');

/**
 * GET /api/routes — All active routes (public)
 */
const getAllRoutes = async (req, res, next) => {
  try {
    const routes = await prisma.route.findMany({
      where: { isActive: true },
      include: {
        pickupLocation: { select: { id: true, name: true, city: true } },
        dropLocation: { select: { id: true, name: true, city: true } },
      },
      orderBy: { routeName: 'asc' }
    });
    res.json({ success: true, data: routes });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/routes — All routes including inactive
 */
const adminGetRoutes = async (req, res, next) => {
  try {
    const routes = await prisma.route.findMany({
      include: {
        pickupLocation: { select: { id: true, name: true, city: true } },
        dropLocation: { select: { id: true, name: true, city: true } },
        _count: { select: { fares: true, tolls: true } }
      },
      orderBy: { routeName: 'asc' }
    });
    res.json({ success: true, data: routes });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/routes
 */
const createRoute = async (req, res, next) => {
  try {
    const { routeName, pickupLocationId, dropLocationId } = req.body;
    if (!routeName || !pickupLocationId || !dropLocationId) {
      return next(new AppError('routeName, pickupLocationId, dropLocationId are required.', 400));
    }
    if (pickupLocationId === dropLocationId) {
      return next(new AppError('Pickup and drop locations must be different.', 400));
    }

    // Check for duplicate
    const existing = await prisma.route.findFirst({
      where: { pickupLocationId, dropLocationId }
    });
    if (existing) {
      return next(new AppError('A route between these locations already exists.', 409));
    }

    const route = await prisma.route.create({
      data: { routeName, pickupLocationId, dropLocationId },
      include: {
        pickupLocation: true,
        dropLocation: true,
      }
    });

    res.status(201).json({ success: true, data: route });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/admin/routes/:id
 */
const updateRoute = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { routeName, isActive } = req.body;

    const existing = await prisma.route.findUnique({ where: { id } });
    if (!existing) return next(new AppError('Route not found.', 404));

    const updated = await prisma.route.update({
      where: { id },
      data: {
        ...(routeName !== undefined && { routeName }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        pickupLocation: true,
        dropLocation: true,
      }
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/admin/routes/:id — Soft delete
 */
const deleteRoute = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.route.update({ where: { id }, data: { isActive: false } });
    res.json({ success: true, message: 'Route deactivated.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllRoutes, adminGetRoutes, createRoute, updateRoute, deleteRoute };
