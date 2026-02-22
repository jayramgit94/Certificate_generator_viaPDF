const authService = require("../services/auth.service");
const asyncHandler = require("../utils/asyncHandler");

/**
 * @desc    Register new admin
 * @route   POST /api/auth/register
 */
const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);

  res.status(201).json({
    success: true,
    message: "Admin registered successfully",
    data: result,
  });
});

/**
 * @desc    Login admin
 * @route   POST /api/auth/login
 */
const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body, {
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });

  res.json({
    success: true,
    message: "Login successful",
    data: result,
  });
});

/**
 * @desc    Refresh access token
 * @route   POST /api/auth/refresh
 */
const refresh = asyncHandler(async (req, res) => {
  const result = await authService.refreshToken(req.body.refreshToken);

  res.json({
    success: true,
    message: "Token refreshed",
    data: result,
  });
});

/**
 * @desc    Logout admin
 * @route   POST /api/auth/logout
 */
const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user._id, req.body.refreshToken);

  res.json({
    success: true,
    message: "Logged out successfully",
  });
});

/**
 * @desc    Get current admin profile
 * @route   GET /api/auth/me
 */
const getMe = asyncHandler(async (req, res) => {
  const admin = await authService.getProfile(req.user._id);

  res.json({
    success: true,
    data: admin,
  });
});

/**
 * @desc    Update profile
 * @route   PUT /api/auth/me
 */
const updateProfile = asyncHandler(async (req, res) => {
  const admin = await authService.updateProfile(req.user._id, req.body);

  res.json({
    success: true,
    message: "Profile updated",
    data: admin,
  });
});

/**
 * @desc    Change password
 * @route   PUT /api/auth/change-password
 */
const changePassword = asyncHandler(async (req, res) => {
  const tokens = await authService.changePassword(req.user._id, req.body);

  res.json({
    success: true,
    message: "Password changed. Please use new tokens.",
    data: tokens,
  });
});

/**
 * @desc    List all admins (super_admin)
 * @route   GET /api/auth/admins
 */
const listAdmins = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await authService.listAdmins({
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
  });

  res.json({ success: true, data: result });
});

/**
 * @desc    Change admin role (super_admin)
 * @route   PUT /api/auth/admins/:id/role
 */
const changeRole = asyncHandler(async (req, res) => {
  const admin = await authService.changeRole(
    req.params.id,
    req.body.role,
    req.user._id,
  );

  res.json({
    success: true,
    message: "Role updated",
    data: admin,
  });
});

/**
 * @desc    Change admin status (super_admin)
 * @route   PUT /api/auth/admins/:id/status
 */
const changeStatus = asyncHandler(async (req, res) => {
  const admin = await authService.changeStatus(
    req.params.id,
    req.body.isActive,
    req.user._id,
  );

  res.json({
    success: true,
    message: req.body.isActive ? "Admin activated" : "Admin deactivated",
    data: admin,
  });
});

/**
 * @desc    Delete admin (super_admin)
 * @route   DELETE /api/auth/admins/:id
 */
const deleteAdmin = asyncHandler(async (req, res) => {
  await authService.deleteAdmin(req.params.id, req.user._id);

  res.json({
    success: true,
    message: "Admin deleted",
  });
});

module.exports = {
  register,
  login,
  refresh,
  logout,
  getMe,
  updateProfile,
  changePassword,
  listAdmins,
  changeRole,
  changeStatus,
  deleteAdmin,
};
