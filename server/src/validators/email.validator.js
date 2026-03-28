const { z } = require("zod");

const sendEmailSchema = z.object({
  certificateId: z
    .string({ required_error: "Certificate ID is required" })
    .min(1),
  emailTemplateId: z.string().optional(),
  subject: z.string().optional(),
  body: z.string().optional(),
  overrideRecipientEmail: z.string().email().optional(),
});

const sendBatchSchema = z.object({
  certificateIds: z
    .array(z.string().min(1))
    .min(1, "At least one certificate ID is required"),
  emailTemplateId: z.string().optional(),
  batchSize: z.number().int().min(1).max(50).optional().default(10),
  delayMs: z.number().int().min(0).max(60000).optional().default(2000),
  overrideRecipientEmail: z.string().email().optional(),
});

const sendByBatchSchema = z.object({
  recipientBatchId: z
    .string({ required_error: "Recipient batch ID is required" })
    .min(1),
  emailTemplateId: z.string().optional(),
  subject: z.string().optional(),
  overrideRecipientEmail: z.string().email().optional(),
});

const retryEmailsSchema = z.object({
  emailLogIds: z
    .array(z.string().min(1))
    .min(1, "At least one email log ID is required"),
});

const createEmailTemplateSchema = z.object({
  name: z
    .string({ required_error: "Template name is required" })
    .trim()
    .min(1, "Name is required")
    .max(200),
  subject: z
    .string({ required_error: "Subject is required" })
    .trim()
    .min(1, "Subject is required")
    .max(500),
  body: z
    .string({ required_error: "Body is required" })
    .min(1, "Body is required"),
  isDefault: z.boolean().optional().default(false),
});

const updateEmailTemplateSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  subject: z.string().trim().min(1).max(500).optional(),
  body: z.string().min(1).optional(),
  isDefault: z.boolean().optional(),
});

module.exports = {
  sendEmailSchema,
  sendBatchSchema,
  sendByBatchSchema,
  retryEmailsSchema,
  createEmailTemplateSchema,
  updateEmailTemplateSchema,
};
