"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3,
  Download,
  MousePointerClick,
  MailOpen,
  TrendingUp,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell,
} from "recharts";

// Mock Campaign reporting data matching seeded data
const campaignAReports = {
  name: "Welcome Onboarding Campaign",
  stats: [
    { name: "Total Sent", value: "4,250", icon: TrendingUp },
    { name: "Unique Opens", value: "3,502 (82.4%)", icon: MailOpen },
    { name: "Total Clicks", value: "1,661 (39.1%)", icon: MousePointerClick },
  ],
  openOverTime: [
    { time: "9:00 AM", Opens: 120 },
    { time: "11:00 AM", Opens: 340 },
    { time: "1:00 PM", Opens: 780 },
    { time: "3:00 PM", Opens: 1100 },
    { time: "5:00 PM", Opens: 840 },
    { time: "7:00 PM", Opens: 322 },
  ],
  browserData: [
    { name: "Chrome", value: 55, color: "#3b82f6" },
    { name: "Safari", value: 30, color: "#10b981" },
    { name: "Firefox", value: 10, color: "#f59e0b" },
    { name: "Others", value: 5, color: "#6b7280" },
  ],
  linksTable: [
    { url: "https://pulsesend.com/welcome", clicks: 1240, unique: 980 },
    { url: "https://pulsesend.com/docs", clicks: 421, unique: 312 },
  ],
};

const campaignBReports = {
  name: "May Product Tech Newsletter",
  stats: [
    { name: "Total Sent", value: "5,800", icon: TrendingUp },
    { name: "Unique Opens", value: "3,584 (61.8%)", icon: MailOpen },
    { name: "Total Clicks", value: "1,189 (20.5%)", icon: MousePointerClick },
  ],
  openOverTime: [
    { time: "9:00 AM", Opens: 80 },
    { time: "11:00 AM", Opens: 210 },
    { time: "1:00 PM", Opens: 520 },
    { time: "3:00 PM", Opens: 890 },
    { time: "5:00 PM", Opens: 1250 },
    { time: "7:00 PM", Opens: 634 },
  ],
  browserData: [
    { name: "Chrome", value: 62, color: "#3b82f6" },
    { name: "Safari", value: 25, color: "#10b981" },
    { name: "Firefox", value: 8, color: "#f59e0b" },
    { name: "Others", value: 5, color: "#6b7280" },
  ],
  linksTable: [
    { url: "https://pulsesend.com/blog/ai-agents", clicks: 920, unique: 710 },
    { url: "https://pulsesend.com/blog/nextjs15", clicks: 269, unique: 180 },
  ],
};

export default function AnalyticsPage() {
  const [selectedCampaign, setSelectedCampaign] = useState<"A" | "B">("A");
  const data = selectedCampaign === "A" ? campaignAReports : campaignBReports;

  const handleExportCSV = () => {
    alert("Simulating export: Campaigns report dataset compiled successfully and downloading in background.");
  };

  return (
    <div className="space-y-5 select-none">
      {/* Campaign Selector Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[15px] font-bold text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-zinc-400" />
            <span>Campaign Reporting Analytics</span>
          </h2>
          <p className="text-[12px] text-zinc-500 mt-0.5">Visualize user engagement and deliverability metrics per dispatch</p>
        </div>

        <div className="flex items-center gap-3.5 w-full sm:w-auto shrink-0">
          <select
            value={selectedCampaign}
            onChange={(e) => setSelectedCampaign(e.target.value as "A" | "B")}
            className="px-3.5 py-2 rounded bg-zinc-900 border border-border text-[13px] text-zinc-300 font-semibold focus:outline-none"
          >
            <option value="A">Welcome Onboarding Campaign</option>
            <option value="B">May Product Tech Newsletter</option>
          </select>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded bg-zinc-900 border border-border hover:border-zinc-700 text-muted-foreground hover:text-foreground text-[13px] font-mono font-bold transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {data.stats.map((stat, idx) => (
          <div key={idx} className="p-5 bg-card border border-border rounded-md flex items-center gap-4 hover:border-zinc-700 transition">
            <div className="p-2 bg-secondary rounded border border-border text-muted-foreground">
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider font-mono">{stat.name}</p>
              <p className="text-2xl font-extrabold text-foreground mt-1 font-mono">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Graphs Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Open Rate over time line chart */}
        <div className="p-6 bg-card border border-border rounded-md shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="text-[13px] font-bold text-foreground tracking-tight">Unique Opens Over Time</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Campaign unique openings mapped by hourly timestamps</p>
          </div>

          <div className="h-72 w-full mt-5 min-w-0" style={{ minHeight: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.openOverTime} margin={{ top: 0, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorOpensChart" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.08} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#52525b" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: "#0c0c0e", borderColor: "#1f1f23", borderRadius: "6px" }}
                  labelStyle={{ fontSize: "12px", fontWeight: "bold", color: "#fff" }}
                  itemStyle={{ fontSize: "12px", color: "#a1a1aa" }}
                />
                <Area type="monotone" dataKey="Opens" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorOpensChart)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Browser breakdown Pie-bar breakdown */}
        <div className="p-6 bg-card border border-border rounded-md shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-[13px] font-bold text-foreground tracking-tight">User Agent Distribution</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Browser client breakdown by unique percentage</p>
          </div>

          <div className="h-44 w-full mt-5 min-w-0" style={{ minHeight: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.browserData} layout="vertical" margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="#a1a1aa" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: "#0c0c0e", borderColor: "#1f1f23", borderRadius: "6px" }}
                  itemStyle={{ fontSize: "12px", color: "#fff" }}
                />
                <Bar dataKey="value" radius={4} barSize={12}>
                  {data.browserData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-between text-[11px] font-mono text-muted-foreground pt-4 border-t border-border/40">
            {data.browserData.map((b) => (
              <span key={b.name} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: b.color }} />
                <span>{b.name} ({b.value}%)</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Link map Table */}
      <div className="p-6 bg-card border border-border rounded-md shadow-sm">
        <div className="mb-4">
          <h3 className="text-[13px] font-bold text-foreground tracking-tight">Link Clicks Registry Map</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">Specific URLs clicked inside the campaign email</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border text-zinc-500 font-mono text-[11px] uppercase bg-secondary/10">
                <th className="py-3 px-4 font-semibold">Redirect URL Address</th>
                <th className="py-3 px-4 font-semibold text-right">Unique Clicks</th>
                <th className="py-3 px-4 font-semibold text-right">Total Clicks</th>
              </tr>
            </thead>
            <tbody>
              {data.linksTable.map((link, idx) => (
                <tr key={idx} className="border-b border-border/50 hover:bg-secondary/40 transition">
                  <td className="py-4 px-4 text-[13px] text-foreground truncate max-w-sm font-mono font-semibold">
                    {link.url}
                  </td>
                  <td className="py-4 px-4 text-right text-[13px] text-emerald-400 font-mono font-bold">
                    {link.unique}
                  </td>
                  <td className="py-4 px-4 text-right text-[13px] text-blue-400 font-mono font-bold">
                    {link.clicks}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
