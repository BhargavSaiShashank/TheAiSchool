"use client";

export default function CardSpotlight({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-lg group h-full bg-transparent border border-transparent hover:border-[#7C5CFF]/30 transition-all duration-300 ${className}`}
    >
      {/* Premium CSS-only Glow on Hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#7C5CFF]/[0.02] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-0" />

      <div className="relative z-10 h-full flex flex-col justify-between">
        {children}
      </div>
    </div>
  );
}
