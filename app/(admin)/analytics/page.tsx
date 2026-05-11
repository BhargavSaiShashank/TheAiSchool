"use client";

import { useEffect, useState } from "react";
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

export default function AnalyticsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");
  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch list of sent campaigns first
  useEffect(() => {
    async function fetchSentCampaigns() {
      try {
        const res = await fetch("/api/analytics");
        if (res.ok) {
          const list = await res.json();
          setCampaigns(list);
          if (list && list.length > 0) {
            setSelectedCampaignId(list[0].id);
          } else {
            setIsLoading(false);
          }
        }
      } catch (err) {
        console.error("Failed to fetch sent campaigns list:", err);
        setIsLoading(false);
      }
    }
    fetchSentCampaigns();
  }, []);

  // Fetch details when selected campaign ID changes
  useEffect(() => {
    if (!selectedCampaignId) return;

    async function fetchReport() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/analytics?id=${selectedCampaignId}`);
        if (res.ok) {
          const report = await res.json();
          setData(report);
        }
      } catch (err) {
        console.error("Failed to fetch campaign reporting metrics:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchReport();
  }, [selectedCampaignId]);

  const handlePrintPDF = () => {
    if (!data) return;
    // Native optimized route using standardized print layout overlays
    window.print();
  };

  if (campaigns.length === 0 && !isLoading) {
    return (
      <div className="space-y-5 select-none py-12 text-center">
        <div className="max-w-md mx-auto p-8 rounded-lg glass-hud space-y-4">
          <div className="p-4 rounded-full bg-secondary border border-border text-muted-foreground w-12 h-12 mx-auto flex items-center justify-center">
            <BarChart3 className="w-6 h-6 stroke-[1.5]" />
          </div>
          <div>
            <h3 className="text-[14px] font-bold text-foreground">
              No Analytics reports found
            </h3>
            <p className="text-[11px] text-muted-foreground mt-1 font-mono uppercase tracking-wider leading-relaxed">
              Dispatch an email campaign inside the Campaign Wizard to see deep
              delivery and engagement reporting analytics here.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!data || isLoading) {
    return (
      <div className="h-64 flex items-center justify-center text-[12px] font-mono text-muted-foreground uppercase tracking-widest">
        Loading campaign reports...
      </div>
    );
  }

  // Map icon properties dynamically
  const getIcon = (name: string) => {
    if (name === "Total Sent") return TrendingUp;
    if (name === "Unique Opens") return MailOpen;
    return MousePointerClick;
  };

  return (
    <div className="space-y-5 select-none">
      {/* Campaign Selector Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[15px] font-bold text-foreground tracking-tight flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
            <span>Campaign Reporting Analytics</span>
          </h2>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            Visualize user engagement and deliverability metrics per dispatch
          </p>
        </div>

        <div className="flex items-center gap-3.5 w-full sm:w-auto shrink-0">
          <select
            value={selectedCampaignId}
            onChange={(e) => setSelectedCampaignId(e.target.value)}
            className="px-3.5 py-2 rounded bg-secondary border border-border text-[13px] text-foreground font-semibold focus:outline-none"
          >
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <button
            onClick={handlePrintPDF}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded bg-[#7C5CFF] text-white hover:bg-[#7C5CFF]/90 shadow-[0_2px_5px_rgba(124,92,255,0.25)] text-[13px] font-bold transition cursor-pointer border border-white/10"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {data.stats.map((stat: any, idx: number) => {
          const Icon = getIcon(stat.name);
          return (
            <div
              key={idx}
              className="p-5 bg-card border border-border rounded-md flex items-center gap-4 hover:border-zinc-700 transition"
            >
              <div className="p-2 bg-secondary rounded border border-border text-muted-foreground">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider font-mono">
                  {stat.name}
                </p>
                <p className="text-2xl font-extrabold text-foreground mt-1 font-mono">
                  {stat.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Graphs Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Open Rate over time line chart */}
        <div className="p-6 bg-card border border-border rounded-md shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div>
            <h3 className="text-[13px] font-bold text-foreground tracking-tight">
              Unique Opens Over Time
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Campaign unique openings mapped by hourly timestamps
            </p>
          </div>

          <div className="h-72 w-full mt-5 min-w-0" style={{ minHeight: 280 }}>
            {isMounted && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                data={data.openOverTime}
                margin={{ top: 0, right: 10, left: -25, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="colorOpensChart"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.08} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="time"
                  stroke="#52525b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#52525b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "#0c0c0e",
                    borderColor: "#1f1f23",
                    borderRadius: "6px",
                  }}
                  labelStyle={{
                    fontSize: "12px",
                    fontWeight: "bold",
                    color: "#fff",
                  }}
                  itemStyle={{ fontSize: "12px", color: "#a1a1aa" }}
                />
                <Area
                  type="monotone"
                  dataKey="Opens"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorOpensChart)"
                />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Browser breakdown */}
        <div className="p-6 bg-card border border-border rounded-md shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-[13px] font-bold text-foreground tracking-tight">
              User Agent Distribution
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Browser client breakdown by unique percentage
            </p>
          </div>

          <div className="h-44 w-full mt-5 min-w-0" style={{ minHeight: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.browserData}
                layout="vertical"
                margin={{ top: 0, right: 10, left: -20, bottom: 0 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke="#a1a1aa"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "#0c0c0e",
                    borderColor: "#1f1f23",
                    borderRadius: "6px",
                  }}
                  itemStyle={{ fontSize: "12px", color: "#fff" }}
                />
                <Bar dataKey="value" radius={4} barSize={12}>
                  {data.browserData.map((entry: any, idx: number) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-between text-[11px] font-mono text-muted-foreground pt-4 border-t border-border/40">
            {data.browserData.map((b: any) => (
              <span key={b.name} className="flex items-center gap-1">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: b.color }}
                />
                <span>
                  {b.name} ({b.value}%)
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Link map Table */}
      <div className="p-6 bg-card border border-border rounded-md shadow-sm">
        <div className="mb-4">
          <h3 className="text-[13px] font-bold text-foreground tracking-tight">
            Link Clicks Registry Map
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Specific URLs clicked inside the campaign email
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border text-zinc-500 font-mono text-[11px] uppercase bg-secondary/10">
                <th className="py-3 px-4 font-semibold">
                  Redirect URL Address
                </th>
                <th className="py-3 px-4 font-semibold text-right">
                  Unique Clicks
                </th>
                <th className="py-3 px-4 font-semibold text-right">
                  Total Clicks
                </th>
              </tr>
            </thead>
            <tbody>
              {data.linksTable.map((link: any, idx: number) => (
                <tr
                  key={idx}
                  className="border-b border-border/50 hover:bg-secondary/40 transition"
                >
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

      {/* Print Specific Logic Injected Inline to guarantee zero-leak isolation */}
      <style>{`
        @media print {
          /* Hide all ambient layout noise: sidebars, user panels, selection triggers */
          nav, aside, .sidebar-node, .header-node, header, button, select { display: none !important; }
          
          /* Force layout into full-width paper geometry */
          body, main, div#__next { background: #ffffff !important; color: #000000 !important; padding: 0 !important; margin: 0 !important; overflow: visible !important; float: none !important; width: 100% !important; }
          
          /* Invert dark dashboard to print-friendly high-contrast light mode */
          .bg-card, .glass-hud, .glass {
             background: #ffffff !important; 
             border: 1px solid #e0e0e0 !important; 
             box-shadow: none !important;
             color: #000000 !important;
          }
          
          h2, h3, p, td, th { color: #111111 !important; }
          
          /* Conserve chart saturation for final ink layout */
          * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
          
          /* Forced separation for grid systems */
          .grid { display: block !important; }
          .grid > div { margin-bottom: 20px !important; page-break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}
