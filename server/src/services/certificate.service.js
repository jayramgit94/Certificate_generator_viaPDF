const fs = require("fs");
const path = require("path");
const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");
const Certificate = require("../models/Certificate");
const Template = require("../models/Template");
const Recipient = require("../models/Recipient");
const ActivityLog = require("../models/ActivityLog");
const qrcodeService = require("./qrcode.service");
const gridfsService = require("./gridfs.service");
const { generateCertificateId } = require("../utils/idGenerator");
const AppError = require("../utils/AppError");
const logger = require("../utils/logger");

class CertificateService {
  /**
   * Generate a single certificate
   */
  async generateSingle(adminId, templateId, recipientData) {
    // Load template
    const template = await Template.findOne({
      _id: templateId,
      admin: adminId,
    });
    if (!template) {
      throw AppError.notFound("Template");
    }

    // Generate certificate
    const certificate = await this._generateCertificate(
      template,
      recipientData,
      adminId,
    );

    await ActivityLog.create({
      admin: adminId,
      action: "generate_certificates",
      resource: "certificate",
      resourceId: certificate._id,
      details: `Generated certificate for ${recipientData.name}`,
    });

    return certificate;
  }

  /**
   * Generate certificates for an entire batch
   */
  async generateBatch(adminId, templateId, batchId) {
    // Load template
    const template = await Template.findOne({
      _id: templateId,
      admin: adminId,
    });
    if (!template) {
      throw AppError.notFound("Template");
    }

    // Load batch
    const batch = await Recipient.findOne({ _id: batchId, admin: adminId });
    if (!batch) {
      throw AppError.notFound("Recipient batch");
    }

    // Filter valid, non-duplicate records
    const validRecords = batch.records.filter(
      (r) => r.isValid && !r.isDuplicate,
    );
    if (validRecords.length === 0) {
      throw AppError.badRequest(
        "No valid recipients to generate certificates for",
      );
    }

    // Update batch status
    batch.status = "processing";
    await batch.save();

    const results = {
      total: validRecords.length,
      success: 0,
      failed: 0,
      certificates: [],
      errors: [],
    };

    // Generate each certificate
    for (const record of validRecords) {
      try {
        const recipientData = {
          name: record.name,
          email: record.email,
          event: record.event || "",
          date: record.date || new Date().toISOString().split("T")[0],
          customFields: record.customFields || {},
        };

        const certificate = await this._generateCertificate(
          template,
          recipientData,
          adminId,
          batchId,
        );
        results.success++;
        results.certificates.push(certificate._id);
      } catch (error) {
        results.failed++;
        results.errors.push({
          name: record.name,
          email: record.email,
          error: error.message,
        });
        logger.error(
          `Certificate generation failed for ${record.email}:`,
          error,
        );
      }
    }

    // Update batch status
    batch.status = "completed";
    await batch.save();

    await ActivityLog.create({
      admin: adminId,
      action: "generate_certificates",
      resource: "recipient",
      resourceId: batchId,
      details: `Generated ${results.success}/${results.total} certificates`,
      metadata: results,
    });

    logger.info(
      `Batch certificate generation: ${results.success}/${results.total} successful`,
    );

    return results;
  }

