"use client";

import { useEffect, useRef } from "react";
import { useStore } from "@/lib/store";

interface LightPod {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
}

export default function WarpGridCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const podsRef = useRef<LightPod[]>([]);
  const { theme } = useStore();

  // Dynamically update pod colors when theme changes
  useEffect(() => {
    if (podsRef.current.length > 0) {
      if (theme === "light") {
        podsRef.current[0].color = "rgba(124, 92, 255, 0.03)";
        podsRef.current[1].color = "rgba(14, 165, 233, 0.025)";
        podsRef.current[2].color = "rgba(244, 63, 94, 0.02)";
        podsRef.current[3].color = "rgba(52, 211, 153, 0.02)";
      } else {
        podsRef.current[0].color = "rgba(124, 92, 255, 0.08)";
        podsRef.current[1].color = "rgba(59, 130, 246, 0.07)";
        podsRef.current[2].color = "rgba(168, 85, 247, 0.06)";
        podsRef.current[3].color = "rgba(52, 211, 153, 0.05)";
      }
    }
  }, [theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initializePods();
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    // Initialize 4 massive, slow-moving light pods
    const initializePods = () => {
      const isLight = useStore.getState().theme === "light";
      podsRef.current = [
        {
          x: width * 0.25,
          y: height * 0.3,
          vx: 0.15,
          vy: 0.1,
          radius: Math.min(width, height) * 0.45,
          color: isLight ? "rgba(124, 92, 255, 0.03)" : "rgba(124, 92, 255, 0.08)",
        },
        {
          x: width * 0.75,
          y: height * 0.25,
          vx: -0.1,
          vy: 0.15,
          radius: Math.min(width, height) * 0.5,
          color: isLight ? "rgba(14, 165, 233, 0.025)" : "rgba(59, 130, 246, 0.07)",
        },
        {
          x: width * 0.4,
          y: height * 0.8,
          vx: 0.08,
          vy: -0.12,
          radius: Math.min(width, height) * 0.4,
          color: isLight ? "rgba(244, 63, 94, 0.02)" : "rgba(168, 85, 247, 0.06)",
        },
        {
          x: width * 0.8,
          y: height * 0.75,
          vx: -0.12,
          vy: -0.08,
          radius: Math.min(width, height) * 0.45,
          color: isLight ? "rgba(52, 211, 153, 0.02)" : "rgba(52, 211, 153, 0.05)",
        },
      ];
    };

    initializePods();

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const mouse = mouseRef.current;

      // Update & render each light pod
      podsRef.current.forEach((pod) => {
        // Slow float
        pod.x += pod.vx;
        pod.y += pod.vy;

        // Bounce off bounds
        const pad = 50;
        if (pod.x < -pad || pod.x > width + pad) pod.vx = -pod.vx;
        if (pod.y < -pad || pod.y > height + pad) pod.vy = -pod.vy;

        // Soft cursor attraction
        if (mouse.x > -1000) {
          const dx = mouse.x - pod.x;
          const dy = mouse.y - pod.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 10) {
            pod.x += (dx / dist) * 0.06;
            pod.y += (dy / dist) * 0.06;
          }
        }

        // Render Pod Gradient
        const gradient = ctx.createRadialGradient(
          pod.x,
          pod.y,
          0,
          pod.x,
          pod.y,
          pod.radius
        );
        gradient.addColorStop(0, pod.color);
        gradient.addColorStop(0.5, pod.color.replace(/[\d.]+\)$/, "0.02)"));
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

        ctx.beginPath();
        ctx.arc(pod.x, pod.y, pod.radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0 block overflow-hidden"
      style={{ mixBlendMode: "screen" }}
    />
  );
}
