const fs = require("fs");
const path = require("path");
const { PDFDocument } = require("pdf-lib");
const Template = require("../models/Template");
const ActivityLog = require("../models/ActivityLog");
const AppError = require("../utils/AppError");
const logger = require("../utils/logger");
const gridfsService = require("./gridfs.service");
const quotaService = require("./quota.service");

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

    await quotaService.ensureTemplateLimit(adminId);

    const fileBuffer = this._extractUploadBuffer(templateFile);

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
        const pdfDoc = await PDFDocument.load(fileBuffer);
        pdfPages = pdfDoc.getPageCount();
      } catch (error) {
        logger.error("Failed to read PDF:", error);
        throw AppError.badRequest("Invalid PDF file");
      }
    }

    const templateFileId = await gridfsService.uploadBuffer({
      buffer: fileBuffer,
      filename: templateFile.originalname || `template-${Date.now()}${ext}`,
      contentType: templateFile.mimetype || this._guessMimeType(ext),
      metadata: {
        adminId: adminId.toString(),
        assetType: "template",
        fileType,
      },
    });
    const templateFileUrl = gridfsService.buildFileUrl(templateFileId);

    const template = await Template.create({
      admin: adminId,
      ...data,
      pdfFile: templateFileUrl,
      templateFileId,
      templateFileName: templateFile.originalname,
      templateMimeType: templateFile.mimetype || this._guessMimeType(ext),
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

    await quotaService.ensureTemplateLimit(original.admin || adminId);

    let originalBuffer;
    let originalFilename;
    let originalContentType;

    try {
      const source = await this._resolveTemplateFile(original);
      originalBuffer = source.buffer;
      originalFilename = source.filename;
      originalContentType = source.contentType;
    } catch (error) {
      logger.error("Failed to read template file for duplication:", error);
      throw AppError.internal("Failed to duplicate template file");
    }

    const originalExt =
      path.extname(originalFilename || "") ||
      path.extname(original.templateFileName || "") ||
      (original.fileType === "image" ? ".png" : ".pdf");
    const duplicateFilename = `${Date.now()}-copy${originalExt}`;

    const newTemplateFileId = await gridfsService.uploadBuffer({
      buffer: originalBuffer,
      filename: duplicateFilename,
      contentType:
        originalContentType ||
        original.templateMimeType ||
        this._guessMimeType(originalExt),
      metadata: {
        adminId: adminId.toString(),
        assetType: "template",
        fileType: original.fileType,
      },
    });
    const newTemplateFileUrl = gridfsService.buildFileUrl(newTemplateFileId);

    const duplicateData = original.toObject();
    delete duplicateData._id;
    delete duplicateData.createdAt;
    delete duplicateData.updatedAt;

    const duplicate = await Template.create({
      ...duplicateData,
      name: `${original.name} (Copy)`,
      pdfFile: newTemplateFileUrl,
      templateFileId: newTemplateFileId,
      templateFileName: duplicateFilename,
      templateMimeType:
        originalContentType || original.templateMimeType || null,
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
    const fontBuffer = this._extractUploadBuffer(fontFile);
    const fontFileId = await gridfsService.uploadBuffer({
      buffer: fontBuffer,
      filename: fontFile.originalname,
      contentType: fontFile.mimetype || this._guessMimeType(fontFile.originalname),
      metadata: {
        adminId: adminId.toString(),
        assetType: "font",
        templateId: template._id.toString(),
      },
    });

    template.customFonts.push({
      name: fontName,
      fileId: fontFileId,
      file: gridfsService.buildFileUrl(fontFileId),
      mimeType: fontFile.mimetype || null,
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

    const signatureBuffer = this._extractUploadBuffer(signatureFile);
    const signatureFileId = await gridfsService.uploadBuffer({
      buffer: signatureBuffer,
      filename: signatureFile.originalname,
      contentType:
        signatureFile.mimetype || this._guessMimeType(signatureFile.originalname),
      metadata: {
        adminId: adminId.toString(),
        assetType: "signature",
        templateId: template._id.toString(),
      },
    });

    template.signature = {
      fileId: signatureFileId,
      file: gridfsService.buildFileUrl(signatureFileId),
      mimeType: signatureFile.mimetype || null,
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

    const backgroundBuffer = this._extractUploadBuffer(imageFile);
    const backgroundFileId = await gridfsService.uploadBuffer({
      buffer: backgroundBuffer,
      filename: imageFile.originalname,
      contentType: imageFile.mimetype || this._guessMimeType(imageFile.originalname),
      metadata: {
        adminId: adminId.toString(),
        assetType: "background",
        templateId: template._id.toString(),
      },
    });

    template.backgroundImageFileId = backgroundFileId;
    template.backgroundImage = gridfsService.buildFileUrl(backgroundFileId);

    await template.save();
    logger.info(`Background image uploaded for template: ${template.name}`);
    return template;
  }

  _extractUploadBuffer(uploadedFile) {
    if (uploadedFile?.buffer && Buffer.isBuffer(uploadedFile.buffer)) {
      return uploadedFile.buffer;
    }

    if (uploadedFile?.path && fs.existsSync(uploadedFile.path)) {
      return fs.readFileSync(uploadedFile.path);
    }

    throw AppError.badRequest("Uploaded file content is missing");
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
        filename:
          template.templateFileName || path.basename(template.pdfFile) || "template-file",
        contentType:
          template.templateMimeType ||
          this._guessMimeType(path.extname(template.pdfFile).toLowerCase()),
      };
    }

    throw AppError.notFound("Template file");
  }

  _guessMimeType(input) {
    const ext = (input || "").startsWith(".")
      ? (input || "").toLowerCase()
      : path.extname(input || "").toLowerCase();
    if (ext === ".pdf") return "application/pdf";
    if (ext === ".png") return "image/png";
    if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
    if (ext === ".webp") return "image/webp";
    if (ext === ".ttf") return "font/ttf";
    if (ext === ".otf") return "font/otf";
    if (ext === ".woff") return "font/woff";
    if (ext === ".woff2") return "font/woff2";
    return "application/octet-stream";
  }
}

module.exports = new TemplateService();
