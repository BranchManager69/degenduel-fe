import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { FaWallet } from 'react-icons/fa';
import { Button } from '../ui/Button';
import { ConnectWalletButton } from './ConnectWalletButton';
import TwitterLoginButton from './TwitterLoginButton';
import PrivyLoginButton from './PrivyLoginButton';

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
 * - Privy (email/social) login
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

  return (
    <div className="relative">
      {/* Main login button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="primary"
        className={`relative min-w-[120px] ${compact ? 'py-1.5 px-3 text-sm' : 'py-2 px-4'} ${className}`}
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
                
                {/* Wallet Connection */}
                <ConnectWalletButton 
                  className="w-full justify-center" 
                  compact={false}
                  onClick={() => setIsOpen(false)}
                />
                
                {/* Twitter Login */}
                <TwitterLoginButton 
                  className="w-full justify-center" 
                  onClick={() => setIsOpen(false)}
                />
                
                {/* Privy Login */}
                <PrivyLoginButton 
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