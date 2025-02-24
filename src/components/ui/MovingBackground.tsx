import React, { useEffect, useRef } from "react";
import { useStore } from "../../store/useStore";

export const MovingBackground: React.FC = () => {
  const { uiDebug } = useStore();
  const { enabled, intensity } = uiDebug.backgrounds.movingBackground;
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled) return;

    const handleContextLost = (event: Event) => {
      event.preventDefault();
      console.warn("[MovingBackground] WebGL context lost");
    };

    const handleContextRestored = () => {
      console.log("[MovingBackground] WebGL context restored");
      // Force a re-render of the component
      if (container) {
        const parent = container.parentElement;
        if (parent) {
          parent.removeChild(container);
          parent.appendChild(container);
        }
      }
    };

    container.addEventListener("webglcontextlost", handleContextLost);
    container.addEventListener("webglcontextrestored", handleContextRestored);

    return () => {
      container.removeEventListener("webglcontextlost", handleContextLost);
      container.removeEventListener(
        "webglcontextrestored",
        handleContextRestored
      );
    };
  }, [enabled]);

  if (!enabled) {
    return null;
  }

  const opacityValue = intensity / 100;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none"
    >
      {/* Dark base with subtle noise texture */}
      <div className="absolute inset-0 bg-dark-100">
        {/* Circuit grid pattern - more subtle */}
        <div
          className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f08_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f08_1px,transparent_1px)] bg-[size:48px_48px]"
          style={{ opacity: opacityValue }}
        >
          {/* Diagonal circuit lines - more subtle */}
          <div
            className="absolute inset-0 bg-[linear-gradient(45deg,#4f4f4f08_1px,transparent_1px),linear-gradient(-45deg,#4f4f4f08_1px,transparent_1px)] bg-[size:64px_64px]"
            style={{ opacity: opacityValue }}
          />
        </div>

        {/* Geometric shapes - using gradients */}
        <div className="absolute inset-0">
          {/* Large hexagonal grid */}
          <div
            className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,#4f4f4f08_1px,transparent_1px)] bg-[size:64px_64px] animate-pulse"
            style={{ opacity: opacityValue }}
          />

          {/* Animated geometric elements */}
          <div className="absolute top-1/4 left-1/4 w-64 h-64 rotate-45 animate-float">
            <div
              className="absolute inset-0 bg-gradient-to-br from-cyber-400/10 to-transparent"
              style={{ opacity: opacityValue }}
            />
          </div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 -rotate-45 animate-float [animation-delay:2000ms]">
            <div
              className="absolute inset-0 bg-gradient-to-tl from-brand-400/10 to-transparent"
              style={{ opacity: opacityValue }}
            />
          </div>

          {/* Tron-like light trails */}
          <div
            className="absolute h-0.5 w-full top-1/3 bg-gradient-to-r from-transparent via-cyber-400/20 to-transparent animate-scan-line"
            style={{ opacity: opacityValue }}
          />
          <div
            className="absolute h-0.5 w-full bottom-1/3 bg-gradient-to-r from-transparent via-brand-400/20 to-transparent animate-scan-line [animation-delay:2000ms]"
            style={{ opacity: opacityValue }}
          />

          {/* Vertical light beams */}
          <div
            className="absolute w-0.5 h-full left-1/3 bg-gradient-to-b from-transparent via-neon-400/10 to-transparent animate-scan-vertical"
            style={{ opacity: opacityValue }}
          />
          <div
            className="absolute w-0.5 h-full right-1/3 bg-gradient-to-b from-transparent via-cyber-400/10 to-transparent animate-scan-vertical [animation-delay:3000ms]"
            style={{ opacity: opacityValue }}
          />

          {/* Corner accents */}
          <div
            className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-cyber-400/10 to-transparent animate-pulse"
            style={{ opacity: opacityValue }}
          />
          <div
            className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-brand-400/10 to-transparent animate-pulse [animation-delay:1000ms]"
            style={{ opacity: opacityValue }}
          />
          <div
            className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-neon-400/10 to-transparent animate-pulse [animation-delay:2000ms]"
            style={{ opacity: opacityValue }}
          />
          <div
            className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-tl from-cyber-400/10 to-transparent animate-pulse [animation-delay:3000ms]"
            style={{ opacity: opacityValue }}
          />
        </div>

        {/* Scanline effect */}
        <div
          className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_50%,rgba(0,0,0,0.05)_50%)] bg-[size:4px_4px] animate-scanlines"
          style={{ opacity: opacityValue * 0.3 }}
        />
      </div>
    </div>
  );
};
