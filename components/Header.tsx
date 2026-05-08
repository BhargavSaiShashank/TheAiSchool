"use client";

import { useStore } from "@/lib/store";
import { Search, Bell, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();
  const { user } = useStore();

  const getPageTitle = () => {
    if (pathname.startsWith("/dashboard")) return "Dashboard";
    if (pathname.startsWith("/contacts")) return "Contacts Directory";
    if (pathname.startsWith("/templates")) return "Email Templates";
    if (pathname.startsWith("/campaigns")) return "Campaign Wizard";
    if (pathname.startsWith("/analytics")) return "Analytics Hub";
    if (pathname.startsWith("/settings/org")) return "Organisation Settings";
    if (pathname.startsWith("/settings/users")) return "Teammates Directory";
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
    <header className="h-[52px] flex items-center justify-between px-6 border-b border-border bg-card/60 backdrop-blur-md select-none sticky top-0 z-10 shrink-0">
      {/* Title & Path */}
      <div className="flex flex-col">
        <p className="text-[11px] font-semibold text-zinc-500 font-mono tracking-wider uppercase mb-0.5">
          {getBreadcrumbs()}
        </p>
        <h1 className="text-[17px] font-bold text-foreground tracking-tight leading-none">
          {getPageTitle()}
        </h1>
      </div>

      {/* Utilities / Actions */}
      <div className="flex items-center gap-5">
        {/* Command Search Bar feel */}
        <div className="relative max-w-xs hidden sm:block">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-zinc-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search platform..."
            className="w-64 pl-9 pr-8 py-1.5 rounded bg-zinc-900 border border-border text-[13px] text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 focus:bg-zinc-950 focus:ring-1 focus:ring-zinc-700 transition"
          />
          <div className="absolute inset-y-0 right-2.5 flex items-center pointer-events-none">
            <kbd className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded bg-zinc-850 text-zinc-500 border border-border shadow-inner">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Global Action Shortcut based on permissions */}
        {user?.role !== "VIEWER" && !pathname.startsWith("/campaigns") && (
          <div className="flex items-center gap-2">
            <Link href="/campaigns?new=true">
              <button className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-primary text-white hover:bg-primary/95 text-[13px] font-semibold shadow-[0_1px_3px_rgba(95,90,246,0.2)] transition cursor-pointer border border-white/5">
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>New Campaign</span>
              </button>
            </Link>
          </div>
        )}

        {/* Alerts Dot */}
        <button className="relative p-1.5 hover:bg-secondary rounded border border-border text-muted-foreground hover:text-foreground transition cursor-pointer">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
        </button>
      </div>
    </header>
  );
}
