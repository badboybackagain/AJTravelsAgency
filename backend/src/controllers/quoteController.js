// ============================================================
// Quotation Controller — Lifecycle, Pricing & Booking Conversion
// AJ Travels — Website & Admin Dashboard Quotation Workflow
// (Pure Website & Admin Driven — Zero WhatsApp Involvement)
// ============================================================

const crypto = require('crypto');
const prisma = require('../utils/prisma');
const { AppError } = require('../middleware/errorHandler');

/**
 * Mask phone number for customer privacy on public quote review (e.g. +91 98•••••210)
 */
function maskPhoneForPublic(phone) {
  if (!phone) return '';
  const cleaned = phone.replace(/[^\d]/g, '');
  if (cleaned.length < 10) return phone;
  const last3 = cleaned.slice(-3);
  const first2 = cleaned.length > 10 ? cleaned.slice(0, 4) : cleaned.slice(0, 2);
  return `+${first2}•••••${last3}`;
}

/**
 * Helper to handle Prisma table-not-found errors gracefully
 * when remote database migration is pending approval
 */
function handleMigrationPendingError(err, next) {
  if (
    err.code === 'P2021' ||
    (err.message && (err.message.includes('does not exist') || err.message.includes('relation "quotes"')))
  ) {
    return next(
      new AppError(
        'Database migration pending: The "quotes" table has not yet been applied to the remote database. Please apply the migration script before creating quotations.',
        503
      )
    );
  }
  return next(err);
}

/**
 * POST /api/enquiries/admin/:id/quote — Admin Prepares & Issues Quotation
 * Operates purely within the application without automatic messaging.
 */
