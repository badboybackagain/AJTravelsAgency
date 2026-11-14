// ============================================================
// WASMS Next WhatsApp Service — Isolated Provider Adapter
// Endpoint: https://wasmsnext.nirosha.org/api/v1/messages/whatsapp
// Spec: POST with Bearer Token, Idempotency-Key UUID, JSON Body
// ============================================================

const crypto = require('crypto');
const prisma = require('../utils/prisma');

const DEFAULT_WASMS_NEXT_URL = 'https://wasmsnext.nirosha.org/api/v1/messages/whatsapp';

/**
 * Validates whether an endpoint URL is well-formed and enforces HTTPS in production.
 */
function validateEndpointUrl(url) {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'Endpoint URL is required.' };
  }
  const trimmed = url.trim();
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { valid: false, error: 'Endpoint URL must use HTTP or HTTPS protocol.' };
    }
    if (process.env.NODE_ENV === 'production' && parsed.protocol !== 'https:') {
      return { valid: false, error: 'Production endpoint URL must require HTTPS.' };
    }
    return { valid: true, url: trimmed };
  } catch {
    return { valid: false, error: 'Endpoint URL is not a valid URL.' };
  }
}

/**
 * Resolves the WASMS Next endpoint URL from settings, env or default.
 */
function resolveWasmsNextUrl(settings, override = null) {
  const candidate = override || (settings && settings.nextApiUrl) || process.env.WASMS_NEXT_URL || DEFAULT_WASMS_NEXT_URL;
  const validation = validateEndpointUrl(candidate);
  return validation.valid ? validation.url : DEFAULT_WASMS_NEXT_URL;
}

/**
 * Resolves the WASMS Next base origin (scheme + host) from settings, env or default.
 */
function resolveWasmsNextOrigin(settings, override = null) {
  const candidate = override || (settings && (settings.nextApiUrl || settings.apiUrl)) || process.env.WASMS_NEXT_URL || DEFAULT_WASMS_NEXT_URL;
  try {
    const parsed = new URL(candidate);
    return parsed.origin;
  } catch {
    return 'https://wasmsnext.nirosha.org';
  }
}

/**
 * Normalizes phone number to strict E.164 with leading plus sign (e.g. +919876543210).
 */
function formatE164Phone(phone) {
  if (!phone) return '';
  let cleaned = String(phone).replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }
  // Standard 10-digit Indian mobile fallback
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }
  return `+${cleaned}`;
}

/**
 * Generates a standard RFC 4122 v4 UUID for the Idempotency-Key header.
 */
function generateIdempotencyKey() {
  return crypto.randomUUID();
}

/**
 * Dispatches a text message through the WASMS Next API.
 * 
 * Headers sent:
 * - Authorization: Bearer <TOKEN>
 * - Accept: application/json
 * - Content-Type: application/json
 * - Idempotency-Key: <UNIQUE_UUID>
 * 
 * Payload parameters:
 * - type: 'text'
 * - to: E.164 phone
 * - body: message text (up to 4096 chars)
 * - wa_account_id: optional numeric account id
 * - reference: optional external reference string
 */
