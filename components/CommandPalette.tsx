"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Terminal,
  Compass,
  Zap,
  Sparkles,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";

interface CommandItem {
  id: string;
  category: "navigation" | "actions" | "ai";
  title: string;
  subtitle?: string;
  icon: any;
  shortcut?: string;
  action: () => void;
}

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Toggle state with CMD+K or CTRL+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Autofocus input when opened
  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const commands: CommandItem[] = [
    // Navigation
    {
      id: "nav-dash",
      category: "navigation",
      title: "Go to Dashboard",
      subtitle: "Overview of your campaign operations",
      icon: Compass,
      shortcut: "G D",
      action: () => { router.push("/dashboard"); setIsOpen(false); },
    },
    {
      id: "nav-camp",
      category: "navigation",
      title: "Go to Campaigns",
      subtitle: "Manage and dispatch dispatches",
      icon: Compass,
      shortcut: "G C",
      action: () => { router.push("/campaigns"); setIsOpen(false); },
    },
    {
      id: "nav-temp",
      category: "navigation",
      title: "Go to Templates",
      subtitle: "Creative email designer & library",
      icon: Compass,
      shortcut: "G T",
      action: () => { router.push("/templates"); setIsOpen(false); },
    },
    {
      id: "nav-cont",
      category: "navigation",
      title: "Go to Contacts",
      subtitle: "View lists and audiences",
      icon: Compass,
      shortcut: "G A",
      action: () => { router.push("/contacts"); setIsOpen(false); },
    },
    {
      id: "nav-anal",
      category: "navigation",
      title: "Go to Analytics",
      subtitle: "Deep-dive deliverability insights",
      icon: Compass,
      shortcut: "G I",
      action: () => { router.push("/analytics"); setIsOpen(false); },
    },
    // Quick Actions
    {
      id: "act-new-camp",
      category: "actions",
      title: "Create New Campaign",
      subtitle: "Launch a new email dispatch campaign",
      icon: Zap,
      shortcut: "N C",
      action: () => { router.push("/campaigns?new=true"); setIsOpen(false); },
    },
    {
      id: "act-new-list",
      category: "actions",
      title: "Create Mailing List",
      subtitle: "Segment a new contact directory",
      icon: Zap,
      shortcut: "N L",
      action: () => { router.push("/contacts"); setIsOpen(false); },
    },
    {
      id: "act-supp",
      category: "actions",
      title: "Manage Suppression List",
      subtitle: "Configure bounce & complaint rules",
      icon: ShieldAlert,
      shortcut: "M S",
      action: () => { router.push("/settings/suppression"); setIsOpen(false); },
    },
    // AI Infrastructure Operations
    {
      id: "ai-fatigue",
      category: "ai",
      title: "AI Audience Fatigue Analysis",
      subtitle: "Check optimal campaign interval fatigue",
      icon: Sparkles,
      shortcut: "AI F",
      action: () => { alert("AI Analytics: High-precision audience fatigue level is 14% (Optimized)."); setIsOpen(false); },
    },
    {
      id: "ai-deliverability",
      category: "ai",
      title: "Verify DKIM & SES Alignment",
      subtitle: "Validate high-deliverability infrastructure states",
      icon: Sparkles,
      shortcut: "AI D",
      action: () => { alert("Infrastructure Sync: DKIM alignment verified & active across 100% of nodes."); setIsOpen(false); },
    },
    {
      id: "ai-window",
      category: "ai",
      title: "Calculate Smart Send Window",
      subtitle: "Predict maximum engagement peak times",
      icon: Sparkles,
      shortcut: "AI W",
      action: () => { alert("Smart Send Recommendation: Peak audience engagement starts Saturdays at 10:30 AM."); setIsOpen(false); },
    },
  ];

  // Filter commands based on search query
  const filteredCommands = commands.filter((cmd) =>
    cmd.title.toLowerCase().includes(search.toLowerCase()) ||
    (cmd.subtitle && cmd.subtitle.toLowerCase().includes(search.toLowerCase())) ||
    cmd.category.toLowerCase().includes(search.toLowerCase())
  );

  // Handle keyboard navigation inside the palette list
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex]);

  // Click outside to close
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener("mousedown", handleOutsideClick);
    }
    return () => window.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen]);

  return (
    <>
      {/* Floating Status Bar / Keyboard shortcut helper at screen footer - Hidden on Mobile */}
      <div className="fixed bottom-4 right-4 z-40 bg-zinc-950/80 backdrop-blur-md border border-white/[0.04] rounded-md px-3 py-1.5 hidden md:flex items-center gap-2 text-[10px] font-mono text-zinc-500 font-semibold uppercase pointer-events-auto select-none shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
        <span className="flex items-center gap-1">
          <Terminal className="w-3 h-3 text-[#7C5CFF]" />
          <span>Press</span>
        </span>
        <kbd className="px-1.5 py-0.5 rounded bg-zinc-900 border border-white/[0.06] text-zinc-300">⌘</kbd>
        <span>+</span>
        <kbd className="px-1.5 py-0.5 rounded bg-zinc-900 border border-white/[0.06] text-zinc-300">K</kbd>
        <span>to operate command center</span>
      </div>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[10000] flex items-start justify-center pt-[15vh] px-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -8 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              ref={containerRef}
              className="w-full max-w-xl bg-[#090a0f] border border-white/[0.08] rounded-xl overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.8),0_0_1px_rgba(124,92,255,0.4)] flex flex-col"
            >
              {/* Search Bar */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.06] bg-zinc-950/40 relative">
                <Search className="w-4 h-4 text-zinc-500 shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Type a command or query..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setSelectedIndex(0);
                  }}
                  className="w-full bg-transparent border-none outline-none focus:ring-0 text-zinc-200 placeholder-zinc-600 text-[13px] font-mono"
                />
                <span className="text-[9px] text-zinc-600 font-mono font-bold uppercase border border-white/[0.04] px-1.5 py-0.5 rounded">
                  ESC to exit
                </span>
              </div>

              {/* Suggestions list */}
              <div className="max-h-[340px] overflow-y-auto p-2 space-y-1.5 scrollbar-thin">
                {filteredCommands.length > 0 ? (
                  <>
                    {/* Render Grouped Sections */}
                    {(["navigation", "actions", "ai"] as const).map((cat) => {
                      const catCmds = filteredCommands.filter((c) => c.category === cat);
                      if (catCmds.length === 0) return null;
                      return (
                        <div key={cat} className="space-y-1">
                          <div className="px-3 pt-2 pb-1 text-[9px] font-bold font-mono text-zinc-500 uppercase tracking-widest flex items-center justify-between">
                            <span>
                              {cat === "navigation" && "Navigation Contexts"}
                              {cat === "actions" && "Quick System Actions"}
                              {cat === "ai" && "AI Infrastructure Operations"}
                            </span>
                            {cat === "ai" && <Sparkles className="w-2.5 h-2.5 text-[#7C5CFF]" />}
                          </div>

                          {catCmds.map((cmd) => {
                            const globalIdx = filteredCommands.indexOf(cmd);
                            const isSelected = selectedIndex === globalIdx;
                            const Icon = cmd.icon;

                            return (
                              <button
                                key={cmd.id}
                                onClick={cmd.action}
                                onMouseEnter={() => setSelectedIndex(globalIdx)}
                                className={`w-full text-left px-3.5 py-2 rounded-lg flex items-center justify-between gap-4 transition duration-150 relative border ${
                                  isSelected
                                    ? "bg-[#7C5CFF]/10 border-[#7C5CFF]/20 text-white"
                                    : "bg-transparent border-transparent text-zinc-400"
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className={`p-1.5 rounded-md ${
                                    isSelected 
                                      ? "bg-[#7C5CFF]/15 text-[#7C5CFF]" 
                                      : "bg-zinc-950 border border-white/[0.04] text-zinc-500"
                                  }`}>
                                    <Icon className="w-3.5 h-3.5" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-[12px] font-bold tracking-tight">{cmd.title}</p>
                                    {cmd.subtitle && (
                                      <p className="text-[10px] text-zinc-500 mt-0.5 truncate font-mono">{cmd.subtitle}</p>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  {cmd.shortcut && (
                                    <span className="text-[9px] font-mono font-semibold text-zinc-600 bg-zinc-950 px-2 py-0.5 rounded border border-white/[0.04]">
                                      {cmd.shortcut}
                                    </span>
                                  )}
                                  {isSelected && (
                                    <ArrowRight className="w-3 h-3 text-[#7C5CFF]" />
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      );
                    })}
                  </>
                ) : (
                  <div className="text-center py-8 font-mono text-[11px] text-zinc-600 uppercase">
                    No operations match your query.
                  </div>
                )}
              </div>

              {/* Footer status bar */}
              <div className="px-4 py-2 bg-zinc-950 border-t border-white/[0.06] flex items-center justify-between text-[9px] font-mono text-zinc-600 uppercase font-semibold">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1"><kbd className="px-1 py-0.2 bg-zinc-900 border border-white/[0.04] rounded">↑↓</kbd> Navigate</span>
                  <span className="flex items-center gap-1"><kbd className="px-1 py-0.2 bg-zinc-900 border border-white/[0.04] rounded">Enter</kbd> Select</span>
                </div>
                <span>Mission Control System active</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
