/**
 * Floating Pump.fun Button Component
 * 
 * @description A floating button that opens a new tab to Pump.fun for the given token.
 * 
 * @author BranchManager69
 * @version 2.0.0
 * @created 2025-05-12
 */

import { motion } from 'framer-motion';
import React from 'react';

interface FloatingPumpButtonProps {
  onClick?: () => void;
  tokenAddress?: string | null;
  tokenSymbol?: string | null;
  isCountdownComplete?: boolean;
  onPrematureClick?: () => void;
}

export const FloatingPumpButton: React.FC<FloatingPumpButtonProps> = ({ 
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
      console.log(`Token: ${tokenAddress}, linking to coin/${tokenAddress}`);
      window.open(`https://pump.fun/coin/${tokenAddress}`, '_blank');
    } else {
      console.log('(No token address provided, opening general site)');
      window.open('https://pump.fun/', '_blank');
    }
  };

  const buttonTitle = tokenAddress 
    ? `View ${tokenSymbol || 'token'} (${tokenAddress.substring(0,4)}...${tokenAddress.substring(tokenAddress.length - 4)}) on Pump.fun` 
    : "Pump.fun";

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
        className="w-14 h-14 md:w-16 md:h-16 bg-black/60 backdrop-blur-md border border-blue-500/50 rounded-full overflow-hidden relative shadow-lg transition-all duration-300"
        whileHover={{ 
          borderColor: 'rgba(59, 130, 246, 0.8)',
          boxShadow: '0 0 25px rgba(59, 130, 246, 0.6), 0 0 50px rgba(59, 130, 246, 0.3)'
        }}
        transition={{ duration: 0.3 }}
      >
        <img
          src="/assets/media/logos/pump.png"
          alt="Pump.fun Logo"
          className="w-full h-full object-contain p-2 md:p-2.5 transition-transform duration-300 group-hover:scale-110" 
        />
      </motion.div>
    </motion.div>
  );
};

export default FloatingPumpButton; 