const prisma = require('../utils/prisma');

/**
 * GET /api/grand-deals — Public cab deals for homepage section
 */
const getGrandDeals = async (req, res, next) => {
  try {
    const fares = await prisma.fare.findMany({
      where: {
        isActive: true,
        route: { isActive: true },
        vehicle: { isActive: true },
      },
      include: {
        route: {
          include: {
            pickupLocation: { select: { id: true, name: true, city: true } },
            dropLocation: { select: { id: true, name: true, city: true } },
          },
        },
        vehicle: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 8,
    });

    const deals = fares.map((f) => ({
      id: f.id,
      routeId: f.routeId,
      vehicleId: f.vehicleId,
      routeName: f.route.routeName,
      pickup: f.route.pickupLocation,
      drop: f.route.dropLocation,
      vehicle: {
        id: f.vehicle.id,
        name: f.vehicle.name,
        category: f.vehicle.category,
        image: f.vehicle.image,
        seatingCapacity: f.vehicle.seatingCapacity,
        description: f.vehicle.description,
      },
      baseFare: f.baseFare,
      status: 'AVAILABLE',
    }));

    res.json({ success: true, data: deals });
  } catch (err) {
    next(err);
  }
};

module.exports = { getGrandDeals };
