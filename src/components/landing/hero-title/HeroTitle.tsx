// src/components/landing/hero-title/HeroTitle.tsx
 
import { motion } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../../../hooks/useAuth";

export const HeroTitle: React.FC<{ onComplete?: () => void }> = ({ onComplete = () => {} }) => {
  const { isSuperAdmin } = useAuth();
  const [phase, setPhase] = useState(0);
  const [debugMode, setDebugMode] = useState(false);
  const [manualPhaseControl, setManualPhaseControl] = useState(false);
  const [designVariant, setDesignVariant] = useState(0);
  const timeoutsRef = useRef<number[]>([]);
  
  // Create a ref to store the current phase to avoid stale closures in animation callbacks
  const phaseRef = useRef(phase);
  // Update the ref whenever phase changes
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  // Create animation styles dynamically
  useEffect(() => {
    // Add animation keyframes if they don't exist
    if (!document.getElementById('hero-animations')) {
      const style = document.createElement('style');
      style.id = 'hero-animations';
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
      `;
      document.head.appendChild(style);
    }
    
    return () => {
      // Remove animation styles if they exist
      const animStyles = document.getElementById('hero-animations');
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
    const newDebugMode = !debugMode;
    setDebugMode(newDebugMode);
    
    if (newDebugMode) {
      // When entering debug mode, clear timeouts and enable manual control
      clearAllTimeouts();
      setManualPhaseControl(true);
    } else {
      // When exiting debug mode, restart animation from beginning
      setManualPhaseControl(false);
      setPhase(0);
    }
  };

  // Font variations
  const fonts = [
    { name: 'Silkscreen', type: 'monospace' },
    { name: 'Orbitron', type: 'sans-serif' },
    { name: 'Audiowide', type: 'cursive' },
    { name: 'Press Start 2P', type: 'cursive' },
    { name: 'VT323', type: 'monospace' },
    { name: 'Chakra Petch', type: 'sans-serif' },
    { name: 'Staatliches', type: 'cursive' },
    { name: 'Bungee', type: 'cursive' },
    { name: 'Wallpoet', type: 'cursive' },
    { name: 'Teko', type: 'sans-serif' }
  ];

  // Color schemes
  const colorSchemes = [
    { degen: '#9333EA', connector: '#06b6d4', duel: 'linear-gradient(180deg, #FFFFFF 0%, #A0A0A0 100%)' },
    { degen: '#3b82f6', connector: '#f97316', duel: 'linear-gradient(180deg, #f43f5e 0%, #881337 100%)' },
    { degen: '#10b981', connector: '#f59e0b', duel: 'linear-gradient(180deg, #3730a3 0%, #1e1b4b 100%)' },
    { degen: '#ec4899', connector: '#14b8a6', duel: 'linear-gradient(180deg, #fbbf24 0%, #92400e 100%)' },
    { degen: '#6366f1', connector: '#84cc16', duel: 'linear-gradient(180deg, #0ea5e9 0%, #0c4a6e 100%)' }
  ];

  // Animation style type
  type AnimationStyleType = 'default' | 'bounce' | 'elastic' | 'staggered' | 'wave';

  // Connector styles - with TypeScript interface
  interface ConnectorStyle {
    type: 'line' | 'dot' | 'cross' | 'triangle' | 'pulse';
    width?: number;
    height?: number;
    size?: number;
  }
  
  const connectorStyles: ConnectorStyle[] = [
    { type: 'line', width: 0.3, height: 0.8 },
    { type: 'dot', size: 0.6 },
    { type: 'cross', size: 0.7 },
    { type: 'triangle', size: 0.7 },
    { type: 'pulse', size: 0.8 }
  ];

  // Animation styles
  const animationStyles: AnimationStyleType[] = [
    'default',
    'bounce',
    'elastic',
    'staggered',
    'wave'
  ];

  // Get current styles based on designVariant
  const getCurrentFont = () => fonts[designVariant % fonts.length].name;
  const getCurrentColorScheme = () => colorSchemes[Math.floor(designVariant / fonts.length) % colorSchemes.length];
  const getCurrentConnector = (): ConnectorStyle => {
    const connector = connectorStyles[Math.floor(designVariant / (fonts.length * colorSchemes.length)) % connectorStyles.length];
    // Provide defaults for potentially undefined properties
    return {
      ...connector,
      width: connector.width || 0.3,
      height: connector.height || 0.8,
      size: connector.size || 0.6
    };
  };
  const getCurrentAnimation = (): AnimationStyleType => animationStyles[Math.floor(designVariant / (fonts.length * colorSchemes.length * connectorStyles.length)) % animationStyles.length];
  
  // Total variants count
  const totalVariants = fonts.length * colorSchemes.length * connectorStyles.length * animationStyles.length;

  // Phase navigation
  const advancePhase = () => {
    setPhase(prev => (prev >= 4 ? 0 : prev + 1));
  };
  
  const previousPhase = () => {
    setPhase(prev => (prev <= 0 ? 4 : prev - 1));
  };
  
  // Design variant navigation
  const nextDesignVariant = () => {
    setDesignVariant(prev => (prev + 1) % totalVariants);
  };
  
  const previousDesignVariant = () => {
    setDesignVariant(prev => (prev <= 0 ? totalVariants - 1 : prev - 1));
  };

  // Main animation sequence
  useEffect(() => {
    // Skip if in manual control mode
    if (manualPhaseControl) return;
    
    // Store timeouts in ref for later cleanup
    const timeouts: number[] = [];
    
    // Sequence the animation
    const addTimeout = (callback: () => void, delay: number) => {
      const timeoutId = window.setTimeout(callback, delay);
      timeouts.push(timeoutId);
      return timeoutId;
    };
    
    // First phase - words appear separately
    addTimeout(() => setPhase(1), 600);
    
    // Second phase - words approach
    addTimeout(() => setPhase(2), 1800);
    
    // Third phase - letters connect
    addTimeout(() => setPhase(3), 2700);
    
    // Final phase - final state with subtle animation
    addTimeout(() => setPhase(4), 3400);
    
    // Animation complete, trigger parent callback
    addTimeout(() => {
      onComplete();
    }, 4000);
    
    // Store timeouts in ref
    timeoutsRef.current = timeouts;
    
    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [onComplete, manualPhaseControl]);

  return (
    <div className="relative h-[25vh] overflow-hidden">
      {/* Debug mode toggle button - only visible for superadmins */}
      {isSuperAdmin() && (
        <div className="absolute top-1 right-1 z-50">
          <button 
            className="bg-black/50 text-white text-xs p-1 rounded-md"
            onClick={toggleDebugMode}>
            {debugMode ? '🛠️' : '🐛'}
          </button>
        </div>
      )}
      
      {/* Debug overlay with controls */}
      {debugMode && (
        <div className="absolute bottom-1 left-1 bg-black/80 text-white text-xs p-2 rounded-md z-50 flex flex-col gap-1" style={{ maxWidth: '180px' }}>
          <div>Phase: {phase}/4</div>
          <div>Font: {getCurrentFont()}</div>
          <div>Variant: {designVariant+1}/{totalVariants}</div>
          <div>Animation: {getCurrentAnimation()}</div>
          <div>Connector: {getCurrentConnector().type}</div>
          <div className="grid grid-cols-2 gap-1 mt-1">
            {/* Phase navigation */}
            <button 
              className="bg-purple-700 text-white py-1 px-1 rounded-l text-xs col-span-1 flex items-center justify-center"
              onClick={previousPhase}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            <button 
              className="bg-purple-500 text-white py-1 px-1 rounded-r text-xs col-span-1 flex items-center justify-center"
              onClick={advancePhase}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            
            {/* Style navigation */}
            <button 
              className="bg-cyan-700 text-white py-1 px-1 rounded-l text-xs col-span-1 flex items-center justify-center"
              onClick={previousDesignVariant}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            <button 
              className="bg-cyan-500 text-white py-1 px-1 rounded-r text-xs col-span-1 flex items-center justify-center"
              onClick={nextDesignVariant}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

{/* Background removed to let the main background show through */}

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
      <div className="relative z-20 flex items-center justify-center h-full">
        <motion.div
          className={`relative ${phase >= 3 ? 'shake' : ''}`}
          animate={{ scale: phase === 0 ? 0.95 : 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Hidden clip guides for better positioning (invisible) */}
          <div className="absolute opacity-0 text-[14vmin] md:text-[16vmin] font-normal select-none tracking-tighter whitespace-nowrap" 
               style={{ fontFamily: `'${getCurrentFont()}', ${fonts[designVariant % fonts.length].type}` }}>
            DEGENDUEL
          </div>

          {/* DEGEN word */}
          <motion.div
            className="absolute left-0 text-[14vmin] md:text-[16vmin] font-normal select-none tracking-tighter"
            style={{ 
              fontFamily: `'${getCurrentFont()}', ${fonts[designVariant % fonts.length].type}`,
              color: getCurrentColorScheme().degen,
              filter: `drop-shadow(0 0 5px ${getCurrentColorScheme().degen}80)`,
              letterSpacing: "-0.02em",
              transformOrigin: "right center"
            }}
            initial={{ x: "-100vw", opacity: 0 }}
            animate={{ 
              x: phase >= 2 ? "0%" : phase >= 1 ? "-30%" : "-100vw",
              opacity: phase >= 1 ? 1 : 0,
              filter: phase >= 3 
                ? `drop-shadow(0 0 10px ${getCurrentColorScheme().degen}cc)` 
                : `drop-shadow(0 0 5px ${getCurrentColorScheme().degen}80)`,
              ...(getCurrentAnimation() === 'bounce' && phase >= 2 && { y: [0, -10, 0] }),
              ...(getCurrentAnimation() === 'elastic' && phase >= 2 && { rotate: [-2, 2, 0] }),
              ...(getCurrentAnimation() === 'wave' && phase >= 2 && { scale: [0.95, 1.05, 0.95] }),
            }}
            transition={{ 
              x: { 
                type: "spring", 
                stiffness: getCurrentAnimation() === 'elastic' ? 400 : 300, 
                damping: getCurrentAnimation() === 'elastic' ? 15 : 30, 
                duration: 0.8 
              },
              opacity: { duration: 0.3 },
              filter: { duration: 0.4 },
              y: { duration: 1.5, repeat: Infinity, repeatType: "reverse" },
              rotate: { duration: 2, repeat: Infinity, repeatType: "reverse" },
              scale: { duration: 3, repeat: Infinity, repeatType: "reverse" }
            }}
          >
            DEGEN
          </motion.div>

          {/* Connector element */}
          <motion.div
            className="absolute left-[50%] top-[50%] z-30 w-4 h-16 -translate-x-1/2 -translate-y-1/2"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: phase >= 3 ? 1 : 0,
              scale: phase >= 3 ? 1 : 0,
              rotate: getCurrentConnector().type === 'cross' ? [0, 180, 360] : 0
            }}
            transition={{ 
              opacity: { duration: 0.3 },
              scale: { type: "spring", stiffness: 400, damping: 20 },
              rotate: { duration: 6, repeat: Infinity, ease: "linear" }
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
                  ease: "easeInOut" 
                }}
              />
              
              {/* Connector types */}
              {getCurrentConnector().type === 'line' && (
                <motion.div 
                  className="absolute left-[50%] top-0 w-[2px] h-full -translate-x-1/2"
                  style={{ backgroundColor: getCurrentColorScheme().connector }}
                  animate={{ 
                    opacity: [0.6, 1, 0.6],
                    boxShadow: [
                      `0 0 5px 2px ${getCurrentColorScheme().connector}80`,
                      `0 0 10px 4px ${getCurrentColorScheme().connector}cc`,
                      `0 0 5px 2px ${getCurrentColorScheme().connector}80`
                    ]
                  }}
                  transition={{ 
                    duration: 1.5, 
                    repeat: Infinity, 
                    repeatType: "reverse" 
                  }}
                />
              )}
              
              {getCurrentConnector().type === 'dot' && (
                <motion.div 
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                  style={{ 
                    backgroundColor: getCurrentColorScheme().connector,
                    width: `0.6em`,
                    height: `0.6em`
                  }}
                  animate={{ 
                    scale: [1, 1.3, 1],
                    boxShadow: [
                      `0 0 5px 2px ${getCurrentColorScheme().connector}80`,
                      `0 0 15px 5px ${getCurrentColorScheme().connector}cc`,
                      `0 0 5px 2px ${getCurrentColorScheme().connector}80`
                    ]
                  }}
                  transition={{ 
                    duration: 1.8, 
                    repeat: Infinity, 
                    repeatType: "reverse" 
                  }}
                />
              )}
              
              {getCurrentConnector().type === 'cross' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div 
                    className="absolute w-[2px] h-full"
                    style={{ backgroundColor: getCurrentColorScheme().connector }}
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
                  />
                  <motion.div 
                    className="absolute w-full h-[2px]"
                    style={{ backgroundColor: getCurrentColorScheme().connector }}
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse", delay: 0.2 }}
                  />
                </div>
              )}
              
              {getCurrentConnector().type === 'triangle' && (
                <motion.div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                  style={{ 
                    width: 0,
                    height: 0,
                    borderLeft: `0.35em solid transparent`,
                    borderRight: `0.35em solid transparent`,
                    borderBottom: `0.7em solid ${getCurrentColorScheme().connector}`
                  }}
                  animate={{ 
                    rotate: [0, 180, 360],
                    filter: [
                      `drop-shadow(0 0 3px ${getCurrentColorScheme().connector})`,
                      `drop-shadow(0 0 8px ${getCurrentColorScheme().connector})`,
                      `drop-shadow(0 0 3px ${getCurrentColorScheme().connector})`
                    ]
                  }}
                  transition={{ 
                    rotate: { duration: 8, repeat: Infinity, ease: "linear" },
                    filter: { duration: 2, repeat: Infinity, repeatType: "reverse" }
                  }}
                />
              )}
              
              {getCurrentConnector().type === 'pulse' && (
                <>
                  <motion.div 
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                    style={{ 
                      backgroundColor: `${getCurrentColorScheme().connector}60`
                    }}
                    animate={{ 
                      width: [`0.2em`, `0.8em`],
                      height: [`0.2em`, `0.8em`],
                      opacity: [0.8, 0]
                    }}
                    transition={{ 
                      duration: 1.5, 
                      repeat: Infinity, 
                      ease: "easeOut"
                    }}
                  />
                  <motion.div 
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                    style={{ 
                      backgroundColor: getCurrentColorScheme().connector,
                      width: `0.2em`,
                      height: `0.2em`
                    }}
                    animate={{ 
                      scale: [0.9, 1.1, 0.9],
                    }}
                    transition={{ 
                      duration: 1, 
                      repeat: Infinity, 
                      repeatType: "reverse" 
                    }}
                  />
                </>
              )}
            </div>
          </motion.div>

          {/* DUEL word */}
          <motion.div
            className="absolute right-0 text-[14vmin] md:text-[16vmin] font-normal select-none tracking-tighter"
            style={{ 
              fontFamily: `'${getCurrentFont()}', ${fonts[designVariant % fonts.length].type}`,
              background: getCurrentColorScheme().duel,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: "drop-shadow(0 0 5px rgba(255, 255, 255, 0.5))",
              letterSpacing: "-0.02em",
              transformOrigin: "left center"
            }}
            initial={{ x: "100vw", opacity: 0 }}
            animate={{ 
              x: phase >= 2 ? "0%" : phase >= 1 ? "30%" : "100vw",
              opacity: phase >= 1 ? 1 : 0,
              filter: phase >= 3 
                ? "drop-shadow(0 0 10px rgba(255, 255, 255, 0.8))" 
                : "drop-shadow(0 0 5px rgba(255, 255, 255, 0.5))",
              ...(getCurrentAnimation() === 'bounce' && phase >= 2 && { y: [0, -10, 0] }),
              ...(getCurrentAnimation() === 'elastic' && phase >= 2 && { rotate: [2, -2, 0] }),
              ...(getCurrentAnimation() === 'wave' && phase >= 2 && { scale: [0.95, 1.05, 0.95] }),
              ...(getCurrentAnimation() === 'staggered' && phase >= 2 && { y: [0, -5, 0] }),
            }}
            transition={{ 
              x: { 
                type: "spring", 
                stiffness: getCurrentAnimation() === 'elastic' ? 400 : 300, 
                damping: getCurrentAnimation() === 'elastic' ? 15 : 30, 
                duration: 0.8 
              },
              opacity: { duration: 0.3 },
              filter: { duration: 0.4 },
              y: { 
                duration: getCurrentAnimation() === 'staggered' ? 2 : 1.5, 
                repeat: Infinity, 
                repeatType: "reverse",
                delay: getCurrentAnimation() === 'staggered' ? 0.5 : 0
              },
              rotate: { duration: 2, repeat: Infinity, repeatType: "reverse" },
              scale: { duration: 3, repeat: Infinity, repeatType: "reverse" }
            }}
          >
            DUEL
          </motion.div>

          {/* Unified final logo - when the words are connected */}
          {phase >= 4 && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center text-[14vmin] md:text-[16vmin] font-normal select-none tracking-tighter"
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ 
                opacity: 1, 
                scale: 1, 
                y: getCurrentAnimation() === 'default' || getCurrentAnimation() === 'bounce' ? [0, -5, 0] : 0,
                rotate: getCurrentAnimation() === 'elastic' ? [-1, 1, -1] : 0
              }}
              transition={{ 
                opacity: { duration: 0.5 },
                scale: { duration: 0.5 },
                y: { 
                  duration: 3, 
                  repeat: Infinity, 
                  repeatType: "reverse", 
                  ease: "easeInOut" 
                },
                rotate: {
                  duration: 5,
                  repeat: Infinity,
                  repeatType: "reverse"
                }
              }}
            >
              <div className="relative flex items-center">
                {/* DEGEN part */}
                <span className="relative"
                  style={{ 
                    fontFamily: `'${getCurrentFont()}', ${fonts[designVariant % fonts.length].type}`,
                    color: getCurrentColorScheme().degen,
                    filter: `drop-shadow(0 0 8px ${getCurrentColorScheme().degen}b3)`,
                    ...(getCurrentAnimation() === 'wave' && { animation: 'float 2s infinite alternate' })
                  }}
                >
                  DEGE
                  <span className="relative" style={{ marginRight: "-0.15em" }}>N</span>
                </span>
                
                {/* Connecting element based on connector style */}
                <div className="relative z-50 mx-[-0.15em]">
                  {getCurrentConnector().type === 'line' && (
                    <motion.div 
                      className="rounded-sm"
                      style={{ 
                        width: `0.3em`, 
                        height: `0.8em`,
                        backgroundColor: getCurrentColorScheme().connector
                      }}
                      animate={{ 
                        opacity: [0.8, 1, 0.8],
                        boxShadow: [
                          `0 0 5px ${getCurrentColorScheme().connector}80`,
                          `0 0 10px ${getCurrentColorScheme().connector}cc`,
                          `0 0 5px ${getCurrentColorScheme().connector}80`
                        ]
                      }}
                      transition={{ 
                        duration: 1.5, 
                        repeat: Infinity, 
                        repeatType: "reverse" 
                      }}
                    />
                  )}
                  
                  {getCurrentConnector().type === 'dot' && (
                    <motion.div 
                      className="rounded-full"
                      style={{ 
                        width: `0.3em`, 
                        height: `0.3em`,
                        backgroundColor: getCurrentColorScheme().connector
                      }}
                      animate={{ 
                        scale: [1, 1.3, 1],
                        boxShadow: [
                          `0 0 5px ${getCurrentColorScheme().connector}80`,
                          `0 0 15px ${getCurrentColorScheme().connector}cc`,
                          `0 0 5px ${getCurrentColorScheme().connector}80`
                        ]
                      }}
                      transition={{ 
                        duration: 1.8, 
                        repeat: Infinity, 
                        repeatType: "reverse" 
                      }}
                    />
                  )}
                  
                  {getCurrentConnector().type === 'cross' && (
                    <div className="relative" style={{ width: '0.6em', height: '0.6em' }}>
                      <motion.div 
                        className="absolute top-1/2 left-0 h-[2px] w-full -translate-y-1/2"
                        style={{ backgroundColor: getCurrentColorScheme().connector }}
                        animate={{ rotate: [0, 180, 360] }}
                        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                      />
                      <motion.div 
                        className="absolute top-0 left-1/2 w-[2px] h-full -translate-x-1/2"
                        style={{ backgroundColor: getCurrentColorScheme().connector }}
                        animate={{ rotate: [0, 180, 360] }}
                        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                      />
                    </div>
                  )}
                  
                  {getCurrentConnector().type === 'triangle' && (
                    <motion.div
                      style={{ 
                        width: 0,
                        height: 0,
                        borderLeft: `0.35em solid transparent`,
                        borderRight: `0.35em solid transparent`,
                        borderBottom: `0.7em solid ${getCurrentColorScheme().connector}`
                      }}
                      animate={{ 
                        rotate: [0, 180, 360],
                        filter: [
                          `drop-shadow(0 0 2px ${getCurrentColorScheme().connector})`,
                          `drop-shadow(0 0 6px ${getCurrentColorScheme().connector})`,
                          `drop-shadow(0 0 2px ${getCurrentColorScheme().connector})`
                        ]
                      }}
                      transition={{ 
                        rotate: { duration: 8, repeat: Infinity, ease: "linear" },
                        filter: { duration: 2, repeat: Infinity, repeatType: "reverse" }
                      }}
                    />
                  )}
                  
                  {getCurrentConnector().type === 'pulse' && (
                    <div className="relative" style={{ width: '0.6em', height: '0.6em' }}>
                      <motion.div
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-sm"
                        style={{ 
                          backgroundColor: getCurrentColorScheme().connector,
                          width: '0.3em',
                          height: '0.3em'
                        }}
                        animate={{ scale: [1, 1.5, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                      <motion.div
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                        style={{ backgroundColor: `${getCurrentColorScheme().connector}40` }}
                        animate={{ 
                          width: ['0.2em', '1em'],
                          height: ['0.2em', '1em'],
                          opacity: [0.8, 0]
                        }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    </div>
                  )}
                </div>
                
                {/* DUEL part */}
                <span className="relative"
                  style={{ 
                    fontFamily: `'${getCurrentFont()}', ${fonts[designVariant % fonts.length].type}`,
                    background: getCurrentColorScheme().duel,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    filter: "drop-shadow(0 0 8px rgba(255, 255, 255, 0.7))",
                    ...(getCurrentAnimation() === 'wave' && { animation: 'float 2s infinite alternate-reverse' })
                  }}
                >
                  <span className="relative" style={{ marginLeft: "-0.15em" }}>D</span>
                  UEL
                </span>
              </div>
              
              {/* Energy pulse effect behind final logo */}
              <motion.div
                className="absolute inset-0 rounded-xl blur-lg -z-10"
                style={{
                  background: `linear-gradient(to right, ${getCurrentColorScheme().degen}1a, ${getCurrentColorScheme().connector}1a, ${getCurrentColorScheme().degen}1a)`
                }}
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.2, 0.4, 0.2]
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              />
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Font imports */}
      <link
        href="https://fonts.googleapis.com/css2?family=Silkscreen:wght@400;700&family=Orbitron:wght@400;700&family=Audiowide&family=Press+Start+2P&family=VT323&family=Chakra+Petch:wght@400;700&family=Staatliches&family=Bungee&family=Wallpoet&family=Teko:wght@400;700&display=swap"
        rel="stylesheet"
      />
    </div>
  );
};
