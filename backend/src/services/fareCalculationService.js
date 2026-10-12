// ============================================================
// FARE CALCULATION SERVICE - 3-MODE ARCHITECTURE
// Source of truth for ONE_WAY, ROUND_TRIP, and LOCAL pricing.
// The frontend NEVER calculates fares. All pricing is server-verified.
// ============================================================

const prisma = require('../utils/prisma');
const { AppError } = require('../middleware/errorHandler');

const toNumber = (val) => {
  if (val === undefined || val === null || isNaN(Number(val))) return 0;
  return parseFloat(Number(val).toFixed(2));
};

/**
 * Calculate fare for a single vehicle on a given route and tripType
 */
async function calculateVehicleFare(route, vehicle, options = {}) {
  const { tripType = 'ONE_WAY', parkingRequired = true, stayRequired = false, dropLocationId } = options;

  // 1. Load fare config (exact route + vehicle + tripType match)
  let fareConfig = await prisma.fare.findFirst({
    where: {
      routeId: route.id,
      vehicleId: vehicle.id,
      tripType,
      isActive: true,
    },
    include: {
      fareTolls: { where: { isActive: true } },
      fareParking: true,
      fareWaiting: true,
    },
  });

  // Fallback: If ROUND_TRIP has no specific fare, check ONE_WAY and multiply base by 2
  if (!fareConfig && tripType === 'ROUND_TRIP') {
    const oneWayFare = await prisma.fare.findFirst({
      where: {
        routeId: route.id,
        vehicleId: vehicle.id,
        tripType: 'ONE_WAY',
        isActive: true,
      },
      include: {
        fareTolls: { where: { isActive: true } },
        fareParking: true,
        fareWaiting: true,
      },
    });

    if (oneWayFare) {
      fareConfig = {
        ...oneWayFare,
        baseFare: oneWayFare.baseFare * 2 - 200, // Round trip discount
        fareTolls: (oneWayFare.fareTolls || []).map((t) => ({ ...t, amount: t.amount * 2 })),
      };
    }
  }

  if (!fareConfig) {
    return {
      configured: false,
      baseFare: 0,
      toll: 0,
      tollBreakdown: [],
      parking: 0,
      stay: 0,
      total: 0,
      fareOnRequest: true,
    };
  }

  const baseFare = toNumber(fareConfig.baseFare);

  // 2. Calculate tolls
  let totalToll = 0;
  let tollBreakdown = [];

  if (fareConfig.fareTolls && fareConfig.fareTolls.length > 0) {
    totalToll = fareConfig.fareTolls.reduce((sum, t) => sum + toNumber(t.amount), 0);
    tollBreakdown = fareConfig.fareTolls.map((t) => ({
      name: t.name,
      amount: toNumber(t.amount),
    }));
  }

  // 3. Calculate parking
  let totalParking = 0;
  if (fareConfig.fareParking && fareConfig.fareParking.enabled) {
    totalParking = toNumber(fareConfig.fareParking.amount);
  }

  // 4. Calculate waiting / stay
  let totalStay = 0;
  if (fareConfig.fareWaiting && fareConfig.fareWaiting.enabled && stayRequired) {
    totalStay = toNumber(fareConfig.fareWaiting.perHourCharge);
  }

  const total = baseFare + totalToll + totalParking + totalStay;

  return {
    configured: true,
    baseFare,
    toll: totalToll,
    tollBreakdown,
    parking: totalParking,
    stay: totalStay,
    total,
    fareOnRequest: false,
  };
}

/**
 * Main 3-Mode Fare Quote Calculator
 */
