"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building, Mail, Globe, Sparkles, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";

interface OnboardingWizardProps {
  currentEmail: string;
  currentOrgName: string;
  onComplete: (updatedName: string, updatedRegion: string) => void;
}

export default function OnboardingWizard({
  currentEmail,
  currentOrgName,
  onComplete,
}: OnboardingWizardProps) {
  const [orgName, setOrgName] = useState(currentOrgName || "");
  const [senderEmail, setSenderEmail] = useState(currentEmail || "");
  const [awsRegion, setAwsRegion] = useState("us-east-1");
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim() || !senderEmail.trim()) return;

    setIsSaving(true);
    try {
      const response = await fetch("/api/org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: orgName,
          fromEmail: senderEmail,
          region: awsRegion,
        }),
      });

      if (response.ok) {
        // Artificial success delay for visual gratification
        setTimeout(() => {
          setIsSaving(false);
          onComplete(orgName, awsRegion);
        }, 1000);
      } else {
        setIsSaving(false);
      }
    } catch (err) {
      console.error("Onboarding Save Error:", err);
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-[#09090B]">
      {/* Premium Dynamic Backdrop */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#7C5CFF]/20 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#3b82f6]/10 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md mx-4 bg-zinc-900/50 border border-zinc-800 backdrop-blur-2xl rounded-2xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] overflow-hidden"
      >
        {/* Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500 via-[#7C5CFF] to-purple-500" />

        <div className="p-8 pt-10">
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-[#7C5CFF]/10 border border-[#7C5CFF]/20 rounded-2xl mb-4">
              <Sparkles className="w-7 h-7 text-[#7C5CFF]" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Welcome to PulseSend</h1>
            <p className="text-zinc-400 text-sm mt-2">
              Let's quickly configure your isolated workspace to unlock the platform.
            </p>
          </div>

          {/* Form Section */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-xs font-bold text-zinc-300 uppercase tracking-wider">
                <Building className="w-3.5 h-3.5 text-[#7C5CFF]" />
                Organization Name
              </label>
              <input
                type="text"
                required
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="E.g. The AI School"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]/50 focus:border-[#7C5CFF] transition-all duration-200"
              />
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-xs font-bold text-zinc-300 uppercase tracking-wider">
                <Mail className="w-3.5 h-3.5 text-[#7C5CFF]" />
                Default Sender Identity
              </label>
              <input
                type="email"
                required
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                placeholder="hello@yourbusiness.com"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]/50 focus:border-[#7C5CFF] transition-all duration-200"
              />
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-xs font-bold text-zinc-300 uppercase tracking-wider">
                <Globe className="w-3.5 h-3.5 text-[#7C5CFF]" />
                AWS Dispatch Region
              </label>
              <div className="relative">
                <select
                  value={awsRegion}
                  onChange={(e) => setAwsRegion(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#7C5CFF]/50 focus:border-[#7C5CFF] transition-all duration-200"
                >
                  <option value="us-east-1">US East (N. Virginia)</option>
                  <option value="us-east-2">US East (Ohio)</option>
                  <option value="us-west-2">US West (Oregon)</option>
                  <option value="eu-west-1">Europe (Ireland)</option>
                  <option value="eu-central-1">Europe (Frankfurt)</option>
                  <option value="ap-south-1">Asia Pacific (Mumbai)</option>
                  <option value="ap-northeast-1">Asia Pacific (Tokyo)</option>
                  <option value="eu-north-1">Europe (Stockholm)</option>
                </select>
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-zinc-500">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Setup Requirements Checklist */}
            <div className="bg-zinc-950/50 border border-zinc-800/50 rounded-lg p-3 text-[11px] text-zinc-500 space-y-1.5 mt-6">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Secure isolated Postgres Schema allocated
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Ready to process AWS SES integration
              </div>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full relative group mt-4 overflow-hidden rounded-lg"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#7C5CFF] to-[#5A38FF] group-hover:scale-105 transition-transform duration-300" />
              <div className="relative py-3 px-4 flex items-center justify-center gap-2 text-white text-sm font-bold shadow-lg shadow-[#7C5CFF]/20">
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Finalizing Environment...</span>
                  </>
                ) : (
                  <>
                    <span>Initialize Account</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </div>
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
