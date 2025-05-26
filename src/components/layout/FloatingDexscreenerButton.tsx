/**
 * Floating Dexscreener Button Component
 * 
 * @description A floating button that opens a new tab to Dexscreener for the given token.
 * 
 * @author BranchManager69
 * @version 2.0.0
 * @created 2025-05-12
 */

import { motion } from 'framer-motion';
import React from 'react';

interface FloatingDexscreenerButtonProps {
  onClick?: () => void;
  tokenAddress?: string | null;
  tokenSymbol?: string | null;
  isCountdownComplete?: boolean;
  onPrematureClick?: () => void;
}

export const FloatingDexscreenerButton: React.FC<FloatingDexscreenerButtonProps> = ({ 
  onClick, 
  tokenAddress, 
  tokenSymbol,
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
    } else if (tokenAddress) {
      console.log(`Token: ${tokenAddress}, linking to solana/${tokenAddress}`);
      window.open(`https://dexscreener.com/solana/${tokenAddress}`, '_blank');
    } else {
      console.log('(No token address provided, opening general site)');
      window.open('https://dexscreener.com/solana', '_blank');
    }
  };

  const buttonTitle = tokenAddress 
    ? `View ${tokenSymbol || 'token'} (${tokenAddress.substring(0,4)}...${tokenAddress.substring(tokenAddress.length - 4)}) on Dexscreener` 
    : "Dexscreener";

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
        className="w-14 h-14 md:w-16 md:h-16 bg-black/60 backdrop-blur-md border border-yellow-500/50 rounded-full overflow-hidden relative shadow-lg transition-all duration-300"
        whileHover={{ 
          borderColor: 'rgba(234, 179, 8, 0.8)',
          boxShadow: '0 0 25px rgba(234, 179, 8, 0.6), 0 0 50px rgba(234, 179, 8, 0.3)'
        }}
        transition={{ duration: 0.3 }}
      >
        <img
          src="/assets/media/logos/dexscreener.png"
          alt="Dexscreener Logo"
          className="w-full h-full object-contain p-2 md:p-2.5 transition-transform duration-300 group-hover:scale-110" 
        />
      </motion.div>
    </motion.div>
  );
};

export default FloatingDexscreenerButton; 