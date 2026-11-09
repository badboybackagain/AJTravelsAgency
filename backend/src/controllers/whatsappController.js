// ============================================================
// WhatsApp Admin Controller — Wasms Gateway Settings & Verification
// ============================================================

const prisma = require('../utils/prisma');
const { AppError } = require('../middleware/errorHandler');
const {
  WASMS_BASE_URL,
  PROVIDER_WASMS_LEGACY,
  PROVIDER_WASMS_NEXT,
  ALLOWED_PROVIDERS,
  maskSecret,
  sanitizePhoneNumber,
  isValidPhoneNumber,
  getWhatsAppSettings,
  invalidateWhatsAppSettingsCache,
  verifyGatewayConnection,
  sendTestMessage,
} = require('../services/whatsappService');
const wasmsNextService = require('../services/wasmsNextService');

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
      provider: settings.provider || PROVIDER_WASMS_LEGACY, // 'WASMS' | 'WASMS_NEXT'
      destinationNumber: settings.destinationNumber || '',
      isEnabled: settings.isEnabled,
      notifyBookings: settings.notifyBookings ?? true,
      notifyEnquiries: settings.notifyEnquiries ?? true,

      // Provider 1: Current / Legacy Wasms
      apiUrl: settings.apiUrl || WASMS_BASE_URL,
      senderId: settings.senderId || '', // WhatsApp Account ID
      apiKey: maskSecret(settings.apiKey),
      hasApiKey: Boolean(settings.apiKey),
      lastStatus: settings.lastStatus,
      lastVerifiedAt: settings.lastVerifiedAt,
      lastError: settings.lastError,

      // Provider 2: WASMS Next
      nextApiUrl: settings.nextApiUrl || wasmsNextService.DEFAULT_WASMS_NEXT_URL,
      nextAccountId: settings.nextAccountId || '',
      nextApiKey: maskSecret(settings.nextApiKey),
      hasNextApiKey: Boolean(settings.nextApiKey),
      nextLastStatus: settings.nextLastStatus || 'UNCONFIGURED',
      nextLastVerifiedAt: settings.nextLastVerifiedAt,
      nextLastError: settings.nextLastError,

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
      provider,
      apiUrl,
      senderId,
      apiKey,
      nextApiUrl,
      nextAccountId,
      nextApiKey,
      destinationNumber,
      isEnabled,
      notifyBookings,
      notifyEnquiries,
    } = req.body;

    const current = await getWhatsAppSettings();

    // 1. Validate Provider Selection (Strict Backend Validation)
    let finalProvider = current.provider || PROVIDER_WASMS_LEGACY;
    if (provider !== undefined) {
      const trimmedProvider = String(provider).trim().toUpperCase();
      if (!ALLOWED_PROVIDERS.includes(trimmedProvider)) {
        return next(new AppError(`Invalid WhatsApp provider selected (${provider}). Must be WASMS or WASMS_NEXT.`, 400));
      }
      finalProvider = trimmedProvider;
    }

    // 2. Validate and clean Legacy apiUrl
    let finalApiUrl = current.apiUrl || WASMS_BASE_URL;
    if (apiUrl !== undefined) {
      const trimmedUrl = apiUrl.trim();
      finalApiUrl = trimmedUrl ? trimmedUrl.replace(/\/+$/, '') : WASMS_BASE_URL;
    }

    // 3. Validate and clean WASMS Next nextApiUrl
    let finalNextApiUrl = current.nextApiUrl || wasmsNextService.DEFAULT_WASMS_NEXT_URL;
    if (nextApiUrl !== undefined && nextApiUrl.trim()) {
      const validation = wasmsNextService.validateEndpointUrl(nextApiUrl);
      if (!validation.valid) {
        return next(new AppError(`Invalid WASMS Next URL: ${validation.error}`, 400));
      }
      finalNextApiUrl = validation.url;
    }

    // 4. Validate destination phone number if provided
    let cleanDestination = current.destinationNumber;
    if (destinationNumber !== undefined) {
      const sanitized = sanitizePhoneNumber(destinationNumber);
      if (sanitized && !isValidPhoneNumber(sanitized)) {
        return next(new AppError('Please enter a valid destination phone number with country code (e.g. +91 98765 43210).', 400));
      }
      cleanDestination = sanitized ? `+${sanitized}` : '';
    }

    // 5. Preserve Legacy apiKey (do not overwrite if masked placeholder or blank sent)
    let finalApiKey = current.apiKey;
    if (apiKey !== undefined && apiKey !== null) {
      const trimmed = apiKey.trim();
      if (trimmed && !trimmed.startsWith('••••')) {
        finalApiKey = trimmed;
      }
    }

    // 6. Preserve WASMS Next nextApiKey (do not overwrite if masked placeholder or blank sent)
    let finalNextApiKey = current.nextApiKey;
    if (nextApiKey !== undefined && nextApiKey !== null) {
      const trimmedNext = nextApiKey.trim();
      if (trimmedNext && !trimmedNext.startsWith('••••')) {
        finalNextApiKey = trimmedNext;
      }
    }

    // 7. Update in database safely
    const updated = await prisma.integrationSetting.update({
      where: { id: current.id },
      data: {
        provider: finalProvider,
        apiUrl: finalApiUrl,
        senderId: senderId !== undefined ? senderId.trim() : current.senderId,
        apiKey: finalApiKey,
        nextApiUrl: finalNextApiUrl,
        nextAccountId: nextAccountId !== undefined ? nextAccountId.trim() : current.nextAccountId,
        nextApiKey: finalNextApiKey,
        destinationNumber: cleanDestination,
        ...(isEnabled !== undefined && { isEnabled: Boolean(isEnabled) }),
        ...(notifyBookings !== undefined && { notifyBookings: Boolean(notifyBookings) }),
        ...(notifyEnquiries !== undefined && { notifyEnquiries: Boolean(notifyEnquiries) }),
      },
    });

    // 8. Record Audit Log (Never log secret keys)
    if (req.user?.id) {
      await prisma.auditLog.create({
        data: {
          adminId: req.user.id,
          action: 'UPDATE_WHATSAPP_CONFIG',
          entity: 'IntegrationSetting',
          entityId: updated.id,
          newValue: JSON.stringify({
            provider: updated.provider,
            isEnabled: updated.isEnabled,
            notifyBookings: updated.notifyBookings,
            notifyEnquiries: updated.notifyEnquiries,
            senderId: updated.senderId,
            nextAccountId: updated.nextAccountId,
            destinationNumber: updated.destinationNumber,
            apiUrlUpdated: finalApiUrl !== current.apiUrl,
            nextApiUrlUpdated: finalNextApiUrl !== current.nextApiUrl,
            apiKeyUpdated: finalApiKey !== current.apiKey,
            nextApiKeyUpdated: finalNextApiKey !== current.nextApiKey,
          }),
        },
      });
    }

    invalidateWhatsAppSettingsCache();
    res.json({
      success: true,
      message: `WhatsApp settings saved successfully with active provider: ${updated.provider === PROVIDER_WASMS_NEXT ? 'WASMS Next' : 'Current WhatsApp'}.`,
      data: {
        id: updated.id,
        service: updated.service,
        provider: updated.provider,
        isEnabled: updated.isEnabled,
        notifyBookings: updated.notifyBookings,
        notifyEnquiries: updated.notifyEnquiries,
        destinationNumber: updated.destinationNumber,

        // Provider 1: Current Wasms
        apiUrl: updated.apiUrl,
        senderId: updated.senderId,
        apiKey: maskSecret(updated.apiKey),
        hasApiKey: Boolean(updated.apiKey),
        lastStatus: updated.lastStatus,
        lastVerifiedAt: updated.lastVerifiedAt,
        lastError: updated.lastError,

        // Provider 2: WASMS Next
        nextApiUrl: updated.nextApiUrl,
        nextAccountId: updated.nextAccountId,
        nextApiKey: maskSecret(updated.nextApiKey),
        hasNextApiKey: Boolean(updated.nextApiKey),
        nextLastStatus: updated.nextLastStatus,
        nextLastVerifiedAt: updated.nextLastVerifiedAt,
        nextLastError: updated.nextLastError,

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
    const body = req.body || {};
    const settings = await getWhatsAppSettings();
    const targetProvider = body.provider || settings.provider || PROVIDER_WASMS_LEGACY;

    let result;
    if (targetProvider === PROVIDER_WASMS_NEXT) {
      const token = body.nextApiKey || body.apiKey;
      const accountId = body.nextAccountId !== undefined ? body.nextAccountId : body.senderId;
      const url = body.nextApiUrl || body.apiUrl;
      result = await verifyGatewayConnection({
        provider: PROVIDER_WASMS_NEXT,
        apiKey: token,
        senderId: accountId,
        apiUrl: url,
      });
    } else {
      result = await verifyGatewayConnection({
        provider: PROVIDER_WASMS_LEGACY,
        apiKey: body.apiKey,
        senderId: body.senderId,
        apiUrl: body.apiUrl,
      });
    }

    if (!result.connected) {
      return res.status(400).json({
        success: false,
        provider: targetProvider,
        status: result.status,
        message: result.message || 'Gateway verification failed.',
      });
    }

    res.json({
      success: true,
      provider: targetProvider,
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
    const { destinationNumber, provider } = req.body || {};
    const result = await sendTestMessage(destinationNumber, provider);

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

    invalidateWhatsAppSettingsCache();
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
