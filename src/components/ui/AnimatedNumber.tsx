/**
 * AnimatedNumber Component
 * 
 * Provides smooth number transitions for balance displays and counters.
 * Animates from previous value to new value with configurable duration.
 */

import { motion, useSpring, useTransform } from 'framer-motion';
import { useEffect } from 'react';

interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  decimals = 4,
  duration = 0.8,
  className = "",
  prefix = "",
  suffix = ""
}) => {
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
    spring.set(value);
  }, [spring, value]);

  return (
    <motion.span className={className}>
      {prefix}
      <motion.span>{display}</motion.span>
      {suffix}
    </motion.span>
  );
};