async function dispatchWasmsNextMessage({
  endpointUrl,
  bearerToken,
  accountId,
  recipientPhone,
  messageText,
  reference = null,
  idempotencyKey = null,
}) {
  // Test mode safety: suppress network calls during unit tests
  if (process.env.NODE_ENV === 'test' || process.env.DISABLE_WHATSAPP_DISPATCH === 'true') {
    return {
      accepted: true,
      statusCode: 200,
      idempotencyKey: idempotencyKey || generateIdempotencyKey(),
      response: { status: 200, message: 'WASMS Next message suppressed in test mode' },
    };
  }

  const targetUrl = endpointUrl ? endpointUrl.trim() : DEFAULT_WASMS_NEXT_URL;
  const validation = validateEndpointUrl(targetUrl);
  if (!validation.valid) {
    throw new Error(`Invalid WASMS Next endpoint URL: ${validation.error}`);
  }

  if (!bearerToken || !bearerToken.trim()) {
    throw new Error('WASMS Next Bearer token is not configured.');
  }

  const finalIdempotencyKey = idempotencyKey || generateIdempotencyKey();
  const e164Phone = formatE164Phone(recipientPhone);

  // Build JSON body per WASMS Next specification
  const bodyPayload = {
    type: 'text',
    to: e164Phone,
    body: String(messageText || '').slice(0, 4096),
  };

  // Optional account ID
  if (accountId && String(accountId).trim()) {
    const rawAcc = String(accountId).trim();
    bodyPayload.wa_account_id = /^\d+$/.test(rawAcc) ? parseInt(rawAcc, 10) : rawAcc;
  }

  // Optional external reference (1 to 191 visible characters)
  if (reference) {
    bodyPayload.reference = String(reference).slice(0, 190);
  }

  const timeoutMs = 15000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${bearerToken.trim()}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Idempotency-Key': finalIdempotencyKey,
      },
      body: JSON.stringify(bodyPayload),
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

    // WASMS Next returns 200, 201, 202 on success
    const isSuccess = response.ok && !parsed.error;

    if (!isSuccess) {
      const errMsg = parsed?.error?.message || parsed?.message || `WASMS Next error (status ${response.status})`;
      const err = new Error(errMsg);
      err.statusCode = response.status;
      err.providerResponse = parsed;
      throw err;
    }

    return {
      accepted: true,
      statusCode: response.status,
      idempotencyKey: finalIdempotencyKey,
      response: parsed,
    };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('WASMS Next provider request timed out after 15 seconds.');
    }
    // Never leak Bearer token or authorization header in errors
    throw err;
  }
}

/**
 * Verify WASMS Next Gateway Connection.
 * Probes the /api/v1/whatsapp/accounts endpoint using the Bearer Token.
 */
