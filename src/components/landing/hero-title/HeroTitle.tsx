import { motion } from "framer-motion";
import React, { useState, useEffect, useRef } from "react";
import { ParticlesEffect } from "../../animated-background/ParticlesEffect";
import * as THREE from "three";
import ThreeManager from "../../../utils/three/ThreeManager";
import { Canvas } from "@react-three/fiber";

export const HeroTitle: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [phase, setPhase] = useState(0);
  const [degenVisible, setDegenVisible] = useState(false);
  const [duelVisible, setDuelVisible] = useState(false);
  const [impactCount, setImpactCount] = useState(0);
  const [finalMerge, setFinalMerge] = useState(false);
  const bgContainerRef = useRef<HTMLDivElement>(null);

  // Function to set up energy particles using ThreeManager
  const setupEnergyParticles = () => {
    const threeManager = ThreeManager.getInstance();
    const { scene } = threeManager.createScene(
      'hero-energy-particles',
      {
        fov: 75,
        near: 0.1,
        far: 1000,
        position: new THREE.Vector3(0, 0, 15),
        lookAt: new THREE.Vector3(0, 0, 0),
      },
      12 // Higher render order to render on top
    );
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    
    const pointLight1 = new THREE.PointLight(0xffffff, 0.6);
    pointLight1.position.set(10, 10, 10);
    scene.add(pointLight1);
    
    const pointLight2 = new THREE.PointLight(0x9333EA, 0.4);
    pointLight2.position.set(-10, -10, -10);
    scene.add(pointLight2);
    
    // Create particle group
    const particleGroup = new THREE.Group();
    scene.add(particleGroup);
    
    // Create particles
    const sphereGeometry = threeManager.getOrCreateGeometry(
      'energy-particle-sphere',
      () => new THREE.SphereGeometry(0.25, 8, 8)
    );
    
    const purpleMaterial = threeManager.getOrCreateMaterial(
      'energy-particle-purple',
      () => new THREE.MeshStandardMaterial({
        color: 0x9333EA,
        emissive: 0x9333EA,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.8,
      })
    );
    
    const cyanMaterial = threeManager.getOrCreateMaterial(
      'energy-particle-cyan',
      () => new THREE.MeshStandardMaterial({
        color: 0x00e1ff,
        emissive: 0x00e1ff,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.8,
      })
    );
    
    // Create 30 particles
    for (let i = 0; i < 30; i++) {
      const particle = new THREE.Mesh(
        sphereGeometry,
        i % 2 === 0 ? purpleMaterial : cyanMaterial
      );
      
      particle.position.set(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 5
      );
      
      particle.scale.set(0, 0, 0); // Start invisible
      particle.userData = {
        initialPosition: particle.position.clone(),
        targetPosition: new THREE.Vector3(
          (Math.random() - 0.5) * 30,
          (Math.random() - 0.5) * 15,
          (Math.random() - 0.5) * 10
        ),
        animationStartTime: performance.now() + i * 80, // Stagger start
        animationDuration: 3000, // 3 seconds per cycle
      };
      
      particleGroup.add(particle);
    }
    
    // Using a local phase variable in the closure to avoid stale reference
    const currentPhase = phase;
    
    // Register animation function
    threeManager.registerScene('hero-energy-particles', (deltaTime) => {
      // Rotate the particle group based on phase
      const rotationSpeed = currentPhase === 3 ? 0.2 : currentPhase === 2 ? 0.1 : 0.05;
      particleGroup.rotation.z += rotationSpeed * deltaTime;
      
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
    });
    
    // Attach renderer to the container
    if (bgContainerRef.current) {
      threeManager.attachRenderer('hero-energy-particles', bgContainerRef.current);
    }
  };

  // Background animation setup using Three.js
  useEffect(() => {
    if (phase > 0) {
      // Setup energy particles using ThreeManager singleton
      setupEnergyParticles();
    }
    
    return () => {
      // Cleanup when component unmounts
      ThreeManager.getInstance().unregisterScene('hero-energy-particles');
    };
  }, [phase]);

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

  // Generate particles based on impact count
  const generateParticles = (count: number) => {
    const multiplier = count === 3 ? 3 : count;
    return [...Array(15 * multiplier)].map((_, i) => {
      const baseSpeed = count === 3 ? 150 : 80;
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * baseSpeed;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;
      
      return (
        <motion.div
          key={`particle-${i}`}
          className={`absolute top-1/2 left-1/2 rounded-full ${i % 3 === 0 ? 'bg-brand-400' : i % 3 === 1 ? 'bg-white' : 'bg-cyan-400'}`}
          style={{ 
            width: `${Math.random() * 0.8 + 0.3}vmin`, 
            height: `${Math.random() * 0.8 + 0.3}vmin`,
            zIndex: 25 
          }}
          initial={{ x: 0, y: 0, opacity: 1 }}
          animate={{ 
            x: x + "vmin",
            y: y + "vmin",
            opacity: 0,
            scale: Math.random() * 3 + 1
          }}
          transition={{ 
            duration: Math.random() * 0.8 + 0.7, 
            ease: "easeOut" 
          }}
        />
      );
    });
  };

  // Calculate position for DEGEN word
  const degenPosition = () => {
    if (phase === 0) return { y: "-40vh", scale: 1.5 };
    if (phase === 1) return { y: "-5vh", scale: 1.3 };
    if (phase === 2) return { y: "-15vh", scale: 1.4 };
    if (phase === 3 && !finalMerge) return { y: "-5vh", scale: 1.2 };
    if (finalMerge) return { y: "0vh", scale: 1 };
    return { y: "-40vh", scale: 1.5 };
  };

  // Calculate position for DUEL word
  const duelPosition = () => {
    if (phase === 0) return { y: "40vh", scale: 1.5 };
    if (phase === 1) return { y: "5vh", scale: 1.3 };
    if (phase === 2) return { y: "15vh", scale: 1.4 };
    if (phase === 3 && !finalMerge) return { y: "5vh", scale: 1.2 };
    if (finalMerge) return { y: "0vh", scale: 1 };
    return { y: "40vh", scale: 1.5 };
  };

  return (
    <div className="relative h-screen overflow-hidden bg-black">
      {/* Atmospheric effect */}
      <div className="absolute inset-0 z-10 opacity-80">
        <Canvas>
          <ParticlesEffect />
        </Canvas>
      </div>

      {/* Initial darkness */}
      <motion.div
        className="absolute inset-0 bg-black z-30"
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 1.2 }}
      />

      {/* 3D animated crypto dodgeball background using ThreeManager singleton */}
      <div className="absolute inset-0 z-15 opacity-80" ref={bgContainerRef}></div>
      
      {/* Use ParticlesEffect which already uses ThreeManager singleton */}
      <div className="absolute inset-0 z-10 opacity-50">
        <ParticlesEffect />
      </div>

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

      <div className="relative z-20 flex flex-col items-center justify-center h-full">
        {/* Container for words that will merge */}
        <div className={`relative flex flex-col items-center justify-center ${finalMerge ? 'gap-0' : 'gap-4'}`}>
          {/* DEGEN with enhanced glow and 3D effects */}
          <motion.div
            initial={{ y: "-100vh", opacity: 0, filter: "blur(12px)", rotateX: 45 }}
            animate={{
              y: degenPosition().y,
              opacity: degenVisible ? 1 : 0,
              scale: degenPosition().scale,
              filter: "blur(0px)",
              rotateX: 0,
              rotateY: phase > 0 ? [-5, 5, 0] : 0, // 3D wobble effect
              rotateZ: phase > 0 ? [-3, 3, 0] : 0, // Slight twist
            }}
            transition={{
              y: {
                type: "spring",
                stiffness: phase === 3 ? 400 : 200,
                damping: phase === 3 ? 25 : 20,
                duration: 0.9,
              },
              rotateX: {
                duration: 1.2,
                ease: "easeOut",
              },
              rotateY: {
                duration: phase === 3 ? 0.8 : 0.6,
                times: [0, 0.6, 1],
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
              zIndex: finalMerge ? 40 : 20,
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
              opacity: phase > 0 ? 1 : 0,
              rotate: phase === 3 ? [0, 360, 720, 1080] : [0, 360], // Multiple rotations based on phase
              x: finalMerge ? 0 : 0,
              y: finalMerge ? 0 : 0,
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
            }}
            className={`absolute ${finalMerge ? 'mx-0' : 'mx-0'} text-[8vmin] md:text-[10vmin] select-none z-30 flex items-center justify-center`}
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: "700",
              perspective: "1000px",
              color: "#00e1ff", // Cyan color
              filter: "drop-shadow(0 0 20px #00e1ff)",
              opacity: finalMerge ? 0 : 1,
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
            initial={{ y: "100vh", opacity: 0, filter: "blur(12px)", rotateX: -45 }}
            animate={{
              y: duelPosition().y,
              opacity: duelVisible ? 1 : 0,
              scale: duelPosition().scale,
              filter: "blur(0px)",
              rotateX: 0,
              rotateY: phase > 0 ? [5, -5, 0] : 0, // 3D wobble effect in opposite direction
              rotateZ: phase > 0 ? [3, -3, 0] : 0, // Slight twist in opposite direction
            }}
            transition={{
              y: {
                type: "spring",
                stiffness: phase === 3 ? 400 : 200,
                damping: phase === 3 ? 25 : 20,
                duration: 0.9,
              },
              rotateX: {
                duration: 1.2,
                ease: "easeOut",
              },
              rotateY: {
                duration: phase === 3 ? 0.8 : 0.6,
                times: [0, 0.6, 1],
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
              zIndex: finalMerge ? 40 : 20,
              transform: "perspective(1000px)", // Enhanced 3D effect
              filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))",
            }}
          >
            DUEL
          </motion.div>
        </div>

        {/* Merged final logo that appears at the end - enhanced with 3D effects and animations */}
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
              duration: 1.8, 
              ease: [0.19, 1.0, 0.22, 1.0], // Exponential ease-out
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
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50"
            style={{
              transform: "perspective(1000px)", // Enhanced 3D effect
            }}
          >
            <div className="flex items-center relative">
              <h1 className="text-[13vmin] md:text-[15vmin] font-black tracking-tighter whitespace-nowrap">
                <span className="relative inline-block">
                  <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-br from-brand-400 via-brand-500 to-brand-600">
                    DEGEN
                  </span>
                  {/* Enhanced glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-brand-400/30 via-brand-500/30 to-brand-600/30 blur-xl -z-10" />
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
                  {/* Metallic DUEL text */}
                  <span 
                    className="relative z-10"
                    style={{
                      background: 'linear-gradient(180deg, #FFFFFF 0%, #A0A0A0 100%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))",
                    }}
                  >
                    DUEL
                  </span>
                  {/* Subtle glow underneath */}
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

      {/* Font imports - using modern, impressive fonts */}
      <link
        href="https://fonts.googleapis.com/css2?family=Bai+Jamjuree:wght@700;800&family=Michroma&family=Rajdhani:wght@500;600;700&display=swap"
        rel="stylesheet"
      />
    </div>
  );
};
