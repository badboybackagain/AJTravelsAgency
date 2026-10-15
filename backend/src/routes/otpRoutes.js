const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { requestOtp, verifyOtp } = require('../controllers/otpController');

const otpSendLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    code: 'IP_RATE_LIMIT',
    message: 'Too many OTP requests from this connection. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    code: 'IP_RATE_LIMIT',
    message: 'Too many verification attempts from this connection. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/send', otpSendLimiter, requestOtp);
router.post('/verify', otpVerifyLimiter, verifyOtp);

module.exports = router;
