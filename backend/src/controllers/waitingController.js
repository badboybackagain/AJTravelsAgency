// Waiting/Stay Controller — Admin CRUD
const prisma = require('../utils/prisma');
const { AppError } = require('../middleware/errorHandler');

const adminGetWaiting = async (req, res, next) => {
  try {
    const charges = await prisma.waitingCharge.findMany({
      include: {
        location: { select: { id: true, name: true, city: true } }
      },
      orderBy: { location: { name: 'asc' } }
    });
    res.json({ success: true, data: charges });
  } catch (err) {
    next(err);
  }
};

const createWaiting = async (req, res, next) => {
  try {
    const { locationId, vehicleCategory, freeMinutes, perHourCharge } = req.body;
    if (!locationId || !vehicleCategory || perHourCharge === undefined) {
      return next(new AppError('locationId, vehicleCategory, and perHourCharge are required.', 400));
    }

    const charge = await prisma.$transaction(async (tx) => {
      const created = await tx.waitingCharge.create({
        data: {
          locationId,
          vehicleCategory,
          freeMinutes: parseInt(freeMinutes || 30),
          perHourCharge: parseFloat(perHourCharge),
        },
        include: { location: true }
      });

      await tx.auditLog.create({
        data: {
          adminId: req.user.userId,
          action: 'CREATE',
          entity: 'WaitingCharge',
          entityId: created.id,
          newValue: JSON.stringify({ locationId, vehicleCategory, freeMinutes, perHourCharge }),
        }
      });

      return created;
    });

    res.status(201).json({ success: true, data: charge });
  } catch (err) {
    next(err);
  }
};

const updateWaiting = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { freeMinutes, perHourCharge, isActive } = req.body;

    const existing = await prisma.waitingCharge.findUnique({ where: { id } });
    if (!existing) return next(new AppError('Waiting charge not found.', 404));

    const updated = await prisma.$transaction(async (tx) => {
      const charge = await tx.waitingCharge.update({
        where: { id },
        data: {
          ...(freeMinutes !== undefined && { freeMinutes: parseInt(freeMinutes) }),
          ...(perHourCharge !== undefined && { perHourCharge: parseFloat(perHourCharge) }),
          ...(isActive !== undefined && { isActive }),
        }
      });

      await tx.auditLog.create({
        data: {
          adminId: req.user.userId,
          action: 'UPDATE',
          entity: 'WaitingCharge',
          entityId: id,
          oldValue: JSON.stringify({ perHourCharge: existing.perHourCharge.toString() }),
          newValue: JSON.stringify({ perHourCharge }),
        }
      });

      return charge;
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

const deleteWaiting = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.waitingCharge.update({ where: { id }, data: { isActive: false } });
    res.json({ success: true, message: 'Waiting charge deactivated.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { adminGetWaiting, createWaiting, updateWaiting, deleteWaiting };
