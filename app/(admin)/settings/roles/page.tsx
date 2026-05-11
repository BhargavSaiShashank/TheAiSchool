"use client";

import { OrganizationProfile } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useStore } from "@/lib/store";
import { Users } from "lucide-react";
import { motion } from "framer-motion";

export default function RolesSettingsPage() {
  const { theme } = useStore();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 select-none max-w-[1000px] mx-auto w-full"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-[#7C5CFF]" />
            Roles & Teammates
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your organization members, invite new teammates, and
            configure access levels.
          </p>
        </div>
      </div>

      <div className="flex justify-start w-full">
        {/* We use Clerk's pre-built full-page Organization Profile component, skinned to match our dark mode */}
        <OrganizationProfile
          appearance={{
            baseTheme: theme === "light" ? undefined : dark,
            elements: {
              rootBox: "w-full max-w-[1000px]",
              card: "w-full max-w-[1000px] shadow-none bg-secondary/30 border border-border rounded-xl",
              navbar: "border-r border-border hidden sm:block",
              navbarButton:
                "text-muted-foreground hover:bg-secondary hover:text-foreground",
              pageScrollBox: "p-4 sm:p-8",
              headerTitle: "text-foreground",
              headerSubtitle: "text-muted-foreground",
              profileSectionTitleText: "text-foreground font-semibold",
              profileSectionPrimaryButton:
                "text-[#7C5CFF] hover:bg-[#7C5CFF]/10",
              badge: "bg-[#7C5CFF]/10 text-[#7C5CFF] border-[#7C5CFF]/20",
              formButtonPrimary: "bg-[#7C5CFF] hover:bg-[#6b4de0] text-white",
              tableHead: "text-muted-foreground font-medium",
              tableRow: "border-b border-border hover:bg-secondary/50",
              tableCell: "text-foreground",
            },
          }}
        />
      </div>
    </motion.div>
  );
}