  /**
   * Core certificate generation logic
   */
  async _generateCertificate(template, recipientData, adminId, batchId = null) {
    // Generate unique ID
    const certId = generateCertificateId();

    // Generate verification URL and QR code
    const verificationUrl = qrcodeService.buildVerificationUrl(certId);
    let qrCodeBuffer = null;
    if (template.qrCode?.enabled) {
      qrCodeBuffer = await qrcodeService.generateBuffer(verificationUrl, {
        size: template.qrCode.size || 150,
      });
    }

    // Load or create PDF document
    let pdfDoc;
    const templateFile = await this._resolveTemplateFile(template);
    const templateExt = path.extname(templateFile.filename || "").toLowerCase();
    const templateMime = (templateFile.contentType || "").toLowerCase();

    if (template.fileType === "image") {
      // Template is an image — create a new PDF and embed the image as background
      const imageBytes = templateFile.buffer;
      pdfDoc = await PDFDocument.create();

      let embeddedImage;
      if (templateMime === "image/png" || templateExt === ".png") {
        embeddedImage = await pdfDoc.embedPng(imageBytes);
      } else if (
        templateMime === "image/jpeg" ||
        templateExt === ".jpg" ||
        templateExt === ".jpeg"
      ) {
        embeddedImage = await pdfDoc.embedJpg(imageBytes);
      } else {
        throw AppError.badRequest(
          "Unsupported template image format. Use PNG or JPEG.",
        );
      }

      // Use landscape A4 as default, scale image to fill
      const pageWidth = 842;
      const pageHeight = 595;
      const page = pdfDoc.addPage([pageWidth, pageHeight]);
      page.drawImage(embeddedImage, {
        x: 0,
        y: 0,
        width: pageWidth,
        height: pageHeight,
      });
    } else {
      // Template is a PDF — load it directly
      pdfDoc = await PDFDocument.load(templateFile.buffer);
    }

    // Embed standard fonts
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

    const fontMap = {
      Helvetica: helvetica,
      "Helvetica-Bold": helveticaBold,
      "Times-Roman": timesRoman,
      "Times-Roman-Bold": timesRomanBold,
      // Custom fonts loaded separately
    };

    // Load custom fonts
    for (const customFont of template.customFonts || []) {
      try {
        const fontBytes = await this._resolveAssetBuffer(customFont);
        if (fontBytes) {
          fontMap[customFont.name] = await pdfDoc.embedFont(fontBytes);
        }
      } catch (err) {
        logger.warn(
          `Failed to load custom font ${customFont.name}:`,
          err.message,
        );
      }
    }

    // Build placeholder data
    const dateValue =
      recipientData.date ||
      new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

    const placeholders = {
      // Standard placeholders
      "{{name}}": recipientData.name,
      "{{date}}": dateValue,
      "{{event}}": recipientData.event || "",
      "{{certificateId}}": certId,
      "{{email}}": recipientData.email || "",

      // Common aliases (template editor defaults to {{field_name}})
      "{{field_name}}": recipientData.name,
      "{{field_date}}": dateValue,
      "{{field_event}}": recipientData.event || "",
      "{{field_email}}": recipientData.email || "",
      "{{field_id}}": certId,
      "{{recipient_name}}": recipientData.name,
      "{{recipient_email}}": recipientData.email || "",

      // Custom fields from recipient data
      ...Object.fromEntries(
        Object.entries(recipientData.customFields || {}).map(([k, v]) => [
          `{{${k}}}`,
          v,
        ]),
      ),
    };

    // Process each text field
    for (const field of template.fields || []) {
      const pageIndex = (field.page || 1) - 1;
      if (pageIndex >= pdfDoc.getPageCount()) continue;

      const page = pdfDoc.getPage(pageIndex);
      const { width: pageWidth, height: pageHeight } = page.getSize();

      // Determine text content
      let text = "";
      if (field.type === "placeholder" && field.placeholder) {
        text = placeholders[field.placeholder] || field.placeholder;
      } else if (field.type === "static") {
        text = field.text || "";
      }

      // Replace any remaining placeholders in static text too
      for (const [key, value] of Object.entries(placeholders)) {
        text = text.replace(
          new RegExp(key.replace(/[{}]/g, "\\$&"), "g"),
          value,
        );
      }

      if (!text) continue;

      // Select font
      let font = fontMap[field.fontFamily] || helvetica;
      if (field.fontWeight === "bold") {
        if (field.fontFamily === "Helvetica" || !field.fontFamily) {
          font = helveticaBold;
        } else if (field.fontFamily === "Times-Roman") {
          font = timesRomanBold;
        }
      }

      // Calculate font size (with auto-scaling)
      let fontSize = field.fontSize || 24;
      if (field.autoScale) {
        const maxWidth = (field.width / 100) * pageWidth;
        const textWidth = font.widthOfTextAtSize(text, fontSize);
        if (textWidth > maxWidth && maxWidth > 0) {
          fontSize = Math.max(
            field.minFontSize || 12,
            Math.floor(fontSize * (maxWidth / textWidth)),
          );
        }
      }

      // Calculate position (convert percentage to absolute)
      const x = (field.x / 100) * pageWidth;
      const y = pageHeight - (field.y / 100) * pageHeight; // PDF Y is bottom-up

      // Parse color
      const color = this._hexToRgb(field.fontColor || "#000000");

      // Draw text
      const textWidth = font.widthOfTextAtSize(text, fontSize);
      let drawX = x;
      if (field.alignment === "center") {
        drawX = x - textWidth / 2;
      } else if (field.alignment === "right") {
        drawX = x - textWidth;
      }

      page.drawText(text, {
        x: drawX,
        y,
        size: fontSize,
        font,
        color: rgb(color.r, color.g, color.b),
      });
    }

    // Embed QR code
    if (qrCodeBuffer && template.qrCode?.enabled) {
      const qrImage = await pdfDoc.embedPng(qrCodeBuffer);
      const pageIndex = (template.qrCode.page || 1) - 1;
      if (pageIndex < pdfDoc.getPageCount()) {
        const page = pdfDoc.getPage(pageIndex);
        const { width: pageWidth, height: pageHeight } = page.getSize();

        const qrSize = template.qrCode.size || 80;
        const qrX = (template.qrCode.x / 100) * pageWidth - qrSize / 2;
        const qrY =
          pageHeight - (template.qrCode.y / 100) * pageHeight - qrSize / 2;

        page.drawImage(qrImage, {
          x: qrX,
          y: qrY,
          width: qrSize,
          height: qrSize,
        });
      }
    }

    // Embed signature
    if (template.signature?.file || template.signature?.fileId) {
      try {
        const sigBytes = await this._resolveAssetBuffer(template.signature);
        if (!sigBytes) {
          throw new Error("Signature file not found");
        }

        const signatureMime = (template.signature?.mimeType || "").toLowerCase();
        const signatureExt = path
          .extname(template.signature?.file || "")
          .toLowerCase();
        const sigImage =
          signatureMime === "image/jpeg" ||
          signatureExt === ".jpg" ||
          signatureExt === ".jpeg"
            ? await pdfDoc.embedJpg(sigBytes)
            : await pdfDoc.embedPng(sigBytes);
        const pageIndex = (template.signature.page || 1) - 1;

        if (pageIndex < pdfDoc.getPageCount()) {
          const page = pdfDoc.getPage(pageIndex);
          const { width: pageWidth, height: pageHeight } = page.getSize();

          const sigW = template.signature.width || 150;
          const sigH = template.signature.height || 50;
          const sigX = (template.signature.x / 100) * pageWidth - sigW / 2;
          const sigY =
            pageHeight - (template.signature.y / 100) * pageHeight - sigH / 2;

          page.drawImage(sigImage, {
            x: sigX,
            y: sigY,
            width: sigW,
            height: sigH,
          });
        }
      } catch (err) {
        logger.warn("Failed to embed signature:", err.message);
      }
    }

    // Save PDF
    const pdfBytes = await pdfDoc.save();
    const pdfFileId = await gridfsService.uploadBuffer({
      buffer: Buffer.from(pdfBytes),
      filename: `${certId}.pdf`,
      contentType: "application/pdf",
      metadata: {
        adminId: adminId.toString(),
        templateId: template._id.toString(),
        certificateId: certId,
        assetType: "certificate",
      },
    });
    const pdfUrl = gridfsService.buildFileUrl(pdfFileId);

    // Create certificate record in DB
    const certificate = await Certificate.create({
      certificateId: certId,
      admin: adminId,
      template: template._id,
      recipientBatch: batchId,
      recipientName: recipientData.name,
      recipientEmail: recipientData.email,
      eventName: recipientData.event || "",
      issueDate: recipientData.date ? new Date(recipientData.date) : new Date(),
      customData: recipientData.customFields || {},
      pdfPath: pdfUrl,
      pdfFileId,
      pdfSize: pdfBytes.length,
      qrCodeData: verificationUrl,
      status: "generated",
      emailStatus: "pending",
    });

    logger.info(`Certificate generated: ${certId} for ${recipientData.name}`);
    return certificate;
  }

