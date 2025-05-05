// src/components/visualization/MarketVerse.tsx

/**
 * @description A component that displays a 3D marketverse background
 * @author BranchManager69
 * @version 1.9.0
 * @created 2025-02-14
 * @updated 2025-04-30
 */

import React, { useEffect, useRef, useState } from "react";
import { useStandardizedTokenData } from "../../hooks/data/useStandardizedTokenData";
import { useStore } from "../../store/useStore";
import MarketVerseScene from "../../utils/three/MarketVerseScene";

// MarketVerse background component
export const MarketVerse: React.FC = () => {
  const { maintenanceMode, user } = useStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<MarketVerseScene | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { tokens, isConnected, lastUpdate } = useStandardizedTokenData("all");

  // Effect to check for Maintenance Mode and handle accordingly
  useEffect(() => {
    if (maintenanceMode && !(user?.is_admin || user?.is_superadmin)) {
      setError(
        "System is currently in maintenance mode. Please check back later.",
      );
      return;
    } else if (error?.toLowerCase().includes("maintenance mode")) {
      setError(null);
    }
  }, [maintenanceMode, user, error]);

  // Initialize scene
  useEffect(() => {
    if (!containerRef.current) return;

    try {
      sceneRef.current = new MarketVerseScene(containerRef.current);
    } catch (err) {
      console.error("[MarketVerse] Error initializing scene:", err);
      setError("Failed to initialize visualization");
    }

    return () => {
      if (sceneRef.current) {
        sceneRef.current.dispose();
        sceneRef.current = null;
      }
    };
  }, []);

  // Update with token data
  useEffect(() => {
    if (
      !isConnected ||
      !tokens.length ||
      !sceneRef.current ||
      (maintenanceMode && !(user?.is_admin || user?.is_superadmin))
    ) {
      return;
    }

    // Update scene with new token data
    sceneRef.current.updateMarketData(tokens);
  }, [tokens, isConnected, lastUpdate, maintenanceMode, user]);

  return (
    <div
      id="market-verse-container"
      ref={containerRef}
      className="fixed inset-0 pointer-events-auto"
      style={{ zIndex: 0 }}
    >
      {error && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 z-50">
          <div className="bg-red-500/10 border-r border-y border-red-500/20 backdrop-blur-sm py-3 px-4 min-w-[200px] max-w-[90vw] clip-edges">
            <div className="flex items-start gap-2">
              <div className="text-red-400 mt-0.5">⚠</div>
              <div className="flex-1">
                <div className="text-red-400 font-medium mb-1">
                  Visualization Error
                </div>
                <div className="text-red-400/90 text-sm break-words">
                  {error}
                </div>
                <div className="text-red-400/75 text-xs mt-2">
                  Last attempt: {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {sceneRef.current?.getLastUpdateTime() && !error && (
        <div className="absolute bottom-4 right-4 text-xs text-gray-500">
          Last updated:{" "}
          {sceneRef.current.getLastUpdateTime()?.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};
