// src/components/layout/FloatingButtonStack.tsx

/**
 * Floating Button Stack Component
 * 
 * @description Enhanced floating action buttons with staggered animations and dynamic stacking
 * 
 * @author Claude & BranchManager69
 * @version 1.0.0
 * @created 2025-05-25
 */

import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FloatingBelieveButton } from './FloatingBelieveButton';
import { FloatingDexscreenerButton } from './FloatingDexscreenerButton';
import { FloatingJupButton } from './FloatingJupButton';
import { FloatingPumpButton } from './FloatingPumpButton';

interface FloatingButtonStackProps {
  tokenAddress?: string | null;
  tokenSymbol?: string | null;
  enabled?: boolean;
}

const FloatingButtonStack: React.FC<FloatingButtonStackProps> = ({ 
  tokenAddress, 
  tokenSymbol, 
  enabled = true 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const stackRef = useRef<HTMLDivElement>(null);

  // Detect mobile devices
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= 768 || 'ontouchstart' in window);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Optimized mouse tracking for 3D tilt effects (desktop only)
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!stackRef.current || isMobile) return;
    
    const rect = stackRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Only update if mouse is near the stack (performance optimization)
    const distance = Math.sqrt(
      Math.pow(e.clientX - centerX, 2) + Math.pow(e.clientY - centerY, 2)
    );
    
    if (distance < 200) { // Only track within 200px radius
      setMousePosition({
        x: (e.clientX - centerX) / 20,
        y: (e.clientY - centerY) / 20
      });
    }
  }, [isMobile]);

  useEffect(() => {
    if (isMobile) return; // Skip mouse tracking on mobile
    
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove, isMobile]);

  // Button configurations for consistent animation
  const buttons = [
    { 
      id: 'believe', 
      component: FloatingBelieveButton, 
      position: { bottom: 6, index: 0 },
      color: 'emerald'
    },
    { 
      id: 'pump', 
      component: FloatingPumpButton, 
      position: { bottom: 24, index: 1 },
      color: 'blue'
    },
    { 
      id: 'dexscreener', 
      component: FloatingDexscreenerButton, 
      position: { bottom: 42, index: 2 },
      color: 'yellow'
    },
    { 
      id: 'jupiter', 
      component: FloatingJupButton, 
      position: { bottom: 60, index: 3 },
      color: 'emerald'
    }
  ];

  // Enhanced animation variants
  const containerVariants = {
    hidden: {
      opacity: 0,
    },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15, // Staggered entrance
        delayChildren: 0.2
      }
    }
  };

  const buttonVariants = {
    hidden: {
      opacity: 0,
      scale: 0.3,
      x: -100,
      y: 20,
      rotate: -15
    },
    visible: {
      opacity: 1,
      scale: 1,
      x: 0,
      y: 0,
      rotate: 0,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20,
        mass: 1
      }
    },
    hover: {
      scale: 1.05,
      rotateX: isMobile ? 0 : mousePosition.y * 0.1,
      rotateY: isMobile ? 0 : mousePosition.x * 0.1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25
      }
    }
  };


  if (!enabled) return null;

  return (
    <motion.div
      ref={stackRef}
      className="fixed left-6 z-40"
      style={{ bottom: '1.5rem' }}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      onMouseEnter={() => !isMobile && setIsExpanded(true)}
      onMouseLeave={() => !isMobile && setIsExpanded(false)}
      onTouchStart={() => isMobile && setIsExpanded(true)}
      onTouchEnd={() => isMobile && setTimeout(() => setIsExpanded(false), 2000)} // Auto-collapse after 2s on mobile
    >
      <AnimatePresence>
        {buttons.map((buttonConfig, index) => {
          const ButtonComponent = buttonConfig.component;
          
          return (
            <motion.div
              key={buttonConfig.id}
              custom={index}
              variants={buttonVariants}
              whileHover="hover"
              className="relative mb-4 last:mb-0"
              style={{
                transformStyle: 'preserve-3d',
              }}
            >
              <ButtonComponent
                tokenAddress={tokenAddress}
                tokenSymbol={tokenSymbol}
              />
              
              {/* Magnetic interaction effect */}
              <motion.div
                className="absolute inset-0 pointer-events-none"
                animate={{
                  boxShadow: isExpanded 
                    ? `0 0 30px rgba(${buttonConfig.color === 'emerald' ? '16, 185, 129' : 
                        buttonConfig.color === 'blue' ? '59, 130, 246' : '234, 179, 8'}, 0.3)`
                    : 'none'
                }}
                transition={{ duration: 0.3 }}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
      
      {/* Stack interaction indicator */}
      <motion.div
        className="absolute -right-4 top-1/2 transform -translate-y-1/2 w-1 h-16 bg-gradient-to-b from-transparent via-white/20 to-transparent rounded-full"
        animate={{
          opacity: isExpanded ? 1 : 0,
          scaleY: isExpanded ? 1 : 0.3
        }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  );
};

export default FloatingButtonStack;