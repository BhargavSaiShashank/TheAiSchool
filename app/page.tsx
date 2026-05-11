"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { useUser, useAuth, useOrganizationList } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { Sparkles, Loader2 } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { user } = useStore();
  const { isLoaded, isSignedIn } = useUser();
  const { orgId } = useAuth();
  const { setActive, userMemberships, isLoaded: isOrgListLoaded } = useOrganizationList({
    userMemberships: {
      infinite: true,
      keepPreviousData: true,
    },
  });
  
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(useStore.persist.hasHydrated());
    const unsubFinishHydration = useStore.persist.onFinishHydration(() => setHasHydrated(true));
    return () => {
      unsubFinishHydration();
    };
  }, []);

  useEffect(() => {
    // 1. Preliminary Load Checks
    if (!hasHydrated || !isLoaded) return;

    // 2. Determine Request Persona
    const urlString = typeof window !== "undefined" ? window.location.search : "";
    const isClerkFlow = urlString.includes("__clerk_") || urlString.includes("invitation");

    // 🛡️ PERF WIN: If normal navigation, BYPASS organization list wait period entirely!
    if (!isClerkFlow && isSignedIn) {
       router.push("/dashboard");
       return;
    }

    // 3. Invitation Handling Path: Require full data availability.
    if (isClerkFlow && isSignedIn && !isOrgListLoaded) return;

    if (isSignedIn) {
      // --- 🛡️ INVITATION HANDSHAKE DETECTOR ---
      // User just accepted an invite. We must compute the absolute newest membership and enforce it!
      const executeRedirect = () => {
         router.push("/dashboard");
      };

      if (isClerkFlow && setActive && userMemberships?.data && userMemberships.data.length > 0) {
        // Sort memberships by creation date descending to find the absolute newest one (the one just accepted)
        const sortedMemberships = [...userMemberships.data].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        
        const newestMembership = sortedMemberships[0];
        
        // Only trigger setActive if the newest org is not ALREADY active!
        if (newestMembership.organization.id !== orgId) {
          console.log("🚀 INVITATION DETECTED! Purging stale cache and switching active workspace to:", newestMembership.organization.name);
          
          // 💣 PURGE STALE CACHE: Clears the old "Super Admin" identity so AdminLayout locks behind preloader!
          useStore.getState().logout();

          setActive({ organization: newestMembership.organization.id })
            .then(executeRedirect)
            .catch((err) => {
              console.error("Failed to auto-switch org:", err);
              executeRedirect();
            });
          return; // Exit effect to await completion of the setActive promise
        }
      }

      // Normal entry: Clerk already maintains the last-active organization inherently. Proceed safely.
      executeRedirect();
    } else {
      // No session detected. Push to signup flow.
      router.push("/signup");
    }
  }, [isSignedIn, isLoaded, isOrgListLoaded, hasHydrated, router, orgId, userMemberships.data, setActive]);

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
