const rateLimit = require("express-rate-limit");
const config = require("../config");

/**
 * General API rate limiter
 */
const generalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs, // 15 minutes
  max: config.rateLimit.maxRequests, // 100 requests per window
  message: {
    success: false,
    error: {
      code: "TOO_MANY_REQUESTS",
      message: "Too many requests, please try again later",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Auth routes rate limiter (stricter)
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: {
    success: false,
    error: {
      code: "TOO_MANY_REQUESTS",
      message:
        "Too many authentication attempts, please try again after 15 minutes",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Email sending rate limiter
 */
const emailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 email operations per window
  message: {
    success: false,
    error: {
      code: "TOO_MANY_REQUESTS",
      message: "Too many email requests, please try again later",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * File upload rate limiter
 */
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: {
    success: false,
    error: {
      code: "TOO_MANY_REQUESTS",
      message: "Too many file uploads, please try again later",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Public verification rate limiter
 */
const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: {
    success: false,
    error: {
      code: "TOO_MANY_REQUESTS",
      message: "Too many verification requests, please try again later",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  generalLimiter,
  authLimiter,
  emailLimiter,
  uploadLimiter,
  verifyLimiter,
};
