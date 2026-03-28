const mongoose = require("mongoose");

const certificateSchema = new mongoose.Schema(
  {
    certificateId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
      index: true,
    },
    template: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Template",
      required: true,
    },
    recipientBatch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recipient",
      default: null,
    },
    recipientName: {
      type: String,
      required: [true, "Recipient name is required"],
      trim: true,
    },
    recipientEmail: {
      type: String,
      required: [true, "Recipient email is required"],
      trim: true,
      lowercase: true,
      index: true,
    },
    eventName: {
      type: String,
      default: "",
      trim: true,
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },
    customData: {
      type: Map,
      of: String,
      default: {},
    },
    pdfPath: {
      type: String,
      default: null,
    },
    pdfFileId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    pdfSize: {
      type: Number,
      default: 0,
    },
    qrCodeData: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["generated", "emailed", "failed", "revoked"],
      default: "generated",
      index: true,
    },
    emailStatus: {
      type: String,
      enum: ["pending", "sent", "failed", "retrying"],
      default: "pending",
      index: true,
    },
    emailAttempts: {
      type: Number,
      default: 0,
    },
    lastEmailAttempt: {
      type: Date,
      default: null,
    },
    emailError: {
      type: String,
      default: null,
    },
    verificationCount: {
      type: Number,
      default: 0,
    },
    lastVerifiedAt: {
      type: Date,
      default: null,
    },
    isRevoked: {
      type: Boolean,
      default: false,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    revokedReason: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  },
);

// Compound indexes for common queries
certificateSchema.index({ admin: 1, createdAt: -1 });
certificateSchema.index({ recipientEmail: 1, createdAt: -1 });

// Virtual: verification URL
certificateSchema.virtual("verificationUrl").get(function () {
  return `/verify/${this.certificateId}`;
});

const Certificate = mongoose.model("Certificate", certificateSchema);

module.exports = Certificate;
