"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { motion } from "framer-motion";
import { Sparkles, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const { login } = useStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgName, setOrgName] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, orgName }),
      });

      if (res.ok) {
        const userSession = await res.json();
        login(userSession);
        router.push("/dashboard");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to register account.");
        setSubmitting(false);
      }
    } catch (err) {
      console.error("Signup fetch error:", err);
      setError("Network error occurred during registration.");
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-black text-white relative px-4 py-12 select-none min-h-screen">
      {/* Background radial lamp */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-white/[0.02] rounded-full blur-[110px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[400px] bg-zinc-950 border border-zinc-900 rounded-lg p-8 shadow-2xl relative z-10 glass"
      >
        {/* Branding */}
        <div className="flex flex-col items-center gap-3 text-center mb-8">
          <div className="w-11 h-11 rounded bg-white flex items-center justify-center text-black font-extrabold shadow-[0_0_15px_rgba(255,255,255,0.2)]">
            <Sparkles className="w-[22px] h-[22px] fill-black" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Create your PulseSend Workspace
            </h1>
            <p className="text-xs text-zinc-500 font-mono mt-1">
              Set up your admin profile and company workspace
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-950/20 border border-red-900/30 text-red-400 rounded text-xs font-mono">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-400 font-mono">
              Organization Name
            </label>
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="e.g. Acme Corp"
              required
              disabled={submitting}
              className="w-full px-3.5 py-2 rounded bg-zinc-900 border border-zinc-850 focus:outline-none focus:border-zinc-700 text-sm text-zinc-200 placeholder-zinc-700 transition"
            />
          </div>

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
              className="w-full px-3.5 py-2 rounded bg-zinc-900 border border-zinc-850 focus:outline-none focus:border-zinc-700 text-sm text-zinc-200 placeholder-zinc-700 transition"
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
              placeholder="Choose a strong password"
              required
              disabled={submitting}
              className="w-full px-3.5 py-2 rounded bg-zinc-900 border border-zinc-850 focus:outline-none focus:border-zinc-700 text-sm text-zinc-200 placeholder-zinc-700 transition"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded bg-white text-black hover:bg-zinc-200 text-xs font-extrabold flex items-center justify-center gap-2 transition cursor-pointer mt-6 shadow-[0_0_20px_rgba(255,255,255,0.08)] disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Creating Workspace...</span>
              </>
            ) : (
              <>
                <span>Get Started</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="mt-6 text-center text-xs text-zinc-500 font-mono">
          <span>Already have a workspace? </span>
          <Link href="/login" className="text-zinc-300 hover:text-white font-bold transition">
            Sign In
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
