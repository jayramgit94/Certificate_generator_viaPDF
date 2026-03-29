const fs = require("fs");
const nodemailer = require("nodemailer");
const handlebars = require("handlebars");
const Certificate = require("../models/Certificate");
const EmailLog = require("../models/EmailLog");
const EmailTemplate = require("../models/EmailTemplate");
const ActivityLog = require("../models/ActivityLog");
const { getEmailTransporter } = require("../config/email");
const { generateBatchId } = require("../utils/idGenerator");
const config = require("../config");
const AppError = require("../utils/AppError");
const logger = require("../utils/logger");
const gridfsService = require("./gridfs.service");

class EmailService {
  /**
   * Send email for a single certificate
   */
  async sendSingle(adminId, certificateId, options = {}) {
    const certificate = await Certificate.findOne({
      _id: certificateId,
      admin: adminId,
    });
    if (!certificate) {
      throw AppError.notFound("Certificate");
    }

    const destinationEmail =
      options.overrideRecipientEmail?.trim().toLowerCase() ||
      certificate.recipientEmail;

    const attachment = await this._buildCertificateAttachment(certificate);

    // Get email template
    let subject = options.subject;
    let body = options.body;

    if (options.emailTemplateId) {
      const emailTemplate = await EmailTemplate.findById(
        options.emailTemplateId,
      );
      if (emailTemplate) {
        subject = subject || emailTemplate.subject;
        body = body || emailTemplate.body;
      }
    }

    // Use defaults if not provided
    subject = subject || "Your Certificate - {{name}}";
    body =
      body ||
      `<p>Dear {{name}},</p>
<p>Congratulations! Please find your certificate attached.</p>
<p>Your certificate ID is: <strong>{{certificateId}}</strong></p>
<p>You can verify your certificate at any time using this ID.</p>
<p>Best regards,<br>${config.email.fromName}</p>`;

    // Replace placeholders
    subject = this._replacePlaceholders(subject, certificate);
    body = this._replacePlaceholders(body, certificate);

    // Create email log
    const emailLog = await EmailLog.create({
      admin: adminId,
      certificate: certificate._id,
      recipientEmail: destinationEmail,
      recipientName: certificate.recipientName,
      subject,
      body,
      status: "sending",
      attempt: 1,
    });

    // Send email
    try {
      const result = await this._sendEmail({
        to: destinationEmail,
        toName: certificate.recipientName,
        subject,
        html: body,
        attachments: [attachment],
      });

      // Update email log
      emailLog.status = "sent";
      emailLog.sentAt = new Date();
      emailLog.providerMessageId = result.messageId;
      await emailLog.save();

      // Update certificate
      certificate.emailStatus = "sent";
      certificate.status = "emailed";
      certificate.emailAttempts = 1;
      certificate.lastEmailAttempt = new Date();
      await certificate.save();

      logger.info(
        `Email sent to ${destinationEmail} for cert ${certificate.certificateId}`,
      );

      return { emailLog, success: true };
    } catch (error) {
      const errorMsg =
        error.message ||
        error.response ||
        error.code ||
        JSON.stringify(error) ||
        "Unknown SMTP error";

      // Update email log with error
      emailLog.status = "failed";
      emailLog.error = errorMsg;
      emailLog.errorCode = error.code || "SEND_FAILED";
      await emailLog.save();

      // Update certificate
      certificate.emailStatus = "failed";
      certificate.emailAttempts += 1;
      certificate.lastEmailAttempt = new Date();
      certificate.emailError = errorMsg;
      await certificate.save();

      logger.error(
        `Email failed for ${destinationEmail}: ${errorMsg}`,
      );

      return { emailLog, success: false, error: errorMsg };
    }
  }

