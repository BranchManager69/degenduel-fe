// src/components/layout/FloatingButtonStack.tsx

/**
 * Floating Button Stack Component
 * 
 * @description Clean floating action buttons with beautiful animations
 * 
 * @author Claude & BranchManager69
 * @version 2.0.0
 * @created 2025-05-25
 */

import { AnimatePresence, motion } from 'framer-motion';
import React from 'react';
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
  // Button configurations
  const buttons = [
    { 
      id: 'believe', 
      component: FloatingBelieveButton, 
      color: 'emerald'
    },
    { 
      id: 'pump', 
      component: FloatingPumpButton, 
      color: 'blue'
    },
    { 
      id: 'dexscreener', 
      component: FloatingDexscreenerButton, 
      color: 'yellow'
    },
    { 
      id: 'jupiter', 
      component: FloatingJupButton, 
      color: 'emerald'
    }
  ];

  // Clean animation variants
  const containerVariants = {
    hidden: {
      opacity: 0,
    },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const buttonVariants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
      x: -60,
      y: 20
    },
    visible: {
      opacity: 1,
      scale: 1,
      x: 0,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25,
        mass: 0.8
      }
    }
  };

  if (!enabled) return null;

  return (
    <motion.div
      className="fixed left-6 z-50 flex flex-col-reverse space-y-reverse space-y-4"
      style={{ bottom: '1.5rem' }}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <AnimatePresence>
        {buttons.map((buttonConfig) => {
          const ButtonComponent = buttonConfig.component;
          
          return (
            <motion.div
              key={buttonConfig.id}
              variants={buttonVariants}
              className="relative"
            >
              <ButtonComponent
                tokenAddress={tokenAddress}
                tokenSymbol={tokenSymbol}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
};

export default FloatingButtonStack;