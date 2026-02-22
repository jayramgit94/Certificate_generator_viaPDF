import { useState } from "react";
import { Outlet } from "react-router-dom";
import { cn } from "../../lib/utils";
import Header from "./Header";
import Sidebar from "./Sidebar";

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
      />

      <div
        className={cn(
          "transition-all duration-300",
          collapsed ? "lg:ml-[72px]" : "lg:ml-64",
        )}
      >
        <Header onMenuToggle={() => setCollapsed(!collapsed)} />

        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
