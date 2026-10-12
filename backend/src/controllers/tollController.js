// Toll Controller — Admin CRUD
const prisma = require('../utils/prisma');
const { AppError } = require('../middleware/errorHandler');

const getTolls = async (req, res, next) => {
  try {
    const { routeId } = req.query;
    const tolls = await prisma.toll.findMany({
      where: {
        isActive: true,
        ...(routeId && { routeId }),
      },
      include: {
        route: {
          include: {
            pickupLocation: { select: { name: true } },
            dropLocation: { select: { name: true } },
          }
        }
      },
      orderBy: { name: 'asc' }
    });
    res.json({ success: true, data: tolls });
  } catch (err) {
    next(err);
  }
};

const adminGetTolls = async (req, res, next) => {
  try {
    const tolls = await prisma.toll.findMany({
      include: {
        route: {
          include: {
            pickupLocation: { select: { name: true } },
            dropLocation: { select: { name: true } },
          }
        }
      },
      orderBy: { name: 'asc' }
    });
    res.json({ success: true, data: tolls });
  } catch (err) {
    next(err);
  }
};

const createToll = async (req, res, next) => {
  try {
    const { name, routeId, amount, vehicleCategory } = req.body;
    if (!name || !routeId || amount === undefined || !vehicleCategory) {
      return next(new AppError('name, routeId, amount, vehicleCategory are required.', 400));
    }

    const toll = await prisma.$transaction(async (tx) => {
      const created = await tx.toll.create({
        data: { name, routeId, amount: parseFloat(amount), vehicleCategory },
        include: { route: { include: { pickupLocation: true, dropLocation: true } } }
      });

      await tx.auditLog.create({
        data: {
          adminId: req.user.userId,
          action: 'CREATE',
          entity: 'Toll',
          entityId: created.id,
          newValue: JSON.stringify({ name, amount, vehicleCategory }),
        }
      });

      return created;
    });

    res.status(201).json({ success: true, data: toll });
  } catch (err) {
    next(err);
  }
};

const updateToll = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, amount, vehicleCategory, isActive } = req.body;

    const existing = await prisma.toll.findUnique({ where: { id } });
    if (!existing) return next(new AppError('Toll not found.', 404));

    const updated = await prisma.$transaction(async (tx) => {
      const toll = await tx.toll.update({
        where: { id },
        data: {
          ...(name !== undefined && { name }),
          ...(amount !== undefined && { amount: parseFloat(amount) }),
          ...(vehicleCategory !== undefined && { vehicleCategory }),
          ...(isActive !== undefined && { isActive }),
        }
      });

      await tx.auditLog.create({
        data: {
          adminId: req.user.userId,
          action: 'UPDATE',
          entity: 'Toll',
          entityId: id,
          oldValue: JSON.stringify({ amount: existing.amount.toString() }),
          newValue: JSON.stringify({ amount, isActive }),
        }
      });

      return toll;
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

const deleteToll = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.toll.update({ where: { id }, data: { isActive: false } });
    res.json({ success: true, message: 'Toll deactivated.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getTolls, adminGetTolls, createToll, updateToll, deleteToll };
