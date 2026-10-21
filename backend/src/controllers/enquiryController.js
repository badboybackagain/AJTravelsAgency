// ============================================================
// Customer Enquiry Controller — Submission, Persistence & Alerts
// ============================================================

const prisma = require('../utils/prisma');
const { AppError } = require('../middleware/errorHandler');
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
    } = req.body;

    const resolvedDestination = (destination || drop || '').trim();
    const resolvedTravelDate = (travelDate || date || '').trim() || null;

    if (!name || !name.trim()) {
      return next(new AppError('Full name is required.', 400));
    }
    if (!phone || !phone.trim()) {
      return next(new AppError('Mobile number is required.', 400));
    }
    if (!pickup || !pickup.trim()) {
      return next(new AppError('Pickup location is required.', 400));
    }
    if (!resolvedDestination) {
      return next(new AppError('Drop location is required.', 400));
    }

    const cleanPhone = sanitizePhoneNumber(phone);
    if (!isValidPhoneNumber(cleanPhone)) {
      return next(new AppError('Please enter a valid 10-digit mobile number.', 400));
    }

    // Accidental double-tap / network retry suppression:
    // Only suppress if ALL key journey fields (phone, pickup, destination, travelDate, vehicle, message)
    // are 100% identical and were created within the last 10 seconds.
    const recentDuplicate = await prisma.enquiry.findFirst({
      where: {
        phone: cleanPhone,
        pickup: pickup.trim(),
        destination: resolvedDestination,
        travelDate: resolvedTravelDate,
        vehicle: vehicle ? vehicle.trim() : null,
        message: message ? message.trim() : null,
        createdAt: {
          gte: new Date(Date.now() - 10 * 1000),
        },
      },
    });

    if (recentDuplicate) {
      return res.status(200).json({
        success: true,
        message: 'Thank you! Your trip enquiry has been received. Our team will contact you shortly.',
        data: {
          id: recentDuplicate.id,
          name: recentDuplicate.name,
          pickup: recentDuplicate.pickup,
          destination: recentDuplicate.destination,
          travelDate: recentDuplicate.travelDate,
        },
      });
    }

    // 1. Persist the enquiry in Supabase database
    const enquiry = await prisma.enquiry.create({
      data: {
        name: name.trim(),
        phone: cleanPhone,
        pickup: pickup.trim(),
        destination: resolvedDestination,
        travelDate: resolvedTravelDate,
        vehicle: vehicle ? vehicle.trim() : null,
        message: message ? message.trim() : null,
        status: 'NEW',
      },
    });

    // 2. Trigger WhatsApp notification asynchronously (isolated; never fails enquiry)
    sendEnquiryNotification(enquiry).catch((notifErr) => {
      console.error('Enquiry WhatsApp dispatch notice:', notifErr.message);
    });

    return res.status(201).json({
      success: true,
      message: 'Thank you! Your trip enquiry has been received. Our team will contact you shortly.',
      data: {
        id: enquiry.id,
        name: enquiry.name,
        pickup: enquiry.pickup,
        destination: enquiry.destination,
        travelDate: enquiry.travelDate,
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
    const where = {};

    if (status && status !== 'ALL' && ['NEW', 'CONTACTED', 'RESOLVED'].includes(status)) {
      where.status = status;
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
        { pickup: { contains: q, mode: 'insensitive' } },
        { destination: { contains: q, mode: 'insensitive' } },
        { vehicle: { contains: q, mode: 'insensitive' } },
        { id: { contains: q, mode: 'insensitive' } },
      ];
    }

    const enquiries = await prisma.enquiry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json({ success: true, count: enquiries.length, data: enquiries });
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
