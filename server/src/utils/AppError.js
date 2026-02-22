/**
 * Custom application error class.
 * Extends Error with HTTP status code and operational flag.
 */
class AppError extends Error {
  /**
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {string} [code] - Application error code
   * @param {Array} [details] - Validation error details
   */
  constructor(message, statusCode, code = null, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || this._getDefaultCode(statusCode);
    this.details = details;
    this.isOperational = true; // Distinguishes operational errors from programming errors
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";

    Error.captureStackTrace(this, this.constructor);
  }

  _getDefaultCode(statusCode) {
    const codes = {
      400: "BAD_REQUEST",
      401: "UNAUTHORIZED",
      403: "FORBIDDEN",
      404: "NOT_FOUND",
      409: "CONFLICT",
      422: "VALIDATION_ERROR",
      429: "TOO_MANY_REQUESTS",
      500: "INTERNAL_ERROR",
    };
    return codes[statusCode] || "UNKNOWN_ERROR";
  }

  // Factory methods for common errors
  static badRequest(message, details = null) {
    return new AppError(message, 400, "BAD_REQUEST", details);
  }

  static unauthorized(message = "Authentication required") {
    return new AppError(message, 401, "UNAUTHORIZED");
  }

  static forbidden(message = "Access denied") {
    return new AppError(message, 403, "FORBIDDEN");
  }

  static notFound(resource = "Resource") {
    return new AppError(`${resource} not found`, 404, "NOT_FOUND");
  }

  static conflict(message) {
    return new AppError(message, 409, "CONFLICT");
  }

  static validation(message, details = null) {
    return new AppError(message, 422, "VALIDATION_ERROR", details);
  }

  static tooManyRequests(
    message = "Too many requests, please try again later",
  ) {
    return new AppError(message, 429, "TOO_MANY_REQUESTS");
  }

  static internal(message = "Internal server error") {
    return new AppError(message, 500, "INTERNAL_ERROR");
  }
}

module.exports = AppError;
