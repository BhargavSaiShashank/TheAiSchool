"use client";

import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { motion } from "framer-motion";
import { Building, Save, Cloud, Check } from "lucide-react";

export default function OrgSettingsPage() {
  const { user } = useStore();
  const [name, setName] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [region, setRegion] = useState("us-east-1");
  const [configSet, setConfigSet] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load organization settings on mount
  useEffect(() => {
    async function loadOrgData() {
      if (!user?.org_id) return;
      try {
        const res = await fetch(`/api/org?orgId=${user.org_id}`);
        if (res.ok) {
          const data = await res.json();
          setName(data.name || user.org_name || "");
          setFromEmail(data.fromEmail || user.email || "");
          setRegion(data.region || "us-east-1");
          setConfigSet(data.configSet || "");
        }
      } catch (err) {
        console.error("Failed to load organization settings.", err);
      }
    }
    loadOrgData();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch("/api/org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          fromEmail,
          region,
          configSet,
          orgId: user?.org_id,
        }),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        alert("Failed to save organization parameters.");
      }
    } catch (err) {
      console.error("Failed to save organization parameters:", err);
      alert("A network error occurred while saving organization settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 select-none">
      <div className="max-w-2xl p-6 glass-hud rounded-lg space-y-6">
        <div>
          <h3 className="text-sm font-bold text-foreground tracking-tight flex items-center gap-2">
            <Building className="w-[18px] h-[18px] text-muted-foreground" />
            <span>AWS & Email Parameters</span>
          </h3>
          <p className="text-[10px] text-muted-foreground mt-0.5">Manage details and AWS SES integrations for {user?.org_name}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground font-mono">Organisation Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded bg-secondary border border-border focus:outline-none focus:border-primary text-sm text-foreground"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-muted-foreground font-mono">Default Sender Address</label>
              <input
                type="email"
                value={fromEmail}
                onChange={(e) => setFromEmail(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded bg-secondary border border-border focus:outline-none focus:border-primary text-sm text-foreground"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground font-mono flex items-center gap-1.5">
                <Cloud className="w-3.5 h-3.5" />
                <span>AWS Region</span>
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full px-3 py-2 rounded bg-secondary border border-border focus:outline-none focus:border-primary text-sm text-foreground font-medium"
              >
                <option value="us-east-1">us-east-1 (N. Virginia)</option>
                <option value="us-west-2">us-west-2 (Oregon)</option>
                <option value="eu-west-1">eu-west-1 (Ireland)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground font-mono">SES Event Configuration Set</label>
              <input
                type="text"
                value={configSet}
                onChange={(e) => setConfigSet(e.target.value)}
                placeholder="e.g. pulsesend-events"
                className="w-full px-3.5 py-2 rounded bg-secondary border border-border focus:outline-none focus:border-primary text-sm text-foreground font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-border">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 rounded bg-primary text-white hover:bg-primary/90 text-xs font-bold shadow-[0_1px_3px_rgba(95,90,246,0.2)] transition cursor-pointer border border-white/5"
            >
              {saving ? (
                <span>Saving parameters...</span>
              ) : saved ? (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Parameters Saved</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Parameters</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
