"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowLeft,
  MailOpen,
  MousePointerClick,
  Send,
  AlertTriangle,
  ShieldAlert,
  Calendar,
  Activity,
  Monitor,
  ExternalLink,
  Search,
  DownloadCloud,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import Preloader from "@/components/Preloader";
import CardSpotlight from "@/components/CardSpotlight";

export default function CampaignReportPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchReport = async () => {
      try {
        const res = await fetch(`/api/campaigns/${id}/report`);
        if (!res.ok) throw new Error("Campaign report not accessible.");
        const json = await res.json();
        setData(json);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchReport();
  }, [id]);

  if (isLoading) return <Preloader />;
  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#08080C] flex flex-col items-center justify-center text-white">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
        <p>{error || "Report not found."}</p>
        <Link
          href="/campaigns"
          className="mt-4 text-indigo-400 hover:underline flex items-center gap-2"
        >
          <ArrowLeft size={16} /> Back to Campaigns
        </Link>
      </div>
    );
  }

  const { campaign, metrics, charts, recentActivity } = data;
  const COLORS = ["#6366F1", "#EC4899", "#10B981", "#F59E0B"];

  return (
    <div className="min-h-screen bg-[#08080C] pb-20 px-6 pt-10">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-10"
      >
        <div>
          <button
            onClick={() => router.push("/campaigns")}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-3 text-sm"
          >
            <ArrowLeft size={16} /> Back to campaigns list
          </button>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            {campaign.name}
            <span className="px-3 py-1 text-xs rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 uppercase font-semibold">
              {campaign.status}
            </span>
          </h1>
          <p className="text-zinc-400 mt-1 font-mono text-sm tracking-tight">
            Subject: "{campaign.subject}"
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10 transition-all flex items-center gap-2 font-medium text-sm">
            <DownloadCloud size={16} />
            Export CSV
          </button>
        </div>
      </motion.div>

      {/* Top KPI HUD Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <KPICard
          title="Total Dispatched"
          value={metrics.sent.toLocaleString()}
          icon={Send}
          color="#6366f1"
          trend="Volume"
        />
        <KPICard
          title="Total Opens"
          value={metrics.opens.toLocaleString()}
          subValue={`${metrics.openRate}% rate`}
          icon={MailOpen}
          color="#a855f7"
          trend="Engagement"
        />
        <KPICard
          title="Unique Clicks"
          value={metrics.clicks.toLocaleString()}
          subValue={`${metrics.clickRate}% CTR`}
          icon={MousePointerClick}
          color="#ec4899"
          trend="Intent"
        />
        <KPICard
          title="Bounces / Complaints"
          value={`${metrics.bounces} / ${metrics.complaints}`}
          icon={ShieldAlert}
          color="#f43f5e"
          trend="Quality"
          isBad={metrics.bounces > 0}
        />
      </div>

      {/* Visual Graphs Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Massive Performance Timeline */}
        <div className="lg:col-span-2">
          <CardSpotlight className="h-[400px] p-6 relative border-indigo-500/20">
            <h3 className="text-white font-semibold flex items-center gap-2 mb-6">
              <Activity size={18} className="text-indigo-400" />
              Hourly Engagement Timeline
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts.timeline}>
                  <defs>
                    <linearGradient id="colOpen" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colClick" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="time"
                    stroke="#52525b"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#52525b"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#18181B",
                      border: "1px solid #27272A",
                      color: "#FFF",
                      borderRadius: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="opens"
                    stroke="#6366f1"
                    fillOpacity={1}
                    fill="url(#colOpen)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="clicks"
                    stroke="#ec4899"
                    fillOpacity={1}
                    fill="url(#colClick)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardSpotlight>
        </div>

        {/* Device Demographics (Doughnut) */}
        <div>
          <CardSpotlight className="h-[400px] p-6 flex flex-col border-white/5">
            <h3 className="text-white font-semibold flex items-center gap-2 mb-6">
              <Monitor size={18} className="text-cyan-400" />
              Hardware Demographics
            </h3>
            <div className="flex-1 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.devices}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {charts.devices.map((entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#18181B",
                      border: "1px solid #27272A",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-2">
              {charts.devices.map((dev: any, i: number) => (
                <div
                  key={dev.name}
                  className="flex items-center gap-2 text-xs text-zinc-400"
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: COLORS[i] }}
                  />
                  {dev.name} ({dev.value})
                </div>
              ))}
            </div>
          </CardSpotlight>
        </div>
      </div>

      {/* Link Click Heatmap & Activity Feed */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Click Heatmap Table */}
        <CardSpotlight className="p-6 border-white/5">
          <h3 className="text-white font-semibold flex items-center gap-2 mb-5">
            <ExternalLink size={18} className="text-purple-400" />
            Link-Click Distribution Heatmap
          </h3>

          <div className="overflow-hidden rounded-xl border border-white/5 bg-black/20">
            {charts.links.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-sm">
                No tracked link clicks recorded yet.
              </div>
            ) : (
              <table className="w-full text-sm text-left text-zinc-400">
                <thead className="bg-white/5 text-xs uppercase tracking-wider font-bold text-zinc-300">
                  <tr>
                    <th className="px-6 py-3">Target URL</th>
                    <th className="px-6 py-3 text-right">Interaction Volume</th>
                  </tr>
                </thead>
                <tbody>
                  {charts.links.map((link: any, idx: number) => (
                    <tr
                      key={idx}
                      className="border-t border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4 font-mono text-xs truncate max-w-md">
                        {link.url}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-white">
                        {link.clicks}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </CardSpotlight>

        {/* Micro Activity Log */}
        <CardSpotlight className="p-6 border-white/5">
          <h3 className="text-white font-semibold flex items-center gap-2 mb-5">
            <Search size={18} className="text-orange-400" />
            Real-Time Event Streaming
          </h3>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {recentActivity.length === 0 ? (
              <div className="text-zinc-500 text-center text-sm py-10">
                Listening for inbound stream events...
              </div>
            ) : (
              recentActivity.map((ev: any) => (
                <div
                  key={ev.id}
                  className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${ev.event_type === "opened" ? "bg-indigo-400" : "bg-pink-500"}`}
                    />
                    <div>
                      <p className="text-zinc-200 text-xs font-medium">
                        {ev.contact.email}
                      </p>
                      <p className="text-zinc-500 text-[10px]">
                        {new Date(ev.occurred_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-xs capitalize px-2 py-0.5 rounded ${ev.event_type === "opened" ? "bg-indigo-500/10 text-indigo-400" : "bg-pink-500/10 text-pink-400"}`}
                  >
                    {ev.event_type}
                  </span>
                </div>
              ))
            )}
          </div>
        </CardSpotlight>
      </div>
    </div>
  );
}

// Visual Metric Tile Utility
function KPICard({
  title,
  value,
  subValue,
  icon: Icon,
  color,
  trend,
  isBad = false,
}: any) {
  return (
    <CardSpotlight className="p-6 relative group transition-all hover:border-white/20 border-white/5">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-zinc-400 text-xs font-medium tracking-wider uppercase flex items-center gap-2">
            {title}
          </p>
          <h2
            className={`text-3xl font-bold tracking-tight mt-1 ${isBad ? "text-red-400" : "text-white"}`}
          >
            {value}
          </h2>
          {subValue && <p className="text-zinc-500 text-xs mt-1">{subValue}</p>}
        </div>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{
            backgroundColor: `${color}15`,
            border: `1px solid ${color}30`,
          }}
        >
          <Icon size={18} style={{ color }} />
        </div>
      </div>
      <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden mt-4">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 1, delay: 0.2 }}
          className="h-full bg-gradient-to-r"
          style={{
            backgroundImage: `linear-gradient(to right, ${color}, transparent)`,
          }}
        />
      </div>
    </CardSpotlight>
  );
}
