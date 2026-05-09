"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  Search,
  Plus,
  Trash2,
  Zap,
} from "lucide-react";

export default function SuppressionPage() {
  const [suppressions, setSuppressions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newReason, setNewReason] = useState("hard_bounce");
  const [newNotes, setNewNotes] = useState("");

  // Fetch live suppressions on mount
  useEffect(() => {
    async function fetchSuppressions() {
      try {
        const res = await fetch("/api/suppression");
        if (res.ok) {
          const data = await res.json();
          setSuppressions(data);
        }
      } catch (err) {
        console.error("Failed to fetch suppression list:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSuppressions();
  }, []);

  // Handler to add suppression manually
  const handleAddSuppression = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    try {
      const res = await fetch("/api/suppression", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail, reason: newReason, log: newNotes }),
      });

      if (res.ok) {
        // Refresh list
        const listRes = await fetch("/api/suppression");
        if (listRes.ok) {
          const data = await listRes.json();
          setSuppressions(data);
        }
        setNewEmail("");
        setNewNotes("");
        setShowAddModal(false);
      }
    } catch (err) {
      console.error("Failed to add suppression block:", err);
    }
  };

  // Handler to delete suppression (remove block)
  const handleRemoveSuppression = async (id: string, email: string) => {
    if (confirm(`Are you sure you want to remove ${email} from the suppression platform? They will receive future campaign dispatches.`)) {
      try {
        const res = await fetch(`/api/suppression?id=${id}`, {
          method: "DELETE",
        });

        if (res.ok) {
          setSuppressions(suppressions.filter((s) => s.id !== id));
        }
      } catch (err) {
        console.error("Failed to delete suppression block:", err);
      }
    }
  };

  const filteredSuppressions = suppressions.filter((s) =>
    s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.reason.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 select-none">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-lg glass-hud relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-40 bg-red-500/[0.01] rounded-full blur-[40px] pointer-events-none" />
        <div className="space-y-1.5 z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs bg-red-500/10 dark:bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 px-2.5 py-0.5 rounded-full font-mono flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              Campaign Safeguard Active
            </span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Suppression Logs & Safeguard Center
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
            PulseSend automatically excludes suppressed addresses from campaign queues to maintain a premium AWS sender reputation. Bounces and spam complaints are synchronized via AWS SQS webhooks.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded bg-primary text-white hover:bg-primary/90 text-xs font-bold shadow transition shrink-0 cursor-pointer border border-white/5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Block Email</span>
        </button>
      </div>

      {/* Split section: Table and Rules explanation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Suppression Table directory */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted-foreground">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search suppression logs by email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 rounded bg-secondary border border-border text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition"
            />
          </div>

          <div className="glass-hud rounded-lg overflow-hidden">
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border text-zinc-500 font-mono text-[10px] uppercase bg-secondary/10">
                    <th className="py-3 px-5 font-semibold">Blocked Email Address</th>
                    <th className="py-3 px-5 font-semibold">Reason</th>
                    <th className="py-3 px-5 font-semibold">Suppressed At</th>
                    <th className="py-3 px-5 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-muted-foreground font-mono tracking-widest text-[11px] uppercase">
                        Loading safeguard blocks...
                      </td>
                    </tr>
                  ) : filteredSuppressions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-muted-foreground font-mono tracking-wider text-[11px] uppercase">
                        No suppressed addresses logged inside campaign safeguard center.
                      </td>
                    </tr>
                  ) : (
                    filteredSuppressions.map((item) => (
                      <tr key={item.id} className="border-b border-border/50 hover:bg-secondary/40 transition group">
                        <td className="py-3 px-5">
                          <p className="font-bold text-foreground font-mono text-[11px]">{item.email}</p>
                          <p className="text-[10px] text-muted-foreground font-mono mt-0.5 truncate max-w-sm">{item.log}</p>
                        </td>
                        <td className="py-3 px-5">
                          <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                            item.reason === "hard_bounce"
                              ? "bg-red-500/10 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                              : item.reason === "spam_complaint"
                              ? "bg-amber-500/10 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                              : "bg-secondary text-muted-foreground border border-border"
                          }`}>
                            {item.reason.replace("_", " ")}
                          </span>
                        </td>
                        <td className="py-3 px-5 text-muted-foreground font-mono text-[11px]">{item.date}</td>
                        <td className="py-3 px-5 text-right">
                          <button
                            onClick={() => handleRemoveSuppression(item.id, item.email)}
                            className="text-muted-foreground hover:text-foreground transition p-1.5"
                            title="Remove Suppression Block"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Safeguard Automated Escalations Sidebar */}
        <div className="p-6 glass-hud rounded-lg space-y-6">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-foreground tracking-tight">Soft Bounce Safeguard Escalations</h3>
          </div>

          <div className="space-y-4 text-xs text-muted-foreground leading-relaxed">
            <p>
              Maintaining an exceptional deliverability rate requires strict safeguards. PulseSend employs automated soft-bounce escalation policies:
            </p>
            
            <div className="space-y-3.5 font-mono text-[11px]">
              <div className="p-3.5 rounded border border-border bg-secondary/40 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-secondary border border-border flex items-center justify-center font-bold text-muted-foreground">1</span>
                <div>
                  <p className="text-foreground font-bold">1st Soft Bounce</p>
                  <p className="text-muted-foreground mt-0.5">Delivery failure registered. Queue trial flagged.</p>
                </div>
              </div>

              <div className="p-3.5 rounded border border-border bg-secondary/40 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-secondary border border-border flex items-center justify-center font-bold text-muted-foreground">2</span>
                <div>
                  <p className="text-foreground font-bold">2nd Soft Bounce</p>
                  <p className="text-muted-foreground mt-0.5">Double failure recorded within 30 days. Priority downgraded.</p>
                </div>
              </div>

              <div className="p-3.5 rounded border border-border bg-secondary/40 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-red-500/10 dark:bg-red-500/10 border border-red-500/20 flex items-center justify-center font-bold text-red-600 dark:text-red-400">3</span>
                <div>
                  <p className="text-red-600 dark:text-red-400 font-bold">3rd Soft Bounce</p>
                  <p className="text-muted-foreground mt-0.5">Escalated to Hard Bounce. Contact permanently suppressed.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MANUAL BLOCK MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md glass-hud p-6 rounded-lg space-y-6"
            >
              <div>
                <h3 className="text-sm font-bold text-foreground tracking-tight">Block Subscriber Email</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Manually suppress future campaign dispatches</p>
              </div>

              <form onSubmit={handleAddSuppression} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground font-mono">Email Address</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="subscriber@example.com"
                    required
                    className="w-full px-3 py-2 rounded bg-secondary border border-border focus:outline-none focus:border-primary text-sm text-foreground"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground font-mono">Suppression Reason</label>
                  <select
                    value={newReason}
                    onChange={(e) => setNewReason(e.target.value)}
                    className="w-full px-3 py-2.5 rounded bg-secondary border border-border focus:outline-none focus:border-primary text-sm text-foreground font-medium"
                  >
                    <option value="hard_bounce">Hard Bounce</option>
                    <option value="spam_complaint">Spam Complaint</option>
                    <option value="manual_unsubscribe">Manual Unsubscribe</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground font-mono">Audit Log Note / Reason</label>
                  <textarea
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    placeholder="Enter notes for audit trail log history..."
                    className="w-full px-3 py-2 rounded bg-secondary border border-border focus:outline-none focus:border-primary text-sm text-foreground h-24 resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 rounded border border-border hover:bg-secondary text-muted-foreground text-xs font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded bg-primary text-white hover:bg-primary/90 text-xs font-semibold transition shadow-md border border-white/5"
                  >
                    Block Email
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
