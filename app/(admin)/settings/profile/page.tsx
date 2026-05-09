"use client";

import { UserProfile } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

export default function ProfileSettingsPage() {
  return (
    <div className="space-y-6 select-none max-h-screen overflow-y-auto pb-12 pr-1">
      {/* ─── Header Section ────────────────────────────────────────────── */}
      <div className="flex items-start justify-between border-b border-zinc-900 pb-5">
        <div>
          <p className="text-[11px] font-bold text-zinc-500 font-mono uppercase tracking-widest mb-1">
            Account Management
          </p>
          <h2 className="text-2xl font-black text-white tracking-tight leading-none">
            My Profile & Settings
          </h2>
        </div>
      </div>

      {/* ─── Personal Details & Security (Clerk UserProfile) ──────────────── */}
      <div className="flex justify-center xl:justify-start w-full py-4">
        <div className="w-full max-w-4xl rounded-lg overflow-hidden border border-zinc-900 shadow-2xl">
          <UserProfile
            routing="hash"
            appearance={{
              baseTheme: dark,
              elements: {
                cardBox: "border-none shadow-none w-full max-w-full",
                card: "border-none bg-transparent shadow-none p-0 w-full max-w-full",
                navbar: "hidden", // Hide navigation bar for absolute high-density focus
                scrollBox: "p-4 md:p-6 w-full max-w-full",
                page: "p-0 w-full max-w-full",
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
