"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useStore } from "@/lib/store";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import Preloader from "@/components/Preloader";
import CommandPalette from "@/components/CommandPalette";
import ToastContainer from "@/components/ToastContainer";

import { motion, AnimatePresence } from "framer-motion";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useStore();
  const [mounted, setMounted] = useState(false);
  const [pageChanging, setPageChanging] = useState(false);
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
    setMounted(true);
    if (!user) {
      router.push("/login");
    }
  }, [user, router, hasHydrated]);

  // Trigger cinematic preloader on route change
  useEffect(() => {
    if (!mounted || !user) return;
    setPageChanging(true);

    // Safety fallback: guaranteed to fade out after a maximum of 950ms if no page event is dispatched!
    const safetyTimer = setTimeout(() => {
      setPageChanging(false);
    }, 950);

    return () => clearTimeout(safetyTimer);
  }, [pathname, mounted, user]);

  // Synchronize loading states with child pages via custom events!
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleLoading = () => {
      setPageChanging(true);
    };

    const handleReady = () => {
      // Slight 250ms buffer to let the browser paint the loaded state before fading out elegantly!
      setTimeout(() => {
        setPageChanging(false);
      }, 250);
    };

    window.addEventListener("pulsesend:loading", handleLoading);
    window.addEventListener("pulsesend:ready", handleReady);

    return () => {
      window.removeEventListener("pulsesend:loading", handleLoading);
      window.removeEventListener("pulsesend:ready", handleReady);
    };
  }, [mounted]);

  if (!mounted || !user) {
    return null;
  }

  // Visual Atmosphere System: Dynamic Section-Specific Glow Background
  const getAtmosphereGlow = () => {
    if (pathname.startsWith("/dashboard")) {
      // Dashboard: subtle purple telemetry glow
      return "radial-gradient(circle at 50% -10%, rgba(124, 92, 255, 0.08) 0%, rgba(124, 92, 255, 0) 60%)";
    }
    if (pathname.startsWith("/analytics")) {
      // Analytics: cool blue data atmosphere
      return "radial-gradient(circle at 50% -10%, rgba(59, 130, 246, 0.07) 0%, rgba(59, 130, 246, 0) 60%)";
    }
    if (pathname.startsWith("/templates")) {
      // Templates: softer creative lighting tone
      return "radial-gradient(circle at 50% -10%, rgba(99, 102, 241, 0.06) 0%, rgba(99, 102, 241, 0) 60%)";
    }
    if (pathname.includes("suppression")) {
      // Suppression: darker with muted red undertones
      return "radial-gradient(circle at 50% -10%, rgba(239, 68, 68, 0.04) 0%, rgba(239, 68, 68, 0) 65%)";
    }
    if (pathname.startsWith("/campaigns")) {
      // Campaigns: balanced purple-blue intensity
      return "radial-gradient(circle at 50% -10%, rgba(139, 92, 246, 0.07) 0%, rgba(59, 130, 246, 0.04) 40%, rgba(0, 0, 0, 0) 70%)";
    }
    // Default structured/clean low visual noise
    return "radial-gradient(circle at 50% -10%, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0) 50%)";
  };

  return (
    <div className="flex-1 flex h-screen overflow-hidden bg-background relative selection:bg-primary/20 selection:text-primary-foreground">
      {/* Visual Atmosphere Background Overlays */}
      <div 
        className="absolute inset-0 pointer-events-none transition-all duration-1000 ease-in-out"
        style={{ backgroundImage: getAtmosphereGlow() }}
      />
      {/* Subtle Grid Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.015)_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-80" />

      <AnimatePresence>
        {pageChanging && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed inset-0 z-[9999]"
          >
            <Preloader />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global CMD+K / CTRL+K Command palette */}
      <CommandPalette />
      <ToastContainer />

      {/* Sidebar (left) */}
      <Sidebar />

      {/* Main Panel (right) */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* Header */}
        <Header />

        {/* Content area */}
        <main className="flex-1 overflow-y-auto px-6 py-6 relative">
          <div className="max-w-[1400px] mx-auto w-full flex flex-col gap-6 min-h-[calc(100vh-52px-48px)]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