async function calculateFareQuote(params) {
  const {
    tripType = 'ONE_WAY',
    pickupLocationId,
    dropLocationId,
    city,
    date,
    time,
    departureDate,
    departureTime,
    returnDate,
    returnTime,
    duration,
    passengers = 1,
    parkingRequired = true,
    stayRequired = false,
  } = params;

  const numPassengers = parseInt(passengers, 10) || 1;

  // ============================================================
  // MODE 1: LOCAL TRAVEL
  // ============================================================
  if (tripType === 'LOCAL') {
    const targetCity = (city || 'Pune').trim();
    const durationHours = parseInt(duration, 10) || 8;

    // Fetch pickup location if provided
    let pickupLoc = null;
    if (pickupLocationId) {
      pickupLoc = await prisma.location.findUnique({ where: { id: pickupLocationId } });
    }

    // Query Local Vehicles matching city & passenger capacity
    let localVehicles = await prisma.localVehicle.findMany({
      where: {
        city: { contains: targetCity },
        isActive: true,
        seatingCapacity: { gte: numPassengers },
      },
      orderBy: [{ durationHours: 'asc' }, { baseFare: 'asc' }],
    });

    // If exact duration requested, prioritize matching duration
    if (durationHours && localVehicles.some((v) => v.durationHours === durationHours)) {
      localVehicles = localVehicles.filter((v) => v.durationHours === durationHours);
    }

    if (localVehicles.length === 0) {
      // Check if vehicles exist for this city regardless of passenger count to give helpful error
      const anyVehicles = await prisma.localVehicle.findFirst({
        where: { city: { contains: targetCity }, isActive: true },
      });
      if (anyVehicles) {
        throw new AppError('No suitable local vehicles are available for the selected passenger count.', 400);
      }
      throw new AppError(`No active local cab packages found for ${targetCity}. Please contact dispatch.`, 404);
    }

    const vehicleQuotes = localVehicles.map((v) => {
      const parking = v.parkingEnabled ? toNumber(v.parkingAmount) : 0;
      const total = toNumber(v.baseFare) + parking;

      return {
        vehicleId: v.id,
        name: v.name,
        category: v.category,
        image: v.image,
        description: v.description,
        seatingCapacity: v.seatingCapacity,
        durationHours: v.durationHours,
        extraHourCharge: toNumber(v.extraHourCharge),
        availability: v.status,
        availableQuantity: v.availableQuantity,
        tripType: 'LOCAL',
        fare: {
          baseFare: toNumber(v.baseFare),
          toll: 0,
          tollBreakdown: [],
          parking,
          stay: 0,
          extraHourCharge: toNumber(v.extraHourCharge),
          total,
          fareOnRequest: false,
          configured: true,
        },
      };
    });

    return {
      success: true,
      tripType: 'LOCAL',
      city: targetCity,
      route: {
        id: `local-${targetCity.toLowerCase()}`,
        name: `${targetCity} Local Rental (${durationHours} Hours)`,
        pickup: {
          id: pickupLoc?.id || `local-${targetCity.toLowerCase()}`,
          name: pickupLoc?.name || `${targetCity} (All Local Areas)`,
          city: targetCity,
        },
        drop: null,
      },
      searchParams: {
        tripType: 'LOCAL',
        city: targetCity,
        pickupLocationId: pickupLoc?.id || null,
        date: date || null,
        time: time || null,
        duration: durationHours,
        passengers: numPassengers,
      },
      vehicles: vehicleQuotes,
    };
  }

  // ============================================================
  // MODE 2 & 3: ONE_WAY and ROUND_TRIP
  // ============================================================
  if (!pickupLocationId || !dropLocationId) {
    throw new AppError('Pickup and drop locations are required.', 400);
  }

  // Step 1: Validate pickup & drop locations
  const pickupLocation = await prisma.location.findFirst({
    where: { id: pickupLocationId, isActive: true },
  });
  if (!pickupLocation) {
    throw new AppError('Pickup location does not exist or is inactive.', 404);
  }

  const dropLocation = await prisma.location.findFirst({
    where: { id: dropLocationId, isActive: true },
  });
  if (!dropLocation) {
    throw new AppError('Drop location does not exist or is inactive.', 404);
  }

  // Step 2: Validate Round Trip dates
  if (tripType === 'ROUND_TRIP') {
    const depDateStr = departureDate || date;
    const retDateStr = returnDate;

    if (depDateStr && retDateStr) {
      const depD = new Date(depDateStr);
      const retD = new Date(retDateStr);
      if (retD < depD) {
        throw new AppError('Return date must be on or after the departure date.', 400);
      }
    }
  }

  // Step 3: Resolve Route (Exact -> City-level Fallback)
  let route = await prisma.route.findFirst({
    where: {
      pickupLocationId,
      dropLocationId,
      isActive: true,
    },
  });

  if (!route) {
    const isPuneToMumbai =
      (pickupLocation.side === 'PUNE_SIDE' || pickupLocation.city === 'Pune') &&
      (dropLocation.side === 'MUMBAI_SIDE' || dropLocation.city === 'Mumbai' || dropLocation.city === 'Thane' || dropLocation.city === 'Navi Mumbai');
    const isMumbaiToPune =
      (pickupLocation.side === 'MUMBAI_SIDE' || pickupLocation.city === 'Mumbai' || pickupLocation.city === 'Thane' || pickupLocation.city === 'Navi Mumbai') &&
      (dropLocation.side === 'PUNE_SIDE' || dropLocation.city === 'Pune');

    if (isPuneToMumbai) {
      route = await prisma.route.findFirst({
        where: {
          pickupLocation: { name: 'Pune (All Areas)' },
          dropLocation: { name: 'Mumbai (All Areas)' },
          isActive: true,
        },
      });
    } else if (isMumbaiToPune) {
      route = await prisma.route.findFirst({
        where: {
          pickupLocation: { name: 'Mumbai (All Areas)' },
          dropLocation: { name: 'Pune (All Areas)' },
          isActive: true,
        },
      });
    }

    if (!route) {
      route = await prisma.route.findFirst({
        where: {
          pickupLocation: { side: pickupLocation.side },
          dropLocation: { side: dropLocation.side },
          isActive: true,
        },
      });
    }

    if (!route) {
      route = await prisma.route.findFirst({
        where: { isActive: true, fares: { some: { isActive: true } } },
      });
    }
  }

  if (!route) {
    throw new AppError(`Route from ${pickupLocation.name} to ${dropLocation.name} is currently unavailable.`, 404);
  }

  // Step 4: Get vehicles matching passenger capacity
  const vehicles = await prisma.vehicle.findMany({
    where: {
      isActive: true,
      seatingCapacity: { gte: numPassengers },
    },
    orderBy: [{ displayOrder: 'asc' }, { seatingCapacity: 'asc' }],
  });

  if (vehicles.length === 0) {
    throw new AppError('No suitable vehicles are available for the selected passenger count.', 400);
  }

  // Step 5: Calculate fares strictly for the requested tripType
  const vehicleQuotes = await Promise.all(
    vehicles.map(async (vehicle) => {
      const fareBreakdown = await calculateVehicleFare(route, vehicle, {
        tripType,
        parkingRequired,
        stayRequired,
        dropLocationId,
      });

      return {
        vehicleId: vehicle.id,
        name: vehicle.name,
        category: vehicle.category,
        image: vehicle.image,
        description: vehicle.description,
        seatingCapacity: vehicle.seatingCapacity,
        availability: 'AVAILABLE',
        availableQuantity: 5,
        tripType,
        fare: {
          baseFare: fareBreakdown.baseFare,
          toll: fareBreakdown.toll,
          tollBreakdown: fareBreakdown.tollBreakdown || [],
          parking: fareBreakdown.parking,
          stay: fareBreakdown.stay,
          total: fareBreakdown.total,
          fareOnRequest: fareBreakdown.fareOnRequest,
          configured: fareBreakdown.configured,
        },
      };
    })
  );

  // Step 6: Filter out vehicles without configured fares for this trip type
  const activeConfiguredVehicles = vehicleQuotes.filter(
    (v) => v.fare && v.fare.configured && v.fare.total > 0
  );

  return {
    success: true,
    tripType,
    route: {
      id: route.id,
      name: route.routeName,
      pickup: {
        id: pickupLocation.id,
        name: pickupLocation.name,
        city: pickupLocation.city,
      },
      drop: {
        id: dropLocation.id,
        name: dropLocation.name,
        city: dropLocation.city,
      },
    },
    searchParams: {
      tripType,
      pickupLocationId,
      dropLocationId,
      date: date || departureDate || null,
      time: time || departureTime || null,
      departureDate: departureDate || date || null,
      departureTime: departureTime || time || null,
      returnDate: returnDate || null,
      returnTime: returnTime || null,
      passengers: numPassengers,
      parkingRequired,
      stayRequired,
    },
    vehicles: activeConfiguredVehicles.length > 0 ? activeConfiguredVehicles : vehicleQuotes,
  };
}

module.exports = { calculateFareQuote, calculateVehicleFare };
