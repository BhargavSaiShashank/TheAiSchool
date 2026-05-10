"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Search, Bell, Plus, Sun, Moon, Menu, CheckCircle, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { OrganizationSwitcher } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { motion, AnimatePresence } from "framer-motion";

export default function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const pathname = usePathname();
  const { user, theme, toggleTheme } = useStore();
  const [showNotifications, setShowNotifications] = useState(false);

  const getPageTitle = () => {
    if (pathname.startsWith("/dashboard")) return "Dashboard";
    if (pathname.startsWith("/contacts")) return "Contacts Directory";
    if (pathname.startsWith("/templates")) return "Email Templates";
    if (pathname.startsWith("/campaigns")) return "Campaign Dispatches";
    if (pathname.startsWith("/analytics")) return "Analytics Hub";
    if (pathname.startsWith("/settings/org")) return "AWS & Email Setup";
    if (pathname.startsWith("/settings/suppression")) return "Suppression Logs";
    return "PulseSend Platform";
  };

  const getBreadcrumbs = () => {
    const parts = pathname
      .split("/")
      .filter(Boolean)
      // Strip Next.js route group segments like (admin), (auth)
      .filter((p) => !/^\(.*\)$/.test(p));
    if (parts.length === 0) return "Platform";
    return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("  /  ");
  };

  return (
    <header className="h-[52px] flex items-center justify-between px-4 md:px-6 border-b border-border bg-background select-none sticky top-0 z-50 shrink-0">
      {/* Left Section: Hamburger + Title */}
      <div className="flex items-center gap-3">
        <button 
          onClick={onMenuClick}
          className="md:hidden p-1.5 hover:bg-secondary rounded border border-border text-muted-foreground hover:text-foreground transition cursor-pointer"
        >
          <Menu className="w-4 h-4" />
        </button>
        
        <div className="flex flex-col">
          <p className="hidden xs:block text-[11px] font-semibold text-zinc-500 font-mono tracking-wider uppercase mb-0.5">
            {getBreadcrumbs()}
          </p>
          <h1 className="text-[15px] md:text-[17px] font-bold text-foreground tracking-tight leading-none">
            {getPageTitle()}
          </h1>
        </div>

        {/* Elegant Vertical Separator */}
        <div className="hidden sm:block h-6 w-px bg-border mx-1" />

        {/* 🚀 ACTIVE CLERK ORGANIZATION SWITCHER 🚀 */}
        <div className="flex items-center">
          <OrganizationSwitcher
            appearance={{
              baseTheme: theme === "light" ? undefined : dark,
              elements: {
                organizationSwitcherTrigger: "hover:bg-secondary transition-all px-2 py-1.5 rounded border border-transparent hover:border-border h-9",
                organizationPreviewTextContainer: "font-semibold text-sm",
              }
            }}
            hidePersonal={false} // Explicitly permit solo personal usage per Rule #1!
            afterCreateOrganizationUrl="/dashboard"
            afterSelectOrganizationUrl="/dashboard"
          />
        </div>
      </div>

      {/* Utilities / Actions */}
      <div className="flex items-center gap-5">
        {/* Command Search Bar feel */}
        <div className="relative max-w-xs hidden sm:block">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search platform..."
            className="w-64 pl-9 pr-8 py-1.5 rounded bg-secondary border border-border text-[13px] text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/40 focus:bg-card focus:ring-1 focus:ring-primary/40 transition"
          />
          <div className="absolute inset-y-0 right-2.5 flex items-center pointer-events-none">
            <kbd className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded bg-card text-muted-foreground border border-border shadow-inner">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Global Action Shortcut based on permissions */}
        {user?.role !== "VIEWER" && !pathname.includes("/campaigns") && (
          <div className="flex items-center gap-2">
            <Link href="/campaigns?new=true">
              <button className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded bg-primary text-white hover:bg-primary/95 text-[13px] font-semibold shadow-[0_1px_3px_rgba(95,90,246,0.2)] transition cursor-pointer border border-white/5">
                <Plus className="w-4 h-4 sm:w-3.5 sm:h-3.5 stroke-[2.5]" />
                <span className="hidden xs:inline">New Campaign</span>
              </button>
            </Link>
          </div>
        )}

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-1.5 hover:bg-secondary rounded border border-border text-muted-foreground hover:text-foreground transition cursor-pointer relative overflow-hidden"
          title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
        >
          {theme === "light" ? (
            <Sun className="w-4 h-4 text-amber-500 fill-amber-500/20" />
          ) : (
            <Moon className="w-4 h-4 text-violet-400 fill-violet-400/20" />
          )}
        </button>

        {/* Alerts Popover Container */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`relative p-1.5 rounded border transition cursor-pointer ${showNotifications ? "bg-secondary border-[#7C5CFF] text-foreground" : "hover:bg-secondary border-border text-muted-foreground hover:text-foreground"}`}
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          </button>

          <AnimatePresence>
            {showNotifications && (
              <>
                {/* Backdrop to close */}
                <div className="fixed inset-0 z-10" onClick={() => setShowNotifications(false)} />
                
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.98 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute right-0 mt-2 w-72 bg-[#0d0e12] border border-zinc-800 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] rounded-xl overflow-hidden z-20 select-none"
                >
                  <div className="p-3 border-b border-zinc-800 bg-zinc-900/30 flex items-center justify-between">
                    <h3 className="text-[12px] font-bold text-white">System Notifications</h3>
                    <span className="text-[9px] font-mono font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded uppercase">2 Active</span>
                  </div>
                  
                  <div className="max-h-64 overflow-y-auto py-1">
                    <div className="p-3 border-b border-zinc-900/50 hover:bg-zinc-900/40 transition cursor-pointer group">
                      <div className="flex items-start gap-2.5">
                        <div className="p-1.5 rounded bg-emerald-950/30 text-emerald-400 border border-emerald-900/30 shrink-0">
                          <CheckCircle className="w-3 h-3" />
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-zinc-100 group-hover:text-white transition">Identity fully synchronized</p>
                          <p className="text-[10px] text-zinc-500 mt-0.5 leading-relaxed">Clerk authentication and local persistence active.</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 hover:bg-zinc-900/40 transition cursor-pointer group">
                      <div className="flex items-start gap-2.5">
                        <div className="p-1.5 rounded bg-[#7C5CFF]/10 text-[#7C5CFF] border border-[#7C5CFF]/20 shrink-0">
                          <Sparkles className="w-3 h-3" />
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-zinc-100 group-hover:text-white transition">Welcome to PulseSend</p>
                          <p className="text-[10px] text-zinc-500 mt-0.5 leading-relaxed">Your high-velocity SES dispatch platform is live.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
