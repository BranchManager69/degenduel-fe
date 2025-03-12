import { motion } from "framer-motion";
import React from "react";
import { Link } from "react-router-dom";

// Logo sizes for different viewports with proper aspect ratio
const LOGO_SIZES = {
  xs: { height: 40, width: 120 }, // Mobile extra small (very tight spaces)
  sm: { height: 48, width: 144 }, // Mobile/compact header
  md: { height: 56, width: 168 }, // Default header size
  lg: { height: 80, width: 240 }, // Large displays/hero areas
  xl: { height: 120, width: 360 }, // Extra large showcase
};

interface LogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  textOnly?: boolean;
  asLink?: boolean;
  animated?: boolean;
  highlightColor?: string;
}

/**
 * Logo component that automatically handles sizing and responsiveness
 *
 * @param size - Predefined size (xs, sm, md, lg, xl)
 * @param className - Additional CSS classes
 * @param textOnly - If true, displays only the text without connector elements
 * @param asLink - If true, wraps the logo in a Link to home page
 * @param animated - If true, applies subtle animations to the logo
 * @param highlightColor - Custom color for the connector/highlight
 */
const Logo: React.FC<LogoProps> = ({
  size = "md",
  className = "",
  textOnly = false,
  asLink = false,
  animated = false,
  highlightColor = "#06b6d4", // Cyan default
}) => {
  const { height, width } = LOGO_SIZES[size];

  // Default aspect ratio is 3:1 (width:height)
  const containerStyle = {
    height: `${height}px`,
    width: `${width}px`,
  };

  // Simple subtle pulse animation
  const pulseAnimation = animated
    ? {
        animate: {
          opacity: [0.8, 1, 0.8],
          scale: [0.995, 1.005, 0.995],
        },
        transition: {
          duration: 4,
          repeat: Infinity,
          repeatType: "reverse" as const,
        },
      }
    : {};

  // Connector animation
  const connectorAnimation = animated
    ? {
        animate: {
          opacity: [0.7, 1, 0.7],
          filter: [
            `drop-shadow(0 0 2px ${highlightColor})`,
            `drop-shadow(0 0 5px ${highlightColor})`,
            `drop-shadow(0 0 2px ${highlightColor})`,
          ],
        },
        transition: {
          duration: 2,
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
      <div className="flex items-center justify-center h-full">
        {/* DEGEN part */}
        <div
          className="text-brand-500 font-bold tracking-tight"
          style={{
            fontSize: `${height * 0.5}px`,
            fontFamily: "'Silkscreen', monospace",
          }}
        >
          DEGEN
        </div>

        {/* Middle connector */}
        {!textOnly && (
          <motion.div
            className="mx-1"
            style={{
              height: `${height * 0.4}px`,
              width: `${height * 0.08}px`,
              backgroundColor: highlightColor,
              borderRadius: `${height * 0.02}px`,
            }}
            {...connectorAnimation}
          />
        )}

        {/* DUEL part */}
        <div
          className="text-white font-bold tracking-tight"
          style={{
            fontSize: `${height * 0.5}px`,
            fontFamily: "'Silkscreen', monospace",
          }}
        >
          DUEL
        </div>

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
