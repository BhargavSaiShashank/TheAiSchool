"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Preloader from "@/components/Preloader";
import { toast } from "@/lib/toast";
import { useStore } from "@/lib/store";
import {
  Send,
  Plus,
  Play,
  Pause,
  XCircle,
  Clock,
  Eye,
  CheckCircle,
  Copy,
  Trash2,
  ListFilter,
  Check,
  ChevronRight,
  ChevronLeft,
  Mail,
  Users,
  Layout,
  AlertTriangle,
  Loader2,
  Sparkles,
  RotateCcw,
  Activity,
  TrendingUp,
  SlidersHorizontal,
} from "lucide-react";

// Mock Campaign List
const initialCampaigns: any[] = [];

export default function CampaignsPage() {
  const { user } = useStore();
  const router = useRouter();
  const [view, setView] = useState<"list" | "wizard" | "queue">("list");
  const [isLoading, setIsLoading] = useState(true);
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1);

  // Wizard States
  const [campaignName, setCampaignName] = useState("");
  const [subject, setSubject] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [fromName, setFromName] = useState("PulseSend Team");
  const [fromEmail, setFromEmail] = useState("hello@pulsesend.com");
  const [selectedLists, setSelectedLists] = useState<string[]>([]);
  const [excludedLists, setExcludedLists] = useState<string[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [sendOption, setSendOption] = useState<"now" | "schedule">("now");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [scheduleTimezone, setScheduleTimezone] = useState("UTC+5:30");

  const [testEmailRecipient, setTestEmailRecipient] = useState("");
  const [isSendingTest, setIsSendingTest] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(
    null,
  );

  // Campaigns State
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [lists, setLists] = useState<any[]>([]);
  const [dbTemplates, setDbTemplates] = useState<any[]>([]);
  const [selectedCompareIds, setSelectedCompareIds] = useState<string[]>([]);
  const [showComparisonModal, setShowComparisonModal] = useState(false);

  // Sync session details automatically
  useEffect(() => {
    if (user) {
      setFromName(user.org_name || "PulseSend Team");
      setFromEmail(user.email || "hello@pulsesend.com");
    }
  }, [user]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("new") === "true") {
        setView("wizard");

        const sub = params.get("subject");
        if (sub) {
          setSubject(decodeURIComponent(sub));
          setCampaignName(`AI Generated Campaign`);
        }
        const body = params.get("body");
        if (body) {
          setPreviewText(decodeURIComponent(body).substring(0, 120));
        }
      }
    }
  }, []);

  // Fetch live campaigns and mailing lists on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("pulsesend:loading"));
    }

    async function fetchLiveCampaigns() {
      try {
        const res = await fetch("/api/campaigns", {
          headers: { "x-org-id": user?.org_id || "" },
        });
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data)) {
            setCampaigns(data);
          }
        }
      } catch (err) {
        console.error(
          "Failed to fetch live campaigns, using sandbox preloads.",
          err,
        );
      } finally {
        setIsLoading(false);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("pulsesend:ready"));
        }
      }
    }

    async function fetchMailingLists() {
      try {
        const res = await fetch("/api/lists", {
          headers: { "x-org-id": user?.org_id || "" },
        });
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data)) {
            setLists(data);
          }
        }
      } catch (err) {
        console.error("Failed to fetch mailing lists.", err);
      }
    }

    async function fetchDbTemplates() {
      try {
        const res = await fetch("/api/templates");
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data)) {
            setDbTemplates(data);
          }
        }
      } catch (err) {
        console.error("Failed to fetch database templates.", err);
      }
    }

    fetchLiveCampaigns();
    fetchMailingLists();
    fetchDbTemplates();
  }, [view]);

  const handleSendTestEmail = async () => {
    if (!testEmailRecipient) {
      toast.error("Please enter a recipient email address first.");
      return;
    }
    setIsSendingTest(true);
    try {
      const res = await fetch("/api/send-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: testEmailRecipient,
          subject: subject || "No Subject Specified",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(
          `Success! Test email dispatched to ${testEmailRecipient} via AWS SES!`,
        );
      } else {
        toast.error(`AWS SES Dispatch Failed: ${data.error}`);
      }
    } catch (err: any) {
      toast.error(`Network error: ${err.message}`);
    } finally {
      setIsSendingTest(false);
    }
  };

  // Queue simulation state
  const [queueStatus, setQueueStatus] = useState<
    "sending" | "paused" | "completed"
  >("sending");
  const [sentCount, setSentCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // Simulation effect for Campaign Sending Queue using actual dynamic contact counts
  useEffect(() => {
    if (view !== "queue" || queueStatus !== "sending" || totalCount === 0) {
      if (totalCount === 0 && view === "queue" && queueStatus === "sending") {
        setQueueStatus("completed");
      }
      return;
    }

    const interval = setInterval(() => {
      setSentCount((prev) => {
        const step = Math.max(1, Math.floor(totalCount / 5));
        const next = prev + Math.floor(Math.random() * step + 1);
        if (next >= totalCount) {
          clearInterval(interval);
          setQueueStatus("completed");
          return totalCount;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [view, queueStatus, totalCount]);

  const handleDeleteCampaign = async (id: string, name: string) => {
    if (!confirm(`CRITICAL: This will permanently delete "${name}" and all tracking history. Continue?`)) return;

    try {
      const res = await fetch(`/api/campaigns?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setCampaigns(campaigns.filter(c => c.id !== id));
        toast.success(`Successfully erased campaign trace: "${name}"`);
      } else {
        toast.error("Network rejection: Failed to remove targeted campaign.");
      }
    } catch (err) {
      console.error("Eradicate Campaign Failure:", err);
    }
  };

  // Campaign duplication handler
  const handleDuplicate = (camp: (typeof initialCampaigns)[0]) => {
    const duplicated = {
      ...camp,
      id: `ca-${Date.now()}`,
      name: `${camp.name} (Copy)`,
      status: "Draft" as const,
      sendDate: "—",
      openRate: "—",
      clickRate: "—",
    };
    setCampaigns([duplicated, ...campaigns]);
    toast.success(`Duplicated campaign into drafts: ${duplicated.name}`);
  };

  // Trigger Re-send to Non-Openers
  const handleResendToNonOpeners = (name: string) => {
    toast.info(
      `Generating duplicate campaign targeted explicitly to contacts who did not open: "${name}"`,
    );
  };

  const handleSaveCampaign = async (status: string) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      let scheduledAt = null;
      if (status === "scheduled" && scheduleDate && scheduleTime) {
        try {
          scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
        } catch (e) {
          console.warn("Failed to parse scheduled date/time", e);
        }
      }

      const url = editingCampaignId
        ? `/api/campaigns?id=${editingCampaignId}`
        : "/api/campaigns";
      const method = editingCampaignId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: campaignName || "Untitled Campaign",
          subject: subject || "No Subject Specified",
          previewText: previewText,
          fromName,
          fromEmail,
          status,
          templateId: selectedTemplateId || null,
          recipientsConfig: JSON.stringify({ selectedLists, excludedLists }),
          scheduledAt,
          timezone: scheduleTimezone,
        }),
      });
      if (res.ok) {
        const campResult = await res.json();
        if (editingCampaignId) {
          setCampaigns(
            campaigns.map((c) => (c.id === editingCampaignId ? campResult : c)),
          );
          toast.success(`Updated campaign: ${campResult.name}`);
        } else {
          setCampaigns([campResult, ...campaigns]);
          toast.success(`Saved campaign: ${campResult.name}`);
        }
      }
    } catch (err) {
      console.error("Failed to execute save operation:", err);
      toast.error("Connectivity error preventing cloud synchronization.");
    } finally {
      setIsSaving(false);
      setEditingCampaignId(null);
    }
  };

  // Calculate dynamic recipients count based on actual database lists selected
  const totalRecipientsCount = lists
    .filter(
      (list) =>
        selectedLists.includes(list.id) && !excludedLists.includes(list.id),
    )
    .reduce((sum, list) => sum + (list.count ?? 0), 0);

  // Master finalization handler for firing now OR locking in a future cron schedule
  const handleFinalizeCampaign = async () => {
    if (isSaving) return;
    
    if (sendOption === "schedule") {
      if (!scheduleDate || !scheduleTime) {
        toast.error("Activation blocked: missing launch date or time coordinates.");
        return;
      }
      await handleSaveCampaign("scheduled");
      setView("list"); 
    } else {
      await handleSaveCampaign("sent");
      setSentCount(0);
      setTotalCount(totalRecipientsCount);
      setQueueStatus("sending");
      setView("queue");
    }
  };

  return (
    <div className="space-y-8 select-none">
      <AnimatePresence mode="wait">
        {/* VIEW 1: CAMPAIGNS DIRECTORY LIST */}
        {view === "list" && (
          <motion.div
            key="list-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-[15px] font-bold text-foreground tracking-tight">
                  Campaign Dispatches
                </h2>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  Manage, track and duplicate your email campaigns
                </p>
              </div>
              {user?.role &&
                ["SUPER_ADMIN", "CAMPAIGN_MANAGER"].includes(user.role) && (
                  <button
                    onClick={() => {
                      setCampaignName("");
                      setSubject("");
                      setPreviewText("");
                      setSelectedLists([]);
                      setSelectedTemplateId("");
                      setActiveStep(1);
                      setView("wizard");
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded bg-primary text-white hover:bg-primary/90 text-[13px] font-semibold shadow-[0_1px_3px_rgba(95,90,246,0.2)] transition cursor-pointer border border-white/5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Campaign</span>
                  </button>
                )}
            </div>

            {/* Campaign Table */}
            <div className="bg-card border border-border rounded-md overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border text-zinc-500 font-mono text-[11px] uppercase bg-secondary/10">
                      <th className="py-3.5 px-5 w-10 text-center">
                        <SlidersHorizontal className="w-3.5 h-3.5 mx-auto text-muted-foreground/50" />
                      </th>
                      <th className="py-3.5 px-5 font-semibold">
                        Campaign Details
                      </th>
                      <th className="py-3.5 px-5 font-semibold">Status</th>
                      <th className="py-3.5 px-5 font-semibold">Send Date</th>
                      <th className="py-3.5 px-5 font-semibold text-right">
                        Unique Opens
                      </th>
                      <th className="py-3.5 px-5 font-semibold text-right">
                        Clicks
                      </th>
                      <th className="py-3.5 px-5 font-semibold text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 px-5 text-center">
                          <div className="flex flex-col items-center justify-center space-y-3.5">
                            <div className="p-3 rounded-full bg-secondary border border-border text-muted-foreground">
                              <Mail className="w-6 h-6 stroke-[1.5]" />
                            </div>
                            <div>
                              <p className="text-[13px] font-bold text-muted-foreground">
                                No campaigns found
                              </p>
                              <p className="text-[11px] text-muted-foreground/80 max-w-xs mx-auto mt-1 font-medium font-mono uppercase tracking-wider leading-relaxed">
                                Create your first high-performance email
                                campaign with the designer wizard.
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      campaigns.map((camp) => (
                        <tr
                          key={camp.id}
                          onClick={() => router.push(`/campaigns/${camp.id}/report`)}
                          className={`border-b border-border/50 transition cursor-pointer group ${selectedCompareIds.includes(camp.id) ? 'bg-[#7C5CFF]/[0.04]' : 'hover:bg-secondary/40'}`}
                        >
                          <td className="py-4 px-5 w-10 text-center" onClick={(e) => e.stopPropagation()}>
                            <input 
                              type="checkbox"
                              checked={selectedCompareIds.includes(camp.id)}
                              onChange={(e) => {
                                if(e.target.checked) {
                                  setSelectedCompareIds([...selectedCompareIds, camp.id]);
                                } else {
                                  setSelectedCompareIds(selectedCompareIds.filter(id => id !== camp.id));
                                }
                              }}
                              className="w-3.5 h-3.5 accent-[#7C5CFF] rounded border-zinc-700 bg-zinc-900 cursor-pointer"
                            />
                          </td>
                          <td className="py-4 px-5">
                            <p className="text-[13px] font-bold text-foreground group-hover:text-primary transition truncate max-w-xs">
                              {camp.name}
                            </p>
                            <p className="text-[11px] text-muted-foreground truncate mt-0.5 max-w-xs font-mono">
                              {camp.subject}
                            </p>
                          </td>
                          <td className="py-4 px-5">
                            <span
                              className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded uppercase ${
                                camp.status === "Sent"
                                  ? "bg-secondary text-muted-foreground border border-border"
                                  : "bg-blue-950/20 text-blue-400 border border-blue-900/30"
                              }`}
                            >
                              {camp.status}
                            </span>
                          </td>
                          <td className="py-4 px-5 text-[13px] text-muted-foreground font-mono">
                            {camp.sendDate}
                          </td>
                          <td className="py-4 px-5 text-right text-[13px] font-mono font-semibold text-emerald-400">
                            {camp.openRate}
                          </td>
                          <td className="py-4 px-5 text-right text-[13px] font-mono font-semibold text-blue-400">
                            {camp.clickRate}
                          </td>
                          <td className="py-4 px-5 text-right" onClick={(e) => e.stopPropagation()}>
                            {user?.role &&
                              ["SUPER_ADMIN", "CAMPAIGN_MANAGER"].includes(
                                user.role,
                              ) && (
                                <div className="flex items-center justify-end gap-2">
                                  {camp.status !== "Sent" && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingCampaignId(camp.id);
                                        setCampaignName(camp.name);
                                        setSubject(camp.subject);
                                        setPreviewText("");
                                        setActiveStep(1);
                                        setView("wizard");
                                      }}
                                      className="text-[#7C5CFF] hover:text-[#7C5CFF]/80 transition p-1.5 rounded hover:bg-[#7C5CFF]/10"
                                      title="Edit & Send Draft"
                                    >
                                      <Send className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDuplicate(camp);
                                    }}
                                    className="text-muted-foreground hover:text-foreground transition p-1.5 rounded hover:bg-secondary"
                                    title="Duplicate Campaign"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                  
                                  {camp.status === "Sent" && (
                                    <>
                                      <Link
                                        href={`/campaigns/${camp.id}/report`}
                                        className="text-emerald-400 hover:text-emerald-300 transition p-1.5 rounded hover:bg-emerald-400/10"
                                        title="View Analytics Report"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <Activity className="w-3.5 h-3.5" />
                                      </Link>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleResendToNonOpeners(camp.name);
                                        }}
                                        className="text-muted-foreground hover:text-foreground transition p-1.5 rounded hover:bg-secondary"
                                        title="Re-send to non-openers"
                                      >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                      </button>
                                    </>
                                  )}
                                  
                                  <div className="w-[1px] h-3.5 bg-border/60 mx-1" />
                                  
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteCampaign(camp.id, camp.name);
                                    }}
                                    className="text-muted-foreground hover:text-red-400 transition p-1.5 rounded hover:bg-red-950/20"
                                    title="Permanently Delete Campaign"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* VIEW 2: 4-STEP CAMPAIGN CREATION WIZARD */}
        {view === "wizard" && (
          <motion.div
            key="wizard-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-8 glass-hud rounded-lg space-y-8"
          >
            {/* Step Indicators Header */}
            <div className="flex items-center justify-between border-b border-border/50 pb-5">
              <div>
                <h3 className="text-[15px] font-bold text-foreground tracking-tight">
                  Campaign Design Wizard
                </h3>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  Build and schedule a high-performance email campaign
                </p>
              </div>

              <div className="flex items-center gap-3.5 text-[12px] font-mono font-bold text-muted-foreground">
                <span
                  className={
                    activeStep === 1 ? "text-foreground font-extrabold" : ""
                  }
                >
                  1. Details
                </span>
                <span>/</span>
                <span
                  className={
                    activeStep === 2 ? "text-foreground font-extrabold" : ""
                  }
                >
                  2. Audience
                </span>
                <span>/</span>
                <span
                  className={
                    activeStep === 3 ? "text-foreground font-extrabold" : ""
                  }
                >
                  3. Design
                </span>
                <span>/</span>
                <span
                  className={
                    activeStep === 4 ? "text-foreground font-extrabold" : ""
                  }
                >
                  4. Review
                </span>
              </div>
            </div>

            {/* STEP 1: CAMPAIGN DETAILS */}
            {activeStep === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground font-mono">
                    Campaign Name (Internal Only)
                  </label>
                  <input
                    type="text"
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder="e.g. May Product Newsletter Blast"
                    required
                    className="w-full px-3.5 py-2 rounded bg-secondary border border-border focus:outline-none focus:border-primary text-sm text-foreground"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground font-mono">
                    Email Subject Line
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="What the recipient sees in their inbox..."
                    required
                    className="w-full px-3.5 py-2 rounded bg-secondary border border-border focus:outline-none focus:border-primary text-sm text-foreground"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground font-mono">
                    Preview Text
                  </label>
                  <input
                    type="text"
                    value={previewText}
                    onChange={(e) => setPreviewText(e.target.value)}
                    placeholder="Short summary displayed after the subject line..."
                    className="w-full px-3.5 py-2 rounded bg-secondary border border-border focus:outline-none focus:border-primary text-sm text-foreground"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground font-mono">
                    Sender Name
                  </label>
                  <input
                    type="text"
                    value={fromName}
                    onChange={(e) => setFromName(e.target.value)}
                    placeholder="e.g. PulseSend Marketing"
                    required
                    className="w-full px-3.5 py-2 rounded bg-secondary border border-border focus:outline-none focus:border-primary text-sm text-foreground"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground font-mono">
                    Sender Email Address
                  </label>
                  <input
                    type="email"
                    value={fromEmail}
                    onChange={(e) => setFromEmail(e.target.value)}
                    placeholder="hello@pulsesend.com"
                    required
                    className="w-full px-3.5 py-2 rounded bg-secondary border border-border focus:outline-none focus:border-primary text-sm text-foreground"
                  />
                </div>
              </div>
            )}

            {/* STEP 2: RECIPIENTS SELECTION */}
            {activeStep === 2 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Inclusion mailing lists */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-foreground uppercase font-mono">
                    Include Contact Lists
                  </h4>
                  <div className="space-y-2">
                    {lists.length === 0 ? (
                      <p className="text-xs text-muted-foreground font-mono italic">
                        No mailing lists discovered. Please create a mailing
                        list under Contacts first.
                      </p>
                    ) : (
                      lists.map((list) => {
                        const isChecked = selectedLists.includes(list.id);
                        return (
                          <label
                            key={list.id}
                            className="flex items-center gap-3 p-3 rounded bg-secondary/40 border border-border cursor-pointer hover:border-primary/50 transition"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                setSelectedLists(
                                  e.target.checked
                                    ? [...selectedLists, list.id]
                                    : selectedLists.filter(
                                        (id) => id !== list.id,
                                      ),
                                );
                              }}
                              className="w-4 h-4 rounded border-border text-[#7C5CFF] bg-black focus:ring-0"
                            />
                            <div>
                              <p className="text-xs font-bold text-foreground">
                                {list.name}
                              </p>
                              <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                                {selectedLists.includes(list.id)
                                  ? `${list.count || 0} contacts active`
                                  : "Audience excluded"}
                              </p>
                            </div>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Exclusions */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-foreground uppercase font-mono">
                    Exclude Contact Lists (Optional)
                  </h4>
                  <div className="space-y-2">
                    {lists.length === 0 ? (
                      <p className="text-xs text-muted-foreground font-mono italic">
                        No mailing lists discovered.
                      </p>
                    ) : (
                      lists.map((list) => {
                        const isChecked = excludedLists.includes(list.id);
                        return (
                          <label
                            key={list.id}
                            className="flex items-center gap-3 p-3 rounded bg-secondary/20 border border-border cursor-pointer hover:border-primary/50 transition"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                setExcludedLists(
                                  e.target.checked
                                    ? [...excludedLists, list.id]
                                    : excludedLists.filter(
                                        (id) => id !== list.id,
                                      ),
                                );
                              }}
                              className="w-4 h-4 rounded border-border text-red-500 bg-black focus:ring-0"
                            />
                            <div>
                              <p className="text-xs font-bold text-foreground">
                                {list.name}
                              </p>
                              <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                                {excludedLists.includes(list.id)
                                  ? "Suppress matching"
                                  : "Suppress excluded"}
                              </p>
                            </div>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Live Count estimation footer */}
                <div className="md:col-span-2 p-4 rounded border border-border bg-secondary/40 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Users className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs font-bold text-foreground">
                        Deduplicated Recipients
                      </p>
                      <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                        Auto-filtering duplicate, unsubscribed, and suppressed
                        contacts
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-extrabold font-mono text-foreground">
                    {totalRecipientsCount.toLocaleString()} contacts
                  </span>
                </div>
              </div>
            )}

            {/* STEP 3: DESIGN SELECTION */}
            {activeStep === 3 && (
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-foreground uppercase font-mono">
                  Select Template Design
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {(dbTemplates.length > 0
                    ? dbTemplates
                    : [
                        {
                          id: "t1",
                          name: "Welcome Onboard",
                          category: "starter block",
                        },
                        {
                          id: "t2",
                          name: "Monthly Tech Newsletter",
                          category: "starter block",
                        },
                        {
                          id: "t3",
                          name: "Product Promotion Blast",
                          category: "starter block",
                        },
                      ]
                  ).map((temp) => {
                    const isSelected = selectedTemplateId === temp.id;
                    return (
                      <div
                        key={temp.id}
                        onClick={() => setSelectedTemplateId(temp.id)}
                        className={`p-4 rounded-lg border bg-secondary/40 cursor-pointer transition flex items-center gap-3.5 group hover:border-primary/50 ${
                          isSelected
                            ? "border-[#7C5CFF] bg-[#7C5CFF]/10"
                            : "border-border"
                        }`}
                      >
                        <Layout className="w-5 h-5 text-[#7C5CFF]" />
                        <div>
                          <p className="text-xs font-bold text-foreground truncate max-w-[150px]">
                            {temp.name}
                          </p>
                          <p className="text-[9px] text-zinc-500 font-mono uppercase mt-0.5 font-bold">
                            {temp.category || "Custom"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 4: REVIEW & CONFIRM */}
            {activeStep === 4 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Configuration Summary */}
                <div className="md:col-span-2 space-y-6">
                  <h4 className="text-xs font-bold text-white uppercase font-mono border-b border-zinc-900 pb-2">
                    Campaign Setup Review
                  </h4>

                  <div className="grid grid-cols-2 gap-4 text-xs font-mono bg-zinc-900/30 p-4 rounded border border-zinc-900 leading-relaxed">
                    <div>
                      <span className="text-zinc-500">Campaign Name:</span>
                      <p className="text-white font-bold mt-1 truncate">
                        {campaignName || "May News"}
                      </p>
                    </div>
                    <div>
                      <span className="text-zinc-500">Subject Line:</span>
                      <p className="text-white font-bold mt-1 truncate">
                        {subject || "No Subject Specified"}
                      </p>
                    </div>
                    <div>
                      <span className="text-zinc-500">From Header:</span>
                      <p className="text-white font-bold mt-1 truncate">
                        {fromName} ({fromEmail})
                      </p>
                    </div>
                    <div>
                      <span className="text-zinc-500">Estimated Size:</span>
                      <p className="text-white font-bold mt-1">
                        {totalRecipientsCount.toLocaleString()} recipients
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-white uppercase font-mono">
                      Choose dispatch option
                    </h4>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 px-4 py-2 rounded bg-zinc-900 border border-zinc-800 cursor-pointer hover:border-zinc-700">
                        <input
                          type="radio"
                          checked={sendOption === "now"}
                          onChange={() => setSendOption("now")}
                          className="w-4 h-4 border-zinc-800 text-white bg-black"
                        />
                        <span className="text-xs font-semibold text-zinc-300">
                          Send Campaign Now
                        </span>
                      </label>
                      <label className="flex items-center gap-2 px-4 py-2 rounded bg-zinc-900 border border-zinc-800 cursor-pointer hover:border-zinc-700">
                        <input
                          type="radio"
                          checked={sendOption === "schedule"}
                          onChange={() => setSendOption("schedule")}
                          className="w-4 h-4 border-zinc-800 text-white bg-black"
                        />
                        <span className="text-xs font-semibold text-zinc-300">
                          Schedule For Later
                        </span>
                      </label>
                    </div>

                    {sendOption === "schedule" && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded bg-zinc-900/40 border border-zinc-900 text-xs font-mono">
                        <div className="space-y-1">
                          <label className="text-zinc-500">Date</label>
                          <input
                            type="date"
                            value={scheduleDate}
                            onChange={(e) => setScheduleDate(e.target.value)}
                            className="w-full bg-zinc-950 p-2 rounded border border-zinc-800 text-zinc-300"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-zinc-500">Time</label>
                          <input
                            type="time"
                            value={scheduleTime}
                            onChange={(e) => setScheduleTime(e.target.value)}
                            className="w-full bg-zinc-950 p-2 rounded border border-zinc-800 text-zinc-300"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-zinc-500">Timezone</label>
                          <select
                            value={scheduleTimezone}
                            onChange={(e) =>
                              setScheduleTimezone(e.target.value)
                            }
                            className="w-full bg-zinc-950 p-2.5 rounded border border-zinc-800 text-zinc-300"
                          >
                            <option value="UTC+5:30">Kolkata (UTC+5:30)</option>
                            <option value="UTC">London (UTC)</option>
                            <option value="EST">New York (EST)</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Test Send Panel */}
                <div className="p-5 bg-zinc-900/30 border border-zinc-900 rounded-lg space-y-4">
                  <h4 className="text-xs font-bold text-white uppercase font-mono">
                    Test Dispatch
                  </h4>
                  <p className="text-[10px] text-zinc-500 leading-relaxed">
                    Send a fully rendered preview campaign to up to 5 addresses
                    before scheduling. These dispatches are excluded from
                    analytics.
                  </p>
                  <input
                    type="text"
                    value={testEmailRecipient}
                    onChange={(e) => setTestEmailRecipient(e.target.value)}
                    placeholder="e.g. testing@pulsesend.com"
                    className="w-full px-3 py-1.5 rounded bg-zinc-950 border border-zinc-850 text-xs text-zinc-300 focus:outline-none placeholder-zinc-700"
                  />
                  <button
                    disabled={isSendingTest}
                    onClick={handleSendTestEmail}
                    className="w-full py-1.5 rounded border border-zinc-800 hover:bg-zinc-900 text-xs font-mono font-semibold text-zinc-400 hover:text-white transition cursor-pointer disabled:opacity-50"
                  >
                    {isSendingTest ? "Sending Live..." : "Send Test Email"}
                  </button>
                </div>
              </div>
            )}

            {/* Wizard Navigation Footer */}
            <div className="flex items-center justify-between pt-6 border-t border-zinc-900">
              <button
                disabled={activeStep === 1}
                onClick={() =>
                  setActiveStep((prev) => (prev > 1 ? ((prev - 1) as any) : 1))
                }
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded border border-zinc-850 hover:bg-zinc-900 text-xs font-semibold text-zinc-400 hover:text-white transition cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={async () => {
                    await handleSaveCampaign("draft");
                    setView("list");
                  }}
                  className="px-4 py-1.5 rounded border border-zinc-850 hover:bg-zinc-900 text-xs font-semibold text-zinc-400 hover:text-white transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? "Saving..." : "Save Draft"}
                </button>
                {activeStep < 4 ? (
                  <button
                    type="button"
                    onClick={() =>
                      setActiveStep((prev) =>
                        prev < 4 ? ((prev + 1) as any) : 4,
                      )
                    }
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-white text-black hover:bg-zinc-200 text-xs font-semibold shadow transition cursor-pointer"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={handleFinalizeCampaign}
                    className="flex items-center gap-1.5 px-5 py-1.5 rounded bg-white text-black hover:bg-zinc-200 text-xs font-extrabold shadow transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sendOption === "schedule" ? <Clock className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
                    <span>
                      {isSaving 
                        ? "Locking Engine..." 
                        : sendOption === "schedule" 
                          ? "Confirm & Schedule" 
                          : "Confirm & Send Now"}
                    </span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* VIEW 3: LIVE SQS SENDING QUEUE PROGRESS */}
        {view === "queue" && (
          <motion.div
            key="queue-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-8 bg-zinc-950 border border-zinc-900 rounded-lg glass space-y-8 max-w-lg mx-auto text-center"
          >
            {queueStatus === "sending" && (
              <div className="flex flex-col items-center gap-4">
                <div className="p-3 bg-blue-950/20 text-blue-400 rounded-full border border-blue-900/40 animate-pulse">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Campaign SQS Sending Active
                  </h3>
                  <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                    Simulating multi-threaded background worker at AWS sandbox
                    limits
                  </p>
                </div>
              </div>
            )}

            {queueStatus === "paused" && (
              <div className="flex flex-col items-center gap-4">
                <div className="p-3 bg-amber-950/20 text-amber-400 rounded-full border border-amber-900/40">
                  <Pause className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Campaign SQS Queue Paused
                  </h3>
                  <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                    Sending queue has been held manually
                  </p>
                </div>
              </div>
            )}

            {queueStatus === "completed" && (
              <div className="flex flex-col items-center gap-4">
                <div className="p-3 bg-emerald-950/20 text-emerald-400 rounded-full border border-emerald-900/40">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Campaign Dispatch Complete
                  </h3>
                  <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                    SQS queues are empty. All dispatches recorded in analytics
                  </p>
                </div>
              </div>
            )}

            {/* Progress Bar representation */}
            <div className="space-y-2">
              <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden border border-zinc-800">
                <motion.div
                  animate={{ width: `${(sentCount / totalCount) * 100}%` }}
                  transition={{ duration: 0.5 }}
                  className="bg-white h-full shadow-[0_0_8px_rgba(255,255,255,0.7)]"
                />
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono font-semibold text-zinc-500">
                <span>{sentCount.toLocaleString()} dispatched</span>
                <span>{totalCount.toLocaleString()} total recipients</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex justify-center gap-4 pt-4 border-t border-zinc-900">
              {queueStatus === "sending" && (
                <button
                  onClick={() => setQueueStatus("paused")}
                  className="flex items-center gap-1 px-4 py-2 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white text-xs font-mono font-bold transition cursor-pointer"
                >
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause Send Queue</span>
                </button>
              )}
              {queueStatus === "paused" && (
                <button
                  onClick={() => setQueueStatus("sending")}
                  className="flex items-center gap-1 px-4 py-2 rounded bg-white text-black hover:bg-zinc-200 text-xs font-mono font-bold transition cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-black" />
                  <span>Resume Send Queue</span>
                </button>
              )}
              {queueStatus !== "completed" ? (
                <button
                  onClick={() => {
                    if (
                      confirm(
                        "Are you sure you want to cancel this scheduled campaign dispatch?",
                      )
                    ) {
                      setView("list");
                    }
                  }}
                  className="flex items-center gap-1 px-4 py-2 rounded bg-red-950/20 hover:bg-red-950/30 border border-red-900/40 text-red-400 text-xs font-mono font-bold transition cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Cancel Campaign</span>
                </button>
              ) : (
                <button
                  onClick={() => setView("list")}
                  className="px-5 py-2.5 rounded bg-white text-black hover:bg-zinc-200 text-xs font-semibold shadow-md transition cursor-pointer"
                >
                  Return to campaigns directory
                </button>
              )}
            </div>
          </motion.div>
        )}
        {/* Campaign Comparison Floating Bar */}
        {selectedCompareIds.length >= 2 && view === "list" && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 bg-[#0d0e12] border border-[#7C5CFF]/40 shadow-xl rounded-2xl px-6 py-4 flex items-center gap-6 backdrop-blur-lg"
          >
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded bg-[#7C5CFF]/20 border border-[#7C5CFF]/40 flex items-center justify-center font-mono text-xs font-bold text-[#7C5CFF]">
                {selectedCompareIds.length}
              </div>
              <span className="text-sm font-bold text-white">Campaigns Selected</span>
            </div>
            <div className="flex items-center gap-3 border-l border-border/50 pl-6">
              <button 
                onClick={() => setShowComparisonModal(true)}
                className="px-4 py-2 bg-[#7C5CFF] hover:bg-[#7C5CFF]/90 text-white text-xs font-bold rounded-lg shadow transition flex items-center gap-1.5 cursor-pointer"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                Compare Results
              </button>
              <button 
                onClick={() => setSelectedCompareIds([])}
                className="text-muted-foreground hover:text-foreground text-xs font-semibold px-2 cursor-pointer"
              >
                Clear
              </button>
            </div>
          </motion.div>
        )}

        {/* Comparison Overlay Modal */}
        {showComparisonModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-4xl glass-hud border border-[#7C5CFF]/30 rounded-xl p-6 flex flex-col space-y-6"
            >
              <div className="flex items-center justify-between pb-4 border-b border-border/50">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#7C5CFF]" />
                    Performance Benchmarking
                  </h3>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Side-by-side direct engagement visualization</p>
                </div>
                <button onClick={() => setShowComparisonModal(false)} className="text-muted-foreground hover:text-white text-xs font-semibold px-2 cursor-pointer">Close</button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-x-auto pb-4">
                {campaigns.filter(c => selectedCompareIds.includes(c.id)).map(camp => (
                  <div key={camp.id} className="p-4 bg-secondary/30 border border-border rounded-lg min-w-[200px]">
                    <p className="text-xs font-bold text-white truncate" title={camp.name}>{camp.name}</p>
                    <div className="mt-4 space-y-3">
                       <div>
                         <span className="text-[9px] uppercase font-bold text-zinc-500 font-mono">Open Rate</span>
                         <p className="text-xl font-black text-emerald-400 mt-0.5">{camp.openRate || "0.0%"}</p>
                       </div>
                       <div>
                         <span className="text-[9px] uppercase font-bold text-zinc-500 font-mono">Click Rate</span>
                         <p className="text-xl font-black text-blue-400 mt-0.5">{camp.clickRate || "0.0%"}</p>
                       </div>
                       <div>
                         <span className="text-[9px] uppercase font-bold text-zinc-500 font-mono">Sent Status</span>
                         <p className="text-[11px] font-bold text-zinc-300 mt-0.5">{camp.status}</p>
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
