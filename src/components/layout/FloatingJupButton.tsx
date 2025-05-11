// src/components/layout/FloatingJupButton.tsx

/**
 * Floating Jupiter Button Component
 * 
 * @description A floating button that opens a new tab to the Jupiter Aggregator website
 * 
 * @author BranchManager69
 * @version 2.1.0
 * @created 2025-05-11
 * @updated 2025-05-11
 */

import { motion } from 'framer-motion';
import React from 'react';

interface FloatingJupButtonProps {
  onClick?: () => void;
  tokenAddress?: string | null;
  tokenSymbol?: string | null; 
}

export const FloatingJupButton: React.FC<FloatingJupButtonProps> = ({ onClick, tokenAddress, tokenSymbol }) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (tokenAddress) {
      console.log(`Jupiter button clicked! Token: ${tokenAddress}, linking to swap SOL-${tokenAddress}`);
      window.open(`https://jup.ag/swap/SOL-${tokenAddress}`, '_blank');
    } else {
      console.log('Jupiter button clicked! (No token address provided, opening general site)');
      window.open('https://jup.ag/', '_blank'); // Fallback to general Jupiter site
    }
  };

  const buttonTitle = tokenAddress 
    ? `View ${tokenSymbol || 'token'} (${tokenAddress.substring(0,4)}...${tokenAddress.substring(tokenAddress.length - 4)}) on Jupiter` 
    : "Jupiter Aggregator";

  return (
    <motion.div
      key="floating-jup-button"
      initial={{ opacity: 0, scale: 0.8, x: -50 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.8, x: -50 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="fixed bottom-6 left-6 z-50 cursor-pointer group"
      onClick={handleClick}
      title={buttonTitle} 
    >
      {/* Jupiter Logo Container */}
      <motion.div
        className="w-14 h-14 md:w-16 md:h-16 bg-black/60 backdrop-blur-md border border-green-500/50 rounded-full overflow-hidden relative shadow-lg group-hover:shadow-green-500/40 transition-all duration-300"
        whileHover={{ scale: 1.1, boxShadow: '0 0 20px rgba(16, 185, 129, 0.7)' }} // Example: Tailwind green-500
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
      >
        {/* Subtle animated gradient border effect */}
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{
            backgroundImage: [
              'linear-gradient(45deg, rgba(16,185,129,0.3) 0%, rgba(16,185,129,0.1) 50%, rgba(16,185,129,0.3) 100%)',
              'linear-gradient(45deg, rgba(16,185,129,0.1) 0%, rgba(16,185,129,0.3) 50%, rgba(16,185,129,0.1) 100%)',
              'linear-gradient(45deg, rgba(16,185,129,0.3) 0%, rgba(16,185,129,0.1) 50%, rgba(16,185,129,0.3) 100%)',
            ],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{ backgroundSize: '200% 200%' }}
        />
        
        {/* Image */}
        <img
          src="/assets/media/logos/jup.webp" // Path relative to the public directory
          alt="Jupiter Logo"
          className="w-full h-full object-contain p-2 md:p-2.5 transition-transform duration-300 group-hover:scale-105" 
        />
      </motion.div>
      
      {/* Optional: Tooltip (could be a separate component or simple div) */}
      {/* 
      <motion.div
        className="absolute bottom-full left-0 mb-2 px-3 py-1.5 bg-black/80 text-white text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap"
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }} // This will be controlled by group-hover now
        style={{ pointerEvents: 'none' }}
      >
        Jupiter Aggregator
      </motion.div>
      */}
    </motion.div>
  );
};

export default FloatingJupButton; 