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

// ============================================================
// HIGH-PERFORMANCE IN-MEMORY CACHING LAYER (60s TTL)
// Completely eliminates remote roundtrips on repeated quote queries
// ============================================================
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

let cachedLocationsMap = null;
let locationsCacheTime = 0;
let locationsPromise = null;

let cachedRoutesList = null;
let routesCacheTime = 0;
let routesPromise = null;

let cachedVehiclesList = null;
let vehiclesCacheTime = 0;
let vehiclesPromise = null;

const faresCacheByRouteId = new Map();
const faresPromisesByRouteId = new Map();

function invalidateFareCache() {
  cachedLocationsMap = null;
  locationsCacheTime = 0;
  locationsPromise = null;
  cachedRoutesList = null;
  routesCacheTime = 0;
  routesPromise = null;
  cachedVehiclesList = null;
  vehiclesCacheTime = 0;
  vehiclesPromise = null;
  faresCacheByRouteId.clear();
  faresPromisesByRouteId.clear();
  warmupFareCache().catch(() => {});
}

async function getActiveLocation(locationId) {
  const now = Date.now();
  if (!cachedLocationsMap || (now - locationsCacheTime) > CACHE_TTL_MS) {
    if (!locationsPromise) {
      locationsPromise = prisma.location.findMany({ where: { isActive: true } })
        .then((locs) => {
          cachedLocationsMap = new Map(locs.map((l) => [l.id, l]));
          locationsCacheTime = Date.now();
          return cachedLocationsMap;
        })
        .finally(() => {
          locationsPromise = null;
        });
    }
    await locationsPromise;
  }
  return cachedLocationsMap ? (cachedLocationsMap.get(locationId) || null) : null;
}

async function getActiveRoutes() {
  const now = Date.now();
  if (!cachedRoutesList || (now - routesCacheTime) > CACHE_TTL_MS) {
    if (!routesPromise) {
      routesPromise = prisma.route.findMany({
        where: { isActive: true },
        include: { pickupLocation: true, dropLocation: true },
      })
        .then((routes) => {
          cachedRoutesList = routes;
          routesCacheTime = Date.now();
          return cachedRoutesList;
        })
        .finally(() => {
          routesPromise = null;
        });
    }
    await routesPromise;
  }
  return cachedRoutesList || [];
}

async function getActiveVehicles(minCapacity = 1) {
  const now = Date.now();
  if (!cachedVehiclesList || (now - vehiclesCacheTime) > CACHE_TTL_MS) {
    if (!vehiclesPromise) {
      vehiclesPromise = prisma.vehicle.findMany({
        where: { isActive: true },
        orderBy: [{ displayOrder: 'asc' }, { seatingCapacity: 'asc' }],
      })
        .then((vehicles) => {
          cachedVehiclesList = vehicles;
          vehiclesCacheTime = Date.now();
          return cachedVehiclesList;
        })
        .finally(() => {
          vehiclesPromise = null;
        });
    }
    await vehiclesPromise;
  }
  return (cachedVehiclesList || []).filter((v) => v.seatingCapacity >= minCapacity);
}

async function getActiveRouteFares(routeId) {
  const now = Date.now();
  const entry = faresCacheByRouteId.get(routeId);
  if (entry && (now - entry.timestamp) < CACHE_TTL_MS) {
    return entry.data;
  }

  if (!faresPromisesByRouteId.has(routeId)) {
    const p = prisma.fare.findMany({
      where: { routeId, isActive: true },
      include: {
        fareTolls: { where: { isActive: true } },
        fareParking: true,
        fareWaiting: true,
      },
    })
      .then((fares) => {
        faresCacheByRouteId.set(routeId, { data: fares, timestamp: Date.now() });
        return fares;
      })
      .finally(() => {
        faresPromisesByRouteId.delete(routeId);
      });
    faresPromisesByRouteId.set(routeId, p);
  }

  return faresPromisesByRouteId.get(routeId);
}

/**
 * Calculate fare for a single vehicle on a given route and tripType
 * Accepts optional preloadedFares to eliminate sequential remote database queries
 */
