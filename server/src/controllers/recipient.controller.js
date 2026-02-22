const recipientService = require("../services/recipient.service");
const asyncHandler = require("../utils/asyncHandler");

/**
 * @desc    List all recipient batches
 * @route   GET /api/recipients
 */
const listBatches = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await recipientService.listBatches(req.user._id, {
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 20,
  });

  res.json({ success: true, data: result });
});

/**
 * @desc    Get batch with all records
 * @route   GET /api/recipients/:batchId
 */
const getBatch = asyncHandler(async (req, res) => {
  const batch = await recipientService.getBatch(
    req.params.batchId,
    req.user._id,
  );

  res.json({ success: true, data: batch });
});

/**
 * @desc    Upload file (CSV/XLSX/JSON)
 * @route   POST /api/recipients/upload
 */
const uploadFile = asyncHandler(async (req, res) => {
  const batch = await recipientService.uploadFile(
    req.user._id,
    req.file,
    req.body.batchName,
  );

  res.status(201).json({
    success: true,
    message: `Uploaded ${batch.summary.total} recipients (${batch.summary.valid} valid, ${batch.summary.invalid} invalid, ${batch.summary.duplicates} duplicates)`,
    data: batch,
  });
});

/**
 * @desc    Add single recipient manually
 * @route   POST /api/recipients/manual
 */
const addManual = asyncHandler(async (req, res) => {
  const batch = await recipientService.addManual(req.user._id, req.body);

  res.status(201).json({
    success: true,
    message: "Recipient added",
    data: batch,
  });
});

/**
 * @desc    Update a single record in a batch
 * @route   PUT /api/recipients/:batchId/records/:recordId
 */
const updateRecord = asyncHandler(async (req, res) => {
  const batch = await recipientService.updateRecord(
    req.params.batchId,
    req.params.recordId,
    req.user._id,
    req.body,
  );

  res.json({
    success: true,
    message: "Record updated",
    data: batch,
  });
});

/**
 * @desc    Delete a single record from a batch
 * @route   DELETE /api/recipients/:batchId/records/:recordId
 */
const deleteRecord = asyncHandler(async (req, res) => {
  const batch = await recipientService.deleteRecord(
    req.params.batchId,
    req.params.recordId,
    req.user._id,
  );

  res.json({
    success: true,
    message: "Record deleted",
    data: batch,
  });
});

/**
 * @desc    Delete entire batch
 * @route   DELETE /api/recipients/:batchId
 */
const deleteBatch = asyncHandler(async (req, res) => {
  await recipientService.deleteBatch(req.params.batchId, req.user._id);

  res.json({
    success: true,
    message: "Batch deleted",
  });
});

/**
 * @desc    Re-validate batch records
 * @route   POST /api/recipients/:batchId/revalidate
 */
const revalidate = asyncHandler(async (req, res) => {
  const batch = await recipientService.revalidate(
    req.params.batchId,
    req.user._id,
  );

  res.json({
    success: true,
    message: `Re-validated: ${batch.summary.valid} valid, ${batch.summary.invalid} invalid`,
    data: batch,
  });
});

module.exports = {
  listBatches,
  getBatch,
  uploadFile,
  addManual,
  updateRecord,
  deleteRecord,
  deleteBatch,
  revalidate,
};
