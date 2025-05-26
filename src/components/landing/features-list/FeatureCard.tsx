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
      // FIXED: Always clean up scroll lock regardless of isExpanded state
      // Remove scroll lock classes
      document.body.classList.remove('scroll-lock', 'scroll-lock-compensate');
      document.documentElement.classList.remove('scroll-lock', 'scroll-lock-compensate');
      document.body.style.removeProperty('overflow');
      document.body.style.removeProperty('position');
      document.body.style.removeProperty('padding-right');
      
      // Clean up CSS custom property
      document.documentElement.style.removeProperty('--scrollbar-width');
      
      // Remove event listeners
      document.removeEventListener('wheel', preventScroll);
      document.removeEventListener('touchmove', preventScroll);
      document.removeEventListener('keydown', preventScroll);
    };
  }, []);  // Remove dependencies to ensure cleanup always happens
  
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
    
    // SIMPLIFIED: Use direct style-based scroll lock for better reliability
    if (newExpandedState) {
      // Store current scroll position
      const scrollY = window.scrollY;
      
      // Apply scroll lock using direct styles
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      
      // Add event listeners for additional scroll prevention
      document.addEventListener('wheel', preventScroll, { passive: false });
      document.addEventListener('touchmove', preventScroll, { passive: false });
      document.addEventListener('keydown', preventScroll, { passive: false });
    } else {
      // Get stored scroll position
      const scrollY = document.body.style.top;
      
      // Remove scroll lock styles
      document.body.style.removeProperty('overflow');
      document.body.style.removeProperty('position');
      document.body.style.removeProperty('top');
      document.body.style.removeProperty('width');
      
      // Restore scroll position
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
      
      // Remove event listeners
      document.removeEventListener('wheel', preventScroll);
      document.removeEventListener('touchmove', preventScroll);
      document.removeEventListener('keydown', preventScroll);
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
            
            {/* Dynamic Feature Illustration/Banner (square aspect ratio) */}
            <div className="relative aspect-square w-full overflow-hidden shrink-0">
              
              {/* Gradient overlay for consistent branding & readability */}
              <div className={`absolute inset-0 bg-gradient-to-br from-gray-900/50 via-gray-900/30 to-gray-900/70 z-10`}></div>
              
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
                    className={`w-full h-full object-contain transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
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
              <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-gray-900 via-gray-900/95 to-transparent z-20"></div>
              
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

            // Card expanded view container - BETTER MOBILE MODAL
            <motion.div
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 md:p-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleExpand}
            >
              {/* Modal content - better mobile sizing */}
              <motion.div 
                className="w-full max-w-4xl max-h-[95vh] flex flex-col bg-gray-900/95 rounded-lg border border-gray-800 overflow-hidden"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
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
                
                {/* Header section with feature image and title - RESPONSIVE HEIGHT */}
                <div className="relative h-32 md:h-48 w-full overflow-hidden shrink-0 rounded-t-lg">
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
                  
                  {/* Title overlay with better readability */}
                  <div className="absolute inset-0 flex items-end p-4 md:p-6">
                    <div className="flex items-center gap-3 w-full">
                      <motion.div 
                        className={`flex items-center justify-center p-2 md:p-3 rounded-lg bg-black/70 text-${colorScheme.accent} backdrop-blur-sm border border-${colorScheme.accent}/30`}
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
                      <div className="flex-1">
                        <h2 className="text-lg md:text-2xl font-russo-one text-white mb-1 tracking-wider bg-black/60 backdrop-blur-sm px-3 py-1 rounded-md border border-white/20">
                          {title}
                        </h2>
                        {isUpcoming && (
                          <span className="px-2 py-1 bg-blue-600/70 text-blue-100 text-xs font-bold uppercase tracking-wide rounded-sm font-sans backdrop-blur-sm border border-blue-400/30">
                            Coming Soon
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Main content area - SCROLLABLE ON MOBILE */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 p-4 md:p-6 min-h-0 overflow-y-auto">
                  {/* Left column: Content */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-bold text-white/90 mb-3 font-russo-one tracking-wider text-center">OVERVIEW</h3>
                      <p className="text-gray-300 leading-relaxed font-sans text-xs text-left">
                        {description}
                      </p>
                    </div>
                    
                    {extendedDescription && (
                      <div>
                        <h3 className="text-lg font-bold text-white/90 mb-3 font-russo-one tracking-wider text-center">DETAILS</h3>
                        <div className="text-gray-300 leading-relaxed space-y-2 font-sans text-xs text-left">
                          {extendedDescription.split('\n').map((paragraph, idx) => (
                            <p key={idx}>
                              {paragraph}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <h3 className="text-lg font-bold text-white/90 mb-3 font-russo-one tracking-wider text-center">KEY BENEFITS</h3>
                      <ul className="space-y-2 font-sans text-xs text-left">
                        {description.split('. ').filter(Boolean).slice(0, 3).map((point, idx) => (
                          <li key={idx} className="flex gap-2 items-start">
                            <span className={`inline-block h-3 w-3 flex-shrink-0 rounded-full bg-gradient-to-br ${colorScheme.primary} mt-1`}></span>
                            <span className="text-gray-300">
                              {point}.
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  {/* Right column: Animation/Visual */}
                  <div className="bg-gray-900/50 rounded-lg border border-gray-800 overflow-hidden flex items-center justify-center min-h-[200px] md:min-h-[300px]">
                    {animation && FEATURE_FLAGS.SHOW_FEATURE_ANIMATIONS ? (
                      <div className="w-full h-full p-4">
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
                        <p className="mt-4 text-gray-400 text-xs text-center">
                          {animation && !FEATURE_FLAGS.SHOW_FEATURE_ANIMATIONS 
                            ? "Animations disabled" 
                            : "Interactive demo coming soon"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Footer - COMPACT */}
                <div className="p-4 md:p-6 bg-gray-900/70 border-t border-gray-800 flex justify-between items-center shrink-0 rounded-b-lg">
                  <div className="text-xs md:text-sm text-gray-400">
                    <span className="text-gray-300 font-semibold">DegenDuel</span> • {isUpcoming ? 'Upcoming' : 'Core'} Feature
                  </div>
                  <button 
                    onClick={toggleExpand}
                    className={`px-4 py-2 rounded-md bg-gradient-to-r ${colorScheme.primary} text-white text-sm font-medium hover:scale-105 transition-transform`}
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
