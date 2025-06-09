// src/components/layout/FloatingTwitterButton.tsx

/**
 * Floating Twitter/X Button Component
 * 
 * @description A floating circular button that opens DegenDuel's X (Twitter) profile
 * 
 * @author BranchManager69 & Claude
 * @version 1.0.0
 * @created 2025-06-08
 */

import { motion } from 'framer-motion';
import React from 'react';

interface FloatingTwitterButtonProps {
  onClick?: () => void;
  isCountdownComplete?: boolean;
  onPrematureClick?: () => void;
}

export const FloatingTwitterButton: React.FC<FloatingTwitterButtonProps> = ({ 
  onClick, 
  isCountdownComplete = false,
  onPrematureClick 
}) => {
  const handleClick = () => {
    // If countdown isn't complete, trigger jiggle animation instead of navigation
    if (!isCountdownComplete) {
      onPrematureClick?.();
      return;
    }

    if (onClick) {
      onClick();
    } else {
      console.log('Twitter button clicked! Opening DegenDuel X profile...');
      window.open('https://x.com/degenduelme', '_blank');
    }
  };

  return (
    <motion.div
      className="cursor-pointer group"
      onClick={handleClick}
      title="Follow DegenDuel on X (Twitter)"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <motion.div
        className="w-10 h-10 md:w-12 md:h-12 bg-black/60 backdrop-blur-md border border-blue-500/50 rounded-full overflow-hidden relative shadow-lg transition-all duration-300 flex items-center justify-center"
        whileHover={{ 
          borderColor: 'rgba(59, 130, 246, 0.8)',
          boxShadow: '0 0 25px rgba(59, 130, 246, 0.6), 0 0 50px rgba(59, 130, 246, 0.3)'
        }}
        transition={{ duration: 0.3 }}
      >
        {/* X (Twitter) logo - using the 𝕏 character */}
        <span className="text-xl md:text-2xl font-bold text-blue-400 group-hover:text-white transition-colors duration-300">
          𝕏
        </span>
      </motion.div>
    </motion.div>
  );
};

export default FloatingTwitterButton;