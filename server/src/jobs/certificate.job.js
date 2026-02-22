const { Worker } = require("bullmq");
const { createRedisConnection } = require("../config/redis");
const certificateService = require("../services/certificate.service");
const logger = require("../utils/logger");

let certificateWorker = null;

/**
 * Start certificate worker to process generation jobs
 */
const startCertificateWorker = () => {
  try {
    certificateWorker = new Worker(
      "certificate-generation",
      async (job) => {
        const { data } = job;

        logger.info(`Processing certificate job ${job.id}`);

        const result = await certificateService.generateBatch(
          data.adminId,
          data.templateId,
          data.batchId,
        );

        return result;
      },
      {
        connection: createRedisConnection(),
        concurrency: 2,
      },
    );

    certificateWorker.on("completed", (job) => {
      logger.info(`Certificate job ${job.id} completed`);
    });

    certificateWorker.on("failed", (job, error) => {
      logger.error(`Certificate job ${job?.id} failed: ${error.message}`);
    });

    certificateWorker.on("error", (error) => {
      logger.error("Certificate worker error:", error.message);
    });

    logger.info("Certificate worker started (concurrency: 2)");
    return certificateWorker;
  } catch (error) {
    logger.warn("Failed to start certificate worker:", error.message);
    return null;
  }
};

/**
 * Stop certificate worker gracefully
 */
const stopCertificateWorker = async () => {
  if (certificateWorker) {
    await certificateWorker.close();
    logger.info("Certificate worker stopped");
  }
};

module.exports = { startCertificateWorker, stopCertificateWorker };
