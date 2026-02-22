const Admin = require("../models/Admin");
const ActivityLog = require("../models/ActivityLog");
const AppError = require("../utils/AppError");
const {
  generateTokenPair,
  verifyRefreshToken,
} = require("../utils/tokenUtils");
const logger = require("../utils/logger");

class AuthService {
  /**
   * Register a new admin
   */
  async register({ name, email, password }) {
    // Check if email already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      throw AppError.conflict("Email is already registered");
    }

    // Create admin
    const admin = await Admin.create({ name, email, password });

    // Generate tokens
    const tokens = generateTokenPair(admin);

    // Save refresh token
    await Admin.findByIdAndUpdate(admin._id, {
      $push: { refreshTokens: tokens.refreshToken },
    });

    logger.info(`New admin registered: ${email}`);

    return {
      admin: admin.toJSON(),
      ...tokens,
    };
  }

  /**
   * Login admin
   */
  async login({ email, password }, { ip, userAgent } = {}) {
    // Find admin with password field
    const admin = await Admin.findOne({ email }).select("+password");
    if (!admin) {
      throw AppError.unauthorized("Invalid email or password");
    }

    // Check if account is active
    if (!admin.isActive) {
      throw AppError.forbidden(
        "Account has been deactivated. Contact support.",
      );
    }

    // Verify password
    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      throw AppError.unauthorized("Invalid email or password");
    }

    // Generate tokens
    const tokens = generateTokenPair(admin);

    // Save refresh token and update last login
    await Admin.findByIdAndUpdate(admin._id, {
      $push: { refreshTokens: tokens.refreshToken },
      lastLogin: new Date(),
    });

    // Log activity
    await ActivityLog.create({
      admin: admin._id,
      action: "login",
      details: `Admin logged in`,
      ip,
      userAgent,
    });

    logger.info(`Admin logged in: ${email}`);

    return {
      admin: admin.toJSON(),
      ...tokens,
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken) {
    // Verify refresh token
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (error) {
      throw AppError.unauthorized("Invalid or expired refresh token");
    }

    // Find admin and check if refresh token exists
    const admin = await Admin.findById(decoded.id).select("+refreshTokens");
    if (!admin) {
      throw AppError.unauthorized("User not found");
    }

    if (!admin.refreshTokens.includes(refreshToken)) {
      // Token reuse detected — invalidate all tokens
      await Admin.findByIdAndUpdate(admin._id, { refreshTokens: [] });
      throw AppError.unauthorized(
        "Token reuse detected. All sessions invalidated.",
      );
    }

    // Generate new token pair
    const tokens = generateTokenPair(admin);

    // Replace old refresh token with new one
    await Admin.findByIdAndUpdate(admin._id, {
      $pull: { refreshTokens: refreshToken },
      $push: { refreshTokens: tokens.refreshToken },
    });

    return tokens;
  }

  /**
   * Logout — invalidate refresh token
   */
  async logout(userId, refreshToken) {
    await Admin.findByIdAndUpdate(userId, {
      $pull: { refreshTokens: refreshToken },
    });

    logger.info(`Admin logged out: ${userId}`);
  }

  /**
   * Get admin profile
   */
  async getProfile(userId) {
    const admin = await Admin.findById(userId);
    if (!admin) {
      throw AppError.notFound("Admin");
    }
    return admin.toJSON();
  }

  /**
   * Update admin profile
   */
  async updateProfile(userId, updates) {
    const admin = await Admin.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true,
    });
    if (!admin) {
      throw AppError.notFound("Admin");
    }
    return admin.toJSON();
  }

  /**
   * Change password
   */
  async changePassword(userId, { currentPassword, newPassword }) {
    const admin = await Admin.findById(userId).select("+password");
    if (!admin) {
      throw AppError.notFound("Admin");
    }

    // Verify current password
    const isValid = await admin.comparePassword(currentPassword);
    if (!isValid) {
      throw AppError.unauthorized("Current password is incorrect");
    }

    // Update password
    admin.password = newPassword;
    await admin.save();

    // Invalidate all refresh tokens (force re-login)
    await Admin.findByIdAndUpdate(userId, { refreshTokens: [] });

    // Generate new tokens
    const tokens = generateTokenPair(admin);
    await Admin.findByIdAndUpdate(userId, {
      $push: { refreshTokens: tokens.refreshToken },
    });

    logger.info(`Admin changed password: ${admin.email}`);

    return tokens;
  }

  /**
   * List all admins (super admin only)
   */
  async listAdmins({ page = 1, limit = 20 }) {
    const skip = (page - 1) * limit;
    const [admins, total] = await Promise.all([
      Admin.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
      Admin.countDocuments(),
    ]);

    return {
      admins,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Change admin role (super admin only)
   */
  async changeRole(adminId, newRole, requesterId) {
    if (adminId === requesterId.toString()) {
      throw AppError.badRequest("Cannot change your own role");
    }

    const admin = await Admin.findByIdAndUpdate(
      adminId,
      { role: newRole },
      { new: true, runValidators: true },
    );
    if (!admin) {
      throw AppError.notFound("Admin");
    }

    await ActivityLog.create({
      admin: requesterId,
      action: "change_role",
      resource: "admin",
      resourceId: adminId,
      details: `Changed role of ${admin.email} to ${newRole}`,
    });

    return admin.toJSON();
  }

  /**
   * Activate/deactivate admin (super admin only)
   */
  async changeStatus(adminId, isActive, requesterId) {
    if (adminId === requesterId.toString()) {
      throw AppError.badRequest("Cannot deactivate your own account");
    }

    const admin = await Admin.findByIdAndUpdate(
      adminId,
      { isActive },
      { new: true },
    );
    if (!admin) {
      throw AppError.notFound("Admin");
    }

    // If deactivating, invalidate all refresh tokens
    if (!isActive) {
      await Admin.findByIdAndUpdate(adminId, { refreshTokens: [] });
    }

    return admin.toJSON();
  }

  /**
   * Delete admin (super admin only)
   */
  async deleteAdmin(adminId, requesterId) {
    if (adminId === requesterId.toString()) {
      throw AppError.badRequest("Cannot delete your own account");
    }

    const admin = await Admin.findByIdAndDelete(adminId);
    if (!admin) {
      throw AppError.notFound("Admin");
    }

    await ActivityLog.create({
      admin: requesterId,
      action: "delete_user",
      resource: "admin",
      resourceId: adminId,
      details: `Deleted admin ${admin.email}`,
    });

    logger.info(`Admin deleted: ${admin.email} by ${requesterId}`);
  }
}

module.exports = new AuthService();
