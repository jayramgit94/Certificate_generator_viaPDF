const { Worker } = require("bullmq");
const { createRedisConnection } = require("../config/redis");
const emailService = require("../services/email.service");
const logger = require("../utils/logger");

let emailWorker = null;

/**
 * Start email worker to process email jobs from the queue
 */
const startEmailWorker = () => {
  try {
    emailWorker = new Worker(
      "email-sending",
      async (job) => {
        const { name, data } = job;

        logger.info(`Processing email job ${job.id}: ${name}`);

        switch (name) {
          case "send-email": {
            const result = await emailService.sendSingle(
              data.adminId,
              data.certificateId,
              data.options || {},
            );
            if (!result.success) {
              throw new Error(result.error || "Email sending failed");
            }
            return { success: true, emailLogId: result.emailLog._id };
          }

          case "send-batch-email": {
            const result = await emailService.sendBatch(
              data.adminId,
              data.certificateIds,
              data.options || {},
            );
            return result;
          }

          default:
            throw new Error(`Unknown email job type: ${name}`);
        }
      },
      {
        connection: createRedisConnection(),
        concurrency: 3,
        limiter: {
          max: 10,
          duration: 60000, // 10 emails per minute max
        },
      },
    );

    emailWorker.on("completed", (job) => {
      logger.info(`Email job ${job.id} completed`);
    });

    emailWorker.on("failed", (job, error) => {
      logger.error(`Email job ${job?.id} failed: ${error.message}`);
    });

    emailWorker.on("error", (error) => {
      logger.error("Email worker error:", error.message);
    });

    logger.info("Email worker started (concurrency: 3)");
    return emailWorker;
  } catch (error) {
    logger.warn(
      "Failed to start email worker (Redis may not be available):",
      error.message,
    );
    return null;
  }
};

/**
 * Stop email worker gracefully
 */
const stopEmailWorker = async () => {
  if (emailWorker) {
    await emailWorker.close();
    logger.info("Email worker stopped");
  }
};

module.exports = { startEmailWorker, stopEmailWorker };
