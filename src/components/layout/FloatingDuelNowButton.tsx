// src/components/layout/FloatingDuelNowButton.tsx

/**
 * Floating DUEL NOW Button Component - Footer Position
 * 
 * @description A floating DUEL NOW button positioned above the footer on landing page
 * 
 * @author BranchManager69 & Claude
 * @version 1.0.0
 * @created 2025-06-08
 */

import { motion } from 'framer-motion';
import React from 'react';
import { useNavigate } from 'react-router-dom';

interface FloatingDuelNowButtonProps {
  onClick?: () => void;
  enabled?: boolean;
}

export const FloatingDuelNowButton: React.FC<FloatingDuelNowButtonProps> = ({ 
  onClick, 
  enabled = true
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      console.log('Floating DUEL NOW button clicked! Navigating to contests...');
      navigate('/contests');
    }
  };

  if (!enabled) return null;

  return (
    <motion.div
      className="relative w-full flex justify-center mt-2 mb-4 px-4"
      initial={{ opacity: 0, y: 20, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 25,
        delay: 0.5
      }}
    >
      <motion.div
        className="cursor-pointer group w-full max-w-sm"
        onClick={handleClick}
        title="Start your trading duel now!"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        tabIndex={0}
      >
        <div className="relative clip-edges bg-gradient-to-r from-brand-500 to-brand-600 p-[2px] transition-all duration-300 group-hover:from-brand-400 group-hover:to-brand-500 shadow-lg shadow-brand-900/20 group-hover:animate-pulse-subtle">
          <div className="relative clip-edges bg-dark-200/40 backdrop-blur-sm px-4 sm:px-8 py-2 sm:py-3">
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
          
            {/* Button content */}
            <div className="relative flex items-center justify-between space-x-2 sm:space-x-4 text-lg sm:text-xl font-cyber">
              <span className="bg-gradient-to-r from-brand-300 to-brand-400 text-transparent bg-clip-text group-hover:from-white group-hover:to-brand-200">
                DUEL NOW
              </span>
              <svg
                className="w-5 h-5 sm:w-7 sm:h-7 text-brand-400 group-hover:text-white transform group-hover:translate-x-2 transition-all"
                fill="none" 
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default FloatingDuelNowButton;