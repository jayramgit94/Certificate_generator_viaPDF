const mongoose = require("mongoose");

const emailTemplateSchema = new mongoose.Schema(
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
      maxlength: [200, "Name cannot exceed 200 characters"],
    },
    subject: {
      type: String,
      required: [true, "Subject is required"],
      maxlength: [500, "Subject cannot exceed 500 characters"],
    },
    body: {
      type: String,
      required: [true, "Body is required"],
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    placeholders: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

// Auto-detect placeholders from subject and body
emailTemplateSchema.pre("save", function (next) {
  if (this.isModified("subject") || this.isModified("body")) {
    const combined = `${this.subject} ${this.body}`;
    const matches = combined.match(/\{\{(\w+)\}\}/g);
    this.placeholders = matches ? [...new Set(matches)] : [];
  }
  next();
});

// Ensure only one default per admin
emailTemplateSchema.pre("save", async function (next) {
  if (this.isDefault && this.isModified("isDefault")) {
    await this.constructor.updateMany(
      { admin: this.admin, _id: { $ne: this._id } },
      { isDefault: false },
    );
  }
  next();
});

const EmailTemplate = mongoose.model("EmailTemplate", emailTemplateSchema);

module.exports = EmailTemplate;
