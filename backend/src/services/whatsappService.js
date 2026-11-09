// ============================================================
// Wasms / Nirosha WhatsApp Service — Isolated Provider Architecture
// Endpoint: https://wasms.nirosha.org
// ============================================================

const prisma = require('../utils/prisma');

const WASMS_BASE_URL = 'https://wasms.nirosha.org';
const wasmsNextService = require('./wasmsNextService');

const PROVIDER_WASMS_LEGACY = 'WASMS';
const PROVIDER_WASMS_NEXT = 'WASMS_NEXT';
const ALLOWED_PROVIDERS = [PROVIDER_WASMS_LEGACY, PROVIDER_WASMS_NEXT];

/**
 * Resolve gateway base URL from database setting, environment variable, or default fallback
 */
function resolveBaseUrl(settings, override = null) {
  const url = override || (settings && settings.apiUrl) || process.env.WASMS_BASE_URL || WASMS_BASE_URL;
  return (url && url.trim()) ? url.trim().replace(/\/+$/, '') : WASMS_BASE_URL;
}

/**
 * Mask sensitive credentials for safe UI display (e.g. ••••••••abcd)
 */
function maskSecret(secret) {
  if (!secret) return '';
  if (secret.length <= 4) return '••••••••';
  return '••••••••' + secret.slice(-4);
}

/**
 * Clean phone number to digits with country code (e.g. 919876543210)
 */
function sanitizePhoneNumber(phone) {
  if (!phone) return '';
  const str = typeof phone === 'string' ? phone : String(phone);
  let cleaned = str.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }
  // If 10 digits (standard Indian mobile without 91), prepend 91
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }
  return cleaned;
}

/**
 * Validate phone number format (10-15 digits)
 */
function isValidPhoneNumber(phone) {
  const sanitized = sanitizePhoneNumber(phone);
  return /^\d{10,15}$/.test(sanitized);
}

/**
 * Format enquiry notification for WhatsApp
 */
function formatEnquiryMessage(enquiry) {
  const refCode = enquiry.enquiryNumber || enquiry.reference || (enquiry.id ? `ENQ-${enquiry.id.slice(-4).toUpperCase()}` : 'ENQ');
  const dateStr = enquiry.travelDate || 'Flexible / To be confirmed';
  const vehicleStr = enquiry.vehicle || 'Any Available';
  const notesStr = enquiry.message ? `\n• *Notes:* ${enquiry.message}` : '';

  return `🔔 *New Trip Enquiry — AJ Travels*
━━━━━━━━━━━━━━━━━━━━━━━━
• *Enquiry ID:* ${refCode}
• *Customer:* ${enquiry.name} (+${sanitizePhoneNumber(enquiry.phone)})
• *Route:* ${enquiry.pickup || 'Pune'} ➔ ${enquiry.destination || 'Mumbai'}
• *Date:* ${dateStr}
• *Vehicle:* ${vehicleStr}${notesStr}
━━━━━━━━━━━━━━━━━━━━━━━━`;
}

/**
 * Format booking notification for WhatsApp
 */
