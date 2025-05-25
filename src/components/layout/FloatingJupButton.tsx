// src/components/layout/FloatingJupButton.tsx

/**
 * Floating Jupiter Button Component
 * 
 * @description A floating button that opens a new tab to the Jupiter Aggregator website
 * 
 * @author BranchManager69
 * @version 3.0.0
 * @created 2025-05-11
 * @updated 2025-05-25
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
      window.open('https://jup.ag/', '_blank');
    }
  };

  const buttonTitle = tokenAddress 
    ? `View ${tokenSymbol || 'token'} (${tokenAddress.substring(0,4)}...${tokenAddress.substring(tokenAddress.length - 4)}) on Jupiter` 
    : "Jupiter Aggregator";

  return (
    <motion.div
      className="cursor-pointer group"
      onClick={handleClick}
      title={buttonTitle}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <motion.div
        className="w-14 h-14 md:w-16 md:h-16 bg-black/60 backdrop-blur-md border border-emerald-500/50 rounded-full overflow-hidden relative shadow-lg transition-all duration-300"
        whileHover={{ 
          borderColor: 'rgba(16, 185, 129, 0.8)',
          boxShadow: '0 0 25px rgba(16, 185, 129, 0.6), 0 0 50px rgba(16, 185, 129, 0.3)'
        }}
        transition={{ duration: 0.3 }}
      >
        <img
          src="/assets/media/logos/jup.png"
          alt="Jupiter Logo"
          className="w-full h-full object-contain p-2 md:p-2.5 transition-transform duration-300 group-hover:scale-110" 
        />
      </motion.div>
    </motion.div>
  );
};

export default FloatingJupButton; 