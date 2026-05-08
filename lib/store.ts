import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface UserSession {
  id: string;
  email: string;
  role: "SUPER_ADMIN" | "CAMPAIGN_MANAGER" | "VIEWER";
  org_id: string;
  org_name: string;
}

interface PulseSendState {
  user: UserSession | null;
  sidebarCollapsed: boolean;
  activeRoute: string;
  commandPaletteOpen: boolean;
  ipAttempts: number;
  ipLockedUntil: string | null;
  
  // Actions
  login: (user: UserSession) => void;
  logout: () => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setActiveRoute: (route: string) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  incrementIpAttempts: () => void;
  lockIp: (minutes: number) => void;
  resetIpAttempts: () => void;
}

export const useStore = create<PulseSendState>()(
  persist(
    (set) => ({
      user: null,
      sidebarCollapsed: false,
      activeRoute: "/dashboard",
      commandPaletteOpen: false,
      ipAttempts: 0,
      ipLockedUntil: null,

      login: (user) => set({ user }),
      logout: () => set({ user: null }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setActiveRoute: (route) => set({ activeRoute: route }),
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
      
      incrementIpAttempts: () => set((state) => {
        const attempts = state.ipAttempts + 1;
        if (attempts >= 5) {
          const lockTime = new Date(Date.now() + 15 * 60 * 1000).toISOString();
          return { ipAttempts: attempts, ipLockedUntil: lockTime };
        }
        return { ipAttempts: attempts };
      }),
      
      lockIp: (minutes) => set({
        ipLockedUntil: new Date(Date.now() + minutes * 60 * 1000).toISOString()
      }),
      
      resetIpAttempts: () => set({ ipAttempts: 0, ipLockedUntil: null }),
    }),
    {
      name: "pulsesend-storage",
    }
  )
);
