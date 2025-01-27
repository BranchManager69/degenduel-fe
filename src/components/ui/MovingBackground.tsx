import React from "react";

export const MovingBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
      {/* Dark base with subtle noise texture */}
      <div className="absolute inset-0 bg-dark-100">
        {/* Circuit grid pattern - more subtle */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f08_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f08_1px,transparent_1px)] bg-[size:48px_48px]">
          {/* Diagonal circuit lines - more subtle */}
          <div className="absolute inset-0 bg-[linear-gradient(45deg,#4f4f4f08_1px,transparent_1px),linear-gradient(-45deg,#4f4f4f08_1px,transparent_1px)] bg-[size:64px_64px]" />
        </div>

        {/* Geometric shapes - removed white borders, using gradients instead */}
        <div className="absolute inset-0">
          {/* Large hexagonal grid - more subtle */}
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,#4f4f4f08_1px,transparent_1px)] bg-[size:64px_64px] animate-pulse" />

          {/* Animated geometric elements - using gradients instead of borders */}
          <div className="absolute top-1/4 left-1/4 w-64 h-64 rotate-45 animate-float">
            <div className="absolute inset-0 bg-gradient-to-br from-cyber-400/10 to-transparent" />
          </div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 -rotate-45 animate-float [animation-delay:2000ms]">
            <div className="absolute inset-0 bg-gradient-to-tl from-brand-400/10 to-transparent" />
          </div>

          {/* Tron-like light trails - more subtle */}
          <div className="absolute h-0.5 w-full top-1/3 bg-gradient-to-r from-transparent via-cyber-400/20 to-transparent animate-scan-line" />
          <div className="absolute h-0.5 w-full bottom-1/3 bg-gradient-to-r from-transparent via-brand-400/20 to-transparent animate-scan-line [animation-delay:2000ms]" />

          {/* Vertical light beams - more subtle */}
          <div className="absolute w-0.5 h-full left-1/3 bg-gradient-to-b from-transparent via-neon-400/10 to-transparent animate-scan-vertical" />
          <div className="absolute w-0.5 h-full right-1/3 bg-gradient-to-b from-transparent via-cyber-400/10 to-transparent animate-scan-vertical [animation-delay:3000ms]" />

          {/* Corner accents - using gradients instead of borders */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-cyber-400/10 to-transparent animate-pulse" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-brand-400/10 to-transparent animate-pulse [animation-delay:1000ms]" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-neon-400/10 to-transparent animate-pulse [animation-delay:2000ms]" />
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-tl from-cyber-400/10 to-transparent animate-pulse [animation-delay:3000ms]" />
        </div>

        {/* Scanline effect - more subtle */}
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.05)_50%)] bg-[size:4px_4px] animate-scanlines opacity-30" />

        {/* Removed glowing edges */}
      </div>
    </div>
  );
};
