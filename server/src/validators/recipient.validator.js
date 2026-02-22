const { z } = require("zod");

const manualRecipientSchema = z.object({
  name: z
    .string({ required_error: "Name is required" })
    .trim()
    .min(1, "Name is required")
    .max(200, "Name cannot exceed 200 characters"),
  email: z
    .string({ required_error: "Email is required" })
    .trim()
    .email("Invalid email format")
    .toLowerCase(),
  event: z.string().trim().optional().default(""),
  date: z.string().trim().optional().default(""),
  customFields: z.record(z.string()).optional().default({}),
});

const updateRecordSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  email: z
    .string()
    .trim()
    .email("Invalid email format")
    .toLowerCase()
    .optional(),
  event: z.string().trim().optional(),
  date: z.string().trim().optional(),
  customFields: z.record(z.string()).optional(),
});

const batchNameSchema = z.object({
  batchName: z
    .string()
    .trim()
    .max(200, "Batch name cannot exceed 200 characters")
    .optional(),
});

module.exports = {
  manualRecipientSchema,
  updateRecordSchema,
  batchNameSchema,
};
