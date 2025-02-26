import React from "react";
import { useStore } from "../../store/useStore";
import { AmbientMarketData } from "./AmbientMarketData";
import { MarketBrain } from "./MarketBrain";
import { MarketVerse } from "./MarketVerse";
import { ParticlesEffect } from "./ParticlesEffect";
import { TokenVerse } from "./TokenVerse";

export const BackgroundEffects: React.FC = () => {
  const { uiDebug } = useStore();

  // Get enabled status with fallbacks for components that might not be defined in uiDebug
  const tokenVerseEnabled = uiDebug.backgrounds.tokenVerse?.enabled ?? false;
  const marketBrainEnabled = uiDebug.backgrounds.marketBrain?.enabled ?? false;
  const ambientMarketDataEnabled =
    uiDebug.backgrounds.ambientMarketData?.enabled ?? false;

  // For backward compatibility, assume these are enabled if not explicitly disabled
  const marketVerseEnabled = true; // MarketVerse is always enabled until we add a control
  const particlesEnabled = false; // Particles disabled by default until we add a control

  return (
    <>
      {/* Single shared dark background */}
      <div className="fixed inset-0 bg-black/40 z-0" />

      {/* Background Layer Group - All visual effects */}
      <div className="fixed inset-0 pointer-events-none">
        {/* TokenVerse - Base layer */}
        {tokenVerseEnabled && (
          <div className="absolute inset-0" style={{ zIndex: 1 }}>
            <TokenVerse />
          </div>
        )}

        {/* MarketVerse - Blended layer */}
        {marketVerseEnabled && (
          <div
            className="absolute inset-0"
            style={{ zIndex: 2, mixBlendMode: "lighten" }}
          >
            <MarketVerse />
          </div>
        )}

        {/* MarketBrain - Neural network visualization */}
        {marketBrainEnabled && (
          <div className="absolute inset-0" style={{ zIndex: 3 }}>
            <MarketBrain />
          </div>
        )}

        {/* Token particle effects */}
        {particlesEnabled && (
          <div className="absolute inset-0" style={{ zIndex: 4 }}>
            <ParticlesEffect />
          </div>
        )}

        {/* Ambient market data notifications */}
        {ambientMarketDataEnabled && <AmbientMarketData />}

        {/* Cyberpunk Overlay Effects */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ zIndex: 5, opacity: 0.3 }}
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
