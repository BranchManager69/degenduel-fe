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
import ReactDOM from "react-dom";
import { useIsVisible } from "../../../hooks/ui/useIsVisible";
import { usePortal } from "../../../hooks/ui/usePortal";
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
  className?: string;
  isShowcase?: boolean; // NEW: Theater mode styling
}

// Default feature illustrations if none provided
const DEGENDUEL_FEATURES_IMAGES = {
  "Portfolio Contests": "/assets/media/features/trading-contests.png",                // ✅
  "Degen Dividends": "/assets/media/features/degen-dividends.png",                  // Placeholder for Degen Dividends
  "Real-Time On-Chain Data": "/assets/media/features/real-time-on-chain-data.png",  // Placeholder for Real-Time On-Chain Data
  "Instant SOL Settlement": "/assets/media/features/instant-sol-settlement.png",    // Placeholder for Instant SOL Settlement
  "1v1 Duels": "/assets/media/features/1v1-duels.png",                              // Placeholder for 1v1 Duels
  "Advanced Analytics": "/assets/media/features/advanced-analytics.png",            // ✅
  "Bring Your Own Agent": "/assets/media/features/bring-your-own-agent.png",        // Placeholder for Bring Your Own Agent
  "Degen Reputation": "/assets/media/features/reputation-system.png",              // ✅
  // ...
};

// Check for reduced motion preference
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

