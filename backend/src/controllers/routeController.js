// Route Controller — Admin CRUD (Routes are admin-managed)
const prisma = require('../utils/prisma');
const { AppError } = require('../middleware/errorHandler');

/**
 * GET /api/routes — All active routes (public)
 */
// In-memory caching for routes
let routesCache = null;
let routesCacheTime = 0;
let adminRoutesCache = null;
let adminRoutesCacheTime = 0;
const ROUTES_CACHE_TTL = 60000; // 60 seconds

const invalidateRouteCache = () => {
  routesCache = null;
  routesCacheTime = 0;
  adminRoutesCache = null;
  adminRoutesCacheTime = 0;
};

const getAllRoutes = async (req, res, next) => {
  try {
    const now = Date.now();
    if (routesCache && (now - routesCacheTime < ROUTES_CACHE_TTL)) {
      return res.json({ success: true, data: routesCache });
    }
    const routes = await prisma.route.findMany({
      where: { isActive: true },
      include: {
        pickupLocation: { select: { id: true, name: true, city: true } },
        dropLocation: { select: { id: true, name: true, city: true } },
      },
      orderBy: { routeName: 'asc' }
    });
    routesCache = routes;
    routesCacheTime = Date.now();
    adminRoutesCache = routes;
    adminRoutesCacheTime = Date.now();
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
    const now = Date.now();
    if (adminRoutesCache && (now - adminRoutesCacheTime < ROUTES_CACHE_TTL)) {
      return res.json({ success: true, data: adminRoutesCache });
    }
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

    invalidateRouteCache();
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

    invalidateRouteCache();
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
    invalidateRouteCache();
    res.json({ success: true, message: 'Route deactivated.' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  invalidateRouteCache, getAllRoutes, adminGetRoutes, createRoute, updateRoute, deleteRoute };
