"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Plus, ShieldCheck, Trash2, Mail, Check } from "lucide-react";

// Mock Teammates matching seed.js
const initialTeammates = [
  { id: "u1", email: "superadmin@pulsesend.com", role: "SUPER_ADMIN", status: "Active" },
  { id: "u2", email: "manager@pulsesend.com", role: "CAMPAIGN_MANAGER", status: "Active" },
  { id: "u3", email: "viewer@pulsesend.com", role: "VIEWER", status: "Active" },
];

export default function TeammatesPage() {
  const [teammates, setTeammates] = useState(initialTeammates);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("CAMPAIGN_MANAGER");

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;

    const item = {
      id: `u-${Date.now()}`,
      email: newEmail,
      role: newRole,
      status: "Invited",
    };
    setTeammates([...teammates, item]);
    setNewEmail("");
    setShowInviteModal(false);
  };

  const handleRoleChange = (id: string, role: string) => {
    setTeammates(
      teammates.map((u) => (u.id === id ? { ...u, role } : u))
    );
  };

  const handleRevoke = (id: string, email: string) => {
    if (confirm(`Are you sure you want to revoke access for ${email}?`)) {
      setTeammates(teammates.filter((u) => u.id !== id));
    }
  };

  return (
    <div className="space-y-8 select-none">
      <div className="flex items-center justify-between border-b border-border pb-5">
        <div>
          <h2 className="text-sm font-bold text-foreground tracking-tight flex items-center gap-2">
            <Users className="w-[18px] h-[18px] text-zinc-400" />
            <span>Teammates Directory</span>
          </h2>
          <p className="text-[10px] text-muted-foreground mt-0.5">Manage permission roles and invite teammates to PulseSend</p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded bg-primary text-white hover:bg-primary/90 text-xs font-bold shadow transition cursor-pointer border border-white/5"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Invite Teammate</span>
        </button>
      </div>

      <div className="bg-card border border-border rounded-md overflow-hidden shadow-sm max-w-4xl">
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
              {teammates.map((user) => (
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
                      className="px-2 py-1 rounded bg-secondary border border-border text-[10px] text-zinc-300 font-semibold font-mono focus:outline-none"
                    >
                      <option value="SUPER_ADMIN">SUPER ADMIN</option>
                      <option value="CAMPAIGN_MANAGER">CAMPAIGN MANAGER</option>
                      <option value="VIEWER">VIEWER</option>
                    </select>
                  </td>
                  <td className="py-3.5 px-5">
                    <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase ${
                      user.status === "Active"
                        ? "bg-emerald-950/20 text-emerald-400 border border-emerald-900/30"
                        : "bg-zinc-900 text-muted-foreground border border-border"
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    {user.email !== "superadmin@pulsesend.com" && (
                      <button
                        onClick={() => handleRevoke(user.id, user.email)}
                        className="text-muted-foreground hover:text-foreground p-1.5 transition"
                        title="Revoke Teammate Access"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
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
              className="w-full max-w-md bg-card border border-border p-6 rounded-md shadow-lg space-y-6"
            >
              <div>
                <h3 className="text-sm font-bold text-foreground tracking-tight">Invite Teammate</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Invite a teammate and configure permission boundaries</p>
              </div>

              <form onSubmit={handleInvite} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground font-mono">Teammate Email Address</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="teammate@pulsesend.com"
                    required
                    className="w-full px-3 py-2 rounded bg-zinc-900 border border-border focus:outline-none focus:border-zinc-700 text-sm text-zinc-200"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground font-mono">Permission Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full px-3 py-2.5 rounded bg-zinc-900 border border-border focus:outline-none focus:border-zinc-700 text-sm text-zinc-400 font-medium"
                  >
                    <option value="SUPER_ADMIN">SUPER ADMIN (Full Access)</option>
                    <option value="CAMPAIGN_MANAGER">CAMPAIGN MANAGER (Design/Send)</option>
                    <option value="VIEWER">VIEWER (Read-Only Analytics)</option>
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
                    className="px-4 py-2 rounded bg-primary text-white hover:bg-primary/90 text-xs font-semibold transition shadow-md border border-white/5"
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
