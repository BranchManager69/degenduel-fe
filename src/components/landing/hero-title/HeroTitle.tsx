import { Canvas } from "@react-three/fiber";
import { motion } from "framer-motion";
import React, { useState, useEffect } from "react";
import { ParticlesEffect } from "../../animated-background/ParticlesEffect";

export const HeroTitle: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [phase, setPhase] = useState(0);
  const [degenVisible, setDegenVisible] = useState(false);
  const [duelVisible, setDuelVisible] = useState(false);
  const [impactCount, setImpactCount] = useState(0);
  const [finalMerge, setFinalMerge] = useState(false);

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

      {/* Impact flash effects */}
      {phase > 0 && (
        <motion.div
          className="absolute inset-0 bg-white z-25"
          initial={{ opacity: phase === 3 ? 0.95 : phase === 2 ? 0.7 : 0.5 }}
          animate={{ opacity: 0 }}
          transition={{ duration: phase === 3 ? 1.2 : 0.7 }}
        />
      )}

      {/* Shockwave effects */}
      {phase > 0 && (
        <motion.div 
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full ${
            phase === 3 ? 'bg-gradient-to-r from-brand-400/50 via-cyan-400/50 to-brand-400/50' : 'bg-brand-400/30'
          } z-25`}
          initial={{ width: 0, height: 0 }}
          animate={{ 
            width: phase === 3 ? "300vw" : "150vw", 
            height: phase === 3 ? "300vh" : "150vh", 
            opacity: [phase === 3 ? 0.9 : 0.6, 0] 
          }}
          transition={{ 
            duration: phase === 3 ? 1.5 : 0.8, 
            ease: "easeOut" 
          }}
        />
      )}

      <div className="relative z-20 flex flex-col items-center justify-center h-full">
        {/* Container for words that will merge */}
        <div className={`relative flex flex-col items-center justify-center ${finalMerge ? 'gap-0' : 'gap-4'}`}>
          {/* DEGEN */}
          <motion.div
            initial={{ y: "-100vh", opacity: 0, filter: "blur(8px)" }}
            animate={{
              y: degenPosition().y,
              opacity: degenVisible ? 1 : 0,
              scale: degenPosition().scale,
              filter: "blur(0px)",
              rotate: phase > 0 ? [-2, 0] : 0,
            }}
            transition={{
              y: {
                type: "spring",
                stiffness: phase === 3 ? 400 : 200,
                damping: phase === 3 ? 30 : 20,
                duration: 0.8,
              },
              scale: {
                duration: 0.6,
                ease: "easeOut",
              },
              rotate: {
                duration: 0.4,
                ease: "easeOut",
              },
            }}
            className="text-[13vmin] md:text-[15vmin] font-black tracking-tighter select-none"
            style={{
              fontFamily: "'Bai Jamjuree', sans-serif",
              textShadow: phase === 3 
                ? "0 0 120px rgba(147, 51, 234, 0.9), 0 0 60px rgba(147, 51, 234, 0.7), 0 0 20px rgba(147, 51, 234, 0.5)" 
                : phase > 0 
                  ? "0 0 80px rgba(147, 51, 234, 0.7), 0 0 40px rgba(147, 51, 234, 0.5)" 
                  : "0 0 40px rgba(147, 51, 234, 0.4)",
              color: "#9333EA",
              letterSpacing: "-0.05em",
              fontWeight: "800",
              zIndex: finalMerge ? 40 : 20,
            }}
          >
            DEGEN
          </motion.div>

          {/* Ninja star X mark - spinning in cyan */}
          <motion.div
            initial={{ scale: 0, opacity: 0, rotate: 0 }}
            animate={{
              scale: phase === 3 ? 1.2 : phase > 0 ? 1 : 0,
              opacity: phase > 0 ? 1 : 0,
              rotate: 360 * 5, // Spin multiple times
              x: finalMerge ? 0 : 0,
              y: finalMerge ? 0 : 0,
            }}
            transition={{
              scale: {
                duration: 0.4,
                ease: "backOut",
              },
              rotate: {
                duration: phase === 3 ? 2 : 1.2,
                ease: "easeInOut",
              },
              x: { duration: 0.5 },
              y: { duration: 0.5 },
            }}
            className={`absolute ${finalMerge ? 'mx-0' : 'mx-0'} text-[8vmin] md:text-[10vmin] select-none z-30`}
            style={{
              fontFamily: "'Rajdhani', sans-serif",
              fontWeight: "700",
              perspective: "1000px",
              color: "#00e1ff", // Cyan color
              filter: "drop-shadow(0 0 15px #00e1ff)",
              opacity: finalMerge ? 0 : 1,
            }}
          >
            <motion.span
              animate={{
                rotate: 360,
                scale: [1, 1.2, 1],
              }}
              transition={{
                rotate: {
                  repeat: Infinity,
                  duration: 1.5,
                  ease: "linear",
                },
                scale: {
                  repeat: Infinity,
                  duration: 1,
                  ease: "easeInOut",
                },
              }}
            >
              ×
            </motion.span>
          </motion.div>

          {/* DUEL */}
          <motion.div
            initial={{ y: "100vh", opacity: 0, filter: "blur(8px)" }}
            animate={{
              y: duelPosition().y,
              opacity: duelVisible ? 1 : 0,
              scale: duelPosition().scale,
              filter: "blur(0px)",
              rotate: phase > 0 ? [2, 0] : 0,
            }}
            transition={{
              y: {
                type: "spring",
                stiffness: phase === 3 ? 400 : 200,
                damping: phase === 3 ? 30 : 20,
                duration: 0.8,
              },
              scale: {
                duration: 0.6,
                ease: "easeOut",
              },
              rotate: {
                duration: 0.4,
                ease: "easeOut",
              },
            }}
            className="text-[13vmin] md:text-[15vmin] font-black tracking-tighter select-none"
            style={{
              fontFamily: "'Michroma', sans-serif",
              textShadow: phase === 3 
                ? "0 0 120px rgba(255, 255, 255, 0.9), 0 0 60px rgba(255, 255, 255, 0.7), 0 0 20px rgba(255, 255, 255, 0.5)" 
                : phase > 0 
                  ? "0 0 80px rgba(255, 255, 255, 0.7), 0 0 40px rgba(255, 255, 255, 0.5)" 
                  : "0 0 40px rgba(255, 255, 255, 0.4)",
              color: "#FFFFFF",
              letterSpacing: "-0.03em",
              zIndex: finalMerge ? 40 : 20,
            }}
          >
            DUEL
          </motion.div>
        </div>

        {/* Merged final logo that appears at the end */}
        {finalMerge && (
          <motion.div
            initial={{ opacity: 0, scale: 2 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50"
          >
            <div className="flex items-center">
              <h1 className="text-[13vmin] md:text-[15vmin] font-black tracking-tighter whitespace-nowrap">
                <span className="relative inline-block">
                  <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-br from-brand-400 via-brand-500 to-brand-600">
                    DEGEN
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-brand-400/20 via-brand-500/20 to-brand-600/20 blur-lg -z-10" />
                </span>
                <span className="relative inline-block mx-2 md:mx-4 text-cyan-400 transform -skew-x-12">
                  ×
                </span>
                <span className="relative inline-block">
                  <span className="relative z-10 text-gray-400">DUEL</span>
                </span>
              </h1>
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
