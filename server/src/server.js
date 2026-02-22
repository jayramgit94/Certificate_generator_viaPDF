require("dotenv").config();
const app = require("./app");
const config = require("./config");
const connectDB = require("./config/db");
const logger = require("./utils/logger");

const PORT = config.port;

// ===== Start Server =====
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    logger.info("MongoDB connected");

    // Start Express
    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${config.env} mode`);
      logger.info(`Health check: http://localhost:${PORT}/api/health`);
    });

    // Graceful shutdown
    const shutdown = async (signal) => {
      logger.info(`${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        logger.info("HTTP server closed");
        const mongoose = require("mongoose");
        await mongoose.connection.close();
        logger.info("MongoDB connection closed");
        process.exit(0);
      });

      // Force close after 10 seconds
      setTimeout(() => {
        logger.error("Forced shutdown after timeout");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));

    // Unhandled Rejections
    process.on("unhandledRejection", (reason, promise) => {
      logger.error("Unhandled Rejection:", reason);
    });

    // Uncaught Exceptions
    process.on("uncaughtException", (error) => {
      logger.error("Uncaught Exception:", error);
      shutdown("UNCAUGHT_EXCEPTION");
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
