// src/components/layout/FloatingBelieveButton.tsx

/**
 * Floating Believe Button Component
 * 
 * @description A floating button that opens a new tab to the Believe Aggregator website
 * 
 * @author BranchManager69
 * @version 2.1.0
 * @created 2025-05-25
 * @updated 2025-05-25
 */

import { motion } from 'framer-motion';
import React from 'react';

interface FloatingBelieveButtonProps {
  onClick?: () => void;
  tokenAddress?: string | null;
  tokenSymbol?: string | null; 
}

export const FloatingBelieveButton: React.FC<FloatingBelieveButtonProps> = ({ onClick, tokenAddress, tokenSymbol }) => {
  const handleClick = () => {
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

  const buttonTitle = tokenAddress 
    ? `View ${tokenSymbol || 'token'} (${tokenAddress.substring(0,4)}...${tokenAddress.substring(tokenAddress.length - 4)}) on Believe` 
    : "Believe Aggregator";

  return (
    <motion.div
      key="floating-believe-button"
      initial={{ opacity: 0, scale: 0.8, x: -50 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.8, x: -50 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="fixed bottom-6 left-6 z-50 cursor-pointer group"
      onClick={handleClick}
      title={buttonTitle} 
    >
      {/* Believe Logo Container */}
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
          src="/assets/media/logos/believe.png" // Converted from JPG to PNG
          alt="Believe Logo"
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
        Believe Aggregator
      </motion.div>
      */}
    </motion.div>
  );
};

export default FloatingBelieveButton; 