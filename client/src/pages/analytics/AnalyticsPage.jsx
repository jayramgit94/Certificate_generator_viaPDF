import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Award, Mail, TrendingUp, Users } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Card, { CardContent, CardHeader } from "../../components/ui/Card";
import { PageLoader } from "../../components/ui/Spinner";
import api from "../../lib/api";
import { formatNumber } from "../../lib/utils";

const COLORS = [
  "#3b82f6",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

export default function AnalyticsPage() {
  const { data: certAnalytics, isLoading: loadingCerts } = useQuery({
    queryKey: ["analytics-certs"],
    queryFn: () => api.get("/analytics/certificates").then((r) => r.data.data),
  });

  const { data: emailAnalytics, isLoading: loadingEmails } = useQuery({
    queryKey: ["analytics-emails"],
    queryFn: () => api.get("/analytics/emails").then((r) => r.data.data),
  });

  const { data: dashboard } = useQuery({
    queryKey: ["analytics-dashboard"],
    queryFn: () => api.get("/analytics/dashboard").then((r) => r.data.data),
  });

  if (loadingCerts || loadingEmails) return <PageLoader />;

  // Transform daily generation data into monthly chart format
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

  const monthlyData = (() => {
    const dailyData = certAnalytics?.dailyGeneration || [];
    if (dailyData.length === 0) return [];
    // Group by month
    const monthMap = {};
    dailyData.forEach((d) => {
      const monthIdx = parseInt(d._id?.split("-")[1], 10) - 1;
      const name = monthNames[monthIdx] || d._id;
      monthMap[name] = (monthMap[name] || 0) + d.count;
    });
    return Object.entries(monthMap).map(([month, generated]) => ({
      month,
      generated,
    }));
  })();

  // Email status data from summary
  const emailSummary = emailAnalytics?.summary || {};
  const emailStatusData = [
    { name: "Sent", value: emailSummary.sent || 0 },
    { name: "Failed", value: emailSummary.failed || 0 },
    { name: "Queued", value: emailSummary.queued || 0 },
    { name: "Sending", value: emailSummary.sending || 0 },
  ].filter((d) => d.value > 0);

  // Certificate status data from summary
  const certSummary = certAnalytics?.summary || {};
  const templateUsage = [
    { template: "Generated", count: certSummary.generated || 0 },
    { template: "Emailed", count: certSummary.emailed || 0 },
    { template: "Revoked", count: certSummary.revoked || 0 },
  ].filter((d) => d.count > 0);

  // Calculate verification rate
  const totalCerts = dashboard?.certificates?.total || 0;
  const verifiedCerts = dashboard?.certificates?.verified || 0;
  const verifyRate =
    totalCerts > 0 ? ((verifiedCerts / totalCerts) * 100).toFixed(1) : 0;

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 font-display">
            Analytics
          </h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">
            Comprehensive insights and reporting
          </p>
        </div>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {[
          {
            label: "Total Generated",
            value: formatNumber(dashboard?.certificates?.total || 0),
            icon: Award,
            color: "from-blue-500 to-blue-600",
          },
          {
            label: "Delivery Rate",
            value: `${dashboard?.emails?.deliveryRate || 0}%`,
            icon: Mail,
            color: "from-emerald-500 to-emerald-600",
          },
          {
            label: "Unique Recipients",
            value: formatNumber(dashboard?.recipients?.total || 0),
            icon: Users,
            color: "from-violet-500 to-violet-600",
          },
          {
            label: "Verification Rate",
            value: `${verifyRate}%`,
            icon: TrendingUp,
            color: "from-amber-500 to-amber-600",
          },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 sm:p-5 flex items-center gap-3 sm:gap-4">
              <div
                className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br ${s.color} rounded-xl flex items-center justify-center shadow-lg flex-shrink-0`}
              >
                <s.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs sm:text-sm text-gray-500 truncate">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
        {/* Monthly trends */}
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-gray-900">
              Monthly Certificate Trends
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Certificates generated per month
            </p>
          </CardHeader>
          <CardContent className="h-60 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="generated"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                  name="Generated"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Email status pie */}
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-gray-900">
              Email Delivery Status
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Distribution overview
            </p>
          </CardHeader>
          <CardContent className="h-60 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={emailStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {emailStatusData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Template usage */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <h3 className="font-semibold text-gray-900">
              Certificate Status Breakdown
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              Distribution by certificate status
            </p>
          </CardHeader>
          <CardContent className="h-56 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={templateUsage} layout="vertical">
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f1f5f9"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="template"
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  axisLine={false}
                  width={130}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="#3b82f6"
                  radius={[0, 6, 6, 0]}
                  barSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
