// src/components/animated-background/TokenVerse.tsx

/**
 * @description A component that displays a 3D tokenverse background
 * @author BranchManager69
 * @version 1.9.0
 * @created 2025-02-14
 * @updated 2025-04-30
 */

import React, { useEffect, useRef, useState } from "react";
import { useStandardizedTokenData } from "../../hooks/data/useStandardizedTokenData";
import { useStore } from "../../store/useStore";
import { Token } from "../../types";
import TokenVerseScene from "../../utils/three/TokenVerseScene";

// TokenVerse background component
export const TokenVerse: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const { uiDebug, maintenanceMode, user } = useStore();
  const { tokens, isConnected, lastUpdate } = useStandardizedTokenData("all");
  const {
    enabled,
    intensity,
    starIntensity,
    bloomStrength,
    particleCount,
    updateFrequency,
  } = uiDebug.backgrounds.tokenVerse;

  // Refs for the container and scene
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<TokenVerseScene | null>(null);

  // Effect to check for Maintenance Mode and handle accordingly
  useEffect(() => {
    if (maintenanceMode && !(user?.role === 'admin' || user?.role === 'superadmin')) {
      setError(
        "System is currently in maintenance mode. Please check back later.",
      );
      return;
    } else if (error?.toLowerCase().includes("maintenance mode")) {
      setError(null);
    }
  }, [maintenanceMode, user, error]);

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

    // Ensure we only pass tokens with valid contract addresses
    const validTokens = tokens.filter((token): token is Token => typeof token.contractAddress === 'string');
    // Log tokens that got filtered out
    const invalidTokens = tokens.filter((token): token is Token => typeof token.contractAddress !== 'string');
    console.log("[TokenVerse] Invalid tokens:", invalidTokens);

    // Update the scene with new token data
    sceneRef.current.updateTokenData(validTokens);
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
