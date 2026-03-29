const express = require("express");
const router = express.Router();
const emailController = require("../controllers/email.controller");
const authenticate = require("../middleware/auth.middleware");
const authorize = require("../middleware/role.middleware");
const validate = require("../middleware/validate.middleware");
const { emailLimiter } = require("../middleware/rateLimiter.middleware");
const {
  sendEmailSchema,
  sendBatchSchema,
  sendByBatchSchema,
  retryEmailsSchema,
  createEmailTemplateSchema,
  updateEmailTemplateSchema,
} = require("../validators/email.validator");

// All routes require authentication
router.use(authenticate);
router.use(authorize("super_admin", "admin"));

// Email sending
router.post(
  "/send",
  emailLimiter,
  validate(sendEmailSchema),
  emailController.sendSingle,
);
router.post(
  "/send-batch",
  emailLimiter,
  validate(sendBatchSchema),
  emailController.sendBatch,
);
router.post(
  "/send-by-batch",
  emailLimiter,
  validate(sendByBatchSchema),
  emailController.sendByBatch,
);
router.post("/retry", validate(retryEmailsSchema), emailController.retry);
router.post("/retry-all", emailController.retryAll);
router.post("/test", emailLimiter, emailController.testSend);

// Email logs
router.get("/logs", emailController.getLogs);
router.delete("/logs", emailController.deleteLogs);
router.get("/logs/:id", emailController.getLogById);
router.delete("/logs/:id", emailController.deleteLogById);

// Email templates
router.get("/templates", emailController.listEmailTemplates);
router.get("/templates/:id", emailController.getEmailTemplate);
router.get("/templates/:id/preview", emailController.previewEmailTemplate);
router.post(
  "/templates",
  validate(createEmailTemplateSchema),
  emailController.createEmailTemplate,
);
router.put(
  "/templates/:id",
  validate(updateEmailTemplateSchema),
  emailController.updateEmailTemplate,
);
router.delete("/templates/:id", emailController.deleteEmailTemplate);

module.exports = router;
