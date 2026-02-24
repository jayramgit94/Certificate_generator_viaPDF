import { motion } from "framer-motion";
import { useState } from "react";
import { Outlet } from "react-router-dom";
import { cn } from "../../lib/utils";
import OnboardingTour, {
  useOnboardingTour,
} from "../ui/OnboardingTour";
import Header from "./Header";
import Sidebar from "./Sidebar";

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { showTour, completeTour, resetTour } = useOnboardingTour();

  return (
    <div className="min-h-screen bg-gray-50">
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
        <Header onMenuToggle={() => setMobileOpen(true)} onTourStart={resetTour} />

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
