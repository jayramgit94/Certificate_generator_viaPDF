const mongoose = require("mongoose");
const Template = require("../models/Template");
const config = require("../config");
const AppError = require("../utils/AppError");

class QuotaService {
  async ensureTemplateLimit(adminId) {
    const maxTemplates = config.limits.maxTemplatesPerAdmin;

    if (!adminId || maxTemplates <= 0) return;

    const currentTemplates = await Template.countDocuments({ admin: adminId });

    if (currentTemplates >= maxTemplates) {
      throw new AppError(
        `Template limit reached. Maximum ${maxTemplates} templates are allowed per account.`,
        409,
        "TEMPLATE_LIMIT_REACHED",
        [
          {
            field: "templates",
            message: `Delete or archive an existing template before creating a new one (limit: ${maxTemplates}).`,
          },
        ],
      );
    }
  }

  async getMongoUsageBytes() {
    if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
      throw AppError.internal("MongoDB is not connected");
    }

    const stats = await mongoose.connection.db.stats();
    const dataSize = Number(stats?.dataSize || 0);

    return Number.isFinite(dataSize) ? dataSize : 0;
  }

  async ensureMongoStorageWithinLimit(additionalBytes = 0) {
    const maxStorage = config.limits.maxMongoStorageBytes;
    if (maxStorage <= 0) return;

    const currentUsage = await this.getMongoUsageBytes();
    const projectedUsage = currentUsage + Math.max(0, Number(additionalBytes) || 0);

    if (projectedUsage > maxStorage) {
      const toMb = (bytes) => (bytes / (1024 * 1024)).toFixed(2);

      throw new AppError(
        `MongoDB storage quota exceeded. Limit is ${toMb(maxStorage)}MB.`,
        413,
        "STORAGE_LIMIT_REACHED",
        [
          {
            field: "storage",
            message: `Current usage ${toMb(currentUsage)}MB, projected usage ${toMb(projectedUsage)}MB exceeds limit ${toMb(maxStorage)}MB.`,
          },
        ],
      );
    }
  }
}

module.exports = new QuotaService();
