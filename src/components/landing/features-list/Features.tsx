import { motion } from "framer-motion";
import React, { useMemo } from "react";

import { FeatureList } from "./FeatureList";
import { MeasureRender } from "../../../utils/performance";

const Features: React.FC = () => {
  // Memoize the cosmic effects container for better performance
  const CosmicEffects = useMemo(
    () => (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Ambient glow effects */}
        <div className="absolute -top-[300px] right-[5%] w-[800px] h-[800px] bg-gradient-to-r from-brand-500/5 via-purple-500/10 to-transparent rounded-full blur-[120px] animate-pulse-slow" />
        <div
          className="absolute -bottom-[200px] left-[10%] w-[600px] h-[600px] bg-gradient-to-l from-brand-500/5 via-purple-500/10 to-transparent rounded-full blur-[100px] animate-pulse-slow"
          style={{ animationDelay: "-2s" }}
        />

        {/* Particle field */}
        <div className="absolute inset-0">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute h-1 w-1 bg-white/20 rounded-full"
              style={{
                top: `${15 + i * 15}%`,
                left: `${10 + i * 15}%`,
              }}
              animate={{
                opacity: [0.2, 0.6, 0.2],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: 3 + i,
                repeat: Infinity,
                delay: i * 0.5,
              }}
            />
          ))}
        </div>

        {/* Horizontal scan lines */}
        <div className="absolute inset-0">
          <motion.div
            className="absolute h-[1px] w-full bg-brand-400/5 blur-sm"
            style={{ top: "30%" }}
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute h-[1px] w-full bg-purple-400/5 blur-sm"
            style={{ top: "60%" }}
            animate={{ x: ["100%", "-100%"] }}
            transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          />
        </div>

        {/* Terminal-inspired grid lines */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[linear-gradient(0deg,transparent_24px,#3f3f4620_25px,#3f3f4620_26px,transparent_27px),linear-gradient(90deg,transparent_24px,#3f3f4620_25px,#3f3f4620_26px,transparent_27px)] bg-[length:50px_50px]"></div>
        </div>
      </div>
    ),
    [],
  );

  return (
    <MeasureRender id="Features" logThreshold={16}>
      <div className="relative py-20 overflow-hidden">
        {CosmicEffects}

        {/* Content Container */}
        <motion.div
          className="relative"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          {/* Section Header with modern terminal-inspired design */}
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            {/* Title with animated underline and glow */}
            <div className="relative inline-block">
              <motion.h2 
                className="text-4xl font-bold font-russo text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-brand-400 to-purple-500 tracking-wider uppercase relative inline-block"
                animate={{
                  textShadow: [
                    "0 0 8px rgba(168, 85, 247, 0.2)",
                    "0 0 16px rgba(168, 85, 247, 0.4)",
                    "0 0 8px rgba(168, 85, 247, 0.2)"
                  ] 
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                Platform Features
                <motion.div 
                  className="absolute -bottom-3 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 via-brand-400 to-purple-500 rounded-full"
                  initial={{ width: 0, left: "50%" }}
                  animate={{ width: "100%", left: 0 }}
                  transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
                />
              </motion.h2>
            </div>
            
            {/* Subtitle with terminal-inspired blinking cursor */}
            <div className="mt-6 flex items-center justify-center">
              <p className="text-gray-300 max-w-2xl mx-auto text-lg font-mono tracking-wide">
                Experience the future of competitive token trading
              </p>
              <motion.span
                className="ml-2 inline-block w-2 h-5 bg-brand-400"
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
            </div>
          </motion.div>

          {/* Features List Component */}
          <div className="px-4 relative z-10 max-w-7xl mx-auto">
            <FeatureList />
          </div>
        </motion.div>
      </div>
    </MeasureRender>
  );
};

// Export default for dynamic import
export default Features;
