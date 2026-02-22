const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analytics.controller");
const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");

// All routes require authentication
router.use(authenticate);

router.get("/dashboard", analyticsController.dashboard);
router.get("/emails", analyticsController.emailAnalytics);
router.get("/certificates", analyticsController.certificateAnalytics);
router.get("/activity", analyticsController.activityLogs);
router.get(
  "/export",
  authorize("super_admin", "admin"),
  analyticsController.exportReport,
);

module.exports = router;
