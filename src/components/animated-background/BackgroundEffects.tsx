import React from "react";
import { MarketVerse } from "./MarketVerse";
import { TokenVerse } from "./TokenVerse";

export const BackgroundEffects: React.FC = () => {
  return (
    <>
      {/* Single shared dark background */}
      <div className="fixed inset-0 bg-black/40 z-0" />

      {/* Background Layer Group - All visual effects */}
      <div className="fixed inset-0 pointer-events-none">
        {/* TokenVerse - Base layer */}
        <div className="absolute inset-0" style={{ zIndex: 1 }}>
          <TokenVerse />
        </div>

        {/* MarketVerse - Blended layer */}
        <div
          className="absolute inset-0"
          style={{ zIndex: 2, mixBlendMode: "lighten" }}
        >
          <MarketVerse />
        </div>

        {/* Cyberpunk Overlay Effects */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ zIndex: 3, opacity: 0.3 }}
        >
          <div
            className="absolute w-[1px] h-full bg-gradient-to-b from-transparent via-brand-400/10 to-transparent animate-scan-vertical"
            style={{ left: "20%" }}
          />
          <div
            className="absolute w-[1px] h-full bg-gradient-to-b from-transparent via-brand-400/10 to-transparent animate-scan-vertical"
            style={{ left: "80%", animationDelay: "-2s" }}
          />
        </div>
      </div>
    </>
  );
};
