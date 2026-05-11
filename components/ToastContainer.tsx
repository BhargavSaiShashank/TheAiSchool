"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

interface Toast {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleToast = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (!customEvent.detail || !customEvent.detail.message) return;

      const newToast: Toast = {
        id: Math.random().toString(36).substring(2, 9),
        type: customEvent.detail.type || "info",
        message: customEvent.detail.message,
      };

      setToasts((prev) => [...prev, newToast]);

      // Auto-remove after 4 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 4000);
    };

    window.addEventListener("pulsesend:toast" as any, handleToast);
    return () => {
      window.removeEventListener("pulsesend:toast" as any, handleToast);
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full select-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="p-3.5 bg-black/85 backdrop-blur-md border border-white/[0.08] rounded shadow-[0_12px_40px_rgba(0,0,0,0.6)] flex items-start gap-3 relative overflow-hidden group"
          >
            {/* Ambient Type Glow */}
            <div
              className={`absolute top-0 bottom-0 left-0 w-[3px] ${
                toast.type === "success"
                  ? "bg-emerald-400 shadow-[0_0_8px_#34d399]"
                  : toast.type === "error"
                    ? "bg-rose-500 shadow-[0_0_8px_#f43f5e]"
                    : "bg-[#7C5CFF] shadow-[0_0_8px_#7c5cff]"
              }`}
            />

            {/* Icon */}
            {toast.type === "success" && (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
            )}
            {toast.type === "error" && (
              <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
            )}
            {toast.type === "info" && (
              <Info className="w-4 h-4 text-[#7C5CFF] mt-0.5 shrink-0" />
            )}

            {/* Message */}
            <p className="text-xs font-medium text-zinc-200 leading-normal flex-1 pr-4">
              {toast.message}
            </p>

            {/* Manual Dismiss */}
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 hover:bg-zinc-900 rounded border border-transparent hover:border-zinc-800 transition cursor-pointer text-zinc-500 hover:text-zinc-300"
            >
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
