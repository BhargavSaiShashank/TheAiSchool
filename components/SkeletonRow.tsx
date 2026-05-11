"use client";

import { motion } from "framer-motion";

export default function SkeletonRow() {
  return (
    <div className="flex items-center justify-between py-4 border-b border-white/[0.03] animate-pulse">
      <div className="flex items-center gap-3 w-1/3">
        {/* Mock avatar / icon */}
        <div className="w-8 h-8 rounded-md bg-zinc-900 border border-white/[0.04] relative overflow-hidden">
          <motion.div
            animate={{ x: ["-100%", "100%"] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent"
          />
        </div>
        {/* Mock text label */}
        <div className="h-3 w-2/3 rounded bg-zinc-900 relative overflow-hidden">
          <motion.div
            animate={{ x: ["-100%", "100%"] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent"
          />
        </div>
      </div>

      {/* Mock metric columns */}
      <div className="h-3 w-1/6 rounded bg-zinc-900 relative overflow-hidden">
        <motion.div
          animate={{ x: ["-100%", "100%"] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent"
        />
      </div>

      <div className="h-3 w-1/12 rounded bg-zinc-900 relative overflow-hidden">
        <motion.div
          animate={{ x: ["-100%", "100%"] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent"
        />
      </div>
    </div>
  );
}
