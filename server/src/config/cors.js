const config = require("./index");

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      config.cors.clientUrl,
      "http://localhost:5173",
      "http://localhost:3000",
    ];

    // Also allow any extra origins from CORS_ORIGINS env var (comma-separated)
    if (process.env.CORS_ORIGINS) {
      process.env.CORS_ORIGINS.split(",")
        .map((o) => o.trim())
        .forEach((o) => allowedOrigins.push(o));
    }

    // Allow requests with no origin (mobile apps, curl, etc.) in development
    if (!origin && config.env === "development") {
      return callback(null, true);
    }

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["Content-Disposition"],
  maxAge: 86400, // 24 hours
};

module.exports = corsOptions;
