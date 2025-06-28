// src/components/layout/FloatingTelegramButton.tsx

/**
 * Floating Telegram Button Component
 * 
 * @description A floating button that opens the DegenDuel Telegram group
 * 
 * @author Claude & BranchManager69
 * @version 1.0.0
 * @created 2025-06-27
 */

import { motion } from 'framer-motion';
import React from 'react';

interface FloatingTelegramButtonProps {
  onClick?: () => void;
  isCountdownComplete?: boolean;
  onPrematureClick?: () => void;
}

export const FloatingTelegramButton: React.FC<FloatingTelegramButtonProps> = ({ 
  onClick, 
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
    } else {
      console.log('Opening DegenDuel Telegram group');
      window.open('https://t.me/degenduel', '_blank');
    }
  };

  return (
    <motion.div
      className="cursor-pointer group"
      onClick={handleClick}
      title="Join DegenDuel Telegram"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      <motion.div
        className="w-10 h-10 md:w-12 md:h-12 backdrop-blur-md border-2 rounded-full overflow-hidden relative shadow-lg transition-all duration-300"
        style={{ 
          backgroundColor: '#0088cc',
          borderColor: '#005580' 
        }}
        whileHover={{ 
          backgroundColor: '#0088cc',
          borderColor: '#003d5c',
          boxShadow: '0 0 25px rgba(0, 136, 204, 0.6), 0 0 50px rgba(0, 136, 204, 0.3)'
        }}
        transition={{ duration: 0.3 }}
      >
        <img
          src="/assets/media/logos/telegram_logo.webp"
          alt="Telegram Logo"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" 
        />
      </motion.div>
    </motion.div>
  );
};

export default FloatingTelegramButton;