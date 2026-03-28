import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { cn } from "../../lib/utils";
import OnboardingTour, {
  useOnboardingTour,
} from "../ui/OnboardingTour";
import Header from "./Header";
import Sidebar from "./Sidebar";

const HELLO_STORAGE_PREFIX = "certifypro_cloud_hello_seen";
const DASHBOARD_THEME_STORAGE_KEY = "certifypro_dashboard_theme";

function getInitialDashboardTheme() {
  if (typeof window === "undefined") return "dark";

  const saved = localStorage.getItem(DASHBOARD_THEME_STORAGE_KEY);
  if (saved === "light" || saved === "dark") {
    return saved;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState(getInitialDashboardTheme);
  const { user } = useAuth();
  const { showTour, completeTour, resetTour } = useOnboardingTour();
  const isDarkMode = theme === "dark";

  useEffect(() => {
    if (!user) return;

    const identity = user._id || user.email || user.name || "user";
    const key = `${HELLO_STORAGE_PREFIX}:${identity}`;
    const hasSeen = localStorage.getItem(key) === "true";

    if (hasSeen) return;

    const timer = setTimeout(() => {
      toast.success(`Hello from Jayram. Welcome to CertifyPro Cloud.`, {
        duration: 6500,
      });
      localStorage.setItem(key, "true");
    }, 600);

    return () => clearTimeout(timer);
  }, [user]);

  useEffect(() => {
    localStorage.setItem(DASHBOARD_THEME_STORAGE_KEY, theme);
  }, [theme]);

  const handleThemeToggle = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <div
      className={cn(
        "dashboard-shell min-h-screen transition-colors duration-300",
        isDarkMode ? "dashboard-dark bg-[#0f1014]" : "dashboard-light bg-gray-50",
      )}
    >
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div
        className={cn(
          "transition-all duration-300",
          collapsed ? "lg:ml-[72px]" : "lg:ml-64",
        )}
      >
        <Header
          onMenuToggle={() => setMobileOpen(true)}
          onTourStart={resetTour}
          isDarkMode={isDarkMode}
          onToggleTheme={handleThemeToggle}
        />

        <motion.main
          className="p-4 sm:p-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <Outlet />
        </motion.main>
      </div>

      <OnboardingTour isOpen={showTour} onComplete={completeTour} />
    </div>
  );
}