function formatBookingMessage(booking, vehicleName = 'Reserved Vehicle') {
  const refCode = (booking.id || '').slice(-6).toUpperCase();
  const dateStr = booking.pickupDate
    ? new Date(booking.pickupDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'N/A';
  const pickupTime = booking.pickupTime || 'Flexible';
  const totalStr = booking.fareTotal ? `₹${parseFloat(booking.fareTotal).toLocaleString('en-IN')}` : 'Calculated';

  return `🚕 *Booking Confirmed — AJ Travels*
━━━━━━━━━━━━━━━━━━━━━━━━
• *Booking ID:* #${refCode}
• *Customer:* ${booking.customerName} (+${sanitizePhoneNumber(booking.customerPhone)})
• *Route:* ${booking.pickupAddress || 'Pune'} ➔ ${booking.dropAddress || 'Mumbai'}
• *Date & Time:* ${dateStr} at ${pickupTime}
• *Vehicle:* ${vehicleName} (${booking.passengers || 1} Pax)
• *Total Fare:* ${totalStr} (Pay to Driver)
${booking.notes ? `• *Notes:* ${booking.notes}\n` : ''}━━━━━━━━━━━━━━━━━━━━━━━━`;
}

/**
 * Format test connection message for WhatsApp
 */
function formatTestMessage({ provider = PROVIDER_WASMS_LEGACY, endpoint = WASMS_BASE_URL } = {}) {
  const isNext = provider === PROVIDER_WASMS_NEXT;
  const label = isNext ? 'WASMS Next Integration (v1 API)' : 'Current WhatsApp Integration (Wasms / Nirosha)';
  return `✅ *AJ TOURS — WHATSAPP TEST MESSAGE*
━━━━━━━━━━━━━━━━━━━━━━━━
${label} test triggered from Admin Dashboard.
🕒 *Timestamp:* ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
⚙️ *Active Provider:* ${isNext ? 'WASMS Next' : 'Current WhatsApp (Wasms)'}
🌐 *Endpoint:* ${endpoint}
━━━━━━━━━━━━━━━━━━━━━━━━
_Your WhatsApp notifications channel is operational and verified._`;
}

/**
 * Retrieve current WhatsApp settings (or initialize default)
 */
// In-memory cache for WhatsApp settings
let cachedWhatsAppSettings = null;
let cachedWhatsAppSettingsTime = 0;
const WHATSAPP_SETTINGS_CACHE_TTL = 60000; // 60 seconds

function invalidateWhatsAppSettingsCache() {
  cachedWhatsAppSettings = null;
  cachedWhatsAppSettingsTime = 0;
}

async function getWhatsAppSettings() {
  const now = Date.now();
  if (cachedWhatsAppSettings && (now - cachedWhatsAppSettingsTime < WHATSAPP_SETTINGS_CACHE_TTL)) {
    return cachedWhatsAppSettings;
  }
  let settings = await prisma.integrationSetting.findUnique({
    where: { service: 'WHATSAPP' },
  });

  if (!settings) {
    settings = await prisma.integrationSetting.create({
      data: {
        service: 'WHATSAPP',
        provider: 'WASMS',
        apiUrl: WASMS_BASE_URL,
        apiKey: '',
        senderId: '',
        destinationNumber: '',
        isEnabled: false,
        notifyBookings: true,
        notifyEnquiries: true,
        lastStatus: 'UNCONFIGURED',
      },
    });
  }

  cachedWhatsAppSettings = settings;
  cachedWhatsAppSettingsTime = Date.now();
  return settings;
}

/**
 * Verify Wasms Gateway Connection using Wasms accounts check
 * Endpoint: GET https://wasms.nirosha.org/api/get/wa.accounts?secret=...
 */
async function verifyGatewayConnection(apiSecretOverride = null, accountIdOverride = null, apiUrlOverride = null, providerOverride = null) {
  // Support options object invocation or positional parameters
  let targetProvider = providerOverride;
  let secret = apiSecretOverride;
  let accountId = accountIdOverride;
  let targetUrl = apiUrlOverride;

  if (typeof apiSecretOverride === 'object' && apiSecretOverride !== null) {
    targetProvider = apiSecretOverride.provider || providerOverride;
    secret = apiSecretOverride.apiKey ?? apiSecretOverride.apiSecretOverride;
    accountId = apiSecretOverride.senderId ?? apiSecretOverride.accountIdOverride;
    targetUrl = apiSecretOverride.apiUrl ?? apiSecretOverride.apiUrlOverride;
  }

  const settings = await getWhatsAppSettings();
  const effectiveProvider = targetProvider || settings.provider || PROVIDER_WASMS_LEGACY;

  if (effectiveProvider === PROVIDER_WASMS_NEXT) {
    const tokenToTest = secret !== undefined ? secret : settings.nextApiKey;
    const accountToTest = accountId !== undefined ? accountId : settings.nextAccountId;
    const urlToTest = targetUrl || settings.nextApiUrl;
    return await wasmsNextService.verifyWasmsNextConnection(tokenToTest, accountToTest, urlToTest);
  }

  // Legacy Wasms Provider Verification
  const legacySecret = secret !== undefined ? secret : settings.apiKey;
  const legacyAccount = accountId !== undefined ? accountId : settings.senderId;
  const baseUrl = resolveBaseUrl(settings, targetUrl);

  if (!legacySecret || !legacySecret.trim()) {
    return {
      connected: false,
      status: 'UNCONFIGURED',
      message: 'API Secret Credential is not configured.',
    };
  }

  try {
    const endpoint = `${baseUrl}/api/get/wa.accounts?secret=${encodeURIComponent(legacySecret.trim())}`;
    const timeoutMs = 50000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const responseText = await response.text();
    let parsed = null;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      parsed = { raw: responseText.slice(0, 300) };
    }

    const isSuccess = response.ok && (parsed.status === 200 || parsed.status === '200' || parsed.status === 'success' || parsed.status === true);

    if (isSuccess) {
      let extraNote = '';
      if (legacyAccount && Array.isArray(parsed.data)) {
        const found = parsed.data.some(
          (acc) => String(acc.id) === String(legacyAccount).trim() || String(acc.unique) === String(legacyAccount).trim()
        );
        extraNote = found
          ? ` Account ID verified.`
          : ` (Notice: Account ID ${legacyAccount} not in returned list; please ensure account is linked)`;
      }

      await prisma.integrationSetting.update({
        where: { id: settings.id },
        data: {
          lastStatus: 'CONNECTED',
          lastVerifiedAt: new Date(),
          lastError: null,
        },
      });

      return {
        connected: true,
        status: 'CONNECTED',
        message: `Wasms Gateway connected successfully.${extraNote}`,
        data: parsed.data,
      };
    } else {
      const errMsg = parsed.message || `Provider returned status ${parsed.status || response.status}`;
      await prisma.integrationSetting.update({
        where: { id: settings.id },
        data: {
          lastStatus: 'ERROR',
          lastError: errMsg,
        },
      });

      return {
        connected: false,
        status: 'ERROR',
        message: errMsg,
      };
    }
  } catch (err) {
    const errMsg = err.name === 'AbortError' ? 'Gateway connection timed out after 50s. Please try again.' : err.message;
    await prisma.integrationSetting.update({
      where: { id: settings.id },
      data: {
        lastStatus: 'ERROR',
        lastError: errMsg,
      },
    });

    return {
      connected: false,
      status: 'ERROR',
      message: errMsg,
    };
  }
}

