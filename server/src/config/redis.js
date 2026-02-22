const Redis = require("ioredis");
const logger = require("../utils/logger");
const config = require("./index");

let redisClient = null;

const createRedisConnection = () => {
  if (redisClient) return redisClient;

  const options = {
    host: config.redis.host,
    port: config.redis.port,
    maxRetriesPerRequest: null, // Required for BullMQ
    enableReadyCheck: false,
  };

  if (config.redis.password) {
    options.password = config.redis.password;
  }

  redisClient = new Redis(options);

  redisClient.on("connect", () => {
    logger.info(`Redis connected: ${config.redis.host}:${config.redis.port}`);
  });

  redisClient.on("error", (err) => {
    logger.error("Redis connection error:", err.message);
  });

  redisClient.on("close", () => {
    logger.warn("Redis connection closed");
  });

  return redisClient;
};

const getRedisClient = () => {
  if (!redisClient) {
    return createRedisConnection();
  }
  return redisClient;
};

module.exports = { createRedisConnection, getRedisClient };
