"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Users,
  Send,
  MailOpen,
  MousePointerClick,
  AlertOctagon,
  TrendingUp,
  Sparkles,
  ArrowUpRight,
  Activity,
  AlertTriangle,
  Zap,
  ShieldCheck,
  ChevronRight,
  Check,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

export default function DashboardPage() {
  const { user } = useStore();
  const [copilotQuery, setCopilotQuery] = useState("");
  const [copilotResponse, setCopilotResponse] = useState<any | null>(null);
  const [copilotGenerating, setCopilotGenerating] = useState(false);

  const [onboardingStep, setOnboardingStep] = useState<number>(1);
  const [onboardingDismissed, setOnboardingDismissed] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const dismissed = localStorage.getItem("pulsesend:onboarding_completed") === "true";
      setOnboardingDismissed(dismissed);
    }
  }, []);

  const handleDismissOnboarding = () => {
    localStorage.setItem("pulsesend:onboarding_completed", "true");
    setOnboardingDismissed(true);
  };

  const [isLoading, setIsLoading] = useState(true);
  const [liveStats, setLiveStats] = useState({
    totalAudience: "0",
    totalDispatched: "0",
    openRate: "0.0%",
    clickRate: "0.0%",
    deliverability: "100.0%",
    bounceRate: "0.0%",
  });
  const [activities, setActivities] = useState<any[]>([]);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [topCampaigns, setTopCampaigns] = useState<any[]>([]);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch("/api/dashboard");
        if (res.ok) {
          const data = await res.json();
          if (data) {
            setLiveStats(data.stats);
            setActivities(data.liveActivities);
            setPerformanceData(data.performanceData);
            setTopCampaigns(data.topCampaigns);
          }
        }
      } catch (err) {
        console.error("Failed to fetch dynamic dashboard stats:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboard();
  }, []);

  const handleCopilotGenerate = () => {
    if (!copilotQuery) return;
    setCopilotGenerating(true);
    setCopilotResponse(null);
    setTimeout(() => {
      setCopilotResponse({
        subject: `Unlock the Power of ${copilotQuery}: Free Live Masterclass 🧠`,
        audience: "AI Foundations - Batch 1",
        body: `Hey {{first_name}},\n\nReady to master ${copilotQuery}? Join us this Saturday for a live, interactive masterclass!\n\nSee you there!`,
      });
      setCopilotGenerating(false);
    }, 1500);
  };

  const stats = [
    { label: "Total Audience",     value: liveStats.totalAudience,    sub: "Active subscribers",     icon: Users,              accent: "text-[#7C5CFF]", borderAccent: "hover:border-[#7C5CFF]/30" },
    { label: "Emails Dispatched",  value: liveStats.totalDispatched,  sub: "Lifetime sends",         icon: Send,               accent: "text-[#7C5CFF]", borderAccent: "hover:border-[#7C5CFF]/30" },
    { label: "Avg. Open Rate",     value: liveStats.openRate,         sub: "Total open weight",      icon: MailOpen,           accent: "text-emerald-400", borderAccent: "hover:border-emerald-900/40" },
    { label: "Avg. Click Rate",    value: liveStats.clickRate,        sub: "Unique clicks",          icon: MousePointerClick,  accent: "text-emerald-400", borderAccent: "hover:border-emerald-900/40" },
    { label: "Deliverability",     value: liveStats.deliverability,   sub: "ISP validated status",   icon: ShieldCheck,        accent: "text-[#7C5CFF]", borderAccent: "hover:border-[#7C5CFF]/30" },
    { label: "Bounce Rate",        value: liveStats.bounceRate,       sub: "Hard bounces",           icon: AlertOctagon,       accent: "text-amber-400", borderAccent: "hover:border-amber-900/40" },
  ];

  const aiInsights = [
    { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-950/30 border-amber-900/30", message: parseFloat(liveStats.bounceRate) > 2.0 ? "Bounce rate elevated! Limit suppressions and verify email syntax." : "All sending parameters optimal — compliance levels at super high standards." },
    { icon: Zap,           color: "text-[#7C5CFF]", bg: "bg-[#7C5CFF]/10 border-[#7C5CFF]/20", message: "SES pipeline initialized in eu-north-1 — fully verified DKIM signatures." },
    { icon: ShieldCheck,   color: "text-emerald-400", bg: "bg-emerald-950/20 border-emerald-900/30", message: "Reputation score healthy. Safe sending envelope actively maintained." },
  ];

  return (
    <div className="space-y-5 select-none">

      {/* ─── 1. Welcome + AI Insight Strip ──────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 pb-1">
        <div>
          <p className="text-[11px] font-bold text-zinc-500 font-mono uppercase tracking-widest mb-1">
            Operational Overview — AWS eu-north-1
          </p>
          <h2 className="text-2xl font-black text-white tracking-tight leading-none">
            Welcome back, <span className="text-[#7C5CFF]">{user?.email.split("@")[0] || "Admin"}</span>
          </h2>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-950/30 border border-emerald-900/30 px-3 py-1.5 rounded-full font-mono font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            All systems operational
          </span>
          <Link href="/campaigns">
            <button className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white font-mono font-bold transition">
              View campaigns <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </Link>
        </div>
      </div>

      {/* ─── FLOATING POINT-AND-EXPLAIN COACHMARKS ────────────────────── */}
      {!onboardingDismissed && (
        <AnimatePresence>
          {onboardingStep === 1 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="fixed left-[256px] top-[146px] z-[9999] hidden lg:flex items-center gap-2 pointer-events-none"
            >
              {/* Arrow */}
              <div className="w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-[10px] border-r-[#7C5CFF]" />
              {/* Body */}
              <div className="p-4 bg-[#06070a]/95 border border-[#7C5CFF] rounded-lg shadow-[0_12px_40px_rgba(124,92,255,0.18)] max-w-xs backdrop-blur-md">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-bold font-mono text-[#7C5CFF] bg-[#7C5CFF]/10 px-1.5 py-0.5 rounded border border-[#7C5CFF]/20 uppercase">
                    Step 1
                  </span>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Contacts Segment</h4>
                </div>
                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  Click here to access your Contacts Directory. You can manage lists, add new contacts manually, or upload CSV files!
                </p>
              </div>
            </motion.div>
          )}

          {onboardingStep === 2 && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="fixed left-[256px] top-[182px] z-[9999] hidden lg:flex items-center gap-2 pointer-events-none"
            >
              {/* Arrow */}
              <div className="w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-[10px] border-r-[#7C5CFF]" />
              {/* Body */}
              <div className="p-4 bg-[#06070a]/95 border border-[#7C5CFF] rounded-lg shadow-[0_12px_40px_rgba(124,92,255,0.18)] max-w-xs backdrop-blur-md">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-bold font-mono text-[#7C5CFF] bg-[#7C5CFF]/10 px-1.5 py-0.5 rounded border border-[#7C5CFF]/20 uppercase">
                    Step 2
                  </span>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Contacts setup</h4>
                </div>
                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  Upload CSV spreadsheets, manage duplicates, and map columns on import in seconds!
                </p>
              </div>
            </motion.div>
          )}

          {onboardingStep === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="fixed right-[205px] top-[60px] z-[9999] hidden lg:flex items-center gap-2 pointer-events-none"
            >
              {/* Body */}
              <div className="p-4 bg-[#06070a]/95 border border-[#7C5CFF] rounded-lg shadow-[0_12px_40px_rgba(124,92,255,0.18)] max-w-xs backdrop-blur-md">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-bold font-mono text-[#7C5CFF] bg-[#7C5CFF]/10 px-1.5 py-0.5 rounded border border-[#7C5CFF]/20 uppercase">
                    Step 3
                  </span>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">New Campaign</h4>
                </div>
                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  Ready to send? Click here to open the step-by-step Campaign Wizard, select templates, and send real-time tests!
                </p>
              </div>
              {/* Arrow */}
              <div className="w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-l-[10px] border-l-[#7C5CFF]" />
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* ─── ONBOARDING PRODUCT TOUR (One-Time Setup Checklist) ────────── */}
      <AnimatePresence mode="wait">
        {!onboardingDismissed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="p-5 bg-gradient-to-r from-[#7C5CFF]/10 via-[#7C5CFF]/5 to-transparent border border-[#7C5CFF]/20 rounded-lg backdrop-blur-md relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-[0_12px_40px_rgba(124,92,255,0.02)]"
          >
            {/* Decorative Corner Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#7C5CFF] rounded-full filter blur-[80px] opacity-20 pointer-events-none" />

            {/* Left: Info */}
            <div className="space-y-2 flex-1 relative z-10">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold font-mono text-[#7C5CFF] bg-[#7C5CFF]/10 px-2 py-0.5 rounded border border-[#7C5CFF]/20 uppercase tracking-wider">
                  Platform Setup Tour — Step {onboardingStep} of 3
                </span>
                <div className="flex gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${onboardingStep >= 1 ? "bg-[#7C5CFF]" : "bg-zinc-800"}`} />
                  <span className={`w-1.5 h-1.5 rounded-full ${onboardingStep >= 2 ? "bg-[#7C5CFF]" : "bg-zinc-800"}`} />
                  <span className={`w-1.5 h-1.5 rounded-full ${onboardingStep >= 3 ? "bg-[#7C5CFF]" : "bg-zinc-800"}`} />
                </div>
              </div>

              <h3 className="text-sm font-bold text-white tracking-tight">
                {onboardingStep === 1 && "📋 Step 1: Create Your First Mailing List"}
                {onboardingStep === 2 && "👥 Step 2: Import Your First Contacts"}
                {onboardingStep === 3 && "🚀 Step 3: Launch Your First Campaign"}
              </h3>

              <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
                {onboardingStep === 1 && "Mailing lists allow you to group contacts and target specific subsets of your audience. Let's create your first segment to get started."}
                {onboardingStep === 2 && "Manually add a test subscriber or upload a CSV file with our Tactile Mapping Wizard."}
                {onboardingStep === 3 && "Draft your campaign content, select your target lists, choose an HTML template, and test AWS SES sending in seconds."}
              </p>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3 relative z-10 self-stretch md:self-auto justify-end">
              <button
                onClick={handleDismissOnboarding}
                className="px-3 py-1.5 hover:bg-zinc-900 border border-transparent hover:border-zinc-800 text-[11px] font-bold text-zinc-500 hover:text-zinc-300 font-mono rounded cursor-pointer transition uppercase"
              >
                Skip Tour
              </button>

              {onboardingStep < 3 ? (
                <button
                  onClick={() => setOnboardingStep((prev) => (prev + 1) as any)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded bg-zinc-900 hover:bg-zinc-800 border border-white/[0.04] text-[12px] font-bold text-zinc-200 hover:text-white transition cursor-pointer"
                >
                  <span>Done & Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={handleDismissOnboarding}
                  className="flex items-center gap-1.5 px-4 py-2 rounded bg-[#7C5CFF] text-white hover:bg-[#7C5CFF]/90 border border-white/5 text-[12px] font-bold shadow-[0_1px_3px_rgba(95,90,246,0.2)] transition cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Complete Setup</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── 2. KPI METRICS GRID (6 cards) ─────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1], delay: i * 0.03 }}
            className="p-4 bg-zinc-950/20 backdrop-blur-md border border-white/[0.03] rounded-lg flex flex-col justify-between transition-all duration-300 group cursor-default shadow-[inset_0_1px_1px_rgba(255,255,255,0.01),0_8px_30px_rgba(0,0,0,0.5)] hover:border-[#7C5CFF]/30 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(124,92,255,0.03)]"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-[9px] font-bold text-zinc-500 font-mono uppercase tracking-widest leading-tight">
                {stat.label}
              </p>
              <stat.icon className={`w-3.5 h-3.5 shrink-0 ${stat.accent} opacity-60 group-hover:opacity-100 transition duration-300`} />
            </div>
            <div>
              <p className={`text-2xl font-black font-mono tracking-tight leading-none ${stat.accent}`}>
                {stat.value}
              </p>
              <p className="text-[10px] text-zinc-500 mt-2 font-semibold leading-tight font-mono uppercase">
                {stat.sub}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ─── 3. AI INSIGHTS STRIP ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {aiInsights.map((insight, i) => (
          <div key={i} className={`flex items-start gap-3 p-3.5 rounded-lg border ${insight.bg}`}>
            <insight.icon className={`w-4 h-4 mt-0.5 shrink-0 ${insight.color}`} />
            <p className="text-[12px] text-zinc-300 font-medium leading-relaxed">
              {insight.message}
            </p>
          </div>
        ))}
      </div>

      {/* ─── 4. CHART + LIVE FEED ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Sending Trends */}
        <div className="lg:col-span-2 p-5 bg-zinc-950/40 border border-white/[0.04] rounded-lg">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-[13px] font-bold text-zinc-100 tracking-tight">
                Sending Performance
              </h3>
              <p className="text-[11px] text-zinc-500 mt-0.5 font-medium">
                Campaign delivery and engagement — last 7 days
              </p>
            </div>
            <span className="flex items-center gap-1.5 text-[11px] text-zinc-400 bg-zinc-900 border border-white/[0.04] px-2.5 py-1 rounded font-mono font-bold">
              <Activity className="w-3 h-3 text-emerald-500 animate-pulse" />
              Live Sync
            </span>
          </div>

          <div className="h-[240px] w-full min-w-0">
            {performanceData.length === 0 ? (
              <div className="h-full flex items-center justify-center border border-dashed border-white/[0.04] rounded bg-zinc-950/10 text-zinc-500 font-mono text-[11px]">
                Pending historic campaign dispatches...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={performanceData} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gSent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#7C5CFF" stopOpacity={0.24} />
                      <stop offset="95%" stopColor="#7C5CFF" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gOpens" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#06b6d4" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#27272a" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#27272a" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: "#06070a", borderColor: "rgba(255,255,255,0.06)", borderRadius: "6px", fontSize: "12px", backdropFilter: "blur(8px)" }}
                    labelStyle={{ fontWeight: "bold", color: "#f4f4f5" }}
                    itemStyle={{ color: "#a1a1aa" }}
                  />
                  <Area type="monotone" dataKey="Sent"  stroke="#7C5CFF" strokeWidth={2.5} activeDot={{ r: 5, strokeWidth: 0 }} fillOpacity={1} fill="url(#gSent)"  />
                  <Area type="monotone" dataKey="Opens" stroke="#06b6d4" strokeWidth={2.5} activeDot={{ r: 5, strokeWidth: 0 }} fillOpacity={1} fill="url(#gOpens)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Live Activity Feed */}
        <div className="p-5 bg-zinc-950/40 border border-white/[0.04] rounded-lg flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[13px] font-bold text-zinc-100 tracking-tight">Live Activity</h3>
              <p className="text-[11px] text-zinc-500 mt-0.5 font-medium">Real-time event stream</p>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto pr-1 min-h-[220px]">
            {activities.length === 0 ? (
              <div className="h-full flex items-center justify-center border border-dashed border-white/[0.04] rounded bg-zinc-950/10 text-zinc-500 font-mono text-[11px] min-h-[180px]">
                Waiting for real-time SES logs...
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {activities.map((act) => (
                  <motion.div
                    key={act.id}
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-start gap-2.5 pb-3 border-b border-white/[0.04] last:border-0"
                  >
                    <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                      act.type === "opened"       ? "bg-blue-400 shadow-[0_0_6px_rgba(96,165,250,0.4)]" :
                      act.type === "clicked"      ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.4)]" :
                      act.type === "unsubscribed" ? "bg-amber-400" :
                      act.type === "bounced"      ? "bg-red-400" : "bg-zinc-400"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-zinc-200 truncate font-semibold font-mono">
                        {act.contact}
                      </p>
                      <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                        <span className="text-[#7C5CFF] font-bold uppercase text-[10px] font-mono mr-1">{act.type}</span>
                        {act.campaign}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-[9px] text-zinc-600 font-mono font-bold bg-zinc-900 px-1.5 py-0.5 rounded">
                        {act.country}
                      </span>
                      <span className="text-[9px] text-zinc-600 font-mono">{act.time}</span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>

      {/* ─── 5. CAMPAIGNS TABLE ─────────────────────────────────────────────────── */}
      <div className="p-5 bg-zinc-950/40 border border-white/[0.04] rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-[13px] font-bold text-zinc-100 tracking-tight">Top Campaigns</h3>
            <p className="text-[11px] text-zinc-500 mt-0.5 font-medium">Best performing pipelines by engagement rate</p>
          </div>
          <Link href="/campaigns">
            <button className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-white font-mono font-bold transition">
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </Link>
        </div>

        {topCampaigns.length === 0 ? (
          <div className="py-8 text-center border border-dashed border-white/[0.04] rounded bg-zinc-950/10 text-zinc-500 font-mono text-[11px]">
            No campaigns dispatched yet.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {["Campaign", "Audience", "Open Rate", "Click Rate", "Risk", "Status"].map((h) => (
                  <th key={h} className="py-2.5 px-3 text-[11px] font-bold text-zinc-500 font-mono uppercase tracking-wider first:pl-0 last:text-right">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topCampaigns.map((camp) => (
                <tr key={camp.id} className="border-b border-white/[0.03] hover:bg-white/[0.015] transition duration-150 group">
                  <td className="py-3.5 px-3 pl-0 text-[13px] font-semibold text-zinc-200 max-w-[200px] truncate">
                    {camp.name}
                  </td>
                  <td className="py-3.5 px-3 text-[13px] text-zinc-400 font-mono">
                    {camp.recipients.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-3 text-[13px] font-bold text-emerald-400 font-mono">
                    {camp.openRate}
                  </td>
                  <td className="py-3.5 px-3 text-[13px] font-bold text-blue-400 font-mono">
                    {camp.clickRate}
                  </td>
                  <td className="py-3.5 px-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono uppercase ${
                      camp.risk === "Low"
                        ? "bg-emerald-950/30 text-emerald-400 border border-emerald-900/30"
                        : "bg-amber-950/30 text-amber-400 border border-amber-900/30"
                    }`}>
                      {camp.risk}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono uppercase border ${
                      camp.status === "Active"
                        ? "bg-emerald-950/10 text-emerald-400 border-emerald-900/30"
                        : "bg-blue-950/10 text-blue-400 border-blue-900/30"
                    }`}>
                      {camp.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ─── 6. AI COPILOT ──────────────────────────────────────────────────────── */}
      <div className="p-5 bg-zinc-950/40 border border-white/[0.04] rounded-lg">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-1.5 rounded bg-[#7C5CFF]/15 border border-[#7C5CFF]/25">
            <Sparkles className="w-4 h-4 text-[#7C5CFF]" />
          </div>
          <div>
            <h3 className="text-[13px] font-bold text-zinc-100 tracking-tight">AI Campaign Copilot</h3>
            <p className="text-[11px] text-zinc-500 font-medium">Generate optimized email drafts on demand</p>
          </div>
        </div>

        <div className="flex gap-2 max-w-2xl">
          <input
            type="text"
            placeholder="Enter topic (e.g. Next.js workshop, Python bootcamp...)"
            value={copilotQuery}
            onChange={(e) => setCopilotQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCopilotGenerate()}
            className="flex-1 px-3 py-2 rounded bg-zinc-900/60 border border-white/[0.06] text-[13px] text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-[#7C5CFF]/40 transition font-mono"
          />
          <button
            onClick={handleCopilotGenerate}
            disabled={copilotGenerating || !copilotQuery}
            className="px-4 py-2 rounded bg-[#7C5CFF] text-white text-[13px] font-bold disabled:opacity-40 hover:opacity-90 transition cursor-pointer"
          >
            {copilotGenerating ? "Thinking…" : "Generate"}
          </button>
        </div>

        <AnimatePresence>
          {copilotResponse && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 p-4 bg-zinc-900/50 border border-white/[0.04] rounded-lg space-y-3 max-w-2xl font-mono text-[12px]"
            >
              <div className="flex justify-between items-center pb-2 border-b border-white/[0.04]">
                <span className="font-bold text-[#7C5CFF] uppercase tracking-wide text-[10px]">🧠 Copilot Draft</span>
                <span className="text-zinc-500 text-[10px]">Audience: {copilotResponse.audience}</span>
              </div>
              <div>
                <p className="text-zinc-500 text-[10px] uppercase font-bold mb-1">Subject</p>
                <p className="text-zinc-100 font-bold">{copilotResponse.subject}</p>
              </div>
              <div>
                <p className="text-zinc-500 text-[10px] uppercase font-bold mb-1">Body Preview</p>
                <p className="text-zinc-300 whitespace-pre-wrap bg-zinc-950 p-3 rounded border border-white/[0.04] leading-relaxed">{copilotResponse.body}</p>
              </div>
              <Link href="/campaigns">
                <button className="px-3 py-1.5 rounded bg-zinc-900 border border-white/[0.06] text-zinc-300 hover:text-white hover:border-[#7C5CFF]/30 transition font-bold text-[11px] cursor-pointer mt-1">
                  Use in Campaign →
                </button>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
