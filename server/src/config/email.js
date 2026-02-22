const nodemailer = require("nodemailer");
const config = require("./index");
const logger = require("../utils/logger");

let transporter = null;

const createEmailTransporter = () => {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.secure,
    auth: {
      user: config.email.user,
      pass: config.email.pass,
    },
    // Connection pool for batch sending
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    // Timeouts
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 30000,
  });

  return transporter;
};

const verifyEmailConnection = async () => {
  try {
    const t = createEmailTransporter();
    await t.verify();
    logger.info("Email transporter verified and ready");
    return true;
  } catch (error) {
    logger.warn("Email transporter verification failed:", error.message);
    logger.warn("Email sending may not work. Check SMTP credentials in .env");
    return false;
  }
};

const getEmailTransporter = () => {
  if (!transporter) {
    return createEmailTransporter();
  }
  return transporter;
};

module.exports = {
  createEmailTransporter,
  verifyEmailConnection,
  getEmailTransporter,
};
