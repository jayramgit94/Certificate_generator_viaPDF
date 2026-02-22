const mongoose = require("mongoose");

const textFieldSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["placeholder", "static"],
      required: true,
    },
    placeholder: {
      type: String,
      default: null, // e.g. '{{name}}', '{{date}}'
    },
    text: {
      type: String,
      default: "", // For static text
    },
    page: {
      type: Number,
      default: 1,
    },
    x: {
      type: Number,
      required: true, // Percentage of page width (0-100)
    },
    y: {
      type: Number,
      required: true, // Percentage of page height (0-100)
    },
    width: {
      type: Number,
      default: 200,
    },
    height: {
      type: Number,
      default: 50,
    },
    fontFamily: {
      type: String,
      default: "Helvetica",
    },
    fontSize: {
      type: Number,
      default: 24,
    },
    fontColor: {
      type: String,
      default: "#000000",
    },
    fontWeight: {
      type: String,
      enum: ["normal", "bold"],
      default: "normal",
    },
    fontStyle: {
      type: String,
      enum: ["normal", "italic"],
      default: "normal",
    },
    alignment: {
      type: String,
      enum: ["left", "center", "right"],
      default: "center",
    },
    autoScale: {
      type: Boolean,
      default: true,
    },
    maxFontSize: {
      type: Number,
      default: 48,
    },
    minFontSize: {
      type: Number,
      default: 12,
    },
    zIndex: {
      type: Number,
      default: 1,
    },
  },
  { _id: false },
);

const customFontSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    file: {
      type: String,
      required: true,
    },
  },
  { _id: false },
);

const signatureSchema = new mongoose.Schema(
  {
    file: String,
    page: { type: Number, default: 1 },
    x: { type: Number, default: 50 },
    y: { type: Number, default: 80 },
    width: { type: Number, default: 150 },
    height: { type: Number, default: 50 },
    zIndex: { type: Number, default: 10 },
  },
  { _id: false },
);

const qrCodeConfigSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: true },
    page: { type: Number, default: 1 },
    x: { type: Number, default: 85 },
    y: { type: Number, default: 85 },
    size: { type: Number, default: 80 },
    zIndex: { type: Number, default: 10 },
  },
  { _id: false },
);

const templateSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Template name is required"],
      trim: true,
      maxlength: [200, "Template name cannot exceed 200 characters"],
    },
    description: {
      type: String,
      default: "",
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    pdfFile: {
      type: String,
      required: [true, "Template file is required"],
    },
    pdfPages: {
      type: Number,
      default: 1,
    },
    fileType: {
      type: String,
      enum: ["pdf", "image"],
      default: "pdf",
    },
    category: {
      type: String,
      enum: [
        "course",
        "achievement",
        "participation",
        "award",
        "training",
        "other",
      ],
      default: "course",
    },
    backgroundImage: {
      type: String,
      default: null,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    fields: [textFieldSchema],
    customFonts: [customFontSchema],
    signature: {
      type: signatureSchema,
      default: null,
    },
    qrCode: {
      type: qrCodeConfigSchema,
      default: () => ({}),
    },
    status: {
      type: String,
      enum: ["draft", "active", "archived"],
      default: "draft",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  },
);

// Compound index for default template lookup
templateSchema.index({ admin: 1, isDefault: 1 });

// Ensure only one default template per admin
templateSchema.pre("save", async function (next) {
  if (this.isDefault && this.isModified("isDefault")) {
    await this.constructor.updateMany(
      { admin: this.admin, _id: { $ne: this._id } },
      { isDefault: false },
    );
  }
  next();
});

const Template = mongoose.model("Template", templateSchema);

module.exports = Template;