/**
 * Dispatch message via Wasms API
 * Endpoint: POST https://wasms.nirosha.org/api/send/whatsapp
 * Multipart or form-data: secret, account, recipient, type, message
 */
async function dispatchWasmsMessage({ baseUrl, secret, accountId, recipientPhone, messageText }) {
  const targetBaseUrl = (baseUrl && baseUrl.trim()) ? baseUrl.trim().replace(/\/+$/, '') : WASMS_BASE_URL;
  // Safety guard: Never dispatch real network calls in test mode or when dispatch is disabled
  if (process.env.NODE_ENV === 'test' || process.env.DISABLE_WHATSAPP_DISPATCH === 'true') {
    return {
      accepted: true,
      statusCode: 200,
      response: { status: 200, message: 'WhatsApp message suppressed in test mode' },
    };
  }

  const timeoutMs = 12000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const formData = new FormData();
    formData.append('secret', secret);
    if (accountId) {
      formData.append('account', accountId);
    }
    formData.append('recipient', recipientPhone);
    formData.append('type', 'text');
    formData.append('message', messageText);

    const response = await fetch(`${targetBaseUrl}/api/send/whatsapp`, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const responseText = await response.text();
    let parsed = null;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      parsed = { raw: responseText.slice(0, 500) };
    }

    const isAccepted = response.ok && (parsed.status === 200 || parsed.status === '200' || parsed.status === 'success' || parsed.status === true);

    if (!isAccepted) {
      const errMsg = parsed?.message || `Provider error (status ${parsed?.status || response.status})`;
      throw new Error(errMsg);
    }

    return {
      accepted: true,
      statusCode: response.status,
      response: parsed,
    };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Wasms provider request timed out after 12 seconds.');
    }
    throw err;
  }
}

