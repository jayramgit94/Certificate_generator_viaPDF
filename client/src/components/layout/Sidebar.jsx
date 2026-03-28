import { AnimatePresence, motion } from "framer-motion";
import {
  Award,
  BarChart3,
  ChevronLeft,
  FileImage,
  LayoutDashboard,
  Mail,
  Settings,
  Shield,
  Users,
  X,
} from "lucide-react";
import { useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { cn } from "../../lib/utils";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Templates", href: "/templates", icon: FileImage },
  { name: "Recipients", href: "/recipients", icon: Users },
  { name: "Certificates", href: "/certificates", icon: Award },
  { name: "Emails", href: "/emails", icon: Mail },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }) {
  const location = useLocation();

  // Close mobile sidebar on route change
  useEffect(() => {
    if (mobileOpen) onMobileClose();
  }, [location.pathname]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
        <Link
          to="/"
          onClick={() => {
            if (mobileOpen) onMobileClose();
          }}
          className="flex items-center gap-3 rounded-xl pr-2 transition-opacity hover:opacity-90"
          title="Go to landing page"
        >
          <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/25">
            <Shield className="w-5 h-5 text-white" />
          </div>
          {(!collapsed || mobileOpen) && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              <h1 className="text-base font-bold font-display text-gray-900">
                CertifyPro
              </h1>
              <p className="text-[10px] text-gray-400 font-medium tracking-wider uppercase">
                Enterprise
              </p>
            </motion.div>
          )}
        </Link>
        {mobileOpen && (
          <button
            onClick={onMobileClose}
            className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
        {navigation.map((item, index) => {
          const isActive =
            location.pathname === item.href ||
            location.pathname.startsWith(item.href + "/");

          return (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: index * 0.03 }}
            >
              <NavLink
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group",
                  isActive
                    ? "bg-primary-50 text-primary-700 shadow-sm"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                )}
                title={collapsed && !mobileOpen ? item.name : undefined}
              >
                <item.icon
                  className={cn(
                    "w-5 h-5 shrink-0 transition-colors",
                    isActive
                      ? "text-primary-600"
                      : "text-gray-400 group-hover:text-gray-600",
                  )}
                />
                {(!collapsed || mobileOpen) && <span>{item.name}</span>}
              </NavLink>
            </motion.div>
          );
        })}
      </nav>

      {/* Collapse toggle — desktop only */}
      <div className="hidden lg:block px-3 py-3 border-t border-gray-100">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
        >
          <ChevronLeft
            className={cn(
              "w-4 h-4 transition-transform duration-300",
              collapsed && "rotate-180",
            )}
          />
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex fixed left-0 top-0 z-40 h-screen bg-white border-r border-gray-200 transition-all duration-300 flex-col",
          collapsed ? "w-[72px]" : "w-64",
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay + drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden"
              onClick={onMobileClose}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 z-50 h-screen w-72 bg-white border-r border-gray-200 flex flex-col lg:hidden shadow-2xl"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
