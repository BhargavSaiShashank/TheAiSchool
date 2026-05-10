"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { motion } from "framer-motion";
import { Sparkles, Loader2 } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { user } = useStore();
  const [loading, setLoading] = useState(true);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(useStore.persist.hasHydrated());
    const unsubFinishHydration = useStore.persist.onFinishHydration(() => setHasHydrated(true));
    return () => {
      unsubFinishHydration();
    };
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;
    if (user) {
      router.push("/dashboard");
    } else {
      router.push("/signup");
    }
  }, [user, router, hasHydrated]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-black text-white relative">
      {/* Background glow lamp */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-white/[0.03] rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center gap-6 text-center z-10"
      >
        {/* Brand Icon */}
        <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-black shadow-[0_0_30px_rgba(139,92,246,0.35)] animate-pulse">
          <Sparkles className="w-7 h-7 fill-white text-white" />
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            SynapseSend
          </h1>
          <p className="text-xs text-zinc-500 font-medium tracking-wide uppercase font-mono">
            Modern High-Performance Campaigns
          </p>
        </div>

        {/* Loader Spinner */}
        <div className="flex items-center gap-2 text-zinc-500 mt-4 text-xs font-mono">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400" />
          <span>Securing session parameters...</span>
        </div>
      </motion.div>
    </div>
  );
}
