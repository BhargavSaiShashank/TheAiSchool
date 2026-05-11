"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { useUser, useAuth, useOrganizationList, useClerk } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Loader2,
  LogOut,
  UserCheck,
  AlertTriangle,
} from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { signOut } = useClerk();
  const { user: clerkUser } = useUser();
  const { isLoaded, isSignedIn } = useUser();
  const { orgId } = useAuth();

  const {
    setActive,
    userMemberships,
    isLoaded: isOrgListLoaded,
  } = useOrganizationList({
    userMemberships: { infinite: true, keepPreviousData: true },
  });

  const [hasHydrated, setHasHydrated] = useState(false);
  const [interceptActive, setInterceptActive] = useState(false);
  const [isHandlingSignOut, setIsHandlingSignOut] = useState(false);

  useEffect(() => {
    setHasHydrated(useStore.persist.hasHydrated());
    const unsubFinishHydration = useStore.persist.onFinishHydration(() =>
      setHasHydrated(true),
    );
    return () => unsubFinishHydration();
  }, []);

  // --- 🛡️ CROSSOVER INTERCEPTOR TRIGGER ---
  useEffect(() => {
    if (!hasHydrated || !isLoaded || !isSignedIn) return;

    const urlString =
      typeof window !== "undefined" ? window.location.search : "";
    const isInviteLink =
      urlString.includes("__clerk_") || urlString.includes("ticket");

    // If landing with an invitation ticket WHILE signed in, PAUSE flow for user confirmation!
    if (isInviteLink) {
      setInterceptActive(true);
    }
  }, [hasHydrated, isLoaded, isSignedIn]);

  const handleConfirmMerge = () => {
    setInterceptActive(false); // Releases block, allows normal useEffect logic to execute
  };

  const handleSignOutForSwitch = async () => {
    setIsHandlingSignOut(true);
    // 💣 Perform nuclear logout clearing ALL artifacts before re-prompting
    await signOut();
    useStore.getState().logout();
    // The router re-evaluates automatically on state change
  };

  // --- MAIN EXECUTION FLOW ---
  useEffect(() => {
    // 1. Preliminary Load Checks & Intercept Lockdown
    if (!hasHydrated || !isLoaded || interceptActive) return;

    // 2. Determine Request Persona
    const urlString =
      typeof window !== "undefined" ? window.location.search : "";
    const isClerkFlow =
      urlString.includes("__clerk_") || urlString.includes("invitation");

    // 🛡️ PERF WIN: If normal navigation, BYPASS organization list wait period entirely!
    if (!isClerkFlow && isSignedIn) {
      router.push("/dashboard");
      return;
    }

    // 3. Invitation Handling Path: Require full data availability.
    if (isClerkFlow && isSignedIn && !isOrgListLoaded) return;

    if (isSignedIn) {
      // --- 🛡️ INVITATION HANDSHAKE DETECTOR ---
      const executeRedirect = () => {
        router.push("/dashboard");
      };

      if (
        isClerkFlow &&
        setActive &&
        userMemberships?.data &&
        userMemberships.data.length > 0
      ) {
        const sortedMemberships = [...userMemberships.data].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        const newestMembership = sortedMemberships[0];

        if (newestMembership.organization.id !== orgId) {
          console.log(
            "🚀 INVITATION CONFIRMED! Hot-swapping workspace...",
            newestMembership.organization.name,
          );
          useStore.getState().logout();
          setActive({ organization: newestMembership.organization.id })
            .then(executeRedirect)
            .catch((err) => {
              console.error("Auto-switch failed:", err);
              executeRedirect();
            });
          return;
        }
      }
      executeRedirect();
    } else {
      router.push("/signup");
    }
  }, [
    isSignedIn,
    isLoaded,
    isOrgListLoaded,
    hasHydrated,
    router,
    orgId,
    userMemberships.data,
    setActive,
    interceptActive,
  ]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-black text-white relative h-screen w-screen overflow-hidden">
      <AnimatePresence mode="wait">
        {interceptActive ? (
          <motion.div
            key="intercept-modal"
            initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm px-4"
          >
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-8 w-full max-w-md text-center shadow-[0_0_60px_rgba(0,0,0,0.7)] relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-amber-500/[0.03] to-transparent pointer-events-none" />

              <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-7 h-7 text-amber-500" />
              </div>

              <h2 className="text-xl font-bold text-white mb-2">
                Identity Conflict Detected
              </h2>
              <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
                You clicked an invitation link, but you are currently logged in
                as:
                <br />
                <span className="font-mono font-medium text-white bg-zinc-800 px-2 py-1 rounded mt-2 inline-block border border-zinc-700">
                  {clerkUser?.emailAddresses[0]?.emailAddress || "Active User"}
                </span>
              </p>

              <div className="grid gap-3">
                <button
                  onClick={handleConfirmMerge}
                  disabled={isHandlingSignOut}
                  className="flex items-center justify-center gap-2 w-full bg-white text-black py-3 px-4 rounded-xl font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50"
                >
                  <UserCheck className="w-4 h-4" />
                  Continue as this user
                </button>

                <button
                  onClick={handleSignOutForSwitch}
                  disabled={isHandlingSignOut}
                  className="flex items-center justify-center gap-2 w-full bg-zinc-800 border border-zinc-700 text-white py-3 px-4 rounded-xl font-medium hover:bg-zinc-700 hover:border-zinc-600 transition-all disabled:opacity-50"
                >
                  {isHandlingSignOut ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <LogOut className="w-4 h-4 text-red-400" />
                  )}
                  Sign Out & Use Different Account
                </button>
              </div>

              <p className="text-[10px] text-zinc-600 mt-6 uppercase tracking-widest font-medium">
                Shield Protocol Alpha-V1
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="main-loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-6 text-center z-10"
          >
            <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-black shadow-[0_0_30px_rgba(139,92,246,0.35)] animate-pulse">
              <Sparkles className="w-7 h-7 fill-white text-white" />
            </div>
            <div className="space-y-1.5">
              <h1 className="text-2xl font-bold tracking-tight text-white">
                SynapseSend
              </h1>
              <p className="text-xs text-zinc-500 font-medium tracking-wide uppercase font-mono">
                Modern High-Performance Campaigns
              </p>
            </div>
            <div className="flex items-center gap-2 text-zinc-500 mt-4 text-xs font-mono">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400" />
              <span>Securing session parameters...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-white/[0.03] rounded-full blur-[100px] pointer-events-none z-0" />
    </div>
  );
}
