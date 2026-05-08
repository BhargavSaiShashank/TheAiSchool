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
  Globe,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

const performanceData = [
  { name: "Mon", Sent: 1200, Opens: 840, Clicks: 240 },
  { name: "Tue", Sent: 2400, Opens: 1800, Clicks: 520 },
  { name: "Wed", Sent: 1800, Opens: 1420, Clicks: 390 },
  { name: "Thu", Sent: 4500, Opens: 3200, Clicks: 880 },
  { name: "Fri", Sent: 3200, Opens: 2600, Clicks: 720 },
  { name: "Sat", Sent: 1500, Opens: 1100, Clicks: 310 },
  { name: "Sun", Sent: 5000, Opens: 4100, Clicks: 1245 },
];

const topCampaigns = [
  { id: "1", name: "Welcome Onboarding Campaign", recipients: 4250, openRate: "82.4%", clickRate: "39.1%", status: "Active", risk: "Low" },
  { id: "2", name: "May Product Newsletter",      recipients: 5800, openRate: "61.8%", clickRate: "20.5%", status: "Active", risk: "Low" },
  { id: "3", name: "AI Hackathon Launch Invite",  recipients: 3200, openRate: "58.2%", clickRate: "18.3%", status: "Optimizing", risk: "Moderate" },
];

const initialActivities = [
  { id: "a1", type: "opened",       contact: "aravind.k@theaischool.co",  campaign: "Welcome Onboarding",    time: "Just now",   country: "IN" },
  { id: "a2", type: "clicked",      contact: "priya.sharma@techcorp.com", campaign: "May Product Newsletter", time: "2 min ago",  country: "IN" },
  { id: "a3", type: "delivered",    contact: "rahul.nair@innovate.co",    campaign: "Welcome Onboarding",    time: "10 min ago", country: "US" },
  { id: "a4", type: "unsubscribed", contact: "vikram.r@ventures.io",      campaign: "Tech Newsletter",        time: "1 hr ago",   country: "SG" },
  { id: "a5", type: "bounced",      contact: "bounced@badhost.com",       campaign: "Welcome Onboarding",    time: "3 hr ago",   country: "UK" },
];

const aiInsights = [
  { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-950/30 border-amber-900/30", message: "Complaint velocity rising in Onboarding Campaign — optimize mobile footer CTA." },
  { icon: Zap,           color: "text-[#7C5CFF]", bg: "bg-[#7C5CFF]/10 border-[#7C5CFF]/20", message: "Gmail engagement improved +18% — DKIM alignment verified & confirmed." },
  { icon: ShieldCheck,   color: "text-emerald-400", bg: "bg-emerald-950/20 border-emerald-900/30", message: "Bounce rate 1.4% — safely below the 2.0% ISP blacklist threshold." },
];

export default function DashboardPage() {
  const { user } = useStore();
  const [activities, setActivities] = useState(initialActivities);
  const [copilotQuery, setCopilotQuery] = useState("");
  const [copilotResponse, setCopilotResponse] = useState<any | null>(null);
  const [copilotGenerating, setCopilotGenerating] = useState(false);

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

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("pulsesend:ready"));
    }

    const contacts  = ["sneha.patel@designers.in", "amit.sen@financehub.com", "john.doe@example.com", "jane.smith@example.com"];
    const campaigns = ["Welcome Onboarding Campaign", "May Product Newsletter", "Summer Promotion Blast"];
    const types     = ["opened", "clicked", "delivered"];
    const countries = ["IN", "US", "UK", "SG", "DE"];

    const interval = setInterval(() => {
      const newActivity = {
        id: `a-${Date.now()}`,
        type:     types[Math.floor(Math.random() * types.length)],
        contact:  contacts[Math.floor(Math.random() * contacts.length)],
        campaign: campaigns[Math.floor(Math.random() * campaigns.length)],
        time:     "Just now",
        country:  countries[Math.floor(Math.random() * countries.length)],
      };
      setActivities((prev) =>
        [newActivity, ...prev.map((a) => (a.time === "Just now" ? { ...a, time: "1 min ago" } : a))].slice(0, 5)
      );
    }, 9000);

    return () => clearInterval(interval);
  }, []);

  // ── KPI card data ────────────────────────────────────────────────────────────
  const stats = [
    { label: "Total Audience",     value: "12,450", sub: "+12.4% last 30 days",   icon: Users,              accent: "text-[#7C5CFF]", borderAccent: "hover:border-[#7C5CFF]/30" },
    { label: "Emails Dispatched",  value: "48,230", sub: "+28.1% this month",      icon: Send,               accent: "text-[#7C5CFF]", borderAccent: "hover:border-[#7C5CFF]/30" },
    { label: "Avg. Open Rate",     value: "68.2%",  sub: "Industry avg: 21%",      icon: MailOpen,           accent: "text-emerald-400", borderAccent: "hover:border-emerald-900/40" },
    { label: "Avg. Click Rate",    value: "24.5%",  sub: "Industry avg: 2.5%",     icon: MousePointerClick,  accent: "text-emerald-400", borderAccent: "hover:border-emerald-900/40" },
    { label: "Deliverability",     value: "99.86%", sub: "Validated across 48k",   icon: ShieldCheck,        accent: "text-[#7C5CFF]", borderAccent: "hover:border-[#7C5CFF]/30" },
    { label: "Bounce Rate",        value: "1.4%",   sub: "Safe zone — limit 2.0%", icon: AlertOctagon,       accent: "text-amber-400", borderAccent: "hover:border-amber-900/40" },
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

      {/* ─── 2. KPI METRICS GRID (6 cards, 3-col on md, 6-col on xl) ────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1], delay: i * 0.03 }}
            className={`p-4 bg-zinc-950/20 backdrop-blur-md border border-white/[0.03] rounded-lg flex flex-col justify-between transition-all duration-300 group cursor-default shadow-[inset_0_1px_1px_rgba(255,255,255,0.01),0_8px_30px_rgba(0,0,0,0.5)] hover:border-[#7C5CFF]/30 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(124,92,255,0.03)]`}
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

        {/* Sending Trends — spans 2 cols */}
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
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="gSent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#7C5CFF" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#7C5CFF" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gOpens" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.14} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#3f3f46" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#3f3f46" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: "#0e0f12", borderColor: "#27272a", borderRadius: "6px", fontSize: "12px" }}
                  labelStyle={{ fontWeight: "bold", color: "#f4f4f5" }}
                  itemStyle={{ color: "#a1a1aa" }}
                />
                <Area type="monotone" dataKey="Sent"  stroke="#7C5CFF" strokeWidth={2} fillOpacity={1} fill="url(#gSent)"  />
                <Area type="monotone" dataKey="Opens" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#gOpens)" />
              </AreaChart>
            </ResponsiveContainer>
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

          <div className="flex-1 space-y-3 overflow-y-auto pr-1">
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
