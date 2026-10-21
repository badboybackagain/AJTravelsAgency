// Fare Controller — Admin CRUD + Public fare quote
const prisma = require('../utils/prisma');
const { AppError } = require('../middleware/errorHandler');
const { calculateFareQuote, invalidateFareCache } = require('../services/fareCalculationService');

// ============================================================
// PUBLIC
// ============================================================

/**
 * POST /api/fare/quote — Main fare calculation endpoint
 * SECURITY: Frontend-sent price values are IGNORED.
 * All pricing calculated server-side from database.
 */
const getFareQuote = async (req, res, next) => {
  try {
    const params = req.method === 'GET' ? req.query : (req.body || {});
    const {
      pickupLocationId,
      dropLocationId,
      vehicleId,
      city,
      duration,
      date,
      time,
      departureDate,
      departureTime,
      returnDate,
      returnTime,
      passengers,
      tripType = 'ONE_WAY',
      parkingRequired,
      stayRequired,
    } = params;

    if (tripType !== 'LOCAL' && (!pickupLocationId || !dropLocationId)) {
      return next(new AppError('pickupLocationId and dropLocationId are required for intercity trips.', 400));
    }

    if (tripType === 'LOCAL' && !city && !pickupLocationId) {
      return next(new AppError('City or Pickup Location is required for local travel.', 400));
    }

    const result = await calculateFareQuote({
      pickupLocationId,
      dropLocationId,
      vehicleId,
      city,
      duration,
      date: date || departureDate,
      time: time || departureTime,
      departureDate,
      departureTime,
      returnDate,
      returnTime,
      passengers: parseInt(passengers) || 1,
      tripType,
      parkingRequired: Boolean(parkingRequired),
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
};

// ============================================================
// ADMIN CRUD
// ============================================================

/**
 * GET /api/admin/fares — All fare configurations
 */
const adminGetFares = async (req, res, next) => {
  try {
    const { routeId, vehicleId } = req.query;

    const fares = await prisma.fare.findMany({
      where: {
        ...(routeId && { routeId }),
        ...(vehicleId && { vehicleId }),
      },
      include: {
        route: {
          include: {
            pickupLocation: { select: { name: true } },
            dropLocation: { select: { name: true } },
          }
        },
        vehicle: { select: { id: true, name: true, category: true } }
      },
      orderBy: [{ route: { routeName: 'asc' } }, { vehicle: { name: 'asc' } }]
    });

    res.json({ success: true, data: fares });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/fares — Create fare
 */
const createFare = async (req, res, next) => {
  try {
    const { routeId, vehicleId, baseFare, perKmFare, minimumFare, adminId } = req.body;

    if (!routeId || !vehicleId || baseFare === undefined) {
      return next(new AppError('routeId, vehicleId, and baseFare are required.', 400));
    }

    // Check for existing fare
    const existing = await prisma.fare.findFirst({ where: { routeId, vehicleId } });
    if (existing) {
      return next(new AppError('A fare for this route and vehicle already exists. Use update instead.', 409));
    }

    const oldValue = null;
    const newValue = { baseFare, perKmFare, minimumFare };

    const fare = await prisma.$transaction(async (tx) => {
      const created = await tx.fare.create({
        data: {
          routeId,
          vehicleId,
          baseFare: parseFloat(baseFare),
          perKmFare: parseFloat(perKmFare || 0),
          minimumFare: parseFloat(minimumFare || 0),
        },
        include: {
          route: { include: { pickupLocation: true, dropLocation: true } },
          vehicle: true,
        }
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          adminId: req.user.userId,
          action: 'CREATE',
          entity: 'Fare',
          entityId: created.id,
          oldValue: oldValue ? JSON.stringify(oldValue) : null,
          newValue: newValue ? JSON.stringify(newValue) : null,
        }
      });

      return created;
    });

    invalidateFareCache();
    res.status(201).json({ success: true, data: fare });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/admin/fares/:id — Update fare
 */
const updateFare = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { baseFare, perKmFare, minimumFare, isActive } = req.body;

    const existing = await prisma.fare.findUnique({ where: { id } });
    if (!existing) return next(new AppError('Fare not found.', 404));

    const updated = await prisma.$transaction(async (tx) => {
      const fare = await tx.fare.update({
        where: { id },
        data: {
          ...(baseFare !== undefined && { baseFare: parseFloat(baseFare) }),
          ...(perKmFare !== undefined && { perKmFare: parseFloat(perKmFare) }),
          ...(minimumFare !== undefined && { minimumFare: parseFloat(minimumFare) }),
          ...(isActive !== undefined && { isActive }),
        },
        include: {
          route: { include: { pickupLocation: true, dropLocation: true } },
          vehicle: true,
        }
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          adminId: req.user.userId,
          action: 'UPDATE',
          entity: 'Fare',
          entityId: id,
          oldValue: JSON.stringify({
            baseFare: existing.baseFare.toString(),
            perKmFare: existing.perKmFare.toString(),
            minimumFare: existing.minimumFare.toString(),
            isActive: existing.isActive,
          }),
          newValue: JSON.stringify({
            baseFare: baseFare !== undefined ? baseFare : existing.baseFare.toString(),
            isActive: isActive !== undefined ? isActive : existing.isActive,
          }),
        }
      });

      return fare;
    });

    invalidateFareCache();
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/admin/fares/:id — Soft delete
 */
const deleteFare = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.fare.findUnique({ where: { id } });
    if (!existing) return next(new AppError('Fare not found.', 404));

    await prisma.$transaction(async (tx) => {
      await tx.fare.update({ where: { id }, data: { isActive: false } });
      await tx.auditLog.create({
        data: {
          adminId: req.user.userId,
          action: 'DELETE',
          entity: 'Fare',
          entityId: id,
          oldValue: JSON.stringify({ isActive: true }),
          newValue: JSON.stringify({ isActive: false }),
        }
      });
    });

    invalidateFareCache();
    res.json({ success: true, message: 'Fare deactivated.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getFareQuote, adminGetFares, createFare, updateFare, deleteFare };
