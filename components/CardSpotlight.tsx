"use client";

import { useRef, useState, MouseEvent } from "react";

export default function CardSpotlight({ children }: { children: React.ReactNode }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setCoords({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative overflow-hidden rounded-lg group h-full"
    >
      {/* Dynamic Cursor Light Spot */}
      {isHovered && (
        <div
          className="absolute inset-0 pointer-events-none transition duration-300 opacity-100 z-0"
          style={{
            background: `radial-gradient(300px circle at ${coords.x}px ${coords.y}px, rgba(124, 92, 255, 0.08) 0%, rgba(124, 92, 255, 0) 70%)`,
          }}
        />
      )}
      <div className="relative z-10 h-full flex flex-col justify-between">
        {children}
      </div>
    </div>
  );
}
