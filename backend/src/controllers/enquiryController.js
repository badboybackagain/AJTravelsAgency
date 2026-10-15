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
      travelDate,
      vehicle,
      message,
    } = req.body;

    if (!name || !name.trim()) {
      return next(new AppError('Full name is required.', 400));
    }
    if (!phone || !phone.trim()) {
      return next(new AppError('Mobile number is required.', 400));
    }
    if (!pickup || !pickup.trim()) {
      return next(new AppError('Pickup location is required.', 400));
    }
    if (!destination || !destination.trim()) {
      return next(new AppError('Drop location is required.', 400));
    }

    const cleanPhone = sanitizePhoneNumber(phone);
    if (!isValidPhoneNumber(cleanPhone)) {
      return next(new AppError('Please enter a valid 10-digit mobile number.', 400));
    }

    // 1. Persist the enquiry in Supabase database
    const enquiry = await prisma.enquiry.create({
      data: {
        name: name.trim(),
        phone: cleanPhone,
        pickup: pickup.trim(),
        destination: destination.trim(),
        travelDate: travelDate ? travelDate.trim() : null,
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
 * GET /api/admin/enquiries — Admin View All Enquiries
 */
const adminGetEnquiries = async (req, res, next) => {
  try {
    const enquiries = await prisma.enquiry.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
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
