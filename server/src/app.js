const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const path = require("path");
const corsOptions = require("./config/cors");
const { generalLimiter } = require("./middleware/rateLimiter.middleware");
const {
  globalErrorHandler,
  notFoundHandler,
} = require("./middleware/errorHandler.middleware");
const routes = require("./routes");
const logger = require("./utils/logger");

const app = express();

// ===== Security Middleware =====
app.use(helmet());
app.use(cors(corsOptions));

// ===== Body Parsing =====
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ===== Rate Limiting =====
app.use("/api", generalLimiter);

// ===== Request Logging =====
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.info(
      `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`,
      {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration,
        ip: req.ip,
      },
    );
  });
  next();
});

// ===== Static Files (uploads) =====
app.use(
  "/uploads",
  express.static(path.join(__dirname, "..", "uploads"), {
    dotfiles: "deny",
    index: false,
  }),
);

// ===== API Routes =====
app.use("/api", routes);

// ===== Serve Frontend in Production =====
if (process.env.NODE_ENV === "production") {
  const clientDist = path.join(__dirname, "..", "..", "client", "dist");
  app.use(express.static(clientDist));
  app.get("*", (req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
} else {
  // ===== Root Endpoint (Dev) =====
  app.get("/", (req, res) => {
    res.json({
      name: "CertiGen API",
      version: "2.0.0",
      description: "Enterprise Certificate Management SaaS",
      docs: "/api/health",
    });
  });
}

// ===== 404 Handler =====
app.use(notFoundHandler);

// ===== Global Error Handler =====
app.use(globalErrorHandler);

module.exports = app;
