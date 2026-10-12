const prisma = require('../utils/prisma');
const { AppError } = require('../middleware/errorHandler');
const { calculateFareQuote } = require('../services/fareCalculationService');

/**
 * POST /api/bookings — Create booking with server-side recalculated fare (ONE_WAY, ROUND_TRIP, LOCAL)
 */
const createBooking = async (req, res, next) => {
  try {
    const {
      tripType = 'ONE_WAY',
      pickupLocationId,
      dropLocationId,
      vehicleId,
      localVehicleId,
      city,
      durationHours,
      pickupDate,
      pickupTime,
      returnDate,
      returnTime,
      passengers = 1,
      customerName,
      customerPhone,
      customerEmail,
      pickupAddress,
      dropAddress,
      paymentStatus,
      paymentId,
      paymentMethod,
      isPhoneVerified,
    } = req.body;

    const isDevelopment = process.env.NODE_ENV !== 'production';

    // SECURITY ISOLATION:
    // In production, unverified client-supplied paymentStatus cannot be trusted as COMPLETED.
    // Real payments must be verified via gateway webhooks/signatures before marking CONFIRMED/COMPLETED.
    const resolvedPaymentStatus = isDevelopment ? (paymentStatus || 'COMPLETED') : 'PENDING';
    const resolvedBookingStatus = (isDevelopment && resolvedPaymentStatus === 'COMPLETED') ? 'CONFIRMED' : 'PENDING';

    const generatedPaymentId =
      paymentId || (isDevelopment ? `dev_sim_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 6)}` : null);

    const paymentInfo = {
      paymentStatus: resolvedPaymentStatus,
      paymentId: generatedPaymentId,
      paymentMethod: paymentMethod || (isDevelopment ? 'Simulated Dev Payment' : 'PENDING_GATEWAY'),
      isPhoneVerified: isDevelopment ? !!isPhoneVerified : false,
      isSimulated: isDevelopment,
      verifiedAt: isDevelopment ? new Date().toISOString() : null,
    };

    if (!customerName || !customerPhone) {
      return next(new AppError('Customer Name and Phone Number are required.', 400));
    }

    const numPassengers = parseInt(passengers, 10) || 1;

    // ============================================================
    // MODE 1: LOCAL TRAVEL BOOKING
    // ============================================================
    if (tripType === 'LOCAL') {
      const targetVehicleId = localVehicleId || vehicleId;
      if (!targetVehicleId) {
        return next(new AppError('Please select a local vehicle package.', 400));
      }

      const localVehicle = await prisma.localVehicle.findUnique({
        where: { id: targetVehicleId },
      });

      if (!localVehicle || !localVehicle.isActive) {
        return next(new AppError('Selected local vehicle package is no longer available.', 404));
      }

      if (numPassengers > localVehicle.seatingCapacity) {
        return next(new AppError(`Vehicle capacity exceeded. Max allowed is ${localVehicle.seatingCapacity} passengers.`, 400));
      }

      const parkingAmount = localVehicle.parkingEnabled ? parseFloat(localVehicle.parkingAmount) : 0;
      const serverCalculatedTotal = parseFloat(localVehicle.baseFare) + parkingAmount;

      const fareDetails = {
        tripType: 'LOCAL',
        city: localVehicle.city,
        durationHours: localVehicle.durationHours,
        baseFare: parseFloat(localVehicle.baseFare),
        extraHourCharge: parseFloat(localVehicle.extraHourCharge),
        parking: parkingAmount,
        total: serverCalculatedTotal,
        paymentInfo,
      };

      const booking = await prisma.booking.create({
        data: {
          tripType: 'LOCAL',
          localVehicleId: localVehicle.id,
          city: localVehicle.city,
          durationHours: localVehicle.durationHours,
          pickupDate: pickupDate ? new Date(pickupDate) : new Date(),
          pickupTime: pickupTime || '08:00 AM',
          passengers: numPassengers,
          fareTotal: serverCalculatedTotal,
          fareDetails: JSON.stringify(fareDetails),
          customerName,
          customerPhone,
          customerEmail,
          pickupAddress: pickupAddress || `${localVehicle.city} Area`,
          dropAddress: dropAddress || 'Local City Travel',
          notes,
          status: resolvedBookingStatus,
        },
        include: {
          localVehicle: true,
        },
      });

      return res.status(201).json({
        success: true,
        message: 'Local rental booking & payment confirmed successfully!',
        data: booking,
      });
    }

    // ============================================================
    // MODE 2 & 3: ONE_WAY / ROUND_TRIP INTERCITY BOOKING
    // ============================================================
    if (!pickupLocationId || !dropLocationId || !vehicleId) {
      return next(new AppError('Pickup location, Drop location, and Vehicle selection are required.', 400));
    }

    // Server-side recalculation of fare quote
    const fareQuote = await calculateFareQuote({
      tripType,
      pickupLocationId,
      dropLocationId,
      vehicleId,
      date: pickupDate,
      time: pickupTime,
      departureDate: pickupDate,
      departureTime: pickupTime,
      returnDate,
      returnTime,
      passengers: numPassengers,
    });

    if (!fareQuote.success) {
      return next(new AppError('Route is not available for booking.', 400));
    }

    const selectedVehicleQuote = fareQuote.vehicles.find((v) => v.vehicleId === vehicleId);

    if (!selectedVehicleQuote) {
      return next(new AppError('Selected vehicle is not available for this route.', 404));
    }

    if (selectedVehicleQuote.availability === 'UNAVAILABLE') {
      return next(new AppError('Vehicle is unavailable for the selected date and time.', 400));
    }

    const serverCalculatedTotal = selectedVehicleQuote.fare.total;

    // Resolve or find the route
    const route = await prisma.route.findFirst({
      where: {
        OR: [
          { id: fareQuote.route.id },
          { pickupLocationId, dropLocationId, isActive: true },
        ],
      },
    });

    const routeId = route ? route.id : fareQuote.route.id;

    const fullFareDetails = {
      ...selectedVehicleQuote.fare,
      paymentInfo,
    };

    const booking = await prisma.booking.create({
      data: {
        routeId,
        vehicleId,
        tripType: tripType === 'ROUND_TRIP' ? 'ROUND_TRIP' : 'ONE_WAY',
        pickupDate: pickupDate ? new Date(pickupDate) : new Date(),
        pickupTime: pickupTime || '08:00 AM',
        returnDate: returnDate ? new Date(returnDate) : null,
        returnTime: returnTime || null,
        passengers: numPassengers,
        fareTotal: serverCalculatedTotal,
        fareDetails: JSON.stringify(fullFareDetails),
        customerName,
        customerPhone,
        customerEmail,
        pickupAddress,
        dropAddress,
        notes,
        status: resolvedBookingStatus,
      },
      include: {
        route: {
          include: {
            pickupLocation: true,
            dropLocation: true,
          },
        },
        vehicle: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Booking & payment confirmed successfully!',
      data: booking,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/bookings — Admin view all bookings with full metadata
 */
const adminGetBookings = async (req, res, next) => {
  try {
    const { tripType, status } = req.query;

    const bookings = await prisma.booking.findMany({
      where: {
        ...(tripType && { tripType }),
        ...(status && { status }),
      },
      include: {
        route: {
          include: {
            pickupLocation: { select: { name: true, city: true } },
            dropLocation: { select: { name: true, city: true } },
          },
        },
        vehicle: { select: { name: true, category: true, image: true } },
        localVehicle: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: bookings, count: bookings.length });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/admin/bookings/:id/status — Admin update booking status
 */
const updateBookingStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'];
    if (!status || !validStatuses.includes(status)) {
      return next(new AppError(`Status must be one of: ${validStatuses.join(', ')}`, 400));
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: { status },
      include: {
        route: { include: { pickupLocation: true, dropLocation: true } },
        vehicle: true,
        localVehicle: true,
      },
    });

    res.json({ success: true, message: `Booking marked as ${status}`, data: updated });
  } catch (err) {
    next(err);
  }
};

module.exports = { createBooking, adminGetBookings, updateBookingStatus };
