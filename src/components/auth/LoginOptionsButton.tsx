// src/components/auth/LoginOptionsButton.tsx

/**
 * LoginOptionsButton.tsx
 * 
 * @abstractdescription This file contains the LoginOptionsButton component, which is used to display the login options button.
 * 
 * @author BranchManager69
 * @version v1.9.0
 * @created 2025-04-02
 * @updated 2025-05-07
 */

// import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'; // REMOVED
import { AnimatePresence, motion } from 'framer-motion';
import React, { useState } from 'react';
import { FaWallet } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import TwitterLoginButton from './TwitterLoginButton';

interface LoginOptionsButtonProps {
  compact?: boolean;
  className?: string;
}

/**
 * Login Options Button Component
 * 
 * Displays a login button that expands to show all available login methods:
 * - Wallet connection
 * - Twitter login
 */
const LoginOptionsButton: React.FC<LoginOptionsButtonProps> = ({ 
  compact = false, 
  className = '' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  
  const handleOpenFullLogin = () => {
    navigate('/login');
    setIsOpen(false);
  };

  // Define classes based on the compact prop for WalletMultiButton
  // const walletButtonBaseClasses = "w-full justify-center !rounded-md font-cyber"; // Common classes
  // const walletButtonNormalClasses = "text-sm sm:text-base py-2 px-4 h-10 sm:h-12"; // Adjust height/padding as needed
  // const walletButtonCompactClasses = "text-xs sm:text-sm py-1 px-2 h-8 sm:h-10"; // Shorter, less padding

  return (
    <div className="relative">
      {/* Main login button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="primary"
        className={`relative min-w-[120px] ${compact ? 'py-1.5 px-3 text-xs' : 'py-2 px-4 text-sm'} ${className}`}
      >
        <span className="flex items-center justify-center gap-2">
          <FaWallet className="w-3.5 h-3.5" />
          {!compact && <span>Login</span>}
        </span>
      </Button>

      {/* Dropdown with login options */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop to capture clicks outside */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Login options dropdown */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 mt-2 w-56 bg-dark-200/95 border border-brand-500/30 rounded-md shadow-lg shadow-black/50 overflow-hidden z-50 backdrop-blur-xl"
            >
              <div className="p-3 space-y-2">
                <h3 className="text-sm font-medium text-gray-300 mb-1">Login Options</h3>
                
                {/* Wallet Connection - REMOVED WalletMultiButton */}
                {/* <WalletMultiButton 
                  className={`${walletButtonBaseClasses} ${compact ? walletButtonCompactClasses : walletButtonNormalClasses}`}
                /> */}
                
                {/* Twitter Login */}
                <TwitterLoginButton 
                  className="w-full justify-center" 
                  onClick={() => setIsOpen(false)}
                />
                
                
                <div className="pt-1 mt-1 border-t border-gray-700/50">
                  <button
                    onClick={handleOpenFullLogin}
                    className="w-full text-xs text-center text-gray-400 hover:text-white py-1 transition-colors"
                  >
                    View all options
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LoginOptionsButton;