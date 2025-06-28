// src/components/layout/FloatingBelieveButton.tsx

/**
 * Floating Believe Button Component
 * 
 * @description A floating button that opens a new tab to the Believe Aggregator website
 * 
 * @author BranchManager69
 * @version 3.0.0
 * @created 2025-05-25
 * @updated 2025-05-25
 */

import { motion } from 'framer-motion';
import React from 'react';

interface FloatingBelieveButtonProps {
  onClick?: () => void;
  tokenAddress?: string | null;
  tokenSymbol?: string | null;
  isCountdownComplete?: boolean;
  onPrematureClick?: () => void;
}

export const FloatingBelieveButton: React.FC<FloatingBelieveButtonProps> = ({ 
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
      console.log(`Linking to DegenDuel's Believe page.`);
      window.open(`https://believe.app/coin/${tokenAddress}`, '_blank');
    } else {
      console.log('(No token address provided, opening LaunchCoin\'s page on Believe)');
      const launchCoinAddress = 'Ey59PH7Z4BFU4HjyKnyMdWt5GGN76KazTAwQihoUXRnk';
      window.open(`https://believe.app/coin/${launchCoinAddress}`, '_blank'); // Fallback to LaunchCoin's page
    }
  };

  const buttonTitle = tokenAddress && typeof tokenAddress === 'string' && tokenAddress.length > 8
    ? `View ${tokenSymbol || 'token'} (${tokenAddress.substring(0,4)}...${tokenAddress.substring(tokenAddress.length - 4)}) on Believe` 
    : "Believe Aggregator";

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
        className="w-10 h-10 md:w-12 md:h-12 backdrop-blur-md border-2 rounded-full overflow-hidden relative shadow-lg transition-all duration-300"
        style={{ 
          backgroundColor: '#00D044',
          borderColor: '#008830' 
        }}
        whileHover={{ 
          backgroundColor: '#00D044',
          borderColor: '#006020',
          boxShadow: '0 0 25px rgba(0, 208, 68, 0.6), 0 0 50px rgba(0, 208, 68, 0.3)'
        }}
        transition={{ duration: 0.3 }}
      >
        <img
          src="/assets/media/logos/believe.png"
          alt="Believe Logo"
          className="w-full h-full object-contain p-2 md:p-2.5 transition-transform duration-300 group-hover:scale-110" 
        />
      </motion.div>
    </motion.div>
  );
};

export default FloatingBelieveButton; 