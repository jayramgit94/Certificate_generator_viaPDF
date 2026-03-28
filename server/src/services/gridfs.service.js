const mongoose = require("mongoose");
const { GridFSBucket, ObjectId } = require("mongodb");
const AppError = require("../utils/AppError");
const quotaService = require("./quota.service");

const GRIDFS_BUCKET = process.env.GRIDFS_BUCKET || "files";

class GridFSService {
  _toObjectId(fileId) {
    try {
      return new ObjectId(fileId);
    } catch (error) {
      throw AppError.badRequest("Invalid file ID");
    }
  }

  _getBucket() {
    if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
      throw AppError.internal("MongoDB is not connected");
    }

    return new GridFSBucket(mongoose.connection.db, {
      bucketName: GRIDFS_BUCKET,
    });
  }

  buildFileUrl(fileId) {
    return `/api/files/${fileId}`;
  }

  extractFileIdFromUrl(value) {
    if (!value || typeof value !== "string") return null;
    const match = value.match(/\/api\/files\/([a-fA-F0-9]{24})$/);
    return match ? match[1] : null;
  }

  async uploadBuffer({ buffer, filename, contentType, metadata = {} }) {
    if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
      throw AppError.badRequest("Invalid file buffer");
    }

    await quotaService.ensureMongoStorageWithinLimit(buffer.length);

    const bucket = this._getBucket();

    return new Promise((resolve, reject) => {
      const uploadStream = bucket.openUploadStream(filename || "file", {
        contentType: contentType || "application/octet-stream",
        metadata,
      });

      uploadStream.on("error", (error) => reject(error));
      uploadStream.on("finish", () => resolve(uploadStream.id.toString()));
      uploadStream.end(buffer);
    });
  }

  async getFileInfo(fileId) {
    const bucket = this._getBucket();
    const objectId = this._toObjectId(fileId);
    const files = await bucket.find({ _id: objectId }).limit(1).toArray();
    return files[0] || null;
  }

  async downloadToBuffer(fileId) {
    const bucket = this._getBucket();
    const objectId = this._toObjectId(fileId);

    const file = await this.getFileInfo(fileId);
    if (!file) {
      throw AppError.notFound("File");
    }

    return new Promise((resolve, reject) => {
      const chunks = [];
      const stream = bucket.openDownloadStream(objectId);

      stream.on("data", (chunk) => chunks.push(chunk));
      stream.on("error", (error) => reject(error));
      stream.on("end", () => {
        resolve({
          file,
          buffer: Buffer.concat(chunks),
        });
      });
    });
  }

  async openDownloadStream(fileId) {
    const bucket = this._getBucket();
    const objectId = this._toObjectId(fileId);
    const file = await this.getFileInfo(fileId);

    if (!file) {
      throw AppError.notFound("File");
    }

    return {
      file,
      stream: bucket.openDownloadStream(objectId),
    };
  }

  async deleteFile(fileId) {
    const bucket = this._getBucket();
    const objectId = this._toObjectId(fileId);
    await bucket.delete(objectId);
    return true;
  }
}

module.exports = new GridFSService();