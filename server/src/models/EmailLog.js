const mongoose = require("mongoose");

const metadataSchema = new mongoose.Schema(
  {
    batchId: { type: String, default: null },
    batchIndex: { type: Number, default: 0 },
    batchSize: { type: Number, default: 1 },
    delayMs: { type: Number, default: 0 },
  },
  { _id: false },
);

const emailLogSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
      index: true,
    },
    certificate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Certificate",
      default: null,
      index: true,
    },
    recipientEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    recipientName: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["queued", "sending", "sent", "failed"],
      default: "queued",
      index: true,
    },
    attempt: {
      type: Number,
      default: 1,
    },
    maxAttempts: {
      type: Number,
      default: 3,
    },
    provider: {
      type: String,
      default: "smtp",
    },
    providerMessageId: {
      type: String,
      default: null,
    },
    error: {
      type: String,
      default: null,
    },
    errorCode: {
      type: String,
      default: null,
    },
    sentAt: {
      type: Date,
      default: null,
    },
    queuedAt: {
      type: Date,
      default: Date.now,
    },
    metadata: {
      type: metadataSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  },
);

// Indexes for querying
emailLogSchema.index({ "metadata.batchId": 1 });
emailLogSchema.index({ admin: 1, status: 1, createdAt: -1 });
emailLogSchema.index({ admin: 1, createdAt: -1 });
emailLogSchema.index({ createdAt: -1 });

const EmailLog = mongoose.model("EmailLog", emailLogSchema);

module.exports = EmailLog;
