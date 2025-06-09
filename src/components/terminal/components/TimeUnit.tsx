/**
 * @fileoverview
 * Time unit component for the terminal countdown
 * 
 * @description
 * Displays a single time unit (days, hours, minutes, seconds) with styling
 * 
 * @author Branch Manager
 */

import { motion } from 'framer-motion';
import React from 'react';
import { TimeUnitProps } from '../types';

/**
 * TimeUnit - Displays a single time unit with animations
 */
export const TimeUnit: React.FC<TimeUnitProps> = ({ 
  value, 
  label, 
  urgencyLevel = 0 
}) => {
  // Generate dynamic colors based on urgency level
  const getTextColor = () => {
    switch(urgencyLevel) {
      case 1: // Warning (<60s)
        return "#ffcc00";
      case 2: // Critical (<10s)
        return "#ff5050";
      case 3: // Complete
        return "#33ff66";
      default: // Normal
        return "#33ff66"; // 24-style digital green
    }
  };

  const getShadowColor = () => {
    switch(urgencyLevel) {
      case 1: // Warning (<60s)
        return "0 0 10px rgba(255, 204, 0, 0.7)";
      case 2: // Critical (<10s)
        return "0 0 10px rgba(255, 50, 50, 0.7)";
      case 3: // Complete
        return "0 0 10px rgba(51, 255, 102, 0.7)";
      default: // Normal
        return "0 0 10px rgba(51, 255, 102, 0.7)"; // 24-style digital green glow
    }
  };

  return (
    <div className="flex flex-col items-center w-12 sm:w-14 md:w-16 lg:w-20">
      <motion.div 
        className="text-xl sm:text-2xl md:text-3xl lg:text-4xl tabular-nums w-full text-center bg-black/50 px-1 py-1 rounded border border-opacity-30"
        style={{
          borderColor: getTextColor(),
          color: getTextColor(),
          textShadow: getShadowColor(),
          fontFamily: "'Courier New', monospace",
          letterSpacing: "1px"
        }}
        animate={{ 
          opacity: urgencyLevel >= 2 ? [1, 0.8, 1] : 1,
          textShadow: [
            getShadowColor(),
            `0 0 ${urgencyLevel >= 2 ? '15' : '12'}px ${getTextColor()}`,
            getShadowColor()
          ]
        }}
        transition={{
          duration: urgencyLevel >= 2 ? 0.5 : 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        whileHover={{
          // No scale change to prevent layout shifts
          textShadow: `0 0 15px ${getTextColor()}`
        }}
      >
        {value.toString().padStart(2, '0')}
      </motion.div>
      <div 
        className="text-xs sm:text-sm font-bold tracking-wider mt-2 w-full text-center" 
        style={{ color: getTextColor(), opacity: 0.8 }}
      >
        {label}
      </div>
    </div>
  );
};

export default TimeUnit;