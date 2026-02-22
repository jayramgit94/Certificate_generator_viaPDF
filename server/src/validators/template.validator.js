const { z } = require("zod");

const textFieldSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["placeholder", "static"]),
  placeholder: z.string().nullable().optional(),
  text: z.string().optional().default(""),
  page: z.number().int().min(1).optional().default(1),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  width: z.number().min(10).optional().default(200),
  height: z.number().min(10).optional().default(50),
  fontFamily: z.string().optional().default("Helvetica"),
  fontSize: z.number().min(6).max(200).optional().default(24),
  fontColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Invalid hex color")
    .optional()
    .default("#000000"),
  fontWeight: z.enum(["normal", "bold"]).optional().default("normal"),
  fontStyle: z.enum(["normal", "italic"]).optional().default("normal"),
  alignment: z.enum(["left", "center", "right"]).optional().default("center"),
  autoScale: z.boolean().optional().default(true),
  maxFontSize: z.number().min(6).optional().default(48),
  minFontSize: z.number().min(6).optional().default(12),
  zIndex: z.number().int().optional().default(1),
});

const signatureSchema = z
  .object({
    file: z.string().optional(),
    page: z.number().int().min(1).optional().default(1),
    x: z.number().min(0).max(100).optional().default(50),
    y: z.number().min(0).max(100).optional().default(80),
    width: z.number().min(10).optional().default(150),
    height: z.number().min(10).optional().default(50),
    zIndex: z.number().int().optional().default(10),
  })
  .nullable()
  .optional();

const qrCodeSchema = z
  .object({
    enabled: z.boolean().optional().default(true),
    page: z.number().int().min(1).optional().default(1),
    x: z.number().min(0).max(100).optional().default(85),
    y: z.number().min(0).max(100).optional().default(85),
    size: z.number().min(20).max(300).optional().default(80),
    zIndex: z.number().int().optional().default(10),
  })
  .optional();

const createTemplateSchema = z.object({
  name: z
    .string({ required_error: "Template name is required" })
    .trim()
    .min(1, "Template name is required")
    .max(200, "Template name cannot exceed 200 characters"),
  description: z.string().max(500).optional().default(""),
  category: z
    .enum([
      "course",
      "achievement",
      "participation",
      "award",
      "training",
      "other",
    ])
    .optional()
    .default("course"),
  isDefault: z.boolean().optional().default(false),
  fields: z.array(textFieldSchema).optional().default([]),
  signature: signatureSchema,
  qrCode: qrCodeSchema,
  status: z.enum(["draft", "active", "archived"]).optional().default("draft"),
});

const updateTemplateSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  description: z.string().max(500).optional(),
  category: z
    .enum([
      "course",
      "achievement",
      "participation",
      "award",
      "training",
      "other",
    ])
    .optional(),
  backgroundColor: z.string().max(20).optional(),
  isDefault: z.boolean().optional(),
  fields: z.array(textFieldSchema).optional(),
  signature: signatureSchema,
  qrCode: qrCodeSchema,
  status: z.enum(["draft", "active", "archived"]).optional(),
});

module.exports = {
  createTemplateSchema,
  updateTemplateSchema,
  textFieldSchema,
};
