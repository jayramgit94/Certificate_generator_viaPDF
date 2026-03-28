const config = require("./index");

const normalizeOrigin = (value) => {
  if (!value || typeof value !== "string") return null;
  try {
    return new URL(value).origin;
  } catch {
    return value.replace(/\/$/, "");
  }
};

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      config.cors.clientUrl,
      "http://localhost:5173",
      "http://localhost:3000",
    ]
      .map((o) => normalizeOrigin(o))
      .filter(Boolean);

    // Also allow any extra origins from CORS_ORIGINS env var (comma-separated)
    if (process.env.CORS_ORIGINS) {
      process.env.CORS_ORIGINS.split(",")
        .map((o) => o.trim())
        .map((o) => normalizeOrigin(o))
        .filter(Boolean)
        .forEach((o) => allowedOrigins.push(o));
    }

    // Browsers often send no Origin for direct asset loads (<img>, <object>, etc.).
    if (!origin) {
      return callback(null, true);
    }

    const normalizedOrigin = normalizeOrigin(origin);

    if (normalizedOrigin && allowedOrigins.includes(normalizedOrigin)) {
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
