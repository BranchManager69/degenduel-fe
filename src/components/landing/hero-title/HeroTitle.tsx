import { motion } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";
import ThreeManager from "../../../utils/three/ThreeManager";
// Import THREE only what's needed to avoid dual usage patterns
import { Vector3, AmbientLight, PointLight, Group, SphereGeometry, MeshStandardMaterial, Mesh } from "three";

export const HeroTitle: React.FC<{ onComplete?: () => void }> = ({ onComplete = () => {} }) => {
  const [phase, setPhase] = useState(0);
  const [degenVisible, setDegenVisible] = useState(false);
  const [duelVisible, setDuelVisible] = useState(false);
  const [impactCount, setImpactCount] = useState(0);
  const [finalMerge, setFinalMerge] = useState(false);
  const bgContainerRef = useRef<HTMLDivElement>(null);
  
  // Create a ref to store the current phase to avoid stale closures in animation callbacks
  const phaseRef = useRef(phase);
  // Update the ref whenever phase changes
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  // Create a ref to track if the scene has been initialized
  const sceneInitializedRef = useRef(false);

  // Background animation setup using Three.js with fallback handling
  useEffect(() => {
    // Skip setup if phase is 0
    if (phase === 0) return;
    
    // If scene is already initialized, don't re-initialize it
    if (sceneInitializedRef.current || ThreeManager.getInstance().hasScene('hero-energy-particles')) return;
    
    const threeManager = ThreeManager.getInstance();
    
    // Check if WebGL is available
    if (!threeManager.isWebGLAvailable()) {
      console.log('[HeroTitle] WebGL not available, using CSS fallback');
      sceneInitializedRef.current = true; // Mark as initialized to prevent retries
      
      // Create a CSS fallback background if WebGL is not available
      if (bgContainerRef.current) {
        const fallbackBg = document.createElement('div');
        fallbackBg.className = 'hero-fallback-bg';
        fallbackBg.style.position = 'absolute';
        fallbackBg.style.inset = '0';
        fallbackBg.style.background = 'radial-gradient(ellipse at center, rgba(147, 51, 234, 0.2) 0%, rgba(0, 0, 0, 0.1) 70%)';
        fallbackBg.style.overflow = 'hidden';
        bgContainerRef.current.appendChild(fallbackBg);
        
        // Add some simple CSS particles as a minimal visual effect
        for (let i = 0; i < 10; i++) {
          const particle = document.createElement('div');
          particle.className = 'hero-fallback-particle';
          particle.style.position = 'absolute';
          particle.style.width = '8px';
          particle.style.height = '8px';
          particle.style.borderRadius = '50%';
          particle.style.background = i % 2 === 0 ? '#9333EA' : '#00e1ff';
          particle.style.opacity = '0.6';
          particle.style.top = `${Math.random() * 100}%`;
          particle.style.left = `${Math.random() * 100}%`;
          particle.style.boxShadow = `0 0 10px ${i % 2 === 0 ? '#9333EA' : '#00e1ff'}`;
          
          // Add simple CSS animation
          particle.style.animation = `float-${i % 3 + 1} ${3 + Math.random() * 4}s infinite alternate`;
          fallbackBg.appendChild(particle);
        }
        
        // Add animation keyframes
        const style = document.createElement('style');
        style.textContent = `
          @keyframes float-1 {
            0% { transform: translate(0, 0); }
            100% { transform: translate(20px, 20px); }
          }
          @keyframes float-2 {
            0% { transform: translate(0, 0); }
            100% { transform: translate(-20px, 15px); }
          }
          @keyframes float-3 {
            0% { transform: translate(0, 0); }
            100% { transform: translate(15px, -20px); }
          }
        `;
        document.head.appendChild(style);
      }
      
      return;
    }
    
    // Reduce particle count if using reduced quality
    const particleCount = threeManager.isUsingReducedQuality() ? 15 : 30;
    
    // Function to set up energy particles using ThreeManager
    const setupEnergyParticles = () => {
      // Mark the scene as initialized 
      sceneInitializedRef.current = true;
      
      const { scene } = threeManager.createScene(
        'hero-energy-particles',
        {
          fov: 75,
          near: 0.1,
          far: 1000,
          position: new Vector3(0, 0, 15),
          lookAt: new Vector3(0, 0, 0),
        },
        12 // Higher render order to render on top
      );
      
      // Add lights
      const ambientLight = new AmbientLight(0xffffff, 0.4);
      scene.add(ambientLight);
      
      const pointLight1 = new PointLight(0xffffff, 0.6);
      pointLight1.position.set(10, 10, 10);
      scene.add(pointLight1);
      
      const pointLight2 = new PointLight(0x9333EA, 0.4);
      pointLight2.position.set(-10, -10, -10);
      scene.add(pointLight2);
      
      // Create particle group
      const particleGroup = new Group();
      scene.add(particleGroup);
      
      // Create particles
      const sphereGeometry = threeManager.getOrCreateGeometry(
        'energy-particle-sphere',
        () => new SphereGeometry(0.25, 8, 8)
      );
      
      const purpleMaterial = threeManager.getOrCreateMaterial(
        'energy-particle-purple',
        () => new MeshStandardMaterial({
          color: 0x9333EA,
          emissive: 0x9333EA,
          emissiveIntensity: 0.8,
          transparent: true,
          opacity: 0.8,
        })
      );
      
      const cyanMaterial = threeManager.getOrCreateMaterial(
        'energy-particle-cyan',
        () => new MeshStandardMaterial({
          color: 0x00e1ff,
          emissive: 0x00e1ff,
          emissiveIntensity: 0.8,
          transparent: true,
          opacity: 0.8,
        })
      );
      
      // Pre-generate all random values to avoid inconsistencies
      const particlesData = Array.from({ length: particleCount }, (_, i) => {
        // Use a seedable random function if you want even more consistency
        return {
          material: i % 2 === 0 ? purpleMaterial : cyanMaterial,
          initialPosition: new Vector3(
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 5
          ),
          targetPosition: new Vector3(
            (Math.random() - 0.5) * 30,
            (Math.random() - 0.5) * 15,
            (Math.random() - 0.5) * 10
          ),
          animationStartTime: performance.now() + i * 80, // Stagger start
          animationDuration: 3000, // 3 seconds per cycle
        };
      });
      
      // Create particles with pre-generated data
      particlesData.forEach((data) => {
        const particle = new Mesh(
          sphereGeometry,
          data.material
        );
        
        particle.position.copy(data.initialPosition);
        particle.scale.set(0, 0, 0); // Start invisible
        particle.userData = {
          initialPosition: data.initialPosition,
          targetPosition: data.targetPosition,
          animationStartTime: data.animationStartTime,
          animationDuration: data.animationDuration,
        };
        
        particleGroup.add(particle);
      });
      
      // Save some properties to the scene's userData for the animation callback
      scene.userData.particleGroup = particleGroup;
      
      // Register animation function using phaseRef to avoid stale closure
      threeManager.registerScene('hero-energy-particles', (deltaTime) => {
        try {
          // Access the current phase via the ref to avoid stale closure
          const currentPhase = phaseRef.current;
          
          // Rotate the particle group based on phase, but slower in reduced quality mode
          const qualityMultiplier = threeManager.isUsingReducedQuality() ? 0.5 : 1;
          const rotationSpeed = currentPhase === 3 ? 0.2 : currentPhase === 2 ? 0.1 : 0.05;
          particleGroup.rotation.z += rotationSpeed * deltaTime * qualityMultiplier;
          
          // Animate each particle
          const now = performance.now();
          particleGroup.children.forEach((particle) => {
            const userData = particle.userData;
            const elapsed = (now - userData.animationStartTime) % userData.animationDuration;
            const progress = elapsed / userData.animationDuration;
            
            // Scale animation: 0 -> 1 -> 0
            const scale = Math.sin(progress * Math.PI);
            particle.scale.set(scale, scale, scale);
            
            // Position animation: initial -> target -> initial
            particle.position.lerpVectors(
              userData.initialPosition,
              userData.targetPosition,
              Math.sin(progress * Math.PI * 2) * 0.5 + 0.5
            );
          });
        } catch (error) {
          console.error('[HeroTitle] Animation error:', error);
        }
      });
      
      // Attach renderer to the container
      if (bgContainerRef.current) {
        threeManager.attachRenderer('hero-energy-particles', bgContainerRef.current);
      }
    };
    
    // Setup energy particles using ThreeManager singleton
    try {
      setupEnergyParticles();
    } catch (error) {
      console.error('[HeroTitle] Failed to set up energy particles:', error);
    }
    
    return () => {
      // No need to cleanup on every render - we'll handle final cleanup in the component unmount
    };
  }, [phase]); // Only re-run when phase changes
  
  // Separate cleanup effect to run only when unmounting
  useEffect(() => {
    return () => {
      // Cleanup when component unmounts
      ThreeManager.getInstance().unregisterScene('hero-energy-particles');
    };
  }, []);

  // Main animation sequence
  useEffect(() => {
    // Sequence the animation
    const initialDelay = setTimeout(() => setDegenVisible(true), 800);
    const showDuel = setTimeout(() => setDuelVisible(true), 1400);
    
    // First collision
    const firstImpact = setTimeout(() => {
      setPhase(1);
      setImpactCount(1);
    }, 2600);
    
    // Second collision
    const secondImpact = setTimeout(() => {
      setPhase(2);
      setImpactCount(2);
    }, 3800);
    
    // Third and final collision with big effect
    const finalImpact = setTimeout(() => {
      setPhase(3);
      setImpactCount(3);
    }, 5000);
    
    // Final merge into page title
    const mergeTiming = setTimeout(() => {
      setFinalMerge(true);
    }, 6200);
    
    // Animation complete, trigger parent callback
    const animComplete = setTimeout(() => {
      onComplete();
    }, 7500);
    
    return () => {
      clearTimeout(initialDelay);
      clearTimeout(showDuel);
      clearTimeout(firstImpact);
      clearTimeout(secondImpact);
      clearTimeout(finalImpact);
      clearTimeout(mergeTiming);
      clearTimeout(animComplete);
    };
  }, [onComplete]);

  // Pre-calculate particle data for each impact count (1, 2, 3)
  // This fixes the issue with generating random values during render
  const particleDataCache = React.useMemo(() => {
    // Create particles data for counts 1, 2, and 3
    const cache: { [key: number]: Array<any> } = {};
    
    // Generate for each possible count value
    [1, 2, 3].forEach(count => {
      const multiplier = count === 3 ? 3 : count;
      const particleCount = 15 * multiplier;
      
      cache[count] = Array.from({ length: particleCount }, (_, i) => {
        const baseSpeed = count === 3 ? 150 : 80;
        // Use a deterministic seed based on the index and count for consistent randomness
        const seed = (i * 9301 + count * 49297) % 233280;
        // Simple pseudo-random generator
        const random = () => ((seed * (i + 1)) % 233280) / 233280;
        
        const angle = random() * Math.PI * 2;
        const distance = random() * baseSpeed;
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;
        const width = random() * 0.8 + 0.3;
        const scale = random() * 3 + 1;
        const duration = random() * 0.8 + 0.7;
        const colorIndex = i % 3;
        
        return { x, y, width, scale, duration, colorIndex };
      });
    });
    
    return cache;
  }, []); // Empty dependency array means this only calculates once
  
  // Generate particles based on impact count
  const generateParticles = React.useCallback((count: number) => {
    // Use the pre-calculated particle data from the cache
    const particleData = particleDataCache[count] || [];
    
    return particleData.map((data, i) => {
      return (
        <motion.div
          key={`particle-${i}-${count}`} // Include count in key for proper reconciliation
          className={`absolute top-1/2 left-1/2 rounded-full ${
            data.colorIndex === 0 ? 'bg-brand-400' : 
            data.colorIndex === 1 ? 'bg-white' : 'bg-cyan-400'
          }`}
          style={{ 
            width: `${data.width}vmin`, 
            height: `${data.width}vmin`,
            zIndex: 25 
          }}
          initial={{ x: 0, y: 0, opacity: 1 }}
          animate={{ 
            x: data.x + "vmin",
            y: data.y + "vmin",
            opacity: 0,
            scale: data.scale
          }}
          transition={{ 
            duration: data.duration, 
            ease: "easeOut" 
          }}
        />
      );
    });
  }, [particleDataCache]); // Only depends on the memoized cache

  // Calculate position for DEGEN word - memoized to prevent recalculations
  const degenPosition = React.useMemo(() => {
    if (phase === 0) return { x: "-40vw", scale: 1.5 };
    if (phase === 1) return { x: "-10vw", scale: 1.3 };
    if (phase === 2) return { x: "-15vw", scale: 1.4 };
    if (phase === 3 && !finalMerge) return { x: "-5vw", scale: 1.2 };
    if (finalMerge) return { x: "0vw", scale: 1 };
    return { x: "-40vw", scale: 1.5 };
  }, [phase, finalMerge]);

  // Calculate position for DUEL word - memoized to prevent recalculations
  const duelPosition = React.useMemo(() => {
    if (phase === 0) return { x: "40vw", scale: 1.5 };
    if (phase === 1) return { x: "10vw", scale: 1.3 };
    if (phase === 2) return { x: "15vw", scale: 1.4 };
    if (phase === 3 && !finalMerge) return { x: "5vw", scale: 1.2 };
    if (finalMerge) return { x: "0vw", scale: 1 };
    return { x: "40vw", scale: 1.5 };
  }, [phase, finalMerge]);

  return (
    <div className="relative h-[25vh] overflow-hidden">
      {/* Drastically shorter container height - 80% reduction as requested */}

      {/* 3D animated crypto dodgeball background using ThreeManager singleton */}
      <div className="absolute inset-0 z-5" ref={bgContainerRef}></div>

      {/* Impact flash effects - enhanced with double flash */}
      {phase > 0 && (
        <motion.div
          className="absolute inset-0 bg-white z-25"
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: phase === 3 
              ? [0, 0.95, 0.3, 0.7, 0] 
              : phase === 2 
                ? [0, 0.7, 0.2, 0] 
                : [0, 0.5, 0] 
          }}
          transition={{ 
            duration: phase === 3 ? 1.5 : 1,
            times: phase === 3 
              ? [0, 0.2, 0.5, 0.7, 1] 
              : phase === 2 
                ? [0, 0.3, 0.6, 1] 
                : [0, 0.4, 1]
          }}
        />
      )}

      {/* Improved shockwave effects */}
      {phase > 0 && (
        <>
          <motion.div 
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full ${
              phase === 3 ? 'bg-gradient-to-r from-brand-400/60 via-cyan-400/60 to-brand-400/60' : 'bg-brand-400/40'
            } z-25`}
            initial={{ width: 0, height: 0 }}
            animate={{ 
              width: phase === 3 ? "320vw" : "180vw", 
              height: phase === 3 ? "320vh" : "180vh", 
              opacity: [phase === 3 ? 0.95 : 0.7, 0] 
            }}
            transition={{ 
              duration: phase === 3 ? 1.8 : 1,
              ease: "easeOut" 
            }}
          />
          
          {/* Secondary shockwave with slight delay */}
          <motion.div 
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full ${
              phase === 3 ? 'bg-gradient-to-r from-cyan-400/50 via-brand-400/50 to-cyan-400/50' : 'bg-cyan-400/30'
            } z-25`}
            initial={{ width: 0, height: 0 }}
            animate={{ 
              width: phase === 3 ? "300vw" : "150vw", 
              height: phase === 3 ? "300vh" : "150vh", 
              opacity: [phase === 3 ? 0.85 : 0.6, 0] 
            }}
            transition={{ 
              duration: phase === 3 ? 1.7 : 0.9,
              delay: 0.1,
              ease: "easeOut" 
            }}
          />
        </>
      )}

      <div className="relative z-10 flex items-center justify-center h-full">
        {/* Container for animation elements - these are the ones that should fade out */}
        <div className={`relative flex items-center justify-center ${finalMerge ? 'gap-0 opacity-0' : 'gap-4 opacity-100'} transition-opacity duration-500`}>
          {/* DEGEN with enhanced glow and 3D effects */}
          <motion.div
            initial={{ x: "-100vw", opacity: 0, filter: "blur(12px)", rotateY: 45 }}
            animate={{
              x: degenPosition.x,
              opacity: degenVisible && !finalMerge ? 1 : 0,
              scale: degenPosition.scale,
              filter: "blur(0px)",
              rotateY: 0,
              rotateZ: phase > 0 ? [-3, 3, 0] : 0, // Slight twist
            }}
            transition={{
              x: {
                type: "spring",
                stiffness: phase === 3 ? 400 : 200,
                damping: phase === 3 ? 25 : 20,
                duration: 0.9,
              },
              rotateY: {
                duration: 1.2,
                ease: "easeOut",
              },
              rotateZ: {
                duration: phase === 3 ? 0.7 : 0.5,
                times: [0, 0.7, 1],
                ease: "easeOut",
              },
              scale: {
                duration: 0.7,
                ease: "easeOut",
              },
              opacity: {
                duration: 0.5,
              }
            }}
            className="text-[13vmin] md:text-[15vmin] font-black tracking-tighter select-none"
            style={{
              fontFamily: "'Bai Jamjuree', sans-serif",
              textShadow: phase === 3 
                ? "0 0 150px rgba(147, 51, 234, 0.95), 0 0 80px rgba(147, 51, 234, 0.8), 0 0 30px rgba(147, 51, 234, 0.6)" 
                : phase > 0 
                  ? "0 0 100px rgba(147, 51, 234, 0.8), 0 0 50px rgba(147, 51, 234, 0.6)" 
                  : "0 0 40px rgba(147, 51, 234, 0.5)",
              color: "#9333EA",
              letterSpacing: "-0.05em",
              fontWeight: "800",
              zIndex: 20,
              transform: "perspective(1000px)", // Enhanced 3D effect
            }}
          >
            DEGEN
          </motion.div>

          {/* VS divider - now a dynamic, glowing element with particle effects */}
          <motion.div
            initial={{ scale: 0, opacity: 0, rotate: 0 }}
            animate={{
              scale: phase === 3 ? [1.2, 1.5, 1.2] : phase > 0 ? [0.8, 1.2, 0.8] : 0,
              opacity: phase > 0 && !finalMerge ? 1 : 0,
              rotate: phase === 3 ? [0, 360, 720, 1080] : [0, 360], // Multiple rotations based on phase
              x: 0,
              y: 0,
            }}
            transition={{
              scale: {
                duration: phase === 3 ? 4 : 2,
                repeat: Infinity,
                repeatType: "reverse",
              },
              rotate: {
                duration: phase === 3 ? 8 : 4,
                ease: "linear",
                repeat: Infinity,
                repeatType: "loop",
              },
              x: { duration: 0.5 },
              y: { duration: 0.5 },
              opacity: { duration: 0.5 },
            }}
            className="absolute text-[8vmin] md:text-[10vmin] select-none z-30 flex items-center justify-center"
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: "700",
              perspective: "1000px",
              color: "#00e1ff", // Cyan color
              filter: "drop-shadow(0 0 20px #00e1ff)",
              width: "12vmin",
              height: "12vmin",
            }}
          >
            <div className="relative w-full h-full">
              {/* Central glowing orb */}
              <motion.div 
                className="absolute inset-0 flex items-center justify-center"
                animate={{
                  scale: [1, 1.3, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
              >
                <div className="relative w-1/3 h-1/3 rounded-full bg-cyan-400 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-cyan-300 blur-lg opacity-80"></div>
                  <div className="absolute inset-0 rounded-full bg-white blur-md opacity-50"></div>
                </div>
              </motion.div>
              
              {/* Crossed energy beams */}
              <motion.div
                className="absolute inset-0"
                animate={{
                  rotate: 360,
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "linear",
                }}
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[2px] h-full bg-gradient-to-b from-cyan-300 via-cyan-400 to-cyan-300"></div>
                <div className="absolute top-1/2 left-0 -translate-y-1/2 w-full h-[2px] bg-gradient-to-r from-cyan-300 via-cyan-400 to-cyan-300"></div>
              </motion.div>
              
              {/* Diagonal beams */}
              <motion.div
                className="absolute inset-0"
                animate={{
                  rotate: -360,
                }}
                transition={{
                  duration: 12,
                  repeat: Infinity,
                  ease: "linear",
                }}
              >
                <div className="absolute top-0 left-0 w-[2px] h-[141%] bg-gradient-to-b from-cyan-300 via-cyan-400 to-cyan-300 origin-bottom-right rotate-45"></div>
                <div className="absolute top-0 right-0 w-[2px] h-[141%] bg-gradient-to-b from-cyan-300 via-cyan-400 to-cyan-300 origin-bottom-left -rotate-45"></div>
              </motion.div>
            </div>
          </motion.div>

          {/* DUEL with enhanced 3D effects and metallic appearance */}
          <motion.div
            initial={{ x: "100vw", opacity: 0, filter: "blur(12px)", rotateY: -45 }}
            animate={{
              x: duelPosition.x,
              opacity: duelVisible && !finalMerge ? 1 : 0,
              scale: duelPosition.scale,
              filter: "blur(0px)",
              rotateY: 0,
              rotateZ: phase > 0 ? [3, -3, 0] : 0, // Slight twist in opposite direction
            }}
            transition={{
              x: {
                type: "spring",
                stiffness: phase === 3 ? 400 : 200,
                damping: phase === 3 ? 25 : 20,
                duration: 0.9,
              },
              rotateY: {
                duration: 1.2,
                ease: "easeOut",
              },
              rotateZ: {
                duration: phase === 3 ? 0.7 : 0.5,
                times: [0, 0.7, 1],
                ease: "easeOut",
              },
              scale: {
                duration: 0.7,
                ease: "easeOut",
              },
              opacity: {
                duration: 0.5,
              }
            }}
            className="text-[13vmin] md:text-[15vmin] font-black tracking-tighter select-none"
            style={{
              fontFamily: "'Michroma', sans-serif",
              background: phase === 3 
                ? 'linear-gradient(180deg, #FFFFFF 0%, #A0A0A0 100%)' 
                : 'linear-gradient(180deg, #FFFFFF 0%, #D0D0D0 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: phase === 3 
                ? "0 0 150px rgba(255, 255, 255, 0.95), 0 0 80px rgba(255, 255, 255, 0.8), 0 0 30px rgba(255, 255, 255, 0.6)" 
                : phase > 0 
                  ? "0 0 100px rgba(255, 255, 255, 0.8), 0 0 50px rgba(255, 255, 255, 0.6)" 
                  : "0 0 40px rgba(255, 255, 255, 0.5)",
              letterSpacing: "-0.03em",
              zIndex: 20,
              transform: "perspective(1000px)", // Enhanced 3D effect
              filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))",
            }}
          >
            DUEL
          </motion.div>
        </div>

        {/* Final merged logo - this should be the clean, centered version that stays visible */}
        {finalMerge && (
          <motion.div
            initial={{ opacity: 0, scale: 2, y: 20 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              y: [0, -10, 0],
              rotateY: [0, 5, 0, -5, 0],
            }}
            transition={{ 
              opacity: { duration: 0.8 },
              scale: { duration: 0.8 },
              y: {
                delay: 0.8,
                duration: 3,
                repeat: Infinity,
                repeatType: "reverse",
              },
              rotateY: {
                delay: 0.8,
                duration: 6,
                repeat: Infinity,
                repeatType: "loop",
              }
            }}
            className="absolute inset-0 flex items-center justify-center z-10"
            style={{
              transform: "perspective(1000px)", // Enhanced 3D effect
            }}
          >
            <div className="flex items-center justify-center relative">
              <h1 className="text-[13vmin] md:text-[15vmin] font-black tracking-tighter whitespace-nowrap drop-shadow-lg">
                <span className="relative inline-block">
                  <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-br from-purple-500 via-brand-500 to-brand-600" style={{fontFamily: "'Exo 2', sans-serif", fontWeight: "800"}}>
                    DEGEN
                  </span>
                  {/* Enhanced glow effect with texture */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-brand-400/30 via-brand-500/30 to-purple-400/30 blur-xl -z-10" />
                  <div className="absolute inset-0 bg-gradient-to-r from-brand-400/20 via-brand-500/20 to-brand-600/20 blur-lg -z-10" />
                  <motion.div 
                    className="absolute inset-0 bg-brand-400/10 blur-md -z-10"
                    animate={{ opacity: [0.1, 0.3, 0.1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </span>
                
                {/* Animated separator - rotating energy cross */}
                <span className="relative inline-block mx-2 md:mx-4 text-cyan-400 transform -skew-x-12">
                  <motion.span
                    animate={{ 
                      rotate: 360,
                      scale: [1, 1.2, 1]
                    }}
                    transition={{
                      rotate: {
                        duration: 12,
                        repeat: Infinity,
                        ease: "linear"
                      },
                      scale: {
                        duration: 2,
                        repeat: Infinity,
                        repeatType: "reverse"
                      }
                    }}
                    style={{
                      display: "inline-block",
                      filter: "drop-shadow(0 0 10px #00e1ff)"
                    }}
                  >
                    ×
                  </motion.span>
                </span>
                
                <span className="relative inline-block">
                  {/* Metallic DUEL text with texture and better font */}
                  <span 
                    className="relative z-10"
                    style={{
                      fontFamily: "'Goldman', sans-serif",
                      background: 'linear-gradient(180deg, #FFFFFF 0%, #A0A0A0 100%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      textShadow: "0 0 80px rgba(255, 255, 255, 0.8), 0 0 30px rgba(255, 255, 255, 0.6)",
                      filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))",
                    }}
                  >
                    DUEL
                  </span>
                  {/* Subtle glow underneath with texture */}
                  <div className="absolute inset-0 bg-white/5 blur-xl -z-10" />
                </span>
              </h1>
              
              {/* Background energy pulse */}
              <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-r from-brand-400/5 via-cyan-400/5 to-brand-400/5 blur-xl"
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.1, 0.2, 0.1] 
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  repeatType: "loop"
                }}
              />
            </div>
          </motion.div>
        )}
      </div>

      {/* Impact particles that fly out on collision */}
      {phase > 0 && generateParticles(impactCount)}

      {/* Font imports - using modern, impressive fonts with texture and personality */}
      <link
        href="https://fonts.googleapis.com/css2?family=Exo+2:wght@700;800;900&family=Goldman:wght@400;700&family=Rajdhani:wght@500;600;700&display=swap"
        rel="stylesheet"
      />
    </div>
  );
};