  /**
   * List certificates with pagination and filters
   */
  async list(
    adminId,
    { page = 1, limit = 20, status, emailStatus, search, recipientBatch } = {},
  ) {
    const filter = { admin: adminId };
    if (status) filter.status = status;
    if (emailStatus) filter.emailStatus = emailStatus;
    if (recipientBatch) filter.recipientBatch = recipientBatch;
    if (search) {
      filter.$or = [
        { recipientName: { $regex: search, $options: "i" } },
        { recipientEmail: { $regex: search, $options: "i" } },
        { certificateId: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [certificates, total] = await Promise.all([
      Certificate.find(filter)
        .populate("template", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Certificate.countDocuments(filter),
    ]);

    return {
      certificates,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get certificate by ID
   */
  async getById(certificateId, adminId) {
    const certificate = await Certificate.findOne({
      _id: certificateId,
      admin: adminId,
    }).populate("template", "name");

    if (!certificate) {
      throw AppError.notFound("Certificate");
    }
    return certificate;
  }

  /**
   * Get certificate PDF buffer for download
   */
  async downloadPdf(certificateId, adminId) {
    const certificate = await Certificate.findOne({
      _id: certificateId,
      admin: adminId,
    });

    if (!certificate) {
      throw AppError.notFound("Certificate");
    }

    if (certificate.pdfFileId) {
      const { buffer } = await gridfsService.downloadToBuffer(certificate.pdfFileId);
      return {
        buffer,
        filename: `${certificate.certificateId}.pdf`,
      };
    }

    const legacyFileId = gridfsService.extractFileIdFromUrl(certificate.pdfPath);
    if (legacyFileId) {
      const { buffer } = await gridfsService.downloadToBuffer(legacyFileId);
      return {
        buffer,
        filename: `${certificate.certificateId}.pdf`,
      };
    }

    if (!certificate.pdfPath || !fs.existsSync(certificate.pdfPath)) {
      throw AppError.notFound("Certificate PDF file");
    }

    return {
      buffer: fs.readFileSync(certificate.pdfPath),
      filename: `${certificate.certificateId}.pdf`,
    };
  }

  async _resolveTemplateFile(template) {
    if (template.templateFileId) {
      const { buffer, file } = await gridfsService.downloadToBuffer(
        template.templateFileId,
      );
      return {
        buffer,
        filename: file.filename || template.templateFileName || "template-file",
        contentType: file.contentType || template.templateMimeType || null,
      };
    }

    const fileIdFromUrl = gridfsService.extractFileIdFromUrl(template.pdfFile);
    if (fileIdFromUrl) {
      const { buffer, file } = await gridfsService.downloadToBuffer(fileIdFromUrl);
      return {
        buffer,
        filename: file.filename || template.templateFileName || "template-file",
        contentType: file.contentType || template.templateMimeType || null,
      };
    }

    if (template.pdfFile && fs.existsSync(template.pdfFile)) {
      return {
        buffer: fs.readFileSync(template.pdfFile),
        filename: template.templateFileName || path.basename(template.pdfFile),
        contentType: template.templateMimeType || null,
      };
    }

    throw AppError.notFound("Template file");
  }

  async _resolveAssetBuffer(asset) {
    if (!asset) return null;

    if (asset.fileId) {
      const { buffer } = await gridfsService.downloadToBuffer(asset.fileId);
      return buffer;
    }

    const fileIdFromUrl = gridfsService.extractFileIdFromUrl(asset.file);
    if (fileIdFromUrl) {
      const { buffer } = await gridfsService.downloadToBuffer(fileIdFromUrl);
      return buffer;
    }

    if (asset.file && fs.existsSync(asset.file)) {
      return fs.readFileSync(asset.file);
    }

    return null;
  }

  /**
   * Delete a certificate and its generated PDF asset
   */
  async delete(certificateId, adminId) {
    const certificate = await Certificate.findOne({
      _id: certificateId,
      admin: adminId,
    });

    if (!certificate) {
      throw AppError.notFound("Certificate");
    }

    const fileIdFromPath = gridfsService.extractFileIdFromUrl(certificate.pdfPath);
    const fileId = certificate.pdfFileId || fileIdFromPath;

    if (fileId) {
      try {
        await gridfsService.deleteFile(fileId);
      } catch (error) {
        logger.warn(
          `Unable to delete certificate file ${fileId} for ${certificate.certificateId}: ${error.message}`,
        );
      }
    }

    if (certificate.pdfPath && fs.existsSync(certificate.pdfPath)) {
      try {
        fs.unlinkSync(certificate.pdfPath);
      } catch (error) {
        logger.warn(
          `Unable to delete certificate PDF path ${certificate.pdfPath}: ${error.message}`,
        );
      }
    }

    await certificate.deleteOne();

    await ActivityLog.create({
      admin: adminId,
      action: "delete_certificate",
      resource: "certificate",
      resourceId: certificate._id,
      details: `Deleted certificate ${certificate.certificateId}`,
    });

    return {
      deleted: true,
      certificateId: certificate.certificateId,
      id: certificate._id,
    };
  }

  /**
   * Revoke a certificate
   */
  async revoke(certificateId, adminId, reason) {
    const certificate = await Certificate.findOneAndUpdate(
      { _id: certificateId, admin: adminId },
      {
        isRevoked: true,
        revokedAt: new Date(),
        revokedReason: reason,
        status: "revoked",
      },
      { new: true },
    );

    if (!certificate) {
      throw AppError.notFound("Certificate");
    }

    await ActivityLog.create({
      admin: adminId,
      action: "revoke_certificate",
      resource: "certificate",
      resourceId: certificate._id,
      details: `Revoked certificate ${certificate.certificateId}: ${reason}`,
    });

    return certificate;
  }

  /**
   * Public verification
   */
  async verify(certificateId) {
    const certificate = await Certificate.findOne({ certificateId });

    if (!certificate) {
      return { valid: false, message: "Certificate not found" };
    }

    // Increment verification count
    certificate.verificationCount += 1;
    certificate.lastVerifiedAt = new Date();
    await certificate.save();

    return {
      valid: !certificate.isRevoked,
      certificate: {
        certificateId: certificate.certificateId,
        recipientName: certificate.recipientName,
        eventName: certificate.eventName,
        issueDate: certificate.issueDate,
        isRevoked: certificate.isRevoked,
        revokedReason: certificate.isRevoked
          ? certificate.revokedReason
          : undefined,
      },
    };
  }

  /**
   * Convert hex color to RGB (0-1 range for pdf-lib)
   */
  _hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16) / 255,
          g: parseInt(result[2], 16) / 255,
          b: parseInt(result[3], 16) / 255,
        }
      : { r: 0, g: 0, b: 0 };
  }
}

module.exports = new CertificateService();
