const Recipient = require("../models/Recipient");
const ActivityLog = require("../models/ActivityLog");
const fileService = require("./file.service");
const quotaService = require("./quota.service");
const AppError = require("../utils/AppError");
const logger = require("../utils/logger");

class RecipientService {
  /**
   * List all recipient batches for an admin
   */
  async listBatches(adminId, { page = 1, limit = 20 } = {}) {
    const skip = (page - 1) * limit;

    const [batches, total] = await Promise.all([
      Recipient.find({ admin: adminId })
        .select("-records") // Don't include full records in list view
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Recipient.countDocuments({ admin: adminId }),
    ]);

    return {
      batches,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get a single batch with all records
   */
  async getBatch(batchId, adminId) {
    const batch = await Recipient.findOne({ _id: batchId, admin: adminId });
    if (!batch) {
      throw AppError.notFound("Recipient batch");
    }
    return batch;
  }

  /**
   * Upload and process a file (CSV/XLSX/JSON)
   */
  async uploadFile(adminId, file, batchName) {
    if (!file) {
      throw AppError.badRequest("File is required");
    }

    // Parse file
    const { records, sourceType, mappingInsights } = await fileService.parseFile(
      file,
    );

    const estimatedBytes = Buffer.byteLength(
      JSON.stringify({
        batchName,
        sourceType,
        sourceFile: file.originalname,
        records,
      }),
      "utf8",
    );
    await quotaService.ensureMongoStorageWithinLimit(estimatedBytes);

    // Create batch
    const batch = await Recipient.create({
      admin: adminId,
      batchName: batchName || `Batch ${new Date().toISOString().split("T")[0]}`,
      sourceFile: file.originalname,
      sourceType,
      records,
      importInsights: mappingInsights || { headers: [], warnings: [], warningCount: 0 },
      status: "validated",
    });

    // Log activity
    await ActivityLog.create({
      admin: adminId,
      action: "upload_recipients",
      resource: "recipient",
      resourceId: batch._id,
      details: `Uploaded ${records.length} recipients from ${file.originalname}`,
      metadata: {
        total: batch.summary.total,
        valid: batch.summary.valid,
        invalid: batch.summary.invalid,
        duplicates: batch.summary.duplicates,
      },
    });

    logger.info(
      `Recipients uploaded: ${records.length} from ${file.originalname} by admin ${adminId}`,
    );

    return batch;
  }

  /**
   * Add a single recipient manually
   */
  async addManual(adminId, recipientData) {
    // Find or create a "Manual Entries" batch for today
    const today = new Date().toISOString().split("T")[0];
    let batch = await Recipient.findOne({
      admin: adminId,
      sourceType: "manual",
      batchName: `Manual Entries ${today}`,
    });

    const record = {
      ...recipientData,
      isValid: true,
      validationErrors: [],
      isDuplicate: false,
    };

    if (batch) {
      // Check for duplicate email in batch
      const existingEmails = batch.records.map((r) => r.email);
      if (existingEmails.includes(record.email)) {
        record.isDuplicate = true;
      }
      batch.records.push(record);
      await batch.save();
    } else {
      batch = await Recipient.create({
        admin: adminId,
        batchName: `Manual Entries ${today}`,
        sourceType: "manual",
        records: [record],
        status: "validated",
      });
    }

    return batch;
  }

  /**
   * Update a single record within a batch
   */
  async updateRecord(batchId, recordId, adminId, updates) {
    const batch = await Recipient.findOne({ _id: batchId, admin: adminId });
    if (!batch) {
      throw AppError.notFound("Recipient batch");
    }

    const record = batch.records.id(recordId);
    if (!record) {
      throw AppError.notFound("Record");
    }

    // Apply updates
    Object.assign(record, updates);

    // Re-validate
    const { isValidEmail } = require("../utils/emailValidator");
    record.isValid = true;
    record.validationErrors = [];

    if (!record.name || record.name.trim() === "") {
      record.isValid = false;
      record.validationErrors.push("Name is required");
    }
    if (!record.email || !isValidEmail(record.email)) {
      record.isValid = false;
      record.validationErrors.push("Invalid email format");
    }

    await batch.save();
    return batch;
  }

  /**
   * Delete a single record from a batch
   */
  async deleteRecord(batchId, recordId, adminId) {
    const batch = await Recipient.findOne({ _id: batchId, admin: adminId });
    if (!batch) {
      throw AppError.notFound("Recipient batch");
    }

    const record = batch.records.id(recordId);
    if (!record) {
      throw AppError.notFound("Record");
    }

    record.deleteOne();
    await batch.save();
    return batch;
  }

  /**
   * Delete entire batch
   */
  async deleteBatch(batchId, adminId) {
    const batch = await Recipient.findOneAndDelete({
      _id: batchId,
      admin: adminId,
    });
    if (!batch) {
      throw AppError.notFound("Recipient batch");
    }
    return batch;
  }

  /**
   * Re-validate all records in a batch
   */
  async revalidate(batchId, adminId) {
    const batch = await Recipient.findOne({ _id: batchId, admin: adminId });
    if (!batch) {
      throw AppError.notFound("Recipient batch");
    }

    const { isValidEmail } = require("../utils/emailValidator");
    const emailSeen = new Set();

    batch.records.forEach((record) => {
      record.isValid = true;
      record.validationErrors = [];
      record.isDuplicate = false;

      if (!record.name || record.name.trim() === "") {
        record.isValid = false;
        record.validationErrors.push("Name is required");
      }
      if (!record.email) {
        record.isValid = false;
        record.validationErrors.push("Email is required");
      } else if (!isValidEmail(record.email)) {
        record.isValid = false;
        record.validationErrors.push("Invalid email format");
      }

      if (record.email) {
        if (emailSeen.has(record.email)) {
          record.isDuplicate = true;
        } else {
          emailSeen.add(record.email);
        }
      }
    });

    batch.status = "validated";
    await batch.save();
    return batch;
  }
}

module.exports = new RecipientService();
