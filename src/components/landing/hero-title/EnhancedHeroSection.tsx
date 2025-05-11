import { motion } from 'framer-motion';
import React from 'react';
import IntroLogo from '../../logo/IntroLogo';

/**
 * EnhancedHeroSection - A visually enhanced hero section with animations
 * 
 * Features:
 * - Uses existing IntroLogo component unchanged
 * - Adds subtle background animations and effects
 * - Includes refined tagline with value proposition
 */
export const EnhancedHeroSection: React.FC = () => {
  // Generate random particles for a more organic feel
  const particles = Array(8).fill(null).map((_, i) => ({
    id: i,
    size: Math.random() * 3 + 1,
    color: i % 2 === 0 ? 'rgba(153, 51, 255, 0.4)' : 'rgba(0, 225, 255, 0.4)',
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    shadowColor: i % 2 === 0 ? 'rgba(153, 51, 255, 0.4)' : 'rgba(0, 225, 255, 0.4)',
    duration: Math.random() * 5 + 5,
    delay: Math.random() * 5
  }));

  return (
    <section className="relative min-h-[70vh] flex flex-col items-center justify-center overflow-hidden">
      {/* Visual effects layer - positioned behind content */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Subtle grid overlay */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: 'linear-gradient(to right, rgba(153, 51, 255, 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(153, 51, 255, 0.03) 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}
        />
        
        {/* Deep ambient glow spots */}
        <motion.div 
          className="absolute top-1/4 -left-1/4 w-full h-full rounded-full blur-3xl"
          style={{ 
            background: 'radial-gradient(circle, rgba(153, 51, 255, 0.1) 0%, rgba(0, 0, 0, 0) 60%)'
          }}
          animate={{ 
            opacity: [0.5, 0.7, 0.5],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 15, 
            repeat: Infinity, 
            repeatType: "mirror" 
          }}
        />
        
        <motion.div 
          className="absolute bottom-1/3 -right-1/4 w-full h-full rounded-full blur-3xl"
          style={{ 
            background: 'radial-gradient(circle, rgba(0, 225, 255, 0.1) 0%, rgba(0, 0, 0, 0) 60%)'
          }}
          animate={{ 
            opacity: [0.5, 0.7, 0.5],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 18, 
            repeat: Infinity, 
            repeatType: "mirror",
            delay: 3
          }}
        />
        
        {/* Elegant data flow lines */}
        <div className="absolute inset-0">
          <motion.div
            className="h-[0.5px] w-[30%] bg-gradient-to-r from-transparent via-brand-400/15 to-transparent absolute transform -rotate-[30deg]"
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            style={{ top: '35%', left: '0%' }}
          />
          <motion.div
            className="h-[0.5px] w-[40%] bg-gradient-to-r from-transparent via-cyber-400/10 to-transparent absolute transform rotate-[15deg]"
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 18, repeat: Infinity, ease: "linear", delay: 3 }}
            style={{ top: '60%', left: '0%' }}
          />
        </div>
        
        {/* High-quality particle effect */}
        <div className="absolute inset-0">
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute rounded-full"
              style={{
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                backgroundColor: particle.color,
                top: particle.top,
                left: particle.left,
                boxShadow: `0 0 4px ${particle.shadowColor}`
              }}
              animate={{
                opacity: [0.4, 0.8, 0.4],
                scale: [1, 1.2, 1],
                y: [0, -30, 0]
              }}
              transition={{
                duration: particle.duration,
                repeat: Infinity,
                ease: "easeInOut",
                delay: particle.delay
              }}
            />
          ))}
        </div>
      </div>

      {/* Content layer - using existing components without modification */}
      <div className="relative z-10 text-center px-4 max-w-3xl mx-auto space-y-8">
        {/* Use the existing IntroLogo as-is */}
        <div className="mb-8">
          <IntroLogo />
        </div>
        
        {/* Hero tagline */}
        <div className="space-y-4">
          <h2 className="text-2xl sm:text-3xl font-medium text-gray-100 mt-4">
            High-Stakes Trading Competitions on Solana
          </h2>
          
          <p className="text-base sm:text-lg text-gray-300/90 font-medium mt-2">
            Win big. Trade like a degen. No liquidations.
          </p>
        </div>
      </div>
    </section>
  );
};

export default EnhancedHeroSection;