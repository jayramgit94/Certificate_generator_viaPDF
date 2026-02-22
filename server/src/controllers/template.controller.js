const templateService = require("../services/template.service");
const asyncHandler = require("../utils/asyncHandler");

/**
 * @desc    List all templates
 * @route   GET /api/templates
 */
const list = asyncHandler(async (req, res) => {
  const { page, limit, status, search } = req.query;
  const result = await templateService.list(req.user._id, {
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
    status,
    search,
    role: req.user.role,
  });

  res.json({ success: true, data: result });
});

/**
 * @desc    Get single template
 * @route   GET /api/templates/:id
 */
const getById = asyncHandler(async (req, res) => {
  const template = await templateService.getById(
    req.params.id,
    req.user._id,
    req.user.role,
  );

  res.json({ success: true, data: template });
});

/**
 * @desc    Create template (with PDF upload)
 * @route   POST /api/templates
 */
const create = asyncHandler(async (req, res) => {
  // Parse JSON fields from multipart form data
  let data = { ...req.body };
  if (typeof data.fields === "string") {
    data.fields = JSON.parse(data.fields);
  }
  if (typeof data.qrCode === "string") {
    data.qrCode = JSON.parse(data.qrCode);
  }

  const template = await templateService.create(req.user._id, data, req.file);

  res.status(201).json({
    success: true,
    message: "Template created successfully",
    data: template,
  });
});

/**
 * @desc    Update template configuration
 * @route   PUT /api/templates/:id
 */
const update = asyncHandler(async (req, res) => {
  let updates = { ...req.body };
  if (typeof updates.fields === "string") {
    updates.fields = JSON.parse(updates.fields);
  }
  if (typeof updates.qrCode === "string") {
    updates.qrCode = JSON.parse(updates.qrCode);
  }

  const template = await templateService.update(
    req.params.id,
    req.user._id,
    updates,
    req.user.role,
  );

  res.json({
    success: true,
    message: "Template updated",
    data: template,
  });
});

/**
 * @desc    Delete (archive) template
 * @route   DELETE /api/templates/:id
 */
const remove = asyncHandler(async (req, res) => {
  await templateService.delete(req.params.id, req.user._id, req.user.role);

  res.json({
    success: true,
    message: "Template archived",
  });
});

/**
 * @desc    Duplicate template
 * @route   POST /api/templates/:id/duplicate
 */
const duplicate = asyncHandler(async (req, res) => {
  const template = await templateService.duplicate(
    req.params.id,
    req.user._id,
    req.user.role,
  );

  res.status(201).json({
    success: true,
    message: "Template duplicated",
    data: template,
  });
});

/**
 * @desc    Set template as default
 * @route   PUT /api/templates/:id/default
 */
const setDefault = asyncHandler(async (req, res) => {
  const template = await templateService.setDefault(
    req.params.id,
    req.user._id,
    req.user.role,
  );

  res.json({
    success: true,
    message: "Template set as default",
    data: template,
  });
});

/**
 * @desc    Upload custom font
 * @route   POST /api/templates/:id/fonts
 */
const uploadFont = asyncHandler(async (req, res) => {
  const template = await templateService.uploadFont(
    req.params.id,
    req.user._id,
    req.file,
  );

  res.json({
    success: true,
    message: "Font uploaded",
    data: template,
  });
});

/**
 * @desc    Upload signature image
 * @route   POST /api/templates/:id/signature
 */
const uploadSignature = asyncHandler(async (req, res) => {
  const template = await templateService.uploadSignature(
    req.params.id,
    req.user._id,
    req.file,
  );

  res.json({
    success: true,
    message: "Signature uploaded",
    data: template,
  });
});

/**
 * @desc    Upload background image for template
 * @route   POST /api/templates/:id/upload-background
 */
const uploadBackground = asyncHandler(async (req, res) => {
  const template = await templateService.uploadBackground(
    req.params.id,
    req.user._id,
    req.file,
  );

  res.json({
    success: true,
    message: "Background uploaded",
    data: { url: template.backgroundImage, template },
  });
});

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
  duplicate,
  setDefault,
  uploadFont,
  uploadSignature,
  uploadBackground,
};
