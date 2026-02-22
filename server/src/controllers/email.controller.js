const emailService = require("../services/email.service");
const Certificate = require("../models/Certificate");
const asyncHandler = require("../utils/asyncHandler");

/**
 * @desc    Send email for a single certificate
 * @route   POST /api/emails/send
 */
const sendSingle = asyncHandler(async (req, res) => {
  const result = await emailService.sendSingle(
    req.user._id,
    req.body.certificateId,
    {
      emailTemplateId: req.body.emailTemplateId,
      subject: req.body.subject,
      body: req.body.body,
    },
  );

  res.json({
    success: result.success,
    message: result.success ? "Email sent" : `Email failed: ${result.error}`,
    data: result.emailLog,
  });
});

/**
 * @desc    Send emails in batch
 * @route   POST /api/emails/send-batch
 */
const sendBatch = asyncHandler(async (req, res) => {
  const result = await emailService.sendBatch(
    req.user._id,
    req.body.certificateIds,
    {
      emailTemplateId: req.body.emailTemplateId,
      subject: req.body.subject,
      body: req.body.body,
      batchSize: req.body.batchSize,
      delayMs: req.body.delayMs,
    },
  );

  res.json({
    success: true,
    message: `Sent ${result.sent}/${result.total} emails`,
    data: result,
  });
});

/**
 * @desc    Retry specific failed emails
 * @route   POST /api/emails/retry
 */
const retry = asyncHandler(async (req, res) => {
  const result = await emailService.retryFailed(
    req.user._id,
    req.body.emailLogIds,
  );

  res.json({
    success: true,
    message: `Retried ${result.retried}/${result.total} emails`,
    data: result,
  });
});

/**
 * @desc    Retry all failed emails
 * @route   POST /api/emails/retry-all
 */
const retryAll = asyncHandler(async (req, res) => {
  const result = await emailService.retryAllFailed(req.user._id);

  res.json({
    success: true,
    message: `Retried ${result.retried}/${result.total} failed emails`,
    data: result,
  });
});

/**
 * @desc    Send emails for all certificates in a recipient batch
 * @route   POST /api/emails/send-by-batch
 */
const sendByBatch = asyncHandler(async (req, res) => {
  const { recipientBatchId, emailTemplateId, subject } = req.body;

  // Find all certificates for this batch
  const certificates = await Certificate.find({
    admin: req.user._id,
    recipientBatch: recipientBatchId,
    status: { $ne: "revoked" },
  }).select("_id");

  if (certificates.length === 0) {
    return res.status(400).json({
      success: false,
      error: {
        message:
          "No certificates found for this batch. Generate certificates first.",
      },
    });
  }

  const certificateIds = certificates.map((c) => c._id.toString());

  const result = await emailService.sendBatch(req.user._id, certificateIds, {
    emailTemplateId,
    subject,
  });

  res.json({
    success: true,
    message: `Sent ${result.sent}/${result.total} emails`,
    data: result,
  });
});

/**
 * @desc    Test email sending
 * @route   POST /api/emails/test
 */
const testSend = asyncHandler(async (req, res) => {
  const result = await emailService.testSend(req.user._id, req.body);

  res.json({ success: true, data: result });
});

/**
 * @desc    Get email logs
 * @route   GET /api/emails/logs
 */
const getLogs = asyncHandler(async (req, res) => {
  const { page, limit, status, batchId } = req.query;
  const result = await emailService.getLogs(req.user._id, {
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
    status,
    batchId,
  });

  res.json({ success: true, data: result });
});

/**
 * @desc    Get single email log
 * @route   GET /api/emails/logs/:id
 */
const getLogById = asyncHandler(async (req, res) => {
  const log = await emailService.getLogById(req.params.id, req.user._id);

  res.json({ success: true, data: log });
});

// ===== Email Template CRUD =====

/**
 * @desc    List email templates
 * @route   GET /api/emails/templates
 */
const listEmailTemplates = asyncHandler(async (req, res) => {
  const templates = await emailService.listEmailTemplates(req.user._id);

  res.json({ success: true, data: templates });
});

/**
 * @desc    Get single email template
 * @route   GET /api/emails/templates/:id
 */
const getEmailTemplate = asyncHandler(async (req, res) => {
  const template = await emailService.getEmailTemplate(
    req.params.id,
    req.user._id,
  );

  res.json({ success: true, data: template });
});

/**
 * @desc    Create email template
 * @route   POST /api/emails/templates
 */
const createEmailTemplate = asyncHandler(async (req, res) => {
  const template = await emailService.createEmailTemplate(
    req.user._id,
    req.body,
  );

  res.status(201).json({
    success: true,
    message: "Email template created",
    data: template,
  });
});

/**
 * @desc    Update email template
 * @route   PUT /api/emails/templates/:id
 */
const updateEmailTemplate = asyncHandler(async (req, res) => {
  const template = await emailService.updateEmailTemplate(
    req.params.id,
    req.user._id,
    req.body,
  );

  res.json({
    success: true,
    message: "Email template updated",
    data: template,
  });
});

/**
 * @desc    Delete email template
 * @route   DELETE /api/emails/templates/:id
 */
const deleteEmailTemplate = asyncHandler(async (req, res) => {
  await emailService.deleteEmailTemplate(req.params.id, req.user._id);

  res.json({
    success: true,
    message: "Email template deleted",
  });
});

/**
 * @desc    Preview email template with sample data
 * @route   GET /api/emails/templates/:id/preview
 */
const previewEmailTemplate = asyncHandler(async (req, res) => {
  const preview = await emailService.previewEmailTemplate(
    req.params.id,
    req.user._id,
  );

  res.json({ success: true, data: preview });
});

module.exports = {
  sendSingle,
  sendBatch,
  sendByBatch,
  retry,
  retryAll,
  testSend,
  getLogs,
  getLogById,
  listEmailTemplates,
  getEmailTemplate,
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
  previewEmailTemplate,
};
