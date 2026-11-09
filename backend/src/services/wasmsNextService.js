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
  formatE164Phone,
  generateIdempotencyKey,
  maskSecret,
  dispatchWasmsNextMessage,
  verifyWasmsNextConnection,
};
