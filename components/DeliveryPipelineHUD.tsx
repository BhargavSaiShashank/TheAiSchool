"use client";

import { useEffect, useRef, useState } from "react";
import { Users, Mail, Cpu, Send, Sparkles, Activity } from "lucide-react";

interface Particle {
  progress: number;
  speed: number;
  size: number;
  color: string;
  segment: number; // 0, 1, 2
}

export default function DeliveryPipelineHUD({ liveStats }: { liveStats?: any }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeNode, setActiveNode] = useState<number | null>(null);

  const handleSimulate = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setSpeedMultiplier(4.5); // Hyper-speed!
    setTimeout(() => {
      setSpeedMultiplier(1);
      setIsSimulating(false);
    }, 4000);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];

    // Initialize random flowing particles
    const initParticles = () => {
      particles = [];
      for (let i = 0; i < 20; i++) {
        particles.push({
          progress: Math.random(),
          speed: 0.002 + Math.random() * 0.002,
          size: 1.6 + Math.random() * 1.4,
          color: i % 2 === 0 ? "#7C5CFF" : "#3B82F6",
          segment: Math.floor(Math.random() * 3),
        });
      }
    };

    initParticles();

    // Node locations on 1000x120 fixed coordinate canvas
    const nodes = [
      { x: 100, y: 60 },  // Audience
      { x: 380, y: 60 },  // Campaign Engine
      { x: 660, y: 60 },  // AWS SES SMTP
      { x: 900, y: 60 },  // Inbox Success
    ];

    const getBezierPoint = (p1: { x: number; y: number }, cp: { x: number; y: number }, p2: { x: number; y: number }, t: number) => {
      const x = (1 - t) * (1 - t) * p1.x + 2 * (1 - t) * t * cp.x + t * t * p2.x;
      const y = (1 - t) * (1 - t) * p1.y + 2 * (1 - t) * t * cp.y + t * t * p2.y;
      return { x, y };
    };

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Draw connecting guide lines (cables)
      ctx.lineWidth = 1.5;

      for (let s = 0; s < 3; s++) {
        const n1 = nodes[s];
        const n2 = nodes[s + 1];
        const cp = {
          x: (n1.x + n2.x) / 2,
          y: s % 2 === 0 ? n1.y + 25 : n1.y - 25,
        };

        // Translucent background pipe rail
        ctx.beginPath();
        ctx.moveTo(n1.x, n1.y);
        ctx.quadraticCurveTo(cp.x, cp.y, n2.x, n2.y);
        ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
        ctx.stroke();

        // Inner glowing core thread
        ctx.beginPath();
        ctx.moveTo(n1.x, n1.y);
        ctx.quadraticCurveTo(cp.x, cp.y, n2.x, n2.y);
        ctx.strokeStyle = "rgba(124, 92, 255, 0.1)";
        ctx.stroke();
      }

      // 2. Draw flowing particles
      particles.forEach((p) => {
        const n1 = nodes[p.segment];
        const n2 = nodes[p.segment + 1];
        const cp = {
          x: (n1.x + n2.x) / 2,
          y: p.segment % 2 === 0 ? n1.y + 25 : n1.y - 25,
        };

        // Advance particle progress based on speed multiplier
        p.progress += p.speed * speedMultiplier;
        if (p.progress >= 1) {
          p.progress = 0;
          p.segment = (p.segment + 1) % 3; // loop to next pipe
        }

        const pt = getBezierPoint(n1, cp, n2, p.progress);

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = isSimulating ? "#10B981" : p.color;
        ctx.fill();
      });

      // reset shadow for canvas performance
      ctx.shadowBlur = 0;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [speedMultiplier, isSimulating]);

  return (
    <div className="p-5 glass-hud rounded-lg relative overflow-hidden">
      {/* Dynamic Background Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(124,92,255,0.015)_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

      {/* Title block - Stackable for small viewports to stop button collision */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 relative z-10 gap-4">
        <div>
          <h3 className="text-[13px] font-bold text-foreground tracking-tight flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-[#7C5CFF]" />
            Metabolic Delivery Pipeline HUD
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">Real-time telemetry and dispatch network velocity</p>
        </div>
        <button
          onClick={handleSimulate}
          disabled={isSimulating}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold font-mono rounded border transition duration-300 ${
            isSimulating
              ? "bg-emerald-950/20 text-emerald-400 border-emerald-900/30 shadow-[0_0_12px_rgba(16,185,129,0.1)]"
              : "bg-[#7C5CFF] hover:bg-[#7C5CFF]/90 text-white border-transparent cursor-pointer"
          }`}
        >
          <Sparkles className={`w-3.5 h-3.5 ${isSimulating ? "animate-spin" : ""}`} />
          {isSimulating ? "DISPATCH ACTIVE" : "SIMULATE DISPATCH"}
        </button>
      </div>

      {/* Main HUD container */}
      <div className="relative w-full h-[120px] select-none">
        {/* Underlay Canvas */}
        <canvas
          ref={canvasRef}
          width={1000}
          height={120}
          className="absolute inset-0 w-full h-full pointer-events-none z-0"
        />

        {/* Floating HTML Nodes - optimized spacing and font scale for mobile */}
        <div className="absolute inset-0 flex justify-between px-2 md:px-12 items-center z-10 pointer-events-none">
          {/* Node 1: Audience */}
          <div
            onMouseEnter={() => setActiveNode(1)}
            onMouseLeave={() => setActiveNode(null)}
            className="flex flex-col items-center pointer-events-auto cursor-pointer group"
          >
            <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center border transition duration-300 relative ${
              activeNode === 1 ? "bg-[#7C5CFF]/20 border-[#7C5CFF]" : "bg-card border-border"
            }`}>
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground group-hover:text-primary transition" />
            </div>
            <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground mt-2 font-mono uppercase group-hover:text-primary transition">Audience</span>
            <span className="text-[10px] sm:text-[11px] font-bold text-foreground font-mono mt-0.5">{liveStats?.totalAudience || "0"}</span>
          </div>

          {/* Node 2: Campaign Engine */}
          <div
            onMouseEnter={() => setActiveNode(2)}
            onMouseLeave={() => setActiveNode(null)}
            className="flex flex-col items-center pointer-events-auto cursor-pointer group"
          >
            <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center border transition duration-300 relative ${
              activeNode === 2 ? "bg-[#7C5CFF]/20 border-[#7C5CFF]" : "bg-card border-border"
            }`}>
              <Cpu className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground group-hover:text-primary transition" />
            </div>
            <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground mt-2 font-mono uppercase group-hover:text-primary transition">Engine</span>
            <span className="text-[10px] sm:text-[11px] font-bold text-[#7C5CFF] font-mono mt-0.5">{liveStats?.totalDispatched && liveStats.totalDispatched !== "0" ? "Active" : "Inactive"}</span>
          </div>

          {/* Node 3: AWS SES SMTP */}
          <div
            onMouseEnter={() => setActiveNode(3)}
            onMouseLeave={() => setActiveNode(null)}
            className="flex flex-col items-center pointer-events-auto cursor-pointer group"
          >
            <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center border transition duration-300 relative ${
              activeNode === 3 ? "bg-[#7C5CFF]/20 border-[#7C5CFF]" : "bg-card border-border"
            }`}>
              <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground group-hover:text-primary transition" />
            </div>
            <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground mt-2 font-mono uppercase group-hover:text-primary transition">SES</span>
            <span className="text-[10px] sm:text-[11px] font-bold text-foreground font-mono mt-0.5">32ms</span>
          </div>

          {/* Node 4: Inbox Success */}
          <div
            onMouseEnter={() => setActiveNode(4)}
            onMouseLeave={() => setActiveNode(null)}
            className="flex flex-col items-center pointer-events-auto cursor-pointer group"
          >
            <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center border transition duration-300 relative ${
              activeNode === 4 ? "bg-emerald-500/20 border-emerald-500" : "bg-card border-border"
            }`}>
              <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 group-hover:text-emerald-400 transition" />
            </div>
            <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground mt-2 font-mono uppercase group-hover:text-emerald-500 transition">Inbox</span>
            <span className="text-[10px] sm:text-[11px] font-bold text-emerald-500 font-mono mt-0.5">{liveStats?.totalDispatched && liveStats.totalDispatched !== "0" && liveStats.deliverability !== "—" ? liveStats.deliverability : "0.0%"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
