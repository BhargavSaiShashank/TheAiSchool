"use client";

import React, { useState, useCallback } from "react";
import Papa from "papaparse";
import { motion, AnimatePresence } from "framer-motion";
import { 
  UploadCloud, CheckCircle2, AlertTriangle, FileSpreadsheet, 
  ChevronRight, Loader2, X, RefreshCw 
} from "lucide-react";
import { toast } from "@/lib/toast";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  targetListId?: string;
  onComplete?: () => void;
}

const TARGET_FIELDS = [
  { key: "email", label: "Email Address * (Required)", required: true },
  { key: "firstName", label: "First Name", required: false },
  { key: "lastName", label: "Last Name", required: false },
  { key: "company", label: "Company Name", required: false },
  { key: "jobTitle", label: "Job Title", required: false },
  { key: "city", label: "City Location", required: false }
];

export default function CsvImportWizard({ isOpen, onClose, targetListId, onComplete }: Props) {
  const [step, setStep] = useState<"upload" | "map" | "processing" | "success">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<any[]>([]);
  
  // Map storage: key is DB field, value is CSV header
  const [mappings, setMappings] = useState<Record<string, string>>({});
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Step 1: Handle File Load
  const onDrop = (e: React.ChangeEvent<HTMLInputElement>) => {
    const loaded = e.target.files?.[0];
    if (!loaded) return;
    
    if (!loaded.name.endsWith(".csv")) {
      toast.error("Illegal file format. Must be raw CSV stream.");
      return;
    }

    setFile(loaded);
    Papa.parse(loaded, {
      header: true,
      skipEmptyLines: true,
      preview: 50, // Only preview first 50 for UI perf
      complete: (results) => {
        setHeaders(results.meta.fields || []);
        setRawRows(results.data);
        
        // Perform sensible predictive mapping based on key naming
        const initial: Record<string, string> = {};
        const heads = results.meta.fields || [];
        heads.forEach(h => {
          const lh = h.toLowerCase().trim();
          if (lh.includes("email") || lh === "mail") initial["email"] = h;
          if (lh.includes("first") || lh === "fname") initial["firstName"] = h;
          if (lh.includes("last") || lh === "lname") initial["lastName"] = h;
          if (lh.includes("comp")) initial["company"] = h;
          if (lh.includes("city")) initial["city"] = h;
          if (lh.includes("title") || lh.includes("job")) initial["jobTitle"] = h;
        });
        setMappings(initial);
        setStep("map");
      }
    });
  };

  // Step 2: Trigger Full Parse & Transmission
  const handleFinalize = async () => {
    if (!mappings["email"]) {
      toast.error("Mission Critical: 'Email Address' column mapping required.");
      return;
    }

    setIsSubmitting(true);
    setStep("processing");

    // Perform total document sweep (All Rows)
    Papa.parse(file!, {
      header: true,
      skipEmptyLines: true,
      complete: async (allResults) => {
        try {
          // Transpose raw CSV to API contract
          const payload = allResults.data.map((row: any) => {
            const finalRow: any = {};
            Object.entries(mappings).forEach(([dbField, csvCol]) => {
              finalRow[dbField] = row[csvCol] || "";
            });
            return finalRow;
          }).filter((r: any) => r.email);

          // Transmission burst
          const response = await fetch("/api/contacts/import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contacts: payload,
              listId: targetListId || "none"
            })
          });

          if (!response.ok) throw new Error("Bulk stream rejected by cluster.");
          
          const json = await response.json();
          setResult(json);
          setStep("success");
          if (onComplete) onComplete();
          toast.success("Active Ingestion Sequence Fully Terminated!");

        } catch (err: any) {
          toast.error(`Transmission Gridlock: ${err.message}`);
          setStep("map");
        } finally {
          setIsSubmitting(false);
        }
      }
    });
  };

  const reset = () => {
    setFile(null);
    setHeaders([]);
    setMappings({});
    setResult(null);
    setStep("upload");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-2xl glass-hud overflow-hidden relative rounded-2xl border border-white/10 shadow-2xl"
      >
        {/* Absolute Closure Pin */}
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white p-1 rounded-full bg-white/5 z-10 transition">
          <X size={16} />
        </button>

        <div className="p-6 border-b border-white/5 bg-zinc-950/50">
          <h2 className="text-lg font-bold text-white flex items-center gap-2.5 tracking-tight">
            <UploadCloud size={20} className="text-[#7C5CFF]" />
            High-Capacity Contact Ingestion
          </h2>
          <p className="text-xs text-zinc-400 mt-1 font-medium">Upload raw CSV documents, map logic trees, and inject telemetry safely.</p>
        </div>

        <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar bg-[#0C0C10]">
          <AnimatePresence mode="wait">
            
            {/* STATE A: UPLOAD DROPZONE */}
            {step === "upload" && (
              <motion.div 
                key="st-1" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-zinc-800 rounded-xl hover:border-[#7C5CFF]/50 transition-colors group cursor-pointer relative"
              >
                <input type="file" accept=".csv" onChange={onDrop} className="absolute inset-0 opacity-0 cursor-pointer" />
                <div className="w-16 h-16 rounded-full bg-[#7C5CFF]/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <FileSpreadsheet size={32} className="text-[#7C5CFF]" />
                </div>
                <h3 className="text-white font-semibold mb-1">Strike to browse or drag & drop</h3>
                <p className="text-xs text-zinc-500 font-mono">Limit constraint: 25MB • RAW CSV ONLY</p>
              </motion.div>
            )}

            {/* STATE B: COLUMN ALIGNMENT ENGINE */}
            {step === "map" && (
              <motion.div key="st-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="mb-6 flex items-center justify-between p-3 rounded-lg bg-emerald-900/20 border border-emerald-500/30">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="text-emerald-400" size={18} />
                    <div>
                      <p className="text-sm text-emerald-100 font-semibold">Payload locked: "{file?.name}"</p>
                      <p className="text-[10px] font-mono text-emerald-400/70 uppercase">{headers.length} static attributes identified</p>
                    </div>
                  </div>
                  <button onClick={reset} className="text-xs text-emerald-400 hover:underline flex items-center gap-1"><RefreshCw size={12}/> Swap</button>
                </div>

                <h3 className="text-xs font-bold font-mono text-zinc-400 uppercase tracking-widest mb-4 border-b border-zinc-800 pb-2">Logic Association Matrix</h3>
                
                <div className="space-y-3 mb-8">
                  {TARGET_FIELDS.map((field) => (
                    <div key={field.key} className="flex items-center gap-4 p-3.5 rounded-xl bg-zinc-900/40 border border-white/5">
                      <div className="flex-1 min-w-[150px]">
                        <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                          {field.label}
                          {field.required && <span className="text-red-400">*</span>}
                        </span>
                      </div>
                      <ChevronRight size={16} className="text-zinc-600" />
                      <div className="flex-1">
                        <select 
                          value={mappings[field.key] || ""}
                          onChange={(e) => setMappings({...mappings, [field.key]: e.target.value})}
                          className="w-full bg-zinc-950 border border-zinc-800 text-zinc-300 text-sm rounded-lg px-3 py-2 focus:border-[#7C5CFF] focus:ring-0 font-mono"
                        >
                          <option value="">-- Discard Attrib --</option>
                          {headers.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-900">
                  <button onClick={onClose} className="px-5 py-2.5 text-sm text-zinc-400 font-medium hover:text-white">Cancel</button>
                  <button 
                    onClick={handleFinalize}
                    className="px-6 py-2.5 bg-[#7C5CFF] text-white text-sm font-bold rounded-lg shadow-lg shadow-[#7C5CFF]/20 hover:bg-[#6843ef] transition flex items-center gap-2"
                  >
                    Commit Ingestion Protocol
                    <ChevronRight size={16} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STATE C: PROCESSING PULSE */}
            {step === "processing" && (
              <motion.div 
                key="st-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-16 text-center"
              >
                <motion.div
                  animate={{ rotate: 360 }} transition={{ repeat: Infinity, ease: "linear", duration: 1 }}
                  className="mb-6 text-[#7C5CFF]"
                >
                  <Loader2 size={48} />
                </motion.div>
                <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Transmitting Data Node Packets...</h3>
                <p className="text-sm text-zinc-500 max-w-xs mx-auto">Streaming validated payloads directly into destination cluster arrays. Do not sever the connection.</p>
              </motion.div>
            )}

            {/* STATE D: SUCCESS TERMINATION */}
            {step === "success" && (
              <motion.div 
                key="st-4" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="text-center py-10"
              >
                <div className="w-16 h-16 mx-auto bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 border border-emerald-500/40">
                  <CheckCircle2 size={32} className="text-emerald-400" />
                </div>
                <h3 className="text-2xl font-extrabold text-white mb-2">Grid Integration Absolute!</h3>
                <p className="text-sm text-zinc-400 mb-8">Stream processing has legally concluded with the following yield metrics:</p>

                <div className="grid grid-cols-3 gap-4 max-w-md mx-auto mb-8 text-center">
                  <div className="p-4 bg-zinc-900/50 border border-white/5 rounded-xl">
                    <span className="block text-xs font-mono font-bold text-zinc-500 uppercase">Fresh Insertion</span>
                    <span className="text-2xl font-black text-white">{result?.added || 0}</span>
                  </div>
                  <div className="p-4 bg-zinc-900/50 border border-white/5 rounded-xl">
                    <span className="block text-xs font-mono font-bold text-zinc-500 uppercase">Merged Revisions</span>
                    <span className="text-2xl font-black text-zinc-300">{result?.updated || 0}</span>
                  </div>
                  <div className="p-4 bg-red-900/10 border border-red-900/30 rounded-xl">
                    <span className="block text-xs font-mono font-bold text-red-400 uppercase">Violations</span>
                    <span className="text-2xl font-black text-red-400">{result?.errored || 0}</span>
                  </div>
                </div>

                <button 
                  onClick={onClose}
                  className="px-8 py-3 rounded-xl bg-white text-black font-bold tracking-wide hover:bg-zinc-200 transition-colors"
                >
                  Back to Command Surface
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </motion.div>
    </div>
  );
}
