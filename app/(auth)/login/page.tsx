"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore, UserSession } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ShieldAlert, Loader2, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login, ipAttempts, ipLockedUntil, incrementIpAttempts, resetIpAttempts } = useStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lockoutTimer, setLockoutTimer] = useState(0);

  // Handle lockout timing
  useEffect(() => {
    if (!ipLockedUntil) return;

    const interval = setInterval(() => {
      const remainingMs = new Date(ipLockedUntil).getTime() - Date.now();
      if (remainingMs <= 0) {
        resetIpAttempts();
        setLockoutTimer(0);
        clearInterval(interval);
      } else {
        setLockoutTimer(Math.ceil(remainingMs / 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [ipLockedUntil, resetIpAttempts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutTimer > 0) return;

    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const userSession = await res.json();
        resetIpAttempts();
        login(userSession);
        router.push("/dashboard");
      } else {
        const data = await res.json();
        incrementIpAttempts();
        setError(data.error || "Invalid email address or security credentials.");
        setSubmitting(false);
      }
    } catch (err) {
      console.error("Login fetch error:", err);
      incrementIpAttempts();
      setError("Network error occurred during sign-in.");
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-black text-white relative px-4 select-none">
      {/* Background radial lamp */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-white/[0.02] rounded-full blur-[110px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[400px] bg-zinc-950 border border-zinc-900 rounded-lg p-8 shadow-2xl relative z-10 glass"
      >
        {/* Lockout Screen Overlay */}
        <AnimatePresence>
          {lockoutTimer > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/95 rounded-lg z-20 flex flex-col items-center justify-center p-6 text-center"
            >
              <ShieldAlert className="w-10 h-10 text-red-500 mb-4 animate-bounce" />
              <h2 className="text-lg font-bold text-white mb-2">IP Temporarily Locked</h2>
              <p className="text-xs text-zinc-500 max-w-xs leading-relaxed">
                Too many failed login attempts have been registered. For your security, this IP has been blocked for 15 minutes.
              </p>
              <div className="mt-6 px-4 py-2 rounded border border-zinc-800 text-zinc-400 font-mono text-sm bg-zinc-900">
                Unlock in: <span className="text-white font-bold">{Math.floor(lockoutTimer / 60)}m {lockoutTimer % 60}s</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Branding */}
        <div className="flex flex-col items-center gap-3 text-center mb-8">
          <div className="w-11 h-11 rounded bg-white flex items-center justify-center text-black font-extrabold shadow-[0_0_15px_rgba(255,255,255,0.2)]">
            <Sparkles className="w-[22px] h-[22px] fill-black" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Sign In to PulseSend
            </h1>
            <p className="text-xs text-zinc-500 font-mono mt-1">
              Enter your campaign credentials below
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-400 font-mono">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. admin@acme.com"
              required
              disabled={submitting}
              className="w-full px-3.5 py-2 rounded bg-zinc-900 border border-zinc-850 focus:outline-none focus:border-zinc-700 text-sm text-zinc-200 placeholder-zinc-600 transition"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-400 font-mono">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[10px] text-zinc-500 hover:text-white transition cursor-pointer"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={submitting}
              className="w-full px-3.5 py-2 rounded bg-zinc-900 border border-zinc-850 focus:outline-none focus:border-zinc-700 text-sm text-zinc-200 placeholder-zinc-600 transition"
            />
          </div>

          {/* Validation Feedback */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-2 text-xs text-red-400 bg-red-950/20 border border-red-900/40 p-3 rounded"
            >
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded bg-white text-black hover:bg-zinc-200 font-semibold text-sm transition mt-6 flex items-center justify-center gap-2 cursor-pointer shadow-lg"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-zinc-900 text-center text-xs text-zinc-500 font-mono">
          <span>Don't have a workspace? </span>
          <a href="/signup" className="text-zinc-300 hover:text-white font-bold transition">
            Sign Up
          </a>
        </div>
      </motion.div>
    </div>
  );
}
