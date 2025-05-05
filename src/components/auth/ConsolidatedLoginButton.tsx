// src/components/auth/ConsolidatedLoginButton.tsx

/**
 * ConsolidatedLoginButton.tsx
 * 
 * A consolidated login button that expands to show all login options
 * Perfect for mobile interfaces where space is at a premium
 * 
 * @author @BranchManager69
 * @last-modified 2025-04-05
 */

import { AnimatePresence, motion } from 'framer-motion';
import React, { useState } from 'react';
import useBiometricAuth from '../../hooks/auth/legacy/useBiometricAuth';
import { Button } from '../ui/Button';
import BiometricAuthButton from './BiometricAuthButton';
import { ConnectWalletButton } from './ConnectWalletButton';
import PrivyLoginButton from './PrivyLoginButton';
import TwitterLoginButton from './TwitterLoginButton';

interface ConsolidatedLoginButtonProps {
  className?: string;
  onLoginComplete?: () => void;
}

/**
 * Consolidated Login Button Component
 * 
 * Shows a single "Sign In" button that expands to display all available login options
 * Much more space-efficient for mobile interfaces
 */
const ConsolidatedLoginButton: React.FC<ConsolidatedLoginButtonProps> = ({
  className = '',
  onLoginComplete
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { isAvailable, isRegistered } = useBiometricAuth();
  const [showBiometricOption, setShowBiometricOption] = useState(false);
  
  // Check if biometric auth is available and registered
  React.useEffect(() => {
    if (isAvailable && isRegistered) {
      setShowBiometricOption(true);
    }
  }, [isAvailable, isRegistered]);
  
  // Toggle expanded state
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };
  
  // Handle login completion
  const handleLoginClick = () => {
    if (onLoginComplete) {
      onLoginComplete();
    }
  };
  
  return (
    <div className={`relative ${className}`}>
      {/* Main login button */}
      <Button
        onClick={toggleExpanded}
        className="w-full py-3 text-base bg-gradient-to-r from-brand-500 to-purple-600 hover:from-brand-400 hover:to-purple-500 text-white font-cyber flex items-center justify-center"
        variant="gradient"
      >
        <svg
          className="w-5 h-5 mr-2"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
          <polyline points="10 17 15 12 10 7" />
          <line x1="15" y1="12" x2="3" y2="12" />
        </svg>
        {isExpanded ? "Choose a method" : "Sign In"}
        {isExpanded ? (
          <svg
            className="w-4 h-4 ml-2"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="18 15 12 9 6 15" />
          </svg>
        ) : (
          <svg
            className="w-4 h-4 ml-2"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        )}
      </Button>
      
      {/* Expandable login options */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="mt-2 overflow-hidden"
          >
            <div className="flex flex-col gap-2 p-2 bg-dark-400/60 backdrop-blur-sm border border-brand-500/30 rounded-md shadow-xl">
              {/* Each login method gets its own button */}
              <div className="relative p-0.5 bg-gradient-to-r from-brand-500/40 to-purple-600/80 rounded-md group overflow-hidden shadow-md">
                <div className="absolute inset-0 bg-dark-500/80 group-hover:bg-dark-500/60 transition-colors duration-300"></div>
                <ConnectWalletButton 
                  className="w-full h-12 z-10 relative bg-transparent hover:bg-transparent font-cyber"
                  compact={false}
                  onClick={handleLoginClick}
                />
              </div>
              
              <div className="relative p-0.5 bg-gradient-to-r from-[#1DA1F2]/40 to-[#1DA1F2]/80 rounded-md group overflow-hidden shadow-md">
                <div className="absolute inset-0 bg-dark-500/80 group-hover:bg-dark-500/60 transition-colors duration-300"></div>
                <TwitterLoginButton 
                  className="w-full h-12 z-10 relative" 
                  onClick={handleLoginClick} 
                />
              </div>
              
              <div className="relative p-0.5 bg-gradient-to-r from-purple-500/40 to-brand-500/80 rounded-md group overflow-hidden shadow-md">
                <div className="absolute inset-0 bg-dark-500/80 group-hover:bg-dark-500/60 transition-colors duration-300"></div>
                <PrivyLoginButton 
                  className="w-full h-12 z-10 relative" 
                  onClick={handleLoginClick} 
                />
              </div>
              
              {/* Biometric option - only shown if available and registered */}
              {showBiometricOption && (
                <div className="relative p-0.5 bg-gradient-to-r from-blue-500/40 to-blue-600/80 rounded-md group overflow-hidden shadow-md">
                  <div className="absolute inset-0 bg-dark-500/80 group-hover:bg-dark-500/60 transition-colors duration-300"></div>
                  <BiometricAuthButton 
                    mode="authenticate"
                    buttonStyle="minimal"
                    authenticatorType="platform"
                    className="w-full h-12 z-10 relative bg-transparent hover:bg-transparent"
                    onSuccess={handleLoginClick}
                    onError={(error) => console.error("Biometric auth error:", error)}
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ConsolidatedLoginButton;