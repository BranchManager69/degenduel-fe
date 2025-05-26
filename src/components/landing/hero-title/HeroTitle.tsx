// src/components/landing/hero-title/HeroTitle.tsx

import { motion } from "framer-motion";
import React, { MouseEvent, useEffect, useRef, useState } from "react";

import { useMigratedAuth } from "../../../hooks/auth/useMigratedAuth";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  life: number;
}

export const HeroTitle: React.FC<{ 
  onComplete?: () => void;
  debugMode?: boolean;
  setDebugMode?: (value: boolean) => void;
}> = ({
  onComplete = () => {},
  debugMode = false,
  setDebugMode = () => {},
}) => {
  const { isSuperAdmin } = useMigratedAuth();

  const [phase, setPhase] = useState(0);
  // Internal state only used if no external debugMode control is provided
  const [internalDebugMode, setInternalDebugMode] = useState(false);
  const [manualPhaseControl, setManualPhaseControl] = useState(false);
  const [designVariant, setDesignVariant] = useState(0);
  // Flag to indicate when animation is fully complete for Terminal coordination
  const [animationComplete, setAnimationComplete] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]); // Particle system for extra pizzazz

  // Use internal state if no external control is provided
  const isDefaultSetDebugMode = setDebugMode === (() => {});
  const effectiveDebugMode = isDefaultSetDebugMode ? internalDebugMode : debugMode;
  const effectiveSetDebugMode = isDefaultSetDebugMode ? setInternalDebugMode : setDebugMode;

  // Track mouse position for an interactive effect
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const timeoutsRef = useRef<number[]>([]);

  // Keep a ref of the current phase to avoid stale closures
  const phaseRef = useRef(phase);
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  // Create some keyframes for advanced text effects and noise flicker
  useEffect(() => {
    if (!document.getElementById("hero-animations")) {
      const style = document.createElement("style");
      style.id = "hero-animations";
      style.textContent = `
        @keyframes pulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
        @keyframes float {
          0% { transform: translateY(0px); }
          100% { transform: translateY(-10px); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
          20%, 40%, 60%, 80% { transform: translateX(2px); }
        }
        @keyframes wave {
          0% { transform: translateY(0%); }
          50% { transform: translateY(-10%); }
          100% { transform: translateY(0%); }
        }
        @keyframes ripple {
          0% { transform: scale(0.95); }
          50% { transform: scale(1.05); }
          100% { transform: scale(0.95); }
        }
        @keyframes noiseFlicker {
          0%, 100% { opacity: 0.05; }
          50% { opacity: 0.15; }
        }
      `;
      document.head.appendChild(style);
    }

    return () => {
      const animStyles = document.getElementById("hero-animations");
      if (animStyles) {
        animStyles.remove();
      }
    };
  }, []);

  // Helper to clear all animation timeouts
  const clearAllTimeouts = () => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  };

  // Toggle debug mode
  const toggleDebugMode = () => {
    const newDebugMode = !effectiveDebugMode;
    effectiveSetDebugMode(newDebugMode);

    if (newDebugMode) {
      // In debug mode, stop the normal timed sequence and allow manual stepping
      clearAllTimeouts();
      setManualPhaseControl(true);
    } else {
      // Exit debug mode → reset animation from start
      setManualPhaseControl(false);
      setPhase(0);
    }
  };

  // Font variations
  const fonts = [
    { name: "Silkscreen", type: "monospace" },
    { name: "Inter", type: "sans-serif" },
    { name: "Audiowide", type: "cursive" },
    { name: "Press Start 2P", type: "cursive" },
    { name: "VT323", type: "monospace" },
    { name: "Chakra Petch", type: "sans-serif" },
    { name: "Staatliches", type: "cursive" },
    { name: "Bungee", type: "cursive" },
    { name: "Wallpoet", type: "cursive" },
    { name: "Teko", type: "sans-serif" },
  ];

  // Color schemes
  const colorSchemes = [
    {
      degen: "#9333EA",
      connector: "#06b6d4",
      duel: "linear-gradient(180deg, #FFFFFF 0%, #A0A0A0 100%)",
    },
    {
      degen: "#3b82f6",
      connector: "#f97316",
      duel: "linear-gradient(180deg, #f43f5e 0%, #881337 100%)",
    },
    {
      degen: "#10b981",
      connector: "#f59e0b",
      duel: "linear-gradient(180deg, #3730a3 0%, #1e1b4b 100%)",
    },
    {
      degen: "#ec4899",
      connector: "#14b8a6",
      duel: "linear-gradient(180deg, #fbbf24 0%, #92400e 100%)",
    },
    {
      degen: "#6366f1",
      connector: "#84cc16",
      duel: "linear-gradient(180deg, #0ea5e9 0%, #0c4a6e 100%)",
    },
  ];

  type AnimationStyleType =
    | "default"
    | "bounce"
    | "elastic"
    | "staggered"
    | "wave";

  interface ConnectorStyle {
    type: "line" | "dot" | "cross" | "triangle" | "pulse";
    width?: number;
    height?: number;
    size?: number;
  }

  const connectorStyles: ConnectorStyle[] = [
    { type: "line", width: 0.3, height: 0.8 },
    { type: "dot", size: 0.6 },
    { type: "cross", size: 0.7 },
    { type: "triangle", size: 0.7 },
    { type: "pulse", size: 0.8 },
  ];

  const animationStyles: AnimationStyleType[] = [
    "default",
    "bounce",
    "elastic",
    "staggered",
    "wave",
  ];

  const getCurrentFont = () => fonts[designVariant % fonts.length].name;
  const getCurrentColorScheme = () =>
    colorSchemes[
      Math.floor(designVariant / fonts.length) % colorSchemes.length
    ];
  const getCurrentConnector = (): ConnectorStyle => {
    const connector =
      connectorStyles[
        Math.floor(designVariant / (fonts.length * colorSchemes.length)) %
          connectorStyles.length
      ];
    return {
      ...connector,
      width: connector.width || 0.3,
      height: connector.height || 0.8,
      size: connector.size || 0.6,
    };
  };
  const getCurrentAnimation = (): AnimationStyleType =>
    animationStyles[
      Math.floor(
        designVariant /
          (fonts.length * colorSchemes.length * connectorStyles.length),
      ) % animationStyles.length
    ];

  const totalVariants =
    fonts.length *
    colorSchemes.length *
    connectorStyles.length *
    animationStyles.length;

  // Define more granular phases for precise positioning (0-20)
  const TOTAL_PHASES = 20;

  // Phase nav
  const advancePhase = () => {
    setPhase((prev) => (prev >= TOTAL_PHASES ? 0 : prev + 1));
  };
  const previousPhase = () => {
    setPhase((prev) => (prev <= 0 ? TOTAL_PHASES : prev - 1));
  };

  // Design nav
  const nextDesignVariant = () => {
    setDesignVariant((prev) => (prev + 1) % totalVariants);
  };
  const previousDesignVariant = () => {
    setDesignVariant((prev) => (prev <= 0 ? totalVariants - 1 : prev - 1));
  };

  // Convert phase (0-20) to opacity, scale, and other animation properties
  // in a centered approach rather than positioning from left/right
  const phaseToAnimation = (currentPhase: number) => {
    // Base values
    const opacity = currentPhase === 0 ? 0 : Math.min(1, currentPhase / (TOTAL_PHASES * 0.3));
    const scale = currentPhase === 0 ? 0.6 : Math.min(1, 0.7 + (currentPhase / TOTAL_PHASES) * 0.3);
    
    // Calculate offset for vertical stacking/separation
    // Start stacked, then gradually separate to final positions
    const separation = currentPhase <= TOTAL_PHASES * 0.5 
      ? 0 
      : Math.min(1, (currentPhase - TOTAL_PHASES * 0.5) / (TOTAL_PHASES * 0.5));
    
    // Calculate connector visibility (only appears in later phases)
    const connectorOpacity = currentPhase < TOTAL_PHASES * 0.7 
      ? 0 
      : Math.min(1, (currentPhase - TOTAL_PHASES * 0.7) / (TOTAL_PHASES * 0.3));
    
    // Calculate text reveal progression (character by character)
    const textReveal = Math.min(1, currentPhase / (TOTAL_PHASES * 0.8));
    
    // Calculate character glow/highlight effect
    const glowIntensity = currentPhase < TOTAL_PHASES * 0.8 
      ? Math.min(1, currentPhase / (TOTAL_PHASES * 0.5)) 
      : 1.0;
    
    return {
      opacity,
      scale,
      separation, // 0-1 value for how separated the words are
      connectorOpacity,
      textReveal, // 0-1 value for text character reveal progress
      glowIntensity // 0-1 value for text glow/highlight intensity
    };
  };

  // Emit an event when animation is complete for Terminal coordination
  useEffect(() => {
    if (animationComplete) {
      // Dispatch a custom event that Terminal can listen for
      const event = new CustomEvent('herotitle-animation-complete', { 
        detail: { complete: true, phase } 
      });
      window.dispatchEvent(event);
    }
  }, [animationComplete, phase]);

  // Listen for Terminal animation complete event
  useEffect(() => {
    const handleTerminalComplete = (event: CustomEvent) => {
      console.log('HeroTitle received Terminal completion event', event.detail);
      // We could adjust HeroTitle animations when Terminal is finished loading
      // For example, reduce motion to make the text more readable while using Terminal
    };

    // Add event listener for the custom event
    window.addEventListener('terminal-animation-complete', handleTerminalComplete as EventListener);

    // Clean up
    return () => {
      window.removeEventListener('terminal-animation-complete', handleTerminalComplete as EventListener);
    };
  }, []);

  // A simple function to spawn some particles around the hero text edges
  const spawnParticlesHandler = (count = 5) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: Date.now() + i,
        x: 50 + Math.random() * 0.5, // near center
        y: 50 + Math.random() * 0.5, // near center
        size: Math.random() * 6 + 4,
        opacity: 1,
        life: 1,
      });
    }
    setParticles((prev) => [...prev, ...newParticles]);
  };

  // Listen for Terminal command execution
  useEffect(() => {
    const handleTerminalCommand = (event: CustomEvent) => {
      console.log('HeroTitle received command execution:', event.detail);
      
      // Choose effect based on command
      const command = event.detail.command;
      
      // Create visual effect based on the command
      if (command === 'help' || command === 'about') {
        // Pulse effect
        setDesignVariant(prev => (prev + 1) % totalVariants);
      } else if (command === 'status' || command === 'ping') {
        // Quick shake
        const el = document.querySelector('.shake-on-command');
        if (el) {
          el.classList.add('shake-animation');
          setTimeout(() => el.classList.remove('shake-animation'), 1000);
        }
      } else if (command.includes('decrypt') || command === 'contract') {
        // Flash effect - change background color briefly
        const el = document.querySelector('.flash-on-command');
        if (el) {
          el.classList.add('flash-animation');
          setTimeout(() => el.classList.remove('flash-animation'), 1500);
        }
      } else if (command === 'sector-breach-447') {
        // Major effect for secret command
        setPhase(TOTAL_PHASES); // Jump to final phase
        spawnParticlesHandler(20); // Extra particles
      } else {
        // Default effect for other commands
        spawnParticlesHandler(10);
      }
    };

    // Add event listener for command execution
    window.addEventListener('terminal-command-executed', handleTerminalCommand as EventListener);

    // Add necessary CSS for animations
    if (!document.getElementById('command-animations')) {
      const style = document.createElement('style');
      style.id = 'command-animations';
      style.textContent = `
        .shake-animation {
          animation: shake-command 0.8s cubic-bezier(.36,.07,.19,.97) both;
        }
        @keyframes shake-command {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-3px, 0, 0); }
          40%, 60% { transform: translate3d(3px, 0, 0); }
        }
        .flash-animation {
          animation: flash-command 1.5s ease-out;
        }
        @keyframes flash-command {
          0% { background-color: rgba(157, 78, 221, 0); }
          50% { background-color: rgba(157, 78, 221, 0.3); }
          100% { background-color: rgba(157, 78, 221, 0); }
        }
      `;
      document.head.appendChild(style);
    }

    // Clean up
    return () => {
      window.removeEventListener('terminal-command-executed', handleTerminalCommand as EventListener);
      const commandStyles = document.getElementById('command-animations');
      if (commandStyles) {
        commandStyles.remove();
      }
    };
  }, []);

  // Main timed animation sequence, unless in manual debug
  useEffect(() => {
    if (manualPhaseControl) return;
    const timeouts: number[] = [];

    const addTimeout = (callback: () => void, delay: number) => {
      const timeoutId = window.setTimeout(callback, delay);
      timeouts.push(timeoutId);
      return timeoutId;
    };

    // First few main phases - these are key transition points
    addTimeout(() => setPhase(1), 600);
    addTimeout(() => setPhase(Math.floor(TOTAL_PHASES * 0.2)), 1800);
    addTimeout(() => setPhase(Math.floor(TOTAL_PHASES * 0.4)), 2700);
    addTimeout(() => setPhase(Math.floor(TOTAL_PHASES * 0.6)), 3400);

    // Distribute the remaining phases to create smooth motion
    for (let i = Math.floor(TOTAL_PHASES * 0.6) + 1; i <= TOTAL_PHASES; i++) {
      // Calculate a time point between 3500ms and 4000ms based on remaining phases
      const timePoint =
        3500 +
        ((i - Math.floor(TOTAL_PHASES * 0.6)) * 500) /
          (TOTAL_PHASES - Math.floor(TOTAL_PHASES * 0.6));
      addTimeout(() => setPhase(i), timePoint);
    }

    // onComplete after final
    addTimeout(() => {
      setAnimationComplete(true);
      onComplete();
    }, 4200);

    timeoutsRef.current = timeouts;
    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [onComplete, manualPhaseControl]);

  // Track mouse for interactive styling
  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };


  // Animate and remove old particles
  useEffect(() => {
    if (!particles.length) return;
    const interval = setInterval(() => {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            y: p.y - 0.3,
            opacity: p.opacity - 0.02,
            life: p.life - 0.02,
          }))
          .filter((p) => p.life > 0),
      );
    }, 50);

    return () => clearInterval(interval);
  }, [particles]);

  // Here we read mousePos to place the radial gradient center where the cursor is.
  // We'll default to the center if we have no window size or are server-side.
  let relX = 50;
  let relY = 50;
  if (typeof window !== "undefined") {
    relX = (mousePos.x / window.innerWidth) * 100;
    relY = (mousePos.y / window.innerHeight) * 100;
  }

  return (
    <div
      className="relative h-[15vh] min-h-[150px] overflow-visible flex items-center justify-center"
      onMouseMove={handleMouseMove}
    >
      {/* Debug mode toggle (only visible to superadmin) */}
      {isSuperAdmin && (
        <div className="absolute top-1 right-1 z-50">
          <button
            className="bg-black/50 text-white text-xs p-1 rounded-md"
            onClick={toggleDebugMode}
          >
            {effectiveDebugMode ? "🛠️" : "🐛"}
          </button>
        </div>
      )}

      {/* Debug overlay with controls */}
      {effectiveDebugMode && (
        <div
          className="absolute bottom-2 left-2 bg-black/80 text-white text-xs p-3 rounded-md z-50 flex flex-col gap-1 shadow-lg shadow-black/50"
          style={{ maxWidth: "220px" }}
        >
          <div>
            Phase: {phase}/{TOTAL_PHASES}
          </div>
          <div>Font: {getCurrentFont()}</div>
          <div>
            Variant: {designVariant + 1}/{totalVariants}
          </div>
          <div>Animation: {getCurrentAnimation()}</div>
          <div>Connector: {getCurrentConnector().type}</div>

          {/* Connector explanation */}
          {/* <div className="mt-1 text-xs opacity-75 border-t border-white/20 pt-1"> */}
          {/*   Connectors may look "bad" due to: */}
          {/*   <ul className="list-disc pl-3 mt-1 space-y-0.5"> */}
          {/*     <li>Pixel-perfect alignment needed</li> */}
          {/*     <li>Font variations affect spacing</li> */}
          {/*     <li>CSS transforms alter rendering</li> */}
          {/*     <li>Text baseline inconsistencies</li> */}
          {/*   </ul> */}
          {/* </div> */}
          <div className="grid grid-cols-2 gap-1 mt-1">
            {/* Phase navigation */}
            <button
              className="bg-purple-700 text-white py-1 px-1 rounded-l text-xs col-span-1 flex items-center justify-center"
              onClick={previousPhase}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3 w-3"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <button
              className="bg-purple-500 text-white py-1 px-1 rounded-r text-xs col-span-1 flex items-center justify-center"
              onClick={advancePhase}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3 w-3"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            {/* Style navigation */}
            <button
              className="bg-cyan-700 text-white py-1 px-1 rounded-l text-xs col-span-1 flex items-center justify-center"
              onClick={previousDesignVariant}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3 w-3"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <button
              className="bg-cyan-500 text-white py-1 px-1 rounded-r text-xs col-span-1 flex items-center justify-center"
              onClick={nextDesignVariant}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3 w-3"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* 
        Noise overlay, flickering, now placed at the mouse position.
        We center the radial gradient at (relX%, relY%) instead of fixed center
      */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: `radial-gradient(
            circle at ${relX}% ${relY}%, 
            rgba(255,255,255,0.03) 1%, 
            transparent 1%
          )`,
          backgroundSize: "3px 3px",
          animation: "noiseFlicker 2s infinite",
        }}
      />

      {/* Flash effect on connection */}
      {phase === 3 && (
        <motion.div
          className="absolute inset-0 bg-white z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.7, 0] }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      )}

      {/* Main container */}
      <div className="relative z-20 flex items-center justify-center h-full w-full">
        <motion.div
          className={`relative ${phase >= 3 ? "shake" : ""} w-full flex items-center justify-center shake-on-command flash-on-command`}
          animate={{ scale: phase === 0 ? 0.95 : 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Get animation values for current phase */}
          {(() => {
            const anim = phaseToAnimation(phase);
            return (
              <div className="relative flex flex-col items-center justify-center">
                {/* Main container for both words - centered approach */}
                <div className="relative w-full flex flex-col items-center justify-center">
                  
                  {/* DUEL word - positioned at top/center */}
                  <motion.div
                    className="relative text-[14vmin] md:text-[16vmin] font-normal select-none tracking-tighter"
                    style={{
                      fontFamily: `'${getCurrentFont()}', ${fonts[designVariant % fonts.length].type}`,
                      background: getCurrentColorScheme().duel,
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      filter: `drop-shadow(0 0 ${5 + anim.glowIntensity * 5}px rgba(255, 255, 255, ${0.5 + anim.glowIntensity * 0.3}))`,
                      letterSpacing: "-0.02em",
                      zIndex: 10,
                      // Move up when separation increases
                      marginBottom: `-${anim.separation * 1.5}em`,
                    }}
                    initial={{ opacity: 0, scale: 0.6, y: 0 }}
                    animate={{
                      opacity: anim.opacity,
                      scale: anim.scale,
                      y: -anim.separation * 80, // Move up as animation progresses
                      filter: `drop-shadow(0 0 ${5 + anim.glowIntensity * 10}px rgba(255, 255, 255, ${0.5 + anim.glowIntensity * 0.3}))`,
                      ...(getCurrentAnimation() === "bounce" && phase >= 2 && { y: [-anim.separation * 80, -anim.separation * 80 - 10, -anim.separation * 80] }),
                      ...(getCurrentAnimation() === "elastic" && phase >= 2 && { rotate: [-2, 2, 0] }),
                      ...(getCurrentAnimation() === "wave" && phase >= 2 && { scale: [anim.scale * 0.95, anim.scale * 1.05, anim.scale * 0.95] }),
                    }}
                    transition={{
                      opacity: { duration: 0.5 },
                      scale: { duration: 0.6, type: "spring", stiffness: 200 },
                      y: { duration: 0.8, type: "spring", stiffness: 120 },
                      filter: { duration: 0.4 },
                      rotate: { duration: 2, repeat: Infinity, repeatType: "reverse" },
                      ...(getCurrentAnimation() === "bounce" && {
                        y: { duration: 1.5, repeat: Infinity, repeatType: "reverse" }
                      }),
                    }}
                  >
                    {/* Fixed DUEL text with simple reveal */}
                    <div className="relative overflow-visible">
                      <motion.span
                        className="font-bold"
                        initial={{ opacity: 0 }}
                        animate={{ 
                          opacity: anim.textReveal > 0.1 ? 1 : 0,
                        }}
                        transition={{ 
                          duration: 0.5
                        }}
                      >
                        DUEL
                      </motion.span>
                    </div>
                  </motion.div>
                  
                  {/* Connector element - centered */}
                  <motion.div
                    className="relative z-30 w-4 h-16 mx-auto"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{
                      opacity: anim.connectorOpacity,
                      scale: anim.connectorOpacity,
                      rotate: getCurrentConnector().type === "cross" ? [0, 180, 360] : 0,
                    }}
                    transition={{
                      opacity: { duration: 0.3 },
                      scale: { type: "spring", stiffness: 400, damping: 20 },
                      rotate: { duration: 6, repeat: Infinity, ease: "linear" },
                    }}
                  >
                    <div className="relative w-full h-full">
                      {/* Glowing connector backdrop */}
                      <motion.div
                        className={`absolute inset-0 rounded-full bg-opacity-40 blur-lg`}
                        style={{ backgroundColor: getCurrentColorScheme().connector }}
                        animate={{ scale: [1, 1.5, 1] }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          repeatType: "reverse",
                          ease: "easeInOut",
                        }}
                      />

                      {/* Connector types */}
                      {getCurrentConnector().type === "line" && (
                        <motion.div
                          className="absolute left-[50%] top-0 w-[2px] h-full -translate-x-1/2"
                          style={{ backgroundColor: getCurrentColorScheme().connector }}
                          animate={{
                            opacity: [0.6, 1, 0.6],
                            boxShadow: [
                              `0 0 5px 2px ${getCurrentColorScheme().connector}80`,
                              `0 0 10px 4px ${getCurrentColorScheme().connector}cc`,
                              `0 0 5px 2px ${getCurrentColorScheme().connector}80`,
                            ],
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            repeatType: "reverse",
                          }}
                        />
                      )}

                      {getCurrentConnector().type === "dot" && (
                        <motion.div
                          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                          style={{
                            backgroundColor: getCurrentColorScheme().connector,
                            width: `0.6em`,
                            height: `0.6em`,
                          }}
                          animate={{
                            scale: [1, 1.3, 1],
                            boxShadow: [
                              `0 0 5px 2px ${getCurrentColorScheme().connector}80`,
                              `0 0 15px 5px ${getCurrentColorScheme().connector}cc`,
                              `0 0 5px 2px ${getCurrentColorScheme().connector}80`,
                            ],
                          }}
                          transition={{
                            duration: 1.8,
                            repeat: Infinity,
                            repeatType: "reverse",
                          }}
                        />
                      )}

                      {getCurrentConnector().type === "cross" && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <motion.div
                            className="absolute w-[2px] h-full"
                            style={{
                              backgroundColor: getCurrentColorScheme().connector,
                            }}
                            animate={{ opacity: [0.7, 1, 0.7] }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              repeatType: "reverse",
                            }}
                          />
                          <motion.div
                            className="absolute w-full h-[2px]"
                            style={{
                              backgroundColor: getCurrentColorScheme().connector,
                            }}
                            animate={{ opacity: [0.7, 1, 0.7] }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              repeatType: "reverse",
                              delay: 0.2,
                            }}
                          />
                        </div>
                      )}

                      {getCurrentConnector().type === "triangle" && (
                        <motion.div
                          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                          style={{
                            width: 0,
                            height: 0,
                            borderLeft: `0.35em solid transparent`,
                            borderRight: `0.35em solid transparent`,
                            borderBottom: `0.7em solid ${getCurrentColorScheme().connector}`,
                          }}
                          animate={{
                            rotate: [0, 180, 360],
                            filter: [
                              `drop-shadow(0 0 3px ${getCurrentColorScheme().connector})`,
                              `drop-shadow(0 0 8px ${getCurrentColorScheme().connector})`,
                              `drop-shadow(0 0 3px ${getCurrentColorScheme().connector})`,
                            ],
                          }}
                          transition={{
                            rotate: { duration: 8, repeat: Infinity, ease: "linear" },
                            filter: {
                              duration: 2,
                              repeat: Infinity,
                              repeatType: "reverse",
                            },
                          }}
                        />
                      )}

                      {getCurrentConnector().type === "pulse" && (
                        <>
                          <motion.div
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                            style={{
                              backgroundColor: `${getCurrentColorScheme().connector}60`,
                            }}
                            animate={{
                              width: [`0.2em`, `0.8em`],
                              height: [`0.2em`, `0.8em`],
                              opacity: [0.8, 0],
                            }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              ease: "easeOut",
                            }}
                          />
                          <motion.div
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                            style={{
                              backgroundColor: getCurrentColorScheme().connector,
                              width: `0.2em`,
                              height: `0.2em`,
                            }}
                            animate={{
                              scale: [0.9, 1.1, 0.9],
                            }}
                            transition={{
                              duration: 1,
                              repeat: Infinity,
                              repeatType: "reverse",
                            }}
                          />
                        </>
                      )}
                    </div>
                  </motion.div>

                  {/* DEGEN word - positioned at bottom/center */}
                  <motion.div
                    className="relative text-[14vmin] md:text-[16vmin] font-normal select-none tracking-tighter"
                    style={{
                      fontFamily: `'${getCurrentFont()}', ${fonts[designVariant % fonts.length].type}`,
                      color: getCurrentColorScheme().degen,
                      filter: `drop-shadow(0 0 ${5 + anim.glowIntensity * 5}px ${getCurrentColorScheme().degen}80)`,
                      letterSpacing: "-0.02em",
                      zIndex: 10,
                      // Move down when separation increases
                      marginTop: `-${anim.separation * 1.5}em`,
                    }}
                    initial={{ opacity: 0, scale: 0.6, y: 0 }}
                    animate={{
                      opacity: anim.opacity,
                      scale: anim.scale,
                      y: anim.separation * 80, // Move down as animation progresses
                      filter: `drop-shadow(0 0 ${5 + anim.glowIntensity * 5}px ${getCurrentColorScheme().degen}${Math.floor(0.5 + anim.glowIntensity * 0.5).toString(16)}0)`,
                      ...(getCurrentAnimation() === "bounce" && phase >= 2 && { y: [anim.separation * 80, anim.separation * 80 + 10, anim.separation * 80] }),
                      ...(getCurrentAnimation() === "elastic" && phase >= 2 && { rotate: [2, -2, 0] }),
                      ...(getCurrentAnimation() === "wave" && phase >= 2 && { scale: [anim.scale * 0.95, anim.scale * 1.05, anim.scale * 0.95] }),
                    }}
                    transition={{
                      opacity: { duration: 0.5 },
                      scale: { duration: 0.6, type: "spring", stiffness: 200 },
                      y: { duration: 0.8, type: "spring", stiffness: 120 },
                      filter: { duration: 0.4 },
                      rotate: { duration: 2, repeat: Infinity, repeatType: "reverse" },
                      ...(getCurrentAnimation() === "bounce" && {
                        y: { duration: 1.5, repeat: Infinity, repeatType: "reverse", delay: 0.2 }
                      }),
                    }}
                  >
                    {/* Fixed DEGEN text with simple reveal */}
                    <div className="relative overflow-visible">
                      <motion.span
                        className="font-bold"
                        initial={{ opacity: 0 }}
                        animate={{ 
                          opacity: anim.textReveal > 0.3 ? 1 : 0,
                        }}
                        transition={{ 
                          duration: 0.5,
                          delay: 0.2 // Slight delay after DUEL
                        }}
                      >
                        DEGEN
                      </motion.span>
                    </div>
                  </motion.div>
                </div>
              </div>
            );
          })()}
          
          {/* Flash effect on connection */}
          {phase === 3 && (
            <motion.div
              className="absolute inset-0 bg-white z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.7, 0] }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          )}

          {/* Final unified logo - temporary disabled to avoid overlap */}
          {false && phase >= Math.floor(TOTAL_PHASES * 0.8) && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center text-[14vmin] md:text-[16vmin] font-normal select-none tracking-tighter"
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{
                opacity: 1,
                scale: 1,
                y:
                  getCurrentAnimation() === "default" ||
                  getCurrentAnimation() === "bounce"
                    ? [0, -5, 0]
                    : 0,
                rotate: getCurrentAnimation() === "elastic" ? [-1, 1, -1] : 0,
              }}
              transition={{
                opacity: { duration: 0.5 },
                scale: { duration: 0.5 },
                y: {
                  duration: 3,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut",
                },
                rotate: {
                  duration: 5,
                  repeat: Infinity,
                  repeatType: "reverse",
                },
              }}
            >
              <div
                className="relative flex items-center"
                onMouseEnter={() => spawnParticlesHandler(8)}
                onClick={() => spawnParticlesHandler(12)}
                style={{ cursor: "pointer" }}
              >
                {/* DUEL part */}
                <span
                  className="relative"
                  style={{
                    fontFamily: `'${getCurrentFont()}', ${
                      fonts[designVariant % fonts.length].type
                    }`,
                    background: getCurrentColorScheme().duel,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    filter: "drop-shadow(0 0 8px rgba(255, 255, 255, 0.7))",
                    ...(getCurrentAnimation() === "wave" && {
                      animation: "float 2s infinite alternate-reverse",
                    }),
                  }}
                >
                  <span className="relative" style={{ marginRight: "-0.15em" }}>
                    D
                  </span>
                  UEL
                </span>

                {/* Connecting element */}
                <div className="relative z-50 mx-[-0.15em]">
                  {getCurrentConnector().type === "line" && (
                    <motion.div
                      className="rounded-sm"
                      style={{
                        width: `0.3em`,
                        height: `0.8em`,
                        backgroundColor: getCurrentColorScheme().connector,
                      }}
                      animate={{
                        opacity: [0.8, 1, 0.8],
                        boxShadow: [
                          `0 0 5px ${getCurrentColorScheme().connector}80`,
                          `0 0 10px ${getCurrentColorScheme().connector}cc`,
                          `0 0 5px ${getCurrentColorScheme().connector}80`,
                        ],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        repeatType: "reverse",
                      }}
                    />
                  )}

                  {getCurrentConnector().type === "dot" && (
                    <motion.div
                      className="rounded-full"
                      style={{
                        width: `0.3em`,
                        height: `0.3em`,
                        backgroundColor: getCurrentColorScheme().connector,
                      }}
                      animate={{
                        scale: [1, 1.3, 1],
                        boxShadow: [
                          `0 0 5px ${getCurrentColorScheme().connector}80`,
                          `0 0 15px ${getCurrentColorScheme().connector}cc`,
                          `0 0 5px ${getCurrentColorScheme().connector}80`,
                        ],
                      }}
                      transition={{
                        duration: 1.8,
                        repeat: Infinity,
                        repeatType: "reverse",
                      }}
                    />
                  )}

                  {getCurrentConnector().type === "cross" && (
                    <div
                      className="relative"
                      style={{ width: "0.6em", height: "0.6em" }}
                    >
                      <motion.div
                        className="absolute top-1/2 left-0 h-[2px] w-full -translate-y-1/2"
                        style={{
                          backgroundColor: getCurrentColorScheme().connector,
                        }}
                        animate={{ rotate: [0, 180, 360] }}
                        transition={{
                          duration: 6,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      />
                      <motion.div
                        className="absolute top-0 left-1/2 w-[2px] h-full -translate-x-1/2"
                        style={{
                          backgroundColor: getCurrentColorScheme().connector,
                        }}
                        animate={{ rotate: [0, 180, 360] }}
                        transition={{
                          duration: 6,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      />
                    </div>
                  )}

                  {getCurrentConnector().type === "triangle" && (
                    <motion.div
                      style={{
                        width: 0,
                        height: 0,
                        borderLeft: `0.35em solid transparent`,
                        borderRight: `0.35em solid transparent`,
                        borderBottom: `0.7em solid ${getCurrentColorScheme().connector}`,
                      }}
                      animate={{
                        rotate: [0, 180, 360],
                        filter: [
                          `drop-shadow(0 0 2px ${getCurrentColorScheme().connector})`,
                          `drop-shadow(0 0 6px ${getCurrentColorScheme().connector})`,
                          `drop-shadow(0 0 2px ${getCurrentColorScheme().connector})`,
                        ],
                      }}
                      transition={{
                        rotate: {
                          duration: 8,
                          repeat: Infinity,
                          ease: "linear",
                        },
                        filter: {
                          duration: 2,
                          repeat: Infinity,
                          repeatType: "reverse",
                        },
                      }}
                    />
                  )}

                  {getCurrentConnector().type === "pulse" && (
                    <div
                      className="relative"
                      style={{ width: "0.6em", height: "0.6em" }}
                    >
                      <motion.div
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-sm"
                        style={{
                          backgroundColor: getCurrentColorScheme().connector,
                          width: "0.3em",
                          height: "0.3em",
                        }}
                        animate={{ scale: [1, 1.5, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                      <motion.div
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                        style={{
                          backgroundColor: `${getCurrentColorScheme().connector}40`,
                        }}
                        animate={{
                          width: ["0.2em", "1em"],
                          height: ["0.2em", "1em"],
                          opacity: [0.8, 0],
                        }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    </div>
                  )}
                </div>

                {/* DEGEN part */}
                <span
                  className="relative"
                  style={{
                    fontFamily: `'${getCurrentFont()}', ${
                      fonts[designVariant % fonts.length].type
                    }`,
                    color: getCurrentColorScheme().degen,
                    filter: `drop-shadow(0 0 8px ${getCurrentColorScheme().degen}b3)`,
                    ...(getCurrentAnimation() === "wave" && {
                      animation: "float 2s infinite alternate",
                    }),
                  }}
                >
                  <span className="relative" style={{ marginLeft: "-0.15em" }}>
                    D
                  </span>
                  EGEN
                </span>
              </div>

              {/* Energy pulse behind final logo */}
              <motion.div
                className="absolute inset-0 rounded-xl blur-lg -z-10"
                style={{
                  background: `linear-gradient(to right, ${
                    getCurrentColorScheme().degen
                  }1a, ${getCurrentColorScheme().connector}1a, ${
                    getCurrentColorScheme().degen
                  }1a)`,
                }}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.2, 0.4, 0.2],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
              />
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Simple floating particle system */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="pointer-events-none absolute"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            backgroundColor: getCurrentColorScheme().connector,
            opacity: p.opacity,
            zIndex: 30,
          }}
        />
      ))}

      {/* Font imports */}
      <link
        href="https://fonts.googleapis.com/css2?family=Silkscreen:wght@400;700&family=Inter:wght@400;700&family=Audiowide&family=Press+Start+2P&family=VT323&family=Chakra+Petch:wght@400;700&family=Staatliches&family=Bungee&family=Wallpoet&family=Teko:wght@400;700&display=swap"
        rel="stylesheet"
      />
    </div>
  );
};
