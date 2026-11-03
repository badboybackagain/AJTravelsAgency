// ============================================================
// Customer Enquiry Controller — Submission, Persistence & Alerts
// ============================================================

const prisma = require('../utils/prisma');
const { AppError } = require('../middleware/errorHandler');
const { calculateFareQuote } = require('../services/fareCalculationService');
const {
  sanitizePhoneNumber,
  isValidPhoneNumber,
  sendEnquiryNotification,
} = require('../services/whatsappService');

/**
 * POST /api/enquiries — Public Customer Enquiry Submission
 */
const createEnquiry = async (req, res, next) => {
  try {
    const {
      name,
      phone,
      pickup,
      destination,
      drop,
      travelDate,
      date,
      vehicle,
      message,
      // Additional journey fields from Fallback submission:
      pickupAddress,
      dropAddress,
      pickupLocationId,
      dropLocationId,
      vehicleId,
      localVehicleId,
      tripType,
      departureTime,
      time,
      passengers,
      city,
      duration,
      durationHours,
      notes,
      source,
    } = req.body;

    const resolvedDestination = (destination || drop || dropAddress || '').trim();
    const resolvedPickup = (pickup || pickupAddress || '').trim();
    const resolvedTravelDate = (travelDate || date || '').trim() || null;

    if (!name || !name.trim()) {
      return next(new AppError('Full name is required.', 400));
    }
    if (!phone || !phone.trim()) {
      return next(new AppError('Mobile number is required.', 400));
    }
    if (!resolvedPickup) {
      return next(new AppError('Pickup location is required.', 400));
    }
    if (!resolvedDestination) {
      return next(new AppError('Drop location is required.', 400));
    }

    const cleanPhone = sanitizePhoneNumber(phone);
    if (!isValidPhoneNumber(cleanPhone)) {
      return next(new AppError('Please enter a valid 10-digit mobile number.', 400));
    }

    // Server-side Authoritative Fare Calculation for enquiries:
    let calculatedFare = null;
    let resolvedVehicleName = vehicle ? vehicle.trim() : null;

    if ((pickupLocationId && dropLocationId) || (tripType === 'LOCAL' && city)) {
      try {
        const quoteResult = await calculateFareQuote({
          tripType: tripType || 'ONE_WAY',
          pickupLocationId: pickupLocationId || undefined,
          dropLocationId: dropLocationId || undefined,
          city: tripType === 'LOCAL' ? city : undefined,
          duration: durationHours || duration ? parseInt(durationHours || duration, 10) : undefined,
          date: resolvedTravelDate,
          time: departureTime || time,
          passengers: parseInt(passengers, 10) || 1,
        });

        if (quoteResult && quoteResult.vehicles && quoteResult.vehicles.length > 0) {
          const targetVehId = vehicleId || localVehicleId;
          const matched = targetVehId
            ? quoteResult.vehicles.find((v) => v.vehicleId === targetVehId || v.id === targetVehId)
            : quoteResult.vehicles[0];

          if (matched) {
            if (!resolvedVehicleName) {
              resolvedVehicleName = matched.name;
            }
            if (matched.fare) {
              calculatedFare = matched.fare;
            }
          }
        }
      } catch (calcErr) {
        console.warn('Fallback enquiry server fare calculation skipped:', calcErr.message);
      }
    }

    // Build structured message if submitted via web fallback or contains structured addresses
    const isFallbackRequest =
      source === 'WEB_FALLBACK' ||
      (!message && (pickupAddress || dropAddress || tripType)) ||
      (message && message.includes('[WEB DIRECT REQUEST'));

    let formattedMessage = '';

    if (isFallbackRequest) {
      const lines = [
        '[WEB DIRECT REQUEST — UNVERIFIED PHONE]',
        `Trip Type: ${tripType === 'ROUND_TRIP' ? 'Round Trip' : tripType === 'LOCAL' ? 'Local City Rental' : 'One Way'}`,
        `Pickup Location: ${resolvedPickup}`,
      ];

      if (pickupAddress && pickupAddress.trim() && pickupAddress.trim() !== resolvedPickup) {
        lines.push(`Pickup Address: ${pickupAddress.trim()}`);
      }

      lines.push(`Drop Location: ${resolvedDestination}`);

      if (dropAddress && dropAddress.trim() && dropAddress.trim() !== resolvedDestination) {
        lines.push(`Drop Address: ${dropAddress.trim()}`);
      }

      if (departureTime || time) {
        lines.push(`Departure Time: ${(departureTime || time).trim()}`);
      }

      if (passengers) {
        lines.push(`Passengers: ${passengers} Person(s)`);
      }

      if (calculatedFare) {
        lines.push(
          `Server Quoted Fare: ₹${calculatedFare.total?.toLocaleString() || calculatedFare.total} (Base: ₹${calculatedFare.baseFare || 0}, Tolls: ₹${calculatedFare.toll || 0}, Parking: ₹${calculatedFare.parking || 0})`
        );
      }

      if (notes && notes.trim()) {
        lines.push(`Customer Notes: ${notes.trim()}`);
      }

      if (message && message.trim() && !message.includes('[WEB DIRECT REQUEST')) {
        lines.push(`Message: ${message.trim()}`);
      }

      formattedMessage = lines.join('\n');
    } else {
      formattedMessage = message ? message.trim() : null;
    }

    // Accidental double-tap / network retry suppression:
    // Only suppress if key journey fields (phone, pickup, destination, travelDate)
    // were created within the last 10 seconds.
    const recentDuplicate = await prisma.enquiry.findFirst({
      where: {
        phone: cleanPhone,
        pickup: resolvedPickup,
        destination: resolvedDestination,
        travelDate: resolvedTravelDate,
        createdAt: {
          gte: new Date(Date.now() - 10 * 1000),
        },
      },
    });

    if (recentDuplicate) {
      return res.status(200).json({
        success: true,
        message: 'Thank you! Your trip request has been received. Our team will contact you shortly.',
        data: {
          id: recentDuplicate.id,
          reference: `ENQ-${recentDuplicate.id.slice(-6).toUpperCase()}`,
          name: recentDuplicate.name,
          pickup: recentDuplicate.pickup,
          destination: recentDuplicate.destination,
          travelDate: recentDuplicate.travelDate,
          status: recentDuplicate.status,
        },
      });
    }

    // 1. Persist the enquiry in Supabase database
    const enquiry = await prisma.enquiry.create({
      data: {
        name: name.trim(),
        phone: cleanPhone,
        pickup: resolvedPickup,
        destination: resolvedDestination,
        travelDate: resolvedTravelDate,
        vehicle: resolvedVehicleName,
        message: formattedMessage || null,
        status: 'NEW',
      },
    });

    // 2. Trigger WhatsApp notification asynchronously (isolated; never fails enquiry)
    sendEnquiryNotification(enquiry).catch((notifErr) => {
      console.error('Enquiry WhatsApp dispatch notice:', notifErr.message);
    });

    return res.status(201).json({
      success: true,
      message: 'Thank you! Your trip request has been received. Our team will contact you to confirm availability and the final booking details.',
      data: {
        id: enquiry.id,
        reference: `ENQ-${enquiry.id.slice(-6).toUpperCase()}`,
        name: enquiry.name,
        pickup: enquiry.pickup,
        destination: enquiry.destination,
        travelDate: enquiry.travelDate,
        status: enquiry.status,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/enquiries — Admin View All Enquiries with Optional Status & Search Filtering
 */
const adminGetEnquiries = async (req, res, next) => {
  try {
    const { status, search } = req.query;

    // 1. Fetch all enquiries chronologically to build a permanent, stable sequence mapping
    // (e.g. ENQ-1001, ENQ-1002, ENQ-1003...)
    const allEnquiriesOrder = await prisma.enquiry.findMany({
      select: { id: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const idToNumberMap = new Map();
    allEnquiriesOrder.forEach((item, index) => {
      idToNumberMap.set(item.id, `ENQ-${1001 + index}`);
    });

    const where = {};
    if (status && status !== 'ALL' && ['NEW', 'CONTACTED', 'RESOLVED'].includes(status)) {
      where.status = status;
    }

    if (search && search.trim()) {
      const q = search.trim();
      const qUpper = q.toUpperCase();

      // Find any enquiry IDs that match the sequence number (e.g., "1005" or "ENQ-1005")
      const matchedIds = [];
      idToNumberMap.forEach((enqNum, id) => {
        if (enqNum.includes(qUpper) || enqNum.replace('ENQ-', '').includes(qUpper)) {
          matchedIds.push(id);
        }
      });

      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
        { pickup: { contains: q, mode: 'insensitive' } },
        { destination: { contains: q, mode: 'insensitive' } },
        { vehicle: { contains: q, mode: 'insensitive' } },
        { id: { contains: q, mode: 'insensitive' } },
        ...(matchedIds.length > 0 ? [{ id: { in: matchedIds } }] : []),
      ];
    }

    const enquiries = await prisma.enquiry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const enriched = enquiries.map((enq) => {
      const enquiryNumber = idToNumberMap.get(enq.id) || `ENQ-${1000 + enquiries.length}`;
      return {
        ...enq,
        enquiryNumber,
        reference: enquiryNumber,
        shortCode: enq.id ? enq.id.slice(-6).toUpperCase() : null,
      };
    });

    res.json({ success: true, count: enriched.length, data: enriched });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/admin/enquiries/:id/status — Admin Update Status
 */
const adminUpdateEnquiryStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['NEW', 'CONTACTED', 'RESOLVED'];

    if (!status || !validStatuses.includes(status)) {
      return next(new AppError(`Status must be one of: ${validStatuses.join(', ')}`, 400));
    }

    const updated = await prisma.enquiry.update({
      where: { id },
      data: { status },
    });

    res.json({ success: true, message: `Enquiry marked as ${status}`, data: updated });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createEnquiry,
  adminGetEnquiries,
  adminUpdateEnquiryStatus,
};
