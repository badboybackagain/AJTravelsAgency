// ============================================================
// Wasms / Nirosha WhatsApp Service — Isolated Provider Architecture
// Endpoint: https://wasms.nirosha.org
// ============================================================

const prisma = require('../utils/prisma');

const WASMS_BASE_URL = 'https://wasms.nirosha.org';

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
  let cleaned = phone.replace(/[^\d+]/g, '');
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
  const refCode = (enquiry.id || '').slice(-6).toUpperCase();
  const dateStr = enquiry.travelDate || 'Flexible / To be confirmed';
  const vehicleStr = enquiry.vehicle || 'Any Available';
  const notesStr = enquiry.message ? `\n📝 *Notes:* ${enquiry.message}` : '';

  return `🔔 *NEW TRIP ENQUIRY — AJ TOURS*
━━━━━━━━━━━━━━━━━━━━━━━━
🔖 *Enquiry Ref:* #${refCode}
👤 *Customer:* ${enquiry.name}
📞 *Mobile:* +${sanitizePhoneNumber(enquiry.phone)}
📍 *Pickup:* ${enquiry.pickup}
🏁 *Drop:* ${enquiry.destination}
📅 *Date:* ${dateStr}
🚗 *Vehicle:* ${vehicleStr}${notesStr}
🕒 *Received:* ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
━━━━━━━━━━━━━━━━━━━━━━━━
_Action: Please review availability and call customer promptly._`;
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
  const totalStr = booking.fareTotal ? `₹${parseFloat(booking.fareTotal).toFixed(2)}` : 'Calculated';
  const statusStr = booking.status === 'CONFIRMED' ? '✅ Confirmed' : booking.status;

  return `🚗 *NEW BOOKING CONFIRMED — AJ TOURS*
━━━━━━━━━━━━━━━━━━━━━━━━
🔖 *Booking Ref:* #${refCode}
👤 *Passenger:* ${booking.customerName}
📞 *Mobile:* +${sanitizePhoneNumber(booking.customerPhone)}
${booking.customerEmail ? `📧 *Email:* ${booking.customerEmail}\n` : ''}🗺️ *Trip Type:* ${booking.tripType}
📍 *Pickup:* ${booking.pickupAddress || 'Standard Pickup Point'}
🏁 *Drop:* ${booking.dropAddress || 'Standard Drop Point'}
📅 *Date & Time:* ${dateStr} at ${pickupTime}
👥 *Passengers:* ${booking.passengers || 1}
🚘 *Vehicle:* ${vehicleName}
💰 *Total Fare:* ${totalStr}
💳 *Status:* ${statusStr}
${booking.notes ? `📝 *Notes:* ${booking.notes}\n` : ''}🕒 *Booked At:* ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
━━━━━━━━━━━━━━━━━━━━━━━━
_Chauffeur allocation required prior to departure._`;
}

/**
 * Format test connection message for WhatsApp
 */
function formatTestMessage() {
  return `✅ *AJ TOURS — WHATSAPP TEST MESSAGE*
━━━━━━━━━━━━━━━━━━━━━━━━
Wasms / Nirosha WhatsApp Gateway test triggered from Admin Dashboard.
🕒 *Timestamp:* ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
⚙️ *Gateway:* https://wasms.nirosha.org
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
async function verifyGatewayConnection(apiSecretOverride = null, accountIdOverride = null) {
  const settings = await getWhatsAppSettings();
  const secret = apiSecretOverride || settings.apiKey;
  const accountId = accountIdOverride !== undefined ? accountIdOverride : settings.senderId;

  if (!secret || !secret.trim()) {
    return {
      connected: false,
      status: 'UNCONFIGURED',
      message: 'API Secret Credential is not configured.',
    };
  }

  try {
    const targetUrl = `${WASMS_BASE_URL}/api/get/wa.accounts?secret=${encodeURIComponent(secret.trim())}`;
    const timeoutMs = 50000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(targetUrl, {
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

    // Wasms returns {"status": 200, ...} or 401 if invalid secret
    const isSuccess = response.ok && (parsed.status === 200 || parsed.status === '200' || parsed.status === 'success' || parsed.status === true);

    if (isSuccess) {
      let extraNote = '';
      if (accountId && Array.isArray(parsed.data)) {
        const found = parsed.data.some(
          (acc) => String(acc.id) === String(accountId).trim() || String(acc.unique) === String(accountId).trim()
        );
        extraNote = found
          ? ` Account ID verified.`
          : ` (Notice: Account ID ${accountId} not in returned list; please ensure account is linked)`;
      }

      // Update settings in database
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
async function dispatchWasmsMessage({ secret, accountId, recipientPhone, messageText }) {
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

    const response = await fetch(`${WASMS_BASE_URL}/api/send/whatsapp`, {
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
  overrideDestination = null,
}) {
  const settings = await getWhatsAppSettings();

  // 1. Check master enable toggle
  if (!settings.isEnabled && eventType !== 'ADMIN_TEST') {
    await prisma.notificationLog.create({
      data: {
        channel: 'WHATSAPP',
        eventType,
        referenceId,
        recipient: settings.destinationNumber || 'NOT_CONFIGURED',
        status: 'SKIPPED_DISABLED',
        errorMessage: 'WhatsApp integration is currently disabled.',
      },
    });
    return {
      success: false,
      skipped: true,
      reason: 'DISABLED',
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
  const targetDestination = overrideDestination || settings.destinationNumber;
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

  // 5. Validate Wasms credentials
  if (!settings.apiKey) {
    const errMsg = 'Wasms API Secret is required to dispatch notifications.';
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
    return { success: false, reason: 'MISSING_CREDENTIALS', message: errMsg };
  }

  // 6. Execute Provider Dispatch
  try {
    const result = await dispatchWasmsMessage({
      secret: settings.apiKey,
      accountId: settings.senderId,
      recipientPhone: cleanPhone,
      messageText,
    });

    // Record Success in NotificationLog
    await prisma.notificationLog.create({
      data: {
        channel: 'WHATSAPP',
        eventType,
        referenceId,
        recipient: cleanPhone,
        status: 'ACCEPTED',
        providerResponse: JSON.stringify(result.response),
      },
    });

    // Update settings status
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
      message: 'WhatsApp notification accepted by Wasms gateway.',
      providerResponse: result.response,
    };
  } catch (err) {
    const errMsg = err.message || 'Unknown Wasms provider error';

    // Record Failure in NotificationLog
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

    // Update settings status
    await prisma.integrationSetting.update({
      where: { id: settings.id },
      data: {
        lastStatus: 'ERROR',
        lastError: errMsg,
      },
    });

    return {
      success: false,
      status: 'FAILED',
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
async function sendTestMessage(destinationOverride = null) {
  const message = formatTestMessage();
  return await dispatchNotification({
    eventType: 'ADMIN_TEST',
    referenceId: null,
    messageText: message,
    overrideDestination: destinationOverride,
  });
}

module.exports = {
  WASMS_BASE_URL,
  maskSecret,
  sanitizePhoneNumber,
  isValidPhoneNumber,
  getWhatsAppSettings,
  invalidateWhatsAppSettingsCache,
  verifyGatewayConnection,
  sendEnquiryNotification,
  sendBookingNotification,
  sendTestMessage,
};
