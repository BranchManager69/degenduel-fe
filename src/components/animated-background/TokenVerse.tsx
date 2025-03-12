import React, { useEffect, useRef } from "react";

import { useTokenData } from "../../contexts/TokenDataContext";
import { useStore } from "../../store/useStore";
import TokenVerseScene from "../../utils/three/TokenVerseScene";

export const TokenVerse: React.FC = () => {
  const { uiDebug } = useStore();
  const { tokens, isConnected, lastUpdate } = useTokenData();
  const {
    enabled,
    intensity,
    starIntensity,
    bloomStrength,
    particleCount,
    updateFrequency,
  } = uiDebug.backgrounds.tokenVerse;

  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<TokenVerseScene | null>(null);

  // Initialize scene when component mounts and enabled is true
  useEffect(() => {
    if (!containerRef.current || !enabled) return;

    try {
      sceneRef.current = new TokenVerseScene(containerRef.current);

      // Set initial settings
      sceneRef.current.updateSettings({
        intensity,
        starIntensity,
        bloomStrength,
        particleCount,
        updateFrequency,
      });
    } catch (error) {
      console.error("[TokenVerse] Initialization error:", error);
    }

    return () => {
      if (sceneRef.current) {
        sceneRef.current.dispose();
        sceneRef.current = null;
      }
    };
  }, [enabled]);

  // Update settings when they change
  useEffect(() => {
    if (!sceneRef.current) return;

    sceneRef.current.updateSettings({
      intensity,
      starIntensity,
      bloomStrength,
      particleCount,
      updateFrequency,
    });
  }, [intensity, starIntensity, bloomStrength, particleCount, updateFrequency]);

  // Update with token data when available
  useEffect(() => {
    if (!isConnected || !tokens.length || !sceneRef.current) return;

    // Update the scene with new token data
    sceneRef.current.updateTokenData(tokens);
  }, [tokens, isConnected, lastUpdate]);

  if (!enabled) {
    return null;
  }

  return (
    <div
      id="token-verse-container"
      ref={containerRef}
      className="absolute inset-0"
      style={{
        background: "transparent",
        pointerEvents: "none",
      }}
    />
  );
};
