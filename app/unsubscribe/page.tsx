"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MailOpen, Check, ShieldCheck, RefreshCw, Sparkles, Loader2 } from "lucide-react";

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const uid = searchParams.get("uid") || "";

  const [status, setStatus] = useState<"loading" | "unsubscribed" | "resubscribed" | "error">("loading");
  const [contactEmail, setContactEmail] = useState("");
  const [orgName, setOrgName] = useState("PulseSend Inc.");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!uid) {
      setStatus("error");
      return;
    }

    async function processUnsubscribe() {
      try {
        const res = await fetch("/api/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid }),
        });

        if (res.ok) {
          const data = await res.json();
          setContactEmail(data.email || "your address");
          setOrgName(data.orgName || "PulseSend Inc.");
          setStatus("unsubscribed");
        } else {
          setStatus("error");
        }
      } catch (err) {
        console.error("Unsubscribe error:", err);
        setStatus("error");
      }
    }

    processUnsubscribe();
  }, [uid]);

  const handleResubscribe = async () => {
    setProcessing(true);
    try {
      const res = await fetch("/api/unsubscribe", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid }),
      });

      if (res.ok) {
        setStatus("resubscribed");
      } else {
        alert("Failed to re-subscribe. Please try again.");
      }
    } catch (err) {
      console.error("Resubscribe error:", err);
    } finally {
      setProcessing(false);
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
        className="w-full max-w-md bg-zinc-950/40 backdrop-blur-md border border-zinc-900 rounded-2xl p-8 text-center relative z-10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
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
              <p className="text-zinc-400 font-mono text-sm">Processing opt-out request...</p>
            </motion.div>
          )}

          {status === "unsubscribed" && (
            <motion.div
              key="unsubscribed"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              <div className="w-16 h-16 rounded-full bg-red-950/20 border border-red-900/30 flex items-center justify-center text-red-500 mx-auto shadow-inner">
                <MailOpen className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight text-white">Unsubscribed</h1>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  You have been successfully unsubscribed from <span className="text-white font-semibold">{orgName}</span>'s mailing list.
                </p>
                {contactEmail && (
                  <p className="text-xs text-zinc-500 font-mono">
                    Affected: {contactEmail}
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-zinc-900 flex flex-col gap-3">
                <button
                  onClick={handleResubscribe}
                  disabled={processing}
                  className="w-full bg-[#7C5CFF]/10 hover:bg-[#7C5CFF]/20 border border-[#7C5CFF]/30 hover:border-[#7C5CFF]/50 text-[#9E86FF] font-semibold text-sm py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  {processing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  <span>Re-subscribe if this was an error</span>
                </button>
              </div>
            </motion.div>
          )}

          {status === "resubscribed" && (
            <motion.div
              key="resubscribed"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-6"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-950/20 border border-emerald-900/30 flex items-center justify-center text-emerald-500 mx-auto shadow-inner">
                <ShieldCheck className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight text-white">Successfully Re-subscribed!</h1>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Welcome back! You have been successfully added back to <span className="text-white font-semibold">{orgName}</span>'s active marketing lists.
                </p>
              </div>

              <p className="text-xs text-zinc-500 italic pt-2">
                You can safely close this browser window at any time.
              </p>
            </motion.div>
          )}

          {status === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-4"
            >
              <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mx-auto">
                <MailOpen className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-white">Invalid Request</h2>
              <p className="text-xs text-zinc-500 leading-relaxed max-w-xs mx-auto">
                This unsubscribe request is invalid or has expired. Please verify your link details.
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

export default function UnsubscribePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#7C5CFF]" />
      </div>
    }>
      <UnsubscribeContent />
    </Suspense>
  );
}
