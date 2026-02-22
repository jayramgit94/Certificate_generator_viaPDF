const { v4: uuidv4 } = require("uuid");

/**
 * Generate a unique certificate ID
 * Format: CERT-YYYY-XXXXXXXX (e.g., CERT-2026-A1B2C3D4)
 * @returns {string}
 */
const generateCertificateId = () => {
  const year = new Date().getFullYear();
  const uniquePart = uuidv4().replace(/-/g, "").substring(0, 8).toUpperCase();
  return `CERT-${year}-${uniquePart}`;
};

/**
 * Generate a batch ID
 * Format: BATCH-XXXXXXXX
 * @returns {string}
 */
const generateBatchId = () => {
  const uniquePart = uuidv4().replace(/-/g, "").substring(0, 8).toUpperCase();
  return `BATCH-${uniquePart}`;
};

/**
 * Generate a short unique ID
 * @param {number} length - Length of the ID (default: 12)
 * @returns {string}
 */
const generateShortId = (length = 12) => {
  return uuidv4().replace(/-/g, "").substring(0, length);
};

module.exports = { generateCertificateId, generateBatchId, generateShortId };
