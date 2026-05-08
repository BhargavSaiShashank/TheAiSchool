"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useStore } from "@/lib/store";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import Preloader from "@/components/Preloader";

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

  useEffect(() => {
    setMounted(true);
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

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

  return (
    <div className="flex-1 flex h-screen overflow-hidden bg-background relative">
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
