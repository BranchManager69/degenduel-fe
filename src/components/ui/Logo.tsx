// src/components/ui/Logo.tsx

/**
 * Logo component
 * 
 * @description Component displaying the DegenDuel logo (default color is white).
 * 
 * @author BranchManager69
 * @version 1.9.0
 * @created 2025-05-01
 * @updated 2025-05-07
 */
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

// Logo props
interface LogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  logoColor?: "white" | "black";
  className?: string;
  textOnly?: boolean; // Deprecated
  asLink?: boolean;
  animated?: boolean;
  enhancedGlow?: boolean; // New option for more complex glow effect
  glowColor?: string; // Color for the enhanced glow
  //highlightColor?: string; // Deprecated
}

/**
 * Logo component that automatically handles sizing and responsiveness
 *
 * @param size - Predefined size (xs, sm, md, lg, xl)
 * @param logoColor - Color for the logo (default is white)
 * @param className - Additional CSS classes
 * @param asLink - If true, wraps the logo in a Link to home page
 * @param animated - If true, applies subtle animations to the logo
 * @param enhancedGlow - If true, applies a more complex glow effect to the logo
 * @param glowColor - Color for the enhanced glow
 */
const Logo: React.FC<LogoProps> = ({
  size = "md",
  logoColor = "white",
  className = "",
  asLink = false,
  animated = false,
  enhancedGlow = false,
  glowColor = "#9933ff", // Default to brand purple
}) => {
  // Get the logo size
  const { height, width } = LOGO_SIZES[size];

  // Default container style based on the logo's aspect ratio
  const containerStyle = {
    height: `${height}px`,
    width: `${width}px`,
    maxWidth: "100%",
  };

  // Pulse animation
  const pulseAnimation = animated
    ? {
        // Simple subtle pulse
        animate: {
          opacity: [0.92, 1, 0.92],
          scale: [0.98, 1.02, 0.98],
        },
        // Animation transition
        transition: {
          duration: 4,
          repeat: Infinity,
          repeatType: "reverse" as const,
        },
      }
    : {};

  // Logo element
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
            // Outer glow layer
            style={{
              backgroundImage: `radial-gradient(ellipse at center, ${glowColor}33 0%, transparent 70%)`,
              borderRadius: '50%',
              transform: 'scale(1.2)',
              filter: 'blur(8px)',
            }}
            // Animation
            animate={{
              opacity: [0.4, 0.7, 0.4],
            }}
            // Animation transition
            transition={{
              duration: 3,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
          
          {/* Middle glow layer - different opacity/animation */}
          <motion.div 
            className="absolute inset-0"
            // Middle glow layer
            style={{
              backgroundImage: `radial-gradient(ellipse at center, ${glowColor}66 0%, transparent 60%)`,
              borderRadius: '50%',
              transform: 'scale(1.05)',
              filter: 'blur(5px)',
            }}
            // Animation
            animate={{
              opacity: [0.3, 0.6, 0.3],
            }}
            // Animation transition
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
            // Inner sharp glow
            style={{
              backgroundImage: 'radial-gradient(ellipse at center, rgba(255,255,255,0.5) 0%, transparent 40%)',
              borderRadius: '50%',
              transform: 'scale(0.9)',
              mixBlendMode: 'screen',
            }}
            // Animation
            animate={{
              opacity: [0.4, 0.8, 0.4],
            }}
            // Animation transition
            transition={{
              duration: 1.5,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
        </div>
      )}

      {/* DegenDuel logo container */}
      <div className="flex items-center justify-center h-full w-full overflow-hidden relative z-10">
        {/* Logo image (white or black) with explicit dimensions */}
        <motion.img
          src={logoColor === "black" ? "/assets/media/logos/transparent_BLACK.png" : "/assets/media/logos/transparent_WHITE.png"}
          alt={`DegenDuel Logo (${logoColor})`}
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
      // Link to home page
      <Link
        to="/"
        className="flex items-center transition-transform duration-200 hover:scale-[1.03] active:scale-[0.97]"
        aria-label="DegenDuel - Go to Home Page"
        onClick={(e) => {
          // If already on the home page, don't navigate
          if (window.location.pathname === '/') {
            // Prevent default navigation
            e.preventDefault();
            // Flash the logo for 500ms
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
