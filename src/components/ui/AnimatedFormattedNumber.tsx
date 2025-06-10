/**
 * AnimatedFormattedNumber Component
 * 
 * Extension of AnimatedNumber that allows custom formatting functions.
 * Perfect for displaying abbreviated numbers (K/M/B) with smooth animations.
 */

import { motion, useSpring, useTransform } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

interface AnimatedFormattedNumberProps {
  value: number;
  formatter?: (value: number) => string;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  showChangeColor?: boolean;
}

export const AnimatedFormattedNumber: React.FC<AnimatedFormattedNumberProps> = ({
  value,
  formatter,
  duration = 0.8,
  className = "",
  prefix = "",
  suffix = "",
  showChangeColor = false
}) => {
  const [changeColor, setChangeColor] = useState<'up' | 'down' | null>(null);
  const previousValue = useRef<number>(value);
  const colorTimeout = useRef<NodeJS.Timeout | undefined>(undefined);

  const spring = useSpring(value, { 
    damping: 20, 
    stiffness: 100,
    duration: duration * 1000
  });
  
  // Use custom formatter if provided, otherwise default formatting
  const display = useTransform(spring, (latest) => {
    if (formatter) {
      return formatter(latest);
    }
    // Default formatting with no decimals for integers
    return latest.toLocaleString(undefined, { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 0 
    });
  });

  useEffect(() => {
    // Detect change direction for color flash
    if (showChangeColor && previousValue.current !== value) {
      const direction = value > previousValue.current ? 'up' : 'down';
      setChangeColor(direction);
      
      // Clear any existing timeout
      if (colorTimeout.current) {
        clearTimeout(colorTimeout.current);
      }
      
      // Reset color after animation completes
      colorTimeout.current = setTimeout(() => {
        setChangeColor(null);
      }, duration * 1000);
    }
    
    previousValue.current = value;
    spring.set(value);
  }, [spring, value, showChangeColor, duration]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (colorTimeout.current) {
        clearTimeout(colorTimeout.current);
      }
    };
  }, []);

  // Dynamic color classes based on change direction
  const getColorClass = () => {
    if (!showChangeColor || !changeColor) return '';
    return changeColor === 'up' 
      ? 'text-green-400 transition-colors duration-300' 
      : 'text-red-400 transition-colors duration-300';
  };

  return (
    <motion.span 
      className={`${className} ${getColorClass()}`}
      animate={showChangeColor && changeColor ? { 
        scale: [1, 1.05, 1],
        transition: { duration: 0.3 }
      } : {}}
    >
      {prefix}
      <motion.span>{display}</motion.span>
      {suffix}
    </motion.span>
  );
};

// Export the formatter function for reuse
export const formatTokenBalance = (value: number): string => {
  if (value >= 1_000_000) {
    if (value >= 10_000_000) {
      // 10M or above: 1 decimal place (e.g., "15.7M")
      return (value / 1_000_000).toFixed(1) + 'M';
    } else {
      // 1M to 9.999M: 2 decimal places (e.g., "5.67M", "9.99M")
      return (value / 1_000_000).toFixed(2) + 'M';
    }
  } else if (value >= 1_000) {
    // 1K to 999.9K: 1 decimal place (e.g., "1.2K")
    return (value / 1_000).toFixed(1) + 'K';
  } else {
    // Under 1K: whole numbers (e.g., "999")
    return Math.floor(value).toString();
  }
};