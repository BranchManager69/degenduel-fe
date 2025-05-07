// src/components/landing/features-list/FeatureCard.tsx

/**
 * High-impact feature card component with immersive design
 * Showcases platform features with dramatic visuals and expandable details
 */

import { AnimatePresence, motion } from "framer-motion";
import React, { useRef, useState } from "react";

import { FEATURE_FLAGS } from "../../../config/config";
import { MeasureRender } from "../../../utils/performance";

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
const DEFAULT_FEATURE_IMAGES = {
  "Reflections System": "/assets/media/features/reflections-system.png",
  "Trading Competitions": "/assets/media/features/trading-competitions.png",
  "Real-Time Market Data": "/assets/media/features/real-time-market.png",
  "Advanced Analytics": "/assets/media/features/advanced-analytics.png", 
  "Degen Reputation System": "/assets/media/features/reputation-system.png",
  "Instant Settlement": "/assets/media/features/instant-settlement.png",
  "AI Trading Agents": "/assets/media/features/ai-trading.png",
  "P2P Trading Duels": "/assets/media/features/p2p-duels.png"
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
  const featureImage = imagePath || (title in DEFAULT_FEATURE_IMAGES ? DEFAULT_FEATURE_IMAGES[title as keyof typeof DEFAULT_FEATURE_IMAGES] : null);
  
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
      <div ref={cardRef} className="relative h-full">
        <motion.div 
          className={`relative z-10 h-full ${isExpanded ? 'pointer-events-none' : 'cursor-pointer group'}`}
          onClick={() => !isExpanded && toggleExpand()}
          whileHover={!isExpanded ? { scale: 1.03, y: -5 } : {}}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          layout
        >
          {/* Dramatic Feature Card - Complete redesign with visual impact */}
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-900/90 to-black border border-gray-800/40 h-full group-hover:border-purple-500/40 transition-all duration-300 shadow-lg group-hover:shadow-xl">
            {/* Dynamic Feature Illustration/Banner (full width) */}
            <div className="relative h-40 w-full overflow-hidden">
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
                <div className="absolute inset-0 z-0">
                  {!imageLoaded && !imageError && (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 animate-pulse"></div>
                  )}
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
                  <div className="absolute inset-0 opacity-20 bg-[linear-gradient(45deg,transparent_25%,rgba(68,0,255,0.1)_50%,transparent_75%)] bg-[length:250%_250%] animate-shine"></div>
                  
                  {/* Centered icon as fallback if no image */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-30">
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
                <div className="absolute top-4 right-4 z-30">
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
                    {colorScheme.tag}
                  </motion.div>
                </div>
              )}
            </div>
            
            {/* Content section with bold typography */}
            <div className="relative p-5 z-10">
              {/* Title - Now much more prominent */}
              <h3 className={`text-2xl font-bold font-cyber mb-3 text-white tracking-wide relative`}>
                {title}
                
                {/* Animated underline effect */}
                <motion.div 
                  className={`absolute -bottom-1 left-0 h-[2px] w-0 group-hover:w-full bg-gradient-to-r ${colorScheme.primary}`}
                  initial={{ width: 0 }}
                  whileHover={{ width: '100%' }}
                  transition={{ duration: 0.3 }}
                />
              </h3>
              
              {/* Description with dramatically improved contrast & readability */}
              <p className="text-gray-200 leading-relaxed">
                {description}
              </p>
            </div>
            
            {/* Modern footer with clear visual call to action */}
            <div className="p-4 pb-5 flex items-center justify-between border-t border-gray-800/30 bg-gray-900/50 relative z-10">
              {/* Feature category indicator */}
              <div className={`flex items-center text-sm text-${isUpcoming ? 'blue' : 'purple'}-300`}>
                <motion.span
                  className="inline-block h-2 w-2 rounded-full bg-current mr-2"
                  animate={{ 
                    scale: [1, 1.3, 1],
                    opacity: [0.7, 1, 0.7] 
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="opacity-70 font-semibold">
                  {isUpcoming ? 'Future Feature' : 'Core Feature'}
                </span>
              </div>
              
              {/* Explicit call-to-action with engaging animation */}
              <motion.button
                className={`px-3 py-1.5 rounded-md border border-${colorScheme.accent}/40 bg-gradient-to-r ${colorScheme.primary} bg-opacity-10 text-white text-sm font-medium flex items-center space-x-1`}
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
                <span>Learn More</span>
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
                className="relative w-full max-w-4xl rounded-xl overflow-hidden bg-gray-900/90 border border-gray-800"
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
                
                {/* Feature image if available */}
                {featureImage && (
                  <div className="w-full h-48 sm:h-64 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-900/30 to-gray-900/10 z-10"></div>
                    <img 
                      src={featureImage}
                      alt={title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-gray-900 to-transparent"></div>
                  </div>
                )}
                
                {/* Header with title - more prominent with glowing effects */}
                <div className="p-6 border-b border-gray-800 bg-gradient-to-r from-gray-900 to-gray-800">
                  <div className="flex items-center gap-4">
                    <motion.div 
                      className={`flex items-center justify-center p-4 rounded-lg bg-${colorScheme.secondary}-900/40 text-${colorScheme.accent}`}
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
                    <div>
                      <h2 className={`text-3xl sm:text-4xl font-cyber bg-gradient-to-r ${colorScheme.primary} bg-clip-text text-transparent mb-1`}>
                        {title}
                      </h2>
                      {isUpcoming && (
                        <span className="px-2 py-1 bg-blue-600/30 text-blue-300 text-xs font-bold uppercase tracking-wide rounded-sm">
                          Coming Soon
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Two-column layout for larger screens, stacked for mobile */}
                <div className="grid md:grid-cols-2 grid-cols-1 gap-6 p-6">
                  {/* Left column: Detailed description */}
                  <div className="space-y-4">
                    <div className="mb-4">
                      <h3 className="text-lg font-bold text-white/90 mb-3 font-cyber tracking-wide">OVERVIEW</h3>
                      <p className="text-gray-200 leading-relaxed">
                        {description}
                      </p>
                    </div>
                    
                    {extendedDescription && (
                      <div>
                        <h3 className="text-lg font-bold text-white/90 mb-3 font-cyber tracking-wide">DETAILS</h3>
                        <div className="text-gray-200 leading-relaxed space-y-3">
                          {extendedDescription.split('\n').map((paragraph, idx) => (
                            <p key={idx}>{paragraph}</p>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Feature highlights - visually appealing bullets */}
                    <div className="mt-6 space-y-3">
                      <h3 className="text-lg font-bold text-white/90 font-cyber tracking-wide">HIGHLIGHTS</h3>
                      <ul className="space-y-2">
                        {description.split('. ').filter(Boolean).map((point, idx) => (
                          <li key={idx} className="flex gap-2 items-start">
                            <span className={`inline-block h-5 w-5 flex-shrink-0 rounded-full bg-gradient-to-br ${colorScheme.primary} mt-0.5`}></span>
                            <span className="text-gray-300">{point}.</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  {/* Right column: Animation/Diagram */}
                  <div className="bg-gray-900/50 rounded-lg border border-gray-800 overflow-hidden flex items-center justify-center min-h-[300px]">
                    {animation && FEATURE_FLAGS.SHOW_FEATURE_ANIMATIONS ? (
                      <div className="w-full h-full">
                        {animation}
                      </div>
                    ) : (
                      // Enhanced placeholder animation if none provided or animations disabled
                      <div className="text-center p-10 h-full flex flex-col items-center justify-center">
                        {featureImage ? (
                          // Show a more dynamic version of the feature image
                          <motion.div
                            className="relative w-full max-w-xs"
                            animate={{ scale: [1, 1.03, 1], y: [0, -5, 0] }}
                            transition={{ duration: 4, repeat: Infinity, repeatType: "reverse" }}
                          >
                            <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/30 to-blue-500/30 rounded-lg blur-lg"></div>
                            <img 
                              src={featureImage} 
                              alt={title} 
                              className="relative rounded-lg w-full h-full object-cover"
                            />
                          </motion.div>
                        ) : (
                          // Fallback animation
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
                        <p className="mt-6 text-gray-400">
                          {animation && !FEATURE_FLAGS.SHOW_FEATURE_ANIMATIONS 
                            ? "Animations disabled" 
                            : "Interactive demo coming soon"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Bottom call-to-action */}
                <div className="p-6 bg-gray-900/70 border-t border-gray-800 flex justify-between items-center">
                  <div className="text-sm text-gray-400">
                    <span className="text-gray-300 font-semibold">DegenDuel</span> • Core Platform Feature
                  </div>
                  <button 
                    onClick={toggleExpand}
                    className={`px-4 py-2 rounded-md bg-gradient-to-r ${colorScheme.primary} text-white text-sm font-medium`}
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
