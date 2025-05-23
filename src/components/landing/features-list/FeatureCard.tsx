// src/components/landing/features-list/FeatureCard.tsx

/**
 * Feature Card component
 * 
 * @description Shows platform features with dramatic visuals, expandable details, and animated effects
 * 
 * @author BranchManager69
 * @version 2.1.1
 * @created 2025-01-01
 * @updated 2025-05-23
 */

import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";
import { MeasureRender } from "../../../utils/performance";

// Feature flags
import { FEATURE_FLAGS } from "../../../config/config";

// Feature card props
interface FeatureCardProps {
  title: string;
  description: string;
  extendedDescription?: string;
  icon: React.JSX.Element; // Still accept icon for backward compatibility
  imagePath?: string; // NEW: Path to feature illustration image 
  animation?: React.ReactNode;
  gradient?: string; // Compatibility with Features.tsx
  isUpcoming?: boolean;
}

// Default feature illustrations if none provided
const DEGENDUEL_FEATURES_IMAGES = {
  "Trading Contests": "/assets/media/features/trading-contests.png",                // ✅
  "Degen Dividends": "/assets/media/features/degen-dividends.png",                  // Placeholder for Degen Dividends
  "Real-Time On-Chain Data": "/assets/media/features/real-time-on-chain-data.png",  // Placeholder for Real-Time On-Chain Data
  "Instant SOL Settlement": "/assets/media/features/instant-sol-settlement.png",    // Placeholder for Instant SOL Settlement
  "1v1 Duels": "/assets/media/features/1v1-duels.png",                              // Placeholder for 1v1 Duels
  "Advanced Analytics": "/assets/media/features/advanced-analytics.png",            // ✅
  "Bring Your Own Agent": "/assets/media/features/bring-your-own-agent.png",        // Placeholder for Bring Your Own Agent
  "Degen Rep": "/assets/media/features/reputation-system.png",                      // ✅
  // ...
};

