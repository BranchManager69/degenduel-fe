// src/components/layout/FloatingBelieveButtonEnhanced.tsx

/**
 * Enhanced Floating Believe Button Component
 * 
 * @description Version optimized for use in FloatingButtonStack with enhanced animations
 * 
 * @author BranchManager69 & Claude
 * @version 3.0.0
 * @created 2025-05-25
 */

import { motion } from 'framer-motion';
import React from 'react';

interface FloatingBelieveButtonEnhancedProps {
  onClick?: () => void;
  tokenAddress?: string | null;
  tokenSymbol?: string | null; 
  isStacked?: boolean;
}

export const FloatingBelieveButtonEnhanced: React.FC<FloatingBelieveButtonEnhancedProps> = ({ 
  onClick, 
  tokenAddress, 
  tokenSymbol,
  isStacked = false 
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (tokenAddress) {
      console.log(`Linking to DegenDuel's Believe page.`);
      window.open(`https://believe.app/coin/${tokenAddress}`, '_blank');
    } else {
      console.log('(No token address provided, opening LaunchCoin\'s page on Believe)');
      const launchCoinAddress = 'Ey59PH7Z4BFU4HjyKnyMdWt5GGN76KazTAwQihoUXRnk';
      window.open(`https://believe.app/coin/${launchCoinAddress}`, '_blank');
    }
  };

  const buttonTitle = tokenAddress 
    ? `View ${tokenSymbol || 'token'} (${tokenAddress.substring(0,4)}...${tokenAddress.substring(tokenAddress.length - 4)}) on Believe` 
    : "Believe Aggregator";

  return (
    <motion.div
      className={isStacked ? "cursor-pointer group" : "fixed bottom-6 left-6 z-50 cursor-pointer group"}
      onClick={handleClick}
      title={buttonTitle}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {/* Believe Logo Container */}
      <motion.div
        className="w-14 h-14 md:w-16 md:h-16 bg-black/60 backdrop-blur-md border border-green-500/50 rounded-full overflow-hidden relative shadow-lg group-hover:shadow-green-500/40 transition-all duration-300"
        whileHover={{ 
          boxShadow: '0 0 25px rgba(16, 185, 129, 0.8)',
          borderColor: 'rgba(16, 185, 129, 0.8)'
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
      >
        {/* Enhanced animated gradient border effect */}
        <motion.div
          className="absolute inset-0 rounded-full opacity-60"
          animate={{
            background: [
              'conic-gradient(from 0deg, rgba(16,185,129,0.6), rgba(16,185,129,0.2), rgba(16,185,129,0.6))',
              'conic-gradient(from 120deg, rgba(16,185,129,0.6), rgba(16,185,129,0.2), rgba(16,185,129,0.6))',
              'conic-gradient(from 240deg, rgba(16,185,129,0.6), rgba(16,185,129,0.2), rgba(16,185,129,0.6))',
              'conic-gradient(from 360deg, rgba(16,185,129,0.6), rgba(16,185,129,0.2), rgba(16,185,129,0.6))'
            ]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'linear'
          }}
        />
        
        {/* Particle effect background */}
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{
            background: [
              'radial-gradient(circle at 20% 80%, rgba(16,185,129,0.3) 0%, transparent 50%)',
              'radial-gradient(circle at 80% 20%, rgba(16,185,129,0.3) 0%, transparent 50%)',
              'radial-gradient(circle at 40% 40%, rgba(16,185,129,0.3) 0%, transparent 50%)'
            ]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
        
        {/* Image with enhanced hover effects */}
        <motion.img
          src="/assets/media/logos/believe.png"
          alt="Believe Logo"
          className="w-full h-full object-contain p-2 md:p-2.5 relative z-10"
          whileHover={{ 
            scale: 1.1,
            filter: 'brightness(1.2) saturate(1.1)'
          }}
          transition={{ duration: 0.3 }}
        />
      </motion.div>
      
      {/* Enhanced tooltip with animation */}
      <motion.div
        className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-3 py-2 bg-black/90 backdrop-blur-md text-white text-xs rounded-lg shadow-xl border border-green-500/30"
        initial={{ opacity: 0, y: 10, scale: 0.8 }}
        whileHover={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.2 }}
        style={{ pointerEvents: 'none' }}
      >
        <span className="whitespace-nowrap font-medium">Believe Aggregator</span>
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-green-500/30"></div>
      </motion.div>
    </motion.div>
  );
};

export default FloatingBelieveButtonEnhanced;