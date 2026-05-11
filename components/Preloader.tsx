"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Defined outside component — stable reference, never re-allocated
const BOOT_LOGS = [
  "INIT:STACK_LOADED_OK",
  "SECURE:SES_SSL_ESTABLISHED",
  "CORE:CALIBRATING_CTR_ALGO",
  "SYNC:AUDIENCE_SEGMENTS_COMPILED",
  "READY:DEPLOYING_WORKSPACE",
];

export default function Preloader() {
  const [progress, setProgress] = useState(0);
  const [logIdx, setLogIdx] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Elegant non-linear percentage increment to feel highly realistic and calculated!
    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 100;
        }
        const diff = Math.floor(Math.random() * 15) + 8;
        const next = Math.min(prev + diff, 100);

        // Progressively advance the console log lines
        if (next < 25) setLogIdx(0);
        else if (next < 50) setLogIdx(1);
        else if (next < 75) setLogIdx(2);
        else if (next < 95) setLogIdx(3);
        else setLogIdx(4);

        return next;
      });
    }, 60);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#06070A] text-white overflow-hidden select-none">
      {/* Sleek dotted dark grid background */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e1b4b_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.15] pointer-events-none" />

      {/* Ambient background glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#7C5CFF]/[0.02] rounded-full blur-[140px] pointer-events-none animate-pulse" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#3B82F6]/[0.01] rounded-full blur-[100px] pointer-events-none" />

      {/* Futuristic Radar Sweep Line */}
      <motion.div
        initial={{ top: "-10%" }}
        animate={{ top: "110%" }}
        transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
        className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#7C5CFF]/20 to-transparent pointer-events-none"
      />

      <div className="relative flex flex-col items-center w-full max-w-sm px-6 space-y-8">
        {/* Glowing circular progress rail */}
        <div className="relative w-24 h-24 flex items-center justify-center">
          {/* Outer glow ring */}
          <div className="absolute inset-0 rounded-full border border-white/[0.02] shadow-[0_0_50px_rgba(124,92,255,0.05)]" />

          {/* Spinning dashed rail */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
            className="absolute inset-1 rounded-full border border-dashed border-[#7C5CFF]/25"
          />

          {/* Inner spinning continuous rail */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
            className="absolute inset-3 rounded-full border border-t-[#7C5CFF] border-r-transparent border-b-[#3B82F6]/40 border-l-transparent"
          />

          {/* Center core digital percentage */}
          <div className="absolute flex items-baseline justify-center">
            <span className="text-2xl font-mono font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-400 select-none">
              {String(progress).padStart(3, "0")}
            </span>
            <span className="text-[10px] font-mono font-bold text-[#7C5CFF] ml-0.5">
              %
            </span>
          </div>
        </div>

        {/* Console log ticker */}
        <div className="flex flex-col items-center justify-center space-y-1 h-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={logIdx}
              initial={{ opacity: 0, y: 5, filter: "blur(2px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -5, filter: "blur(2px)" }}
              transition={{ duration: 0.2 }}
              className="font-mono text-[9px] font-bold tracking-widest uppercase text-zinc-500 flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#7C5CFF] animate-pulse" />
              <span className="text-[#7C5CFF]">
                {BOOT_LOGS[logIdx].split(":")[0]}
              </span>
              <span className="text-zinc-600">❯</span>
              <span className="text-zinc-400 font-medium">
                {BOOT_LOGS[logIdx].split(":")[1]}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Sleek horizontal progress line with glow */}
        <div className="w-48 h-[1px] bg-white/[0.04] rounded-full overflow-hidden relative">
          <motion.div
            animate={{ width: `${progress}%` }}
            transition={{ ease: "easeOut", duration: 0.1 }}
            className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-[#3B82F6] to-[#7C5CFF] shadow-[0_0_10px_#7C5CFF]"
          />
        </div>
      </div>
    </div>
  );
}
