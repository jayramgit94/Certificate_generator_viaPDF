const mongoose = require("mongoose");
const logger = require("../utils/logger");
const config = require("./index");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongo.uri, {
      // Mongoose 8 defaults are good, but we add these for production
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    logger.info(
      `MongoDB connected: ${conn.connection.host}/${conn.connection.name}`,
    );

    // Handle connection events
    mongoose.connection.on("error", (err) => {
      logger.error("MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      logger.warn("MongoDB disconnected. Attempting reconnect...");
    });

    mongoose.connection.on("reconnected", () => {
      logger.info("MongoDB reconnected");
    });

    return conn;
  } catch (error) {
    logger.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
