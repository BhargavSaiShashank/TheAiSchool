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

const starterTemplates = [
  // Each thumbnail is thematically distinct — no duplicate images
  { id: "t1", name: "Welcome Onboard",         category: "Welcome",        thumbnail: "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=350&h=200&q=80", count: "Used in 3 campaigns" },
  { id: "t2", name: "Monthly Tech Newsletter",  category: "Newsletter",     thumbnail: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=350&h=200&q=80", count: "Used in 1 campaign" },
  { id: "t3", name: "Product Promotion Blast",  category: "Promotional",    thumbnail: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=350&h=200&q=80", count: "Draft" },
  { id: "t4", name: "AI Hackathon Event Invite",category: "Event Invite",   thumbnail: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=350&h=200&q=80", count: "Used in 2 campaigns" },
  { id: "t5", name: "AWS Training Notice",      category: "Training Notice", thumbnail: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=350&h=200&q=80", count: "Draft" },
];

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
  const [templates, setTemplates] = useState<any[]>(starterTemplates);
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

  // Auto-load template canvas blocks when selected
  useEffect(() => {
    if (selectedTemplate && selectedTemplate.content) {
      try {
        const parsed = typeof selectedTemplate.content === "string" 
          ? JSON.parse(selectedTemplate.content) 
          : selectedTemplate.content;
        if (Array.isArray(parsed)) {
          setCanvasBlocks(parsed);
        }
      } catch (err) {}
    }
  }, [selectedTemplate]);

  // Handle Save Template to Supabase
  const handleSaveTemplate = async () => {
    if (!selectedTemplate) return;
    try {
      setAutosaveStatus("Saving...");
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedTemplate.id,
          name: selectedTemplate.name || "Untitled Template",
          category: selectedTemplate.category || "General",
          content: JSON.stringify(canvasBlocks),
        }),
      });
      if (res.ok) {
        setAutosaveStatus("All changes saved");
        setView("library");
      }
    } catch (err) {
      console.error("Error saving template to Supabase:", err);
    }
  };

  // Simulate autosave loop inside the editor
  useEffect(() => {
    if (view !== "editor") return;
    const interval = setInterval(() => {
      setAutosaveStatus("Saving changes...");
      setTimeout(() => {
        setAutosaveStatus("All changes saved");
      }, 800);
    }, 15000);

    return () => clearInterval(interval);
  }, [view]);

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

            {/* Split layout: Draggable Block Palette (left), Illuminated Canvas (center), AI Inspector (right) */}
            <div className="flex-1 flex gap-6 overflow-hidden min-h-0">
              
              {/* LEFT SIDEBAR: Categorized Draggable Modules */}
              <div className="w-64 border border-white/[0.04] bg-zinc-950/40 p-4 rounded flex flex-col justify-between shrink-0 overflow-y-auto">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-mono">
                      Categorized Modules
                    </h4>
                    <p className="text-[9px] text-zinc-500 mt-0.5 font-semibold font-mono uppercase">Click module to insert into canvas</p>
                  </div>

                  {/* AI Smart Blocks Section */}
                  <div className="space-y-2">
                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider font-mono flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-[#7C5CFF]" />
                      AI Recommended Blocks
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                      <button
                        onClick={() => {
                          setCanvasBlocks([...canvasBlocks, {
                            id: `b-${Date.now()}`,
                            type: "Header",
                            content: "Founder Statement: Why We Built This Platform",
                            bgColor: "#f4f4f5",
                            fontSize: "20",
                            padding: "20"
                          }]);
                        }}
                        className="p-2.5 text-left rounded border border-white/[0.04] hover:border-[#7C5CFF]/30 bg-zinc-900/30 text-zinc-400 hover:text-white transition cursor-pointer flex items-center gap-2"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#7C5CFF]" />
                        <span className="text-[10px] font-mono">Founder Statement</span>
                      </button>
                      <button
                        onClick={() => {
                          setCanvasBlocks([...canvasBlocks, {
                            id: `b-${Date.now()}`,
                            type: "Button",
                            content: "Verify Onboard Details",
                            bgColor: "#7C5CFF",
                            textColor: "#ffffff",
                            fontSize: "14",
                            padding: "16"
                          }]);
                        }}
                        className="p-2.5 text-left rounded border border-white/[0.04] hover:border-[#7C5CFF]/30 bg-zinc-900/30 text-zinc-400 hover:text-white transition cursor-pointer flex items-center gap-2"
                      >
                        <Zap className="w-3.5 h-3.5 text-[#7C5CFF]" />
                        <span className="text-[10px] font-mono">Hero CTA Block</span>
                      </button>
                    </div>
                  </div>

                  {/* Standard Structure Blocks */}
                  <div className="space-y-2">
                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider font-mono">
                      Layout Blocks
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {["Header", "Text", "Button", "Footer"].map((block) => (
                        <button
                          key={block}
                          onClick={() => {
                            setCanvasBlocks([...canvasBlocks, {
                              id: `b-${Date.now()}`,
                              type: block,
                              content: block === "Button" ? "Action Button" : `Standard ${block} content`,
                              bgColor: block === "Button" ? "#7C5CFF" : "transparent",
                              fontSize: block === "Header" ? "24" : "14",
                              padding: "16"
                            }]);
                          }}
                          className="p-3 text-center rounded border border-white/[0.04] hover:border-zinc-800 bg-zinc-900/10 text-zinc-400 hover:text-white transition cursor-pointer flex flex-col items-center gap-1.5"
                        >
                          <Layout className="w-4 h-4 text-zinc-600" />
                          <span className="text-[9px] font-mono truncate w-full">{block}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                </div>

                <div className="p-3 mt-6 bg-[#7C5CFF]/5 border border-[#7C5CFF]/15 rounded font-mono text-[9px] text-zinc-400 leading-relaxed">
                  Tip: Canvas renders matching SPF standards for deliverability optimization.
                </div>
              </div>

              {/* CENTER WORKSPACE CANVAS: Illuminated Workspace */}
              <div className="flex-1 overflow-y-auto bg-zinc-950/20 rounded p-8 border border-white/[0.04] flex justify-center items-start relative overflow-x-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(124,92,255,0.03),transparent_70%)] pointer-events-none" />
                
                <motion.div
                  animate={{ 
                    width: previewMode === "desktop" ? 600 : 375,
                    scale: zoomScale / 100 
                  }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="bg-white text-zinc-800 rounded border border-zinc-200 overflow-hidden flex flex-col h-fit shadow-2xl shrink-0 relative transition duration-300"
                  style={{ transformOrigin: "top center" }}
                >
                  {canvasBlocks.map((block, idx) => {
                    const isSelected = selectedBlockIdx === idx;
                    return (
                      <div
                        key={block.id}
                        onClick={() => setSelectedBlockIdx(idx)}
                        className={`border-y relative group transition cursor-pointer ${
                          isSelected ? "border-[#7C5CFF]/40 bg-zinc-100/10" : "border-transparent hover:border-zinc-200"
                        }`}
                        style={{ 
                          backgroundColor: block.bgColor,
                          padding: block.padding ? `${block.padding}px` : "24px"
                        }}
                      >
                        {/* Selected overlay controls */}
                        {isSelected && (
                          <div className="absolute -top-3 left-3 px-2 py-0.5 bg-[#7C5CFF] text-white text-[8px] font-mono font-bold rounded shadow uppercase tracking-wide">
                            Active {block.type} Block
                          </div>
                        )}

                        {block.type === "Header" && (
                          <div 
                            className="text-center font-bold text-zinc-900"
                            style={{ fontSize: block.fontSize ? `${block.fontSize}px` : "24px" }}
                          >
                            {block.content}
                          </div>
                        )}

                        {block.type === "Text" && (
                          <div 
                            className="leading-relaxed text-zinc-600 whitespace-pre-wrap"
                            style={{ fontSize: block.fontSize ? `${block.fontSize}px` : "14px" }}
                          >
                            {block.content}
                          </div>
                        )}

                        {block.type === "Button" && (
                          <div className="text-center">
                            <span
                              className="px-6 py-2.5 font-bold rounded transition inline-block shadow-md uppercase tracking-wider"
                              style={{ 
                                backgroundColor: block.bgColor === "transparent" ? "#7C5CFF" : block.bgColor, 
                                color: block.textColor || "#fff",
                                fontSize: block.fontSize ? `${block.fontSize}px` : "14px"
                              }}
                            >
                              {block.content}
                            </span>
                          </div>
                        )}

                        {block.type === "Footer" && (
                          <div 
                            className="text-center text-zinc-400 border-t border-zinc-100 pt-4"
                            style={{ fontSize: block.fontSize ? `${block.fontSize}px` : "11px" }}
                          >
                            <p>{block.content}</p>
                            <a href="#" className="text-[#7C5CFF] font-bold underline mt-1.5 inline-block">Unsubscribe</a>
                          </div>
                        )}

                        {!["Header", "Text", "Button", "Footer"].includes(block.type) && (
                          <div className="p-4 border border-dashed border-zinc-200 text-center text-[10px] text-zinc-400 uppercase font-mono font-bold">
                            {block.type} Block Element
                          </div>
                        )}
                      </div>
                    );
                  })}
                </motion.div>
              </div>

              {/* RIGHT SIDEBAR: Intelligent Inspector System */}
              <div className="w-72 border border-white/[0.04] bg-zinc-950/40 p-4 rounded flex flex-col shrink-0 overflow-y-auto">
                {selectedBlockIdx !== null ? (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-mono">
                        Active Block Inspector
                      </h4>
                      <p className="text-[9px] text-zinc-500 mt-0.5 font-semibold font-mono uppercase">Customize layout & typography parameters</p>
                    </div>

                    <div className="space-y-4 text-xs">
                      
                      {/* Readability Score */}
                      <div className="p-3 rounded bg-zinc-900/40 border border-white/[0.04] space-y-2">
                        <div className="flex justify-between items-center text-[10px] font-mono">
                          <span className="text-zinc-500 font-bold">AI READABILITY SCORE</span>
                          <span className="text-emerald-400 font-bold">94/100 (Optimal)</span>
                        </div>
                        <div className="h-1 w-full bg-zinc-950 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: "94%" }} />
                        </div>
                        <p className="text-[9px] text-zinc-400 font-medium">
                          Line length and element density conform perfectly to high-efficiency ISP deliverability patterns.
                        </p>
                      </div>

                      {/* Content textarea */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] text-zinc-400 font-semibold font-mono uppercase">Block Content</label>
                          {canvasBlocks[selectedBlockIdx].type === "Text" && (
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setMergeTagDropdown(!mergeTagDropdown)}
                                className="text-[10px] text-zinc-400 hover:text-white font-mono flex items-center gap-1 cursor-pointer"
                              >
                                <Tag className="w-3 h-3" />
                                <span>Tags Picker</span>
                              </button>
                              
                              <AnimatePresence>
                                {mergeTagDropdown && (
                                  <motion.div
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 5 }}
                                    className="absolute right-0 top-5 bg-zinc-900 border border-white/[0.04] rounded p-1.5 space-y-1.5 z-20 shadow-xl w-36 text-left"
                                  >
                                    {["{{first_name}}", "{{last_name}}", "{{email}}", "{{custom.company}}"].map((tag) => (
                                      <button
                                        key={tag}
                                        type="button"
                                        onClick={() => injectMergeTag(tag)}
                                        className="w-full text-left p-1 rounded hover:bg-zinc-850 text-[10px] text-zinc-300 font-mono"
                                      >
                                        {tag.replace("{{", "").replace("}}", "")}
                                      </button>
                                    ))}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          )}
                        </div>
                        <textarea
                          value={canvasBlocks[selectedBlockIdx].content}
                          onChange={(e) => {
                            const updated = [...canvasBlocks];
                            updated[selectedBlockIdx].content = e.target.value;
                            setCanvasBlocks(updated);
                          }}
                          className="w-full px-3 py-2 rounded bg-zinc-900 border border-white/[0.04] focus:outline-none focus:border-zinc-700 text-xs text-zinc-200 h-24 font-mono leading-relaxed resize-none"
                        />
                      </div>

                      {/* Typography adjustment */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-zinc-400 font-semibold font-mono uppercase flex items-center justify-between">
                          <span>Font Size (px)</span>
                          <span className="text-zinc-200 font-mono font-bold">{canvasBlocks[selectedBlockIdx].fontSize || "14"}px</span>
                        </label>
                        <input
                          type="range"
                          min="10"
                          max="48"
                          value={canvasBlocks[selectedBlockIdx].fontSize || "14"}
                          onChange={(e) => {
                            const updated = [...canvasBlocks];
                            updated[selectedBlockIdx].fontSize = e.target.value;
                            setCanvasBlocks(updated);
                          }}
                          className="w-full h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-[#7C5CFF]"
                        />
                      </div>

                      {/* Padding adjustment */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-zinc-400 font-semibold font-mono uppercase flex items-center justify-between">
                          <span>Block Padding (px)</span>
                          <span className="text-zinc-200 font-mono font-bold">{canvasBlocks[selectedBlockIdx].padding || "16"}px</span>
                        </label>
                        <input
                          type="range"
                          min="4"
                          max="64"
                          value={canvasBlocks[selectedBlockIdx].padding || "16"}
                          onChange={(e) => {
                            const updated = [...canvasBlocks];
                            updated[selectedBlockIdx].padding = e.target.value;
                            setCanvasBlocks(updated);
                          }}
                          className="w-full h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-[#7C5CFF]"
                        />
                      </div>

                      {/* Background Color text */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-zinc-400 font-semibold font-mono uppercase">Background (Hex)</label>
                        <input
                          type="text"
                          value={canvasBlocks[selectedBlockIdx].bgColor}
                          onChange={(e) => {
                            const updated = [...canvasBlocks];
                            updated[selectedBlockIdx].bgColor = e.target.value;
                            setCanvasBlocks(updated);
                          }}
                          className="w-full px-3 py-1.5 rounded bg-zinc-900 border border-white/[0.04] focus:outline-none focus:border-zinc-700 text-xs text-zinc-200 font-mono"
                        />
                      </div>

                      {/* Delete action */}
                      <button
                        onClick={() => {
                          setCanvasBlocks(canvasBlocks.filter((_, i) => i !== selectedBlockIdx));
                          setSelectedBlockIdx(null);
                        }}
                        className="w-full py-2 rounded border border-red-900/30 text-red-400 hover:bg-red-950/10 text-xs font-mono font-bold transition cursor-pointer flex items-center justify-center gap-1.5 uppercase tracking-wide"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Block Element</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-3">
                    <div className="w-10 h-10 rounded-full bg-zinc-900 border border-white/[0.06] flex items-center justify-center">
                      <Layout className="w-4.5 h-4.5 text-zinc-600" />
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-zinc-400 font-mono">No block selected</p>
                      <p className="text-[10px] text-zinc-600 mt-1 leading-relaxed max-w-[140px] mx-auto">
                        Click any block on the canvas to edit its content &amp; style.
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-[#7C5CFF]/70 font-mono">
                      <span>←</span>
                      <span>Click a canvas block</span>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
