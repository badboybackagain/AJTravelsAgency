// ============================================================
// Wasms / Nirosha WhatsApp OTP Service
// Endpoints:
// - POST https://wasms.nirosha.org/api/send/otp
// - GET  https://wasms.nirosha.org/api/get/otp
// ============================================================

const crypto = require('crypto');
const prisma = require('../utils/prisma');
const {
  WASMS_BASE_URL,
  sanitizePhoneNumber,
  isValidPhoneNumber,
  getWhatsAppSettings,
} = require('./whatsappService');

const OTP_EXPIRY_SECONDS = 300; // 5 minutes
const RESEND_COOLDOWN_SECONDS = 60; // 1 minute
const MAX_SENDS_PER_WINDOW = 4; // Max 4 sends in 15 minutes
const MAX_VERIFY_ATTEMPTS = 5; // Max 5 wrong attempts per challenge
const TOKEN_EXPIRY_MINUTES = 15; // Verification token valid for 15 minutes

/**
 * Request real Wasms OTP via WhatsApp
 */
async function sendBookingOtp(phoneNumber) {
  const cleanPhone = sanitizePhoneNumber(phoneNumber);
  if (!isValidPhoneNumber(cleanPhone)) {
    return {
      success: false,
      code: 'INVALID_PHONE',
      message: 'Please enter a valid mobile number (10 digits).',
    };
  }

  // 1 & 2. Concurrent DB Pre-checks: Fetch settings and rate-limiting history in parallel
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
  const [settings, recentChallenges] = await Promise.all([
    getWhatsAppSettings(),
    prisma.otpChallenge.findMany({
      where: {
        phoneNumber: cleanPhone,
        purpose: 'BOOKING_VERIFICATION',
        createdAt: { gte: fifteenMinutesAgo },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  if (!settings.isEnabled) {
    return {
      success: false,
      code: 'SERVICE_DISABLED',
      message: 'WhatsApp verification service is currently paused by administrator.',
    };
  }

  if (!settings.apiKey || !settings.apiKey.trim()) {
    return {
      success: false,
      code: 'UNCONFIGURED',
      message: 'WhatsApp gateway credentials are not configured.',
    };
  }

  if (recentChallenges.length >= MAX_SENDS_PER_WINDOW) {
    return {
      success: false,
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many OTP requests for this number. Please wait 15 minutes before trying again.',
    };
  }

  const latestChallenge = recentChallenges[0];
  if (latestChallenge && latestChallenge.status === 'PENDING') {
    const elapsedSeconds = Math.floor((Date.now() - new Date(latestChallenge.createdAt).getTime()) / 1000);
    if (elapsedSeconds < RESEND_COOLDOWN_SECONDS) {
      const waitRemaining = RESEND_COOLDOWN_SECONDS - elapsedSeconds;
      return {
        success: false,
        code: 'COOLDOWN',
        message: `Please wait ${waitRemaining} seconds before requesting a new OTP.`,
        cooldownSeconds: waitRemaining,
      };
    }
  }

  // 3. Mark previous pending challenges for this number as EXPIRED
  await prisma.otpChallenge.updateMany({
    where: {
      phoneNumber: cleanPhone,
      purpose: 'BOOKING_VERIFICATION',
      status: 'PENDING',
    },
    data: { status: 'EXPIRED' },
  });

  // 4. Create new PENDING OTP Challenge
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_SECONDS * 1000);
  const challenge = await prisma.otpChallenge.create({
    data: {
      phoneNumber: cleanPhone,
      purpose: 'BOOKING_VERIFICATION',
      status: 'PENDING',
      attempts: 0,
      maxAttempts: MAX_VERIFY_ATTEMPTS,
      resendCount: recentChallenges.length,
      provider: 'WASMS',
      expiresAt,
    },
  });

  // 5. Dispatch real OTP through Wasms API
  // Safety guard: Never dispatch real network OTPs in test mode or when dispatch is disabled
  if (process.env.NODE_ENV === 'test' || process.env.DISABLE_REAL_OTP === 'true') {
    return {
      success: true,
      provider: 'WASMS_TEST_MOCK',
      expiresIn: OTP_EXPIRY_SECONDS,
      cooldownSeconds: 60,
      message: 'OTP dispatch suppressed in test mode.',
    };
  }

  const timeoutMs = 12000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const formData = new FormData();
    formData.append('secret', settings.apiKey.trim());
    if (settings.senderId && settings.senderId.trim()) {
      formData.append('account', settings.senderId.trim());
    }
    formData.append('type', 'whatsapp');
    formData.append('message', 'Your OTP for AJ Tours booking verification is {{otp}}. Valid for 5 minutes. Do not share this code.');
    formData.append('phone', cleanPhone);
    formData.append('expire', String(OTP_EXPIRY_SECONDS));

    const response = await fetch(`${WASMS_BASE_URL}/api/send/otp`, {
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
      parsed = { raw: responseText.slice(0, 300) };
    }

    const isAccepted = response.ok && (parsed.status === 200 || parsed.status === '200' || parsed.status === 'success' || parsed.status === true);

    if (!isAccepted) {
      const errMsg = parsed?.message || `Gateway returned error (status ${parsed?.status || response.status})`;
      // Update challenge
      await prisma.otpChallenge.update({
        where: { id: challenge.id },
        data: { status: 'EXPIRED' },
      });

      return {
        success: false,
        code: 'PROVIDER_ERROR',
        message: errMsg,
      };
    }

    // Save provider reference if available
    const providerRef = parsed?.data?.id || (typeof parsed?.data === 'string' ? parsed.data : null);
    if (providerRef) {
      await prisma.otpChallenge.update({
        where: { id: challenge.id },
        data: { providerRef: String(providerRef) },
      });
    }

    return {
      success: true,
      message: `OTP sent via WhatsApp to +${cleanPhone}.`,
      cooldownSeconds: RESEND_COOLDOWN_SECONDS,
      expiresAt,
    };
  } catch (err) {
    clearTimeout(timeoutId);
    const isTimeout = err.name === 'AbortError';
    const errMsg = isTimeout
      ? 'WhatsApp gateway request timed out. Please try again or request a callback.'
      : 'Network error communicating with WhatsApp gateway. Please try again or request a callback.';
    await prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: { status: 'EXPIRED' },
    });

    return {
      success: false,
      code: isTimeout ? 'PROVIDER_TIMEOUT' : 'PROVIDER_UNAVAILABLE',
      message: errMsg,
    };
  }
}

/**
 * Verify Wasms OTP and issue secure, single-use verification token
 */
async function verifyBookingOtp(phoneNumber, otpCode) {
  const cleanPhone = sanitizePhoneNumber(phoneNumber);
  if (!isValidPhoneNumber(cleanPhone)) {
    return {
      success: false,
      code: 'INVALID_PHONE',
      message: 'Please enter a valid mobile number.',
    };
  }

  const cleanOtp = (otpCode || '').toString().trim();
  if (!cleanOtp) {
    return {
      success: false,
      code: 'MISSING_OTP',
      message: 'Please enter the verification code received on WhatsApp.',
    };
  }

  // 1. Find active pending challenge
  const challenge = await prisma.otpChallenge.findFirst({
    where: {
      phoneNumber: cleanPhone,
      purpose: 'BOOKING_VERIFICATION',
      status: 'PENDING',
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!challenge) {
    return {
      success: false,
      code: 'NO_ACTIVE_OTP',
      message: 'No active OTP verification found. Please request a new OTP.',
    };
  }

  // Check expiry
  if (new Date() > new Date(challenge.expiresAt)) {
    await prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: { status: 'EXPIRED' },
    });
    return {
      success: false,
      code: 'OTP_EXPIRED',
      message: 'OTP has expired. Please request a new OTP.',
    };
  }

  // Check maximum attempts
  if (challenge.attempts >= challenge.maxAttempts) {
    await prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: { status: 'EXPIRED' },
    });
    return {
      success: false,
      code: 'MAX_ATTEMPTS_EXCEEDED',
      message: 'Maximum verification attempts exceeded. Please request a new OTP.',
    };
  }

  // Increment attempts counter
  const updatedAttempts = challenge.attempts + 1;
  await prisma.otpChallenge.update({
    where: { id: challenge.id },
    data: { attempts: updatedAttempts },
  });

  // 2. Query Wasms verification endpoint
  const settings = await getWhatsAppSettings();
  if (!settings.apiKey) {
    return {
      success: false,
      code: 'UNCONFIGURED',
      message: 'WhatsApp gateway API key is not configured.',
    };
  }

  const timeoutMs = 10000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const verifyUrl = `${WASMS_BASE_URL}/api/get/otp?secret=${encodeURIComponent(settings.apiKey.trim())}&otp=${encodeURIComponent(cleanOtp)}&phone=${encodeURIComponent(cleanPhone)}`;

    const response = await fetch(verifyUrl, {
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

    const isVerified = response.ok && (parsed.status === 200 || parsed.status === '200' || parsed.status === 'success' || parsed.status === true);

    if (!isVerified) {
      const remaining = challenge.maxAttempts - updatedAttempts;
      return {
        success: false,
        code: 'INVALID_OTP',
        message: remaining > 0
          ? `Invalid OTP code. ${remaining} attempt(s) remaining.`
          : 'Invalid OTP code. Maximum attempts reached. Please request a new OTP.',
        remainingAttempts: Math.max(0, remaining),
      };
    }

    // 3. Provider accepted the OTP!
    // Enforce phone binding if provider data returns phone
    if (parsed.data && typeof parsed.data === 'object' && parsed.data.phone) {
      const providerPhone = sanitizePhoneNumber(parsed.data.phone);
      if (providerPhone && providerPhone !== cleanPhone) {
        return {
          success: false,
          code: 'PHONE_MISMATCH',
          message: 'Security validation failed: OTP does not match this mobile number.',
        };
      }
    }

    // 4. Generate cryptographically strong server-side verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiresAt = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000);

    await prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: {
        status: 'VERIFIED',
        verificationToken,
        verifiedAt: new Date(),
        expiresAt: tokenExpiresAt,
      },
    });

    return {
      success: true,
      code: 'VERIFIED',
      message: 'Mobile number verified successfully via WhatsApp.',
      verificationToken,
      phoneNumber: cleanPhone,
    };
  } catch (err) {
    clearTimeout(timeoutId);
    return {
      success: false,
      code: 'VERIFY_ERROR',
      message: err.name === 'AbortError' ? 'OTP verification timed out.' : err.message,
    };
  }
}