/**
 * Primary dispatch function with independent toggles, idempotency & audit logging
 */
async function dispatchNotification({
  eventType, // 'ENQUIRY' | 'BOOKING_CREATED' | 'ADMIN_TEST'
  referenceId = null,
  messageText,
  message,
  overrideDestination = null,
  recipient = null,
  providerOverride = null,
}) {
  const content = messageText || message || '';
  const settings = await getWhatsAppSettings();

  // 1. Check master enable toggle
  if (!settings.isEnabled && eventType !== 'ADMIN_TEST') {
    await prisma.notificationLog.create({
      data: {
        channel: 'WHATSAPP',
        eventType,
        referenceId,
        recipient: recipient || overrideDestination || settings.destinationNumber || 'NOT_CONFIGURED',
        status: 'SKIPPED_DISABLED',
        errorMessage: 'WhatsApp integration is currently disabled.',
      },
    });
    return {
      success: false,
      skipped: true,
      reason: 'DISABLED',
      status: 'SKIPPED_DISABLED',
      message: 'WhatsApp notification skipped: Integration is disabled.',
    };
  }

  // 2. Check independent event-type toggles
  if (eventType === 'BOOKING_CREATED' && !settings.notifyBookings) {
    await prisma.notificationLog.create({
      data: {
        channel: 'WHATSAPP',
        eventType,
        referenceId,
        recipient: settings.destinationNumber || 'NOT_CONFIGURED',
        status: 'SKIPPED_DISABLED',
        errorMessage: 'Booking notifications are toggled off in settings.',
      },
    });
    return {
      success: false,
      skipped: true,
      reason: 'BOOKING_NOTIFICATIONS_DISABLED',
      message: 'WhatsApp notification skipped: Booking notifications are disabled.',
    };
  }

  if (eventType === 'ENQUIRY' && !settings.notifyEnquiries) {
    await prisma.notificationLog.create({
      data: {
        channel: 'WHATSAPP',
        eventType,
        referenceId,
        recipient: settings.destinationNumber || 'NOT_CONFIGURED',
        status: 'SKIPPED_DISABLED',
        errorMessage: 'Enquiry notifications are toggled off in settings.',
      },
    });
    return {
      success: false,
      skipped: true,
      reason: 'ENQUIRY_NOTIFICATIONS_DISABLED',
      message: 'WhatsApp notification skipped: Enquiry notifications are disabled.',
    };
  }

  // 3. Prevent duplicate notifications (idempotency check)
  if (referenceId && eventType !== 'ADMIN_TEST') {
    const existingLog = await prisma.notificationLog.findFirst({
      where: {
        referenceId,
        eventType,
        status: { in: ['ACCEPTED', 'DELIVERED', 'SENT'] },
      },
    });

    if (existingLog) {
      return {
        success: true,
        skipped: true,
        reason: 'DUPLICATE',
        message: 'WhatsApp notification already sent previously for this record.',
      };
    }
  }

  // 4. Resolve destination phone
  const targetDestination = overrideDestination || recipient || settings.destinationNumber;
  if (!targetDestination) {
    const errMsg = 'Destination WhatsApp number is not configured.';
    await prisma.notificationLog.create({
      data: {
        channel: 'WHATSAPP',
        eventType,
        referenceId,
        recipient: 'NONE',
        status: 'FAILED',
        errorMessage: errMsg,
      },
    });
    return { success: false, reason: 'NO_DESTINATION', message: errMsg };
  }

  const cleanPhone = sanitizePhoneNumber(targetDestination);
  if (!isValidPhoneNumber(cleanPhone)) {
    const errMsg = `Destination phone number is invalid: ${targetDestination}`;
    await prisma.notificationLog.create({
      data: {
        channel: 'WHATSAPP',
        eventType,
        referenceId,
        recipient: cleanPhone,
        status: 'FAILED',
        errorMessage: errMsg,
      },
    });
    return { success: false, reason: 'INVALID_PHONE', message: errMsg };
  }

  // 5. Determine active provider — EXACTLY ONE provider is used
  const activeProvider = providerOverride || ((settings.provider === PROVIDER_WASMS_NEXT) ? PROVIDER_WASMS_NEXT : PROVIDER_WASMS_LEGACY);

  // ------------------------------------------------------------
  // PROVIDER 2: WASMS NEXT (POST with Bearer Token, JSON body)
  // ------------------------------------------------------------
  if (activeProvider === PROVIDER_WASMS_NEXT) {
    if (!settings.nextApiKey || !settings.nextApiKey.trim()) {
      const errMsg = 'WASMS Next Bearer token is required to dispatch notifications.';
      await prisma.notificationLog.create({
        data: {
          channel: 'WHATSAPP',
          provider: PROVIDER_WASMS_NEXT,
          eventType,
          referenceId,
          recipient: cleanPhone,
          status: 'FAILED',
          errorMessage: errMsg,
        },
      });
      return { success: false, reason: 'MISSING_CREDENTIALS', provider: PROVIDER_WASMS_NEXT, message: errMsg };
    }

    try {
      const endpointUrl = wasmsNextService.resolveWasmsNextUrl(settings);
      const result = await wasmsNextService.dispatchWasmsNextMessage({
        endpointUrl,
        bearerToken: settings.nextApiKey,
        accountId: settings.nextAccountId,
        recipientPhone: cleanPhone,
        messageText: content,
        reference: referenceId,
      });

      await prisma.notificationLog.create({
        data: {
          channel: 'WHATSAPP',
          provider: PROVIDER_WASMS_NEXT,
          eventType,
          referenceId,
          recipient: cleanPhone,
          status: 'ACCEPTED',
          providerResponse: JSON.stringify(result.response),
        },
      });

      await prisma.integrationSetting.update({
        where: { id: settings.id },
        data: {
          nextLastStatus: 'CONNECTED',
          nextLastVerifiedAt: new Date(),
          nextLastError: null,
        },
      });

      return {
        success: true,
        status: 'ACCEPTED',
        provider: PROVIDER_WASMS_NEXT,
        idempotencyKey: result.idempotencyKey,
        message: 'WhatsApp notification accepted by WASMS Next gateway.',
        providerResponse: result.response,
      };
    } catch (err) {
      const errMsg = err.message || 'Unknown WASMS Next provider error';

      await prisma.notificationLog.create({
        data: {
          channel: 'WHATSAPP',
          provider: PROVIDER_WASMS_NEXT,
          eventType,
          referenceId,
          recipient: cleanPhone,
          status: 'FAILED',
          errorMessage: errMsg,
        },
      });

      await prisma.integrationSetting.update({
        where: { id: settings.id },
        data: {
          nextLastStatus: 'ERROR',
          nextLastError: errMsg,
        },
      });

      // Strict requirement: NEVER fallback to the inactive provider on failure
      return {
        success: false,
        status: 'FAILED',
        provider: PROVIDER_WASMS_NEXT,
        message: errMsg,
      };
    }
  }

  // ------------------------------------------------------------
  // PROVIDER 1: CURRENT WHATSAPP (Wasms Standard Form-Data)
  // ------------------------------------------------------------
  if (!settings.apiKey || !settings.apiKey.trim()) {
    const errMsg = 'Wasms API Secret is required to dispatch notifications.';
    await prisma.notificationLog.create({
      data: {
        channel: 'WHATSAPP',
        provider: PROVIDER_WASMS_LEGACY,
        eventType,
        referenceId,
        recipient: cleanPhone,
        status: 'FAILED',
        errorMessage: errMsg,
      },
    });
    return { success: false, reason: 'MISSING_CREDENTIALS', provider: PROVIDER_WASMS_LEGACY, message: errMsg };
  }

  try {
    const baseUrl = resolveBaseUrl(settings);
    const result = await dispatchWasmsMessage({
      baseUrl,
      secret: settings.apiKey,
      accountId: settings.senderId,
      recipientPhone: cleanPhone,
      messageText: content,
    });

    await prisma.notificationLog.create({
      data: {
        channel: 'WHATSAPP',
        provider: PROVIDER_WASMS_LEGACY,
        eventType,
        referenceId,
        recipient: cleanPhone,
        status: 'ACCEPTED',
        providerResponse: JSON.stringify(result.response),
      },
    });

    await prisma.integrationSetting.update({
      where: { id: settings.id },
      data: {
        lastStatus: 'CONNECTED',
        lastVerifiedAt: new Date(),
        lastError: null,
      },
    });

    return {
      success: true,
      status: 'ACCEPTED',
      provider: PROVIDER_WASMS_LEGACY,
      message: 'WhatsApp notification accepted by Wasms gateway.',
      providerResponse: result.response,
    };
  } catch (err) {
    const errMsg = err.message || 'Unknown Wasms provider error';

    await prisma.notificationLog.create({
      data: {
        channel: 'WHATSAPP',
        provider: PROVIDER_WASMS_LEGACY,
        eventType,
        referenceId,
        recipient: cleanPhone,
        status: 'FAILED',
        errorMessage: errMsg,
      },
    });

    await prisma.integrationSetting.update({
      where: { id: settings.id },
      data: {
        lastStatus: 'ERROR',
        lastError: errMsg,
      },
    });

    // Strict requirement: NEVER fallback to the inactive provider on failure
    return {
      success: false,
      status: 'FAILED',
      provider: PROVIDER_WASMS_LEGACY,
      message: errMsg,
    };
  }
}

