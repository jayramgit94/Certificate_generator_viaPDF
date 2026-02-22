const { z } = require("zod");

const generateCertificateSchema = z.object({
  templateId: z.string({ required_error: "Template ID is required" }).min(1),
  recipientData: z.object({
    name: z.string({ required_error: "Name is required" }).trim().min(1),
    email: z
      .string({ required_error: "Email is required" })
      .trim()
      .email()
      .toLowerCase(),
    event: z.string().trim().optional().default(""),
    date: z.string().trim().optional().default(""),
    customFields: z.record(z.string()).optional().default({}),
  }),
});

const generateBatchSchema = z.object({
  templateId: z.string({ required_error: "Template ID is required" }).min(1),
  batchId: z.string({ required_error: "Batch ID is required" }).min(1),
});

const revokeCertificateSchema = z.object({
  reason: z
    .string({ required_error: "Revocation reason is required" })
    .trim()
    .min(1, "Reason is required")
    .max(500),
});

module.exports = {
  generateCertificateSchema,
  generateBatchSchema,
  revokeCertificateSchema,
};
