const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        "login",
        "logout",
        "register",
        "upload_recipients",
        "create_template",
        "update_template",
        "delete_template",
        "generate_certificates",
        "send_emails",
        "retry_email",
        "revoke_certificate",
        "update_settings",
        "export_report",
        "create_email_template",
        "update_email_template",
        "delete_email_template",
        "change_role",
        "delete_user",
      ],
      index: true,
    },
    resource: {
      type: String,
      default: null, // e.g., 'template', 'certificate', 'recipient'
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    details: {
      type: String,
      default: "",
    },
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ip: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Compound index for admin queries
activityLogSchema.index({ admin: 1, createdAt: -1 });

// TTL index: auto-delete after 90 days
activityLogSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 90 * 24 * 60 * 60 },
);

const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);

module.exports = ActivityLog;