  /**
   * Send emails in batch
   */
  async sendBatch(adminId, certificateIds, options = {}) {
    const batchSize = options.batchSize || 10;
    const delayMs = options.delayMs || 2000;
    const batchId = generateBatchId();

    const results = {
      batchId,
      total: certificateIds.length,
      sent: 0,
      failed: 0,
      logs: [],
    };

    // Process in batches
    for (let i = 0; i < certificateIds.length; i += batchSize) {
      const batch = certificateIds.slice(i, i + batchSize);

      for (let j = 0; j < batch.length; j++) {
        const result = await this.sendSingle(adminId, batch[j], {
          emailTemplateId: options.emailTemplateId,
          subject: options.subject,
          body: options.body,
          overrideRecipientEmail: options.overrideRecipientEmail,
        });

        if (result.success) {
          results.sent++;
        } else {
          results.failed++;
        }
        results.logs.push(result.emailLog._id);

        // Update metadata
        await EmailLog.findByIdAndUpdate(result.emailLog._id, {
          metadata: {
            batchId,
            batchIndex: i + j,
            batchSize: certificateIds.length,
            delayMs,
          },
        });
      }

      // Delay between batches (except for last batch)
      if (i + batchSize < certificateIds.length) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    // Log activity
    await ActivityLog.create({
      admin: adminId,
      action: "send_emails",
      details: `Batch email: ${results.sent}/${results.total} sent`,
      metadata: { batchId, ...results },
    });

    logger.info(`Batch email complete: ${results.sent}/${results.total} sent`);
    return results;
  }

  /**
   * Retry failed emails
   */
  async retryFailed(adminId, emailLogIds) {
    const results = {
      total: emailLogIds.length,
      retried: 0,
      failed: 0,
    };

    for (const logId of emailLogIds) {
      const log = await EmailLog.findOne({ _id: logId, admin: adminId });
      if (!log || log.status !== "failed") continue;

      if (log.attempt >= log.maxAttempts) {
        results.failed++;
        continue;
      }

      try {
        // Re-send
        const certificate = await Certificate.findById(log.certificate);
        if (!certificate) {
          results.failed++;
          continue;
        }

        const attachment = await this._buildCertificateAttachment(certificate);

        const sendResult = await this._sendEmail({
          to: log.recipientEmail,
          toName: log.recipientName,
          subject: log.subject,
          html: log.body,
          attachments: [attachment],
        });

        // Update log
        log.status = "sent";
        log.sentAt = new Date();
        log.attempt += 1;
        log.providerMessageId = sendResult.messageId;
        log.error = null;
        await log.save();

        // Update certificate
        certificate.emailStatus = "sent";
        certificate.status = "emailed";
        certificate.emailAttempts += 1;
        certificate.lastEmailAttempt = new Date();
        certificate.emailError = null;
        await certificate.save();

        results.retried++;
      } catch (error) {
        log.attempt += 1;
        log.error = error.message;
        await log.save();
        results.failed++;
      }
    }

    await ActivityLog.create({
      admin: adminId,
      action: "retry_email",
      details: `Retried ${results.retried}/${results.total} emails`,
    });

    return results;
  }

  /**
   * Retry all failed emails
   */
  async retryAllFailed(adminId) {
    const failedLogs = await EmailLog.find({
      admin: adminId,
      status: "failed",
      $expr: { $lt: ["$attempt", "$maxAttempts"] },
    });

    if (failedLogs.length === 0) {
      return { total: 0, retried: 0, failed: 0 };
    }

    return this.retryFailed(
      adminId,
      failedLogs.map((l) => l._id),
    );
  }

  /**
   * Test email sending (simulation mode)
   */
  async testSend(adminId, options = {}) {
    const subject = options.subject || "Test Email from CertiGen";
    const body =
      options.body ||
      "<p>This is a test email. If you received this, email sending works!</p>";

    logger.info(`[TEST MODE] Email would be sent with subject: ${subject}`);

    return {
      success: true,
      message: "Test mode - email simulated successfully",
      subject,
      bodyPreview: body.substring(0, 200),
    };
  }

  /**
   * Get email logs with pagination
   */
  async getLogs(adminId, { page = 1, limit = 20, status, batchId } = {}) {
    const filter = { admin: adminId };
    if (status) filter.status = status;
    if (batchId) filter["metadata.batchId"] = batchId;

    const skip = (page - 1) * limit;

    const [logs, total, statsAgg] = await Promise.all([
      EmailLog.find(filter)
        .populate("certificate", "certificateId recipientName")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      EmailLog.countDocuments(filter),
      EmailLog.aggregate([
        { $match: { admin: adminId } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    // Build stats object from aggregation
    const statsMap = {};
    statsAgg.forEach((s) => {
      statsMap[s._id] = s.count;
    });

    const stats = {
      total: Object.values(statsMap).reduce((a, b) => a + b, 0),
      delivered: (statsMap.delivered || 0) + (statsMap.sent || 0),
      failed: statsMap.failed || 0,
      pending:
        (statsMap.pending || 0) +
        (statsMap.queued || 0) +
        (statsMap.sending || 0),
    };

    return {
      logs,
      stats,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get single email log
   */
  async getLogById(logId, adminId) {
    const log = await EmailLog.findOne({ _id: logId, admin: adminId }).populate(
      "certificate",
      "certificateId recipientName",
    );
    if (!log) {
      throw AppError.notFound("Email log");
    }
    return log;
  }

  async deleteLog(logId, adminId) {
    const log = await EmailLog.findOneAndDelete({ _id: logId, admin: adminId });
    if (!log) {
      throw AppError.notFound("Email log");
    }

    await ActivityLog.create({
      admin: adminId,
      action: "delete_email_log",
      resource: "emailLog",
      resourceId: log._id,
      details: `Deleted email log for ${log.recipientEmail}`,
    });

    return log;
  }

  async deleteLogs(adminId, { status, batchId } = {}) {
    if (!status && !batchId) {
      throw AppError.badRequest(
        "Provide at least one filter (status or batchId) to delete logs",
      );
    }

    const filter = { admin: adminId };
    if (status) filter.status = status;
    if (batchId) filter["metadata.batchId"] = batchId;

    const result = await EmailLog.deleteMany(filter);

    await ActivityLog.create({
      admin: adminId,
      action: "clear_email_logs",
      details: `Cleared ${result.deletedCount || 0} email logs`,
      metadata: {
        status: status || null,
        batchId: batchId || null,
        deletedCount: result.deletedCount || 0,
      },
    });

    return { deletedCount: result.deletedCount || 0 };
  }

  // ===== Email Template CRUD =====

  async listEmailTemplates(adminId) {
    return EmailTemplate.find({ admin: adminId }).sort({ createdAt: -1 });
  }

  async getEmailTemplate(templateId, adminId) {
    const template = await EmailTemplate.findOne({
      _id: templateId,
      admin: adminId,
    });
    if (!template) {
      throw AppError.notFound("Email template");
    }
    return template;
  }

  async createEmailTemplate(adminId, data) {
    const template = await EmailTemplate.create({ admin: adminId, ...data });
    await ActivityLog.create({
      admin: adminId,
      action: "create_email_template",
      resource: "emailTemplate",
      resourceId: template._id,
      details: `Created email template: ${template.name}`,
    });
    return template;
  }

  async updateEmailTemplate(templateId, adminId, updates) {
    const template = await EmailTemplate.findOneAndUpdate(
      { _id: templateId, admin: adminId },
      updates,
      { new: true, runValidators: true },
    );
    if (!template) {
      throw AppError.notFound("Email template");
    }
    return template;
  }

  async deleteEmailTemplate(templateId, adminId) {
    const template = await EmailTemplate.findOneAndDelete({
      _id: templateId,
      admin: adminId,
    });
    if (!template) {
      throw AppError.notFound("Email template");
    }
    await ActivityLog.create({
      admin: adminId,
      action: "delete_email_template",
      resource: "emailTemplate",
      resourceId: templateId,
      details: `Deleted email template: ${template.name}`,
    });
  }

  async previewEmailTemplate(templateId, adminId) {
    const template = await this.getEmailTemplate(templateId, adminId);

    const sampleData = {
      name: "John Doe",
      email: "john@example.com",
      event: "Web Development Workshop",
      date: new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      certificateId: "CERT-2026-SAMPLE",
    };

    let subject = template.subject;
    let body = template.body;

    for (const [key, value] of Object.entries(sampleData)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      subject = subject.replace(regex, value);
      body = body.replace(regex, value);
    }

    return { subject, body };
  }

  // ===== Private Methods =====

  async _buildCertificateAttachment(certificate) {
    const filename = `${certificate.certificateId}.pdf`;

    if (certificate.pdfFileId) {
      const { buffer } = await gridfsService.downloadToBuffer(certificate.pdfFileId);
      return {
        filename,
        content: buffer,
        contentType: "application/pdf",
      };
    }

    const fileIdFromUrl = gridfsService.extractFileIdFromUrl(certificate.pdfPath);
    if (fileIdFromUrl) {
      const { buffer } = await gridfsService.downloadToBuffer(fileIdFromUrl);
      return {
        filename,
        content: buffer,
        contentType: "application/pdf",
      };
    }

    if (certificate.pdfPath && fs.existsSync(certificate.pdfPath)) {
      return {
        filename,
        path: certificate.pdfPath,
        contentType: "application/pdf",
      };
    }

    throw AppError.badRequest(
      "Certificate PDF not found. Generate the certificate first.",
    );
  }

  /**
   * Check if SMTP is properly configured
   */
  _isSmtpConfigured() {
    return (
      config.email.host &&
      config.email.port &&
      config.email.user &&
      config.email.pass &&
      config.email.user !== "your-gmail@gmail.com" &&
      config.email.pass !== "your-16-char-app-password"
    );
  }

  _resolveFromAddress() {
    const configuredFrom = (config.email.fromAddress || "").trim();

    // When not explicitly configured, fall back to authenticated SMTP user.
    if (!configuredFrom || configuredFrom === "noreply@certigen.com") {
      return config.email.user || configuredFrom;
    }

    return configuredFrom;
  }

  /**
   * Send email via Nodemailer (falls back to simulation mode if SMTP not configured)
   */
  async _sendEmail({ to, toName, subject, html, attachments = [] }) {
    // Simulation mode when SMTP credentials are not configured
    if (!this._isSmtpConfigured()) {
      if (config.env === "production") {
        throw AppError.badRequest(
          "SMTP is not configured on the server. Set SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, and EMAIL_FROM_ADDRESS.",
        );
      }

      logger.warn(
        `[SIMULATION MODE] SMTP not configured — simulating email to ${to} | Subject: "${subject}"`,
      );
      logger.info(
        `[SIMULATION MODE] To configure real sending, set SMTP_USER and SMTP_PASS in server/.env`,
      );
      // Return a fake result that matches nodemailer's sendMail response shape
      return {
        messageId: `<sim-${Date.now()}@certigen.local>`,
        accepted: [to],
        rejected: [],
        response: "250 OK (simulated)",
      };
    }

    const transporter = getEmailTransporter();
    const fromAddress = this._resolveFromAddress();

    const mailOptions = {
      from: `"${config.email.fromName}" <${fromAddress}>`,
      to: toName ? `"${toName}" <${to}>` : to,
      subject,
      html,
      attachments,
    };

    const result = await transporter.sendMail(mailOptions);

    // Log preview URL for Ethereal test emails
    if (config.email.host === "smtp.ethereal.email") {
      const previewUrl = nodemailer.getTestMessageUrl(result);
      if (previewUrl) {
        logger.info(`[ETHEREAL] Preview email: ${previewUrl}`);
      }
    }

    return result;
  }

  /**
   * Replace placeholders in text
   */
  _replacePlaceholders(text, certificate) {
    const replacements = {
      "{{name}}": certificate.recipientName,
      "{{email}}": certificate.recipientEmail,
      "{{event}}": certificate.eventName || "",
      "{{date}}":
        certificate.issueDate?.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }) || "",
      "{{certificateId}}": certificate.certificateId,
    };

    // Also add custom data
    if (certificate.customData) {
      for (const [key, value] of certificate.customData.entries
        ? certificate.customData.entries()
        : Object.entries(certificate.customData)) {
        replacements[`{{${key}}}`] = value;
      }
    }

    let result = text;
    for (const [placeholder, value] of Object.entries(replacements)) {
      result = result.replace(
        new RegExp(placeholder.replace(/[{}]/g, "\\$&"), "g"),
        value,
      );
    }
    return result;
  }
}

module.exports = new EmailService();
