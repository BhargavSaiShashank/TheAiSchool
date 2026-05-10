"use client";

import { useStore } from "@/lib/store";
import { Search, Bell, Plus, Sun, Moon, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { OrganizationSwitcher } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

export default function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const pathname = usePathname();
  const { user, theme, toggleTheme } = useStore();

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

        {/* Alerts Dot */}
        <button className="relative p-1.5 hover:bg-secondary rounded border border-border text-muted-foreground hover:text-foreground transition cursor-pointer">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
        </button>
      </div>
    </header>
  );
}
