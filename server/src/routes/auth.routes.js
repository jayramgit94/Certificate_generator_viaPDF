const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const validate = require("../middleware/validate.middleware");
const { authLimiter } = require("../middleware/rateLimiter.middleware");
const {
  registerSchema,
  loginSchema,
  refreshSchema,
  updateProfileSchema,
  changePasswordSchema,
} = require("../validators/auth.validator");

// Public routes
router.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  authController.register,
);
router.post("/login", authLimiter, validate(loginSchema), authController.login);
router.post("/refresh", validate(refreshSchema), authController.refresh);

// Protected routes
router.use(authenticate);
router.post("/logout", authController.logout);
router.get("/me", authController.getMe);
router.put("/me", validate(updateProfileSchema), authController.updateProfile);
router.put(
  "/change-password",
  validate(changePasswordSchema),
  authController.changePassword,
);

// Super admin only
router.get("/admins", authorize("super_admin"), authController.listAdmins);
router.put(
  "/admins/:id/role",
  authorize("super_admin"),
  authController.changeRole,
);
router.put(
  "/admins/:id/status",
  authorize("super_admin"),
  authController.changeStatus,
);
router.delete(
  "/admins/:id",
  authorize("super_admin"),
  authController.deleteAdmin,
);

module.exports = router;
