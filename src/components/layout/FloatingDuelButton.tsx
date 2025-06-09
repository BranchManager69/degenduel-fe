// src/components/layout/FloatingDuelButton.tsx

/**
 * Floating DUEL NOW Button Component
 * 
 * @description A floating button that navigates to contests page - shorter and more compact than the landing page CTA
 * 
 * @author BranchManager69 & Claude
 * @version 1.0.0
 * @created 2025-06-08
 */

import { motion } from 'framer-motion';
import React from 'react';
import { useNavigate } from 'react-router-dom';

interface FloatingDuelButtonProps {
  onClick?: () => void;
  isCountdownComplete?: boolean;
  onPrematureClick?: () => void;
}

export const FloatingDuelButton: React.FC<FloatingDuelButtonProps> = ({ 
  onClick, 
  isCountdownComplete = false,
  onPrematureClick 
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    // If countdown isn't complete, trigger jiggle animation instead of navigation
    if (!isCountdownComplete) {
      onPrematureClick?.();
      return;
    }

    if (onClick) {
      onClick();
    } else {
      console.log('DUEL NOW button clicked! Navigating to contests...');
      navigate('/contests');
    }
  };

  return (
    <motion.div
      className="cursor-pointer group"
      onClick={handleClick}
      title="Start your trading duel now!"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <motion.div
        className="px-6 py-3 bg-black/60 backdrop-blur-md border border-brand-500/50 rounded-full relative shadow-lg transition-all duration-300 min-w-[120px]"
        whileHover={{ 
          borderColor: 'rgba(153, 51, 255, 0.8)',
          boxShadow: '0 0 25px rgba(153, 51, 255, 0.6), 0 0 50px rgba(153, 51, 255, 0.3)'
        }}
        transition={{ duration: 0.3 }}
      >
        {/* Shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000 rounded-full" />
        
        {/* Button content */}
        <div className="relative flex items-center justify-center space-x-2">
          <span className="text-sm font-cyber font-bold bg-gradient-to-r from-brand-300 to-brand-400 text-transparent bg-clip-text group-hover:from-white group-hover:to-brand-200">
            DUEL NOW
          </span>
          <svg
            className="w-4 h-4 text-brand-400 group-hover:text-white transform group-hover:translate-x-1 transition-all"
            fill="none" 
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default FloatingDuelButton;