async function verifyWasmsNextConnection(tokenOverride = null, accountIdOverride = null, urlOverride = null) {
  const settings = await prisma.integrationSetting.findUnique({
    where: { service: 'WHATSAPP' },
  });

  const token = tokenOverride || (settings && settings.nextApiKey);
  const accountId = accountIdOverride !== undefined ? accountIdOverride : (settings && settings.nextAccountId);
  const endpointUrl = resolveWasmsNextUrl(settings, urlOverride);

  if (!token || !token.trim()) {
    return {
      connected: false,
      status: 'UNCONFIGURED',
      message: 'WASMS Next Bearer token is not configured.',
    };
  }

  try {
    // Derive base URL to probe accounts endpoint (e.g. https://wasmsnext.nirosha.org/api/v1/whatsapp/accounts)
    const urlObj = new URL(endpointUrl);
    const accountsUrl = `${urlObj.origin}/api/v1/whatsapp/accounts`;

    const timeoutMs = 15000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(accountsUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token.trim()}`,
        'Accept': 'application/json',
      },
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

    if (response.ok && !parsed.error) {
      let extraNote = '';
      if (accountId && Array.isArray(parsed.data)) {
        const found = parsed.data.some(
          (acc) => String(acc.id) === String(accountId).trim() || String(acc.unique) === String(accountId).trim()
        );
        extraNote = found
          ? ` Account ID verified.`
          : ` (Notice: Account ID ${accountId} not in returned accounts list)`;
      }

      if (settings) {
        await prisma.integrationSetting.update({
          where: { id: settings.id },
          data: {
            nextLastStatus: 'CONNECTED',
            nextLastVerifiedAt: new Date(),
            nextLastError: null,
          },
        });
      }

      return {
        connected: true,
        status: 'CONNECTED',
        message: `WASMS Next Gateway connected successfully.${extraNote}`,
        data: parsed.data,
      };
    } else {
      const errMsg = parsed?.error?.message || parsed?.message || `WASMS Next returned status ${response.status}`;
      if (settings) {
        await prisma.integrationSetting.update({
          where: { id: settings.id },
          data: {
            nextLastStatus: 'ERROR',
            nextLastError: errMsg,
          },
        });
      }

      return {
        connected: false,
        status: 'ERROR',
        message: errMsg,
      };
    }
  } catch (err) {
    const errMsg = err.name === 'AbortError'
      ? 'WASMS Next gateway connection timed out after 15s. Please verify the URL and network.'
      : err.message;

    if (settings) {
      await prisma.integrationSetting.update({
        where: { id: settings.id },
        data: {
          nextLastStatus: 'ERROR',
          nextLastError: errMsg,
        },
      });
    }

    return {
      connected: false,
      status: 'ERROR',
      message: errMsg,
    };
  }
}

/**
 * Starts an OTP verification with WASMS Next dedicated OTP API.
 * Endpoint: POST https://wasmsnext.nirosha.org/api/v1/otp/verifications
 *
 * CRITICAL REQUIREMENTS:
 * - channels array must contain exactly ["wa"].
 * - Never include "sms" or "waba".
 * - Never allow channel fallback.
 * - Zero OTP value generation/logging.
 */
async function startWasmsNextOtpVerification({
  endpointOrigin,
  bearerToken,
  recipientPhone,
  timeoutMs = 15000,
}) {
  if (!bearerToken || !bearerToken.trim()) {
    return {
      success: false,
      code: 'UNCONFIGURED',
      message: 'WASMS Next Bearer token is not configured.',
    };
  }

  // Safety guard: Never dispatch real network OTPs in test mode
  if (process.env.NODE_ENV === 'test' || process.env.DISABLE_REAL_OTP === 'true') {
    return {
      success: true,
      reference: 'mock-wasms-next-ref',
      status: 'pending',
      channel: ['wa'],
      expiresAt: new Date(Date.now() + 300 * 1000),
    };
  }

  const origin = endpointOrigin ? endpointOrigin.replace(/\/+$/, '') : 'https://wasmsnext.nirosha.org';
  const targetUrl = `${origin}/api/v1/otp/verifications`;
  const e164Phone = formatE164Phone(recipientPhone);

  // Strict WA-only request body: exactly ["wa"], never "sms", never "waba"
  const bodyPayload = {
    to: e164Phone,
    channels: ['wa'],
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${bearerToken.trim()}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bodyPayload),
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

    const isAccepted = (response.status === 202 || response.status === 200) && parsed && parsed.reference;

    if (isAccepted) {
      // Validate strict WA-only response channel
      if (parsed.channel && parsed.channel !== 'wa') {
        return {
          success: false,
          code: 'CHANNEL_MISMATCH',
          message: 'Non-WhatsApp channel was returned by gateway.',
        };
      }

      if (parsed.status === 'failed' || parsed.status === 'canceled') {
        return {
          success: false,
          code: 'DELIVERY_FAILED',
          message: 'WhatsApp OTP delivery was rejected by gateway.',
        };
      }

      return {
        success: true,
        reference: parsed.reference,
        status: parsed.status,
        channel: parsed.channel || 'wa',
        expiresAt: parsed.expires_at ? new Date(parsed.expires_at) : null,
      };
    }

    const errCode = parsed?.error?.code || 'PROVIDER_ERROR';
    const errMsg = parsed?.error?.message || parsed?.message || `WASMS Next OTP error (status ${response.status})`;

    // Strict channel failure handling: Zero fallback
    if (
      errCode === 'channel_unavailable' ||
      errCode === 'no_channel_available' ||
      errCode === 'channel_not_available' ||
      errMsg.toLowerCase().includes('channel')
    ) {
      return {
        success: false,
        code: 'CHANNEL_UNAVAILABLE',
        message: 'WhatsApp channel is currently unavailable. Please try again later.',
        rawError: errCode,
      };
    }

    return {
      success: false,
      code: errCode,
      message: errMsg,
    };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      return {
        success: false,
        code: 'PROVIDER_TIMEOUT',
        message: 'WhatsApp OTP request timed out after 15 seconds.',
      };
    }
    return {
      success: false,
      code: 'NETWORK_ERROR',
      message: err.message || 'Network error communicating with WhatsApp gateway.',
    };
  }
}

/**
 * Checks / verifies an OTP code with WASMS Next dedicated OTP API.
 * Endpoint: POST https://wasmsnext.nirosha.org/api/v1/otp/verifications/{reference}/check
 */
async function checkWasmsNextOtpVerification({
  endpointOrigin,
  bearerToken,
  reference,
  code,
  timeoutMs = 15000,
}) {
  if (!bearerToken || !bearerToken.trim()) {
    return {
      success: false,
      code: 'UNCONFIGURED',
      message: 'WASMS Next Bearer token is not configured.',
    };
  }

  if (!reference || !reference.trim()) {
    return {
      success: false,
      code: 'MISSING_REFERENCE',
      message: 'Verification reference is missing.',
    };
  }

  const cleanCode = String(code || '').trim();
  if (!cleanCode) {
    return {
      success: false,
      code: 'MISSING_OTP',
      message: 'Please enter the verification code received on WhatsApp.',
    };
  }

  // Safety guard: Mock responses in test mode
  if (process.env.NODE_ENV === 'test' || process.env.DISABLE_REAL_OTP === 'true') {
    if (cleanCode === 'INVALID_TEST_OTP') {
      return {
        success: false,
        code: 'INVALID_OTP',
        message: 'Invalid OTP code. 2 attempt(s) remaining.',
        remainingAttempts: 2,
      };
    }
    return {
      success: true,
      approved: true,
      reference,
      approvedAt: new Date().toISOString(),
    };
  }

  const origin = endpointOrigin ? endpointOrigin.replace(/\/+$/, '') : 'https://wasmsnext.nirosha.org';
  const targetUrl = `${origin}/api/v1/otp/verifications/${encodeURIComponent(reference.trim())}/check`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${bearerToken.trim()}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code: cleanCode }),
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

    if (response.status === 200 && parsed) {
      if (parsed.status === 'approved') {
        return {
          success: true,
          approved: true,
          reference: parsed.reference,
          approvedAt: parsed.approved_at,
        };
      }

      if (parsed.status === 'max_attempts_reached') {
        return {
          success: false,
          code: 'MAX_ATTEMPTS_EXCEEDED',
          message: 'Maximum verification attempts exceeded. Please request a new OTP.',
          remainingAttempts: 0,
        };
      }

      if (parsed.status === 'pending') {
        const remaining = typeof parsed.attempts_remaining === 'number' ? parsed.attempts_remaining : undefined;
        return {
          success: false,
          code: 'INVALID_OTP',
          message: remaining !== undefined
            ? `Invalid OTP code. ${remaining} attempt(s) remaining.`
            : 'Invalid OTP code. Please check your WhatsApp and try again.',
          remainingAttempts: remaining,
        };
      }
    }

    if (response.status === 410) {
      return {
        success: false,
        code: 'OTP_EXPIRED',
        message: 'OTP has expired. Please request a new OTP.',
      };
    }

    if (response.status === 409) {
      return {
        success: false,
        code: 'VERIFICATION_CONFLICT',
        message: parsed?.error?.message || 'Verification is no longer active. Please request a new OTP.',
      };
    }

    const errCode = parsed?.error?.code || 'INVALID_OTP';
    const errMsg = parsed?.error?.message || parsed?.message || `Verification check failed (status ${response.status})`;

    return {
      success: false,
      code: errCode,
      message: errMsg,
    };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      return {
        success: false,
        code: 'PROVIDER_TIMEOUT',
        message: 'WhatsApp verification check timed out after 15 seconds.',
      };
    }
    return {
      success: false,
      code: 'NETWORK_ERROR',
      message: err.message || 'Network error communicating with WhatsApp gateway.',
    };
  }
}

/**
 * Masks secrets for safe display in UI/API responses
 */
function maskSecret(secret) {
  if (!secret) return '';
  return '••••••••';
}

module.exports = {
  DEFAULT_WASMS_NEXT_URL,
  validateEndpointUrl,
  resolveWasmsNextUrl,
  resolveWasmsNextOrigin,
  formatE164Phone,
  generateIdempotencyKey,
  maskSecret,
  dispatchWasmsNextMessage,
  verifyWasmsNextConnection,
  startWasmsNextOtpVerification,
  checkWasmsNextOtpVerification,
};
