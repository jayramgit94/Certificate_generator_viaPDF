const QRCode = require("qrcode");
const logger = require("../utils/logger");

class QRCodeService {
  /**
   * Generate QR code as PNG buffer
   * @param {string} data - Data to encode in QR code
   * @param {Object} options - QR code options
   * @returns {Promise<Buffer>} PNG buffer
   */
  async generateBuffer(data, options = {}) {
    try {
      const buffer = await QRCode.toBuffer(data, {
        type: "png",
        width: options.size || 150,
        margin: 1,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
        errorCorrectionLevel: "M",
      });
      return buffer;
    } catch (error) {
      logger.error("QR code generation failed:", error);
      throw new Error("Failed to generate QR code");
    }
  }

  /**
   * Generate QR code as data URL
   * @param {string} data - Data to encode
   * @returns {Promise<string>} Data URL string
   */
  async generateDataURL(data, options = {}) {
    try {
      const dataUrl = await QRCode.toDataURL(data, {
        width: options.size || 150,
        margin: 1,
        errorCorrectionLevel: "M",
      });
      return dataUrl;
    } catch (error) {
      logger.error("QR code data URL generation failed:", error);
      throw new Error("Failed to generate QR code");
    }
  }

  /**
   * Build verification URL for a certificate
   * @param {string} certificateId
   * @param {string} baseUrl
   * @returns {string}
   */
  buildVerificationUrl(certificateId, baseUrl = "") {
    const base = baseUrl || process.env.CLIENT_URL || "http://localhost:5173";
    return `${base}/verify/${certificateId}`;
  }
}

module.exports = new QRCodeService();
