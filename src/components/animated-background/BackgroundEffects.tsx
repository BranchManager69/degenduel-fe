import React from "react";
import { SYSTEM_SETTINGS } from "../../config/config";
import { useStore } from "../../store/useStore";
// Import background scenes
import { AmbientMarketData } from "./AmbientMarketData";
import { MarketBrain } from "./MarketBrain";
import { MarketVerse } from "./MarketVerse";
import { ParticlesEffect } from "./ParticlesEffect"; 
import { TokenVerse } from "./TokenVerse";
// experimental visualizations
import { AbstractPatterns } from "./experimental/AbstractPatterns";
import { FluidTokens } from "./experimental/FluidTokens";
import { GradientWaves } from "./experimental/GradientWaves";
import { NeonGrid } from "./experimental/NeonGrid";

// Define valid CSS mix blend modes to fix TypeScript errors
type MixBlendMode = 
  | "normal" | "multiply" | "screen" | "overlay" 
  | "darken" | "lighten" | "color-dodge" | "color-burn" 
  | "hard-light" | "soft-light" | "difference" | "exclusion" 
  | "hue" | "saturation" | "color" | "luminosity";

// BackgroundEffects is the main component that mixes and handles all the background effects
export const BackgroundEffects: React.FC = () => {
  const { uiDebug } = useStore();

  // === BACKGROUND SCENE SELECTION ===
  // This uses the SYSTEM_SETTINGS configuration to determine which background scenes to render
  // Multiple scenes can be enabled at once with different blend modes and z-indices
  
  // Master switch for all background effects
  const backgroundEnabled = SYSTEM_SETTINGS.BACKGROUND_SCENE.ENABLED;
  if (!backgroundEnabled) return null;
  
  // Get scene configurations from SYSTEM_SETTINGS
  const sceneConfigs = SYSTEM_SETTINGS.BACKGROUND_SCENE.SCENES || [];
  
  // Get scene configuration objects
  const particlesEffectConfig = sceneConfigs.find(scene => scene.name === "Dodgeball");
  const tokenVerseConfig = sceneConfigs.find(scene => scene.name === "TokenVerse");
  const marketVerseConfig = sceneConfigs.find(scene => scene.name === "MarketVerse");
  const marketBrainConfig = sceneConfigs.find(scene => scene.name === "MarketBrain");
  const ambientMarketDataConfig = sceneConfigs.find(scene => scene.name === "AmbientMarketData");
  
  // Determine if scenes are enabled
  const particlesEffectEnabled = particlesEffectConfig?.enabled ?? false;
  const tokenVerseEnabled = tokenVerseConfig?.enabled ?? false;
  const marketVerseEnabled = marketVerseConfig?.enabled ?? false;
  const marketBrainEnabled = marketBrainConfig?.enabled ?? false;
  const ambientMarketDataEnabled = ambientMarketDataConfig?.enabled ?? false;

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
  // Get blend modes from configuration or use defaults
  const tokenVerseBlendMode = (tokenVerseConfig?.blendMode || "normal") as MixBlendMode;
  const marketVerseBlendMode = (marketVerseConfig?.blendMode || "lighten") as MixBlendMode;
  const marketBrainBlendMode = (marketBrainConfig?.blendMode || "normal") as MixBlendMode;
  const particlesBlendMode = (particlesEffectConfig?.blendMode || "screen") as MixBlendMode;
  
  // Get z-indices from configuration or use defaults
  const tokenVerseZIndex = tokenVerseConfig?.zIndex || 1;
  const marketVerseZIndex = marketVerseConfig?.zIndex || 2;
  const marketBrainZIndex = marketBrainConfig?.zIndex || 3;
  const particlesZIndex = particlesEffectConfig?.zIndex || 4;
  const ambientMarketDataZIndex = ambientMarketDataConfig?.zIndex || 5;

  // Default experimental blend modes
  const gradientWavesBlendMode: MixBlendMode = "color-dodge"; // Enhanced for more vivid waves
  const fluidTokensBlendMode: MixBlendMode = "lighten"; // Better fluid effect
  const abstractPatternsBlendMode: MixBlendMode = "screen"; // More vivid patterns
  const neonGridBlendMode: MixBlendMode = "screen"; // Maximum neon glow effect

  // Development warning - log a warning if multiple 3D scenes are enabled
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
            style={{ zIndex: tokenVerseZIndex, mixBlendMode: tokenVerseBlendMode }}
          >
            <TokenVerse />
          </div>
        )}

        {/* (2) MARKETVERSE - Blended layer of market data and token data */}
        {marketVerseEnabled && (
          <div
            className="absolute inset-0"
            style={{ zIndex: marketVerseZIndex, mixBlendMode: marketVerseBlendMode }}
          >
            <MarketVerse />
          </div>
        )}

        {/* (3) MARKETBRAIN - Neural network visualization */}
        {marketBrainEnabled && (
          <div
            className="absolute inset-0"
            style={{ zIndex: marketBrainZIndex, mixBlendMode: marketBrainBlendMode }}
          >
            <MarketBrain />
          </div>
        )}

        {/* (4) PARTICLE EFFECTS - Particle effects based on token data */}
        {particlesEffectEnabled && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ zIndex: particlesZIndex, mixBlendMode: particlesBlendMode }}
          >
            <ParticlesEffect />
          </div>
        )}

        {/* (5) AMBIENT MARKET DATA NOTIFICATIONS */}
        {ambientMarketDataEnabled && (
          <div className="absolute inset-0" style={{ zIndex: ambientMarketDataZIndex }}>
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