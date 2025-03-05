// src/components/animated-background/ParticlesEffect.tsx

/**
 * This component creates a 3D dodgeball scene where crypto market tokens battle each other.
 * It uses THREE.InstancedMesh for highly efficient rendering of many 3D objects,
 * with proper trails, stretching, spinning, and lighting effects.
 * 
 * Performance Optimizations:
 * - Uses a shared THREE.js context for the entire application
 * - Renders all particles in a single draw call with InstancedMesh
 * - Adaptive quality based on device performance
 * - Efficient collision detection
 */

import React, { useEffect, useRef, useState } from "react";
import { MeasureRender, usePerformanceMeasure } from "../../utils/performance";
import { useStore } from "../../store/useStore";
import DodgeballScene from "../../utils/three/DodgeballScene";

// Performance settings
const OPACITY_MAGNITUDE = 0.7; // General opacity for the scene
const IS_MOBILE = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

export const ParticlesEffect: React.FC = () => {
  const renderPerf = usePerformanceMeasure('ParticlesEffect-render');
  const { maintenanceMode, user } = useStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<DodgeballScene | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [hasWebGLError, setHasWebGLError] = useState(false);

  // No animation if maintenance mode is on and user is not an administrator
  if (maintenanceMode && !(user?.is_admin || user?.is_superadmin)) {
    return null;
  }

  // Initialize the 3D scene
  useEffect(() => {
    // Check for WebGL support
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
      if (!gl) {
        console.error("WebGL not supported - disabling particle effects");
        setHasWebGLError(true);
        return;
      }
    } catch (error) {
      console.error("Error checking WebGL support:", error);
      setHasWebGLError(true);
      return;
    }

    // Create the dodgeball scene
    if (containerRef.current) {
      renderPerf.start();
      
      // Adjust particle counts based on device capabilities
      const particleCount = IS_MOBILE ? 100 : 150;
      const ballCount = IS_MOBILE ? 30 : 40;
      
      // Create and store the scene instance
      sceneRef.current = new DodgeballScene(
        containerRef.current,
        particleCount,   // red team count
        particleCount,   // green team count
        ballCount        // blue dodgeballs count
      );
      
      renderPerf.end();
    }

    return () => {
      // Cleanup when component unmounts
      if (sceneRef.current) {
        sceneRef.current.dispose();
        sceneRef.current = null;
      }
    };
  }, []);

  // Handle mouse/touch interaction for pulse waves
  useEffect(() => {
    if (hasWebGLError || !sceneRef.current) return;
    
    // Handle mouse/touch movement to create pulse waves
    const handleInteraction = (e: MouseEvent | TouchEvent) => {
      // Only create pulse waves occasionally to avoid overloading
      const threshold = IS_MOBILE ? 0.15 : 0.07;
      if (Math.random() > threshold) return;

      let clientX, clientY;
      if ("touches" in e) {
        // Touch event
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        // Mouse event
        clientX = e.clientX;
        clientY = e.clientY;
      }

      // Calculate relative position in scene (-1 to 1)
      const x = (clientX / window.innerWidth) * 2 - 1;
      const y = -((clientY / window.innerHeight) * 2 - 1);

      // Dispatch a custom event that our scene can listen for
      const pulseStrength = IS_MOBILE ? 0.7 + Math.random() * 0.3 : 0.5 + Math.random() * 0.5;
      const event = new CustomEvent("market-pulse", {
        detail: { x, y, strength: pulseStrength },
      });
      window.dispatchEvent(event);
    };

    // Add event listeners with passive flag for better performance
    window.addEventListener("mousemove", handleInteraction, { passive: true });
    window.addEventListener("touchmove", handleInteraction, { passive: true });
    window.addEventListener("touchstart", handleInteraction, { passive: true });
    
    return () => {
      // Clean up event listeners
      window.removeEventListener("mousemove", handleInteraction);
      window.removeEventListener("touchmove", handleInteraction);
      window.removeEventListener("touchstart", handleInteraction);
    };
  }, [hasWebGLError]);

  // Fade in the component when mounted
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // If WebGL error occurred, render nothing
  if (hasWebGLError) {
    return null;
  }

  return (
    <MeasureRender id="ParticlesEffect" logThreshold={16}>
      <div
        ref={containerRef}
        id="dodgeball-scene-container"
        className="particles-container"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none", // Don't capture clicks/taps
          zIndex: 10,
          opacity: isMounted ? OPACITY_MAGNITUDE * 0.8 : OPACITY_MAGNITUDE * 0.2, // Fade in
          transition: "opacity 2s ease-out", // Smooth transition
          transform: "translateZ(0)", // Force GPU acceleration
          willChange: "opacity", // Hint for browser optimization
        }}
      ></div>
    </MeasureRender>
  );
};