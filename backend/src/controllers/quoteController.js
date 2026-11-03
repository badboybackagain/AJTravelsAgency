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
// Helper: Resolve configured extra distance and extra hour rates from DB
async function resolveAdditionalRates(pickupStr, dropStr, vehicleCategory, tripType, termsStr = null) {
  // Check if explicit rates were embedded in terms
  if (termsStr) {
    const metaMatch = termsStr.match(/<!--EXTRA_CHARGES:(.+?)-->/);
    if (metaMatch) {
      try {
        const parsed = JSON.parse(metaMatch[1]);
        if (parsed && (parsed.extraKmRate || parsed.extraHourRate)) {
          const standardKm = tripType === 'ROUND_TRIP' ? 300 : 150;
          return {
            isConfigured: true,
            extraKmRate: parsed.extraKmRate ? parseFloat(parsed.extraKmRate) : null,
            extraHourRate: parsed.extraHourRate ? parseFloat(parsed.extraHourRate) : null,
            includedKm: parsed.includedKm ? parseFloat(parsed.includedKm) : standardKm,
            freeWaitingMinutes: parsed.freeWaitingMinutes ? parseInt(parsed.freeWaitingMinutes, 10) : 30,
            notice: `Conditional charges. Apply only when included distance (${parsed.includedKm || standardKm} km) or waiting duration is exceeded.`,
          };
        }
      } catch (e) {}
    }
  }

  // Fallback: Dynamically query configured fare from DB
  if (!prisma.fare || typeof prisma.fare.findFirst !== 'function') {
    return {
      isConfigured: false,
      extraKmRate: null,
      extraHourRate: null,
      includedKm: null,
      freeWaitingMinutes: null,
      notice: 'Conditional charges not configured for this corridor.',
    };
  }

  try {
    const pickupLower = (pickupStr || '').toLowerCase();
    const dropLower = (dropStr || '').toLowerCase();

    const isPuneToMumbai = pickupLower.includes('pune') && dropLower.includes('mumbai');
    const isMumbaiToPune = pickupLower.includes('mumbai') && dropLower.includes('pune');

    let routeNamePattern = null;
    if (isPuneToMumbai) routeNamePattern = 'Pune → Mumbai';
    else if (isMumbaiToPune) routeNamePattern = 'Mumbai → Pune';

    const fare = await prisma.fare.findFirst({
      where: {
        isActive: true,
        tripType: tripType || 'ONE_WAY',
        ...(routeNamePattern && {
          route: {
            routeName: { contains: routeNamePattern, mode: 'insensitive' }
          }
        }),
        vehicle: {
          category: { equals: vehicleCategory, mode: 'insensitive' }
        }
      },
      include: {
        fareWaiting: true,
        vehicle: true,
      }
    });

    if (fare) {
      const standardKm = tripType === 'ROUND_TRIP' ? 300 : 150;
      const extraKm = fare.perKmFare > 0 ? fare.perKmFare : null;
      const extraHour = fare.fareWaiting && fare.fareWaiting.enabled && fare.fareWaiting.perHourCharge > 0
        ? fare.fareWaiting.perHourCharge
        : null;

      return {
        isConfigured: Boolean(extraKm || extraHour),
        extraKmRate: extraKm,
        extraHourRate: extraHour,
        includedKm: standardKm,
        freeWaitingMinutes: fare.fareWaiting?.freeMinutes || 30,
        notice: `Conditional charges. Apply only when included distance (${standardKm} km) or waiting duration is exceeded.`,
      };
    }
  } catch (err) {
    console.warn('[Quote] Error resolving configured additional rates:', err.message);
  }

  return {
    isConfigured: false,
    extraKmRate: null,
    extraHourRate: null,
    includedKm: null,
    freeWaitingMinutes: null,
    notice: 'Conditional charges not configured for this custom corridor. Please contact dispatch for specific limits.',
  };
}