async function calculateVehicleFare(route, vehicle, options = {}, preloadedFares = null) {
  const { tripType = 'ONE_WAY', parkingRequired = true, stayRequired = false, dropLocationId } = options;

  // 1. Load fare config (exact route + vehicle + tripType match)
  let fareConfig = preloadedFares
    ? preloadedFares.find(
        (f) =>
          f.routeId === route.id &&
          f.vehicleId === vehicle.id &&
          f.tripType === tripType &&
          f.isActive
      )
    : null;

  if (!fareConfig && !preloadedFares) {
    fareConfig = await prisma.fare.findFirst({
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
  }

  // Fallback: If ROUND_TRIP has no specific fare, check ONE_WAY and multiply base by 2
  if (!fareConfig && tripType === 'ROUND_TRIP') {
    const oneWayFare = preloadedFares
      ? preloadedFares.find(
          (f) =>
            f.routeId === route.id &&
            f.vehicleId === vehicle.id &&
            f.tripType === 'ONE_WAY' &&
            f.isActive
        )
      : await prisma.fare.findFirst({
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
    totalToll = toNumber(fareConfig.fareTolls.reduce((sum, t) => sum + toNumber(t.amount), 0));
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

  const total = toNumber(baseFare + totalToll + totalParking + totalStay);

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
        city: { contains: targetCity, mode: 'insensitive' },
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
        where: { city: { contains: targetCity, mode: 'insensitive' }, isActive: true },
      });
      if (anyVehicles) {
        throw new AppError('No suitable local vehicles are available for the selected passenger count.', 400);
      }
      throw new AppError(`No active local cab packages found for ${targetCity}. Please contact dispatch.`, 404);
    }

    const vehicleQuotes = localVehicles.map((v) => {
      const parking = v.parkingEnabled ? toNumber(v.parkingAmount) : 0;
      const total = toNumber(toNumber(v.baseFare) + parking);

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

  // Step 1: Validate pickup & drop locations using fast caching layer
  const [pickupLocation, dropLocation] = await Promise.all([
    getActiveLocation(pickupLocationId),
    getActiveLocation(dropLocationId),
  ]);

  if (!pickupLocation) {
    throw new AppError('Pickup location does not exist or is inactive.', 404);
  }
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

  // Step 3: Resolve Route (Exact -> City-level Fallback) from cached active routes
  const allRoutes = await getActiveRoutes();
  let route = allRoutes.find(
    (r) => r.pickupLocationId === pickupLocationId && r.dropLocationId === dropLocationId && r.isActive
  );

  if (!route) {
    const isPuneToMumbai =
      (pickupLocation.side === 'PUNE_SIDE' || pickupLocation.city === 'Pune') &&
      (dropLocation.side === 'MUMBAI_SIDE' || dropLocation.city === 'Mumbai' || dropLocation.city === 'Thane' || dropLocation.city === 'Navi Mumbai');
    const isMumbaiToPune =
      (pickupLocation.side === 'MUMBAI_SIDE' || pickupLocation.city === 'Mumbai' || pickupLocation.city === 'Thane' || pickupLocation.city === 'Navi Mumbai') &&
      (dropLocation.side === 'PUNE_SIDE' || dropLocation.city === 'Pune');

    if (isPuneToMumbai) {
      route = allRoutes.find(
        (r) =>
          r.pickupLocation?.name === 'Pune (All Areas)' &&
          r.dropLocation?.name === 'Mumbai (All Areas)' &&
          r.isActive
      );
    } else if (isMumbaiToPune) {
      route = allRoutes.find(
        (r) =>
          r.pickupLocation?.name === 'Mumbai (All Areas)' &&
          r.dropLocation?.name === 'Pune (All Areas)' &&
          r.isActive
      );
    }

    if (!route) {
      route = allRoutes.find(
        (r) =>
          r.pickupLocation?.side === pickupLocation.side &&
          r.dropLocation?.side === dropLocation.side &&
          r.isActive
      );
    }
  }

  if (!route) {
    throw new AppError(`Route from ${pickupLocation.name} to ${dropLocation.name} is currently unavailable.`, 404);
  }

  // Step 4: Get vehicles and all route fares concurrently using cached accessors
  const [vehicles, allFaresForRoute] = await Promise.all([
    getActiveVehicles(numPassengers),
    getActiveRouteFares(route.id),
  ]);

  if (vehicles.length === 0) {
    throw new AppError('No suitable vehicles are available for the selected passenger count.', 400);
  }

  // Step 5: Calculate fares strictly for the requested tripType using preloaded fares
  const vehicleQuotes = await Promise.all(
    vehicles.map(async (vehicle) => {
      const fareBreakdown = await calculateVehicleFare(
        route,
        vehicle,
        {
          tripType,
          parkingRequired,
          stayRequired,
          dropLocationId,
        },
        allFaresForRoute
      );

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

async function warmupFareCache() {
  try {
    const start = Date.now();
    const [locs, routes, vehicles, allFares] = await Promise.all([
      prisma.location.findMany({ where: { isActive: true } }),
      prisma.route.findMany({
        where: { isActive: true },
        include: { pickupLocation: true, dropLocation: true },
      }),
      prisma.vehicle.findMany({
        where: { isActive: true },
        orderBy: [{ displayOrder: 'asc' }, { seatingCapacity: 'asc' }],
      }),
      prisma.fare.findMany({
        where: { isActive: true },
        include: {
          fareTolls: { where: { isActive: true } },
          fareParking: true,
          fareWaiting: true,
        },
      }),
    ]);

    cachedLocationsMap = new Map(locs.map((l) => [l.id, l]));
    locationsCacheTime = Date.now();

    cachedRoutesList = routes;
    routesCacheTime = Date.now();

    cachedVehiclesList = vehicles;
    vehiclesCacheTime = Date.now();

    faresCacheByRouteId.clear();
    for (const f of allFares) {
      if (!faresCacheByRouteId.has(f.routeId)) {
        faresCacheByRouteId.set(f.routeId, { data: [], timestamp: Date.now() });
      }
      faresCacheByRouteId.get(f.routeId).data.push(f);
    }

    console.log(`[FareCache] Pre-warmed cache with ${locs.length} locations, ${routes.length} routes, ${vehicles.length} vehicles, ${allFares.length} fares in ${Date.now() - start}ms`);
  } catch (err) {
    console.warn('[FareCache] Warmup deferred or failed:', err.message);
  }
}

module.exports = { calculateFareQuote, calculateVehicleFare, invalidateFareCache, warmupFareCache };