export const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  description,
  extendedDescription = "",
  icon: Icon,
  imagePath,
  animation,
  isUpcoming = false,
  className = "",
  isShowcase = false,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [AnimationComponentLoaded, setAnimationComponentLoaded] = useState<React.ComponentType | null>(null);
  
  const cardRef = useRef<HTMLDivElement>(null);
  const isVisible = useIsVisible(cardRef as React.RefObject<Element>, { threshold: 0.1 });
  const prefersReducedMotion = useReducedMotion();
  const portalRoot = usePortal('feature-modal-root');

  // If no image is provided, try to use a default one
  const featureImage = imagePath || (title in DEGENDUEL_FEATURES_IMAGES ? DEGENDUEL_FEATURES_IMAGES[title as keyof typeof DEGENDUEL_FEATURES_IMAGES] : null);

  // Escape key to close modal + Focus management
  useEffect(() => {
    if (!isModalOpen) return;
    
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        toggleModal();
      }
    };
    
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab' && cardRef.current) {
        const focusableElements = cardRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
        
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };
    
    // Focus close button when modal opens
    setTimeout(() => cardRef.current?.querySelector('button')?.focus(), 100);
    
    document.addEventListener('keydown', handleEscapeKey);
    document.addEventListener('keydown', handleTabKey);
    
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.removeEventListener('keydown', handleTabKey);
    };
  }, [isModalOpen]);
  
  // Set animation component when modal opens
  useEffect(() => {
    if (isModalOpen && animation && !AnimationComponentLoaded) {
      if (React.isValidElement(animation)) {
        // Handle direct React elements
        setAnimationComponentLoaded(() => () => animation);
      }
    }
  }, [isModalOpen, animation, AnimationComponentLoaded]);
  
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
  
  // Toggle expanded state - simplified version
  const toggleModal = () => {
    const newState = !isModalOpen;
    setIsModalOpen(newState);
    
    // Fix for background scrolling
    if (newState) {
      // Store current scroll position
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
    } else {
      // Get the scroll position back
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      // Restore scroll position
      window.scrollTo(0, parseInt(scrollY || '0') * -1);
    }
  };

  // Feature card JSX
  return (
    <MeasureRender id="FeatureCard" logThreshold={5}>
      <>
      {/* Feature card container */}
      <div 
        ref={cardRef} 
        className={`relative h-full bg-dark-300 rounded-xl overflow-hidden border border-gray-700 hover:border-brand-400/50 transition-all duration-300 ${!isShowcase ? 'cursor-pointer' : ''} ${className}`} 
        onClick={!isShowcase ? toggleModal : undefined}
      >
        
        {/* Feature card content */}
        <motion.div 
          className={`relative z-10 h-full group ${!isShowcase ? 'cursor-pointer' : ''}`}
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible && !prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          whileHover={!prefersReducedMotion && !isShowcase ? { y: -4, transition: { duration: 0.2 } } : {}}
        >
          
           {/* Dramatic Feature Card - Different styling for showcase mode */}
           <div className={`relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-900/90 to-black border border-gray-800/40 h-full transition-all duration-300 shadow-lg flex flex-col ${!isShowcase ? 'group-hover:border-purple-500/40 group-hover:shadow-xl' : 'border-brand-400/30 shadow-2xl shadow-brand-400/20'}`}>
            
              {/* Dynamic Feature Illustration/Banner - Proper height for showcase theater */}
              <div className={`relative w-full overflow-hidden shrink-0 ${isShowcase ? 'h-48 lg:h-64 xl:h-80' : 'h-64 sm:h-72 md:h-80'}`}>
              
              {/* Gradient overlay for consistent branding & readability */}
              <div className={`absolute inset-0 bg-gradient-to-br from-gray-900/50 via-gray-900/30 to-gray-900/70 z-10`}></div>
              
              {/* Animated energy effect - Enhanced for showcase */}
              <motion.div 
                className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent z-20 ${isShowcase ? 'block' : 'hidden sm:block'}`}
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: isShowcase ? 3 : 4, repeat: Infinity, repeatDelay: isShowcase ? 2 : 3 }}
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
                  
                  {/* Centered icon as fallback if no image - Smaller in showcase to prioritize text */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-30">
                    
                    {/* Centered icon */}
                    <div className={`text-white transform ${isShowcase ? 'scale-[2] md:scale-[2.5]' : 'scale-[1.5] sm:scale-[2]'}`}>
                      {Icon}
                    </div>

                  </div>

                </div>
              )}
              
              {/* Top highlight line for added visual flair */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/60 to-transparent z-20"></div>
              
              {/* Bottom content reveal gradient */}
              <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900 via-gray-900/95 to-transparent z-20 ${isShowcase ? 'h-8' : 'h-8 sm:h-12'}`}></div>
              
              {/* More/When button - Only show in grid mode, not showcase */}
              {!isShowcase && (
                <div className="absolute top-2 sm:top-4 right-2 sm:right-4 z-30">
                  <motion.button
                    className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-black/60 backdrop-blur-sm text-white text-[10px] sm:text-xs font-bold uppercase tracking-wide border border-white/20`}
                    whileHover={{ 
                      scale: 1.05,
                      backgroundColor: 'rgba(0,0,0,0.8)',
                      borderColor: 'rgba(255,255,255,0.4)'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleModal();
                    }}
                  >
                    {isUpcoming ? 'When?' : 'More'}
                  </motion.button>
                </div>
              )}
            </div>
            
            {/* Content section - Prioritize top content, allow bottom overflow */}
            <div className={`relative z-10 flex-grow flex flex-col ${isShowcase ? 'px-4 md:px-6 py-3 md:py-4 overflow-hidden' : 'px-1.5 sm:px-3 py-1 sm:py-3'}`}>
              
              {/* Feature title - Always visible at top */}
              <h3 className={`font-bold font-russo-one text-white tracking-wide relative leading-tight flex-shrink-0 ${isShowcase ? 'text-xl md:text-2xl mb-3' : 'text-sm sm:text-base md:text-lg mb-0.5 sm:mb-1'}`}>
                {title}
                
                {/* Animated underline effect */}
                <motion.div 
                  className={`absolute -bottom-1 left-0 h-[2px] bg-gradient-to-r ${colorScheme.primary} ${isShowcase ? 'w-full' : 'w-0 group-hover:w-full'}`}
                  initial={{ width: isShowcase ? '100%' : 0 }}
                  whileHover={!isShowcase ? { width: '100%' } : {}}
                  transition={{ duration: 0.3 }}
                />

              </h3>
              
              {/* Feature description - Always visible, flexible height */}
              <p className={`text-gray-300 leading-snug font-sans flex-shrink-0 ${isShowcase ? 'text-base md:text-lg mb-3' : 'text-[10px] sm:text-xs md:text-sm leading-tight mb-1'}`}>
                {description}
              </p>

              {/* Status badge - High priority, always visible */}
              {isUpcoming && (
                <div className={`flex-shrink-0 ${isShowcase ? 'mb-3' : 'mb-2'}`}>
                  <span className={`bg-blue-600/70 text-blue-100 font-bold uppercase tracking-wide rounded-sm font-sans backdrop-blur-sm border border-blue-400/30 inline-block ${isShowcase ? 'px-3 py-1 text-sm' : 'px-2 py-1 text-xs'}`}>
                    Coming Soon
                  </span>
                </div>
              )}

              {/* Extended description - This can be cut off at bottom if needed */}
              {isShowcase && extendedDescription && (
                <div className="flex-grow overflow-hidden">
                  <div className="text-gray-400 leading-relaxed space-y-2 text-sm md:text-base">
                    {extendedDescription.split('\n').map((paragraph, idx) => (
                      <p key={idx}>
                        {paragraph}
                      </p>
                    ))}
                  </div>
                  {/* Fade out gradient at bottom to indicate more content */}
                  <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent pointer-events-none"></div>
                </div>
              )}
            </div>

            {/* Animation section - Can be cut off if needed */}
            {isShowcase && animation && FEATURE_FLAGS.SHOW_FEATURE_ANIMATIONS && (
              <div className="relative flex-shrink-0 p-3 md:p-4 bg-gray-900/20 border-t border-gray-700 overflow-hidden max-h-32 md:max-h-40">
                <div className="w-full h-full overflow-hidden rounded-lg">
                  {animation}
                </div>
              </div>
            )}
          </div>
          
        </motion.div>
        
        {/* Accent line animation - Only for grid mode */}
        {!isShowcase && (
          <motion.div 
            className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${colorScheme.primary} w-0 group-hover:w-full transition-all duration-700 ${isModalOpen ? 'hidden' : ''}`}
            initial={{ width: 0 }}
            whileHover={{ width: "100%" }}
          />
        )}

      </div>

      {/* Expandable card (overlay when expanded) - MOVED OUTSIDE */}
      {!isShowcase && portalRoot && ReactDOM.createPortal(
        <AnimatePresence>
          {/* Card expanded view */}
          {isModalOpen && (

              // Card expanded view container - BETTER MOBILE MODAL
              <motion.div
              className="fixed inset-0 z-[100000] bg-black/80 backdrop-blur-md flex items-start sm:items-center justify-center p-0 sm:p-4 md:p-8 overflow-y-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleModal}
            >
              {/* Modal content - Mobile optimized, compact design */}
              <motion.div 
                className="w-[90%] max-w-md sm:max-w-4xl h-auto max-h-[80vh] sm:max-h-[95vh] flex flex-col bg-gray-900/95 rounded-lg border border-gray-800 overflow-hidden my-auto"
                initial={{ scale: 0.9, opacity: 0, y: 50 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 50 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header - Compact with close button integrated */}
                <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-800 shrink-0">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className={`flex items-center justify-center p-1.5 sm:p-2 rounded-lg bg-black/70 text-${colorScheme.accent} backdrop-blur-sm border border-${colorScheme.accent}/30`}>
                      <div className="text-sm sm:text-base">
                        {Icon}
                      </div>
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg md:text-xl font-russo-one text-white tracking-wider">
                        {title}
                      </h2>
                      {isUpcoming && (
                        <span className="px-2 py-1 bg-blue-600/70 text-blue-100 text-xs font-bold uppercase tracking-wide rounded-sm font-sans backdrop-blur-sm border border-blue-400/30 mt-1 inline-block">
                          Coming Soon
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Close button - Integrated into header */}
                  <button 
                    className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-red-600/90 text-white hover:bg-red-700/90 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 shadow-lg border border-white/20"
                    onClick={toggleModal}
                    aria-label="Close modal (Escape key)"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" className="sm:w-20 sm:h-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>
                
                {/* Main content area - SCROLLABLE ON MOBILE */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 md:gap-6 p-3 sm:p-4 md:p-6 min-h-0 overflow-y-auto">
                  {/* Left column: Content - Condensed */}
                  <div className="space-y-2">
                    <div>
                      <h3 className="text-xs font-bold text-white/90 mb-1 font-russo-one tracking-wider uppercase">Overview</h3>
                      <p className="text-gray-300 leading-snug font-sans text-xs">
                        {description}
                      </p>
                    </div>
                    
                    {extendedDescription && (
                      <div>
                        <h3 className="text-xs font-bold text-white/90 mb-1 font-russo-one tracking-wider uppercase">Details</h3>
                        <div className="text-gray-300 leading-snug space-y-1 font-sans text-xs">
                          {extendedDescription.split('\n').map((paragraph, idx) => (
                            <p key={idx}>
                              {paragraph}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Right column: Animation/Visual */}
                  <div className="bg-gray-900/50 rounded-lg border border-gray-800 overflow-hidden flex items-center justify-center min-h-[150px] sm:min-h-[200px] lg:min-h-[300px]">
                    {animation && FEATURE_FLAGS.SHOW_FEATURE_ANIMATIONS ? (
                      <div className="w-full h-full p-2 sm:p-4">
                        {animation}
                      </div>
                    ) : (
                      <div className="text-center p-4 sm:p-8 h-full flex flex-col items-center justify-center">
                        {featureImage ? (
                          <motion.div
                            className="relative w-full max-w-xs sm:max-w-sm"
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
                            className="relative inline-block w-20 h-20 sm:w-32 sm:h-32"
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
                            <div className="absolute inset-0 flex items-center justify-center text-white transform scale-[2] sm:scale-[3]">
                              {Icon}
                            </div>
                          </motion.div>
                        )}
                        <p className="mt-3 sm:mt-4 text-gray-400 text-xs text-center">
                          {animation && !FEATURE_FLAGS.SHOW_FEATURE_ANIMATIONS 
                            ? "Animations disabled" 
                            : "Interactive demo coming soon"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        portalRoot
      )}
      </>
    </MeasureRender>
  );
};
