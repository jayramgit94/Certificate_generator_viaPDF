const mongoose = require("mongoose");

const recordSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
    },
    event: {
      type: String,
      default: "",
      trim: true,
    },
    date: {
      type: String,
      default: "",
    },
    customFields: {
      type: Map,
      of: String,
      default: {},
    },
    isValid: {
      type: Boolean,
      default: true,
    },
    validationErrors: {
      type: [String],
      default: [],
    },
    isDuplicate: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: false },
);

const summarySchema = new mongoose.Schema(
  {
    total: { type: Number, default: 0 },
    valid: { type: Number, default: 0 },
    invalid: { type: Number, default: 0 },
    duplicates: { type: Number, default: 0 },
  },
  { _id: false },
);

const importInsightSchema = new mongoose.Schema(
  {
    headers: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    warnings: {
      type: [String],
      default: [],
    },
    warningCount: {
      type: Number,
      default: 0,
    },
  },
  { _id: false },
);

const recipientSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
      index: true,
    },
    batchName: {
      type: String,
      default: function () {
        return `Batch ${new Date().toISOString().split("T")[0]}`;
      },
      trim: true,
    },
    sourceFile: {
      type: String,
      default: null, // Original filename
    },
    sourceType: {
      type: String,
      enum: ["csv", "xlsx", "json", "manual"],
      default: "manual",
    },
    records: [recordSchema],
    summary: {
      type: summarySchema,
      default: () => ({}),
    },
    importInsights: {
      type: importInsightSchema,
      default: () => ({}),
    },
    status: {
      type: String,
      enum: ["uploaded", "validated", "processing", "completed"],
      default: "uploaded",
    },
  },
  {
    timestamps: true,
  },
);

// Index for status queries
recipientSchema.index({ status: 1 });

// Compute summary before saving
recipientSchema.pre("save", function (next) {
  if (this.isModified("records")) {
    const records = this.records;
    this.summary = {
      total: records.length,
      valid: records.filter((r) => r.isValid && !r.isDuplicate).length,
      invalid: records.filter((r) => !r.isValid).length,
      duplicates: records.filter((r) => r.isDuplicate).length,
    };
  }
  next();
});

const Recipient = mongoose.model("Recipient", recipientSchema);

module.exports = Recipient;
