const { verifyAccessToken } = require("../utils/tokenUtils");
const AppError = require("../utils/AppError");
const Admin = require("../models/Admin");
const logger = require("../utils/logger");

/**
 * JWT Authentication Middleware
 * Verifies the access token from the Authorization header.
 */
const authenticate = async (req, res, next) => {
  try {
    // 1. Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw AppError.unauthorized("Access token is required");
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      throw AppError.unauthorized("Access token is required");
    }

    // 2. Verify token
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        throw AppError.unauthorized("Access token has expired");
      }
      throw AppError.unauthorized("Invalid access token");
    }

    // 3. Check if user still exists and is active
    const admin = await Admin.findById(decoded.id);
    if (!admin) {
      throw AppError.unauthorized("User no longer exists");
    }
    if (!admin.isActive) {
      throw AppError.forbidden("Account has been deactivated");
    }

    // 4. Attach user to request
    req.user = {
      _id: admin._id,
      id: admin._id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    };

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = authenticate;
