"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { UserProfile } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { Sliders, Building, ShieldAlert, Sparkles, Save, Check } from "lucide-react";

export default function ProfileSettingsPage() {
  const { user, login } = useStore();
  const [activeTab, setActiveTab] = useState<"personal" | "org">("personal");

  // Organization state fields
  const [orgName, setOrgName] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [region, setRegion] = useState("us-east-1");
  const [configSet, setConfigSet] = useState("");

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load organization details from API
  useEffect(() => {
    if (!user?.org_id) return;
    const fetchOrg = async () => {
      try {
        const res = await fetch(`/api/org?orgId=${user.org_id}`);
        if (res.ok) {
          const data = await res.json();
          setOrgName(data.name || "");
          setFromEmail(data.fromEmail || "");
          setRegion(data.region || "us-east-1");
          setConfigSet(data.configSet || "");
        }
      } catch (err) {
        console.error("Failed to load organization settings:", err);
      }
    };
    fetchOrg();
  }, [user]);

  // Save organization details to API
  const handleSaveOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch("/api/org", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-org-id": user?.org_id || "",
        },
        body: JSON.stringify({
          orgId: user?.org_id,
          name: orgName,
          fromEmail,
          region,
          configSet,
        }),
      });

      if (res.ok) {
        if (user) {
          login({
            ...user,
            org_name: orgName,
          });
        }
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Failed to update organization details:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 select-none max-h-screen overflow-y-auto pb-12 pr-1">
      {/* ─── Header Section ────────────────────────────────────────────── */}
      <div className="flex items-start justify-between border-b border-zinc-900 pb-5">
        <div>
          <p className="text-[11px] font-bold text-zinc-500 font-mono uppercase tracking-widest mb-1">
            Account Management
          </p>
          <h2 className="text-2xl font-black text-white tracking-tight leading-none">
            My Profile & Settings
          </h2>
        </div>
      </div>

      {/* ─── Tab Selectors ────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 border-b border-zinc-900 pb-px">
        <button
          onClick={() => setActiveTab("personal")}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold font-mono transition border-b-2 -mb-px ${
            activeTab === "personal"
              ? "border-[#7C5CFF] text-white"
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          Identity & Security
        </button>

        <button
          onClick={() => setActiveTab("org")}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold font-mono transition border-b-2 -mb-px ${
            activeTab === "org"
              ? "border-[#7C5CFF] text-white"
              : "border-transparent text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          Organisation Context
        </button>
      </div>

      {/* ─── Tab 1: Personal Details & Security (Clerk) ──────────────── */}
      {activeTab === "personal" && (
        <div className="flex justify-center xl:justify-start w-full py-4">
          <div className="w-full max-w-4xl rounded-lg overflow-hidden border border-zinc-900 shadow-2xl">
            <UserProfile
              routing="hash"
              appearance={{
                baseTheme: dark,
                elements: {
                  cardBox: "border-none shadow-none w-full max-w-full",
                  card: "border-none bg-transparent shadow-none p-0 w-full max-w-full",
                  navbar: "hidden", // Hide navigation bar for absolute high-density focus
                  scrollBox: "p-4 md:p-6 w-full max-w-full",
                  page: "p-0 w-full max-w-full",
                },
              }}
            />
          </div>
        </div>
      )}

      {/* ─── Tab 2: Organisation Details (Custom DB integration) ─────── */}
      {activeTab === "org" && (
        <div className="max-w-2xl bg-zinc-950/20 border border-zinc-900/50 rounded-lg p-5 shadow-2xl relative overflow-hidden backdrop-blur-md">
          {/* Ambient Blob */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-radial-gradient(circle, rgba(124, 92, 255, 0.05) 0%, rgba(0, 0, 0, 0) 70%) rounded-full pointer-events-none" />

          <div className="flex items-center gap-2 mb-6">
            <div className="p-1.5 bg-[#7C5CFF]/10 rounded border border-[#7C5CFF]/20">
              <Sparkles className="w-4 h-4 text-[#7C5CFF]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight leading-none mb-1">
                Company Profile & Sending Config
              </h3>
              <p className="text-[11px] text-zinc-500 leading-none">
                Configure your company credentials and global AWS SES mail settings.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveOrg} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 font-mono uppercase tracking-wider mb-1.5">
                Organisation Name
              </label>
              <input
                type="text"
                required
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-[#7C5CFF]/40 rounded px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none transition font-sans"
                placeholder="e.g. PulseSend Inc."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 font-mono uppercase tracking-wider mb-1.5">
                  Default From Name
                </label>
                <input
                  type="text"
                  required
                  value={user?.email.split("@")[0] || ""}
                  disabled
                  className="w-full bg-zinc-900/20 border border-zinc-800/40 rounded px-3 py-2 text-xs text-zinc-500 cursor-not-allowed font-sans"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-400 font-mono uppercase tracking-wider mb-1.5">
                  Default From Email
                </label>
                <input
                  type="email"
                  required
                  value={fromEmail}
                  onChange={(e) => setFromEmail(e.target.value)}
                  className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-[#7C5CFF]/40 rounded px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none transition font-mono"
                  placeholder="e.g. newsletter@company.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 font-mono uppercase tracking-wider mb-1.5">
                  AWS Sending Region
                </label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-[#7C5CFF]/40 rounded px-3 py-2 text-xs text-white focus:outline-none transition font-mono"
                >
                  <option value="us-east-1">us-east-1 (N. Virginia)</option>
                  <option value="us-west-2">us-west-2 (Oregon)</option>
                  <option value="eu-west-1">eu-west-1 (Ireland)</option>
                  <option value="eu-north-1">eu-north-1 (Stockholm)</option>
                  <option value="ap-south-1">ap-south-1 (Mumbai)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-400 font-mono uppercase tracking-wider mb-1.5">
                  SES Configuration Set
                </label>
                <input
                  type="text"
                  value={configSet}
                  onChange={(e) => setConfigSet(e.target.value)}
                  className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-[#7C5CFF]/40 rounded px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none transition font-mono"
                  placeholder="e.g. pulsesend-events"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <p className="text-[10px] text-zinc-500 max-w-xs leading-normal">
                These settings directly affect multi-tenant envelope routing and AWS deliverability scores.
              </p>

              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1.5 text-[11px] font-bold font-mono text-black bg-white hover:bg-zinc-200 disabled:bg-zinc-800 disabled:text-zinc-600 px-4 py-2 rounded shadow-lg transition cursor-pointer"
              >
                {saving ? (
                  "Saving..."
                ) : saveSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    Saved!
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    Save Details
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
