// src/components/landing/features-list/FeatureCard.tsx

/**
 * Advanced expandable feature card component with rich animations
 * Shows compact info by default, expands to reveal detailed content and animations
 */

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

import { MeasureRender } from "../../../utils/performance";

interface FeatureCardProps {
  title: string;
  description: string;
  extendedDescription?: string;
  icon: JSX.Element;
  animation?: React.ReactNode;
  gradient?: string; // Compatibility with Features.tsx
  isUpcoming?: boolean;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  description,
  extendedDescription = "",
  icon,
  animation,
  isUpcoming = false,
}) => {
  // State to track if card is expanded
  const [isExpanded, setIsExpanded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Determine the color scheme based on upcoming status
  const colorScheme = isUpcoming 
    ? {
        primary: "from-blue-400 to-indigo-600",
        secondary: "blue",
        accent: "blue-500",
        text: "blue-50",
        subtext: "blue-200/90",
        border: "blue-500/30",
        tag: "SOON"
      } 
    : {
        primary: "from-brand-400 to-purple-600",
        secondary: "brand",
        accent: "brand-500",
        text: "purple-50",
        subtext: "purple-200/90",
        border: "purple-500/30",
        tag: ""
      };
  
  // Toggle expanded state
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    
    // Scroll expanded card into view if needed
    if (!isExpanded && cardRef.current) {
      setTimeout(() => {
        cardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    }
  };

  return (
    <MeasureRender id="FeatureCard" logThreshold={5}>
      <div ref={cardRef} className="relative">
        <motion.div 
          className={`relative z-10 ${isExpanded ? 'pointer-events-none' : 'cursor-pointer'}`}
          onClick={() => !isExpanded && toggleExpand()}
          whileHover={!isExpanded ? { scale: 1.02 } : {}}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          layout
        >
          {/* Compact card view - always visible */}
          <div className="relative clip-edges overflow-hidden rounded-lg backdrop-blur-md bg-dark-100/40 border border-gray-800/50">
            {/* Gradient border */}
            <div 
              className={`absolute inset-0 rounded-lg bg-gradient-to-br ${colorScheme.primary} opacity-20 p-px`} 
            />
            
            {/* Card content with animated particle background */}
            <div className="relative z-10 flex flex-col h-full">
              {/* Dynamic animated background */}
              <div className="absolute inset-0 overflow-hidden">
                {/* Animated gradient overlay */}
                <motion.div
                  className={`absolute inset-0 opacity-10 bg-gradient-to-br ${colorScheme.primary}`}
                  animate={{
                    backgroundPosition: ['0% 0%', '100% 100%'],
                  }}
                  transition={{ duration: 15, repeat: Infinity, repeatType: 'reverse' }}
                />
                
                {/* Animated particles */}
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={`particle-${i}`}
                    className={`absolute w-1 h-1 rounded-full bg-${colorScheme.accent}`}
                    style={{
                      left: `${15 + i * 20}%`,
                      top: `${10 + i * 15}%`,
                    }}
                    animate={{
                      opacity: [0.1, 0.5, 0.1],
                      scale: [1, 1.5, 1],
                    }}
                    transition={{
                      duration: 3 + i,
                      repeat: Infinity,
                      delay: i * 0.5,
                    }}
                  />
                ))}
                
                {/* Horizontal scan line */}
                <motion.div
                  className={`absolute h-[1px] w-full bg-${colorScheme.accent}/20 blur-[1px]`}
                  style={{ top: '30%' }}
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                />
              </div>
              
              {/* Header with icon */}
              <div className="flex items-center justify-between p-5 border-b border-gray-800/50 relative z-10">
                {/* Icon container with enhanced glow effect */}
                <motion.div 
                  className={`flex items-center justify-center p-3 rounded-lg bg-dark-300/80 text-${colorScheme.accent}`}
                  animate={{
                    boxShadow: [
                      `0 0 0 rgba(var(--${colorScheme.secondary}-rgb), 0)`,
                      `0 0 15px rgba(var(--${colorScheme.secondary}-rgb), 0.4)`,
                      `0 0 0 rgba(var(--${colorScheme.secondary}-rgb), 0)`
                    ],
                  }}
                  whileHover={{
                    scale: 1.05,
                    boxShadow: `0 0 20px rgba(var(--${colorScheme.secondary}-rgb), 0.5)`,
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  {icon}
                </motion.div>
                
                {/* Upcoming tag with animation */}
                {isUpcoming && (
                  <motion.span 
                    className="px-2 py-1 text-xs font-mono tracking-wider uppercase rounded bg-blue-500/20 text-blue-300 border border-blue-500/30"
                    animate={{
                      boxShadow: [
                        '0 0 0px rgba(59, 130, 246, 0)',
                        '0 0 8px rgba(59, 130, 246, 0.3)',
                        '0 0 0px rgba(59, 130, 246, 0)'
                      ],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {colorScheme.tag}
                  </motion.span>
                )}
              </div>
              
              {/* Main content with enhanced typography */}
              <div className="p-5 flex-1 relative z-10">
                {/* Title with animated gradient text */}
                <motion.h3 
                  className={`text-xl font-russo mb-3 bg-gradient-to-r ${colorScheme.primary} bg-clip-text text-transparent relative`}
                  animate={{ 
                    backgroundPosition: ['0% center', '100% center', '0% center'],
                  }}
                  transition={{ 
                    duration: 10, 
                    repeat: Infinity,
                    ease: 'linear'
                  }}
                >
                  {/* Subtle highlight effect */}
                  <motion.span
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 3, repeat: Infinity, repeatDelay: 5 }}
                  />
                  {title}
                </motion.h3>
                
                {/* Description with improved readability and subtle animation */}
                <motion.p 
                  className={`text-${colorScheme.subtext} text-sm leading-relaxed relative whitespace-normal break-words`}
                  initial={{ opacity: 0.8 }}
                  whileHover={{ opacity: 1 }}
                >
                  {description}
                </motion.p>
              </div>
              
              {/* Enhanced footer with terminal-inspired design */}
              <div className="p-4 mt-auto border-t border-gray-800/50 bg-dark-200/60 backdrop-blur-sm relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    {/* Terminal-style indicators */}
                    <motion.div 
                      className="w-2 h-2 rounded-full"
                      animate={{ 
                        backgroundColor: ['#9d4edd', '#a855f7', '#9d4edd'] 
                      }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0 }}
                    />
                    <motion.div 
                      className="w-2 h-2 rounded-full"
                      animate={{ 
                        backgroundColor: ['#7b2cbf', '#9d4edd', '#7b2cbf'] 
                      }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                    />
                    <motion.div 
                      className="w-2 h-2 rounded-full"
                      animate={{ 
                        backgroundColor: ['#5a189a', '#7b2cbf', '#5a189a'] 
                      }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
                    />
                    
                    {/* Animated line */}
                    <motion.div 
                      className={`w-12 h-[1px] bg-gradient-to-r from-transparent via-${colorScheme.accent} to-transparent`}
                      animate={{ 
                        opacity: [0.3, 0.7, 0.3],
                        width: ['8px', '20px', '8px']
                      }}
                      transition={{ duration: 3, repeat: Infinity }}
                    />
                  </div>
                  
                  {/* Enhanced tap for details button */}
                  <motion.div 
                    className={`px-2 py-1 rounded border border-${colorScheme.accent}/30 bg-${colorScheme.accent}/10 text-${colorScheme.accent} text-xs font-mono flex items-center space-x-1`}
                    whileHover={{ 
                      scale: 1.05,
                      boxShadow: `0 0 8px rgba(var(--${colorScheme.secondary}-rgb), 0.3)`,
                    }}
                    animate={{
                      boxShadow: [
                        `0 0 0px rgba(var(--${colorScheme.secondary}-rgb), 0)`,
                        `0 0 5px rgba(var(--${colorScheme.secondary}-rgb), 0.2)`,
                        `0 0 0px rgba(var(--${colorScheme.secondary}-rgb), 0)`
                      ],
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <span>TAP</span>
                    <motion.span
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      →
                    </motion.span>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Expandable card (overlay when expanded) */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleExpand}
            >
              {/* Card expanded view */}
              <motion.div 
                className="relative w-full max-w-4xl rounded-xl overflow-hidden bg-dark-100/90 border border-gray-800"
                initial={{ scale: 0.9, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 30 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                layout
              >
                {/* Close button */}
                <button 
                  className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-gray-900/60 text-gray-400 hover:text-white"
                  onClick={toggleExpand}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
                
                {/* Header with title */}
                <div className="p-6 border-b border-gray-800">
                  <div className="flex items-center gap-4">
                    <motion.div 
                      className={`flex items-center justify-center p-3 rounded-lg bg-${colorScheme.secondary}-900/40 text-${colorScheme.accent}`}
                      animate={{
                        boxShadow: [
                          `0 0 0 rgba(var(--${colorScheme.secondary}-rgb), 0)`,
                          `0 0 15px rgba(var(--${colorScheme.secondary}-rgb), 0.4)`,
                          `0 0 0 rgba(var(--${colorScheme.secondary}-rgb), 0)`
                        ],
                      }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      {icon}
                    </motion.div>
                    <h2 className={`text-2xl sm:text-3xl font-russo bg-gradient-to-r ${colorScheme.primary} bg-clip-text text-transparent`}>
                      {title}
                    </h2>
                  </div>
                </div>
                
                {/* Two-column layout for larger screens, stacked for mobile */}
                <div className="grid md:grid-cols-2 grid-cols-1 gap-6 p-6">
                  {/* Left column: Detailed description */}
                  <div className="space-y-4">
                    <div className="mb-4">
                      <h3 className="text-lg font-bold text-white/90 mb-2 font-mono">OVERVIEW</h3>
                      <p className={`text-${colorScheme.subtext} leading-relaxed`}>
                        {description}
                      </p>
                    </div>
                    
                    {extendedDescription && (
                      <div>
                        <h3 className="text-lg font-bold text-white/90 mb-2 font-mono">DETAILS</h3>
                        <div className={`text-${colorScheme.subtext} leading-relaxed space-y-3`}>
                          {extendedDescription.split('\n').map((paragraph, idx) => (
                            <p key={idx}>{paragraph}</p>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Terminal-inspired stats/details block */}
                    <div className="mt-6 bg-black/30 border border-gray-800 rounded-lg p-4 font-mono">
                      <div className="flex items-center mb-2">
                        <div className="w-2 h-2 rounded-full bg-red-500 mr-1"></div>
                        <div className="w-2 h-2 rounded-full bg-yellow-500 mr-1"></div>
                        <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                        <div className="text-xs text-gray-500">TERMINAL</div>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex">
                          <span className="text-green-400 mr-2">$</span>
                          <span className="text-gray-400">feature --info {title.toLowerCase().replace(/\s+/g, '-')}</span>
                        </div>
                        <div className="text-yellow-300">
                          {/* Show some feature stats/details */}
                          <div>Status: <span className="text-green-400">Active</span></div>
                          <div>Access: <span className="text-green-400">All Users</span></div>
                          <div>Priority: <span className="text-green-400">High</span></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Right column: Animation/Diagram */}
                  <div className="bg-black/30 rounded-lg border border-gray-800 overflow-hidden flex items-center justify-center min-h-[300px]">
                    {animation ? (
                      animation
                    ) : (
                      // Placeholder animation if none provided
                      <div className="text-center p-10">
                        <motion.div
                          className="inline-block"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                        >
                          <div className={`w-24 h-24 rounded-full border-4 border-${colorScheme.accent} border-t-transparent`} />
                        </motion.div>
                        <p className="mt-4 text-gray-400">Animation coming soon</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Accent line animation on hover for compact card */}
        <motion.div 
          className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${colorScheme.primary} w-0 group-hover:w-full transition-all duration-700 ${isExpanded ? 'hidden' : ''}`}
          initial={{ width: 0 }}
          whileHover={{ width: "100%" }}
        />
      </div>
    </MeasureRender>
  );
};
