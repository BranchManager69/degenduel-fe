import { motion } from "framer-motion";
import React, { useState } from "react";
import { Link } from "react-router-dom";

// Logo sizes for different viewports with proper aspect ratio
// The original logo image has approximately a 3.4:1 width-to-height ratio
const LOGO_SIZES = {
  xs: { height: 30, width: 102 }, // Mobile extra small (very tight spaces)
  sm: { height: 36, width: 122 }, // Mobile/compact header
  md: { height: 42, width: 143 }, // Default header size
  lg: { height: 60, width: 204 }, // Large displays/hero areas
  xl: { height: 90, width: 306 }, // Extra large showcase
};

interface LogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  textOnly?: boolean; // Deprecated
  asLink?: boolean;
  animated?: boolean;
  enhancedGlow?: boolean; // New option for more complex glow effect
  glowColor?: string; // Color for the enhanced glow
  highlightColor?: string; // Deprecated
}

/**
 * Logo component that automatically handles sizing and responsiveness
 *
 * @param size - Predefined size (xs, sm, md, lg, xl)
 * @param className - Additional CSS classes
 * @param asLink - If true, wraps the logo in a Link to home page
 * @param animated - If true, applies subtle animations to the logo
 */
const Logo: React.FC<LogoProps> = ({
  size = "md",
  className = "",
  asLink = false,
  animated = false,
  enhancedGlow = false,
  glowColor = "#9933ff", // Default to brand purple
  // Unused parameters are removed but kept in the interface for backward compatibility
}) => {
  const { height, width } = LOGO_SIZES[size];

  // Default container style based on the logo's aspect ratio
  const containerStyle = {
    height: `${height}px`,
    width: `${width}px`,
    maxWidth: "100%",
  };

  // Simple subtle pulse animation
  const pulseAnimation = animated
    ? {
        animate: {
          opacity: [0.92, 1, 0.92],
          scale: [0.98, 1.02, 0.98],
        },
        transition: {
          duration: 4,
          repeat: Infinity,
          repeatType: "reverse" as const,
        },
      }
    : {};

  // The logo element itself
  const logoElement = (
    <motion.div
      className={`relative flex items-center justify-center ${className}`}
      style={containerStyle}
      {...pulseAnimation}
    >
      {/* Enhanced multi-layer glow when enabled */}
      {enhancedGlow && animated && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Outer glow layer */}
          <motion.div 
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(ellipse at center, ${glowColor}33 0%, transparent 70%)`,
              borderRadius: '50%',
              transform: 'scale(1.2)',
              filter: 'blur(8px)',
            }}
            animate={{
              opacity: [0.4, 0.7, 0.4],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
          
          {/* Middle glow layer - different opacity/animation */}
          <motion.div 
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(ellipse at center, ${glowColor}66 0%, transparent 60%)`,
              borderRadius: '50%',
              transform: 'scale(1.05)',
              filter: 'blur(5px)',
            }}
            animate={{
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse",
              delay: 0.5,
            }}
          />
          
          {/* Inner sharp glow for highlights */}
          <motion.div 
            className="absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(ellipse at center, rgba(255,255,255,0.5) 0%, transparent 40%)',
              borderRadius: '50%',
              transform: 'scale(0.9)',
              mixBlendMode: 'screen',
            }}
            animate={{
              opacity: [0.4, 0.8, 0.4],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
        </div>
      )}

      <div className="flex items-center justify-center h-full w-full overflow-hidden relative z-10">
        {/* Image logo with explicit dimensions */}
        <motion.img
          src="/assets/media/logos/transparent_WHITE.png"
          alt="DegenDuel Logo"
          className="object-contain relative z-10"
          style={{
            width: `${width}px`,
            height: `${height}px`,
            maxWidth: "100%",
            maxHeight: "100%",
            filter: enhancedGlow 
              ? `drop-shadow(0 0 2px ${glowColor}80)` 
              : "none"
          }}
        />
        
        {/* 
          ORIGINAL IMPLEMENTATION (preserved for reference):
          <motion.img
            src="/assets/media/logos/transparent_WHITE.png"
            alt="DegenDuel Logo"
            className="object-contain"
            style={{
              width: `${width}px`,
              height: `${height}px`,
              maxWidth: "100%",
              maxHeight: "100%",
              filter: animated 
                ? "drop-shadow(0 0 3px rgba(255, 255, 255, 0.5))" 
                : "none",
            }}
            animate={animated ? {
              filter: [
                "drop-shadow(0 0 2px rgba(255, 255, 255, 0.3))",
                "drop-shadow(0 0 5px rgba(255, 255, 255, 0.6))",
                "drop-shadow(0 0 2px rgba(255, 255, 255, 0.3))",
              ]
            } : undefined}
            transition={animated ? {
              duration: 2.5,
              repeat: Infinity,
              repeatType: "reverse",
            } : undefined}
          />
        */}

        {/* SEO text (hidden visually) */}
        <span className="sr-only">DegenDuel</span>
      </div>
    </motion.div>
  );

  // State for animation flash effect
  const [isFlashing, setIsFlashing] = useState(false);
  
  // Conditionally wrap in Link if needed
  if (asLink) {
    return (
      <Link
        to="/"
        className="flex items-center transition-transform duration-200 hover:scale-[1.03] active:scale-[0.97]"
        aria-label="DegenDuel - Go to Home Page"
        onClick={(e) => {
          // Check if we're already on the home page
          if (window.location.pathname === '/') {
            e.preventDefault();
            setIsFlashing(true);
            setTimeout(() => setIsFlashing(false), 500);
          }
        }}
      >
        {React.cloneElement(logoElement, { 
          className: isFlashing ? 'logo-flashing' : '',
        })}
      </Link>
    );
  }

  return logoElement;
};

export default Logo;
