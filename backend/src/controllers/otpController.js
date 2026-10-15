// ============================================================
// WhatsApp OTP Controller — Send & Verify Handlers
// ============================================================

const { AppError } = require('../middleware/errorHandler');
const { sendBookingOtp, verifyBookingOtp } = require('../services/otpService');

/**
 * POST /api/otp/send
 * Public: Request a real WhatsApp OTP to customer's phone
 */
const requestOtp = async (req, res, next) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return next(new AppError('Mobile number is required to receive WhatsApp OTP.', 400));
    }

    const result = await sendBookingOtp(phone);

    if (!result.success) {
      const statusCode = result.code === 'RATE_LIMIT_EXCEEDED' ? 429
        : result.code === 'COOLDOWN' ? 429
        : result.code === 'INVALID_PHONE' ? 400
        : result.code === 'SERVICE_DISABLED' ? 503
        : 502;

      return res.status(statusCode).json({
        success: false,
        code: result.code,
        message: result.message,
        cooldownSeconds: result.cooldownSeconds,
      });
    }

    return res.status(200).json({
      success: true,
      message: result.message,
      cooldownSeconds: result.cooldownSeconds,
      expiresAt: result.expiresAt,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/otp/verify
 * Public: Verify WhatsApp OTP code and receive verification token
 */
const verifyOtp = async (req, res, next) => {
  try {
    const { phone, otp } = req.body;
    if (!phone) {
      return next(new AppError('Mobile number is required.', 400));
    }
    if (!otp) {
      return next(new AppError('OTP code is required.', 400));
    }

    const result = await verifyBookingOtp(phone, otp);

    if (!result.success) {
      const statusCode = result.code === 'MAX_ATTEMPTS_EXCEEDED' ? 429
        : result.code === 'OTP_EXPIRED' ? 410
        : result.code === 'INVALID_OTP' ? 400
        : 400;

      return res.status(statusCode).json({
        success: false,
        code: result.code,
        message: result.message,
        remainingAttempts: result.remainingAttempts,
      });
    }

    return res.status(200).json({
      success: true,
      message: result.message,
      verificationToken: result.verificationToken,
      phoneNumber: result.phoneNumber,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  requestOtp,
  verifyOtp,
};