export const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  description,
  extendedDescription = "",
  icon, // Kept for backward compatibility
  imagePath,
  animation,
  isUpcoming = false,
}) => {
  // State to track if card is expanded
  const [isExpanded, setIsExpanded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  // If no image is provided, try to use a default one
  const featureImage = imagePath || (title in DEGENDUEL_FEATURES_IMAGES ? DEGENDUEL_FEATURES_IMAGES[title as keyof typeof DEGENDUEL_FEATURES_IMAGES] : null);

  // Prevent scroll events when modal is open
  const preventScroll = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Cleanup scroll lock on component unmount
  useEffect(() => {
    return () => {
      // Ensure scroll lock is removed if component unmounts while modal is open
      if (isExpanded) {
        document.body.style.overflow = 'unset';
        document.removeEventListener('wheel', preventScroll);
        document.removeEventListener('touchmove', preventScroll);
      }
    };
  }, [isExpanded, preventScroll]);
  
  // Determine the color scheme based on upcoming status
  const colorScheme = isUpcoming 
    ? {
        primary: "from-blue-500 via-cyan-400 to-indigo-600",
        secondary: "blue",
        accent: "blue-500",
        text: "blue-50",
        subtext: "white",
        border: "blue-500/50",
        glow: "0 0 40px rgba(59, 130, 246, 0.3)",
        tag: "COMING SOON"
      } 
    : {
        primary: "from-brand-500 via-fuchsia-400 to-purple-600",
        secondary: "brand",
        accent: "brand-500",
        text: "white",
        subtext: "white",
        border: "purple-500/50",
        glow: "0 0 40px rgba(168, 85, 247, 0.3)",
        tag: ""
      };
  
  // Toggle expanded state with comprehensive scroll lock
  const toggleExpand = () => {
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);
    
    // Comprehensive scroll lock to prevent scroll bleed-through
    if (newExpandedState) {
      // Lock body scroll and prevent wheel events
      document.body.style.overflow = 'hidden';
      document.addEventListener('wheel', preventScroll, { passive: false });
      document.addEventListener('touchmove', preventScroll, { passive: false });
    } else {
      // Restore body scroll and remove event listeners
      document.body.style.overflow = 'unset';
      document.removeEventListener('wheel', preventScroll);
      document.removeEventListener('touchmove', preventScroll);
    }
    
    // Scroll expanded card into view if needed (only when closing)
    if (!newExpandedState && cardRef.current) {
      setTimeout(() => {
        cardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);
    }
  };

  // Feature card JSX
  return (
    <MeasureRender id="FeatureCard" logThreshold={5}>
      {/* Feature card container */}
      <div ref={cardRef} className="relative h-full">
        
        {/* Feature card content */}
        <motion.div 
          className={`relative z-10 h-full ${isExpanded ? 'pointer-events-none' : 'cursor-pointer group'}`}
          onClick={() => !isExpanded && toggleExpand()}
          whileHover={!isExpanded ? { scale: 1.03, y: -5 } : {}}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          layout
        >
          
          {/* Dramatic Feature Card - Complete redesign with visual impact */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-900/90 to-black border border-gray-800/40 h-full group-hover:border-purple-500/40 transition-all duration-300 shadow-lg group-hover:shadow-xl flex flex-col">
            
            {/* Dynamic Feature Illustration/Banner (full width) */}
            <div className="relative h-40 w-full overflow-hidden shrink-0">
              
              {/* Gradient overlay for consistent branding & readability */}
              <div className={`absolute inset-0 bg-gradient-to-br ${colorScheme.primary} opacity-80 mix-blend-overlay z-10`}></div>
              
              {/* Animated energy effect */}
              <motion.div 
                className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent z-20`}
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 4, repeat: Infinity, repeatDelay: 3 }}
              />
              
              {/* Feature image with fallback */}
              {featureImage ? (

                // Feature image container
                <div className="absolute inset-0 z-0">
                  
                  {/* Image loading state */}
                  {!imageLoaded && !imageError && (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 animate-pulse"></div>
                  )}

                  {/* Feature image */}
                  <img 
                    src={featureImage}
                    alt={title}
                    className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
                    onLoad={() => setImageLoaded(true)}
                    onError={() => setImageError(true)}
                  />

                </div>
              ) : (
                // Stylized abstract pattern as fallback
                <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 z-0">
                  
                  {/* Stylized abstract pattern */}
                  <div className="absolute inset-0 opacity-20 bg-[linear-gradient(45deg,transparent_25%,rgba(68,0,255,0.1)_50%,transparent_75%)] bg-[length:250%_250%] animate-shine"></div>
                  
                  {/* Centered icon as fallback if no image */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-30">
                    
                    {/* Centered icon */}
                    <div className="text-white transform scale-[2]">
                      {icon}
                    </div>

                  </div>

                </div>
              )}
              
              {/* Top highlight line for added visual flair */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/60 to-transparent z-20"></div>
              
              {/* Bottom content reveal gradient */}
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-900 via-gray-900/95 to-transparent z-20"></div>
              
              {/* "COMING SOON" overlay for upcoming features */}
              {isUpcoming && (
                
                // "COMING SOON" overlay container
                <div className="absolute top-4 right-4 z-30">
                  {/* "COMING SOON" overlay */}
                  <motion.div 
                    className="px-3 py-1.5 rounded-full bg-blue-600/90 text-white text-xs font-bold uppercase tracking-wide backdrop-blur-sm border border-blue-500/50"
                    animate={{
                      boxShadow: [
                        '0 0 0px rgba(59, 130, 246, 0)',
                        '0 0 15px rgba(59, 130, 246, 0.6)',
                        '0 0 0px rgba(59, 130, 246, 0)'
                      ],
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {/* "COMING SOON" text */}
                    {colorScheme.tag}
                  </motion.div>
                </div>

              )}
            </div>
            
            {/* Content section with bold typography */}
            <div className="relative p-5 z-10 flex-grow">
              
              {/* Feature title (prominent) */}
              <h3 className={`text-2xl font-bold font-russo-one mb-3 text-white tracking-wider relative`}>
                {title}
                
                {/* Animated underline effect */}
                <motion.div 
                  className={`absolute -bottom-1 left-0 h-[2px] w-0 group-hover:w-full bg-gradient-to-r ${colorScheme.primary}`}
                  initial={{ width: 0 }}
                  whileHover={{ width: '100%' }}
                  transition={{ duration: 0.3 }}
                />

              </h3>
              
              {/* Feature description (good contrast & readability) */}
              <p className="text-gray-300 leading-relaxed font-sans text-sm min-h-[4.5em]">
                {description}
              </p>

            </div>
            
            {/* Modern footer with clear visual call to action */}
            <div className="p-4 pb-5 flex items-center justify-between border-t border-gray-800/30 bg-gray-900/50 relative z-10 shrink-0">
              
              {/* Feature category indicator */}
              <div className={`flex items-center text-sm text-${isUpcoming ? 'blue' : 'purple'}-300 font-sans`}>
                
                {/* Feature category indicator */}
                <motion.span
                  className="inline-block h-2 w-2 rounded-full bg-current mr-2"
                  animate={{ 
                    scale: [1, 1.3, 1],
                    opacity: [0.7, 1, 0.7] 
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                
                {/* Feature category indicator */}
                <span className="opacity-70 font-semibold">
                  {isUpcoming ? 'Future Feature' : 'Core Feature'}
                </span>

              </div>
              
              {/* Explicit CTA with engaging animation */}
              <motion.button
                className={`px-3 py-1.5 rounded-md border border-${colorScheme.accent}/40 bg-gradient-to-r ${colorScheme.primary} bg-opacity-10 text-white text-sm font-medium font-sans flex items-center space-x-1`}
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: colorScheme.glow,
                }}
                animate={{
                  y: [0, -2, 0]
                }}
                transition={{ 
                  y: { duration: 2, repeat: Infinity },
                  scale: { type: "spring", stiffness: 400 }
                }}
              >
                {/* CTA text ("More" or "When?") */}
                <span>
                  {isUpcoming ? 'When?' : 'More'}
                </span>
                
                {/* CTA icon (right arrow) */}
                <motion.span
                  animate={{ x: [0, 3, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="inline-block ml-1"
                >
                  →
                </motion.span>

              </motion.button>
              
            </div>
          </div>
        </motion.div>
        
        {/* Expandable card (overlay when expanded) */}
        <AnimatePresence>
          {/* Card expanded view */}
          {isExpanded && (

            // Card expanded view container - FULL VIEWPORT MODAL
            <motion.div
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleExpand}
            >
              {/* Modal content - uses full viewport efficiently */}
              <motion.div 
                className="h-full w-full flex flex-col bg-gray-900/95 border-0 md:m-8 md:h-[calc(100vh-4rem)] md:w-[calc(100vw-4rem)] md:rounded-xl md:border md:border-gray-800"
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close button */}
                <button 
                  className="absolute top-4 right-4 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-gray-900/80 text-gray-400 hover:text-white hover:bg-gray-700/80 transition-colors"
                  onClick={toggleExpand}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
                
                {/* Header section with feature image and title - FIXED HEIGHT */}
                <div className="relative h-48 md:h-64 w-full overflow-hidden shrink-0 md:rounded-t-xl">
                  {/* Feature image background */}
                  {featureImage && (
                    <>
                      <img 
                        src={featureImage}
                        alt={title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-900/60 via-gray-900/40 to-gray-900/80"></div>
                    </>
                  )}
                  
                  {/* Title overlay */}
                  <div className="absolute inset-0 flex items-end p-6 md:p-8">
                    <div className="flex items-center gap-4 w-full">
                      <motion.div 
                        className={`flex items-center justify-center p-3 md:p-4 rounded-lg bg-${colorScheme.secondary}-900/60 text-${colorScheme.accent} backdrop-blur-sm`}
                        animate={{
                          boxShadow: [
                            `0 0 0 rgba(var(--${colorScheme.secondary}-rgb), 0)`,
                            `0 0 20px rgba(var(--${colorScheme.secondary}-rgb), 0.6)`,
                            `0 0 0 rgba(var(--${colorScheme.secondary}-rgb), 0)`
                          ],
                        }}
                        transition={{ duration: 3, repeat: Infinity }}
                      >
                        {icon}
                      </motion.div>
                      <div className="flex-1">
                        <h2 className={`text-2xl md:text-4xl font-russo-one bg-gradient-to-r ${colorScheme.primary} bg-clip-text text-transparent mb-1 tracking-wider`}>
                          {title}
                        </h2>
                        {isUpcoming && (
                          <span className="px-2 py-1 bg-blue-600/40 text-blue-200 text-xs font-bold uppercase tracking-wide rounded-sm font-sans backdrop-blur-sm">
                            Coming Soon
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Main content area - FLEXIBLE HEIGHT, NO SCROLL */}
                <div className="flex-1 grid md:grid-cols-2 grid-cols-1 gap-6 p-6 md:p-8 min-h-0">
                  {/* Left column: Content */}
                  <div className="space-y-6 overflow-y-auto md:overflow-visible">
                    <div>
                      <h3 className="text-lg font-bold text-white/90 mb-3 font-russo-one tracking-wider">OVERVIEW</h3>
                      <p className="text-gray-200 leading-relaxed font-sans text-sm">
                        {description}
                      </p>
                    </div>
                    
                    {extendedDescription && (
                      <div>
                        <h3 className="text-lg font-bold text-white/90 mb-3 font-russo-one tracking-wider">DETAILS</h3>
                        <div className="text-gray-200 leading-relaxed space-y-3 font-sans text-sm">
                          {extendedDescription.split('\n').map((paragraph, idx) => (
                            <p key={idx}>
                              {paragraph}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <h3 className="text-lg font-bold text-white/90 mb-3 font-russo-one tracking-wider">KEY BENEFITS</h3>
                      <ul className="space-y-2 font-sans text-sm">
                        {description.split('. ').filter(Boolean).slice(0, 3).map((point, idx) => (
                          <li key={idx} className="flex gap-2 items-start">
                            <span className={`inline-block h-4 w-4 flex-shrink-0 rounded-full bg-gradient-to-br ${colorScheme.primary} mt-1`}></span>
                            <span className="text-gray-300">
                              {point}.
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  {/* Right column: Animation/Visual */}
                  <div className="bg-gray-900/50 rounded-lg border border-gray-800 overflow-hidden flex items-center justify-center">
                    {animation && FEATURE_FLAGS.SHOW_FEATURE_ANIMATIONS ? (
                      <div className="w-full h-full">
                        {animation}
                      </div>
                    ) : (
                      <div className="text-center p-8 h-full flex flex-col items-center justify-center">
                        {featureImage ? (
                          <motion.div
                            className="relative w-full max-w-sm"
                            animate={{ scale: [1, 1.03, 1], y: [0, -5, 0] }}
                            transition={{ duration: 4, repeat: Infinity, repeatType: "reverse" }}
                          >
                            <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/30 to-blue-500/30 rounded-lg blur-lg"></div>
                            <img 
                              src={featureImage} 
                              alt={title} 
                              className="relative rounded-lg w-full h-auto object-cover"
                            />
                          </motion.div>
                        ) : (
                          <motion.div
                            className="relative inline-block w-32 h-32"
                            animate={{ 
                              rotateY: 360, 
                              boxShadow: [
                                `0 0 20px rgba(var(--${colorScheme.secondary}-rgb), 0.2)`,
                                `0 0 40px rgba(var(--${colorScheme.secondary}-rgb), 0.6)`,
                                `0 0 20px rgba(var(--${colorScheme.secondary}-rgb), 0.2)`
                              ]
                            }}
                            transition={{ 
                              rotateY: { duration: 8, repeat: Infinity, ease: "linear" },
                              boxShadow: { duration: 2, repeat: Infinity }
                            }}
                          >
                            <div className={`absolute inset-0 rounded-lg bg-gradient-to-br ${colorScheme.primary} opacity-70`}></div>
                            <div className="absolute inset-0 flex items-center justify-center text-white transform scale-[3]">
                              {icon}
                            </div>
                          </motion.div>
                        )}
                        <p className="mt-6 text-gray-400 text-sm">
                          {animation && !FEATURE_FLAGS.SHOW_FEATURE_ANIMATIONS 
                            ? "Animations disabled" 
                            : "Interactive demo coming soon"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Footer - FIXED HEIGHT */}
                <div className="p-6 md:p-8 bg-gray-900/70 border-t border-gray-800 flex justify-between items-center shrink-0 md:rounded-b-xl">
                  <div className="text-sm text-gray-400">
                    <span className="text-gray-300 font-semibold">DegenDuel</span> • {isUpcoming ? 'Upcoming' : 'Core'} Platform Feature
                  </div>
                  <button 
                    onClick={toggleExpand}
                    className={`px-6 py-2 rounded-md bg-gradient-to-r ${colorScheme.primary} text-white text-sm font-medium hover:scale-105 transition-transform`}
                  >
                    Close
                  </button>
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
