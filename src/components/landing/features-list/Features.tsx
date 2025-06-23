// src/components/landing/features-list/Features.tsx

/**
 * Features Section component
 * 
 * @description Features section component for the landing page
 * 
 * @author BranchManager69
 * @version 2.2.0
 * @created 2025-01-01
 * @updated 2025-05-23
 */

import { motion } from "framer-motion";
import React, { RefObject, useEffect, useMemo, useRef, useState } from "react";
import { useIsVisible } from "../../../hooks/ui/useIsVisible";
import { MeasureRender } from "../../../utils/performance";
import { FeatureList } from "./FeatureList";
import { SectionHeader } from "./SectionHeader";

// Hook for reduced motion preference
const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  return prefersReducedMotion;
};

const Features: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isVisible = useIsVisible(containerRef as RefObject<Element>, { threshold: 0.1 });
  const prefersReducedMotion = useReducedMotion();

  // Memoize the cosmic effects container for better performance
  // Only render expensive animations when visible and motion is allowed
  const CosmicEffects = useMemo(
    () => (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        
        {/* Static ambient glow effects - Always visible but less intensive */}
        <div className="absolute -top-[200px] md:-top-[300px] right-[5%] w-[400px] md:w-[800px] h-[400px] md:h-[800px] bg-gradient-to-r from-brand-500/2 via-purple-500/3 to-transparent md:from-brand-500/4 md:via-purple-500/6 rounded-full blur-[80px] md:blur-[120px]" />
        
        {/* Static particles container - Less intensive */}
        <div
          className="absolute -bottom-[150px] md:-bottom-[200px] left-[10%] w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-gradient-to-l from-brand-500/2 via-purple-500/3 to-transparent md:from-brand-500/4 md:via-purple-500/6 rounded-full blur-[60px] md:blur-[100px]"
        />

        {/* Animated particles - Only when visible and motion allowed */}
        {isVisible && !prefersReducedMotion && (
          <>
            {/* Pulsing glow effects */}
            <div className="absolute -top-[200px] md:-top-[300px] right-[5%] w-[400px] md:w-[800px] h-[400px] md:h-[800px] bg-gradient-to-r from-brand-500/1 via-purple-500/2 to-transparent md:from-brand-500/1 md:via-purple-500/4 rounded-full blur-[80px] md:blur-[120px] animate-pulse-slow" />
            
            <div
              className="absolute -bottom-[150px] md:-bottom-[200px] left-[10%] w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-gradient-to-l from-brand-500/1 via-purple-500/2 to-transparent md:from-brand-500/1 md:via-purple-500/4 rounded-full blur-[60px] md:blur-[100px] animate-pulse-slow"
              style={{ animationDelay: "-2s" }}
            />

            {/* Floating particles - Desktop only when motion allowed */}
            <div className="absolute inset-0">
              {[...Array(3)].map((_, i) => (
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

            {/* Horizontal scan lines container - Desktop only when motion allowed */}
            <div className="absolute inset-0 hidden md:block">
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
          </>
        )}

        {/* Static grid lines - Always visible but lighter */}
        <div className="absolute inset-0 opacity-3 md:opacity-5">
          <div className="absolute inset-0 bg-[linear-gradient(0deg,transparent_24px,#3f3f4610_25px,#3f3f4610_26px,transparent_27px),linear-gradient(90deg,transparent_24px,#3f3f4610_25px,#3f3f4610_26px,transparent_27px)] bg-[length:30px_30px] md:bg-[length:50px_50px]"></div>
        </div>

      </div>
    ),
    [isVisible, prefersReducedMotion],
  );

  // Features section JSX
  return (
    <MeasureRender id="Features" logThreshold={16}>
      <div ref={containerRef} className="relative py-6 md:py-10">
        {CosmicEffects}

        {/* Features section container */}
        <motion.div
          className="relative"
          initial={{ opacity: 0 }}
          animate={isVisible ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Features section header */}
          <SectionHeader 
            title="What is DegenDuel?"
            subtitle="Experience crypto trading like never before - competitive, fun, and rewarding."
          />

          {/* Features List Component - Remove padding constraints */}
          <div className="relative z-10 max-w-7xl mx-auto">
            <FeatureList />
          </div>
        </motion.div>
      </div>
    </MeasureRender>
  );
};

// Export default for dynamic import
export default Features;
