/**
 * AnimatedNumber Component
 * 
 * Provides smooth number transitions for balance displays and counters.
 * Animates from previous value to new value with configurable duration.
 */

import { motion, useSpring, useTransform } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  showChangeColor?: boolean; // New prop to enable color flash on change
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  decimals = 4,
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
  
  const display = useTransform(spring, (latest) => {
    return latest.toLocaleString(undefined, { 
      minimumFractionDigits: decimals, 
      maximumFractionDigits: decimals 
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