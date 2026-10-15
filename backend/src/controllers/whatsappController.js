// ============================================================
// WhatsApp Admin Controller — Wasms Gateway Settings & Verification
// ============================================================

const prisma = require('../utils/prisma');
const { AppError } = require('../middleware/errorHandler');
const {
  WASMS_BASE_URL,
  maskSecret,
  sanitizePhoneNumber,
  isValidPhoneNumber,
  getWhatsAppSettings,
  verifyGatewayConnection,
  sendTestMessage,
} = require('../services/whatsappService');

/**
 * GET /api/admin/whatsapp/settings
 * Admin: Get current Wasms configuration (with masked secret) and recent logs
 */
const getSettings = async (req, res, next) => {
  try {
    const settings = await getWhatsAppSettings();

    // Fetch recent notification logs
    const recentLogs = await prisma.notificationLog.findMany({
      take: 25,
      orderBy: { createdAt: 'desc' },
    });

    const safeData = {
      id: settings.id,
      service: settings.service,
      senderId: settings.senderId || '', // WhatsApp Account ID
      apiKey: maskSecret(settings.apiKey),
      hasApiKey: Boolean(settings.apiKey),
      destinationNumber: settings.destinationNumber || '',
      isEnabled: settings.isEnabled,
      notifyBookings: settings.notifyBookings ?? true,
      notifyEnquiries: settings.notifyEnquiries ?? true,
      lastStatus: settings.lastStatus,
      lastVerifiedAt: settings.lastVerifiedAt,
      lastError: settings.lastError,
      updatedAt: settings.updatedAt,
      recentLogs,
    };

    res.json({ success: true, data: safeData });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/admin/whatsapp/settings
 * Admin: Update Wasms configuration (Account ID, Secret, Toggles, Destination)
 */
const updateSettings = async (req, res, next) => {
  try {
    const {
      senderId,
      apiKey,
      destinationNumber,
      isEnabled,
      notifyBookings,
      notifyEnquiries,
    } = req.body;

    const current = await getWhatsAppSettings();

    // Validate destination phone number if provided
    let cleanDestination = current.destinationNumber;
    if (destinationNumber !== undefined) {
      const sanitized = sanitizePhoneNumber(destinationNumber);
      if (sanitized && !isValidPhoneNumber(sanitized)) {
        return next(new AppError('Please enter a valid destination phone number with country code (e.g. +91 98765 43210).', 400));
      }
      cleanDestination = sanitized ? `+${sanitized}` : '';
    }

    // Determine apiKey update (preserve existing if masked placeholder or blank sent)
    let finalApiKey = current.apiKey;
    if (apiKey !== undefined && apiKey !== null) {
      const trimmed = apiKey.trim();
      if (trimmed && !trimmed.startsWith('••••')) {
        finalApiKey = trimmed;
      }
    }

    const updated = await prisma.integrationSetting.update({
      where: { id: current.id },
      data: {
        provider: 'WASMS',
        apiUrl: WASMS_BASE_URL,
        senderId: senderId !== undefined ? senderId.trim() : current.senderId,
        apiKey: finalApiKey,
        destinationNumber: cleanDestination,
        ...(isEnabled !== undefined && { isEnabled: Boolean(isEnabled) }),
        ...(notifyBookings !== undefined && { notifyBookings: Boolean(notifyBookings) }),
        ...(notifyEnquiries !== undefined && { notifyEnquiries: Boolean(notifyEnquiries) }),
      },
    });

    // Record Audit Log (without logging secret)
    if (req.user?.id) {
      await prisma.auditLog.create({
        data: {
          adminId: req.user.id,
          action: 'UPDATE_WASMS_WHATSAPP_CONFIG',
          entity: 'IntegrationSetting',
          entityId: updated.id,
          newValue: JSON.stringify({
            isEnabled: updated.isEnabled,
            notifyBookings: updated.notifyBookings,
            notifyEnquiries: updated.notifyEnquiries,
            senderId: updated.senderId,
            destinationNumber: updated.destinationNumber,
            apiKeyUpdated: finalApiKey !== current.apiKey,
          }),
        },
      });
    }

    res.json({
      success: true,
      message: 'WhatsApp settings saved successfully.',
      data: {
        id: updated.id,
        service: updated.service,
        senderId: updated.senderId,
        apiKey: maskSecret(updated.apiKey),
        hasApiKey: Boolean(updated.apiKey),
        destinationNumber: updated.destinationNumber,
        isEnabled: updated.isEnabled,
        notifyBookings: updated.notifyBookings,
        notifyEnquiries: updated.notifyEnquiries,
        lastStatus: updated.lastStatus,
        lastVerifiedAt: updated.lastVerifiedAt,
        lastError: updated.lastError,
        updatedAt: updated.updatedAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/whatsapp/verify
 * Admin: Real-time verification of Wasms gateway credentials
 */
const handleVerifyConnection = async (req, res, next) => {
  try {
    const { apiKey, senderId } = req.body || {};
    const result = await verifyGatewayConnection(apiKey, senderId);

    if (!result.connected) {
      return res.status(400).json({
        success: false,
        status: result.status,
        message: result.message || 'Wasms gateway verification failed.',
      });
    }

    res.json({
      success: true,
      status: result.status,
      message: result.message,
      data: result.data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/whatsapp/test
 * Admin: Trigger a real test WhatsApp message
 */
const handleTestMessage = async (req, res, next) => {
  try {
    const { destinationNumber } = req.body || {};
    const result = await sendTestMessage(destinationNumber);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        status: result.status || 'FAILED',
        reason: result.reason,
        message: result.message || 'Failed to dispatch test message.',
      });
    }

    res.json({
      success: true,
      status: result.status,
      message: 'Real test message dispatched to Wasms gateway successfully.',
      data: result.providerResponse,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/admin/whatsapp/toggle
 * Admin: Quick toggle master enable/disable
 */
const toggleStatus = async (req, res, next) => {
  try {
    const { isEnabled } = req.body;
    if (isEnabled === undefined) {
      return next(new AppError('isEnabled boolean flag is required.', 400));
    }

    const current = await getWhatsAppSettings();
    const updated = await prisma.integrationSetting.update({
      where: { id: current.id },
      data: { isEnabled: Boolean(isEnabled) },
    });

    if (req.user?.id) {
      await prisma.auditLog.create({
        data: {
          adminId: req.user.id,
          action: Boolean(isEnabled) ? 'ENABLE_WHATSAPP' : 'DISABLE_WHATSAPP',
          entity: 'IntegrationSetting',
          entityId: updated.id,
        },
      });
    }

    res.json({
      success: true,
      message: `WhatsApp integration ${updated.isEnabled ? 'enabled' : 'disabled'}.`,
      data: { isEnabled: updated.isEnabled },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/whatsapp/logs
 * Admin: View notification delivery audit logs
 */
const getLogs = async (req, res, next) => {
  try {
    const logs = await prisma.notificationLog.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, count: logs.length, data: logs });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSettings,
  updateSettings,
  handleVerifyConnection,
  handleTestMessage,
  toggleStatus,
  getLogs,
};
