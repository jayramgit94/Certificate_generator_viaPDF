const { Queue } = require("bullmq");
const { createRedisConnection } = require("../config/redis");
const logger = require("../utils/logger");

let emailQueue = null;
let certificateQueue = null;

/**
 * Initialize BullMQ queues (lazily — only if Redis is available)
 */
const getEmailQueue = () => {
  if (!emailQueue) {
    try {
      emailQueue = new Queue("email-sending", {
        connection: createRedisConnection(),
        defaultJobOptions: {
          removeOnComplete: { count: 1000 },
          removeOnFail: { count: 5000 },
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 5000,
          },
        },
      });
      logger.info("Email queue initialized");
    } catch (error) {
      logger.warn("Redis not available — email queue disabled:", error.message);
      return null;
    }
  }
  return emailQueue;
};

const getCertificateQueue = () => {
  if (!certificateQueue) {
    try {
      certificateQueue = new Queue("certificate-generation", {
        connection: createRedisConnection(),
        defaultJobOptions: {
          removeOnComplete: { count: 500 },
          removeOnFail: { count: 2000 },
          attempts: 2,
          backoff: {
            type: "fixed",
            delay: 3000,
          },
        },
      });
      logger.info("Certificate queue initialized");
    } catch (error) {
      logger.warn(
        "Redis not available — certificate queue disabled:",
        error.message,
      );
      return null;
    }
  }
  return certificateQueue;
};

/**
 * Add email job to queue
 */
const addEmailJob = async (data, options = {}) => {
  const queue = getEmailQueue();
  if (!queue) {
    logger.warn("Email queue not available. Processing inline.");
    return null;
  }

  const job = await queue.add("send-email", data, {
    priority: options.priority || 5,
    delay: options.delay || 0,
    ...options,
  });

  logger.info(`Email job added: ${job.id}`);
  return job;
};

/**
 * Add batch email job to queue
 */
const addBatchEmailJob = async (data, options = {}) => {
  const queue = getEmailQueue();
  if (!queue) return null;

  const job = await queue.add("send-batch-email", data, {
    priority: options.priority || 3,
    ...options,
  });

  logger.info(`Batch email job added: ${job.id}`);
  return job;
};

/**
 * Add certificate generation job to queue
 */
const addCertificateJob = async (data, options = {}) => {
  const queue = getCertificateQueue();
  if (!queue) return null;

  const job = await queue.add("generate-certificate", data, {
    priority: options.priority || 5,
    ...options,
  });

  logger.info(`Certificate job added: ${job.id}`);
  return job;
};

/**
 * Close all queues gracefully
 */
const closeQueues = async () => {
  if (emailQueue) await emailQueue.close();
  if (certificateQueue) await certificateQueue.close();
  logger.info("All queues closed");
};

module.exports = {
  getEmailQueue,
  getCertificateQueue,
  addEmailJob,
  addBatchEmailJob,
  addCertificateJob,
  closeQueues,
};
