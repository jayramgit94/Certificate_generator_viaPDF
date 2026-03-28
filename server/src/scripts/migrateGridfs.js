const fs = require("fs");
const path = require("path");
const connectDB = require("../config/db");
const logger = require("../utils/logger");
const Template = require("../models/Template");
const Certificate = require("../models/Certificate");
const gridfsService = require("../services/gridfs.service");

const serverRoot = path.join(__dirname, "..", "..");

const guessMimeType = (input) => {
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
};

const resolveLegacyPath = (fileValue) => {
  if (!fileValue || typeof fileValue !== "string") return null;

  if (fs.existsSync(fileValue)) {
    return fileValue;
  }

  if (fileValue.startsWith("/uploads/")) {
    const absolutePath = path.join(serverRoot, fileValue.replace(/^\//, ""));
    if (fs.existsSync(absolutePath)) {
      return absolutePath;
    }
  }

  const relativePath = path.join(serverRoot, fileValue);
  if (fs.existsSync(relativePath)) {
    return relativePath;
  }

  return null;
};

const uploadFileToGridfs = async ({
  absolutePath,
  filename,
  contentType,
  metadata,
}) => {
  const buffer = fs.readFileSync(absolutePath);
  const fileId = await gridfsService.uploadBuffer({
    buffer,
    filename,
    contentType,
    metadata,
  });
  return {
    fileId,
    url: gridfsService.buildFileUrl(fileId),
  };
};

const migrateTemplates = async () => {
  const stats = {
    scanned: 0,
    updated: 0,
    templateFiles: 0,
    backgrounds: 0,
    signatures: 0,
    fonts: 0,
  };

  const cursor = Template.find({}).cursor();

  for await (const template of cursor) {
    stats.scanned += 1;
    let changed = false;

    if (!template.templateFileId && template.pdfFile) {
      const existingId = gridfsService.extractFileIdFromUrl(template.pdfFile);
      if (existingId) {
        template.templateFileId = existingId;
        changed = true;
      } else {
        const absolutePath = resolveLegacyPath(template.pdfFile);
        if (absolutePath) {
          const uploaded = await uploadFileToGridfs({
            absolutePath,
            filename: template.templateFileName || path.basename(absolutePath),
            contentType:
              template.templateMimeType || guessMimeType(path.basename(absolutePath)),
            metadata: {
              adminId: template.admin?.toString(),
              templateId: template._id.toString(),
              assetType: "template",
              fileType: template.fileType || "pdf",
            },
          });

          template.templateFileId = uploaded.fileId;
          template.templateFileName = template.templateFileName || path.basename(absolutePath);
          template.templateMimeType =
            template.templateMimeType || guessMimeType(path.basename(absolutePath));
          template.pdfFile = uploaded.url;
          stats.templateFiles += 1;
          changed = true;
        }
      }
    }

    if (!template.backgroundImageFileId && template.backgroundImage) {
      const existingId = gridfsService.extractFileIdFromUrl(template.backgroundImage);
      if (existingId) {
        template.backgroundImageFileId = existingId;
        changed = true;
      } else {
        const absolutePath = resolveLegacyPath(template.backgroundImage);
        if (absolutePath) {
          const uploaded = await uploadFileToGridfs({
            absolutePath,
            filename: path.basename(absolutePath),
            contentType: guessMimeType(path.basename(absolutePath)),
            metadata: {
              adminId: template.admin?.toString(),
              templateId: template._id.toString(),
              assetType: "background",
            },
          });

          template.backgroundImageFileId = uploaded.fileId;
          template.backgroundImage = uploaded.url;
          stats.backgrounds += 1;
          changed = true;
        }
      }
    }

    if (template.signature) {
      if (!template.signature.fileId && template.signature.file) {
        const existingId = gridfsService.extractFileIdFromUrl(template.signature.file);
        if (existingId) {
          template.signature.fileId = existingId;
          changed = true;
        } else {
          const absolutePath = resolveLegacyPath(template.signature.file);
          if (absolutePath) {
            const uploaded = await uploadFileToGridfs({
              absolutePath,
              filename: path.basename(absolutePath),
              contentType:
                template.signature.mimeType || guessMimeType(path.basename(absolutePath)),
              metadata: {
                adminId: template.admin?.toString(),
                templateId: template._id.toString(),
                assetType: "signature",
              },
            });

            template.signature.fileId = uploaded.fileId;
            template.signature.file = uploaded.url;
            template.signature.mimeType =
              template.signature.mimeType || guessMimeType(path.basename(absolutePath));
            stats.signatures += 1;
            changed = true;
          }
        }
      }
    }

    if (Array.isArray(template.customFonts) && template.customFonts.length > 0) {
      for (const font of template.customFonts) {
        if (font.fileId || !font.file) continue;

        const existingId = gridfsService.extractFileIdFromUrl(font.file);
        if (existingId) {
          font.fileId = existingId;
          changed = true;
          continue;
        }

        const absolutePath = resolveLegacyPath(font.file);
        if (!absolutePath) continue;

        const uploaded = await uploadFileToGridfs({
          absolutePath,
          filename: path.basename(absolutePath),
          contentType: font.mimeType || guessMimeType(path.basename(absolutePath)),
          metadata: {
            adminId: template.admin?.toString(),
            templateId: template._id.toString(),
            assetType: "font",
          },
        });

        font.fileId = uploaded.fileId;
        font.file = uploaded.url;
        font.mimeType = font.mimeType || guessMimeType(path.basename(absolutePath));
        stats.fonts += 1;
        changed = true;
      }

      if (changed) {
        template.markModified("customFonts");
        template.markModified("signature");
      }
    }

    if (changed) {
      await template.save();
      stats.updated += 1;
    }
  }

  return stats;
};

const migrateCertificates = async () => {
  const stats = {
    scanned: 0,
    updated: 0,
    pdfs: 0,
  };

  const cursor = Certificate.find({}).cursor();

  for await (const certificate of cursor) {
    stats.scanned += 1;
    let changed = false;

    if (!certificate.pdfFileId && certificate.pdfPath) {
      const existingId = gridfsService.extractFileIdFromUrl(certificate.pdfPath);
      if (existingId) {
        certificate.pdfFileId = existingId;
        changed = true;
      } else {
        const absolutePath = resolveLegacyPath(certificate.pdfPath);
        if (absolutePath) {
          const uploaded = await uploadFileToGridfs({
            absolutePath,
            filename:
              `${certificate.certificateId || certificate._id.toString()}.pdf`,
            contentType: "application/pdf",
            metadata: {
              adminId: certificate.admin?.toString(),
              certificateId: certificate.certificateId,
              assetType: "certificate",
            },
          });

          certificate.pdfFileId = uploaded.fileId;
          certificate.pdfPath = uploaded.url;
          stats.pdfs += 1;
          changed = true;
        }
      }
    }

    if (changed) {
      await certificate.save();
      stats.updated += 1;
    }
  }

  return stats;
};

const main = async () => {
  try {
    await connectDB();

    const templateStats = await migrateTemplates();
    const certificateStats = await migrateCertificates();

    logger.info("GridFS migration complete", {
      templateStats,
      certificateStats,
    });

    console.log("GridFS migration summary:");
    console.log(JSON.stringify({ templateStats, certificateStats }, null, 2));

    process.exit(0);
  } catch (error) {
    logger.error("GridFS migration failed", error);
    console.error(error);
    process.exit(1);
  }
};

main();
