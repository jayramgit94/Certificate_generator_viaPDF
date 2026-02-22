const Certificate = require("../models/Certificate");
const EmailLog = require("../models/EmailLog");
const Template = require("../models/Template");
const Recipient = require("../models/Recipient");
const ActivityLog = require("../models/ActivityLog");
const AppError = require("../utils/AppError");
const logger = require("../utils/logger");

class AnalyticsService {
  /**
   * Get dashboard statistics
   */
  async getDashboardStats(adminId) {
    const [
      totalCertificates,
      generatedCertificates,
      emailedCertificates,
      failedEmails,
      revokedCertificates,
      verifiedCertificates,
      totalTemplates,
      activeTemplates,
      totalRecipients,
      emailStats,
      monthlyStats,
      recentActivity,
    ] = await Promise.all([
      Certificate.countDocuments({ admin: adminId }),
      Certificate.countDocuments({ admin: adminId, status: "generated" }),
      Certificate.countDocuments({ admin: adminId, emailStatus: "sent" }),
      Certificate.countDocuments({ admin: adminId, emailStatus: "failed" }),
      Certificate.countDocuments({ admin: adminId, status: "revoked" }),
      Certificate.countDocuments({
        admin: adminId,
        verificationCount: { $gt: 0 },
      }),
      Template.countDocuments({ admin: adminId, status: { $ne: "archived" } }),
      Template.countDocuments({ admin: adminId, status: "active" }),
      Recipient.aggregate([
        { $match: { admin: adminId } },
        { $group: { _id: null, total: { $sum: "$summary.total" } } },
      ]),
      EmailLog.aggregate([
        { $match: { admin: adminId } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Certificate.aggregate([
        { $match: { admin: adminId } },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m", date: "$createdAt" },
            },
            certificates: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 12 },
      ]),
      ActivityLog.find({ admin: adminId })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
    ]);

    const totalRecipientCount = totalRecipients[0]?.total || 0;

    // Build email stats map
    const emailStatsMap = {};
    emailStats.forEach((s) => {
      emailStatsMap[s._id] = s.count;
    });
    const totalEmails = Object.values(emailStatsMap).reduce((a, b) => a + b, 0);
    const sentEmails =
      (emailStatsMap.sent || 0) + (emailStatsMap.delivered || 0);
    const deliveryRate =
      totalEmails > 0
        ? parseFloat(((sentEmails / totalEmails) * 100).toFixed(1))
        : 0;

    // Format monthly data for chart
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const certificatesByMonth = monthlyStats.map((m) => {
      const monthNum = parseInt(m._id.split("-")[1], 10) - 1;
      return {
        month: monthNames[monthNum] || m._id,
        certificates: m.certificates,
      };
    });

    return {
      certificates: {
        total: totalCertificates,
        generated: generatedCertificates,
        sent: emailedCertificates,
        verified: verifiedCertificates,
        revoked: revokedCertificates,
      },
      templates: {
        total: totalTemplates,
        active: activeTemplates,
      },
      recipients: {
        total: totalRecipientCount,
      },
      emails: {
        total: totalEmails,
        sent: sentEmails,
        failed: emailStatsMap.failed || 0,
        pending:
          (emailStatsMap.pending || 0) +
          (emailStatsMap.queued || 0) +
          (emailStatsMap.sending || 0),
        deliveryRate,
      },
      certificatesByMonth,
      // Keep backwards-compatible overview shape
      overview: {
        totalCertificates,
        emailedCertificates,
        failedEmails,
        pendingEmails: totalCertificates - emailedCertificates - failedEmails,
        totalTemplates,
        totalRecipients: totalRecipientCount,
      },
      rates: {
        emailSuccessRate: deliveryRate,
        emailFailRate:
          totalEmails > 0
            ? parseFloat(
                (((emailStatsMap.failed || 0) / totalEmails) * 100).toFixed(1),
              )
            : 0,
      },
      recentActivity,
    };
  }

  /**
   * Get email analytics
   */
  async getEmailAnalytics(adminId, { days = 30 } = {}) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [statusCounts, dailyStats] = await Promise.all([
      EmailLog.aggregate([
        { $match: { admin: adminId, createdAt: { $gte: startDate } } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      EmailLog.aggregate([
        { $match: { admin: adminId, createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: {
              date: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
              },
              status: "$status",
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.date": 1 } },
      ]),
    ]);

    const statusMap = {};
    statusCounts.forEach((s) => {
      statusMap[s._id] = s.count;
    });

    return {
      summary: {
        sent: statusMap.sent || 0,
        failed: statusMap.failed || 0,
        queued: statusMap.queued || 0,
        sending: statusMap.sending || 0,
      },
      dailyStats,
    };
  }

  /**
   * Get certificate analytics
   */
  async getCertificateAnalytics(adminId, { days = 30 } = {}) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [statusCounts, dailyGeneration, mostVerified] = await Promise.all([
      Certificate.aggregate([
        { $match: { admin: adminId } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Certificate.aggregate([
        { $match: { admin: adminId, createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Certificate.find({ admin: adminId, verificationCount: { $gt: 0 } })
        .sort({ verificationCount: -1 })
        .limit(10)
        .select("certificateId recipientName verificationCount")
        .lean(),
    ]);

    const statusMap = {};
    statusCounts.forEach((s) => {
      statusMap[s._id] = s.count;
    });

    return {
      summary: {
        generated: statusMap.generated || 0,
        emailed: statusMap.emailed || 0,
        failed: statusMap.failed || 0,
        revoked: statusMap.revoked || 0,
      },
      dailyGeneration,
      mostVerified,
    };
  }

  /**
   * Get activity logs
   */
  async getActivityLogs(adminId, { page = 1, limit = 50 } = {}) {
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      ActivityLog.find({ admin: adminId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ActivityLog.countDocuments({ admin: adminId }),
    ]);

    return {
      logs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Export report as JSON (frontend converts to CSV/Excel)
   */
  async exportReport(adminId, { type = "certificates" } = {}) {
    switch (type) {
      case "certificates": {
        const certs = await Certificate.find({ admin: adminId })
          .select(
            "certificateId recipientName recipientEmail eventName issueDate status emailStatus createdAt",
          )
          .sort({ createdAt: -1 })
          .lean();

        return {
          type: "certificates",
          data: certs.map((c) => ({
            "Certificate ID": c.certificateId,
            Name: c.recipientName,
            Email: c.recipientEmail,
            Event: c.eventName,
            "Issue Date": c.issueDate?.toISOString().split("T")[0],
            Status: c.status,
            "Email Status": c.emailStatus,
            "Created At": c.createdAt?.toISOString(),
          })),
        };
      }

      case "emails": {
        const logs = await EmailLog.find({ admin: adminId })
          .select(
            "recipientName recipientEmail subject status attempt sentAt error createdAt",
          )
          .sort({ createdAt: -1 })
          .lean();

        return {
          type: "emails",
          data: logs.map((l) => ({
            Name: l.recipientName,
            Email: l.recipientEmail,
            Subject: l.subject,
            Status: l.status,
            Attempts: l.attempt,
            "Sent At": l.sentAt?.toISOString(),
            Error: l.error || "",
            "Created At": l.createdAt?.toISOString(),
          })),
        };
      }

      case "activity": {
        const logs = await ActivityLog.find({ admin: adminId })
          .sort({ createdAt: -1 })
          .lean();

        return {
          type: "activity",
          data: logs.map((l) => ({
            Action: l.action,
            Details: l.details,
            Resource: l.resource || "",
            IP: l.ip || "",
            "Created At": l.createdAt?.toISOString(),
          })),
        };
      }

      default:
        throw AppError.badRequest(`Unknown report type: ${type}`);
    }
  }
}

module.exports = new AnalyticsService();
