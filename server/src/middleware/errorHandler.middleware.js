const AppError = require("../utils/AppError");
const logger = require("../utils/logger");
const config = require("../config");

/**
 * Global error handler middleware.
 * Must be registered LAST in the middleware chain.
 */
const errorHandler = (err, req, res, next) => {
  // Default values
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal server error";
  let code = err.code || "INTERNAL_ERROR";
  let details = err.details || null;

  // Log the error
  if (statusCode >= 500) {
    logger.error(`[${statusCode}] ${message}`, {
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userId: req.user?.id,
    });
  } else {
    logger.warn(`[${statusCode}] ${message}`, {
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      details: details,
    });
  }

  // Handle specific error types

  // Mongoose validation error
  if (err.name === "ValidationError") {
    statusCode = 422;
    code = "VALIDATION_ERROR";
    message = "Validation failed";
    details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 409;
    code = "DUPLICATE_ERROR";
    const field = Object.keys(err.keyValue)[0];
    message = `${field} already exists`;
    details = [{ field, message: `This ${field} is already taken` }];
  }

  // Mongoose cast error (invalid ObjectId, etc.)
  if (err.name === "CastError") {
    statusCode = 400;
    code = "INVALID_ID";
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    code = "INVALID_TOKEN";
    message = "Invalid token";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    code = "TOKEN_EXPIRED";
    message = "Token has expired";
  }

  // Multer errors
  if (err.name === "MulterError") {
    statusCode = 400;
    code = "UPLOAD_ERROR";
    message = err.message;
  }

  // Build response
  const response = {
    success: false,
    error: {
      code,
      message,
    },
  };

  // Include details if available
  if (details) {
    response.error.details = details;
  }

  // Include stack trace in development
  if (config.env === "development") {
    response.error.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

/**
 * 404 Not Found handler
 */
const notFoundHandler = (req, res, next) => {
  const AppError = require("../utils/AppError");
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

module.exports = { globalErrorHandler: errorHandler, notFoundHandler };
