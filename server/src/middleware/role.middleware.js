const AppError = require("../utils/AppError");

/**
 * Role-based access control middleware.
 * Must be used AFTER authenticate middleware.
 *
 * @param  {...string} allowedRoles - Roles that are allowed access
 * @returns {Function} Express middleware
 *
 * @example
 * router.get('/admin-only', authenticate, authorize('super_admin', 'admin'), handler);
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(AppError.unauthorized("Authentication required"));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        AppError.forbidden(
          `Role '${req.user.role}' does not have permission to access this resource`,
        ),
      );
    }

    next();
  };
};

module.exports = authorize;
