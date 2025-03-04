import React from "react";
import { useStore } from "../../store/useStore";
import { AmbientMarketData } from "./AmbientMarketData";
import { MarketBrain } from "./MarketBrain";
import { MarketVerse } from "./MarketVerse";
import { ParticlesEffect } from "./ParticlesEffect";
import { TokenVerse } from "./TokenVerse";
// Import new experimental visualizations
import { AbstractPatterns } from "./experimental/AbstractPatterns";
import { FluidTokens } from "./experimental/FluidTokens";
import { GradientWaves } from "./experimental/GradientWaves";
import { NeonGrid } from "./experimental/NeonGrid";

// BackgroundEffects is the main component that mixes and handles all the background effects
export const BackgroundEffects: React.FC = () => {
  const { uiDebug } = useStore();

  // VISUALIZATION CONFIGURATION
  // ===========================
  // To enable/disable visualizations, simply set the corresponding variable to true/false
  // You can also change the order by adjusting the z-index values or component order

  // === STANDARD VISUALIZATIONS ===
  // Get enabled status with fallbacks for components that might not be defined in uiDebug
  const tokenVerseEnabled = uiDebug.backgrounds.tokenVerse?.enabled ?? false;
  const marketBrainEnabled = uiDebug.backgrounds.marketBrain?.enabled ?? false;
  const ambientMarketDataEnabled =
    uiDebug.backgrounds.ambientMarketData?.enabled ?? false;
  // For backward compatibility, assume these are enabled if not explicitly disabled
  const marketVerseEnabled = true; // MarketVerse is always enabled until we add a control
  const particlesEffectEnabled = true; // Enable enhanced particles effect for landing page

  // === EXPERIMENTAL VISUALIZATIONS ===
  // To test these, set to true and recompile - each uses the same token data as other visualizations
  const experimentalMode = true; // Master switch for all experimental visualizations

  // Individual experimental layers - only active if experimentalMode is true
  const gradientWavesEnabled =
    uiDebug.backgrounds.gradientWaves?.enabled ?? false; // Flowing gradient waves based on token volume
  const fluidTokensEnabled = uiDebug.backgrounds.fluidTokens?.enabled ?? false; // Fluid dynamics simulation using token data
  const abstractPatternsEnabled =
    uiDebug.backgrounds.abstractPatterns?.enabled ?? false; // Abstract geometric patterns driven by market trends
  const neonGridEnabled = uiDebug.backgrounds.neonGrid?.enabled ?? false; // Retro-futuristic neon grid with token data nodes

  // === BLEND MODES ===
  // Customize how layers blend together by changing these values
  // Options: "normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge",
  // "color-burn", "hard-light", "soft-light", "difference", "exclusion", "hue",
  // "saturation", "color", "luminosity"
  const tokenVerseBlendMode = "normal";
  const marketVerseBlendMode = "lighten";
  const marketBrainBlendMode = "normal";
  const particlesBlendMode = "screen";
  const gradientWavesBlendMode = "color-dodge"; // Enhanced for more vivid waves
  const fluidTokensBlendMode = "lighten"; // Better fluid effect
  const abstractPatternsBlendMode = "screen"; // More vivid patterns
  const neonGridBlendMode = "screen"; // Maximum neon glow effect

  return (
    <>
      {/* Single shared dark background */}
      <div className="fixed inset-0 bg-black/40 z-0" style={{ zIndex: 0 }} />

      {/* BACKGROUND LAYER GROUP (All visual effects) */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 1 }}>
        {/* =================================================== */}
        {/* STANDARD VISUALIZATIONS                             */}
        {/* =================================================== */}

        {/* (1) TOKENVERSE - Base layer */}
        {tokenVerseEnabled && (
          <div
            className="absolute inset-0"
            style={{ zIndex: 1, mixBlendMode: tokenVerseBlendMode }}
          >
            <TokenVerse />
          </div>
        )}

        {/* (2) MARKETVERSE - Blended layer of market data and token data */}
        {marketVerseEnabled && (
          <div
            className="absolute inset-0"
            style={{ zIndex: 2, mixBlendMode: marketVerseBlendMode }}
          >
            <MarketVerse />
          </div>
        )}

        {/* (3) MARKETBRAIN - Neural network visualization */}
        {marketBrainEnabled && (
          <div
            className="absolute inset-0"
            style={{ zIndex: 3, mixBlendMode: marketBrainBlendMode }}
          >
            <MarketBrain />
          </div>
        )}

        {/* (4) PARTICLE EFFECTS - Particle effects based on token data */}
        {particlesEffectEnabled && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ zIndex: 4, mixBlendMode: particlesBlendMode }}
          >
            <ParticlesEffect />
          </div>
        )}

        {/* (5) AMBIENT MARKET DATA NOTIFICATIONS */}
        {ambientMarketDataEnabled && (
          <div className="absolute inset-0" style={{ zIndex: 5 }}>
            <AmbientMarketData />
          </div>
        )}

        {/* =================================================== */}
        {/* EXPERIMENTAL VISUALIZATIONS                         */}
        {/* =================================================== */}

        {/* (E1) GRADIENT WAVES - Flowing organic gradients based on market activity */}
        {experimentalMode && gradientWavesEnabled && (
          <div
            className="absolute inset-0"
            style={{ zIndex: 6, mixBlendMode: gradientWavesBlendMode }}
          >
            <GradientWaves />
          </div>
        )}

        {/* (E2) FLUID TOKENS - Fluid dynamics simulation with token interaction */}
        {experimentalMode && fluidTokensEnabled && (
          <div
            className="absolute inset-0"
            style={{ zIndex: 7, mixBlendMode: fluidTokensBlendMode }}
          >
            <FluidTokens />
          </div>
        )}

        {/* (E3) ABSTRACT PATTERNS - Geometric patterns derived from market data */}
        {experimentalMode && abstractPatternsEnabled && (
          <div
            className="absolute inset-0"
            style={{ zIndex: 8, mixBlendMode: abstractPatternsBlendMode }}
          >
            <AbstractPatterns />
          </div>
        )}

        {/* (E4) NEON GRID - Retro-futuristic neon grid with token data nodes */}
        {experimentalMode && neonGridEnabled && (
          <div
            className="absolute inset-0"
            style={{ zIndex: 9, mixBlendMode: neonGridBlendMode }}
          >
            <NeonGrid />
          </div>
        )}

        {/* (6) MISC. CYBERPUNK OVERLAY EFFECTS */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ zIndex: 10, opacity: 0.3 }}
        >
          {/* Scanning lines - left */}
          <div
            className="absolute w-[1px] h-full bg-gradient-to-b from-transparent via-brand-400/10 to-transparent animate-scan-vertical"
            style={{ left: "20%", animationDelay: "-2s" }}
          />
          {/* Scanning lines - right */}
          <div
            className="absolute w-[1px] h-full bg-gradient-to-b from-transparent via-brand-400/10 to-transparent animate-scan-vertical"
            style={{ left: "80%", animationDelay: "-2s" }}
          />
        </div>
      </div>
    </>
  );
};
