// src/components/landing/features-list/animations/ReflectionSystemAnimation.tsx

/**
 * Animation component for the Reflections System feature card
 * Shows DegenDuel server distributing rewards to token holders
 */

import React from 'react';
import { motion } from 'framer-motion';

export const ReflectionSystemAnimation: React.FC = () => {
  // Number of token holders (stick figures) to show in the animation
  const holderCount = 8;
  
  // Animation variants for server pulse
  const serverVariants = {
    pulse: {
      scale: [1, 1.1, 1],
      boxShadow: [
        '0 0 0 rgba(157, 78, 221, 0)',
        '0 0 20px rgba(157, 78, 221, 0.5)',
        '0 0 0 rgba(157, 78, 221, 0)'
      ],
    }
  };
  
  // Animation variants for token distribution
  const tokenVariants = {
    initial: { scale: 0, y: 0, x: 0, opacity: 0 },
    animate: (i: number) => ({
      scale: [0, 1, 0],
      y: [0, 60 + (i % 2) * 15], // Vary vertical distance based on position
      x: 100 - (i * 25), // Distribute horizontally
      opacity: [0, 1, 0],
      transition: {
        duration: 2,
        delay: i * 0.2, // Stagger the animations
        repeat: Infinity,
        repeatDelay: 3,
      }
    })
  };
  
  // Animation variants for stick figures (holders)
  const holderVariants = {
    initial: { opacity: 0.7 },
    animate: (i: number) => ({
      opacity: [0.7, 1, 0.7],
      y: [0, -3, 0],
      transition: {
        duration: 0.5,
        delay: 1.5 + (i * 0.2), // Time to animate when receiving token
        repeat: Infinity,
        repeatDelay: 4.5 - (i * 0.2),
      }
    })
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden p-2">
      {/* Background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(0deg,transparent_24px,#3f3f461a_25px,#3f3f461a_26px,transparent_27px),linear-gradient(90deg,transparent_24px,#3f3f461a_25px,#3f3f461a_26px,transparent_27px)] bg-[length:40px_40px]"></div>
      
      {/* DegenDuel Server (token source) */}
      <motion.div 
        className="absolute top-10 left-1/2 transform -translate-x-1/2 z-10"
        variants={serverVariants}
        animate="pulse"
        transition={{ 
          duration: 3, 
          repeat: Infinity,
          repeatType: "loop" 
        }}
      >
        {/* Server icon */}
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-brand-500 to-purple-700 shadow-lg flex items-center justify-center">
            <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <path d="M3 9H21" stroke="currentColor" strokeWidth="1.5" />
              <path d="M7 16H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M7 13H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="6" cy="6.5" r="1" fill="currentColor" />
              <circle cx="9" cy="6.5" r="1" fill="currentColor" />
            </svg>
          </div>
          <div className="mt-1 text-xs font-mono text-center text-brand-300">
            DegenDuel
          </div>
        </div>
        
        {/* Distribution rays/lines */}
        <div className="absolute top-10 left-1/2 transform -translate-x-1/2">
          {/* Generate tokens that animate outward */}
          {Array.from({ length: holderCount }).map((_, i) => (
            <motion.div
              key={`token-${i}`}
              className="absolute w-6 h-6 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 flex items-center justify-center shadow-sm"
              style={{ left: '-10px', top: '-2px' }}
              custom={i} 
              variants={tokenVariants}
              initial="initial"
              animate="animate"
            >
              <span className="text-yellow-900 text-[9px] font-bold">SOL</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
      
      {/* Token holders (stick figures) with token markers */}
      <div className="absolute bottom-8 w-full px-8 flex justify-around">
        {Array.from({ length: holderCount }).map((_, i) => (
          <motion.div 
            key={`holder-${i}`}
            className="flex flex-col items-center"
            variants={holderVariants}
            initial="initial"
            animate="animate"
            custom={i}
          >
            {/* Stick figure */}
            <div className="relative">
              {/* Head */}
              <div className="w-4 h-4 rounded-full bg-gray-200"></div>
              {/* Body */}
              <div className="w-[2px] h-6 bg-gray-200 mx-auto"></div>
              {/* Arms */}
              <div className="absolute top-4 w-6 h-[2px] bg-gray-200"></div>
              {/* Legs */}
              <div className="absolute bottom-0 left-[7px] w-[2px] h-4 bg-gray-200 origin-top rotate-45"></div>
              <div className="absolute bottom-0 right-[7px] w-[2px] h-4 bg-gray-200 origin-top -rotate-45"></div>
            </div>
            {/* DEGEN token */}
            <div className="mt-1 text-[7px] font-mono text-center text-brand-300">
              DEGEN
            </div>
          </motion.div>
        ))}
      </div>
      
      {/* SOL/USD indicator */}
      <div className="absolute right-3 top-3 py-1 px-2 bg-black/30 rounded text-xs font-mono border border-gray-800">
        <div className="flex items-center">
          <div className="w-2 h-2 rounded-full bg-green-400 mr-1"></div>
          <span className="text-gray-400">SOL/USD:</span>
          <motion.span 
            className="ml-1 text-green-400"
            animate={{ 
              opacity: [1, 0.7, 1],
              transition: { duration: 2, repeat: Infinity }
            }}
          >
            $193.75
          </motion.span>
        </div>
      </div>
      
      {/* Daily reflections indicator */}
      <div className="absolute left-3 top-3 py-1 px-2 bg-black/30 rounded text-xs font-mono border border-gray-800">
        <div className="flex items-center space-x-1">
          <span className="text-gray-400">DAILY:</span>
          <motion.span 
            className="text-brand-400"
            animate={{ 
              opacity: [1, 0.7, 1],
              transition: { duration: 2, repeat: Infinity, delay: 1 }
            }}
          >
            +0.01 SOL
          </motion.span>
        </div>
      </div>
    </div>
  );
};