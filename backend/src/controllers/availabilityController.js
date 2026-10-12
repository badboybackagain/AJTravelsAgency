// Availability Controller — Admin manages vehicle availability per date
const prisma = require('../utils/prisma');
const { AppError } = require('../middleware/errorHandler');

/**
 * GET /api/availability?routeId=X&date=Y
 * Public — returns availability for vehicles on a route on a date
 */
const getAvailability = async (req, res, next) => {
  try {
    const { routeId, date } = req.query;

    if (!routeId) {
      return next(new AppError('routeId is required.', 400));
    }

    const where = {
      routeId,
      ...(date && { availableDate: new Date(date) }),
    };

    const availability = await prisma.vehicleAvailability.findMany({
      where,
      include: {
        vehicle: {
          select: { id: true, name: true, category: true, image: true, seatingCapacity: true }
        }
      },
      orderBy: { availableDate: 'asc' }
    });

    res.json({ success: true, data: availability });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/availability — All availability records (admin)
 */
const adminGetAvailability = async (req, res, next) => {
  try {
    const { routeId, vehicleId, date } = req.query;

    const availability = await prisma.vehicleAvailability.findMany({
      where: {
        ...(routeId && { routeId }),
        ...(vehicleId && { vehicleId }),
        ...(date && { availableDate: new Date(date) }),
      },
      include: {
        vehicle: { select: { id: true, name: true, category: true } },
        route: {
          include: {
            pickupLocation: { select: { name: true } },
            dropLocation: { select: { name: true } },
          }
        }
      },
      orderBy: [{ availableDate: 'desc' }, { vehicle: { name: 'asc' } }]
    });

    res.json({ success: true, data: availability });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/availability — Create availability
 */
const createAvailability = async (req, res, next) => {
  try {
    const {
      vehicleId, routeId, availableDate,
      availableFromTime, availableToTime,
      availableQuantity, status
    } = req.body;

    if (!vehicleId || !routeId || !availableDate) {
      return next(new AppError('vehicleId, routeId, and availableDate are required.', 400));
    }

    const avail = await prisma.vehicleAvailability.create({
      data: {
        vehicleId,
        routeId,
        availableDate: new Date(availableDate),
        availableFromTime: availableFromTime || '00:00',
        availableToTime: availableToTime || '23:59',
        availableQuantity: parseInt(availableQuantity || 1),
        status: status || 'AVAILABLE',
      },
      include: {
        vehicle: { select: { id: true, name: true, category: true } },
        route: { include: { pickupLocation: true, dropLocation: true } }
      }
    });

    res.status(201).json({ success: true, data: avail });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/admin/availability/:id — Update availability
 */
const updateAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { availableQuantity, status, availableFromTime, availableToTime } = req.body;

    const existing = await prisma.vehicleAvailability.findUnique({ where: { id } });
    if (!existing) return next(new AppError('Availability record not found.', 404));

    const updated = await prisma.vehicleAvailability.update({
      where: { id },
      data: {
        ...(availableQuantity !== undefined && { availableQuantity: parseInt(availableQuantity) }),
        ...(status !== undefined && { status }),
        ...(availableFromTime !== undefined && { availableFromTime }),
        ...(availableToTime !== undefined && { availableToTime }),
      }
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/admin/availability/:id
 */
const deleteAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.vehicleAvailability.delete({ where: { id } });
    res.json({ success: true, message: 'Availability record deleted.' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAvailability,
  adminGetAvailability,
  createAvailability,
  updateAvailability,
  deleteAvailability,
};
