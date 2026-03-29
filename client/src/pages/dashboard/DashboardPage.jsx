import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowDownRight,
  ArrowUpRight,
  Award,
  CheckCircle,
  Clock,
  FileImage,
  Mail,
  TrendingUp,
  Users,
  XCircle,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
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
import { formatDate, formatNumber } from "../../lib/utils";

const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"];

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => api.get("/analytics/dashboard").then((r) => r.data.data),
    staleTime: 60 * 1000,
  });

  if (isLoading) return <PageLoader />;

  const statCards = [
    {
      title: "Total Certificates",
      value: formatNumber(stats?.certificates?.total || 0),
      change: `${stats?.certificates?.generated || 0} generated`,
      trend: "up",
      icon: Award,
      color: "from-blue-500 to-blue-600",
    },
    {
      title: "Active Templates",
      value: formatNumber(stats?.templates?.active || 0),
      change: `${stats?.templates?.total || 0} total`,
      trend: "up",
      icon: FileImage,
      color: "from-emerald-500 to-emerald-600",
    },
    {
      title: "Total Recipients",
      value: formatNumber(stats?.recipients?.total || 0),
      change: "",
      trend: "up",
      icon: Users,
      color: "from-violet-500 to-violet-600",
    },
    {
      title: "Emails Sent",
      value: formatNumber(stats?.emails?.sent || 0),
      change: stats?.emails?.deliveryRate
        ? `${stats.emails.deliveryRate}% delivered`
        : "0%",
      trend: "up",
      icon: Mail,
      color: "from-amber-500 to-amber-600",
    },
  ];

  const chartData = stats?.certificatesByMonth?.length
    ? stats.certificatesByMonth
    : [
        { month: "Jan", certificates: 0 },
        { month: "Feb", certificates: 0 },
        { month: "Mar", certificates: 0 },
        { month: "Apr", certificates: 0 },
        { month: "May", certificates: 0 },
        { month: "Jun", certificates: 0 },
      ];

  const statusData = [
    { name: "Generated", value: stats?.certificates?.generated || 0 },
    { name: "Sent", value: stats?.certificates?.sent || 0 },
    { name: "Verified", value: stats?.certificates?.verified || 0 },
    { name: "Revoked", value: stats?.certificates?.revoked || 0 },
  ];

  return (
    <motion.div
      className="space-y-6"
      variants={stagger}
      initial="hidden"
      animate="show"
    >
      {/* Page header */}
      <motion.div variants={fadeUp}>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 font-display">
          Dashboard
        </h1>
        <p className="text-gray-500 mt-1 text-sm sm:text-base">
          Welcome back! Here&apos;s your overview.
        </p>
      </motion.div>

      {/* Stat cards */}
      <motion.div
        className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5"
        variants={stagger}
      >
        {statCards.map((stat) => (
          <motion.div key={stat.title} variants={fadeUp}>
            <Card className="overflow-hidden h-full">
              <CardContent className="p-3.5 sm:p-5">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                      {stat.title}
                    </p>
                    <p className="text-xl sm:text-3xl font-bold text-gray-900 mt-1">
                      {stat.value}
                    </p>
                  </div>
                  <div
                    className={`w-9 h-9 sm:w-11 sm:h-11 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center shadow-lg flex-shrink-0`}
                  >
                    <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-2 sm:mt-3">
                  {stat.trend === "up" ? (
                    <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-success-500" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-danger-500" />
                  )}
                  <span
                    className={`text-xs sm:text-sm font-semibold truncate ${
                      stat.trend === "up"
                        ? "text-success-600"
                        : "text-danger-600"
                    }`}
                  >
                    {stat.change}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts row */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5"
        variants={fadeUp}
      >
        {/* Area chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                  Certificate Generation
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                  Monthly overview
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs sm:text-sm text-success-600 bg-success-50 px-2 sm:px-2.5 py-1 rounded-lg">
                <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="font-medium">+23%</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-56 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorCerts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  width={35}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    fontSize: "13px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="certificates"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorCerts)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie chart */}
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
              Status Distribution
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Certificate status
            </p>
          </CardHeader>
          <CardContent className="h-52 sm:h-72 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    fontSize: "13px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
          <div className="px-4 sm:px-6 pb-4">
            <div className="grid grid-cols-2 gap-2">
              {statusData.map((item, i) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: COLORS[i] }}
                  />
                  <span className="text-xs text-gray-600">{item.name}</span>
                  <span className="text-xs font-semibold text-gray-900 ml-auto">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Recent activity */}
      <motion.div variants={fadeUp}>
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
              Recent Activity
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Latest actions across the platform
            </p>
          </CardHeader>
          <div className="divide-y divide-gray-100">
            {(stats?.recentActivity || []).length > 0 ? (
              stats.recentActivity.map((log) => (
                <div
                  key={log._id}
                  className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3 sm:py-3.5"
                >
                  <div
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      log.action?.includes("create")
                        ? "bg-success-50 text-success-600"
                        : log.action?.includes("delete")
                          ? "bg-danger-50 text-danger-600"
                          : "bg-primary-50 text-primary-600"
                    }`}
                  >
                    {log.action?.includes("create") ? (
                      <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    ) : log.action?.includes("delete") ? (
                      <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                      {log.details || log.action}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(log.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-10 text-center text-sm text-gray-400">
                No recent activity yet. Start by creating a template!
              </div>
            )}
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
