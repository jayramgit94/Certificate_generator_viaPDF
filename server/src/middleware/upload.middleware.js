const multer = require("multer");
const path = require("path");
const config = require("../config");
const AppError = require("../utils/AppError");

// Memory storage for assets that are persisted to MongoDB GridFS
const memoryStorage = multer.memoryStorage();

// File filter: data files (CSV, XLSX, JSON)
const dataFileFilter = (req, file, cb) => {
  const allowedTypes = [
    "text/csv",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/json",
  ];
  const allowedExts = [".csv", ".xlsx", ".xls", ".json"];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedTypes.includes(file.mimetype) || allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new AppError("Only CSV, XLSX, and JSON files are allowed", 400), false);
  }
};

// File filter: PDF templates and images
const templateFileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = [".pdf", ".png", ".jpg", ".jpeg", ".webp"];
  const allowedTypes = [
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
  ];
  if (allowedExts.includes(ext) || allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        "Only PDF and image files (PNG, JPG, WebP) are allowed",
        400,
      ),
      false,
    );
  }
};

// File filter: font files
const fontFileFilter = (req, file, cb) => {
  const allowedExts = [".ttf", ".otf", ".woff", ".woff2"];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(
      new AppError("Only TTF, OTF, WOFF, WOFF2 font files are allowed", 400),
      false,
    );
  }
};

// File filter: images (signatures, etc.)
const imageFileFilter = (req, file, cb) => {
  const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError("Only PNG, JPEG, and WebP images are allowed", 400), false);
  }
};

// Upload middleware: data files (CSV/XLSX/JSON)
const uploadData = multer({
  storage: memoryStorage,
  fileFilter: dataFileFilter,
  limits: { fileSize: config.upload.maxFileSize },
});

// Upload middleware: PDF/image templates
const uploadTemplate = multer({
  storage: memoryStorage,
  fileFilter: templateFileFilter,
  limits: { fileSize: config.upload.maxTemplateSize },
});

// Upload middleware: image-only uploads (backgrounds)
const uploadImage = multer({
  storage: memoryStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: config.upload.maxTemplateSize },
});

// Upload middleware: font files
const uploadFont = multer({
  storage: memoryStorage,
  fileFilter: fontFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max for fonts
});

// Upload middleware: signature images
const uploadSignature = multer({
  storage: memoryStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max for signatures
});

// Handle multer errors
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return next(AppError.badRequest("File size exceeds the allowed limit"));
    }
    return next(AppError.badRequest(err.message));
  }
  next(err);
};

module.exports = {
  uploadData: uploadData.single("file"),
  uploadTemplate: uploadTemplate.single("file"),
  uploadImage: uploadImage.single("file"),
  uploadFont: uploadFont.single("file"),
  uploadSignature: uploadSignature.single("file"),
  handleMulterError,
};
