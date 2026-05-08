"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  FileCode,
  Send,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Building,
  ShieldAlert,
  Sliders,
  Sparkles,
  Command,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, sidebarCollapsed, toggleSidebar, logout } = useStore();

  const menuItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["SUPER_ADMIN", "CAMPAIGN_MANAGER", "VIEWER"] },
    { name: "Contacts", href: "/contacts", icon: Users, roles: ["SUPER_ADMIN", "CAMPAIGN_MANAGER", "VIEWER"] },
    { name: "Templates", href: "/templates", icon: FileCode, roles: ["SUPER_ADMIN", "CAMPAIGN_MANAGER"] },
    { name: "Campaigns", href: "/campaigns", icon: Send, roles: ["SUPER_ADMIN", "CAMPAIGN_MANAGER", "VIEWER"] },
    { name: "Analytics", href: "/analytics", icon: BarChart3, roles: ["SUPER_ADMIN", "CAMPAIGN_MANAGER", "VIEWER"] },
  ];

  const settingsItems = [
    { name: "Organisation", href: "/settings/org", icon: Building, roles: ["SUPER_ADMIN"] },
    { name: "Users", href: "/settings/users", icon: Users, roles: ["SUPER_ADMIN"] },
    { name: "Suppression List", href: "/settings/suppression", icon: ShieldAlert, roles: ["SUPER_ADMIN", "CAMPAIGN_MANAGER"] },
  ];

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  // Filter items based on user role
  const allowedMenuItems = menuItems.filter((item) => item.roles.includes(user?.role || "VIEWER"));
  const allowedSettingsItems = settingsItems.filter((item) => item.roles.includes(user?.role || "VIEWER"));

  return (
    <motion.aside
      animate={{ width: sidebarCollapsed ? 56 : 240 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col h-screen border-r border-border bg-[#06070a]/40 backdrop-blur-md text-muted-foreground select-none relative z-20 shrink-0 shadow-sm"
    >
      {/* Brand Header */}
      <div className="h-[52px] flex items-center justify-between px-4 border-b border-border shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded bg-zinc-950 border border-zinc-800 flex items-center justify-center text-white font-extrabold shrink-0 shadow-sm">
            <Send className="w-3 h-3 text-white" />
          </div>
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="font-bold text-foreground tracking-tight text-[15px] shrink-0"
              >
                PulseSend
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
        
        {/* Collapse Button */}
        {!sidebarCollapsed && (
          <button
            onClick={toggleSidebar}
            className="p-1 hover:bg-secondary rounded border border-border text-muted-foreground hover:text-foreground transition cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Navigation Items */}
      <div className="flex-1 overflow-y-auto py-4 px-2.5 space-y-5">
        <div>
          {!sidebarCollapsed && (
            <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider px-3 mb-2">
              Campaigns
            </p>
          )}
          <nav className="space-y-1">
            {allowedMenuItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => {
                    if (pathname !== item.href && typeof window !== "undefined") {
                      window.dispatchEvent(new Event("pulsesend:loading"));
                    }
                  }}
                >
                  <div
                    className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium text-[13px] transition relative cursor-pointer group ${
                      isActive
                        ? "text-[#F5F7FA] bg-white/[0.03] font-semibold border border-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                        : "text-zinc-400 hover:text-[#F5F7FA] hover:bg-white/[0.015]"
                    }`}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/4 bottom-1/4 w-[2px] rounded-r-md bg-[#7C5CFF] shadow-[0_0_8px_#7C5CFF]" />
                    )}
                    <item.icon className={`w-[15px] h-[15px] shrink-0 transition ${isActive ? "text-[#7C5CFF]" : "text-zinc-500 group-hover:text-zinc-300"}`} />
                    {!sidebarCollapsed && <span>{item.name}</span>}
                    {isActive && !sidebarCollapsed && (
                      <motion.div
                        layoutId="active-nav-indicator"
                        className="absolute right-3 w-1.5 h-1.5 rounded-full bg-[#7C5CFF] shadow-[0_0_8px_#7C5CFF]"
                      />
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Settings Menu Block (for permitted roles) */}
        {allowedSettingsItems.length > 0 && (
          <div>
            {!sidebarCollapsed && (
              <p className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider px-3 mb-2">
                Settings
              </p>
            )}
            <nav className="space-y-1">
              {allowedSettingsItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => {
                      if (pathname !== item.href && typeof window !== "undefined") {
                        window.dispatchEvent(new Event("pulsesend:loading"));
                      }
                    }}
                  >
                    <div
                      className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium text-[13px] transition relative cursor-pointer group ${
                        isActive
                          ? "text-[#F5F7FA] bg-white/[0.03] font-semibold border border-white/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                          : "text-zinc-400 hover:text-[#F5F7FA] hover:bg-white/[0.015]"
                      }`}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-1/4 bottom-1/4 w-[2px] rounded-r-md bg-[#7C5CFF] shadow-[0_0_8px_#7C5CFF]" />
                      )}
                      <item.icon className={`w-[15px] h-[15px] shrink-0 transition ${isActive ? "text-[#7C5CFF]" : "text-zinc-500 group-hover:text-zinc-300"}`} />
                      {!sidebarCollapsed && <span>{item.name}</span>}
                      {isActive && !sidebarCollapsed && (
                        <motion.div
                          layoutId="active-setting-indicator"
                          className="absolute right-3 w-1.5 h-1.5 rounded-full bg-[#7C5CFF]"
                        />
                      )}
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* Collapse Toggle Footer for compact view */}
      {sidebarCollapsed && (
        <div className="h-14 flex items-center justify-center border-t border-border shrink-0">
          <button
            onClick={toggleSidebar}
            className="p-1 hover:bg-secondary rounded border border-border text-muted-foreground hover:text-foreground transition cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* User Profile Footer */}
      <div className="p-3 border-t border-border bg-secondary/20 shrink-0">
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-100 text-xs font-semibold shrink-0 uppercase border border-zinc-700 shadow-sm">
              {user?.email[0] || "A"}
            </div>
            {!sidebarCollapsed && (
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-foreground truncate leading-none mb-1">
                  {user?.org_name || "PulseSend Inc."}
                </p>
                <p className="text-[10px] text-muted-foreground truncate lowercase font-mono font-semibold">
                  {user?.role.replace("_", " ") || "Super Admin"}
                </p>
              </div>
            )}
          </div>
          
          {!sidebarCollapsed && (
            <button
              onClick={handleLogout}
              className="p-1.5 hover:bg-secondary rounded text-zinc-400 hover:text-red-400 transition cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </motion.aside>
  );
}
