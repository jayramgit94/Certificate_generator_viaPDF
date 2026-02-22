const certificateService = require("../services/certificate.service");
const asyncHandler = require("../utils/asyncHandler");

/**
 * @desc    Generate a single certificate
 * @route   POST /api/certificates/generate
 */
const generateSingle = asyncHandler(async (req, res) => {
  const { templateId, ...recipientData } = req.body;
  const certificate = await certificateService.generateSingle(
    req.user._id,
    templateId,
    recipientData,
  );

  res.status(201).json({
    success: true,
    message: "Certificate generated",
    data: certificate,
  });
});

/**
 * @desc    Generate certificates for a batch
 * @route   POST /api/certificates/generate-batch
 */
const generateBatch = asyncHandler(async (req, res) => {
  const { templateId, batchId } = req.body;
  const result = await certificateService.generateBatch(
    req.user._id,
    templateId,
    batchId,
  );

  const statusCode = result.success > 0 ? 200 : 422;
  res.status(statusCode).json({
    success: result.success > 0,
    message: `Generated ${result.success}/${result.total} certificates`,
    data: result,
  });
});

/**
 * @desc    List certificates with pagination
 * @route   GET /api/certificates
 */
const list = asyncHandler(async (req, res) => {
  const { page, limit, status, emailStatus, search } = req.query;
  const result = await certificateService.list(req.user._id, {
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
    status,
    emailStatus,
    search,
  });

  res.json({ success: true, data: result });
});

/**
 * @desc    Get single certificate
 * @route   GET /api/certificates/:id
 */
const getById = asyncHandler(async (req, res) => {
  const certificate = await certificateService.getById(
    req.params.id,
    req.user._id,
  );

  res.json({ success: true, data: certificate });
});

/**
 * @desc    Download certificate PDF
 * @route   GET /api/certificates/:id/download
 */
const download = asyncHandler(async (req, res) => {
  const { buffer, filename } = await certificateService.downloadPdf(
    req.params.id,
    req.user._id,
  );

  res.set({
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="${filename}"`,
    "Content-Length": buffer.length,
  });
  res.send(buffer);
});

/**
 * @desc    Revoke a certificate
 * @route   PUT /api/certificates/:id/revoke
 */
const revoke = asyncHandler(async (req, res) => {
  const certificate = await certificateService.revoke(
    req.params.id,
    req.user._id,
    req.body.reason,
  );

  res.json({
    success: true,
    message: "Certificate revoked",
    data: certificate,
  });
});

/**
 * @desc    Public certificate verification
 * @route   GET /api/verify/:certificateId
 */
const verify = asyncHandler(async (req, res) => {
  const result = await certificateService.verify(req.params.certificateId);

  res.json({
    success: true,
    data: result,
  });
});

module.exports = {
  generateSingle,
  generateBatch,
  list,
  getById,
  download,
  revoke,
  verify,
};
