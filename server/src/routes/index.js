const express = require("express");
const router = express.Router();

const authRoutes = require("./auth.routes");
const templateRoutes = require("./template.routes");
const recipientRoutes = require("./recipient.routes");
const certificateRoutes = require("./certificate.routes");
const emailRoutes = require("./email.routes");
const analyticsRoutes = require("./analytics.routes");
const { healthCheck } = require("../controllers/health.controller");

// Health check
router.get("/health", healthCheck);

// API routes
router.use("/auth", authRoutes);
router.use("/templates", templateRoutes);
router.use("/recipients", recipientRoutes);
router.use("/certificates", certificateRoutes);
router.use("/emails", emailRoutes);
router.use("/analytics", analyticsRoutes);

// Public verification (also mounted on certificates router)
router.get(
  "/verify/:certificateId",
  require("../controllers/certificate.controller").verify,
);

module.exports = router;
