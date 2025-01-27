import React from "react";

export const MovingBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
      {/* Dark base with subtle noise texture */}
      <div className="absolute inset-0 bg-dark-100">
        {/* Circuit grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f15_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f15_1px,transparent_1px)] bg-[size:24px_24px]">
          {/* Diagonal circuit lines */}
          <div className="absolute inset-0 bg-[linear-gradient(45deg,#4f4f4f15_1px,transparent_1px),linear-gradient(-45deg,#4f4f4f15_1px,transparent_1px)] bg-[size:32px_32px]" />
        </div>

        {/* Geometric shapes */}
        <div className="absolute inset-0">
          {/* Large hexagonal grid */}
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,#4f4f4f15_1px,transparent_1px)] bg-[size:48px_48px] animate-pulse" />

          {/* Animated geometric elements */}
          <div className="absolute top-1/4 left-1/4 w-64 h-64 border border-cyber-400/20 rotate-45 animate-float">
            <div className="absolute inset-0 bg-gradient-to-br from-cyber-400/5 to-transparent" />
          </div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 border border-brand-400/20 -rotate-45 animate-float [animation-delay:2000ms]">
            <div className="absolute inset-0 bg-gradient-to-tl from-brand-400/5 to-transparent" />
          </div>

          {/* Tron-like light trails */}
          <div className="absolute h-1 w-full top-1/3 bg-gradient-to-r from-transparent via-cyber-400/30 to-transparent animate-scan-line" />
          <div className="absolute h-1 w-full bottom-1/3 bg-gradient-to-r from-transparent via-brand-400/30 to-transparent animate-scan-line [animation-delay:2000ms]" />

          {/* Vertical light beams */}
          <div className="absolute w-1 h-full left-1/3 bg-gradient-to-b from-transparent via-neon-400/20 to-transparent animate-scan-vertical" />
          <div className="absolute w-1 h-full right-1/3 bg-gradient-to-b from-transparent via-cyber-400/20 to-transparent animate-scan-vertical [animation-delay:3000ms]" />

          {/* Corner accents */}
          <div className="absolute top-0 left-0 w-64 h-64 border-l-2 border-t-2 border-cyber-400/30 animate-pulse" />
          <div className="absolute top-0 right-0 w-64 h-64 border-r-2 border-t-2 border-brand-400/30 animate-pulse [animation-delay:1000ms]" />
          <div className="absolute bottom-0 left-0 w-64 h-64 border-l-2 border-b-2 border-neon-400/30 animate-pulse [animation-delay:2000ms]" />
          <div className="absolute bottom-0 right-0 w-64 h-64 border-r-2 border-b-2 border-cyber-400/30 animate-pulse [animation-delay:3000ms]" />
        </div>

        {/* Scanline effect */}
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.1)_50%)] bg-[size:4px_4px] animate-scanlines opacity-50" />

        {/* Glowing edges */}
        <div className="absolute inset-0 border border-cyber-400/10 shadow-[inset_0_0_100px_rgba(0,200,255,0.1)]" />
      </div>
    </div>
  );
};
