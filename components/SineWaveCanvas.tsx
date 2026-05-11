"use client";

import { useEffect, useRef } from "react";

export default function SineWaveCanvas({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 300);
    let height = (canvas.height = 60);

    const handleResize = () => {
      if (canvas.parentElement) {
        width = canvas.width = canvas.parentElement.clientWidth;
      }
    };

    window.addEventListener("resize", handleResize);

    let phase = 0;
    const waves = [
      {
        amplitude: 15,
        frequency: 0.02,
        speed: 0.12,
        color: "rgba(124, 92, 255, 0.45)",
      },
      {
        amplitude: 10,
        frequency: 0.04,
        speed: -0.08,
        color: "rgba(96, 165, 250, 0.35)",
      },
      {
        amplitude: 6,
        frequency: 0.06,
        speed: 0.16,
        color: "rgba(52, 211, 153, 0.25)",
      },
    ];

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw active sine waves
      waves.forEach((wave) => {
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = wave.color;

        let started = false;
        for (let x = 0; x < width; x += 2) {
          // Flatten wave towards the left and right edges for a professional bounded look
          const edgeDecay = Math.sin((x / width) * Math.PI);
          const currentAmp = active
            ? wave.amplitude * edgeDecay
            : 2 * edgeDecay; // subtle resting idle wave

          const y =
            height / 2 +
            Math.sin(x * wave.frequency + phase * wave.speed) * currentAmp;

          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      });

      phase += 0.5;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [active]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-[60px] block pointer-events-none rounded opacity-80"
    />
  );
}