/**
 * Public trigger: Send enquiry notification
 */
async function sendEnquiryNotification(enquiry) {
  try {
    const message = formatEnquiryMessage(enquiry);
    return await dispatchNotification({
      eventType: 'ENQUIRY',
      referenceId: enquiry.id,
      messageText: message,
    });
  } catch (err) {
    console.error('sendEnquiryNotification error:', err);
    return { success: false, message: err.message };
  }
}

/**
 * Public trigger: Send booking notification
 */
async function sendBookingNotification(booking, vehicleName) {
  try {
    const message = formatBookingMessage(booking, vehicleName);
    return await dispatchNotification({
      eventType: 'BOOKING_CREATED',
      referenceId: booking.id,
      messageText: message,
    });
  } catch (err) {
    console.error('sendBookingNotification error:', err);
    return { success: false, message: err.message };
  }
}

/**
 * Admin trigger: Send test message
 */
async function sendTestMessage(destinationOverride = null, providerOverride = null) {
  let dest = destinationOverride;
  let prov = providerOverride;
  if (destinationOverride && typeof destinationOverride === 'object') {
    dest = destinationOverride.destinationNumber || destinationOverride.destination || destinationOverride.recipient;
    prov = destinationOverride.provider || prov;
  }

  const settings = await getWhatsAppSettings();
  const activeProvider = prov || settings.provider || PROVIDER_WASMS_LEGACY;
  const endpoint = activeProvider === PROVIDER_WASMS_NEXT
    ? wasmsNextService.resolveWasmsNextUrl(settings)
    : resolveBaseUrl(settings);

  const message = formatTestMessage({ provider: activeProvider, endpoint });
  return await dispatchNotification({
    eventType: 'ADMIN_TEST',
    referenceId: null,
    messageText: message,
    overrideDestination: dest,
    providerOverride: prov,
  });
}

module.exports = {
  WASMS_BASE_URL,
  PROVIDER_WASMS_LEGACY,
  PROVIDER_WASMS_NEXT,
  ALLOWED_PROVIDERS,
  resolveBaseUrl,
  maskSecret,
  sanitizePhoneNumber,
  isValidPhoneNumber,
  getWhatsAppSettings,
  invalidateWhatsAppSettingsCache,
  verifyGatewayConnection,
  dispatchNotification,
  sendEnquiryNotification,
  sendBookingNotification,
  sendTestMessage,
};
