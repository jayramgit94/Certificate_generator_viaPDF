const asyncHandler = require("../utils/asyncHandler");

/**
 * @desc    Health check
 * @route   GET /api/health
 */
const healthCheck = asyncHandler(async (req, res) => {
  const mongoose = require("mongoose");

  const health = {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    memory: {
      rss: `${(process.memoryUsage().rss / 1024 / 1024).toFixed(2)} MB`,
      heapUsed: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
    },
  };

  res.json({ success: true, data: health });
});

module.exports = { healthCheck };
