const winston = require("winston");
const path = require("path");

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom log format
const logFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  let log = `${timestamp} [${level}]: ${stack || message}`;
  if (Object.keys(meta).length > 0) {
    log += ` ${JSON.stringify(meta)}`;
  }
  return log;
});

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "debug",
  format: combine(
    errors({ stack: true }),
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    logFormat,
  ),
  defaultMeta: { service: "certigen-api" },
  transports: [
    // Console transport (always enabled)
    new winston.transports.Console({
      format: combine(colorize(), timestamp({ format: "HH:mm:ss" }), logFormat),
    }),
    // File transport - errors only
    new winston.transports.File({
      filename: path.join(__dirname, "..", "..", "logs", "error.log"),
      level: "error",
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 5,
    }),
    // File transport - all logs
    new winston.transports.File({
      filename: path.join(__dirname, "..", "..", "logs", "combined.log"),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    }),
  ],
  // Don't exit on uncaught errors
  exitOnError: false,
});

// Stream for morgan (HTTP request logging) - if needed later
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  },
};

module.exports = logger;
