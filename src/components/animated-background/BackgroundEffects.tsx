import React from "react";
import { SYSTEM_SETTINGS } from "../../config/config";
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

  // === BACKGROUND SCENE SELECTION ===
  // This uses the SYSTEM_SETTINGS configuration to determine which single background scene to render
  // Only one background scene should be enabled at a time to prevent performance issues
  
  // Master switch for all background effects
  const backgroundEnabled = SYSTEM_SETTINGS.BACKGROUND_SCENE.ENABLED;
  if (!backgroundEnabled) return null;
  
  // Determine which scene to render based on the system setting
  const sceneName = SYSTEM_SETTINGS.BACKGROUND_SCENE.SCENE_NAME;
  
  // Enable only the specified background scene and disable all others
  const particlesEffectEnabled = sceneName === "Dodgeball";
  const tokenVerseEnabled = sceneName === "TokenVerse";
  const marketVerseEnabled = sceneName === "MarketVerse";
  const marketBrainEnabled = sceneName === "MarketBrain";
  const ambientMarketDataEnabled = sceneName === "AmbientMarketData";

  // === EXPERIMENTAL VISUALIZATIONS ===
  // All experimental visualizations are disabled by default for performance
  const experimentalMode = false;

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

  // Development warning - log a warning if multiple 3D scenes are enabled
  // This should help prevent future performance issues
  if (process.env.NODE_ENV !== 'production') {
    const enabledScenes = [
      particlesEffectEnabled && 'ParticlesEffect',
      tokenVerseEnabled && 'TokenVerse',
      marketVerseEnabled && 'MarketVerse',
      marketBrainEnabled && 'MarketBrain'
    ].filter(Boolean);
    
    if (enabledScenes.length > 1) {
      console.warn(
        'PERFORMANCE WARNING: Multiple 3D scenes are enabled simultaneously, which can cause severe performance issues:',
        enabledScenes.join(', ')
      );
    }
  }

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
