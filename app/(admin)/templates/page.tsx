"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "@/lib/toast";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
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
  Edit2,
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
  const { user } = useStore();
  const router = useRouter();

  const [view, setView] = useState<"library" | "editor">("library");
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hard gate for manual URL bypass
  useEffect(() => {
    if (user && user.role === "VIEWER") {
      router.replace("/dashboard");
    }
  }, [user, router]);

  // Library filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Metadata creation and editing states
  const [showNewTemplateModal, setShowNewTemplateModal] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateCategory, setNewTemplateCategory] = useState("Newsletter");
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  // Editor States
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">(
    "desktop",
  );
  const [editorTab, setEditorTab] = useState<"blocks" | "html" | "settings">(
    "blocks",
  );
  const [mergeTagDropdown, setMergeTagDropdown] = useState(false);
  const [autosaveStatus, setAutosaveStatus] = useState("All changes saved");
  const [zoomScale, setZoomScale] = useState(100);

  // Selected block editing state
  const [canvasBlocks, setCanvasBlocks] = useState<CanvasBlock[]>([
    {
      id: "b1",
      type: "Header",
      content: "Welcome to PulseSend",
      bgColor: "#18181b",
      fontSize: "24",
      padding: "16",
    },
    {
      id: "b2",
      type: "Text",
      content:
        "Hey {{first_name}},\n\nWe are absolutely thrilled to have you join us at {{custom.company}}! Prepare to create amazing, high-performance newsletters.",
      bgColor: "transparent",
      fontSize: "14",
      padding: "20",
    },
    {
      id: "b3",
      type: "Button",
      content: "Get Started Now",
      url: "https://pulsesend.com",
      bgColor: "#7C5CFF",
      textColor: "#ffffff",
      fontSize: "14",
      padding: "12",
    },
    {
      id: "b4",
      type: "Footer",
      content: "PulseSend Inc, Hyderabad, India. All rights reserved.",
      bgColor: "transparent",
      fontSize: "11",
      padding: "16",
    },
  ]);
  const [selectedBlockIdx, setSelectedBlockIdx] = useState<number | null>(null);

  // Fetch live templates on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("pulsesend:loading"));
    }

    async function fetchTemplates() {
      try {
        const res = await fetch("/api/templates", {
          headers: { "x-org-id": user?.org_id || "" }
        });
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data) && data.length > 0) {
            setTemplates(data);
          }
        }
      } catch (err) {
        console.error(
          "Failed to fetch templates from Supabase, using defaults.",
          err,
        );
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

    if ((window as any).unlayer) {
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
    if (!unlayerLoaded || view !== "editor") return;

    let timeoutId: any;
    let attempts = 0;

    const tryInit = () => {
      const container = document.getElementById("editor-container");
      if (container) {
        if ((window as any).unlayer) {
          try {
            container.innerHTML = ""; // Clear any stale or duplicate iframes before fresh init!

            const isMobileView = window.innerWidth < 768;

            (window as any).unlayer.init({
              id: "editor-container",
              displayMode: "email",
              defaultDevice: isMobileView ? "mobile" : "desktop", // Forces engine to fit mobile width natively
              features: {
                preview: false, // Kills the internal fixed-width simulator toolbar that causes clipping
              },
              appearance: {
                theme: "dark",
                panels: {
                  tools: {
                    dock: "right",
                    collapsible: true,
                  },
                },
              },
            });

            // Immediately check viewport and instruct Unlayer to minimize the sidebar on compact screens
            if (window.innerWidth < 768) {
              // Give native editor a fractional moment to render before executing collapse command
              setTimeout(() => {
                const win = window as any;
                if (
                  win.unlayer &&
                  typeof win.unlayer.collapseSidebar === "function"
                ) {
                  win.unlayer.collapseSidebar();
                }
              }, 500);
            }

            // Register secure AWS S3 image upload callback
            (window as any).unlayer.registerCallback("image", (file: any, done: any) => {
              const reader = new FileReader();
              reader.readAsDataURL(file.attachments[0]);
              reader.onload = async () => {
                try {
                  const res = await fetch("/api/upload", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      file: reader.result,
                      fileName: file.attachments[0].name,
                      fileType: file.attachments[0].type,
                    }),
                  });

                  if (res.ok) {
                    const data = await res.json();
                    done({ progress: 100, url: data.url });
                  } else {
                    console.error("Upload endpoint returned error status.");
                  }
                } catch (err) {
                  console.error(
                    "Failed to stream image to secure S3 storage:",
                    err,
                  );
                }
              };
            });

            const loadSavedDesign = () => {
              const blocksData =
                selectedTemplate?.blocks || (selectedTemplate as any)?.content;
              if (blocksData) {
                try {
                  const parsed =
                    typeof blocksData === "string"
                      ? JSON.parse(blocksData)
                      : blocksData;

                  if (
                    parsed &&
                    typeof parsed === "object" &&
                    !Array.isArray(parsed)
                  ) {
                    (window as any).unlayer.loadDesign(parsed);
                  }
                } catch (err) {
                  console.error("Error loading saved Unlayer design:", err);
                }
              }
            };

            // Wrap design loading in the official ready callback with robust type safety checks
            const win = window as any;
            if (win.unlayer && typeof win.unlayer.ready === "function") {
              win.unlayer.ready(() => {
                loadSavedDesign();
              });
            } else {
              // Fallback: load directly with a defensive delay to allow script binding
              setTimeout(loadSavedDesign, 300);
            }
          } catch (err) {
            console.error("Unlayer initialization failed:", err);
          }
        }
      } else if (attempts < 10) {
        attempts++;
        timeoutId = setTimeout(tryInit, 100); // Retry every 100ms
      }
    };

    tryInit();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [unlayerLoaded, view, selectedTemplate]);

  // Handle Save Template using Unlayer exportHtml API
  const handleSaveTemplate = async () => {
    if (!selectedTemplate) return;
    try {
      setAutosaveStatus("Saving...");

      const win = window as any;
      if (win.unlayer) {
        win.unlayer.exportHtml(async (data: any) => {
          const { design, html } = data;

          const res = await fetch("/api/templates", {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "x-org-id": user?.org_id || ""
            },
            body: JSON.stringify({
              id: selectedTemplate.id,
              name: selectedTemplate.name || "Untitled Template",
              category: selectedTemplate.category || "General",
              content: JSON.stringify(design), // Stringify Unlayer design structure
              html: html || "",
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

  const handleConfirmCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName.trim()) return;

    setSelectedTemplate({
      id: "new",
      name: newTemplateName.trim(),
      category: newTemplateCategory,
      thumbnail: "",
      count: "New",
    });
    setShowNewTemplateModal(false);
    setView("editor");
  };

  const handleDeleteTemplate = async (
    templateId: string,
    templateName: string,
  ) => {
    if (
      !window.confirm(
        `Are you absolutely sure you wish to permanently delete template "${templateName}"? This action is irreversible.`,
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/templates?id=${templateId}`, {
        method: "DELETE",
        headers: { "x-org-id": user?.org_id || "" }
      });

      if (res.ok) {
        // Atomically slice the UI list state
        setTemplates((prev) => prev.filter((t) => t.id !== templateId));
      } else {
        alert(
          "Deletion failed. Ensure you possess high-level workspace clearance.",
        );
      }
    } catch (err) {
      console.error(
        "Communication breakdown during deletion payload delivery:",
        err,
      );
    }
  };

  const handleDuplicateTemplate = async (template: any) => {
    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-org-id": user?.org_id || ""
        },
        body: JSON.stringify({
          id: "new", // Deliberately enforce new record creation instead of update
          name: `${template.name || "Untitled"} (Copy)`,
          category: template.category || "General",
          content: template.content || "[]",
          html: template.html || "",
        }),
      });

      if (res.ok) {
        const freshClone = await res.json();
        // Prepend the new replica straight into current UI context for instant feedback
        setTemplates((prev) => [
          {
            ...freshClone,
            id: freshClone.id,
            name: freshClone.name,
            category: freshClone.category,
            thumbnail: template.thumbnail, // Carry over visual skin
            count: "Active Copy",
          },
          ...prev,
        ]);
        toast.success(`Synchronized Clone Complete: "${freshClone.name}" spawned successfully.`);
      } else {
        toast.error("Template cloning transmission interdicted on server.");
      }
    } catch (err) {
      console.error("Critical template duplication gridlock:", err);
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
  const categories = [
    "all",
    "Welcome",
    "Newsletter",
    "Promotional",
    "Event Invite",
    "Training Notice",
  ];

  const filteredTemplates = templates.filter((t) => {
    const matchesSearch = t.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || t.category === selectedCategory;
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
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/50 pb-5">
              <div>
                <h2 className="text-sm font-bold text-foreground uppercase font-mono tracking-tight">
                  Template Library
                </h2>
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider font-mono">
                  Creative Infrastructure Workspace
                </p>
              </div>
              <button
                onClick={() => {
                  setNewTemplateName("");
                  setNewTemplateCategory("Newsletter");
                  setShowNewTemplateModal(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#7C5CFF] text-white hover:opacity-95 text-xs font-semibold shadow-[0_1px_3px_rgba(95,90,246,0.2)] transition cursor-pointer border border-white/5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Template</span>
              </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/50 pb-5">
              <div className="relative max-w-xs w-full">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-zinc-500">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 rounded bg-secondary border border-border text-xs text-foreground placeholder-zinc-500 focus:outline-none focus:border-zinc-700 transition"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 max-w-full flex-nowrap snap-x scrollbar-hide">
                {categories.map((cat) => {
                  const isActive = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`relative px-3 py-1.5 rounded text-[10px] font-semibold font-mono tracking-wider uppercase border transition cursor-pointer flex-shrink-0 snap-start ${
                        isActive
                          ? "text-white border-transparent"
                          : "text-muted-foreground border-border hover:text-foreground"
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="active-template-cat"
                          className="absolute inset-0 bg-[#7C5CFF] rounded"
                          transition={{
                            type: "spring",
                            stiffness: 380,
                            damping: 28,
                          }}
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
                      <div className="p-4 glass-hud rounded-md flex flex-col justify-between h-full overflow-hidden">
                        <div className="space-y-4">
                          {/* Thumbnail representation */}
                          <div className="relative h-40 bg-secondary rounded-md border border-border overflow-hidden">
                            {template.thumbnail ? (
                              <img
                                src={template.thumbnail}
                                alt={template.name}
                                className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition duration-500"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-muted-foreground font-mono text-[10px]">
                                Empty Preview
                              </div>
                            )}
                            <span className="absolute top-2.5 left-2.5 text-[9px] bg-secondary border border-border px-2 py-0.5 rounded text-foreground font-mono font-bold uppercase tracking-wide">
                              {template.category}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <h3 className="font-bold text-foreground group-hover:text-[#7C5CFF] transition text-xs">
                              {template.name}
                            </h3>
                            <p className="text-[10px] text-muted-foreground font-mono font-semibold uppercase">
                              {template.count}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-6 pt-3 border-t border-border/50 text-xs">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleDuplicateTemplate(template)}
                              className="text-muted-foreground hover:text-foreground p-1 rounded transition cursor-pointer"
                              title="Duplicate Template"
                            >
                              <Copy className="w-4 h-4" />
                            </button>

                            {(user?.role === "SUPER_ADMIN" ||
                              user?.role === "CAMPAIGN_MANAGER") && (
                              <button
                                onClick={() =>
                                  handleDeleteTemplate(
                                    template.id,
                                    template.name,
                                  )
                                }
                                className="text-red-500/60 hover:text-red-500 p-1 rounded transition cursor-pointer"
                                title="Delete Template"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              setSelectedTemplate(template);
                              setView("editor");
                            }}
                            className="px-3.5 py-1.5 rounded bg-secondary border border-border text-muted-foreground hover:text-foreground font-semibold transition cursor-pointer"
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
              <div className="p-12 glass-hud rounded-lg text-center space-y-4 max-w-md mx-auto">
                <div className="w-12 h-12 rounded-full bg-[#7C5CFF]/10 border border-[#7C5CFF]/20 flex items-center justify-center mx-auto">
                  <FileCode className="w-5 h-5 text-[#7C5CFF]" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-foreground uppercase font-mono">
                    No Templates Found
                  </h4>
                  <p className="text-[10px] text-muted-foreground font-medium">
                    Your creative library is empty. Create your first
                    drag-and-drop newsletter template to get started.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setNewTemplateName("");
                    setNewTemplateCategory("Newsletter");
                    setShowNewTemplateModal(true);
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
            className="flex flex-col h-[460px] md:h-[calc(100vh-140px)] space-y-4"
          >
            {/* Editor Control Header - Stackable logic for complex desktop control array */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between shrink-0 border-b border-white/[0.04] pb-4 gap-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setView("library")}
                  className="p-1.5 hover:bg-zinc-900 border border-white/[0.04] text-zinc-400 hover:text-white rounded transition cursor-pointer"
                >
                  <Undo2 className="w-4 h-4" />
                </button>
                <div className="flex flex-col gap-1">
                  {isEditingTitle ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={selectedTemplate?.name || ""}
                        onChange={(e) =>
                          setSelectedTemplate({
                            ...selectedTemplate,
                            name: e.target.value,
                          })
                        }
                        onBlur={() => setIsEditingTitle(false)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") setIsEditingTitle(false);
                        }}
                        autoFocus
                        className="px-2 py-0.5 rounded bg-zinc-950 border border-[#7C5CFF]/30 text-xs text-white font-mono uppercase tracking-tight focus:outline-none focus:border-[#7C5CFF]"
                      />
                      <button
                        onClick={() => setIsEditingTitle(false)}
                        className="text-[10px] text-emerald-400 font-bold hover:underline cursor-pointer"
                      >
                        Done
                      </button>
                    </div>
                  ) : (
                    <div
                      className="flex items-center gap-2 group cursor-pointer"
                      onClick={() => setIsEditingTitle(true)}
                    >
                      <h3 className="text-xs font-bold text-zinc-100 uppercase font-mono tracking-tight leading-none">
                        {selectedTemplate?.name || "Blank Template"}
                      </h3>
                      <Edit2 className="w-3 h-3 text-zinc-500 group-hover:text-white transition opacity-0 group-hover:opacity-100" />
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${autosaveStatus === "Saving changes..." ? "bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]" : "bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"}`}
                    />
                    <span className="text-[9px] text-zinc-500 font-mono font-bold uppercase">
                      {autosaveStatus} —{" "}
                      {selectedTemplate?.category || "General"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Toolbar Controls - Dynamic wrapping enabled for cellular widths */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                {/* Zoom Control - Automatically concealed on compact mobile for space */}
                <div className="hidden md:flex items-center gap-2 bg-zinc-900 border border-white/[0.04] px-2 py-1 rounded text-[10px] font-mono text-zinc-400 font-semibold">
                  <span className="uppercase">Zoom:</span>
                  <button
                    onClick={() => setZoomScale(Math.max(50, zoomScale - 10))}
                    className="hover:text-white"
                  >
                    -
                  </button>
                  <span>{zoomScale}%</span>
                  <button
                    onClick={() => setZoomScale(Math.min(120, zoomScale + 10))}
                    className="hover:text-white"
                  >
                    +
                  </button>
                </div>

                {/* Device Selector - Also concealed on compact mobile for space */}
                <div className="hidden sm:flex p-0.5 bg-zinc-900 border border-white/[0.04] rounded">
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
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded bg-white text-black hover:bg-zinc-200 text-xs font-bold shadow transition cursor-pointer w-full sm:w-auto justify-center"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Template</span>
                </button>
              </div>
            </div>

            {/* Deeply Compressed Embedded Workspace Container - Replaced transform with native zoom to kill ghost space */}
            <div className="flex-1 rounded-lg border border-white/[0.04] overflow-hidden bg-zinc-950/40 relative">
              <div
                id="editor-container"
                className="w-full h-full min-h-[200px]"
                style={{
                  zoom: "0.80", // React handles prefixes automatically!
                }}
              />
              <style jsx>{`
                @media (min-width: 768px) {
                  #editor-container {
                    zoom: 1 !important;
                    webkitzoom: 1 !important;
                    min-height: 500px !important;
                  }
                }
              `}</style>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CREATE NEW TEMPLATE DETAILS MODAL */}
      <AnimatePresence>
        {showNewTemplateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNewTemplateModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", stiffness: 350, damping: 28 }}
              className="relative w-full max-w-md bg-[#090a0f] border border-white/[0.06] rounded-2xl p-6 shadow-2xl space-y-6 overflow-hidden select-none"
            >
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight uppercase font-mono">
                  Create Template Details
                </h3>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  Define your design assets and categorizations
                </p>
              </div>

              <form
                onSubmit={handleConfirmCreateTemplate}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 font-mono">
                    Template Name
                  </label>
                  <input
                    type="text"
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    placeholder="e.g. Summer Special Offer"
                    required
                    autoFocus
                    className="w-full px-3 py-2 rounded bg-zinc-900/60 border border-white/[0.04] focus:outline-none focus:border-zinc-700 text-sm text-zinc-200"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 font-mono">
                    Template Category
                  </label>
                  <select
                    value={newTemplateCategory}
                    onChange={(e) => setNewTemplateCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-zinc-900 border border-white/[0.04] focus:outline-none focus:border-zinc-700 text-sm text-zinc-200 font-mono"
                  >
                    <option value="Welcome">Welcome</option>
                    <option value="Newsletter">Newsletter</option>
                    <option value="Promotional">Promotional</option>
                    <option value="Event Invite">Event Invite</option>
                    <option value="Training Notice">Training Notice</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.04]">
                  <button
                    type="button"
                    onClick={() => setShowNewTemplateModal(false)}
                    className="px-4 py-2 rounded border border-white/[0.04] hover:bg-zinc-900 text-zinc-400 text-xs font-semibold transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded bg-[#7C5CFF] text-white hover:opacity-95 text-xs font-semibold transition shadow-md border border-white/5 cursor-pointer"
                  >
                    Continue to Builder
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
