// src/components/landing/features-list/Features.tsx

/**
 * Features Section component
 * 
 * @description Features section component for the landing page
 * 
 * @author BranchManager69
 * @version 2.1.1
 * @created 2025-01-01
 * @updated 2025-05-23
 */

import { motion } from "framer-motion";
import React, { useMemo } from "react";
import { MeasureRender } from "../../../utils/performance";
import { FeatureList } from "./FeatureList";

const Features: React.FC = () => {
  // Memoize the cosmic effects container for better performance
  const CosmicEffects = useMemo(
    () => (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        
        {/* Ambient glow effects - Reduced for mobile performance */}
        <div className="absolute -top-[200px] md:-top-[300px] right-[5%] w-[400px] md:w-[800px] h-[400px] md:h-[800px] bg-gradient-to-r from-brand-500/3 via-purple-500/5 to-transparent md:from-brand-500/5 md:via-purple-500/10 rounded-full blur-[80px] md:blur-[120px] animate-pulse-slow" />
        
        {/* Particles #1 - Smaller on mobile */}
        <div
          className="absolute -bottom-[150px] md:-bottom-[200px] left-[10%] w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-gradient-to-l from-brand-500/3 via-purple-500/5 to-transparent md:from-brand-500/5 md:via-purple-500/10 rounded-full blur-[60px] md:blur-[100px] animate-pulse-slow"
          style={{ animationDelay: "-2s" }}
        />

        {/* Particles #2 - Fewer particles on mobile */}
        <div className="absolute inset-0">
          {[...Array(3)].map((_, i) => (
            
            //  Particle - Hidden on small screens, visible on md+
            <motion.div
              key={i}
              className="hidden md:block absolute h-1 w-1 bg-white/20 rounded-full"
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

        {/* Horizontal scan lines container - Disabled on mobile for performance */}
        <div className="absolute inset-0 hidden md:block">
          
          {/* Horizontal scan line 1 */}
          <motion.div
            className="absolute h-[1px] w-full bg-brand-400/5 blur-sm"
            style={{ top: "30%" }}
            animate={{ x: ["-100%", "100%"] }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          />

          {/* Horizontal scan line 2 */}
          <motion.div
            className="absolute h-[1px] w-full bg-purple-400/5 blur-sm"
            style={{ top: "60%" }}
            animate={{ x: ["100%", "-100%"] }}
            transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          />

        </div>

        {/* Grid lines container - Lighter on mobile */}
        <div className="absolute inset-0 opacity-5 md:opacity-10">
          <div className="absolute inset-0 bg-[linear-gradient(0deg,transparent_24px,#3f3f4620_25px,#3f3f4620_26px,transparent_27px),linear-gradient(90deg,transparent_24px,#3f3f4620_25px,#3f3f4620_26px,transparent_27px)] bg-[length:30px_30px] md:bg-[length:50px_50px]"></div>
        </div>

      </div>
    ),
    [],
  );

  // Features section JSX
  return (
    <MeasureRender id="Features" logThreshold={16}>
      <div className="relative py-12 md:py-20 overflow-hidden">
        {CosmicEffects}

        {/* Features section container */}
        <motion.div
          className="relative"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          {/* Features section header */}
          <motion.div
            className="text-center mb-8 md:mb-16 px-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            {/* Features section title section with animated underline and glow */}
            <div className="relative inline-block">
              
              {/* Features section title */}
              <motion.h2 
                className="text-2xl md:text-4xl font-bold font-russo text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-brand-400 to-purple-500 tracking-wider uppercase relative inline-block"
                animate={{
                  textShadow: [
                    "0 0 8px rgba(168, 85, 247, 0.2)",
                    "0 0 16px rgba(168, 85, 247, 0.4)",
                    "0 0 8px rgba(168, 85, 247, 0.2)"
                  ] 
                }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity 
                }}
              >
                {/* Title */}
                What is DegenDuel?
                
                {/* Animated underline */}
                <motion.div 
                  className="absolute -bottom-2 md:-bottom-3 left-0 right-0 h-0.5 md:h-1 bg-gradient-to-r from-purple-400 via-brand-400 to-purple-500 rounded-full"
                  initial={{ width: 0, left: "50%" }}
                  animate={{ width: "100%", left: 0 }}
                  transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
                />

              </motion.h2>
              
            </div>
            
            {/* Features section subtitle section with animated blinking cursor */}
            <div className="mt-4 md:mt-6 flex items-center justify-center px-2">
              
              {/* Subtitle */}
              <p className="text-gray-300 max-w-2xl mx-auto text-sm md:text-lg font-mono tracking-wide text-center">
                Experience crypto trading like never before - competitive, fun, and rewarding.
              </p>

              {/* Blinking cursor */}
              <motion.span
                className="ml-1 md:ml-2 inline-block w-1.5 md:w-2 h-4 md:h-5 bg-brand-400"
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />

            </div>
          </motion.div>

          {/* Features List Component */}
          <div className="px-2 md:px-4 relative z-10 max-w-7xl mx-auto">
            <FeatureList />
          </div>
        </motion.div>
      </div>
    </MeasureRender>
  );
};

// Export default for dynamic import
export default Features;
