/**
 * Floating Dexscreener Button Component
 * 
 * @description A floating button that opens a new tab to Dexscreener for the given token.
 * 
 * @author BranchManager69
 * @version 1.0.0
 * @created 2025-05-12
 */

import { motion } from 'framer-motion';
import React from 'react';

interface FloatingDexscreenerButtonProps {
  onClick?: () => void;
  tokenAddress?: string | null;
  tokenSymbol?: string | null; 
}

export const FloatingDexscreenerButton: React.FC<FloatingDexscreenerButtonProps> = ({ onClick, tokenAddress, tokenSymbol }) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (tokenAddress) {
      console.log(`Token: ${tokenAddress}, linking to solana/${tokenAddress}`);
      window.open(`https://dexscreener.com/solana/${tokenAddress}`, '_blank'); // Updated URL format
    } else {
      console.log('(No token address provided, opening general site)');
      window.open('https://dexscreener.com/solana', '_blank'); // Fallback to general Dexscreener Solana page
    }
  };

  const buttonTitle = tokenAddress 
    ? `View ${tokenSymbol || 'token'} (${tokenAddress.substring(0,4)}...${tokenAddress.substring(tokenAddress.length - 4)}) on Dexscreener` 
    : "Dexscreener";

  return (
    <motion.div
      key="floating-dexscreener-button"
      initial={{ opacity: 0, scale: 0.8, x: -50 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.8, x: -50 }}
      transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }} // Slight delay for staggered animation if shown together
      // Positioned above Pump button: bottom-42 (10.5rem)
      className="fixed bottom-42 left-6 z-50 cursor-pointer group"
      onClick={handleClick}
      title={buttonTitle} 
    >
      <motion.div
        className="w-14 h-14 md:w-16 md:h-16 bg-black/60 backdrop-blur-md border border-yellow-500/50 rounded-full overflow-hidden relative shadow-lg group-hover:shadow-yellow-500/40 transition-all duration-300"
        whileHover={{ scale: 1.1, boxShadow: '0 0 20px rgba(234, 179, 8, 0.7)' }} // Example: Tailwind yellow-500
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
      >
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{
            backgroundImage: [
              'linear-gradient(45deg, rgba(234,179,8,0.3) 0%, rgba(234,179,8,0.1) 50%, rgba(234,179,8,0.3) 100%)',
              'linear-gradient(45deg, rgba(234,179,8,0.1) 0%, rgba(234,179,8,0.3) 50%, rgba(234,179,8,0.1) 100%)',
              'linear-gradient(45deg, rgba(234,179,8,0.3) 0%, rgba(234,179,8,0.1) 50%, rgba(234,179,8,0.3) 100%)',
            ],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{ backgroundSize: '200% 200%' }}
        />
        <img
          src="/assets/media/logos/dexscreener.png" // New logo
          alt="Dexscreener Logo"
          className="w-full h-full object-contain p-2 md:p-2.5 transition-transform duration-300 group-hover:scale-105" 
        />
      </motion.div>
    </motion.div>
  );
};

export default FloatingDexscreenerButton; 