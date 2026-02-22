const fs = require("fs");
const path = require("path");
const { PDFDocument } = require("pdf-lib");
const Template = require("../models/Template");
const ActivityLog = require("../models/ActivityLog");
const AppError = require("../utils/AppError");
const logger = require("../utils/logger");

class TemplateService {
  /**
   * List all templates for an admin
   */
  async list(adminId, { page = 1, limit = 20, status, search, role } = {}) {
    const filter = {};
    // super_admin can see all templates
    if (role !== "super_admin") {
      filter.admin = adminId;
    }

    // Exclude archived by default unless explicitly requested
    if (status) {
      filter.status = status;
    } else {
      filter.status = { $ne: "archived" };
    }

    // Text search on name and description
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      filter.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { category: searchRegex },
      ];
    }

    const skip = (page - 1) * limit;

    const [templates, total] = await Promise.all([
      Template.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Template.countDocuments(filter),
    ]);

    return {
      templates,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get a single template by ID
   */
  async getById(templateId, adminId, role) {
    let filter = { _id: templateId };
    // super_admin can see any template; regular admin only sees their own
    if (role !== "super_admin") {
      filter.admin = adminId;
    }
    const template = await Template.findOne(filter);
    if (!template) {
      throw AppError.notFound("Template");
    }
    return template;
  }

  /**
   * Create a new template with uploaded PDF or image
   */
  async create(adminId, data, templateFile) {
    if (!templateFile) {
      throw AppError.badRequest("Template file (PDF or image) is required");
    }

    const ext = path.extname(templateFile.originalname).toLowerCase();
    const isImage = [".png", ".jpg", ".jpeg", ".webp"].includes(ext);

    let pdfPages = 1;
    let fileType = "pdf";

    if (isImage) {
      fileType = "image";
      pdfPages = 1;
    } else {
      // Read PDF to get page count
      try {
        const pdfBytes = fs.readFileSync(templateFile.path);
        const pdfDoc = await PDFDocument.load(pdfBytes);
        pdfPages = pdfDoc.getPageCount();
      } catch (error) {
        logger.error("Failed to read PDF:", error);
        throw AppError.badRequest("Invalid PDF file");
      }
    }

    const template = await Template.create({
      admin: adminId,
      ...data,
      pdfFile: templateFile.path,
      pdfPages,
      fileType,
    });

    await ActivityLog.create({
      admin: adminId,
      action: "create_template",
      resource: "template",
      resourceId: template._id,
      details: `Created template: ${template.name}`,
    });

    logger.info(`Template created: ${template.name} by admin ${adminId}`);
    return template;
  }

  /**
   * Update template configuration
   */
  async update(templateId, adminId, updates, role) {
    const filter = { _id: templateId };
    // Only scope to own templates for non-super_admin
    if (role !== "super_admin") {
      filter.admin = adminId;
    }

    const template = await Template.findOneAndUpdate(filter, updates, {
      new: true,
      runValidators: true,
    });

    if (!template) {
      throw AppError.notFound("Template");
    }

    await ActivityLog.create({
      admin: adminId,
      action: "update_template",
      resource: "template",
      resourceId: template._id,
      details: `Updated template: ${template.name}`,
    });

    return template;
  }

  /**
   * Delete template (archives it)
   */
  async delete(templateId, adminId, role) {
    const filter = { _id: templateId };
    if (role !== "super_admin") {
      filter.admin = adminId;
    }

    const template = await Template.findOneAndUpdate(
      filter,
      { status: "archived" },
      { new: true },
    );

    if (!template) {
      throw AppError.notFound("Template");
    }

    await ActivityLog.create({
      admin: adminId,
      action: "delete_template",
      resource: "template",
      resourceId: template._id,
      details: `Archived template: ${template.name}`,
    });

    return template;
  }

  /**
   * Duplicate a template
   */
  async duplicate(templateId, adminId, role) {
    const filter = { _id: templateId };
    if (role !== "super_admin") {
      filter.admin = adminId;
    }
    const original = await Template.findOne(filter);
    if (!original) {
      throw AppError.notFound("Template");
    }

    // Copy PDF file
    const ext = path.extname(original.pdfFile);
    const newPdfPath = original.pdfFile.replace(
      path.basename(original.pdfFile),
      `${Date.now()}-copy${ext}`,
    );

    try {
      fs.copyFileSync(original.pdfFile, newPdfPath);
    } catch (error) {
      logger.error("Failed to copy PDF file:", error);
      throw AppError.internal("Failed to duplicate template file");
    }

    const duplicateData = original.toObject();
    delete duplicateData._id;
    delete duplicateData.createdAt;
    delete duplicateData.updatedAt;

    const duplicate = await Template.create({
      ...duplicateData,
      name: `${original.name} (Copy)`,
      pdfFile: newPdfPath,
      isDefault: false,
      status: "draft",
    });

    logger.info(`Template duplicated: ${original.name} → ${duplicate.name}`);
    return duplicate;
  }

  /**
   * Set template as default
   */
  async setDefault(templateId, adminId, role) {
    // Determine the owner of the target template for scoping defaults
    const filter = { _id: templateId };
    if (role !== "super_admin") {
      filter.admin = adminId;
    }

    const target = await Template.findOne(filter);
    if (!target) {
      throw AppError.notFound("Template");
    }

    // Unset current default for the template's owner
    await Template.updateMany(
      { admin: target.admin, _id: { $ne: target._id } },
      { isDefault: false },
    );

    target.isDefault = true;
    await target.save();

    return target;
  }

  /**
   * Upload custom font
   */
  async uploadFont(templateId, adminId, fontFile) {
    if (!fontFile) {
      throw AppError.badRequest("Font file is required");
    }

    const template = await Template.findOne({
      _id: templateId,
      admin: adminId,
    });
    if (!template) {
      throw AppError.notFound("Template");
    }

    const fontName = path.basename(
      fontFile.originalname,
      path.extname(fontFile.originalname),
    );

    template.customFonts.push({
      name: fontName,
      file: fontFile.path,
    });

    await template.save();
    return template;
  }

  /**
   * Upload signature image
   */
  async uploadSignature(templateId, adminId, signatureFile) {
    if (!signatureFile) {
      throw AppError.badRequest("Signature image is required");
    }

    const template = await Template.findOne({
      _id: templateId,
      admin: adminId,
    });
    if (!template) {
      throw AppError.notFound("Template");
    }

    template.signature = {
      file: signatureFile.path,
      page: template.signature?.page || 1,
      x: template.signature?.x || 50,
      y: template.signature?.y || 80,
      width: template.signature?.width || 150,
      height: template.signature?.height || 50,
      zIndex: template.signature?.zIndex || 10,
    };

    await template.save();
    return template;
  }

  /**
   * Upload background image for template
   */
  async uploadBackground(templateId, adminId, imageFile) {
    if (!imageFile) {
      throw AppError.badRequest("Image file is required");
    }

    const template = await Template.findOne({
      _id: templateId,
      admin: adminId,
    });
    if (!template) {
      throw AppError.notFound("Template");
    }

    // Build URL path for the uploaded file
    const relativePath = imageFile.path
      .replace(/\\/g, "/")
      .split("/uploads/")
      .pop();
    template.backgroundImage = `/uploads/${relativePath}`;

    await template.save();
    logger.info(`Background image uploaded for template: ${template.name}`);
    return template;
  }
}

module.exports = new TemplateService();
