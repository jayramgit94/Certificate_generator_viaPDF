const dotenv = require("dotenv");
const path = require("path");

// Load .env file
dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });

const config = {
  env: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT, 10) || 5000,

  mongo: {
    uri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/certigen",
  },

  redis: {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || "dev-access-secret",
    refreshSecret: process.env.JWT_REFRESH_SECRET || "dev-refresh-secret",
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  },

  email: {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    fromName: process.env.EMAIL_FROM_NAME || "CertiGen",
    fromAddress: process.env.EMAIL_FROM_ADDRESS || "noreply@certigen.com",
  },

  upload: {
    maxFileSize:
      (parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 10) * 1024 * 1024,
    maxTemplateSize:
      (parseInt(process.env.MAX_TEMPLATE_SIZE_MB, 10) || 25) * 1024 * 1024,
  },

  cors: {
    clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  },

  logging: {
    level: process.env.LOG_LEVEL || "debug",
  },
};

module.exports = config;