function cleanTermsText(termsStr) {
  if (!termsStr) return 'Driver allowance included. Tolls paid as actuals or included as per quote.';
  return termsStr.replace(/<!--EXTRA_CHARGES:.+?-->/g, '').trim();
}

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

    // Auto-harmonize Inclusions and Exclusions with parking charges
    let finalInclusions = inclusions && inclusions.trim() ? inclusions.trim() : 'Vehicle rental, fuel, experienced chauffeur, and highway tolls.';
    let finalExclusions = exclusions && exclusions.trim() ? exclusions.trim() : 'Airport/station parking charges, extra hour/km over limit.';

    if (numParking > 0) {
      // If customer is paying for parking in the quote, remove parking from exclusions
      finalExclusions = finalExclusions
        .replace(/airport\/station\s*parking\s*(charges)?/gi, '')
        .replace(/parking\s*charges/gi, '')
        .replace(/,\s*,/g, ',')
        .replace(/^\s*,\s*|\s*,\s*$/g, '')
        .trim();
      if (!finalExclusions) {
        finalExclusions = 'Extra kilometre/hour charges over package limit, night travel allowance (if applicable).';
      }

      // Ensure inclusions explicitly mentions airport/station parking
      if (!/parking/i.test(finalInclusions)) {
        finalInclusions = finalInclusions.replace(/\.\s*$/, '') + ', and airport/station parking.';
      }
    }

    // Additional Conditional Charges (Extra distance & Extra hour rates)
    let extraKmNum = req.body.extraKmRate !== undefined && req.body.extraKmRate !== null && req.body.extraKmRate !== ''
      ? parseFloat(req.body.extraKmRate)
      : null;
    let extraHourNum = req.body.extraHourRate !== undefined && req.body.extraHourRate !== null && req.body.extraHourRate !== ''
      ? parseFloat(req.body.extraHourRate)
      : null;
    let includedKmNum = req.body.includedKm !== undefined && req.body.includedKm !== null && req.body.includedKm !== ''
      ? parseFloat(req.body.includedKm)
      : (resolvedTripType === 'ROUND_TRIP' ? 300 : 150);

    // If not supplied explicitly, resolve from DB
    if (extraKmNum === null && extraHourNum === null) {
      const autoRates = await resolveAdditionalRates(enquiry.pickup, enquiry.destination, vehicleCategory.trim(), resolvedTripType);
      if (autoRates.isConfigured) {
        extraKmNum = autoRates.extraKmRate;
        extraHourNum = autoRates.extraHourRate;
        includedKmNum = autoRates.includedKm;
      }
    }

    const rawTerms = terms && terms.trim() ? terms.trim() : 'Driver allowance included. Tolls paid as actuals or included as per quote.';
    const extraChargesMeta = {
      extraKmRate: extraKmNum,
      extraHourRate: extraHourNum,
      includedKm: includedKmNum,
    };
    const finalTerms = `${cleanTermsText(rawTerms)}\n<!--EXTRA_CHARGES:${JSON.stringify(extraChargesMeta)}-->`;

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
      inclusions: finalInclusions,
      exclusions: finalExclusions,
      terms: finalTerms,
      status: 'QUOTED',
      quoteToken,
      validUntil,
    };

    let quote;
    try {
      // Execute atomically in a single batch roundtrip (prevents interactive transaction timeout over WAN)
      const [, newQuote] = await prisma.$transaction([
        // 1. Mark existing pending quotes for this enquiry as SUPERSEDED
        prisma.quote.updateMany({
          where: {
            enquiryId: enquiry.id,
            status: 'QUOTED',
          },
          data: {
            status: 'SUPERSEDED',
          },
        }),

        // 2. Create the new quote with status QUOTED
        prisma.quote.create({
          data: quoteData,
        }),

        // 3. Update enquiry status to CONTACTED
        prisma.enquiry.update({
          where: { id: enquiry.id },
          data: { status: 'CONTACTED' },
        }),
      ]);
      quote = newQuote;
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

      const enrichedQuotes = await Promise.all(
        quotes.map(async (q) => {
          const addCharges = await resolveAdditionalRates(null, null, q.vehicleCategory, q.tripType, q.terms);
          return {
            ...q,
            terms: cleanTermsText(q.terms),
            additionalCharges: addCharges,
          };
        })
      );

      return res.json({
        success: true,
        count: enrichedQuotes.length,
        data: enrichedQuotes,
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

    // Harmonize inclusions/exclusions dynamically for customer view
    let displayInclusions = quote.inclusions || 'Vehicle rental, fuel, experienced chauffeur, and highway tolls.';
    let displayExclusions = quote.exclusions;

    if (quote.parkingCharges > 0) {
      if (!/parking/i.test(displayInclusions)) {
        displayInclusions = displayInclusions.replace(/\.\s*$/, '') + ', and airport/station parking.';
      }
      if (displayExclusions) {
        displayExclusions = displayExclusions
          .replace(/airport\/station\s*parking\s*(charges)?/gi, '')
          .replace(/parking\s*charges/gi, '')
          .replace(/,\s*,/g, ',')
          .replace(/^\s*,\s*|\s*,\s*$/g, '')
          .trim();
        if (!displayExclusions) {
          displayExclusions = 'Extra kilometre/hour charges over package limit, night travel allowance (if applicable).';
        }
      }
    }

    // Public sanitized representation (Never expose internal IDs, passwords, or administrative notes)
    const sanitizedPayload = {
      quoteRef: quote.id.slice(-6).toUpperCase(),
      enquiryRef: quote.enquiry.id.slice(-6).toUpperCase(),
      bookingRef: quote.bookingId ? quote.bookingId.slice(-6).toUpperCase() : null,
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
      inclusions: displayInclusions,
      exclusions: displayExclusions,
      terms: cleanTermsText(quote.terms),
      additionalCharges: await resolveAdditionalRates(
        quote.enquiry.pickup,
        quote.enquiry.destination,
        quote.vehicleCategory,
        quote.tripType,
        quote.terms
      ),
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
        data: {
          status: 'ACCEPTED',
          acceptedAt: quote.acceptedAt,
          bookingId: quote.bookingId || null,
          bookingRef: quote.bookingId ? quote.bookingId.slice(-6).toUpperCase() : null,
        },
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
        bookingId: quote.bookingId || null,
        bookingRef: quote.bookingId ? quote.bookingId.slice(-6).toUpperCase() : null,
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

        // Parse travel date & time safely from enquiry.travelDate or enquiry.message
        let validPickupDate = new Date();
        let validPickupTime = '08:00 AM';

        if (enquiry.travelDate) {
          const rawStr = enquiry.travelDate.trim();

          // Check for time pattern e.g. "06:30 AM", "6:30 PM", "18:30", "06:30"
          const timeMatch = rawStr.match(/(\d{1,2}:\d{2}(?:\s*(?:AM|PM|am|pm))?)/);
          if (timeMatch) {
            let t = timeMatch[1].trim();
            if (!/AM|PM/i.test(t)) {
              const [h, m] = t.split(':');
              let hour = parseInt(h, 10);
              const ampm = hour >= 12 ? 'PM' : 'AM';
              hour = hour % 12 || 12;
              t = `${hour.toString().padStart(2, '0')}:${m} ${ampm}`;
            }
            validPickupTime = t.toUpperCase();
          }

          const datePart = rawStr.split(/\s+at\s+|\s+/)[0];
          const parsed = new Date(datePart);
          if (!isNaN(parsed.getTime())) {
            validPickupDate = parsed;
          } else {
            const fullParsed = new Date(rawStr);
            if (!isNaN(fullParsed.getTime())) {
              validPickupDate = fullParsed;
            }
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
            pickupTime: validPickupTime,
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
      }, {
        maxWait: 15000,
        timeout: 30000,
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
