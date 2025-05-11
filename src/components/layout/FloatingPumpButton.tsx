/**
 * Floating Pump.fun Button Component
 * 
 * @description A floating button that opens a new tab to Pump.fun for the given token.
 * 
 * @author BranchManager69
 * @version 1.0.0
 * @created 2025-05-12
 */

import { motion } from 'framer-motion';
import React from 'react';

interface FloatingPumpButtonProps {
  onClick?: () => void;
  tokenAddress?: string | null;
  tokenSymbol?: string | null; 
}

export const FloatingPumpButton: React.FC<FloatingPumpButtonProps> = ({ onClick, tokenAddress, tokenSymbol }) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (tokenAddress) {
      console.log(`Pump.fun button clicked! Token: ${tokenAddress}, linking to coin/${tokenAddress}`);
      window.open(`https://pump.fun/coin/${tokenAddress}`, '_blank'); // Updated URL format
    } else {
      console.log('Pump.fun button clicked! (No token address provided, opening general site)');
      window.open('https://pump.fun/', '_blank'); // Fallback to general Pump.fun site
    }
  };

  const buttonTitle = tokenAddress 
    ? `View ${tokenSymbol || 'token'} (${tokenAddress.substring(0,4)}...${tokenAddress.substring(tokenAddress.length - 4)}) on Pump.fun` 
    : "Pump.fun";

  return (
    <motion.div
      key="floating-pump-button"
      initial={{ opacity: 0, scale: 0.8, x: -50 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.8, x: -50 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      // Adjusted positioning: bottom-24 (1.5rem default spacing * 4 heights + 3 gaps)
      // Jupiter is bottom-6 (1.5rem), each button is h-14 (3.5rem) + 1.5rem gap = 5rem or 20 tailwind units.
      // So, Jup: bottom-6. Pump: bottom-6 + 5rem (20) = bottom-26. Dex: bottom-26 + 5rem (20) = bottom-46
      // Using Tailwind arbitrary values for more precise spacing if needed or stick to multiples of 4/6.
      // For now, let's use more distinct spacing: Jup: bottom-6, Pump: bottom-24 (6rem), Dex: bottom-42 (10.5rem)
      className="fixed bottom-24 left-6 z-50 cursor-pointer group"
      onClick={handleClick}
      title={buttonTitle} 
    >
      <motion.div
        className="w-14 h-14 md:w-16 md:h-16 bg-black/60 backdrop-blur-md border border-blue-500/50 rounded-full overflow-hidden relative shadow-lg group-hover:shadow-blue-500/40 transition-all duration-300"
        whileHover={{ scale: 1.1, boxShadow: '0 0 20px rgba(59, 130, 246, 0.7)' }} // Example: Tailwind blue-500
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
      >
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{
            backgroundImage: [
              'linear-gradient(45deg, rgba(59,130,246,0.3) 0%, rgba(59,130,246,0.1) 50%, rgba(59,130,246,0.3) 100%)',
              'linear-gradient(45deg, rgba(59,130,246,0.1) 0%, rgba(59,130,246,0.3) 50%, rgba(59,130,246,0.1) 100%)',
              'linear-gradient(45deg, rgba(59,130,246,0.3) 0%, rgba(59,130,246,0.1) 50%, rgba(59,130,246,0.3) 100%)',
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
          src="/assets/media/logos/pump.png" // New logo
          alt="Pump.fun Logo"
          className="w-full h-full object-contain p-2 md:p-2.5 transition-transform duration-300 group-hover:scale-105" 
        />
      </motion.div>
    </motion.div>
  );
};

export default FloatingPumpButton; 