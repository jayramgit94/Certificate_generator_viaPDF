const analyticsService = require("../services/analytics.service");
const asyncHandler = require("../utils/asyncHandler");

/**
 * @desc    Get dashboard stats
 * @route   GET /api/analytics/dashboard
 */
const dashboard = asyncHandler(async (req, res) => {
  const stats = await analyticsService.getDashboardStats(req.user._id);

  res.json({ success: true, data: stats });
});

/**
 * @desc    Get email analytics
 * @route   GET /api/analytics/emails
 */
const emailAnalytics = asyncHandler(async (req, res) => {
  const { days } = req.query;
  const analytics = await analyticsService.getEmailAnalytics(req.user._id, {
    days: parseInt(days) || 30,
  });

  res.json({ success: true, data: analytics });
});

/**
 * @desc    Get certificate analytics
 * @route   GET /api/analytics/certificates
 */
const certificateAnalytics = asyncHandler(async (req, res) => {
  const { days } = req.query;
  const analytics = await analyticsService.getCertificateAnalytics(
    req.user._id,
    {
      days: parseInt(days) || 30,
    },
  );

  res.json({ success: true, data: analytics });
});

/**
 * @desc    Get activity logs
 * @route   GET /api/analytics/activity
 */
const activityLogs = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const result = await analyticsService.getActivityLogs(req.user._id, {
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 50,
  });

  res.json({ success: true, data: result });
});

/**
 * @desc    Export report
 * @route   GET /api/analytics/export
 */
const exportReport = asyncHandler(async (req, res) => {
  const { type } = req.query;
  const report = await analyticsService.exportReport(req.user._id, { type });

  res.json({ success: true, data: report });
});

module.exports = {
  dashboard,
  emailAnalytics,
  certificateAnalytics,
  activityLogs,
  exportReport,
};
