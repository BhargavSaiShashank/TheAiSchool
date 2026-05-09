"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CardSpotlight from "@/components/CardSpotlight";
import {
  FileCode,
  Search,
  Plus,
  Trash2,
  Copy,
  Eye,
  Settings,
  Sparkles,
  Smartphone,
  Monitor,
  Tag,
  Code,
  Layout,
  Save,
  Check,
  Undo2,
  Sliders,
  Type,
  Maximize2,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  Grid,
  Zap,
} from "lucide-react";

interface CanvasBlock {
  id: string;
  type: string;
  content: string;
  url?: string;
  bgColor: string;
  textColor?: string;
  fontSize?: string;
  padding?: string;
}

export default function TemplatesPage() {
  const [view, setView] = useState<"library" | "editor">("library");
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Library filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Editor States
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [editorTab, setEditorTab] = useState<"blocks" | "html" | "settings">("blocks");
  const [mergeTagDropdown, setMergeTagDropdown] = useState(false);
  const [autosaveStatus, setAutosaveStatus] = useState("All changes saved");
  const [zoomScale, setZoomScale] = useState(100);
  
  // Selected block editing state
  const [canvasBlocks, setCanvasBlocks] = useState<CanvasBlock[]>([
    { id: "b1", type: "Header", content: "Welcome to PulseSend", bgColor: "#18181b", fontSize: "24", padding: "16" },
    { id: "b2", type: "Text", content: "Hey {{first_name}},\n\nWe are absolutely thrilled to have you join us at {{custom.company}}! Prepare to create amazing, high-performance newsletters.", bgColor: "transparent", fontSize: "14", padding: "20" },
    { id: "b3", type: "Button", content: "Get Started Now", url: "https://pulsesend.com", bgColor: "#7C5CFF", textColor: "#ffffff", fontSize: "14", padding: "12" },
    { id: "b4", type: "Footer", content: "PulseSend Inc, Hyderabad, India. All rights reserved.", bgColor: "transparent", fontSize: "11", padding: "16" },
  ]);
  const [selectedBlockIdx, setSelectedBlockIdx] = useState<number | null>(null);

  // Fetch live templates on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("pulsesend:loading"));
    }

    async function fetchTemplates() {
      try {
        const res = await fetch("/api/templates");
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data) && data.length > 0) {
            setTemplates(data);
          }
        }
      } catch (err) {
        console.error("Failed to fetch templates from Supabase, using defaults.", err);
      } finally {
        setIsLoading(false);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("pulsesend:ready"));
        }
      }
    }
    fetchTemplates();
  }, [view]);

  const [unlayerLoaded, setUnlayerLoaded] = useState(false);

  // Load Unlayer CDN script dynamically on editor load
  useEffect(() => {
    if (view !== "editor") return;

    const scriptId = "unlayer-embed-script";
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://editor.unlayer.com/embed.js";
      script.async = true;
      document.body.appendChild(script);
    }

    const handleScriptLoad = () => {
      setUnlayerLoaded(true);
    };

    script.addEventListener("load", handleScriptLoad);

    // @ts-ignore
    if (window.unlayer) {
      setUnlayerLoaded(true);
    }

    return () => {
      if (script) {
        script.removeEventListener("load", handleScriptLoad);
      }
    };
  }, [view]);

  // Initialize Unlayer instance when script is loaded
  useEffect(() => {
    if (unlayerLoaded && view === "editor") {
      // @ts-ignore
      if (window.unlayer) {
        // @ts-ignore
        window.unlayer.init({
          id: "editor-container",
          displayMode: "email",
          appearance: {
            theme: "dark",
          }
        });

        // Load existing JSON design layout if it matches Unlayer structure
        if (selectedTemplate && selectedTemplate.content) {
          try {
            const parsed = typeof selectedTemplate.content === "string"
              ? JSON.parse(selectedTemplate.content)
              : selectedTemplate.content;

            if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
              // @ts-ignore
              window.unlayer.loadDesign(parsed);
            }
          } catch (err) {
            console.error("Error loading saved Unlayer design:", err);
          }
        }
      }
    }
  }, [unlayerLoaded, view, selectedTemplate]);

  // Handle Save Template using Unlayer exportHtml API
  const handleSaveTemplate = async () => {
    if (!selectedTemplate) return;
    try {
      setAutosaveStatus("Saving...");

      // @ts-ignore
      if (window.unlayer) {
        // @ts-ignore
        window.unlayer.exportHtml(async (data: any) => {
          const { design } = data;

          const res = await fetch("/api/templates", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: selectedTemplate.id,
              name: selectedTemplate.name || "Untitled Template",
              category: selectedTemplate.category || "General",
              content: JSON.stringify(design), // Stringify Unlayer design structure
            }),
          });

          if (res.ok) {
            setAutosaveStatus("All changes saved");
            setView("library");
          }
        });
      }
    } catch (err) {
      console.error("Error exporting Unlayer template content:", err);
    }
  };

  // Inject Merge Tag Helper
  const injectMergeTag = (tag: string) => {
    if (selectedBlockIdx === null) return;
    const block = canvasBlocks[selectedBlockIdx];
    if (block.type === "Text") {
      const updated = [...canvasBlocks];
      updated[selectedBlockIdx].content = block.content + " " + tag;
      setCanvasBlocks(updated);
    }
    setMergeTagDropdown(false);
  };

  // Categories list
  const categories = ["all", "Welcome", "Newsletter", "Promotional", "Event Invite", "Training Notice"];

  const filteredTemplates = templates.filter((t) => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || t.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8 select-none">
      <AnimatePresence mode="wait">
        
        {/* ==================================================
            A. TEMPLATE LIBRARY VIEW
            ================================================== */}
        {view === "library" && (
          <motion.div
            key="library-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/[0.04] pb-5">
              <div>
                <h2 className="text-sm font-bold text-zinc-100 uppercase font-mono tracking-tight">Template Library</h2>
                <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider font-mono">Creative Infrastructure Workspace</p>
              </div>
              <button
                onClick={() => {
                  setSelectedTemplate({
                    id: "new",
                    name: "Blank Template",
                    category: "General",
                    thumbnail: "",
                    count: "New",
                  });
                  setView("editor");
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#7C5CFF] text-white hover:opacity-95 text-xs font-semibold shadow-[0_1px_3px_rgba(95,90,246,0.2)] transition cursor-pointer border border-white/5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Template</span>
              </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/[0.04] pb-5">
              <div className="relative max-w-xs w-full">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-zinc-500">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 rounded bg-zinc-900 border border-white/[0.04] text-xs text-zinc-300 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 max-w-full">
                {categories.map((cat) => {
                  const isActive = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`relative px-3 py-1.5 rounded text-[10px] font-semibold font-mono tracking-wider uppercase border transition cursor-pointer ${
                        isActive
                          ? "text-white border-transparent"
                          : "text-zinc-400 border-white/[0.04] hover:text-white"
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="active-template-cat"
                          className="absolute inset-0 bg-[#7C5CFF] rounded"
                          transition={{ type: "spring", stiffness: 380, damping: 28 }}
                        />
                      )}
                      <span className="relative z-10">{cat}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Template Cards Grid */}
            {filteredTemplates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates.map((template) => (
                  <motion.div
                    key={template.id}
                    whileHover={{ scale: 1.015, y: -2 }}
                    whileTap={{ scale: 0.985 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    className="h-full"
                  >
                    <CardSpotlight>
                      <div className="p-4 bg-zinc-950/40 border border-white/[0.04] rounded-md flex flex-col justify-between h-full overflow-hidden">
                        <div className="space-y-4">
                          {/* Thumbnail representation */}
                          <div className="relative h-40 bg-zinc-900 rounded-md border border-white/[0.04] overflow-hidden">
                            {template.thumbnail ? (
                              <img
                                src={template.thumbnail}
                                alt={template.name}
                                className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition duration-500"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-zinc-750 font-mono text-[10px]">
                                Empty Preview
                              </div>
                            )}
                            <span className="absolute top-2.5 left-2.5 text-[9px] bg-zinc-950/90 border border-white/[0.06] px-2 py-0.5 rounded text-zinc-200 font-mono font-bold uppercase tracking-wide">
                              {template.category}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <h3 className="font-bold text-zinc-200 group-hover:text-[#7C5CFF] transition text-xs">
                              {template.name}
                            </h3>
                            <p className="text-[10px] text-zinc-500 font-mono font-semibold uppercase">
                              {template.count}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-6 pt-3 border-t border-white/[0.04] text-xs">
                          <button
                            onClick={() => alert(`Duplicated template: ${template.name}`)}
                            className="text-zinc-500 hover:text-zinc-300 p-1 rounded"
                            title="Duplicate Template"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedTemplate(template);
                              setView("editor");
                            }}
                            className="px-3.5 py-1.5 rounded bg-zinc-900 border border-white/[0.04] text-zinc-300 hover:text-white font-semibold transition cursor-pointer"
                          >
                            Open Editor
                          </button>
                        </div>
                      </div>
                    </CardSpotlight>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="p-12 bg-zinc-950/40 border border-white/[0.04] rounded-lg text-center space-y-4 max-w-md mx-auto">
                <div className="w-12 h-12 rounded-full bg-[#7C5CFF]/10 border border-[#7C5CFF]/20 flex items-center justify-center mx-auto">
                  <FileCode className="w-5 h-5 text-[#7C5CFF]" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-zinc-200 uppercase font-mono">No Templates Found</h4>
                  <p className="text-[10px] text-zinc-500 font-medium">Your creative library is empty. Create your first drag-and-drop newsletter template to get started.</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedTemplate({
                      id: "new",
                      name: "Blank Template",
                      category: "General",
                      thumbnail: "",
                      count: "New",
                    });
                    setView("editor");
                  }}
                  className="px-4 py-2 mt-2 rounded bg-[#7C5CFF] text-white hover:opacity-95 text-[10px] font-mono font-bold tracking-wide uppercase cursor-pointer mx-auto block"
                >
                  Create Your First Template
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* ==================================================
            B. PROFESSIONAL FIGMA-GRADE CREATIVE EDITOR
            ================================================== */}
        {view === "editor" && (
          <motion.div
            key="editor-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col h-[calc(100vh-140px)] space-y-4"
          >
            {/* Editor Control Header */}
            <div className="flex items-center justify-between shrink-0 border-b border-white/[0.04] pb-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setView("library")}
                  className="p-1.5 hover:bg-zinc-900 border border-white/[0.04] text-zinc-400 hover:text-white rounded transition cursor-pointer"
                >
                  <Undo2 className="w-4 h-4" />
                </button>
                <div>
                  <h3 className="text-xs font-bold text-zinc-100 uppercase font-mono tracking-tight leading-none mb-1">
                    {selectedTemplate?.name || "Blank Template"}
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${autosaveStatus === "Saving changes..." ? "bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]" : "bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"}`} />
                    <span className="text-[9px] text-zinc-500 font-mono font-bold uppercase">
                      {autosaveStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* Toolbar Controls */}
              <div className="flex items-center gap-4">
                
                {/* Zoom Control */}
                <div className="flex items-center gap-2 bg-zinc-900 border border-white/[0.04] px-2 py-1 rounded text-[10px] font-mono text-zinc-400 font-semibold">
                  <span className="uppercase">Zoom:</span>
                  <button onClick={() => setZoomScale(Math.max(50, zoomScale - 10))} className="hover:text-white">-</button>
                  <span>{zoomScale}%</span>
                  <button onClick={() => setZoomScale(Math.min(120, zoomScale + 10))} className="hover:text-white">+</button>
                </div>

                {/* Device Selector */}
                <div className="flex p-0.5 bg-zinc-900 border border-white/[0.04] rounded">
                  <button
                    onClick={() => setPreviewMode("desktop")}
                    className={`p-1.5 rounded cursor-pointer transition ${previewMode === "desktop" ? "bg-zinc-850 text-[#7C5CFF]" : "text-zinc-500"}`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setPreviewMode("mobile")}
                    className={`p-1.5 rounded cursor-pointer transition ${previewMode === "mobile" ? "bg-zinc-850 text-[#7C5CFF]" : "text-zinc-500"}`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={handleSaveTemplate}
                  className="flex items-center gap-1 px-4 py-2 rounded bg-white text-black hover:bg-zinc-200 text-xs font-bold shadow transition cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Template</span>
                </button>
              </div>
            </div>

            {/* Expanded Unlayer Drag-and-Drop Workspace */}
            <div className="flex-1 rounded-lg border border-white/[0.04] overflow-hidden bg-zinc-950/40 relative">
              <div id="editor-container" className="w-full h-full min-h-[500px]" style={{ height: "calc(100vh - 240px)" }} />
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
