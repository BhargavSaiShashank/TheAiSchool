"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sliders, Check, ShieldCheck, Sparkles, Loader2, Save } from "lucide-react";

function PreferencesContent() {
  const searchParams = useSearchParams();
  const uid = searchParams.get("uid") || "";

  const [status, setStatus] = useState<"loading" | "loaded" | "saved" | "error">("loading");
  const [contactEmail, setContactEmail] = useState("");
  const [orgName, setOrgName] = useState("PulseSend Inc.");
  const [allLists, setAllLists] = useState<any[]>([]);
  const [selectedListIds, setSelectedListIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!uid) {
      setStatus("error");
      return;
    }

    async function fetchPreferences() {
      try {
        const res = await fetch(`/api/preferences?uid=${uid}`);
        if (res.ok) {
          const data = await res.json();
          setContactEmail(data.email || "");
          setOrgName(data.orgName || "PulseSend Inc.");
          setAllLists(data.allLists || []);
          setSelectedListIds(data.subscribedListIds || []);
          setStatus("loaded");
        } else {
          setStatus("error");
        }
      } catch (err) {
        console.error("Preferences load error:", err);
        setStatus("error");
      }
    }

    fetchPreferences();
  }, [uid]);

  const handleToggleList = (id: string) => {
    if (selectedListIds.includes(id)) {
      setSelectedListIds(selectedListIds.filter((lId) => lId !== id));
    } else {
      setSelectedListIds([...selectedListIds, id]);
    }
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, listIds: selectedListIds }),
      });

      if (res.ok) {
        setStatus("saved");
      } else {
        alert("Failed to save preferences. Please try again.");
      }
    } catch (err) {
      console.error("Preferences save error:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Background glow backdrops */}
      <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-purple-600/[0.04] rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-blue-600/[0.03] rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-zinc-950/40 backdrop-blur-md border border-zinc-900 rounded-2xl p-8 relative z-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
      >
        <AnimatePresence mode="wait">
          {status === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center py-8 gap-4"
            >
              <Loader2 className="w-8 h-8 animate-spin text-[#7C5CFF]" />
              <p className="text-zinc-400 font-mono text-sm">Loading subscriber preferences...</p>
            </motion.div>
          )}

          {status === "loaded" && (
            <motion.div
              key="loaded"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3 border-b border-zinc-900 pb-4">
                <div className="w-10 h-10 rounded-xl bg-[#7C5CFF]/10 border border-[#7C5CFF]/20 flex items-center justify-center text-[#7C5CFF]">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-lg font-bold tracking-tight text-white leading-none mb-1">
                    Preference Centre
                  </h1>
                  <p className="text-[11px] text-zinc-500 font-mono leading-none">
                    Configure your subscriptions for {orgName}
                  </p>
                </div>
              </div>

              {contactEmail && (
                <div className="bg-zinc-900/30 border border-zinc-850 rounded-xl p-3 text-xs text-zinc-400 font-mono leading-none flex items-center justify-between">
                  <span>Active Email Address:</span>
                  <span className="text-white font-semibold">{contactEmail}</span>
                </div>
              )}

              <form onSubmit={handleSavePreferences} className="space-y-5">
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {allLists.length === 0 ? (
                    <p className="text-xs text-zinc-500 py-4 text-center">
                      No active newsletters listed for this organization.
                    </p>
                  ) : (
                    allLists.map((list) => {
                      const isSubscribed = selectedListIds.includes(list.id);
                      return (
                        <div
                          key={list.id}
                          onClick={() => handleToggleList(list.id)}
                          className={`flex items-start gap-3 p-3 rounded-xl border transition cursor-pointer ${
                            isSubscribed
                              ? "bg-[#7C5CFF]/5 border-[#7C5CFF]/30 hover:border-[#7C5CFF]/50"
                              : "bg-zinc-950/20 border-zinc-900 hover:border-zinc-800"
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded mt-0.5 border flex items-center justify-center transition shrink-0 ${
                              isSubscribed
                                ? "bg-[#7C5CFF] border-[#7C5CFF] text-black"
                                : "border-zinc-700"
                            }`}
                          >
                            {isSubscribed && <Check className="w-3 h-3 text-white stroke-[3px]" />}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white leading-none mb-1">
                              {list.name}
                            </p>
                            <p className="text-[10px] text-zinc-500 leading-normal">
                              {list.description || "No description specified."}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-white hover:bg-zinc-200 disabled:bg-zinc-900 text-black disabled:text-zinc-500 font-bold text-sm py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>Save Email Preferences</span>
                </button>
              </form>
            </motion.div>
          )}

          {status === "saved" && (
            <motion.div
              key="saved"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-950/20 border border-emerald-900/30 flex items-center justify-center text-emerald-500 mx-auto shadow-inner">
                <ShieldCheck className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight text-white">Preferences Saved!</h1>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Your list subscription preferences have been updated successfully for <span className="text-white font-semibold">{orgName}</span>.
                </p>
              </div>

              <p className="text-xs text-zinc-500 italic pt-2 leading-none">
                You can safely close this browser window.
              </p>
            </motion.div>
          )}

          {status === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-4 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mx-auto">
                <Sliders className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-white">Invalid Link</h2>
              <p className="text-xs text-zinc-500 leading-relaxed max-w-xs mx-auto">
                This preference request is invalid or has expired. Please verify your link details.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Brand signature */}
      <div className="mt-8 flex items-center gap-2 text-[11px] text-zinc-600 font-medium tracking-wide uppercase font-mono z-10">
        <Sparkles className="w-3.5 h-3.5" />
        <span>Powered by PulseSend Campaign Hub</span>
      </div>
    </div>
  );
}

export default function PreferencesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#7C5CFF]" />
      </div>
    }>
      <PreferencesContent />
    </Suspense>
  );
}