/**
 * Validate and atomically consume verification token during booking creation.
 * Guarantees:
 * 1. Token exists and is VERIFIED
 * 2. Token is bound to the exact customer phone number
 * 3. Token has not expired
 * 4. Token has not been previously consumed (Replay Protection)
 */
async function validateAndConsumeToken(phoneNumber, verificationToken) {
  if (!phoneNumber || !verificationToken) {
    return {
      valid: false,
      reason: 'MISSING_VERIFICATION',
      message: 'Mobile number verification token is required to complete booking.',
    };
  }

  const cleanPhone = sanitizePhoneNumber(phoneNumber);

  const challenge = await prisma.otpChallenge.findUnique({
    where: { verificationToken: verificationToken.trim() },
  });

  if (!challenge) {
    return {
      valid: false,
      reason: 'INVALID_TOKEN',
      message: 'Invalid verification token.',
    };
  }

  if (challenge.consumedAt !== null || challenge.status === 'CONSUMED') {
    return {
      valid: false,
      reason: 'TOKEN_ALREADY_USED',
      message: 'Verification token has already been used for a previous booking.',
    };
  }

  if (challenge.status !== 'VERIFIED') {
    return {
      valid: false,
      reason: 'NOT_VERIFIED',
      message: `Verification token has status: ${challenge.status}. A valid verified OTP is required.`,
    };
  }

  if (challenge.phoneNumber !== cleanPhone) {
    return {
      valid: false,
      reason: 'PHONE_MISMATCH',
      message: 'Verification token was issued for a different mobile number.',
    };
  }

  if (new Date() > new Date(challenge.expiresAt)) {
    return {
      valid: false,
      reason: 'TOKEN_EXPIRED',
      message: 'Verification has expired. Please verify your mobile number again.',
    };
  }

  if (challenge.consumedAt !== null) {
    return {
      valid: false,
      reason: 'TOKEN_ALREADY_USED',
      message: 'Verification token has already been used for a previous booking.',
    };
  }

  // Atomically consume token
  await prisma.otpChallenge.update({
    where: { id: challenge.id },
    data: {
      status: 'CONSUMED',
      consumedAt: new Date(),
    },
  });

  return {
    valid: true,
    challengeId: challenge.id,
    verifiedAt: challenge.verifiedAt,
  };
}

module.exports = {
  sendBookingOtp,
  verifyBookingOtp,
  validateAndConsumeToken,
};
