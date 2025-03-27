import { motion } from "framer-motion";
import React from "react";
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
      <div className="flex items-center justify-center h-full w-full">
        {/* Image logo */}
        <motion.img
          src="/assets/media/logos/transparent_WHITE.png"
          alt="DegenDuel Logo"
          className="w-full h-full object-contain"
          style={{
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

        {/* SEO text (hidden visually) */}
        <span className="sr-only">DegenDuel</span>
      </div>
    </motion.div>
  );

  // Conditionally wrap in Link if needed
  if (asLink) {
    return (
      <Link
        to="/"
        className="flex items-center transition-transform duration-200 hover:scale-[1.03]"
        aria-label="DegenDuel - Go to Home Page"
      >
        {logoElement}
      </Link>
    );
  }

  return logoElement;
};

export default Logo;
