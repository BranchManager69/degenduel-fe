// src/components/landing/features-list/animations/DuelDripAnimation.tsx

/**
 * Animation component for the DUEL Drip feature card
 * Shows character customization and token burning mechanics
 */

import React from 'react';
import { motion } from 'framer-motion';

export const DuelDripAnimation: React.FC = () => {
  // Avatar accessories that will be "purchased" in the animation
  const accessories = [
    { name: 'Hat', position: 'top', color: 'from-yellow-400 to-amber-600' },
    { name: 'Glasses', position: 'eyes', color: 'from-blue-400 to-indigo-600' },
    { name: 'Cloak', position: 'body', color: 'from-purple-500 to-brand-600' },
    { name: 'Aura', position: 'background', color: 'from-green-400 to-cyan-500' },
  ];
  
  // Variants for token animations
  const tokenVariants = {
    initial: { scale: 0, opacity: 0 },
    animate: (custom: number) => ({
      scale: [0, 1, 1, 0],
      opacity: [0, 1, 1, 0],
      x: [0, -50, -100],
      y: [0, -30, 0],
      transition: {
        duration: 2.5,
        delay: custom * 1.5,
        repeat: Infinity,
        repeatDelay: 4 * 1.5 - 1, // Wait for all accessories before repeating
      }
    }),
    burn: (custom: number) => ({
      scale: [1, 0.8, 0],
      opacity: [1, 0.8, 0],
      y: [0, -10, -20],
      filter: ['brightness(1)', 'brightness(1.5)', 'brightness(2)'],
      transition: {
        duration: 1,
        delay: custom * 1.5 + 1.2, // Start burning after token moves to character
        repeat: Infinity,
        repeatDelay: 4 * 1.5 - 0.5,
      }
    })
  };
  
  // Variants for accessory animations
  const accessoryVariants = {
    initial: { opacity: 0, scale: 0 },
    animate: (custom: number) => ({
      opacity: [0, 1],
      scale: [0, 1],
      transition: {
        duration: 0.5,
        delay: custom * 1.5 + 1, // Start appearing after token reaches character
        repeat: Infinity,
        repeatDelay: 4 * 1.5,
      }
    })
  };
  
  // Background grid animation properties
  const gridAnimation = {
    backgroundPosition: ['0% 0%', '100% 100%'],
    transition: {
      duration: 20,
      repeat: Infinity,
      repeatType: 'reverse' as const,
      ease: 'linear' as const
    }
  };
  
  // Marketplace panel animations
  const marketplaceInitial = { opacity: 0.7 };
  const marketplaceAnimate = {
    opacity: [0.7, 1, 0.7],
    boxShadow: [
      '0 0 0px rgba(79, 70, 229, 0.2)',
      '0 0 15px rgba(79, 70, 229, 0.6)',
      '0 0 0px rgba(79, 70, 229, 0.2)'
    ],
    transition: {
      duration: 4,
      repeat: Infinity,
      repeatType: 'reverse' as const
    }
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Background grid */}
      <motion.div 
        className="absolute inset-0 bg-[linear-gradient(0deg,transparent_24px,#3f3f4620_25px,#3f3f4620_26px,transparent_27px),linear-gradient(90deg,transparent_24px,#3f3f4620_25px,#3f3f4620_26px,transparent_27px)] bg-[length:40px_40px]"
        animate={gridAnimation}
      />
      
      {/* Main container */}
      <div className="relative w-full h-full flex">
        {/* Left side: DUEL tokens and burning mechanism */}
        <div className="absolute left-4 bottom-0 w-16 flex flex-col items-center pb-4">
          {/* Tokens container */}
          <div className="relative mb-4 flex flex-col items-center">
            {/* DUEL tokens that will be "spent" */}
            {accessories.map((_, i) => (
              <React.Fragment key={`token-${i}`}>
                {/* Token that moves to character */}
                <motion.div
                  className="absolute w-12 h-12 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 border border-brand-300 flex items-center justify-center shadow-lg"
                  style={{ top: i * -4 }} // Stack tokens with slight offset
                  custom={i}
                  variants={tokenVariants}
                  initial="initial"
                  animate="animate"
                >
                  <span className="text-white font-mono text-xs font-semibold">DUEL</span>
                </motion.div>
                
                {/* Token half that burns (disappears with glow effect) */}
                <motion.div
                  className="absolute w-6 h-12 rounded-l-full bg-gradient-to-br from-brand-400 to-brand-600 border-l border-y border-brand-300 flex items-center justify-start pl-1 shadow-lg overflow-hidden"
                  style={{ top: i * -4 }} // Stack tokens with slight offset
                  custom={i}
                  variants={tokenVariants}
                  initial="initial"
                  animate="burn"
                >
                  <span className="text-white font-mono text-[8px] font-semibold">D</span>
                </motion.div>
              </React.Fragment>
            ))}
            
            {/* Burn indicator */}
            <div className="absolute bottom-[-45px] left-[5px] text-xs font-mono text-yellow-500 flex items-center">
              <motion.div 
                className="w-3 h-3 mr-1"
                animate={{
                  opacity: [0.6, 1, 0.6],
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L14 6H10L12 2Z" fill="currentColor" />
                  <path d="M9 8H15L12 20L9 8Z" fill="currentColor" />
                </svg>
              </motion.div>
              <span>50% BURNED</span>
            </div>
          </div>
        </div>
        
        {/* Center: Character with customization */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          {/* Character base with customization slots */}
          <div className="relative">
            {/* Aura (background accessory) */}
            <motion.div
              className={`absolute -inset-5 rounded-full bg-gradient-to-r ${accessories[3].color} opacity-30 blur-md z-0`}
              variants={accessoryVariants}
              custom={3}
              initial="initial"
              animate="animate"
            />
            
            {/* Character base */}
            <div className="relative z-10 flex flex-col items-center">
              {/* Hat accessory */}
              <motion.div
                className={`absolute -top-10 left-1/2 transform -translate-x-1/2 w-14 h-5 rounded-t-full bg-gradient-to-r ${accessories[0].color} z-30`}
                variants={accessoryVariants}
                custom={0}
                initial="initial"
                animate="animate"
              />
              
              {/* Head */}
              <div className="w-10 h-10 rounded-full bg-gray-300 z-20 relative">
                {/* Eyes */}
                <div className="absolute top-3 left-1 w-2 h-2 rounded-full bg-gray-700"></div>
                <div className="absolute top-3 right-1 w-2 h-2 rounded-full bg-gray-700"></div>
                
                {/* Glasses accessory */}
                <motion.div
                  className={`absolute top-3 left-0 right-0 h-2 bg-gradient-to-r ${accessories[1].color} z-30`}
                  variants={accessoryVariants}
                  custom={1}
                  initial="initial"
                  animate="animate"
                >
                  <div className="absolute left-0 top-0 w-4 h-2 border-2 border-current rounded-full"></div>
                  <div className="absolute right-0 top-0 w-4 h-2 border-2 border-current rounded-full"></div>
                </motion.div>
                
                {/* Mouth */}
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-1 rounded-full bg-gray-700"></div>
              </div>
              
              {/* Body */}
              <div className="w-[2px] h-15 bg-gray-300 mt-1 z-10"></div>
              
              {/* Arms */}
              <div className="w-10 h-[2px] bg-gray-300 -mt-10 z-10"></div>
              
              {/* Cloak accessory */}
              <motion.div
                className={`absolute top-8 -z-1 w-14 h-14 rounded-full bg-gradient-to-b ${accessories[2].color} opacity-80 clip-path-[polygon(0%_0%,100%_0%,100%_50%,0%_50%)]`}
                variants={accessoryVariants}
                custom={2}
                initial="initial"
                animate="animate"
              />
              
              {/* Legs */}
              <div className="relative mt-1 h-8 w-8 z-10">
                <div className="absolute left-1 w-[2px] h-8 bg-gray-300 origin-top rotate-30"></div>
                <div className="absolute right-1 w-[2px] h-8 bg-gray-300 origin-top -rotate-30"></div>
              </div>
            </div>
            
            {/* "DEGEN LVL UP" indicator */}
            <motion.div
              className="absolute -top-14 left-1/2 transform -translate-x-1/2 text-xs font-mono font-bold text-green-400"
              animate={{
                opacity: [0, 1, 0],
                y: [0, -10, -20],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 4
              }}
            >
              DEGEN LVL UP!
            </motion.div>
          </div>
        </div>
        
        {/* Right side: NFT Marketplace preview */}
        <motion.div
          className="absolute right-3 top-3 bottom-3 w-20 bg-dark-200/70 rounded-lg border border-indigo-500/40 p-2 flex flex-col items-center"
          initial={marketplaceInitial}
          animate={marketplaceAnimate}
        >
          <div className="text-[8px] font-mono text-center text-indigo-300 mb-2">MARKETPLACE</div>
          
          {/* NFT items that can be traded */}
          <div className="flex flex-col gap-2 items-center">
            {accessories.map((acc, i) => (
              <div 
                key={`nft-${i}`}
                className={`w-14 h-12 rounded border border-gray-700 bg-gradient-to-br ${acc.color} p-1 relative`}
              >
                <div className="absolute top-0.5 left-0.5 text-[6px] font-mono text-white/80">
                  NFT
                </div>
                <div className="absolute bottom-0.5 right-0.5 text-[6px] font-mono text-white/80 flex items-center">
                  <span className="text-yellow-400 mr-px">♦</span>
                  <span>0.5</span>
                </div>
                <div className="flex justify-center items-center h-full text-[6px] font-mono text-white text-center">
                  {acc.name}
                </div>
              </div>
            ))}
          </div>
          
          <div className="absolute bottom-1 text-[6px] font-mono text-blue-300 text-center">
            COMING SOON
          </div>
        </motion.div>
      </div>
    </div>
  );
};