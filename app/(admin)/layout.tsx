"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useStore } from "@/lib/store";
import { useUser, useOrganization } from "@clerk/nextjs";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import Preloader from "@/components/Preloader";
import CommandPalette from "@/components/CommandPalette";
import ToastContainer from "@/components/ToastContainer";
import WarpGridCanvas from "@/components/WarpGridCanvas";
import OnboardingWizard from "@/components/OnboardingWizard";

import { motion, AnimatePresence } from "framer-motion";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, login, theme } = useStore();
  const { user: clerkUser, isLoaded } = useUser();
  const { organization, isLoaded: isOrgLoaded } = useOrganization();
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Automatically close drawer on route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (theme === "light") {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    }
  }, [theme]);
  const [pageChanging, setPageChanging] = useState(false);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(useStore.persist.hasHydrated());
    const unsubFinishHydration = useStore.persist.onFinishHydration(() => setHasHydrated(true));
    return () => {
      unsubFinishHydration();
    };
  }, []);

  // Real-time Clerk session + Organization context synchronization!
  useEffect(() => {
    if (!isLoaded || !isOrgLoaded) return;

    if (!clerkUser) {
      useStore.getState().logout();
      router.push("/login");
      return;
    }

    // CALCULATE ACTIVE TARGET ORG ID (Handles null properly for solo mode)
    const currentClerkOrgId = organization?.id || "SOLO_MODE";
    const activeCachedOrg = user?.org_id || "NONE";

    // CRITICAL TRIGGER: If IDs don't match OR we don't have cached state, command immediate sync!
    const needsSync = 
      !user || 
      user.id !== clerkUser.id || 
      (organization?.id && user?.aws_region === undefined); // Triggers refresh on new orgs to check region status

    // However, to be absolutely bulletproof on Rule #2, we also enforce forced syncing on ANY org object fluctuation
    const syncSession = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const dbUser = await res.json();
          
          // Compare active organization IDs. If changed, this forces a hard-reload re-sync effectively purging old state!
          if (user && user.org_id && dbUser.org_id !== user.org_id) {
             console.log("🚨 ORGANIZATION SWAP DETECTED! COMMANDING PURGE & RELOAD...");
             // Directly inject the new profile and command the next.js router to hard refresh
             login(dbUser);
             router.refresh();
             return;
          }

          login(dbUser);
        }
      } catch (error) {
        console.error("Failed to sync Clerk session with DB:", error);
      }
    };

    syncSession();
    
  }, [clerkUser, isLoaded, organization?.id, isOrgLoaded]); // LISTEN TO ORGANIZATION ID SHIFTS DIRECTLY!

  useEffect(() => {
    if (!hasHydrated || !isLoaded) return;
    setMounted(true);
  }, [hasHydrated, isLoaded]);

  // Trigger cinematic preloader on route change
  useEffect(() => {
    if (!mounted || !user || !clerkUser) return;
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

  if (!mounted || !user || !clerkUser) {
    return <Preloader />;
  }

  // Visual Atmosphere System: Dynamic Section-Specific Glow Background
  const getAtmosphereGlow = () => {
    const isLight = theme === "light";
    if (pathname.startsWith("/dashboard")) {
      // Dashboard: subtle purple telemetry glow
      return isLight
        ? "radial-gradient(circle at 50% -10%, rgba(124, 92, 255, 0.03) 0%, rgba(124, 92, 255, 0) 60%)"
        : "radial-gradient(circle at 50% -10%, rgba(124, 92, 255, 0.08) 0%, rgba(124, 92, 255, 0) 60%)";
    }
    if (pathname.startsWith("/analytics")) {
      // Analytics: cool blue data atmosphere
      return isLight
        ? "radial-gradient(circle at 50% -10%, rgba(59, 130, 246, 0.03) 0%, rgba(59, 130, 246, 0) 60%)"
        : "radial-gradient(circle at 50% -10%, rgba(59, 130, 246, 0.07) 0%, rgba(59, 130, 246, 0) 60%)";
    }
    if (pathname.startsWith("/templates")) {
      // Templates: softer creative lighting tone
      return isLight
        ? "radial-gradient(circle at 50% -10%, rgba(99, 102, 241, 0.03) 0%, rgba(99, 102, 241, 0) 60%)"
        : "radial-gradient(circle at 50% -10%, rgba(99, 102, 241, 0.06) 0%, rgba(99, 102, 241, 0) 60%)";
    }
    if (pathname.includes("suppression")) {
      // Suppression: darker with muted red undertones
      return isLight
        ? "radial-gradient(circle at 50% -10%, rgba(239, 68, 68, 0.02) 0%, rgba(239, 68, 68, 0) 65%)"
        : "radial-gradient(circle at 50% -10%, rgba(239, 68, 68, 0.04) 0%, rgba(239, 68, 68, 0) 65%)";
    }
    if (pathname.startsWith("/campaigns")) {
      // Campaigns: balanced purple-blue intensity
      return isLight
        ? "radial-gradient(circle at 50% -10%, rgba(139, 92, 246, 0.03) 0%, rgba(59, 130, 246, 0.02) 40%, rgba(0, 0, 0, 0) 70%)"
        : "radial-gradient(circle at 50% -10%, rgba(139, 92, 246, 0.07) 0%, rgba(59, 130, 246, 0.04) 40%, rgba(0, 0, 0, 0) 70%)";
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
      {/* Floating Ambient Glowing Blobs (Hardware Optimized Static) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30 z-0">
        <div className="absolute top-[-10%] left-[15%] w-[450px] h-[450px] bg-[#7C5CFF]/[0.05] rounded-full blur-[130px]" />
        <div className="absolute bottom-[10%] right-[10%] w-[500px] h-[500px] bg-[#3B82F6]/[0.04] rounded-full blur-[140px]" />
      </div>
      {/* Subtle Grid Overlay */}
      <div className={`absolute inset-0 pointer-events-none opacity-80 ${
        theme === "light" 
          ? "bg-[radial-gradient(rgba(15,23,42,0.015)_1px,transparent_1px)]" 
          : "bg-[radial-gradient(rgba(255,255,255,0.015)_1px,transparent_1px)]"
      } [background-size:24px_24px]`} />
      <WarpGridCanvas />

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

      {/* Desktop Static Sidebar (Hidden on Mobile) */}
      <div className="hidden md:flex shrink-0 h-screen">
        {hasHydrated ? (
          <Sidebar />
        ) : (
          /* Stable Static Spacer to prevent content shifting during microsecond hydration */
          <div className="w-[240px] h-screen bg-background border-r border-border shrink-0" />
        )}
      </div>

      {/* --- MOBILE RESPONSIVE DRAWER OVERLAY --- */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 z-[100] bg-black/60 md:hidden backdrop-blur-sm"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="fixed top-0 left-0 bottom-0 z-[101] w-[260px] bg-background md:hidden border-r border-border shadow-2xl"
            >
              <div className="h-full w-full flex flex-col bg-background" style={{ width: '260px' }}>
                <Sidebar onClose={() => setIsMobileMenuOpen(false)} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Panel (right) */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10 h-screen overflow-hidden">
        {/* Header */}
        <Header onMenuClick={() => setIsMobileMenuOpen(true)} />

        {/* Content area */}
        <main className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 md:py-6 relative">
          <div className="max-w-[1400px] mx-auto w-full flex flex-col gap-4 md:gap-6 min-h-[calc(100vh-52px-48px)]">
            {children}
          </div>
        </main>
      </div>

      {/* --- FIRST-TIME ONBOARDING INTERCEPTOR --- */}
      <AnimatePresence>
        {/* Added strict null-check to user object and enforced SUPER_ADMIN role boundary to prevent viewers/managers from seeing technical prompts */}
        {hasHydrated && user && user.role === "SUPER_ADMIN" && (!user?.aws_region || user.aws_region === "") && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999]"
          >
            <OnboardingWizard
              currentEmail={user.email}
              currentOrgName={user.org_name}
              onComplete={(updatedName, updatedRegion) => {
                // Instantly update client state to unlock the dashboard reactively!
                login({
                  ...user,
                  org_name: updatedName,
                  aws_region: updatedRegion
                });
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