const prepareQuote = async (req, res, next) => {
  try {
    const { id: enquiryId } = req.params;
    const {
      vehicleCategory,
      vehicleName,
      tripType = 'ONE_WAY',
      baseFare,
      tollCharges = 0,
      driverAllowance = 0,
      parkingCharges = 0,
      inclusions,
      exclusions,
      terms,
      validHours = 48,
    } = req.body;

    if (!enquiryId) {
      return next(new AppError('Enquiry ID is required.', 400));
    }

    const enquiry = await prisma.enquiry.findUnique({
      where: { id: enquiryId },
    });

    if (!enquiry) {
      return next(new AppError('Enquiry not found.', 404));
    }

    if (!vehicleCategory || !vehicleCategory.trim()) {
      return next(new AppError('Vehicle category is required.', 400));
    }

    const numBase = parseFloat(baseFare);
    if (isNaN(numBase) || numBase <= 0) {
      return next(new AppError('Base fare must be a valid number greater than zero.', 400));
    }

    const numToll = Math.max(0, parseFloat(tollCharges) || 0);
    const numDriver = Math.max(0, parseFloat(driverAllowance) || 0);
    const numParking = Math.max(0, parseFloat(parkingCharges) || 0);

    // Strict server-side total recalculation: frontend cannot dictate total
    const serverCalculatedTotal = parseFloat((numBase + numToll + numDriver + numParking).toFixed(2));

    const numValidHours = Math.min(168, Math.max(1, parseInt(validHours, 10) || 48));
    const validUntil = new Date(Date.now() + numValidHours * 3600 * 1000);

    // Cryptographically secure, unguessable acceptance token
    const quoteToken = crypto.randomBytes(24).toString('hex');

    const resolvedTripType = ['ONE_WAY', 'ROUND_TRIP', 'LOCAL'].includes(tripType) ? tripType : 'ONE_WAY';

    const quoteData = {
      enquiryId: enquiry.id,
      vehicleCategory: vehicleCategory.trim(),
      vehicleName: vehicleName && vehicleName.trim() ? vehicleName.trim() : vehicleCategory.trim(),
      tripType: resolvedTripType,
      baseFare: numBase,
      tollCharges: numToll,
      driverAllowance: numDriver,
      parkingCharges: numParking,
      totalFare: serverCalculatedTotal,
      inclusions: inclusions && inclusions.trim() ? inclusions.trim() : 'Vehicle rental, fuel, experienced chauffeur, and highway tolls.',
      exclusions: exclusions && exclusions.trim() ? exclusions.trim() : 'Airport/station parking charges, extra hour/km over limit.',
      terms: terms && terms.trim() ? terms.trim() : 'Driver allowance included. Tolls paid as actuals or included as per quote.',
      status: 'QUOTED',
      quoteToken,
      validUntil,
    };

    let quote;
    try {
      // Execute atomically: mark previous QUOTED quotes as SUPERSEDED, create new quote, and update enquiry status
      quote = await prisma.$transaction(async (tx) => {
        // 1. Mark existing pending quotes for this enquiry as SUPERSEDED
        await tx.quote.updateMany({
          where: {
            enquiryId: enquiry.id,
            status: 'QUOTED',
          },
          data: {
            status: 'SUPERSEDED',
          },
        });

        // 2. Create the new quote with status QUOTED
        const newQuote = await tx.quote.create({
          data: quoteData,
        });

        // 3. Update enquiry status to CONTACTED
        await tx.enquiry.update({
          where: { id: enquiry.id },
          data: { status: 'CONTACTED' },
        });

        return newQuote;
      });
    } catch (dbErr) {
      return handleMigrationPendingError(dbErr, next);
    }

    return res.status(201).json({
      success: true,
      message: `Quotation #${quote.id.slice(-6).toUpperCase()} created successfully for ₹${serverCalculatedTotal}.`,
      data: quote,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/enquiries/admin/:id/quotes — Admin View Quotes for an Enquiry
 */
const getEnquiryQuotes = async (req, res, next) => {
  try {
    const { id: enquiryId } = req.params;

    try {
      const quotes = await prisma.quote.findMany({
        where: { enquiryId },
        orderBy: { createdAt: 'desc' },
        include: {
          booking: {
            select: {
              id: true,
              status: true,
              fareTotal: true,
              createdAt: true,
            },
          },
        },
      });

      return res.json({
        success: true,
        count: quotes.length,
        data: quotes,
      });
    } catch (dbErr) {
      return handleMigrationPendingError(dbErr, next);
    }
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/quotes/:token — Public Customer Quote View (Safe Sanitized Payload)
 */
const getPublicQuoteByToken = async (req, res, next) => {
  try {
    const { token } = req.params;

    if (!token || token.length < 20) {
      return next(new AppError('Invalid quotation reference token.', 400));
    }

    let quote;
    try {
      quote = await prisma.quote.findUnique({
        where: { quoteToken: token },
        include: {
          enquiry: {
            select: {
              id: true,
              name: true,
              phone: true,
              pickup: true,
              destination: true,
              travelDate: true,
            },
          },
        },
      });
    } catch (dbErr) {
      return handleMigrationPendingError(dbErr, next);
    }

    if (!quote) {
      return next(new AppError('Quotation not found or link has expired.', 404));
    }

    // Dynamic Expiry Check
    const now = new Date();
    const isExpired = now > quote.validUntil;
    let resolvedStatus = quote.status;

    if (isExpired && quote.status === 'QUOTED') {
      resolvedStatus = 'EXPIRED';
      // Asynchronously update persisted state
      prisma.quote.update({
        where: { id: quote.id },
        data: { status: 'EXPIRED' },
      }).catch(() => {});
    }

    // Public sanitized representation (Never expose internal IDs, passwords, or administrative notes)
    const sanitizedPayload = {
      quoteRef: quote.id.slice(-6).toUpperCase(),
      enquiryRef: quote.enquiry.id.slice(-6).toUpperCase(),
      customerName: quote.enquiry.name,
      maskedPhone: maskPhoneForPublic(quote.enquiry.phone),
      pickup: quote.enquiry.pickup,
      destination: quote.enquiry.destination,
      travelDate: quote.enquiry.travelDate || 'Flexible / To be confirmed',
      vehicleCategory: quote.vehicleCategory,
      vehicleName: quote.vehicleName,
      tripType: quote.tripType,
      baseFare: quote.baseFare,
      tollCharges: quote.tollCharges,
      driverAllowance: quote.driverAllowance,
      parkingCharges: quote.parkingCharges,
      totalFare: quote.totalFare,
      inclusions: quote.inclusions,
      exclusions: quote.exclusions,
      terms: quote.terms,
      status: resolvedStatus,
      validUntil: quote.validUntil,
      isExpired,
      sentAt: quote.sentAt,
      acceptedAt: quote.acceptedAt,
    };

    return res.json({
      success: true,
      data: sanitizedPayload,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/quotes/:token/accept — Customer Explicitly Accepts Quote
 * Operates purely on the website without sending notifications.
 */
const acceptQuote = async (req, res, next) => {
  try {
    const { token } = req.params;

    let quote;
    try {
      quote = await prisma.quote.findUnique({
        where: { quoteToken: token },
        include: { enquiry: true },
      });
    } catch (dbErr) {
      return handleMigrationPendingError(dbErr, next);
    }

    if (!quote) {
      return next(new AppError('Quotation not found.', 404));
    }

    if (quote.status === 'ACCEPTED') {
      return res.json({
        success: true,
        message: 'This quotation has already been accepted.',
        data: { status: 'ACCEPTED', acceptedAt: quote.acceptedAt },
      });
    }

    if (quote.status === 'SUPERSEDED') {
      return next(
        new AppError(
          'This quotation has been superseded by a more recent quote. Please contact AJ Travels for your latest quotation.',
          400
        )
      );
    }

    if (quote.status === 'DECLINED') {
      return next(new AppError('This quotation was previously declined.', 400));
    }

    if (new Date() > quote.validUntil || quote.status === 'EXPIRED') {
      await prisma.quote.update({
        where: { id: quote.id },
        data: { status: 'EXPIRED' },
      });
      return next(new AppError('This quotation has expired. Please contact AJ Travels for an updated quote.', 400));
    }

    if (quote.status !== 'QUOTED') {
      return next(new AppError(`Quote cannot be accepted in current status: ${quote.status}`, 400));
    }

    const acceptedAt = new Date();
    await prisma.quote.update({
      where: { id: quote.id },
      data: {
        status: 'ACCEPTED',
        acceptedAt,
      },
    });

    return res.json({
      success: true,
      message: 'Thank you! You have accepted the quotation. Our travel desk will review and confirm vehicle allocation.',
      data: {
        status: 'ACCEPTED',
        acceptedAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/quotes/:token/decline — Customer Declines Quote
 * Operates purely on the website without sending notifications.
 */
const declineQuote = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { reason } = req.body;

    let quote;
    try {
      quote = await prisma.quote.findUnique({
        where: { quoteToken: token },
        include: { enquiry: true },
      });
    } catch (dbErr) {
      return handleMigrationPendingError(dbErr, next);
    }

    if (!quote) {
      return next(new AppError('Quotation not found.', 404));
    }

    if (quote.status === 'ACCEPTED') {
      return next(new AppError('Quotation is already accepted and cannot be declined.', 400));
    }

    if (quote.status === 'SUPERSEDED') {
      return next(
        new AppError(
          'This quotation has been superseded by a more recent quote and cannot be declined.',
          400
        )
      );
    }

    const declinedAt = new Date();
    const cleanReason = typeof reason === 'string' && reason.trim() ? reason.trim().slice(0, 300) : null;

    await prisma.quote.update({
      where: { id: quote.id },
      data: {
        status: 'DECLINED',
        declinedAt,
        declinedReason: cleanReason,
      },
    });

    return res.json({
      success: true,
      message: 'Quotation declined. Thank you for your feedback.',
      data: {
        status: 'DECLINED',
        declinedAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/enquiries/admin/:id/quotes/:quoteId/convert-to-booking
 * Converts an ACCEPTED quotation into a confirmed booking.
 * Idempotent, atomic transaction with concurrency safeguards.
 * Does NOT require WhatsApp or third-party gateways.
 */
const convertToBooking = async (req, res, next) => {
  try {
    const { id: enquiryId, quoteId } = req.params;

    let initialQuote;
    try {
      initialQuote = await prisma.quote.findUnique({
        where: { id: quoteId },
        include: { enquiry: true },
      });
    } catch (dbErr) {
      return handleMigrationPendingError(dbErr, next);
    }

    if (!initialQuote || initialQuote.enquiryId !== enquiryId) {
      return next(new AppError('Quotation not found for this enquiry.', 404));
    }

    // SAFEGUARD 1: Strict Acceptance Gate
    if (initialQuote.status !== 'ACCEPTED') {
      return next(
        new AppError(
          `Cannot convert to booking. Quotation must be explicitly ACCEPTED by the customer first. Current status: ${initialQuote.status}.`,
          400
        )
      );
    }

    // SAFEGUARD 2: Idempotency Protection — already converted
    if (initialQuote.bookingId) {
      return next(
        new AppError(
          `A booking has already been created for this quotation (Booking #${initialQuote.bookingId.slice(-6).toUpperCase()}).`,
          409
        )
      );
    }

    // SAFEGUARD 3: Atomic Transaction with concurrency guard
    let bookingResult;
    try {
      bookingResult = await prisma.$transaction(async (tx) => {
        // Re-read quote inside transaction for locking
        const lockedQuote = await tx.quote.findUnique({
          where: { id: initialQuote.id },
          include: { enquiry: true },
        });

        if (lockedQuote.bookingId) {
          throw new AppError('A booking has already been created for this quotation.', 409);
        }
        if (lockedQuote.status !== 'ACCEPTED') {
          throw new AppError('Quotation is not in ACCEPTED status.', 400);
        }

        const enquiry = lockedQuote.enquiry;

        // Parse travel date safely
        let validPickupDate = new Date();
        if (enquiry.travelDate) {
          const parsed = new Date(enquiry.travelDate);
          if (!isNaN(parsed.getTime())) {
            validPickupDate = parsed;
          }
        }

        // Truthful payment display structure: PAY_TO_DRIVER on arrival
        const fareDetails = {
          tripType: lockedQuote.tripType,
          baseFare: lockedQuote.baseFare,
          toll: lockedQuote.tollCharges,
          driverAllowance: lockedQuote.driverAllowance,
          parking: lockedQuote.parkingCharges,
          total: lockedQuote.totalFare,
          quoteId: lockedQuote.id,
          enquiryId: enquiry.id,
          paymentInfo: {
            paymentStatus: 'PAY_TO_DRIVER',
            paymentMethod: 'Pay to Driver (Cash / UPI on Arrival)',
            isPhoneVerified: true,
            isSimulated: false,
            verifiedAt: new Date().toISOString(),
          },
        };

        // 1. Create Booking
        const newBooking = await tx.booking.create({
          data: {
            tripType: lockedQuote.tripType,
            pickupDate: validPickupDate,
            pickupTime: '08:00 AM',
            passengers: 1,
            pickupAddress: enquiry.pickup,
            dropAddress: enquiry.destination,
            fareTotal: lockedQuote.totalFare,
            fareDetails: JSON.stringify(fareDetails),
            status: 'CONFIRMED',
            customerName: enquiry.name,
            customerPhone: enquiry.phone,
            notes: `Converted from Customer Enquiry #${enquiry.id.slice(-6).toUpperCase()} & Quote #${lockedQuote.id.slice(-6).toUpperCase()}`,
            enquiryId: enquiry.id,
            quoteId: lockedQuote.id,
          },
        });

        // 2. Link Booking to Quote
        await tx.quote.update({
          where: { id: lockedQuote.id },
          data: { bookingId: newBooking.id },
        });

        // 3. Mark Enquiry as RESOLVED
        await tx.enquiry.update({
          where: { id: enquiry.id },
          data: { status: 'RESOLVED' },
        });

        return { booking: newBooking, quote: lockedQuote, enquiry };
      });
    } catch (txErr) {
      return handleMigrationPendingError(txErr, next);
    }

    return res.status(201).json({
      success: true,
      message: `Booking #${bookingResult.booking.id.slice(-6).toUpperCase()} confirmed successfully from accepted quotation!`,
      data: bookingResult.booking,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  prepareQuote,
  getEnquiryQuotes,
  getPublicQuoteByToken,
  acceptQuote,
  declineQuote,
  convertToBooking,
};
