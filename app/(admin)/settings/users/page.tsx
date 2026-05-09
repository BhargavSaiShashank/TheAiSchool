"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Plus, Trash2, Mail, Check } from "lucide-react";
import { useStore } from "@/lib/store";

export default function TeammatesPage() {
  const { user: currentLoggedUser, login } = useStore();
  const [teammates, setTeammates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("CAMPAIGN_MANAGER");

  // Fetch teammates from live database
  useEffect(() => {
    async function fetchTeammates() {
      try {
        const res = await fetch("/api/users");
        if (res.ok) {
          const data = await res.json();
          setTeammates(data);
        }
      } catch (err) {
        console.error("Failed to fetch teammates directory:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTeammates();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail, role: newRole }),
      });

      if (res.ok) {
        // Refresh list
        const refresh = await fetch("/api/users");
        if (refresh.ok) {
          const data = await refresh.json();
          setTeammates(data);
        }
        setNewEmail("");
        setShowInviteModal(false);
      }
    } catch (err) {
      console.error("Failed to invite teammate:", err);
    }
  };

  const handleRoleChange = async (id: string, role: string) => {
    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, role }),
      });

      if (res.ok) {
        setTeammates(
          teammates.map((u) => (u.id === id ? { ...u, role } : u))
        );
        const editedTeammate = teammates.find((u) => u.id === id);
        if (currentLoggedUser && editedTeammate && (
          currentLoggedUser.id === id || 
          currentLoggedUser.email === editedTeammate.email ||
          currentLoggedUser.email === "synced@clerk.user"
        )) {
          login({ ...currentLoggedUser, role: role as any });
        }
      }
    } catch (err) {
      console.error("Failed to update teammate role:", err);
    }
  };

  const handleRevoke = async (id: string, email: string) => {
    if (confirm(`Are you sure you want to revoke access for ${email}?`)) {
      try {
        const res = await fetch(`/api/users?id=${id}`, {
          method: "DELETE",
        });

        if (res.ok) {
          setTeammates(teammates.filter((u) => u.id !== id));
        }
      } catch (err) {
        console.error("Failed to revoke teammate access:", err);
      }
    }
  };

  return (
    <div className="space-y-8 select-none">
      <div className="flex items-center justify-between border-b border-border pb-5">
        <div>
          <h2 className="text-sm font-bold text-foreground tracking-tight flex items-center gap-2">
            <Users className="w-[18px] h-[18px] text-zinc-400" />
            <span>Roles & Teammates Directory</span>
          </h2>
          <p className="text-[10px] text-muted-foreground mt-0.5">Manage and assign permission roles, and invite teammates to PulseSend</p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded bg-primary text-white hover:bg-primary/90 text-xs font-bold shadow transition cursor-pointer border border-white/5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Invite Teammate</span>
        </button>
      </div>

      <div className="glass-hud rounded-lg overflow-hidden max-w-4xl">
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border text-zinc-500 font-mono text-[10px] uppercase bg-secondary/10">
                <th className="py-3 px-5 font-semibold">User Email Address</th>
                <th className="py-3 px-5 font-semibold">Permission Role</th>
                <th className="py-3 px-5 font-semibold">Access Status</th>
                <th className="py-3 px-5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-muted-foreground font-mono tracking-widest text-[11px] uppercase">
                    Loading directory...
                  </td>
                </tr>
              ) : teammates.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-muted-foreground font-mono tracking-wider text-[11px] uppercase">
                    No teammates found inside organization registry.
                  </td>
                </tr>
              ) : (
                teammates.map((user) => (
                  <tr key={user.id} className="border-b border-border/50 hover:bg-secondary/40 transition">
                    <td className="py-3.5 px-5 font-bold text-foreground font-mono text-[11px] flex items-center gap-2.5">
                      <div className="w-[26px] h-[26px] rounded-full bg-secondary border border-border flex items-center justify-center text-[10px] font-black uppercase text-muted-foreground">
                        {user.email[0]}
                      </div>
                      <span>{user.email}</span>
                    </td>
                    <td className="py-3.5 px-5">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className="px-2 py-1 rounded bg-secondary border border-border text-[10px] text-foreground font-semibold font-mono focus:outline-none"
                      >
                        <option value="SUPER_ADMIN">SUPER ADMIN</option>
                        <option value="CAMPAIGN_MANAGER">CAMPAIGN MANAGER</option>
                        <option value="VIEWER">VIEWER</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                        user.status === "Active"
                          ? "bg-emerald-500/10 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          : "bg-amber-500/10 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={() => handleRevoke(user.id, user.email)}
                        className="text-muted-foreground hover:text-foreground transition p-1"
                        title="Revoke Teammate Access"
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

      {/* INVITE TEAMMATE MODAL */}
      <AnimatePresence>
        {showInviteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md glass-hud p-6 rounded-lg space-y-6"
            >
              <div>
                <h3 className="text-sm font-bold text-foreground tracking-tight">Invite Teammate</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Invite a teammate to collaborate on PulseSend campaigns</p>
              </div>

              <form onSubmit={handleInvite} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground font-mono">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="teammate@example.com"
                      required
                      className="w-full pl-9 pr-4 py-2 rounded bg-secondary border border-border focus:outline-none focus:border-primary text-sm text-foreground"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground font-mono">Permission Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full px-3 py-2.5 rounded bg-secondary border border-border focus:outline-none focus:border-primary text-sm text-foreground font-medium"
                  >
                    <option value="SUPER_ADMIN">SUPER ADMIN (Full Access)</option>
                    <option value="CAMPAIGN_MANAGER">CAMPAIGN MANAGER (Campaign Access)</option>
                    <option value="VIEWER">VIEWER (Read-Only Access)</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="px-4 py-2 rounded border border-border hover:bg-secondary text-muted-foreground text-xs font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded bg-primary text-white hover:bg-primary/90 text-xs font-semibold transition shadow-md border border-white/5 bg-violet-600 hover:bg-violet-700"
                  >
                    Send Invitation
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
