const prisma = require('../utils/prisma');
const { AppError } = require('../middleware/errorHandler');
const { invalidateFareCache } = require('../services/fareCalculationService');

/**
 * Helper to convert float / decimal safely
 */
const toNum = (val, fallback = 0) => {
  if (val === undefined || val === null || isNaN(Number(val))) return fallback;
  return parseFloat(Number(val).toFixed(2));
};

/**
 * GET /api/fares/admin/configs — List all unified fare configurations
 */
// In-memory caching for admin fare configs & dashboard stats
let adminFareConfigsCache = null;
let adminFareConfigsCacheTime = 0;
const ADMIN_FARE_CONFIGS_CACHE_TTL = 45000; // 45 seconds

let dashboardStatsCache = null;
let dashboardStatsCacheTime = 0;
const DASHBOARD_STATS_CACHE_TTL = 30000; // 30 seconds

const invalidateAdminFareConfigCache = () => {
  adminFareConfigsCache = null;
  adminFareConfigsCacheTime = 0;
  dashboardStatsCache = null;
  dashboardStatsCacheTime = 0;
};

const listFareConfigs = async (req, res, next) => {
  try {
    const { routeId, vehicleId, isActive, search } = req.query;
    const isUnfiltered = !routeId && !vehicleId && isActive === undefined && !search;
    const now = Date.now();

    if (isUnfiltered && adminFareConfigsCache && (now - adminFareConfigsCacheTime < ADMIN_FARE_CONFIGS_CACHE_TTL)) {
      return res.json({ success: true, data: adminFareConfigsCache, count: adminFareConfigsCache.length });
    }

    const whereClause = {
      ...(routeId && { routeId }),
      ...(vehicleId && { vehicleId }),
      ...(isActive !== undefined && { isActive: isActive === 'true' }),
    };

    const fares = await prisma.fare.findMany({
      where: whereClause,
      include: {
        route: {
          include: {
            pickupLocation: { select: { id: true, name: true, city: true, state: true } },
            dropLocation: { select: { id: true, name: true, city: true, state: true } },
          },
        },
        vehicle: true,
        fareTolls: {
          where: { isActive: true },
        },
        fareParking: true,
        fareWaiting: true,
      },
      orderBy: [{ updatedAt: 'desc' }],
    });

    // Batch fetch latest availability for all fares in 1 query instead of 20+ parallel network round-trips
    const vehicleIds = [...new Set(fares.map((f) => f.vehicleId).filter(Boolean))];
    const routeIds = [...new Set(fares.map((f) => f.routeId).filter(Boolean))];

    const availabilities = (vehicleIds.length > 0 && routeIds.length > 0)
      ? await prisma.vehicleAvailability.findMany({
          where: {
            vehicleId: { in: vehicleIds },
            routeId: { in: routeIds },
          },
          orderBy: { createdAt: 'desc' },
        })
      : [];

    const availabilityMap = new Map();
    for (const a of availabilities) {
      const key = `${a.vehicleId}_${a.routeId}`;
      if (!availabilityMap.has(key)) {
        availabilityMap.set(key, a);
      }
    }

    const configsWithDetails = fares.map((f) => {
      const availability = availabilityMap.get(`${f.vehicleId}_${f.routeId}`);

      const totalToll = toNum((f.fareTolls || []).reduce((sum, t) => sum + toNum(t.amount), 0));
      const parkingAmount = f.fareParking && f.fareParking.enabled ? toNum(f.fareParking.amount) : 0;
      const stayAmount = f.fareWaiting && f.fareWaiting.enabled ? toNum(f.fareWaiting.perHourCharge) : 0;
      const estimatedTotal = toNum(toNum(f.baseFare) + totalToll + parkingAmount + stayAmount);

      return {
        id: f.id,
        routeId: f.routeId,
        vehicleId: f.vehicleId,
        baseFare: toNum(f.baseFare),
        perKmFare: toNum(f.perKmFare),
        minimumFare: toNum(f.minimumFare),
        isActive: f.isActive,
        createdAt: f.createdAt,
        updatedAt: f.updatedAt,
        route: f.route,
        vehicle: f.vehicle,
        tolls: f.fareTolls || [],
        totalToll,
        parking: f.fareParking || { enabled: false, amount: 0, chargingType: 'FIXED' },
        waiting: f.fareWaiting || { enabled: false, freeMinutes: 30, perHourCharge: 0 },
        availability: availability || {
          status: 'AVAILABLE',
          availableQuantity: 1,
          availableFromTime: '00:00',
          availableToTime: '23:59',
        },
        estimatedTotal,
        customerQuoteTotal: toNum(toNum(f.baseFare) + totalToll + parkingAmount),
        waitingAllowanceAmount: stayAmount,
      };
    });

    // Optional text search filter
    let result = configsWithDetails;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.route?.routeName?.toLowerCase().includes(q) ||
          c.route?.pickupLocation?.name?.toLowerCase().includes(q) ||
          c.route?.dropLocation?.name?.toLowerCase().includes(q) ||
          c.vehicle?.name?.toLowerCase().includes(q) ||
          c.vehicle?.category?.toLowerCase().includes(q)
      );
    }

        if (isUnfiltered) {
      adminFareConfigsCache = configsWithDetails;
      adminFareConfigsCacheTime = Date.now();
    }
    res.json({ success: true, data: result, count: result.length });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/fares/admin/configs/:id — Single unified fare configuration
 */
