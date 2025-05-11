import { motion } from 'framer-motion';
import React from 'react';

interface FloatingJupButtonProps {
  onClick?: () => void;
  tokenAddress?: string | null;
  tokenSymbol?: string | null; // Optional: For a more descriptive title
}

export const FloatingJupButton: React.FC<FloatingJupButtonProps> = ({ onClick, tokenAddress, tokenSymbol }) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (tokenAddress) {
      console.log(`Jupiter button clicked! Token: ${tokenAddress}`);
      window.open(`https://jup.ag/strict/token/${tokenAddress}`, '_blank');
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
    </motion.div>
  );
}; 