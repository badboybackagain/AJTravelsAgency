// Parking Controller — Admin CRUD
const prisma = require('../utils/prisma');
const { AppError } = require('../middleware/errorHandler');

const adminGetParking = async (req, res, next) => {
  try {
    const charges = await prisma.parkingCharge.findMany({
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

const createParking = async (req, res, next) => {
  try {
    const { locationId, vehicleCategory, amount, chargingType } = req.body;
    if (!locationId || !vehicleCategory || amount === undefined) {
      return next(new AppError('locationId, vehicleCategory, and amount are required.', 400));
    }

    const charge = await prisma.$transaction(async (tx) => {
      const created = await tx.parkingCharge.create({
        data: {
          locationId,
          vehicleCategory,
          amount: parseFloat(amount),
          chargingType: chargingType || 'FIXED',
        },
        include: { location: true }
      });

      await tx.auditLog.create({
        data: {
          adminId: req.user.userId,
          action: 'CREATE',
          entity: 'ParkingCharge',
          entityId: created.id,
          newValue: JSON.stringify({ locationId, vehicleCategory, amount, chargingType }),
        }
      });

      return created;
    });

    res.status(201).json({ success: true, data: charge });
  } catch (err) {
    next(err);
  }
};

const updateParking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount, chargingType, isActive } = req.body;

    const existing = await prisma.parkingCharge.findUnique({ where: { id } });
    if (!existing) return next(new AppError('Parking charge not found.', 404));

    const updated = await prisma.$transaction(async (tx) => {
      const charge = await tx.parkingCharge.update({
        where: { id },
        data: {
          ...(amount !== undefined && { amount: parseFloat(amount) }),
          ...(chargingType !== undefined && { chargingType }),
          ...(isActive !== undefined && { isActive }),
        }
      });

      await tx.auditLog.create({
        data: {
          adminId: req.user.userId,
          action: 'UPDATE',
          entity: 'ParkingCharge',
          entityId: id,
          oldValue: JSON.stringify({ amount: existing.amount.toString() }),
          newValue: JSON.stringify({ amount }),
        }
      });

      return charge;
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

const deleteParking = async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.parkingCharge.update({ where: { id }, data: { isActive: false } });
    res.json({ success: true, message: 'Parking charge deactivated.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { adminGetParking, createParking, updateParking, deleteParking };