const getFareConfig = async (req, res, next) => {
  try {
    const { id } = req.params;

    const fare = await prisma.fare.findUnique({
      where: { id },
      include: {
        route: {
          include: {
            pickupLocation: true,
            dropLocation: true,
          },
        },
        vehicle: true,
        fareTolls: { where: { isActive: true } },
        fareParking: true,
        fareWaiting: true,
      },
    });

    if (!fare) {
      return next(new AppError('Fare configuration not found', 404));
    }

    const availability = await prisma.vehicleAvailability.findFirst({
      where: {
        vehicleId: fare.vehicleId,
        routeId: fare.routeId,
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalToll = toNum((fare.fareTolls || []).reduce((sum, t) => sum + toNum(t.amount), 0));
    const parkingAmount = fare.fareParking && fare.fareParking.enabled ? toNum(fare.fareParking.amount) : 0;
    const stayAmount = fare.fareWaiting && fare.fareWaiting.enabled ? toNum(fare.fareWaiting.perHourCharge) : 0;
    const estimatedTotal = toNum(toNum(fare.baseFare) + totalToll + parkingAmount + stayAmount);

    res.json({
      success: true,
      data: {
        id: fare.id,
        routeId: fare.routeId,
        vehicleId: fare.vehicleId,
        baseFare: toNum(fare.baseFare),
        perKmFare: toNum(fare.perKmFare),
        minimumFare: toNum(fare.minimumFare),
        isActive: fare.isActive,
        createdAt: fare.createdAt,
        updatedAt: fare.updatedAt,
        route: fare.route,
        vehicle: fare.vehicle,
        tolls: fare.fareTolls || [],
        totalToll,
        parking: fare.fareParking || { enabled: false, amount: 0, chargingType: 'FIXED' },
        waiting: fare.fareWaiting || { enabled: false, freeMinutes: 30, perHourCharge: 0 },
        availability: availability || {
          status: 'AVAILABLE',
          availableQuantity: 1,
          availableFromTime: '00:00',
          availableToTime: '23:59',
        },
        estimatedTotal,
        customerQuoteTotal: toNum(toNum(fare.baseFare) + totalToll + parkingAmount),
        waitingAllowanceAmount: stayAmount,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/fares/admin/configs — Unified Create (Route + Vehicle + Fare + Tolls + Parking + Waiting + Availability)
 */
const createFareConfig = async (req, res, next) => {
  try {
    const {
      routeId,
      pickupLocationId,
      dropLocationId,
      pickupLocationName,
      dropLocationName,
      vehicle,
      fare,
      tolls = [],
      parking,
      waiting,
      availability,
    } = req.body;

    // 1. Resolve Route
    let targetRouteId = routeId;
    let finalPickupId = pickupLocationId;
    let finalDropId = dropLocationId;

    if (!finalPickupId && pickupLocationName && pickupLocationName.trim()) {
      const pName = pickupLocationName.trim();
      let loc = await prisma.location.findFirst({
        where: { name: { equals: pName, mode: 'insensitive' } },
      });
      if (!loc) {
        const isMumbai = /mumbai|thane|navi/i.test(pName);
        loc = await prisma.location.create({
          data: {
            name: pName,
            city: pName,
            type: 'OTHER',
            side: isMumbai ? 'MUMBAI_SIDE' : 'PUNE_SIDE',
            isActive: true,
          },
        });
      }
      finalPickupId = loc.id;
    }

    if (!finalDropId && dropLocationName && dropLocationName.trim()) {
      const dName = dropLocationName.trim();
      let loc = await prisma.location.findFirst({
        where: { name: { equals: dName, mode: 'insensitive' } },
      });
      if (!loc) {
        const isPune = /pune|hinjawadi|wakad|baner|pimpr/i.test(dName);
        loc = await prisma.location.create({
          data: {
            name: dName,
            city: dName,
            type: 'OTHER',
            side: isPune ? 'PUNE_SIDE' : 'MUMBAI_SIDE',
            isActive: true,
          },
        });
      }
      finalDropId = loc.id;
    }

    if (!targetRouteId && finalPickupId && finalDropId) {
      let r = await prisma.route.findFirst({
        where: { pickupLocationId: finalPickupId, dropLocationId: finalDropId },
      });
      if (!r) {
        const pickup = await prisma.location.findUnique({ where: { id: finalPickupId } });
        const drop = await prisma.location.findUnique({ where: { id: finalDropId } });
        if (!pickup || !drop) {
          return next(new AppError('Pickup and drop locations must be valid.', 400));
        }
        r = await prisma.route.create({
          data: {
            routeName: `${pickup.name} to ${drop.name}`,
            pickupLocationId: finalPickupId,
            dropLocationId: finalDropId,
            isActive: true,
          },
        });
      }
      targetRouteId = r.id;
    }

    if (!targetRouteId) {
      return next(new AppError('Route (routeId or pickupLocationId + dropLocationId) is required.', 400));
    }

    // 2. Resolve Vehicle
    if (!vehicle || (!vehicle.id && !vehicle.name)) {
      return next(new AppError('Vehicle details (name, category, seatingCapacity) are required.', 400));
    }

    if (!fare || fare.baseFare === undefined) {
      return next(new AppError('Base fare is required.', 400));
    }

    const createdConfig = await prisma.$transaction(async (tx) => {
      let vehicleId = vehicle.id;

      if (!vehicleId) {
        // Create new vehicle
        const newVehicle = await tx.vehicle.create({
          data: {
            name: vehicle.name,
            category: vehicle.category || 'SEDAN',
            image: vehicle.image || '/assets/sedan.webp',
            description: vehicle.description || null,
            seatingCapacity: parseInt(vehicle.seatingCapacity, 10) || 4,
            isActive: vehicle.isActive !== undefined ? vehicle.isActive : true,
            displayOrder: parseInt(vehicle.displayOrder, 10) || 0,
          },
        });
        vehicleId = newVehicle.id;
      } else {
        // Update existing vehicle if updated properties sent
        await tx.vehicle.update({
          where: { id: vehicleId },
          data: {
            ...(vehicle.name && { name: vehicle.name }),
            ...(vehicle.category && { category: vehicle.category }),
            ...(vehicle.image && { image: vehicle.image }),
            ...(vehicle.description !== undefined && { description: vehicle.description }),
            ...(vehicle.seatingCapacity && { seatingCapacity: parseInt(vehicle.seatingCapacity, 10) }),
            ...(vehicle.isActive !== undefined && { isActive: vehicle.isActive }),
          },
        });
      }

      // Check if fare already exists for route + vehicle
      const existingFare = await tx.fare.findFirst({
        where: { routeId: targetRouteId, vehicleId },
      });

      if (existingFare) {
        throw new AppError('A fare configuration for this Route and Vehicle already exists. Please edit it instead.', 409);
      }

      // 3. Create Fare
      const newFare = await tx.fare.create({
        data: {
          routeId: targetRouteId,
          vehicleId,
          baseFare: toNum(fare.baseFare),
          perKmFare: toNum(fare.perKmFare, 0),
          minimumFare: toNum(fare.minimumFare, 0),
          isActive: fare.isActive !== undefined ? fare.isActive : true,
        },
      });

      // 4. Create FareTolls
      if (Array.isArray(tolls) && tolls.length > 0) {
        for (const toll of tolls) {
          if (toll.name && toll.amount !== undefined) {
            await tx.fareToll.create({
              data: {
                fareId: newFare.id,
                name: toll.name,
                amount: toNum(toll.amount),
                isActive: toll.isActive !== undefined ? toll.isActive : true,
              },
            });
          }
        }
      }

      // 5. Create FareParking
      if (parking) {
        await tx.fareParking.create({
          data: {
            fareId: newFare.id,
            enabled: Boolean(parking.enabled),
            locationId: parking.locationId || null,
            chargingType: parking.chargingType || 'FIXED',
            amount: toNum(parking.amount, 0),
            isActive: parking.isActive !== undefined ? parking.isActive : true,
          },
        });
      }

      // 6. Create FareWaiting
      if (waiting) {
        await tx.fareWaiting.create({
          data: {
            fareId: newFare.id,
            enabled: Boolean(waiting.enabled),
            locationId: waiting.locationId || null,
            freeMinutes: parseInt(waiting.freeMinutes, 10) || 30,
            perHourCharge: toNum(waiting.perHourCharge, 0),
            isActive: waiting.isActive !== undefined ? waiting.isActive : true,
          },
        });
      }

      // 7. Upsert Vehicle Availability
      if (availability) {
        const availDate = availability.availableDate ? new Date(availability.availableDate) : new Date();
        availDate.setHours(0, 0, 0, 0);

        const existingAvail = await tx.vehicleAvailability.findFirst({
          where: {
            vehicleId,
            routeId: targetRouteId,
            availableDate: availDate,
          },
        });

        if (existingAvail) {
          await tx.vehicleAvailability.update({
            where: { id: existingAvail.id },
            data: {
              status: availability.status || 'AVAILABLE',
              availableQuantity: parseInt(availability.availableQuantity, 10) || 1,
              availableFromTime: availability.availableFromTime || '00:00',
              availableToTime: availability.availableToTime || '23:59',
            },
          });
        } else {
          await tx.vehicleAvailability.create({
            data: {
              vehicleId,
              routeId: targetRouteId,
              availableDate: availDate,
              status: availability.status || 'AVAILABLE',
              availableQuantity: parseInt(availability.availableQuantity, 10) || 1,
              availableFromTime: availability.availableFromTime || '00:00',
              availableToTime: availability.availableToTime || '23:59',
            },
          });
        }
      }

      // 8. Audit Log
      if (req.user?.userId) {
        await tx.auditLog.create({
          data: {
            adminId: req.user.userId,
            action: 'CREATE_FARE_CONFIG',
            entity: 'Fare',
            entityId: newFare.id,
            newValue: JSON.stringify({
              routeId: targetRouteId,
              vehicleId,
              baseFare: fare.baseFare,
              tollsCount: tolls.length,
            }),
          },
        });
      }

      return newFare;
    }, {
      maxWait: 15000,
      timeout: 30000,
    });

    // Return the full structured object
    const complete = await prisma.fare.findUnique({
      where: { id: createdConfig.id },
      include: {
        route: { include: { pickupLocation: true, dropLocation: true } },
        vehicle: true,
        fareTolls: true,
        fareParking: true,
        fareWaiting: true,
      },
    });

    invalidateFareCache();
    invalidateAdminFareConfigCache();
    res.status(201).json({
      success: true,
      message: 'Fare configuration created successfully!',
      data: complete,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/fares/admin/configs/:id — Unified Update
 */
const updateFareConfig = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      routeId,
      vehicle,
      fare,
      tolls,
      parking,
      waiting,
      availability,
    } = req.body;

    const existingFare = await prisma.fare.findUnique({
      where: { id },
      include: { fareTolls: true, fareParking: true, fareWaiting: true },
    });

    if (!existingFare) {
      return next(new AppError('Fare configuration not found.', 404));
    }

    await prisma.$transaction(async (tx) => {
      // 1. Update Vehicle if provided
      if (vehicle) {
        await tx.vehicle.update({
          where: { id: existingFare.vehicleId },
          data: {
            ...(vehicle.name && { name: vehicle.name }),
            ...(vehicle.category && { category: vehicle.category }),
            ...(vehicle.image && { image: vehicle.image }),
            ...(vehicle.description !== undefined && { description: vehicle.description }),
            ...(vehicle.seatingCapacity && { seatingCapacity: parseInt(vehicle.seatingCapacity, 10) }),
            ...(vehicle.isActive !== undefined && { isActive: vehicle.isActive }),
          },
        });
      }

      // 2. Update Fare
      await tx.fare.update({
        where: { id },
        data: {
          ...(routeId && { routeId }),
          ...(fare?.baseFare !== undefined && { baseFare: toNum(fare.baseFare) }),
          ...(fare?.perKmFare !== undefined && { perKmFare: toNum(fare.perKmFare) }),
          ...(fare?.minimumFare !== undefined && { minimumFare: toNum(fare.minimumFare) }),
          ...(fare?.isActive !== undefined && { isActive: fare.isActive }),
        },
      });

      // 3. Update Tolls (replace strategy for simplicity and correctness)
      if (Array.isArray(tolls)) {
        await tx.fareToll.deleteMany({ where: { fareId: id } });
        for (const toll of tolls) {
          if (toll.name && toll.amount !== undefined) {
            await tx.fareToll.create({
              data: {
                fareId: id,
                name: toll.name,
                amount: toNum(toll.amount),
                isActive: toll.isActive !== undefined ? toll.isActive : true,
              },
            });
          }
        }
      }

      // 4. Update Parking
      if (parking) {
        await tx.fareParking.upsert({
          where: { fareId: id },
          create: {
            fareId: id,
            enabled: Boolean(parking.enabled),
            locationId: parking.locationId || null,
            chargingType: parking.chargingType || 'FIXED',
            amount: toNum(parking.amount, 0),
            isActive: parking.isActive !== undefined ? parking.isActive : true,
          },
          update: {
            enabled: Boolean(parking.enabled),
            locationId: parking.locationId || null,
            chargingType: parking.chargingType || 'FIXED',
            amount: toNum(parking.amount, 0),
            isActive: parking.isActive !== undefined ? parking.isActive : true,
          },
        });
      }

      // 5. Update Waiting
      if (waiting) {
        await tx.fareWaiting.upsert({
          where: { fareId: id },
          create: {
            fareId: id,
            enabled: Boolean(waiting.enabled),
            locationId: waiting.locationId || null,
            freeMinutes: parseInt(waiting.freeMinutes, 10) || 30,
            perHourCharge: toNum(waiting.perHourCharge, 0),
            isActive: waiting.isActive !== undefined ? waiting.isActive : true,
          },
          update: {
            enabled: Boolean(waiting.enabled),
            locationId: waiting.locationId || null,
            freeMinutes: parseInt(waiting.freeMinutes, 10) || 30,
            perHourCharge: toNum(waiting.perHourCharge, 0),
            isActive: waiting.isActive !== undefined ? waiting.isActive : true,
          },
        });
      }

      // 6. Update Availability
      if (availability) {
        const targetRoute = routeId || existingFare.routeId;
        const availDate = availability.availableDate ? new Date(availability.availableDate) : new Date();
        availDate.setHours(0, 0, 0, 0);

        const existingAvail = await tx.vehicleAvailability.findFirst({
          where: {
            vehicleId: existingFare.vehicleId,
            routeId: targetRoute,
            availableDate: availDate,
          },
        });

        if (existingAvail) {
          await tx.vehicleAvailability.update({
            where: { id: existingAvail.id },
            data: {
              status: availability.status || 'AVAILABLE',
              availableQuantity: parseInt(availability.availableQuantity, 10) || 1,
              availableFromTime: availability.availableFromTime || '00:00',
              availableToTime: availability.availableToTime || '23:59',
            },
          });
        } else {
          await tx.vehicleAvailability.create({
            data: {
              vehicleId: existingFare.vehicleId,
              routeId: targetRoute,
              availableDate: availDate,
              status: availability.status || 'AVAILABLE',
              availableQuantity: parseInt(availability.availableQuantity, 10) || 1,
              availableFromTime: availability.availableFromTime || '00:00',
              availableToTime: availability.availableToTime || '23:59',
            },
          });
        }
      }

      // 7. Audit Log
      if (req.user?.userId) {
        await tx.auditLog.create({
          data: {
            adminId: req.user.userId,
            action: 'UPDATE_FARE_CONFIG',
            entity: 'Fare',
            entityId: id,
            oldValue: JSON.stringify({ baseFare: existingFare.baseFare, isActive: existingFare.isActive }),
            newValue: JSON.stringify({
              baseFare: fare?.baseFare !== undefined ? fare.baseFare : existingFare.baseFare,
              isActive: fare?.isActive !== undefined ? fare.isActive : existingFare.isActive,
            }),
          },
        });
      }
    }, {
      maxWait: 15000,
      timeout: 30000,
    });

    const updated = await prisma.fare.findUnique({
      where: { id },
      include: {
        route: { include: { pickupLocation: true, dropLocation: true } },
        vehicle: true,
        fareTolls: true,
        fareParking: true,
        fareWaiting: true,
      },
    });

    invalidateFareCache();
    invalidateAdminFareConfigCache();
    res.json({
      success: true,
      message: 'Fare configuration updated successfully!',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/fares/admin/configs/:id/toggle-status — Toggle active / deactivated status
 */
const toggleFareStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const existing = await prisma.fare.findUnique({ where: { id } });
    if (!existing) return next(new AppError('Fare configuration not found.', 404));

    const newStatus = isActive !== undefined ? isActive : !existing.isActive;

    const updated = await prisma.fare.update({
      where: { id },
      data: { isActive: newStatus },
      include: {
        route: { include: { pickupLocation: true, dropLocation: true } },
        vehicle: true,
      },
    });

    if (req.user?.userId) {
      await prisma.auditLog.create({
        data: {
          adminId: req.user.userId,
          action: newStatus ? 'ACTIVATE_FARE_CONFIG' : 'DEACTIVATE_FARE_CONFIG',
          entity: 'Fare',
          entityId: id,
          newValue: JSON.stringify({ isActive: newStatus }),
        },
      });
    }

    invalidateFareCache();
    invalidateAdminFareConfigCache();
    res.json({
      success: true,
      message: `Fare configuration ${newStatus ? 'activated' : 'deactivated'} successfully.`,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/fares/admin/configs/:id — Permanently delete Fare configuration and its children
 */
const deleteFareConfig = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await prisma.fare.findUnique({ where: { id } });
    if (!existing) return next(new AppError('Fare configuration not found.', 404));

    await prisma.$transaction(async (tx) => {
      // 1. Delete associated toll, parking, waiting records
      await tx.fareToll.deleteMany({ where: { fareId: id } });
      await tx.fareParking.deleteMany({ where: { fareId: id } });
      await tx.fareWaiting.deleteMany({ where: { fareId: id } });

      // 2. Delete the fare record
      await tx.fare.delete({ where: { id } });

      // 3. Audit log
      if (req.user?.userId) {
        await tx.auditLog.create({
          data: {
            adminId: req.user.userId,
            action: 'DELETE_FARE_CONFIG',
            entity: 'Fare',
            entityId: id,
            oldValue: JSON.stringify({
              routeId: existing.routeId,
              vehicleId: existing.vehicleId,
              tripType: existing.tripType,
              baseFare: existing.baseFare,
            }),
          },
        });
      }
    }, {
      maxWait: 15000,
      timeout: 30000,
    });

    invalidateFareCache();
    invalidateAdminFareConfigCache();
    res.json({ success: true, message: 'Fare configuration deleted permanently.' });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/fares/admin/configs/:id/duplicate — Duplicate an existing Fare config
 */
const duplicateFareConfig = async (req, res, next) => {
  try {
    const { id } = req.params;
    const sourceFare = await prisma.fare.findUnique({
      where: { id },
      include: {
        fareTolls: true,
        fareParking: true,
        fareWaiting: true,
        vehicle: true,
        route: true,
      },
    });

    if (!sourceFare) {
      return next(new AppError('Source fare configuration not found.', 404));
    }

    // Check if reverse route exists or duplicate vehicle
    const duplicate = await prisma.$transaction(async (tx) => {
      // Create a copied vehicle with suffix or find alternative
      const copiedVehicle = await tx.vehicle.create({
        data: {
          name: `${sourceFare.vehicle.name} (Copy)`,
          category: sourceFare.vehicle.category,
          image: sourceFare.vehicle.image,
          description: sourceFare.vehicle.description,
          seatingCapacity: sourceFare.vehicle.seatingCapacity,
          isActive: true,
        },
      });

      const newFare = await tx.fare.create({
        data: {
          routeId: sourceFare.routeId,
          vehicleId: copiedVehicle.id,
          baseFare: sourceFare.baseFare,
          perKmFare: sourceFare.perKmFare,
          minimumFare: sourceFare.minimumFare,
          isActive: true,
        },
      });

      if (sourceFare.fareTolls?.length > 0) {
        for (const t of sourceFare.fareTolls) {
          await tx.fareToll.create({
            data: {
              fareId: newFare.id,
              name: t.name,
              amount: t.amount,
              isActive: t.isActive,
            },
          });
        }
      }

      if (sourceFare.fareParking) {
        await tx.fareParking.create({
          data: {
            fareId: newFare.id,
            enabled: sourceFare.fareParking.enabled,
            locationId: sourceFare.fareParking.locationId,
            chargingType: sourceFare.fareParking.chargingType,
            amount: sourceFare.fareParking.amount,
            isActive: sourceFare.fareParking.isActive,
          },
        });
      }

      if (sourceFare.fareWaiting) {
        await tx.fareWaiting.create({
          data: {
            fareId: newFare.id,
            enabled: sourceFare.fareWaiting.enabled,
            locationId: sourceFare.fareWaiting.locationId,
            freeMinutes: sourceFare.fareWaiting.freeMinutes,
            perHourCharge: sourceFare.fareWaiting.perHourCharge,
            isActive: sourceFare.fareWaiting.isActive,
          },
        });
      }

      if (req.user?.userId) {
        await tx.auditLog.create({
          data: {
            adminId: req.user.userId,
            action: 'DUPLICATE_FARE_CONFIG',
            entity: 'Fare',
            entityId: newFare.id,
            oldValue: JSON.stringify({ sourceFareId: id }),
          },
        });
      }

      return newFare;
    }, {
      maxWait: 15000,
      timeout: 30000,
    });

    const complete = await prisma.fare.findUnique({
      where: { id: duplicate.id },
      include: {
        route: { include: { pickupLocation: true, dropLocation: true } },
        vehicle: true,
        fareTolls: true,
        fareParking: true,
        fareWaiting: true,
      },
    });

    invalidateFareCache();
    invalidateAdminFareConfigCache();
    res.status(201).json({
      success: true,
      message: 'Fare configuration duplicated successfully!',
      data: complete,
    });
  } catch (err) {
    next(err);
  }
};


/**
 * GET /api/admin/dashboard-stats — Aggregated fast counts & recent fares for dashboard
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const now = Date.now();
    if (dashboardStatsCache && (now - dashboardStatsCacheTime < DASHBOARD_STATS_CACHE_TTL)) {
      return res.json({ success: true, data: dashboardStatsCache });
    }

    const [
      activeFares,
      vehiclesCount,
      routesCount,
      bookingsCount,
      enquiriesCount,
      newEnquiriesCount,
      blogsCount,
      recentFares
    ] = await Promise.all([
      prisma.fare.count({ where: { isActive: true } }),
      prisma.vehicle.count({ where: { isActive: true } }),
      prisma.route.count({ where: { isActive: true } }),
      prisma.booking.count(),
      prisma.enquiry.count(),
      prisma.enquiry.count({ where: { status: 'NEW' } }),
      prisma.blogPost.count({ where: { isPublished: true } }),
      prisma.fare.findMany({
        take: 5,
        orderBy: { updatedAt: 'desc' },
        include: {
          route: {
            include: {
              pickupLocation: { select: { id: true, name: true, city: true } },
              dropLocation: { select: { id: true, name: true, city: true } },
            },
          },
          vehicle: { select: { id: true, name: true, category: true, image: true } },
          fareTolls: { where: { isActive: true } },
          fareParking: true,
          fareWaiting: true,
        },
      }),
    ]);

    const formattedRecentFares = recentFares.map((f) => {
      const totalToll = toNum((f.fareTolls || []).reduce((sum, t) => sum + toNum(t.amount), 0));
      const parkingAmount = f.fareParking && f.fareParking.enabled ? toNum(f.fareParking.amount) : 0;
      const stayAmount = f.fareWaiting && f.fareWaiting.enabled ? toNum(f.fareWaiting.perHourCharge) : 0;
      return {
        id: f.id,
        routeId: f.routeId,
        vehicleId: f.vehicleId,
        baseFare: toNum(f.baseFare),
        isActive: f.isActive,
        createdAt: f.createdAt,
        updatedAt: f.updatedAt,
        route: f.route,
        vehicle: f.vehicle,
        totalToll,
        estimatedTotal: toNum(toNum(f.baseFare) + totalToll + parkingAmount + stayAmount),
      };
    });

    const result = {
      stats: {
        activeFares,
        vehiclesCount,
        routesCount,
        bookingsCount,
        enquiriesCount,
        newEnquiriesCount,
        blogsCount,
      },
      recentFares: formattedRecentFares,
    };

    dashboardStatsCache = result;
    dashboardStatsCacheTime = now;

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listFareConfigs,
  getFareConfig,
  createFareConfig,
  updateFareConfig,
  deleteFareConfig,
  toggleFareStatus,
  duplicateFareConfig,
  getDashboardStats,
  invalidateAdminFareConfigCache,
};
